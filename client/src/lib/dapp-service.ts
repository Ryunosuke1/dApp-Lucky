import axios from "axios";
import { DApp } from "@/types/dapp";

// Fetch a random dApp from the API
export async function fetchRandomDApp(category?: string | null): Promise<DApp> {
  try {
    const response = await axios.get("/api/dapps/random", {
      params: {
        category,
      },
    });
    return response.data;
  } catch (error) {
    console.error("Error fetching random dApp:", error);
    throw error;
  }
}

// Fetch trending dApps
export async function fetchTrendingDApps(): Promise<DApp[]> {
  try {
    // In a real implementation, this would call an API endpoint
    // This is a placeholder for demonstration
    const mockTrendingDApps: DApp[] = [
      {
        id: "uniswap",
        name: "Uniswap",
        category: "DeFi",
        subcategory: "Exchange",
        description: "Decentralized trading protocol",
        website: "https://uniswap.org",
        image: "https://uniswap.org/images/twitter-card.jpg",
      },
      {
        id: "opensea",
        name: "OpenSea",
        category: "NFT",
        subcategory: "Marketplace",
        description: "NFT marketplace",
        website: "https://opensea.io",
        image: "https://opensea.io/static/images/opensea-logotype.png",
      },
      {
        id: "aave",
        name: "Aave",
        category: "DeFi",
        subcategory: "Lending",
        description: "Decentralized lending protocol",
        website: "https://aave.com",
        image: "https://aave.com/aave-press-kit/aave-press-kit/images/aave-logo.jpg",
      },
    ];
    
    return mockTrendingDApps;
  } catch (error) {
    console.error("Error fetching trending dApps:", error);
    throw error;
  }
}
