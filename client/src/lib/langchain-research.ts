import { ChatOpenAI } from "@langchain/openai";
import { HumanMessage, SystemMessage } from "@langchain/core/messages";
import { StructuredOutputParser } from "langchain/output_parsers";
import { PromptTemplate } from "@langchain/core/prompts";
import { ApiSettings } from "@/components/api-settings-modal";
import { DApp } from "@/types/dapp";
import { z } from "zod";

// Research schema for structured output 
const researchOutputSchema = z.object({
  overview: z.string().describe("Overall summary of what the dApp does and its significance"),
  features: z.array(z.string()).describe("List of key capabilities and unique features"),
  developments: z.array(z.object({
    date: z.string().describe("When this development occurred, e.g., 'June 2023'"),
    description: z.string().describe("What happened or changed in the dApp"),
  })).describe("Timeline of recent updates or changes to the dApp"),
  sentiment: z.object({
    positive: z.number().min(0).max(100).describe("Percentage of positive sentiment from 0-100"),
    count: z.number().optional().describe("Number of data points used for sentiment analysis"),
  }).describe("Community sentiment analysis"),
  competitors: z.array(z.string()).optional().describe("Main competitors in the same space"),
  strengths: z.array(z.string()).optional().describe("Key advantages of this dApp"),
  weaknesses: z.array(z.string()).optional().describe("Potential concerns or limitations"),
  futureOutlook: z.string().optional().describe("Potential future developments"),
});

// Type representing the structured output
export type DeepResearchOutput = z.infer<typeof researchOutputSchema>;

// Make sure the overview is never empty
export function ensureValidResearchOutput(data: Partial<DeepResearchOutput>): DeepResearchOutput {
  return {
    overview: data.overview || "情報が十分に得られませんでした。別のdAppを試すか、API設定を確認してください。",
    features: data.features || [],
    developments: data.developments || [],
    sentiment: data.sentiment || { positive: 50, count: undefined },
    competitors: data.competitors || [],
    strengths: data.strengths || [],
    weaknesses: data.weaknesses || [],
    futureOutlook: data.futureOutlook || "将来の見通しについての情報は限られています。"
  };
}

/**
 * Create a system prompt for the initial research
 */
function createSystemPrompt(dapp: DApp): string {
  const chainInfo = dapp.chains && dapp.chains.length > 0 
    ? `It operates on the following blockchains: ${dapp.chains.join(', ')}.`
    : '';
  
  const categoryInfo = dapp.category 
    ? `It belongs to the ${dapp.category} category.`
    : '';

  return `You are an expert Web3 researcher providing detailed analysis about "${dapp.name}" dApp. ${categoryInfo} ${chainInfo}

Your task is to analyze this dApp using a step-by-step approach to ensure accuracy and depth:

1. First, organize what you already know about this dApp.
2. Consider what information would be most valuable for a user trying to understand this dApp.
3. Think about how the dApp compares to others in its category.
4. Consider the recent developments and community sentiment around this dApp.

Your response should be well-researched and analytical. If you don't have specific information about certain aspects, acknowledge this gap rather than fabricating details.

${dapp.description ? `Here's a description of the dApp: ${dapp.description}` : ''}`;
}

/**
 * Perform a deep dApp research using chain-of-thought process with LangChain
 */
