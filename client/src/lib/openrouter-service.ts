import axios from "axios";
import { ApiSettings } from "@/components/api-settings-modal";
import { apiRequest } from "@/lib/queryClient";
import { DApp } from "@/types/dapp";
import { performLangChainResearch, performSimpleLangChainResearch, DeepResearchOutput, ensureValidResearchOutput } from "./langchain-research";
import { performAgentResearch } from "./langchain-agent";

export interface ResearchRequest {
  dappName: string;
  dappDescription?: string;
  category?: string;
  chains?: string[];
}

export interface ResearchResponse {
  research: string;
  structured?: DeepResearchOutput;
}

/**
 * Perform research on a dApp using either client-side LangChain or server-side API
 */
export async function performResearch(
  request: ResearchRequest,
  apiSettings?: ApiSettings
): Promise<ResearchResponse> {
  try {
    // If API settings are provided, use client-side approach with LangChain
    if (apiSettings?.apiKey && apiSettings.baseUrl) {
      return performClientResearch(request, apiSettings);
    } else {
      // Otherwise use the server API (which may have its own API keys)
      return performServerResearch(request);
    }
  } catch (error) {
    console.error("Error performing research:", error);
    throw error;
  }
}

/**
 * Perform research using client-side LangChain implementation
 */
async function performClientResearch(
  request: ResearchRequest,
  apiSettings: ApiSettings
): Promise<ResearchResponse> {
  console.log("Performing client-side research with LangChain");
  
  try {
    // Convert request to DApp for LangChain
    const dapp: DApp = {
      id: request.dappName.toLowerCase().replace(/\s+/g, '-'),
      name: request.dappName,
      description: request.dappDescription,
      category: request.category,
      chains: request.chains,
    };
    
    // First, try the newer Agent-based Chain-of-Thought approach
    try {
      console.log("Attempting Chain-of-Thought Agent research");
      
      // Use the Agent-based implementation
      const agentResearch = await performAgentResearch(dapp, apiSettings);
      
      if (agentResearch && agentResearch.length > 0) {
        console.log("Agent-based research completed successfully");
        return { research: agentResearch };
      } else {
        console.log("Agent-based research returned empty results, falling back to structured output");
        throw new Error("Empty result from agent research");
      }
    } catch (agentError) {
      console.error("Agent-based research failed, falling back to structured output:", agentError);
      
      const errorMsg = agentError instanceof Error 
        ? agentError.message 
        : 'Unknown error with agent research';
        
      console.log(`Agent research error details: ${errorMsg}`);
      
      // Try structured output as fallback
      try {
        console.log("Attempting structured output with LangChain");
        const structuredOutput = await performLangChainResearch(dapp, apiSettings);
        
        // Format the structured output as text for compatibility
        const overviewSection = structuredOutput.overview || "No overview available.";
        
        const featuresSection = structuredOutput.features && structuredOutput.features.length > 0
          ? "## Key Features\n\n" + structuredOutput.features.map(f => `- ${f}`).join("\n")
          : "";
        
        const developmentsSection = structuredOutput.developments && structuredOutput.developments.length > 0
          ? "## Recent Developments\n\n" + structuredOutput.developments.map(d => `- **${d.date}**: ${d.description}`).join("\n")
          : "";
        
        const sentimentSection = structuredOutput.sentiment
          ? `## Community Sentiment\n\n${structuredOutput.sentiment.positive}% Positive${
              structuredOutput.sentiment.count ? ` (based on approximately ${structuredOutput.sentiment.count} mentions)` : ""
            }`
          : "";
        
        const competitorsSection = structuredOutput.competitors && structuredOutput.competitors.length > 0
          ? "## Competitors\n\n" + structuredOutput.competitors.map(c => `- ${c}`).join("\n")
          : "";
        
        const strengthsWeaknessesSection = 
          (structuredOutput.strengths && structuredOutput.strengths.length > 0) || 
          (structuredOutput.weaknesses && structuredOutput.weaknesses.length > 0)
            ? "## Strengths & Weaknesses\n\n" + 
              (structuredOutput.strengths && structuredOutput.strengths.length > 0 
                ? "### Strengths\n\n" + structuredOutput.strengths.map(s => `- ${s}`).join("\n") + "\n\n" 
                : "") +
              (structuredOutput.weaknesses && structuredOutput.weaknesses.length > 0 
                ? "### Weaknesses\n\n" + structuredOutput.weaknesses.map(w => `- ${w}`).join("\n") 
                : "")
            : "";
        
        const outlookSection = structuredOutput.futureOutlook
          ? `## Future Outlook\n\n${structuredOutput.futureOutlook}`
          : "";
        
        // Combine all sections
        const fullResearch = [
          "# Overview", 
          overviewSection, 
          featuresSection, 
          developmentsSection, 
          sentimentSection,
          competitorsSection,
          strengthsWeaknessesSection,
          outlookSection
        ].filter(Boolean).join("\n\n");
        
        return { 
          research: fullResearch,
          structured: structuredOutput
        };
      } catch (structuredError) {
        console.error("Structured output failed, falling back to text output:", structuredError);
        
        // Add more detailed error information
        const errorMsg = structuredError instanceof Error 
          ? structuredError.message 
          : 'Unknown error with structured output';
          
        console.log(`Structured output error details: ${errorMsg}`);
        
        // If structured output fails, fall back to simple text research
        const textResearch = await performSimpleLangChainResearch(dapp, apiSettings);
        return { research: textResearch };
      }
    }
  } catch (error) {
    console.error("Client-side LangChain research failed, falling back to direct API call:", error);
    
    // Add more detailed error information
    const errorMsg = error instanceof Error 
      ? error.message 
      : 'Unknown error with LangChain research';
      
    console.log(`LangChain error details: ${errorMsg}`);
    
    // If LangChain fails completely, try direct API call
    return performDirectApiResearch(request, apiSettings);
  }
}

