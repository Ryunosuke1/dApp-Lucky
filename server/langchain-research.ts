import { ChatOpenAI } from "@langchain/openai";
import { HumanMessage, SystemMessage } from "@langchain/core/messages";
import { StructuredOutputParser } from "langchain/output_parsers";
import { PromptTemplate } from "@langchain/core/prompts";
import { z } from "zod";
import { getApiKey, ApiProvider } from "./api-keys";
import { ApiSettings, ResearchInput } from "./deep-research";

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

/**
 * Create a system prompt for the initial research
 */
function createSystemPrompt(input: ResearchInput): string {
  const chainInfo = input.chains && input.chains.length > 0 
    ? `It operates on the following blockchains: ${input.chains.join(', ')}.`
    : '';
  
  const categoryInfo = input.category 
    ? `It belongs to the ${input.category} category.`
    : '';

  return `You are an expert Web3 researcher providing detailed analysis about "${input.dappName}" dApp. ${categoryInfo} ${chainInfo}

Your task is to analyze this dApp using a step-by-step approach to ensure accuracy and depth:

1. First, organize what you already know about this dApp.
2. Consider what information would be most valuable for a user trying to understand this dApp.
3. Think about how the dApp compares to others in its category.
4. Consider the recent developments and community sentiment around this dApp.

Your response should be well-researched and analytical. If you don't have specific information about certain aspects, acknowledge this gap rather than fabricating details.

${input.dappDescription ? `Here's a description of the dApp: ${input.dappDescription}` : ''}`;
}

/**
 * Perform a full chain-of-thought research on a dApp using LangChain
 */
