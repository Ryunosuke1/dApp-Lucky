import { ChatOpenAI } from "@langchain/openai";
import { ApiSettings } from "@/components/api-settings-modal";
import { DApp } from "@/types/dapp";
import { z } from "zod";
import { HumanMessage, SystemMessage } from "@langchain/core/messages";
import { ChatPromptTemplate } from "@langchain/core/prompts";
import { StructuredOutputParser } from "@langchain/core/output_parsers";

// Define the research output schema
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

// Type for the structured output
export type DeepResearchOutput = z.infer<typeof researchOutputSchema>;

/**
 * Ensure valid research output by filling in defaults for missing values
 */
export function ensureValidResearchOutput(data: Partial<DeepResearchOutput>): DeepResearchOutput {
  return {
    overview: data.overview || "No overview available.",
    features: data.features || ["Information not available"],
    developments: data.developments || [{ date: "Current", description: "No recent developments information available." }],
    sentiment: data.sentiment || { positive: 50 },
    competitors: data.competitors || [],
    strengths: data.strengths || [],
    weaknesses: data.weaknesses || [],
    futureOutlook: data.futureOutlook || ""
  };
}

/**
 * Create a system prompt for research
 */
function createSystemPrompt(dapp: DApp): string {
  return `You are a Web3 dApp research expert tasked with analyzing "${dapp.name}".

Available context:
${dapp.description ? `Description: ${dapp.description}` : 'No description available'}
${dapp.category ? `Category: ${dapp.category}` : ''}
${dapp.chains ? `Blockchains: ${dapp.chains.join(', ')}` : ''}

Your task is to create a comprehensive research report on this dApp. The report should include:
1. Overview: What the dApp does and its significance in the blockchain ecosystem
2. Key Features: A list of the main capabilities and unique aspects (at least 3-5 features)
3. Recent Developments: Timeline of updates with approximate dates (at least 2-3 developments)
4. Community Sentiment: Estimate the percentage of positive sentiment and approximate engagement metrics
5. Competitors: Key alternatives in the same space (2-3 competitors if applicable)
6. Strengths & Weaknesses: Main advantages and potential concerns
7. Future Outlook: Potential developments and trajectory

IMPORTANT: 
- Base your analysis on factual information about the dApp
- If certain details aren't available, make educated assessments based on similar dApps
- Your output must be structured according to the specified JSON schema
- Include a disclaimer: "This analysis represents a best effort assessment based on available information"
- Format dates as Month Year (e.g. "January 2024")`;
}

/**
 * Perform research on a dApp using LangChain's structured output features
 */