/**
 * Fallback: Perform research directly using client-configured API keys (not using LangChain)
 */
async function performDirectApiResearch(
  request: ResearchRequest,
  apiSettings: ApiSettings
): Promise<ResearchResponse> {
  console.log("Falling back to direct API call for research");
  
  try {
    // Prepare the request to OpenAI compatible API
    const endpoint = `${apiSettings.baseUrl.endsWith('/') ? apiSettings.baseUrl : apiSettings.baseUrl + '/'}chat/completions`;
    
    const systemPrompt = createSystemPrompt(request);
    
    // Determine which model name to use
    let modelName = apiSettings.modelName;
    if (apiSettings.modelName === "custom" && apiSettings.customModelValue) {
      modelName = apiSettings.customModelValue;
    }
    
    // Check if it's a Gemini model
    const isGeminiModel = modelName.toLowerCase().includes('gemini');
    
    console.log(`Using model: ${modelName} with direct API call`);
    
    const response = await axios.post(endpoint, {
      model: modelName,
      messages: [
        {
          role: "system",
          content: systemPrompt
        },
        {
          role: "user",
          content: `Provide detailed research about the dApp called "${request.dappName}". Structure your response with clear sections including: 
          - Overview
          - Key Features (bullet points)
          - Recent Developments (with dates)
          - Community Sentiment (include percentage positive, if possible)
          
          ${request.dappDescription ? `Description: ${request.dappDescription}` : ""}`
        }
      ],
      temperature: 0.5,
      max_tokens: 1500,
    }, {
      headers: {
        "Authorization": `Bearer ${apiSettings.apiKey}`,
        "Content-Type": "application/json"
      }
    });
    
    console.log("Direct API response received:", Object.keys(response.data));
    
    // Carefully handle different potential response structures
    let researchContent = "No research results available";
    
    if (response.data.choices && response.data.choices.length > 0) {
      // Standard OpenAI-like response
      if (response.data.choices[0].message?.content) {
        researchContent = response.data.choices[0].message.content;
      } 
      // Alternative response structures
      else if (response.data.choices[0].text) {
        researchContent = response.data.choices[0].text;
      }
    }
    // Handle response formats from other providers
    else if (response.data.content) {
      researchContent = response.data.content;
    }
    else if (response.data.output) {
      researchContent = response.data.output;
    }
    else if (response.data.generations && response.data.generations.length > 0) {
      // Some providers might use this format
      researchContent = response.data.generations[0].text || response.data.generations[0].content || JSON.stringify(response.data.generations[0]);
    }
    
    // If we still have no content, provide a useful debug message
    if (researchContent === "No research results available") {
      console.log("Could not extract content from response. Response data:", JSON.stringify(response.data));
    }
    
    return { research: researchContent };
  } catch (error) {
    console.error("Error in direct API call:", error);
    
    // Get detailed error information
    let errorMessage = "API call failed with unknown error";
    
    if (error.response) {
      // The request was made and the server responded with a status code that falls out of the range of 2xx
      console.log("API error response:", error.response.data);
      console.log("API error status:", error.response.status);
      
      errorMessage = `API call failed with status ${error.response.status}: ${JSON.stringify(error.response.data)}`;
    } else if (error.request) {
      // The request was made but no response was received
      console.log("API error request:", error.request);
      errorMessage = "API call received no response. Check your network connection and API endpoint.";
    } else {
      // Something happened in setting up the request that triggered an Error
      console.log("API error message:", error.message);
      errorMessage = `API call setup error: ${error.message}`;
    }
    
    return { 
      research: `Error performing research: ${errorMessage}\n\nPlease check your API settings and try again.` 
    };
  }
}

