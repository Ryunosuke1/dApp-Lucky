import type { Express, Request, Response } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { insertExperienceSchema, insertFavoriteSchema } from "@shared/schema";
import { ZodError } from "zod";
import { fromZodError } from "zod-validation-error";
import { defiLlamaApi } from "./defillama-api";
import { performResearch, ApiSettings } from "./deep-research";
import { hasApiKey, ApiProvider, getApiKey } from "./api-keys";

export async function registerRoutes(app: Express): Promise<Server> {
  // prefix all routes with /api
  
  // User management with wallet
  app.post("/api/wallet/connect", async (req: Request, res: Response) => {
    try {
      const { walletAddress } = req.body;
      
      if (!walletAddress) {
        return res.status(400).json({ message: "walletAddress is required" });
      }
      
      const user = await storage.getOrCreateUserByWallet(walletAddress);
      res.json(user);
    } catch (error) {
      console.error("Error connecting wallet:", error);
      res.status(500).json({ message: "Failed to connect wallet" });
    }
  });
  
  // Get or update user API settings
  app.get("/api/users/:walletAddress/api-settings", async (req: Request, res: Response) => {
    try {
      const { walletAddress } = req.params;
      const user = await storage.getUserByWalletAddress(walletAddress);
      
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }
      
      res.json({ apiSettings: user.apiSettings || null });
    } catch (error) {
      console.error("Error fetching API settings:", error);
      res.status(500).json({ message: "Failed to fetch API settings" });
    }
  });
  
  app.post("/api/users/:walletAddress/api-settings", async (req: Request, res: Response) => {
    try {
      const { walletAddress } = req.params;
      const { apiSettings } = req.body;
      
      if (!apiSettings) {
        return res.status(400).json({ message: "apiSettings is required" });
      }
      
      const user = await storage.getUserByWalletAddress(walletAddress);
      
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }
      
      const updatedUser = await storage.updateUserApiSettings(user.id, apiSettings);
      res.json({ apiSettings: updatedUser.apiSettings });
    } catch (error) {
      console.error("Error updating API settings:", error);
      res.status(500).json({ message: "Failed to update API settings" });
    }
  });
  
  // Get API status to see which APIs have keys configured
  app.get("/api/status", async (_req: Request, res: Response) => {
    try {
      const apiStatus = {
        openai: hasApiKey(ApiProvider.OPENAI),
        openrouter: hasApiKey(ApiProvider.OPENROUTER),
      };
      
      res.json(apiStatus);
    } catch (error) {
      console.error("Error checking API status:", error);
      res.status(500).json({ message: "Failed to check API status" });
    }
  });
  
  // Random dApp from DefiLlama API
  app.get("/api/dapps/random", async (req: Request, res: Response) => {
    try {
      const category = req.query.category as string | undefined;
      
      const randomDapp = await defiLlamaApi.getRandomProtocol(category);
      
      if (!randomDapp) {
        return res.status(404).json({ message: "No dApps found" });
      }
      
      res.json(randomDapp);
    } catch (error) {
      console.error("Error fetching random dApp:", error);
      res.status(500).json({ message: "Failed to fetch random dApp" });
    }
  });

  // Trending dApps from DefiLlama
  app.get("/api/dapps/trending", async (_req: Request, res: Response) => {
    try {
      const trendingDapps = await defiLlamaApi.getTrendingProtocols(5);
      res.json(trendingDapps);
    } catch (error) {
      console.error("Error fetching trending dApps:", error);
      res.status(500).json({ message: "Failed to fetch trending dApps" });
    }
  });

  // Deep Research using LangChain
  app.post("/api/research", async (req: Request, res: Response) => {
    try {
      const { dappName, dappDescription, category, chains, apiSettings } = req.body;
      
      if (!dappName) {
        return res.status(400).json({ message: "dappName is required" });
      }
      
      // If client provides API settings, use those, otherwise use server settings
      let settings: ApiSettings | undefined = undefined;
      
      if (apiSettings) {
        settings = apiSettings as ApiSettings;
      } else {
        const apiKey = getApiKey(ApiProvider.OPENAI) || getApiKey(ApiProvider.OPENROUTER);
        
        if (!apiKey) {
          return res.status(400).json({ 
            message: "No API key available. Please provide API settings or configure server API keys."
          });
        }
        
        settings = {
          baseUrl: getApiKey(ApiProvider.OPENROUTER) 
            ? 'https://openrouter.ai/api/v1' 
            : 'https://api.openai.com/v1',
          apiKey,
          modelName: 'gpt-3.5-turbo',
        };
      }
      
      const researchResult = await performResearch({
        dappName,
        dappDescription,
        category,
        chains,
      }, settings);
      
      res.json(researchResult);
    } catch (error) {
      console.error("Error performing research:", error);
      res.status(500).json({ message: "Failed to perform research" });
    }
  });

  // Favorites management
  app.get("/api/favorites", async (req: Request, res: Response) => {
    try {
      // In a real implementation, this would be the authenticated user's ID
      // For demo purposes, we'll use a fixed user ID
      const userId = 1;
      
      const favorites = await storage.getFavorites(userId);
      res.json(favorites);
    } catch (error) {
      console.error("Error fetching favorites:", error);
      res.status(500).json({ message: "Failed to fetch favorites" });
    }
  });

  app.post("/api/favorites", async (req: Request, res: Response) => {
    try {
      // In a real implementation, this would be the authenticated user's ID
      const userId = 1;
      
      const { dappId, dappData } = req.body;
      
      // Validate request data
      const validatedData = insertFavoriteSchema.parse({
        userId,
        dappId,
        dappData,
        position: 9999 // Will be updated after creation
      });
      
      // Check if dApp is already in favorites
      const existingFavorite = await storage.getFavoriteByDappId(userId, dappId);
      if (existingFavorite) {
        return res.status(409).json({ message: "dApp already in favorites" });
      }
      
      // Get current favorites to determine position
      const currentFavorites = await storage.getFavorites(userId);
      const lastPosition = currentFavorites.length > 0 
        ? Math.max(...currentFavorites.map(f => f.position)) 
        : 0;
      
      validatedData.position = lastPosition + 1;
      
      const favorite = await storage.createFavorite(validatedData);
      res.status(201).json(favorite);
    } catch (error) {
      if (error instanceof ZodError) {
        const validationError = fromZodError(error);
        return res.status(400).json({ message: validationError.message });
      }
      
      console.error("Error adding favorite:", error);
      res.status(500).json({ message: "Failed to add favorite" });
    }
  });

  app.delete("/api/favorites/:id", async (req: Request, res: Response) => {
    try {
      const id = parseInt(req.params.id);
      
      if (isNaN(id)) {
        return res.status(400).json({ message: "Invalid favorite ID" });
      }
      
      const success = await storage.deleteFavorite(id);
      
      if (!success) {
        return res.status(404).json({ message: "Favorite not found" });
      }
      
      res.status(204).send();
    } catch (error) {
      console.error("Error deleting favorite:", error);
      res.status(500).json({ message: "Failed to delete favorite" });
    }
  });

  app.put("/api/favorites/reorder", async (req: Request, res: Response) => {
    try {
      const { favorites } = req.body;
      
      if (!Array.isArray(favorites)) {
        return res.status(400).json({ message: "favorites must be an array" });
      }
      
      const success = await storage.updateFavoritePositions(favorites);
      
      if (!success) {
        return res.status(500).json({ message: "Failed to update favorite positions" });
      }
      
      res.status(200).json({ message: "Favorite positions updated" });
    } catch (error) {
      console.error("Error reordering favorites:", error);
      res.status(500).json({ message: "Failed to reorder favorites" });
    }
  });

  // Community experiences
  app.get("/api/experiences/:dappId", async (req: Request, res: Response) => {
    try {
      const { dappId } = req.params;
      
      const experiences = await storage.getExperiences(dappId);
      res.json(experiences);
    } catch (error) {
      console.error("Error fetching experiences:", error);
      res.status(500).json({ message: "Failed to fetch experiences" });
    }
  });

  app.post("/api/experiences", async (req: Request, res: Response) => {
    try {
      // In a real implementation, this would be the authenticated user's ID
      const userId = 1;
      
      const { dappId, content, rating } = req.body;
      
      // Validate request data
      const validatedData = insertExperienceSchema.parse({
        userId,
        dappId,
        content,
        rating
      });
      
      const experience = await storage.createExperience(validatedData);
      res.status(201).json(experience);
    } catch (error) {
      if (error instanceof ZodError) {
        const validationError = fromZodError(error);
        return res.status(400).json({ message: validationError.message });
      }
      
      console.error("Error adding experience:", error);
      res.status(500).json({ message: "Failed to add experience" });
    }
  });

  // Create HTTP server
  const httpServer = createServer(app);
  return httpServer;
}
