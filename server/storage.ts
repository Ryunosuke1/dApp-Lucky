import { 
  users, type User, type InsertUser,
  favorites, type Favorite, type InsertFavorite,
  experiences, type Experience, type InsertExperience
} from "@shared/schema";

import { ApiSettings } from "@shared/schema";

export interface IStorage {
  // User methods
  getUser(id: number): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  getUserByWalletAddress(walletAddress: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  getOrCreateUserByWallet(walletAddress: string): Promise<User>;
  updateUserApiSettings(userId: number, apiSettings: ApiSettings): Promise<User>;
  
  // Favorite methods
  getFavorites(userId: number): Promise<Favorite[]>;
  getFavoritesByWalletAddress(walletAddress: string): Promise<Favorite[]>;
  getFavorite(id: number): Promise<Favorite | undefined>;
  getFavoriteByDappId(userId: number, dappId: string): Promise<Favorite | undefined>;
  createFavorite(favorite: InsertFavorite): Promise<Favorite>;
  deleteFavorite(id: number): Promise<boolean>;
  updateFavoritePositions(favorites: { id: number; position: number }[]): Promise<boolean>;
  
  // Experience methods
  getExperiences(dappId: string): Promise<Experience[]>;
  createExperience(experience: InsertExperience): Promise<Experience>;
}

export class MemStorage implements IStorage {
  private users: Map<number, User>;
  private favorites: Map<number, Favorite>;
  private experiences: Map<number, Experience>;
  private userIdCounter: number;
  private favoriteIdCounter: number;
  private experienceIdCounter: number;

  constructor() {
    this.users = new Map();
    this.favorites = new Map();
    this.experiences = new Map();
    this.userIdCounter = 1;
    this.favoriteIdCounter = 1;
    this.experienceIdCounter = 1;
  }

  // User methods
  async getUser(id: number): Promise<User | undefined> {
    return this.users.get(id);
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    return Array.from(this.users.values()).find(
      (user) => user.username === username,
    );
  }

  async getUserByWalletAddress(walletAddress: string): Promise<User | undefined> {
    return Array.from(this.users.values()).find(
      (user) => user.walletAddress === walletAddress,
    );
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const id = this.userIdCounter++;
    const user: User = { ...insertUser, id };
    this.users.set(id, user);
    return user;
  }

  async getOrCreateUserByWallet(walletAddress: string): Promise<User> {
    // Check if user with this wallet address already exists
    const existingUser = await this.getUserByWalletAddress(walletAddress);
    if (existingUser) {
      return existingUser;
    }

    // Create a new user with the wallet address
    const randomUsername = `user_${Math.random().toString(36).substring(2, 10)}`;
    const newUser: InsertUser = {
      username: randomUsername,
      password: Math.random().toString(36), // Random password since login is via wallet
      walletAddress
    };

    return this.createUser(newUser);
  }

  async updateUserApiSettings(userId: number, apiSettings: ApiSettings): Promise<User> {
    const user = await this.getUser(userId);
    if (!user) {
      throw new Error(`User with ID ${userId} not found`);
    }

    user.apiSettings = apiSettings;
    this.users.set(userId, user);
    
    return user;
  }

  async getFavoritesByWalletAddress(walletAddress: string): Promise<Favorite[]> {
    const user = await this.getUserByWalletAddress(walletAddress);
    if (!user) {
      return [];
    }
    
    return this.getFavorites(user.id);
  }

  // Favorite methods
  async getFavorites(userId: number): Promise<Favorite[]> {
    return Array.from(this.favorites.values())
      .filter(favorite => favorite.userId === userId)
      .sort((a, b) => a.position - b.position);
  }

  async getFavorite(id: number): Promise<Favorite | undefined> {
    return this.favorites.get(id);
  }

  async getFavoriteByDappId(userId: number, dappId: string): Promise<Favorite | undefined> {
    return Array.from(this.favorites.values()).find(
      (favorite) => favorite.userId === userId && favorite.dappId === dappId,
    );
  }

  async createFavorite(insertFavorite: InsertFavorite): Promise<Favorite> {
    const id = this.favoriteIdCounter++;
    const now = new Date().toISOString();
    const favorite: Favorite = { ...insertFavorite, id, createdAt: now };
    this.favorites.set(id, favorite);
    return favorite;
  }

  async deleteFavorite(id: number): Promise<boolean> {
    return this.favorites.delete(id);
  }

  async updateFavoritePositions(favorites: { id: number; position: number }[]): Promise<boolean> {
    try {
      for (const { id, position } of favorites) {
        const favorite = this.favorites.get(id);
        if (favorite) {
          favorite.position = position;
          this.favorites.set(id, favorite);
        }
      }
      return true;
    } catch (error) {
      console.error("Error updating favorite positions:", error);
      return false;
    }
  }

  // Experience methods
  async getExperiences(dappId: string): Promise<Experience[]> {
    return Array.from(this.experiences.values())
      .filter(experience => experience.dappId === dappId)
      .sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  }

  async createExperience(insertExperience: InsertExperience): Promise<Experience> {
    const id = this.experienceIdCounter++;
    const now = new Date().toISOString();
    const experience: Experience = { ...insertExperience, id, createdAt: now };
    this.experiences.set(id, experience);
    return experience;
  }
}

export const storage = new MemStorage();
