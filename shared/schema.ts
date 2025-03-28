import { pgTable, text, serial, integer, boolean, jsonb } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  username: text("username").notNull().unique(),
  password: text("password").notNull(),
  walletAddress: text("wallet_address"),
});

export const favorites = pgTable("favorites", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull(),
  dappId: text("dapp_id").notNull(),
  dappData: jsonb("dapp_data").notNull(),
  position: integer("position").notNull(),
  createdAt: text("created_at").notNull(),
});

export const experiences = pgTable("experiences", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull(),
  dappId: text("dapp_id").notNull(),
  content: text("content").notNull(),
  rating: integer("rating").notNull(),
  createdAt: text("created_at").notNull(),
});

export const insertUserSchema = createInsertSchema(users).pick({
  username: true,
  password: true,
  walletAddress: true,
});

export const insertFavoriteSchema = createInsertSchema(favorites).pick({
  userId: true,
  dappId: true,
  dappData: true,
  position: true,
});

export const insertExperienceSchema = createInsertSchema(experiences).pick({
  userId: true,
  dappId: true,
  content: true,
  rating: true,
});

export type InsertUser = z.infer<typeof insertUserSchema>;
export type User = typeof users.$inferSelect;

export type InsertFavorite = z.infer<typeof insertFavoriteSchema>;
export type Favorite = typeof favorites.$inferSelect;

export type InsertExperience = z.infer<typeof insertExperienceSchema>;
export type Experience = typeof experiences.$inferSelect;

// Frontend schemas for validation
export const shareExperienceSchema = z.object({
  dappId: z.string(),
  dappName: z.string(),
  content: z.string().min(10, "Experience must be at least 10 characters"),
  rating: z.number().int().min(1).max(5)
});

export const shareTextSchema = z.object({
  comment: z.string().optional(),
  hashtags: z.array(z.string()).optional()
});

export type ShareExperience = z.infer<typeof shareExperienceSchema>;
export type ShareText = z.infer<typeof shareTextSchema>;