/**
 * Perform research using the server-side API
 */
async function performServerResearch(request: ResearchRequest): Promise<ResearchResponse> {
  // This uses the server-side API which may have its own API keys with LangChain
  try {
    console.log("Using server-side API for research");
    const response = await apiRequest({
      method: "POST",
      url: "/api/research",
      data: request,
    });
    
    return response as ResearchResponse;
  } catch (error) {
    console.error("Server-side research error:", error);
    
    // Add more detailed error information
    const errorMsg = error instanceof Error 
      ? error.message 
      : 'Unknown error with server-side research';
      
    console.log(`Server API error details: ${errorMsg}`);
    
    throw new Error("Failed to perform research using server API. The server may not have API keys configured. Please try providing your own API key in the settings.");
  }
}

/**
 * Create a system prompt based on dApp information (for fallback direct API calls)
 */
function createSystemPrompt(input: ResearchRequest): string {
  let prompt = `You are a Web3 expert providing detailed research about dApps. 
  
Your task is to provide comprehensive information about "${input.dappName}".

Your response should be well-structured with the following sections:
1. Overview - A concise summary of what the dApp does and its significance in the ecosystem
2. Key Features - A bulleted list of the main capabilities and unique selling points
3. Recent Developments - Recent news, updates or milestones with dates (use format: Month Year: Description)
4. Community Sentiment - An assessment of how the community perceives the project, including a percentage of positive sentiment if you can estimate it
5. Competitors - Main competitors in the same space
6. Strengths & Weaknesses - Key advantages and potential concerns
7. Future Outlook - Potential future developments or challenges

If you don't have enough information about a specific section, you can indicate this briefly but still provide what you know.
`;

  if (input.category) {
    prompt += `\nThe dApp belongs to the ${input.category} category. Focus on aspects relevant to this domain.`;
  }

  if (input.chains && input.chains.length > 0) {
    prompt += `\nThe dApp operates on the following blockchains: ${input.chains.join(', ')}. Consider any chain-specific features or limitations.`;
  }

  prompt += `\nEnsure your response is factual and based on available information about the dApp. If you're uncertain about specific details, indicate this rather than making assumptions.`;

  return prompt;
}
