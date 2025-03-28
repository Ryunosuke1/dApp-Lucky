import axios from "axios";
import { ApiSettings } from "@/components/api-settings-modal";

interface ResearchRequest {
  dappName: string;
  dappDescription?: string;
}

interface ResearchResponse {
  research: string;
}

export async function performResearch(
  request: ResearchRequest,
  apiSettings: ApiSettings
): Promise<ResearchResponse> {
  try {
    // Check if API settings are configured
    if (!apiSettings.apiKey || !apiSettings.baseUrl) {
      throw new Error("API settings are not configured");
    }

    // Prepare the request to OpenAI compatible API
    const endpoint = `${apiSettings.baseUrl.endsWith('/') ? apiSettings.baseUrl : apiSettings.baseUrl + '/'}chat/completions`;
    
    const response = await axios.post(endpoint, {
      model: apiSettings.modelName,
      messages: [
        {
          role: "system",
          content: "You are a Web3 expert providing detailed research about dApps. Provide structured information including overview, key features, recent developments, and community sentiment."
        },
        {
          role: "user",
          content: `Provide deep research about the dApp called "${request.dappName}". ${request.dappDescription ? `Description: ${request.dappDescription}` : ""}`
        }
      ]
    }, {
      headers: {
        "Authorization": `Bearer ${apiSettings.apiKey}`,
        "Content-Type": "application/json"
      }
    });

    // Extract the research content from the response
    const researchContent = response.data.choices[0]?.message?.content || "No research results available";
    
    return { research: researchContent };
  } catch (error) {
    console.error("Error performing research:", error);
    throw error;
  }
}