export async function performLangChainResearch(
  input: ResearchInput,
  apiSettings?: ApiSettings
): Promise<string> {
  try {
    // If no API settings provided, use server API keys
    if (!apiSettings) {
      const apiKey = getApiKey(ApiProvider.OPENAI) || getApiKey(ApiProvider.OPENROUTER);
      
      if (!apiKey) {
        throw new Error('No API key available for research');
      }
      
      // Use default settings with server API key
      apiSettings = {
        baseUrl: getApiKey(ApiProvider.OPENROUTER) 
          ? 'https://openrouter.ai/api/v1' 
          : 'https://api.openai.com/v1',
        apiKey,
        modelName: 'gpt-4o',
      };
    }

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
Analyze the Web3 dApp called "${input.dappName}". 
${input.dappDescription ? `Description: ${input.dappDescription}` : ''}
${input.category ? `Category: ${input.category}` : ''}
${input.chains ? `Blockchains: ${input.chains.join(', ')}` : ''}

Think about this step by step:
1. What is the core purpose of this dApp?
2. Who are the target users?
3. How does it utilize blockchain technology?
4. What problem does it solve?
5. How does it compare to traditional (non-blockchain) alternatives?

Provide your preliminary analysis:`;

    // Step 2: Feature Evaluation
    const featureEvaluationPrompt = `
Now examine the key features and capabilities of "${input.dappName}":
1. What are the main functionalities offered?
2. What makes it unique compared to competitors?
3. How user-friendly is the interface and experience?
4. What technical innovations does it implement?
5. Are there any limitations or constraints users should be aware of?

List and evaluate the key features:`;

    // Step 3: Market & Community Analysis
    const marketAnalysisPrompt = `
Analyze the market position and community sentiment for "${input.dappName}":
1. Who are the main competitors?
2. What is the general sentiment in the community (percentage positive)?
3. What recent developments or updates have occurred?
4. What future developments are planned or speculated?
5. What is the overall adoption trend for this dApp?

Provide your market and community analysis:`;

    // Step 4: Final Structured Output
    const finalOutputPrompt = `
Based on your analysis of "${input.dappName}", compile a comprehensive research report with the following sections:

1. Overview - A concise summary of what the dApp does and its significance
2. Key Features - A bulleted list of the main capabilities and unique features
3. Recent Developments - Recent news, updates or milestones with dates
4. Community Sentiment - An assessment of how the community perceives the project, including a percentage of positive sentiment
5. Competitors - Main competitors in the same space
6. Strengths & Weaknesses - Key advantages and potential concerns
7. Future Outlook - Potential future developments or challenges

FORMAT YOUR RESPONSE WITH CLEAR SECTION HEADERS AND USE BULLET POINTS WHERE APPROPRIATE.`;

    // Execute the chain of thought process
    console.log("Executing step 1: Initial Analysis");
    const initialAnalysisResponse = await chat.invoke([
      new SystemMessage(createSystemPrompt(input)),
      new HumanMessage(initialAnalysisPrompt)
    ]);

    console.log("Executing step 2: Feature Evaluation");
    const featureEvaluationResponse = await chat.invoke([
      new SystemMessage(createSystemPrompt(input)),
      new HumanMessage(initialAnalysisPrompt),
      new SystemMessage("You previously analyzed:"),
      new SystemMessage(initialAnalysisResponse.content),
      new HumanMessage(featureEvaluationPrompt)
    ]);

    console.log("Executing step 3: Market Analysis");
    const marketAnalysisResponse = await chat.invoke([
      new SystemMessage(createSystemPrompt(input)),
      new SystemMessage("You previously analyzed:"),
      new SystemMessage(initialAnalysisResponse.content),
      new SystemMessage("And evaluated features:"),
      new SystemMessage(featureEvaluationResponse.content),
      new HumanMessage(marketAnalysisPrompt)
    ]);

    // First try to get structured JSON output
    try {
      console.log("Executing step 4a: Structured JSON Output");
      const structuredOutputPrompt = `
      Based on your analysis of "${input.dappName}", compile a comprehensive research report following this exact format:
      
      ${format_instructions}
      
      Ensure your response is JSON-formatted according to the schema above.`;
      
      const structuredResponse = await chat.invoke([
        new SystemMessage("You are a JSON response formatter. Format all the previous analysis into a valid JSON structure according to the required schema."),
        new SystemMessage("Previous initial analysis:"),
        new SystemMessage(initialAnalysisResponse.content),
        new SystemMessage("Previous feature evaluation:"),
        new SystemMessage(featureEvaluationResponse.content),
        new SystemMessage("Previous market analysis:"),
        new SystemMessage(marketAnalysisResponse.content),
        new HumanMessage(structuredOutputPrompt)
      ]);
      
      // Parse the JSON response
      try {
        const jsonString = structuredResponse.content;
        // Use regex to extract JSON if it's wrapped in backticks
        const jsonMatch = jsonString.match(/```(?:json)?([\s\S]*?)```|({[\s\S]*})/);
        const extractedJson = jsonMatch ? (jsonMatch[1] || jsonMatch[2]).trim() : jsonString;
        
        // Parse the JSON
        const parsedOutput = JSON.parse(extractedJson);
        console.log("Successfully parsed structured output");
        
        // For text output, also get a formatted text version for display
        console.log("Executing step 4b: Formatted Text Report");
        const finalOutputResponse = await chat.invoke([
          new SystemMessage("You are a comprehensive Web3 analyst. Format all the previous analysis into a well-structured research report."),
          new SystemMessage("Previous initial analysis:"),
          new SystemMessage(initialAnalysisResponse.content),
          new SystemMessage("Previous feature evaluation:"),
          new SystemMessage(featureEvaluationResponse.content),
          new SystemMessage("Previous market analysis:"),
          new SystemMessage(marketAnalysisResponse.content),
          new HumanMessage(finalOutputPrompt)
        ]);
        
        // Return both the structured and text formats
        return {
          structured: parsedOutput,
          text: finalOutputResponse.content as string
        };
      } catch (parseError) {
        console.error("Failed to parse structured output, falling back to text:", parseError);
      }
    } catch (structuredError) {
      console.error("Failed to generate structured output, falling back to text:", structuredError);
    }
    
    // Fallback to text-only output
    console.log("Executing step 4: Final Text Report");
    const finalOutputResponse = await chat.invoke([
      new SystemMessage("You are a comprehensive Web3 analyst. Format all the previous analysis into a well-structured research report."),
      new SystemMessage("Previous initial analysis:"),
      new SystemMessage(initialAnalysisResponse.content),
      new SystemMessage("Previous feature evaluation:"),
      new SystemMessage(featureEvaluationResponse.content),
      new SystemMessage("Previous market analysis:"),
      new SystemMessage(marketAnalysisResponse.content),
      new HumanMessage(finalOutputPrompt)
    ]);

    return {
      text: finalOutputResponse.content as string
    };
  } catch (error) {
    console.error("Error in LangChain research:", error);
    throw error;
  }
}