export async function performLangChainResearch(
  dapp: DApp, 
  apiSettings: ApiSettings
): Promise<DeepResearchOutput> {
  try {
    // Determine which model name to use
    let modelName = apiSettings.modelName;
    if (apiSettings.modelName === "custom" && apiSettings.customModelValue) {
      modelName = apiSettings.customModelValue;
    }

    console.log(`Starting LangChain research with model: ${modelName}`);

    // Create LangChain chat model with the appropriate settings
    const chat = new ChatOpenAI({
      openAIApiKey: apiSettings.apiKey,
      modelName: modelName,
      temperature: 0.7,
      maxTokens: 1500,
      timeout: 60000, // 60 seconds
      configuration: {
        baseURL: apiSettings.baseUrl.endsWith('/') 
          ? apiSettings.baseUrl.slice(0, -1) 
          : apiSettings.baseUrl,
      }
    });

    // Setup structured output parser
    const outputParser = StructuredOutputParser.fromZodSchema(researchOutputSchema);
    const format_instructions = outputParser.getFormatInstructions();

    // Create the step-by-step prompts for chain of thought research
    // Step 1: Initial Analysis
    const initialAnalysisPrompt = `
Analyze the Web3 dApp called "${dapp.name}". 
${dapp.description ? `Description: ${dapp.description}` : ''}
${dapp.category ? `Category: ${dapp.category}` : ''}
${dapp.chains ? `Blockchains: ${dapp.chains.join(', ')}` : ''}

Think about this step by step:
1. What is the core purpose of this dApp?
2. Who are the target users?
3. How does it utilize blockchain technology?
4. What problem does it solve?
5. How does it compare to traditional (non-blockchain) alternatives?

Provide your preliminary analysis:`;

    // Step 2: Feature Evaluation
    const featureEvaluationPrompt = `
Now examine the key features and capabilities of "${dapp.name}":
1. What are the main functionalities offered?
2. What makes it unique compared to competitors?
3. How user-friendly is the interface and experience?
4. What technical innovations does it implement?
5. Are there any limitations or constraints users should be aware of?

List and evaluate the key features:`;

    // Step 3: Market & Community Analysis
    const marketAnalysisPrompt = `
Analyze the market position and community sentiment for "${dapp.name}":
1. Who are the main competitors?
2. What is the general sentiment in the community (percentage positive)?
3. What recent developments or updates have occurred?
4. What future developments are planned or speculated?
5. What is the overall adoption trend for this dApp?

Provide your market and community analysis:`;

    // Step 4: Final Structured Output
    const finalOutputPrompt = `
Based on your analysis of "${dapp.name}", compile a comprehensive research report following this exact format:

${format_instructions}

Ensure your response is JSON-formatted according to the schema above.`;

    // Execute the chain of thought process
    console.log("Executing step 1: Initial Analysis");
    const initialAnalysisResponse = await chat.invoke([
      new SystemMessage(createSystemPrompt(dapp)),
      new HumanMessage(initialAnalysisPrompt)
    ]);

    console.log("Executing step 2: Feature Evaluation");
    const featureEvaluationResponse = await chat.invoke([
      new SystemMessage(createSystemPrompt(dapp)),
      new HumanMessage(initialAnalysisPrompt),
      new SystemMessage("You previously analyzed:"),
      new SystemMessage(initialAnalysisResponse.content),
      new HumanMessage(featureEvaluationPrompt)
    ]);

    console.log("Executing step 3: Market Analysis");
    const marketAnalysisResponse = await chat.invoke([
      new SystemMessage(createSystemPrompt(dapp)),
      new SystemMessage("You previously analyzed:"),
      new SystemMessage(initialAnalysisResponse.content),
      new SystemMessage("And evaluated features:"),
      new SystemMessage(featureEvaluationResponse.content),
      new HumanMessage(marketAnalysisPrompt)
    ]);

    console.log("Executing step 4: Final Structured Output");
    const finalOutputResponse = await chat.invoke([
      new SystemMessage("You are a JSON response formatter. Format all the previous analysis into a valid JSON structure according to the required schema."),
      new SystemMessage("Previous initial analysis:"),
      new SystemMessage(initialAnalysisResponse.content),
      new SystemMessage("Previous feature evaluation:"),
      new SystemMessage(featureEvaluationResponse.content),
      new SystemMessage("Previous market analysis:"),
      new SystemMessage(marketAnalysisResponse.content),
      new HumanMessage(finalOutputPrompt)
    ]);

    // Parse the final structured output
    try {
      const jsonString = finalOutputResponse.content;
      // Use regex to extract JSON if it's wrapped in backticks
      const jsonMatch = jsonString.match(/```(?:json)?([\s\S]*?)```|({[\s\S]*})/);
      const extractedJson = jsonMatch ? (jsonMatch[1] || jsonMatch[2]).trim() : jsonString;
      
      // Parse the JSON
      const parsedOutput = JSON.parse(extractedJson);
      console.log("Successfully parsed research output:", parsedOutput);
      
      return parsedOutput as DeepResearchOutput;
    } catch (parseError) {
      console.error("Failed to parse structured output:", parseError);
      console.log("Raw response:", finalOutputResponse.content);
      
      // Fallback: Create a minimal structured output with what we have
      return {
        overview: "Analysis parsing failed. Please try again or use a different model.",
        features: ["Unable to extract features due to parsing error"],
        developments: [{ 
          date: "Current", 
          description: "Unable to extract developments due to parsing error" 
        }],
        sentiment: {
          positive: 50, // Neutral as fallback
          count: 0
        }
      };
    }
  } catch (error) {
    console.error("Error in LangChain research:", error);
    throw error;
  }
}

/**
 * Perform a simpler dApp research for fallback or non-structured needs
 */
export async function performSimpleLangChainResearch(
  dapp: DApp,
  apiSettings: ApiSettings
): Promise<string> {
  try {
    // Determine which model name to use
    let modelName = apiSettings.modelName;
    if (apiSettings.modelName === "custom" && apiSettings.customModelValue) {
      modelName = apiSettings.customModelValue;
    }

    console.log(`Starting simple LangChain research with model: ${modelName}`);

    // Create LangChain chat model with the appropriate settings
    const chat = new ChatOpenAI({
      openAIApiKey: apiSettings.apiKey,
      modelName: modelName,
      temperature: 0.7,
      maxTokens: 1500,
      configuration: {
        baseURL: apiSettings.baseUrl.endsWith('/') 
          ? apiSettings.baseUrl.slice(0, -1) 
          : apiSettings.baseUrl,
      }
    });

    const researchPrompt = `
Provide detailed research about the dApp called "${dapp.name}". Structure your response with clear sections including:
- Overview
- Key Features (bullet points)
- Recent Developments (with dates)
- Community Sentiment (include percentage positive, if possible)

${dapp.description ? `Description: ${dapp.description}` : ""}
${dapp.category ? `Category: ${dapp.category}` : ""}
${dapp.chains ? `Blockchains: ${dapp.chains.join(', ')}` : ""}
`;

    const response = await chat.invoke([
      new SystemMessage(createSystemPrompt(dapp)),
      new HumanMessage(researchPrompt)
    ]);

    return response.content as string;
  } catch (error) {
    console.error("Error in simple LangChain research:", error);
    throw error;
  }
}