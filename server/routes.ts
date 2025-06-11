import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { marketplaceStorage } from "./marketplaceStorage";
import { insertRightSchema, insertUserSchema, insertTransactionSchema } from "@shared/schema";
import { z } from "zod";

export async function registerRoutes(app: Express): Promise<Server> {
  // Rights routes
  app.get("/api/rights", async (req, res) => {
    try {
      const { limit = "20", offset = "0", type, isListed } = req.query;
      const rights = await storage.getRightsWithCreator(
        parseInt(limit as string),
        parseInt(offset as string),
        type as string,
        isListed ? isListed === "true" : undefined
      );
      res.json(rights);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch rights" });
    }
  });

  app.get("/api/rights/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const right = await storage.getRightWithCreator(id);
      
      if (!right) {
        return res.status(404).json({ error: "Right not found" });
      }
      
      res.json(right);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch right" });
    }
  });

  app.post("/api/rights", async (req, res) => {
    try {
      // For MVP, we'll use a mock user ID. In production, this would come from authentication
      const mockUserId = 1;
      
      const validatedData = insertRightSchema.parse(req.body);
      const right = await storage.createRight({
        ...validatedData,
        creatorId: mockUserId,
        ownerId: mockUserId,
      });
      
      // Create mint transaction
      await storage.createTransaction({
        rightId: right.id,
        toUserId: mockUserId,
        transactionHash: `0x${Math.random().toString(16).substr(2, 64)}`,
        price: right.price || "0",
        currency: right.currency || "ETH",
        type: "mint",
      });
      
      res.status(201).json(right);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ error: "Invalid data", details: error.errors });
      }
      res.status(500).json({ error: "Failed to create right" });
    }
  });

  app.patch("/api/rights/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const updates = req.body;
      
      const right = await storage.updateRight(id, updates);
      
      if (!right) {
        return res.status(404).json({ error: "Right not found" });
      }
      
      res.json(right);
    } catch (error) {
      res.status(500).json({ error: "Failed to update right" });
    }
  });

  // User routes
  app.get("/api/users/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const user = await storage.getUser(id);
      
      if (!user) {
        return res.status(404).json({ error: "User not found" });
      }
      
      // Don't return password
      const { password, ...userWithoutPassword } = user;
      res.json(userWithoutPassword);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch user" });
    }
  });

  app.post("/api/users", async (req, res) => {
    try {
      const validatedData = insertUserSchema.parse(req.body);
      const user = await storage.createUser(validatedData);
      
      // Don't return password
      const { password, ...userWithoutPassword } = user;
      res.status(201).json(userWithoutPassword);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ error: "Invalid data", details: error.errors });
      }
      res.status(500).json({ error: "Failed to create user" });
    }
  });

  // Transactions routes
  app.get("/api/rights/:id/transactions", async (req, res) => {
    try {
      const rightId = parseInt(req.params.id);
      const transactions = await storage.getTransactionsByRight(rightId);
      res.json(transactions);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch transactions" });
    }
  });

  app.post("/api/transactions", async (req, res) => {
    try {
      const validatedData = insertTransactionSchema.parse(req.body);
      const transaction = await storage.createTransaction(validatedData);
      res.status(201).json(transaction);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ error: "Invalid data", details: error.errors });
      }
      res.status(500).json({ error: "Failed to create transaction" });
    }
  });

  // Mock wallet connection endpoint
  app.post("/api/wallet/connect", async (req, res) => {
    try {
      const { walletAddress } = req.body;
      
      if (!walletAddress) {
        return res.status(400).json({ error: "Wallet address required" });
      }
      
      // Check if user exists with this wallet address
      let user = await storage.getUserByWalletAddress(walletAddress);
      
      if (!user) {
        // Create new user for this wallet
        user = await storage.createUser({
          username: `user_${walletAddress.slice(-6)}`,
          password: "mock_password",
          walletAddress,
        });
      }
      
      const { password, ...userWithoutPassword } = user;
      res.json({ 
        success: true, 
        user: userWithoutPassword,
        message: "Wallet connected successfully" 
      });
    } catch (error) {
      res.status(500).json({ error: "Failed to connect wallet" });
    }
  });

  // Mock IPFS upload endpoint
  app.post("/api/ipfs/upload", async (req, res) => {
    try {
      // In a real implementation, this would upload to IPFS
      const mockHash = `Qm${Math.random().toString(36).substr(2, 44)}`;
      const mockUrl = `https://ipfs.io/ipfs/${mockHash}`;
      
      res.json({
        hash: mockHash,
        url: mockUrl,
        success: true,
      });
    } catch (error) {
      res.status(500).json({ error: "Failed to upload to IPFS" });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}