export async function performStructuredResearch(
  dapp: DApp,
  apiSettings: ApiSettings
): Promise<DeepResearchOutput> {
  try {
    // Determine which model name to use
    let modelName = apiSettings.modelName;
    if (apiSettings.modelName === "custom" && apiSettings.customModelValue) {
      modelName = apiSettings.customModelValue;
    }

    // Detect model compatibility
    const isGeminiModel = modelName.toLowerCase().includes('gemini');
    const isNonOpenAIModel = !modelName.includes('gpt') && 
                            !modelName.includes('claude') && 
                            !modelName.includes('mixtral');
    
    if (isGeminiModel) {
      console.log(`Warning: Using Gemini model (${modelName}). These models may have compatibility issues with structured output.`);
    } else if (isNonOpenAIModel) {
      console.log(`Warning: Using non-standard model (${modelName}). This may have compatibility issues.`);
    }

    console.log(`Starting structured research with model: ${modelName}`);

    // Create LangChain chat model with the appropriate settings
    const model = new ChatOpenAI({
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

    // Create the structured output format
    const outputParser = StructuredOutputParser.fromZodSchema(researchOutputSchema);
    
    // Setup the prompt with system instructions and format requirements
    const prompt = ChatPromptTemplate.fromMessages([
      ["system", `${createSystemPrompt(dapp)}\n\n${outputParser.getFormatInstructions()}`],
      ["human", `Please provide a detailed research analysis on ${dapp.name}. Ensure your output follows the required JSON schema.`]
    ]);
    
    console.log("Executing structured research...");
    
    // Use the modern OpenAI function calling approach for structured outputs
    const isGPTModel = modelName.toLowerCase().includes('gpt');
    
    let structuredResult;
    
    if (isGPTModel) {
      // For OpenAI GPT models, we can use the structured output capability directly
      try {
        // Get model with response_format: { type: "json_object" }
        const jsonModel = model.bind({
          response_format: { type: "json_object" }
        });
        
        // Format messages and call the model
        const chain = prompt.pipe(jsonModel);
        const response = await chain.invoke({});
        
        // Parse the response directly as JSON
        structuredResult = JSON.parse(response.content as string);
        console.log("Structured research completed successfully (GPT JSON mode)");
      } catch (error) {
        console.error("Error using GPT JSON mode:", error);
        // Fall back to using the parser approach
        structuredResult = await fallbackStructuredOutput(model, prompt, outputParser, dapp);
      }
    } else {
      // For non-GPT models, use the parser approach
      structuredResult = await fallbackStructuredOutput(model, prompt, outputParser, dapp);
    }
    
    // Process and return the result
    const result = structuredResult;

    return ensureValidResearchOutput(result);
  } catch (error) {
    console.error("Error in structured research:", error);
    const errorMessage = error instanceof Error ? error.message : String(error);
    console.log(`Structured research error details: ${errorMessage}`);
    
    // Return a minimal valid structure on error
    return {
      overview: `Unable to complete research due to an error: ${errorMessage}. Please try again or use a different model.`,
      features: ["Error occurred during analysis"],
      developments: [{ date: "Current", description: "Error during data processing" }],
      sentiment: { positive: 50 },
      competitors: [],
      strengths: [],
      weaknesses: [],
      futureOutlook: ""
    };
  }
}

/**
 * Fallback method for structured output when direct JSON output fails
 */
async function fallbackStructuredOutput(
  model: ChatOpenAI,
  prompt: ChatPromptTemplate,
  outputParser: StructuredOutputParser<any>,
  dapp: DApp
): Promise<any> {
  console.log("Using fallback structured output method");
  
  try {
    // Format messages and call the model
    const chain = prompt.pipe(model);
    const response = await chain.invoke({});
    
    // Extract content as string
    const content = response.content as string;
    
    // Try to parse JSON from the response
    try {
      // First, check if there's JSON in code blocks
      const jsonMatch = content.match(/```(?:json)?([\s\S]*?)```|({[\s\S]*})/);
      if (jsonMatch) {
        const extractedJson = (jsonMatch[1] || jsonMatch[2]).trim();
        const parsed = JSON.parse(extractedJson);
        console.log("Structured research completed successfully (code block parser)");
        return parsed;
      }
      
      // Try direct parsing
      const parsed = JSON.parse(content);
      console.log("Structured research completed successfully (direct parser)");
      return parsed;
    } catch (parseError) {
      console.error("Error parsing structured output:", parseError);
      
      // Last resort: Try to use the output parser directly
      try {
        const parsed = await outputParser.parse(content);
        console.log("Structured research completed successfully (output parser)");
        return parsed;
      } catch (outputParserError) {
        console.error("Output parser error:", outputParserError);
        
        // Return a simplified fallback object with just the overview
        return {
          overview: content.slice(0, 500) + "... (truncated)",
          features: ["Parsing failed - see overview for details"],
          developments: [{ date: "Current", description: "Unable to parse structured data" }],
          sentiment: { positive: 50 }
        };
      }
    }
  } catch (error) {
    console.error("Error in fallback structured output:", error);
    throw error;
  }
}

/**
 * Perform a simpler text-based research when structured output fails
 */
export async function performSimpleTextResearch(
  dapp: DApp,
  apiSettings: ApiSettings
): Promise<string> {
  try {
    // Determine which model name to use
    let modelName = apiSettings.modelName;
    if (apiSettings.modelName === "custom" && apiSettings.customModelValue) {
      modelName = apiSettings.customModelValue;
    }

    console.log(`Starting simple text research with model: ${modelName}`);

    // Create LangChain chat model with the appropriate settings
    const model = new ChatOpenAI({
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

    const systemPrompt = createSystemPrompt(dapp);
    const userPrompt = `Please provide a detailed text-based research report on ${dapp.name}. Format your response in Markdown with clear headings for each section (Overview, Features, Recent Developments, etc.).`;

    const response = await model.invoke([
      new SystemMessage(systemPrompt),
      new HumanMessage(userPrompt)
    ]);

    return response.content as string;
  } catch (error) {
    console.error("Error in simple text research:", error);
    const errorMessage = error instanceof Error ? error.message : String(error);
    
    return `Error performing research: ${errorMessage}. Please try again or use a different model.`;
  }
}