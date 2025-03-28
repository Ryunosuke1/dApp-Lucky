import axios from "axios";
import { ApiSettings } from "@/components/api-settings-modal";
import { apiRequest } from "@/lib/queryClient";

interface ResearchRequest {
  dappName: string;
  dappDescription?: string;
  category?: string;
  chains?: string[];
}

interface ResearchResponse {
  research: string;
}

/**
 * Perform research on a dApp using either client-side API settings or server-side API
 */
export async function performResearch(
  request: ResearchRequest,
  apiSettings?: ApiSettings
): Promise<ResearchResponse> {
  try {
    // If API settings are provided, use client-side approach
    if (apiSettings?.apiKey && apiSettings.baseUrl) {
      return performDirectResearch(request, apiSettings);
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
 * Perform research directly using client-configured API keys
 */
async function performDirectResearch(
  request: ResearchRequest,
  apiSettings: ApiSettings
): Promise<ResearchResponse> {
  // Prepare the request to OpenAI compatible API
  const endpoint = `${apiSettings.baseUrl.endsWith('/') ? apiSettings.baseUrl : apiSettings.baseUrl + '/'}chat/completions`;
  
  const systemPrompt = createSystemPrompt(request);
  
  const response = await axios.post(endpoint, {
    model: apiSettings.modelName,
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

  // Extract the research content from the response
  const researchContent = response.data.choices[0]?.message?.content || "No research results available";
  
  return { research: researchContent };
}

/**
 * Perform research using the server-side API
 */
async function performServerResearch(request: ResearchRequest): Promise<ResearchResponse> {
  // This uses the server-side API which may have its own API keys
  try {
    const response = await apiRequest({
      method: "POST",
      url: "/api/research",
      data: request,
    });
    
    return response as ResearchResponse;
  } catch (error) {
    console.error("Server-side research error:", error);
    throw new Error("Failed to perform research using server API. Please configure client-side API settings or try again later.");
  }
}

/**
 * Create a system prompt based on dApp information
 */
function createSystemPrompt(input: ResearchRequest): string {
  let prompt = `You are a Web3 expert providing detailed research about dApps. 
  
Your task is to provide comprehensive information about "${input.dappName}".

Your response should be well-structured with the following sections:
1. Overview - A concise summary of what the dApp does and its significance in the ecosystem
2. Key Features - A bulleted list of the main capabilities and unique selling points
3. Recent Developments - Recent news, updates or milestones with dates (use format: Month Year: Description)
4. Community Sentiment - An assessment of how the community perceives the project, including a percentage of positive sentiment if you can estimate it

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
