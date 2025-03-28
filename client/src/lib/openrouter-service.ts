import axios from "axios";

interface ResearchRequest {
  dappName: string;
  dappDescription?: string;
}

interface ResearchResponse {
  research: string;
}

export async function performResearch(
  request: ResearchRequest
): Promise<ResearchResponse> {
  try {
    const response = await axios.post("/api/research", request);
    return response.data;
  } catch (error) {
    console.error("Error performing research:", error);
    throw error;
  }
}
