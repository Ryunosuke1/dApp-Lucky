import type { Express, Request, Response } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import axios from "axios";
import { insertExperienceSchema, insertFavoriteSchema } from "@shared/schema";
import { ZodError } from "zod";
import { fromZodError } from "zod-validation-error";

export async function registerRoutes(app: Express): Promise<Server> {
  // prefix all routes with /api
  
  // Random dApp from dAppRadar API
  app.get("/api/dapps/random", async (req: Request, res: Response) => {
    try {
      const category = req.query.category as string | undefined;
      // Call dAppRadar API to get random dApp
      // For this implementation we'll use a mock API endpoint
      // In a real implementation, this would be a call to the actual dAppRadar API
      
      const response = await axios.get("https://api.dappradar.com/4tsxo4vuhotaojtl/dapps/rankings", {
        params: {
          chain: "ethereum",
          category: category || undefined,
          page: 1,
          resultsPerPage: 50,
        },
        headers: {
          "X-BLOBR-KEY": process.env.DAPPRADAR_API_KEY || "",
        }
      });
      
      // Get a random dApp from the results
      const dapps = response.data.dapps || [];
      if (dapps.length === 0) {
        return res.status(404).json({ message: "No dApps found" });
      }
      
      const randomIndex = Math.floor(Math.random() * dapps.length);
      const randomDapp = dapps[randomIndex];
      
      res.json(randomDapp);
    } catch (error) {
      console.error("Error fetching random dApp:", error);
      res.status(500).json({ message: "Failed to fetch random dApp" });
    }
  });

  // Deep Research using OpenRouter API
  app.post("/api/research", async (req: Request, res: Response) => {
    try {
      const { dappName, dappDescription } = req.body;
      
      if (!dappName) {
        return res.status(400).json({ message: "dappName is required" });
      }
      
      // Call OpenRouter API
      const response = await axios.post(
        "https://openrouter.ai/api/v1/chat/completions",
        {
          model: "openai/gpt-3.5-turbo",
          messages: [
            {
              role: "system",
              content: "You are a Web3 expert providing detailed research about dApps. Provide structured information including overview, key features, recent developments, and community sentiment."
            },
            {
              role: "user",
              content: `Provide deep research about the dApp called "${dappName}". ${dappDescription ? `Description: ${dappDescription}` : ""}`
            }
          ]
        },
        {
          headers: {
            "Authorization": `Bearer ${process.env.OPENROUTER_API_KEY || ""}`,
            "HTTP-Referer": "https://dapp-explorer.example.com",
            "X-Title": "dApp Explorer"
          }
        }
      );
      
      const research = response.data.choices[0].message.content;
      res.json({ research });
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
