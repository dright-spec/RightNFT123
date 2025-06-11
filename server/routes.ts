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
      const options = {
        limit: parseInt(req.query.limit as string) || 20,
        offset: parseInt(req.query.offset as string) || 0,
        search: req.query.search as string,
        type: req.query.type as string,
        categoryId: req.query.categoryId ? parseInt(req.query.categoryId as string) : undefined,
        listingType: req.query.listingType as string,
        priceMin: req.query.priceMin as string,
        priceMax: req.query.priceMax as string,
        paysDividends: req.query.paysDividends === "true" ? true : req.query.paysDividends === "false" ? false : undefined,
        sortBy: req.query.sortBy as string || "createdAt",
        sortOrder: (req.query.sortOrder as "asc" | "desc") || "desc",
        userId: req.query.userId ? parseInt(req.query.userId as string) : undefined,
      };
      
      const rights = await marketplaceStorage.getRights(options);
      res.json(rights);
    } catch (error) {
      console.error("Error fetching rights:", error);
      res.status(500).json({ error: "Failed to fetch rights" });
    }
  });

  app.get("/api/rights/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const userId = req.query.userId ? parseInt(req.query.userId as string) : undefined;
      const right = await marketplaceStorage.getRight(id, userId);
      
      if (!right) {
        return res.status(404).json({ error: "Right not found" });
      }
      
      res.json(right);
    } catch (error) {
      console.error("Error fetching right:", error);
      res.status(500).json({ error: "Failed to fetch right" });
    }
  });

  app.post("/api/rights", async (req, res) => {
    try {
      // For MVP, we'll use a mock user ID. In production, this would come from authentication
      const mockUserId = 1;
      
      const validatedData = insertRightSchema.parse(req.body);
      const right = await marketplaceStorage.createRight({
        ...validatedData,
        creatorId: mockUserId,
        ownerId: mockUserId,
      });
      
      // Create mint transaction
      await marketplaceStorage.createTransaction({
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

  // Categories routes
  app.get("/api/categories", async (req, res) => {
    try {
      const categories = await marketplaceStorage.getCategories();
      res.json(categories);
    } catch (error) {
      console.error("Error fetching categories:", error);
      res.status(500).json({ error: "Failed to fetch categories" });
    }
  });

  // Search routes
  app.get("/api/search", async (req, res) => {
    try {
      const query = req.query.q as string;
      const limit = parseInt(req.query.limit as string) || 20;
      const offset = parseInt(req.query.offset as string) || 0;
      
      if (!query) {
        return res.status(400).json({ error: "Search query is required" });
      }
      
      const results = await marketplaceStorage.searchRights(query, { limit, offset });
      res.json(results);
    } catch (error) {
      console.error("Error searching rights:", error);
      res.status(500).json({ error: "Failed to search rights" });
    }
  });

  // Bidding routes
  app.post("/api/rights/:id/bids", async (req, res) => {
    try {
      const rightId = parseInt(req.params.id);
      const mockUserId = 1; // In production, get from authentication
      const { amount } = req.body;
      
      if (!amount || parseFloat(amount) <= 0) {
        return res.status(400).json({ error: "Valid bid amount is required" });
      }
      
      const bid = await marketplaceStorage.placeBid({
        rightId,
        bidderId: mockUserId,
        amount,
        isActive: true,
      });
      
      res.status(201).json(bid);
    } catch (error) {
      console.error("Error placing bid:", error);
      res.status(500).json({ error: "Failed to place bid" });
    }
  });

  app.get("/api/rights/:id/bids", async (req, res) => {
    try {
      const rightId = parseInt(req.params.id);
      const bids = await marketplaceStorage.getBidsForRight(rightId);
      res.json(bids);
    } catch (error) {
      console.error("Error fetching bids:", error);
      res.status(500).json({ error: "Failed to fetch bids" });
    }
  });

  // Favorites routes
  app.post("/api/rights/:id/favorite", async (req, res) => {
    try {
      const rightId = parseInt(req.params.id);
      const mockUserId = 1; // In production, get from authentication
      
      await marketplaceStorage.addToFavorites(mockUserId, rightId);
      res.status(200).json({ message: "Added to favorites" });
    } catch (error) {
      console.error("Error adding to favorites:", error);
      res.status(500).json({ error: "Failed to add to favorites" });
    }
  });

  app.delete("/api/rights/:id/favorite", async (req, res) => {
    try {
      const rightId = parseInt(req.params.id);
      const mockUserId = 1; // In production, get from authentication
      
      await marketplaceStorage.removeFromFavorites(mockUserId, rightId);
      res.status(200).json({ message: "Removed from favorites" });
    } catch (error) {
      console.error("Error removing from favorites:", error);
      res.status(500).json({ error: "Failed to remove from favorites" });
    }
  });

  // Mock IPFS upload endpoint
  app.post("/api/ipfs/upload", async (req, res) => {
    try {
      const { filename, size, type } = req.body;
      
      // Simulate upload process
      const mockHash = `Qm${Math.random().toString(36).substring(2, 15)}${Math.random().toString(36).substring(2, 15)}`;
      
      res.json({
        hash: mockHash,
        url: `https://ipfs.io/ipfs/${mockHash}`,
        success: true,
        fileSize: size,
        fileName: filename,
        fileType: type,
      });
    } catch (error) {
      console.error("Error uploading to IPFS:", error);
      res.status(500).json({ error: "Failed to upload to IPFS" });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}
