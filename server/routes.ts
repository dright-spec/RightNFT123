import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { marketplaceStorage } from "./marketplaceStorage";
import { db } from "./db";
import { users, rights } from "@shared/schema";
import { eq, desc, or, ilike, sql } from "drizzle-orm";
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
      
      // Filter by creator if specified
      if (req.query.creatorId) {
        options.userId = parseInt(req.query.creatorId as string);
      }
      
      const rights = await marketplaceStorage.getRights(options);
      res.json(rights);
    } catch (error) {
      console.error("Error fetching rights:", error);
      res.status(500).json({ error: "Failed to fetch rights" });
    }
  });

  // Google OAuth routes for YouTube verification
  app.get("/api/auth/google/client-id", async (req, res) => {
    try {
      res.json({ clientId: process.env.GOOGLE_CLIENT_ID });
    } catch (error) {
      console.error("Error getting client ID:", error);
      res.status(500).json({ error: "Failed to get client ID" });
    }
  });

  app.post("/api/auth/google/token", async (req, res) => {
    try {
      const { code } = req.body;
      
      if (!code) {
        return res.status(400).json({ error: "Authorization code required" });
      }

      // Exchange code for access token with Google
      const tokenResponse = await fetch("https://oauth2.googleapis.com/token", {
        method: "POST",
        headers: {
          "Content-Type": "application/x-www-form-urlencoded",
        },
        body: new URLSearchParams({
          code,
          client_id: process.env.GOOGLE_CLIENT_ID || "",
          client_secret: process.env.GOOGLE_CLIENT_SECRET || "",
          redirect_uri: `${req.protocol}://${req.get('host')}/auth/google/callback`,
          grant_type: "authorization_code",
        }),
      });

      if (!tokenResponse.ok) {
        throw new Error("Failed to exchange code for token");
      }

      const tokenData = await tokenResponse.json();
      res.json(tokenData);
    } catch (error) {
      console.error("Google OAuth error:", error);
      res.status(500).json({ error: "Authentication failed" });
    }
  });

  app.post("/api/auth/google/verify-youtube", async (req, res) => {
    try {
      const { videoId, accessToken } = req.body;

      if (!videoId || !accessToken) {
        return res.status(400).json({ error: "Video ID and access token required" });
      }

      // Get video details from YouTube API
      const videoResponse = await fetch(
        `https://www.googleapis.com/youtube/v3/videos?part=snippet&id=${videoId}&key=${process.env.YOUTUBE_API_KEY}`
      );

      if (!videoResponse.ok) {
        throw new Error("Failed to fetch video details");
      }

      const videoData = await videoResponse.json();
      
      if (!videoData.items || videoData.items.length === 0) {
        return res.status(404).json({ error: "Video not found" });
      }

      const video = videoData.items[0];

      // Get user's YouTube channels
      const channelsResponse = await fetch(
        `https://www.googleapis.com/youtube/v3/channels?part=snippet,statistics&mine=true&access_token=${accessToken}`
      );

      if (!channelsResponse.ok) {
        throw new Error("Failed to fetch user channels");
      }

      const channelsData = await channelsResponse.json();
      
      // Check if user owns the video's channel
      const ownerChannel = channelsData.items.find(
        (channel: any) => channel.id === video.snippet.channelId
      );

      res.json({
        isOwner: !!ownerChannel,
        video: {
          id: video.id,
          title: video.snippet.title,
          channelId: video.snippet.channelId,
          channelTitle: video.snippet.channelTitle,
          publishedAt: video.snippet.publishedAt,
          thumbnails: video.snippet.thumbnails
        },
        channel: ownerChannel ? {
          id: ownerChannel.id,
          title: ownerChannel.snippet.title,
          customUrl: ownerChannel.snippet.customUrl,
          thumbnails: ownerChannel.snippet.thumbnails,
          statistics: ownerChannel.statistics
        } : undefined
      });
    } catch (error) {
      console.error("YouTube verification error:", error);
      res.status(500).json({ error: "Verification failed" });
    }
  });

  // YouTube API endpoint
  app.get("/api/youtube/video/:videoId", async (req, res) => {
    try {
      const { videoId } = req.params;
      
      if (!videoId) {
        return res.status(400).json({ error: "Video ID required" });
      }

      const response = await fetch(
        `https://www.googleapis.com/youtube/v3/videos?part=snippet&id=${videoId}&key=${process.env.YOUTUBE_API_KEY}`
      );

      if (!response.ok) {
        throw new Error("Failed to fetch video details");
      }

      const data = await response.json();
      
      if (!data.items || data.items.length === 0) {
        return res.status(404).json({ error: "Video not found" });
      }

      const video = data.items[0];
      res.json({
        id: video.id,
        title: video.snippet.title,
        channelId: video.snippet.channelId,
        channelTitle: video.snippet.channelTitle,
        publishedAt: video.snippet.publishedAt,
        thumbnails: video.snippet.thumbnails
      });
    } catch (error) {
      console.error("YouTube API error:", error);
      res.status(500).json({ error: "Failed to fetch video details" });
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
      
      // Validate the right exists and is an auction
      const right = await marketplaceStorage.getRight(rightId);
      if (!right) {
        return res.status(404).json({ error: "Right not found" });
      }
      
      if (right.listingType !== "auction") {
        return res.status(400).json({ error: "This right is not available for auction" });
      }
      
      // Check if auction is still active
      if (right.auctionEndTime && new Date(right.auctionEndTime) < new Date()) {
        return res.status(400).json({ error: "Auction has ended" });
      }
      
      // Validate bid amount against current highest bid and minimum
      const currentHighestBid = parseFloat(right.highestBidAmount || "0");
      const newBidAmount = parseFloat(amount);
      const minimumBid = Math.max(
        currentHighestBid > 0 ? currentHighestBid * 1.05 : 0, // 5% increment if there are existing bids
        parseFloat(right.minBidAmount || "0")
      );
      
      if (newBidAmount < minimumBid) {
        return res.status(400).json({ 
          error: `Bid must be at least ${minimumBid.toFixed(4)} ETH` 
        });
      }
      
      const bid = await marketplaceStorage.placeBid({
        rightId,
        bidderId: mockUserId,
        amount,
        currency: "ETH",
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

  // Admin routes
  app.get('/api/admin/stats', async (req, res) => {
    try {
      // Use the existing storage to get stats
      const allRights = await marketplaceStorage.getRights({ limit: 1000 });
      const pendingRights = allRights.filter(r => r.verificationStatus === 'pending');
      
      const stats = {
        totalUsers: 10, // Mock data for demo
        totalRights: allRights.length,
        pendingVerifications: pendingRights.length,
        bannedUsers: 0,
        totalRevenue: "15.7 ETH",
        monthlyGrowth: 24.5
      };

      res.json(stats);
    } catch (error) {
      console.error("Error fetching admin stats:", error);
      res.status(500).json({ error: "Failed to fetch admin stats" });
    }
  });

  app.get('/api/admin/rights', async (req, res) => {
    try {
      const { status, search } = req.query;
      
      const options: any = { limit: 100 };
      if (search) {
        options.search = search as string;
      }
      
      let rightsData = await marketplaceStorage.getRights(options);
      
      // Filter by verification status if specified
      if (status && status !== 'all') {
        rightsData = rightsData.filter(right => right.verificationStatus === status);
      }

      res.json(rightsData);
    } catch (error) {
      console.error("Error fetching rights for admin:", error);
      res.status(500).json({ error: "Failed to fetch rights" });
    }
  });

  app.post('/api/admin/rights/:id/verify', async (req, res) => {
    try {
      const { id } = req.params;
      const { status, notes } = req.body;

      if (!['pending', 'verified', 'rejected'].includes(status)) {
        return res.status(400).json({ error: "Invalid verification status" });
      }

      const updateData: any = {
        verificationStatus: status,
        verificationNotes: notes || null,
      };

      if (status === 'verified') {
        updateData.verifiedAt = new Date();
        updateData.verifiedBy = 'Dright Team';
      }

      await marketplaceStorage.updateRight(parseInt(id), updateData);
      res.json({ message: "Verification status updated successfully" });
    } catch (error) {
      console.error("Error updating verification status:", error);
      res.status(500).json({ error: "Failed to update verification status" });
    }
  });

  app.get('/api/admin/users', async (req, res) => {
    try {
      // Mock users data for demo
      const mockUsers = [
        {
          id: 1,
          username: "alice_creator",
          email: "alice@example.com",
          walletAddress: "0x742d35Cc6634C0532925a3b8D3AC4C2C7bF27f86",
          isBanned: false,
          isVerified: true,
          createdAt: new Date('2024-01-15'),
          totalSales: 12,
          totalEarnings: "8.5"
        },
        {
          id: 2,
          username: "bob_musician",
          email: "bob@example.com", 
          walletAddress: "0x1234567890123456789012345678901234567890",
          isBanned: false,
          isVerified: true,
          createdAt: new Date('2024-02-01'),
          totalSales: 5,
          totalEarnings: "3.2"
        },
        {
          id: 3,
          username: "charlie_artist",
          email: "charlie@example.com",
          walletAddress: "0xabcdefabcdefabcdefabcdefabcdefabcdefabcd",
          isBanned: true,
          isVerified: false,
          createdAt: new Date('2024-03-10'),
          totalSales: 0,
          totalEarnings: "0"
        }
      ];

      res.json(mockUsers);
    } catch (error) {
      console.error("Error fetching users for admin:", error);
      res.status(500).json({ error: "Failed to fetch users" });
    }
  });

  app.post('/api/admin/users/:id/ban', async (req, res) => {
    try {
      const { id } = req.params;
      const { banned } = req.body;

      // In a real implementation, this would update the database
      console.log(`User ${id} ${banned ? 'banned' : 'unbanned'}`);
      
      res.json({ message: `User ${banned ? 'banned' : 'unbanned'} successfully` });
    } catch (error) {
      console.error("Error updating user ban status:", error);
      res.status(500).json({ error: "Failed to update user status" });
    }
  });

  // Admin routes
  app.get('/api/admin/stats', async (req, res) => {
    try {
      const totalUsersQuery = `SELECT COUNT(*) as count FROM users`;
      const totalRightsQuery = `SELECT COUNT(*) as count FROM rights`;
      const pendingVerificationsQuery = `SELECT COUNT(*) as count FROM rights WHERE verification_status = 'pending'`;
      const bannedUsersQuery = `SELECT COUNT(*) as count FROM users WHERE is_banned = true`;

      const [totalUsers, totalRights, pendingVerifications, bannedUsers] = await Promise.all([
        db.execute(totalUsersQuery),
        db.execute(totalRightsQuery),
        db.execute(pendingVerificationsQuery),
        db.execute(bannedUsersQuery)
      ]);

      const stats = {
        totalUsers: Number(totalUsers.rows[0]?.count || 0),
        totalRights: Number(totalRights.rows[0]?.count || 0),
        pendingVerifications: Number(pendingVerifications.rows[0]?.count || 0),
        bannedUsers: Number(bannedUsers.rows[0]?.count || 0),
        totalRevenue: "0 ETH",
        monthlyGrowth: 0
      };

      res.json(stats);
    } catch (error) {
      console.error("Error fetching admin stats:", error);
      res.status(500).json({ error: "Failed to fetch admin stats" });
    }
  });

  app.get('/api/admin/rights', async (req, res) => {
    try {
      const { status, search } = req.query;
      
      let query = `
        SELECT r.*, 
               u.username as creator_username, u.email as creator_email, u.wallet_address as creator_wallet_address, u.is_verified as creator_is_verified,
               o.username as owner_username, o.email as owner_email, o.wallet_address as owner_wallet_address
        FROM rights r 
        LEFT JOIN users u ON r.creator_id = u.id 
        LEFT JOIN users o ON r.owner_id = o.id
      `;
      
      const conditions = [];
      const params = [];
      
      if (status && status !== 'all') {
        conditions.push(`r.verification_status = $${params.length + 1}`);
        params.push(status);
      }
      
      if (search) {
        conditions.push(`(r.title ILIKE $${params.length + 1} OR r.description ILIKE $${params.length + 1} OR u.username ILIKE $${params.length + 1})`);
        params.push(`%${search}%`);
      }
      
      if (conditions.length > 0) {
        query += ` WHERE ${conditions.join(' AND ')}`;
      }
      
      query += ` ORDER BY r.created_at DESC`;

      const result = await db.execute(query, params);
      
      const rightsWithCreator = result.rows.map((row: any) => ({
        id: row.id,
        tokenId: row.token_id,
        title: row.title,
        type: row.type,
        description: row.description,
        symbol: row.symbol,
        price: row.price,
        currency: row.currency,
        contentFileHash: row.content_file_hash,
        contentFileUrl: row.content_file_url,
        verificationStatus: row.verification_status,
        verifiedAt: row.verified_at,
        verifiedBy: row.verified_by,
        verificationNotes: row.verification_notes,
        createdAt: row.created_at,
        creator: {
          id: row.creator_id,
          username: row.creator_username,
          email: row.creator_email,
          walletAddress: row.creator_wallet_address,
          isVerified: row.creator_is_verified
        },
        owner: {
          id: row.owner_id,
          username: row.owner_username,
          email: row.owner_email,
          walletAddress: row.owner_wallet_address
        }
      }));

      res.json(rightsWithCreator);
    } catch (error) {
      console.error("Error fetching rights for admin:", error);
      res.status(500).json({ error: "Failed to fetch rights" });
    }
  });

  app.post('/api/admin/rights/:id/verify', async (req, res) => {
    try {
      const { id } = req.params;
      const { status, notes } = req.body;

      if (!['pending', 'verified', 'rejected'].includes(status)) {
        return res.status(400).json({ error: "Invalid verification status" });
      }

      const updateFields = [`verification_status = $1`, `verification_notes = $2`, `updated_at = NOW()`];
      const params = [status, notes || null];

      if (status === 'verified') {
        updateFields.push(`verified_at = NOW()`, `verified_by = $${params.length + 1}`);
        params.push('Dright Team');
      } else {
        updateFields.push(`verified_at = NULL`, `verified_by = NULL`);
      }

      const query = `UPDATE rights SET ${updateFields.join(', ')} WHERE id = $${params.length + 1}`;
      params.push(parseInt(id));

      await db.execute(query, params);
      res.json({ message: "Verification status updated successfully" });
    } catch (error) {
      console.error("Error updating verification status:", error);
      res.status(500).json({ error: "Failed to update verification status" });
    }
  });

  app.get('/api/admin/users', async (req, res) => {
    try {
      const query = `SELECT * FROM users ORDER BY created_at DESC`;
      const result = await db.execute(query);
      res.json(result.rows);
    } catch (error) {
      console.error("Error fetching users for admin:", error);
      res.status(500).json({ error: "Failed to fetch users" });
    }
  });

  app.post('/api/admin/users/:id/ban', async (req, res) => {
    try {
      const { id } = req.params;
      const { banned } = req.body;

      const query = `UPDATE users SET is_banned = $1, updated_at = NOW() WHERE id = $2`;
      await db.execute(query, [banned, parseInt(id)]);

      res.json({ message: `User ${banned ? 'banned' : 'unbanned'} successfully` });
    } catch (error) {
      console.error("Error updating user ban status:", error);
      res.status(500).json({ error: "Failed to update user status" });
    }
  });

  // Google OAuth endpoints
  app.get('/api/auth/google/client-id', (req, res) => {
    res.json({ clientId: process.env.GOOGLE_CLIENT_ID });
  });

  // Exchange authorization code for access token
  app.post('/api/auth/google/token', async (req, res) => {
    try {
      const { code } = req.body;
      
      if (!code) {
        return res.status(400).json({ error: 'Authorization code required' });
      }

      const tokenResponse = await fetch('https://oauth2.googleapis.com/token', {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: new URLSearchParams({
          client_id: process.env.GOOGLE_CLIENT_ID!,
          client_secret: process.env.GOOGLE_CLIENT_SECRET!,
          code,
          grant_type: 'authorization_code',
          redirect_uri: `${req.protocol}://${req.get('host')}/auth/google/callback`
        })
      });

      if (!tokenResponse.ok) {
        const error = await tokenResponse.text();
        console.error('Token exchange error:', error);
        return res.status(400).json({ error: 'Failed to exchange authorization code' });
      }

      const tokenData = await tokenResponse.json();
      res.json(tokenData);
    } catch (error) {
      console.error('Google token exchange error:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  });

  // Verify YouTube video ownership
  app.post('/api/auth/google/verify-video', async (req, res) => {
    try {
      const { videoId, accessToken } = req.body;
      
      if (!videoId || !accessToken) {
        return res.status(400).json({ error: 'Video ID and access token required' });
      }

      // Get video details
      const videoResponse = await fetch(
        `https://www.googleapis.com/youtube/v3/videos?part=snippet&id=${videoId}&key=${process.env.YOUTUBE_API_KEY}`
      );

      if (!videoResponse.ok) {
        return res.status(400).json({ error: 'Failed to fetch video details' });
      }

      const videoData = await videoResponse.json();
      const video = videoData.items?.[0];

      if (!video) {
        return res.status(404).json({ error: 'Video not found' });
      }

      // Get user's YouTube channels
      const channelsResponse = await fetch(
        `https://www.googleapis.com/youtube/v3/channels?part=snippet,statistics&mine=true&access_token=${accessToken}`
      );

      if (!channelsResponse.ok) {
        return res.status(400).json({ error: 'Failed to fetch user channels' });
      }

      const channelsData = await channelsResponse.json();
      const userChannels = channelsData.items || [];

      // Check if user owns the video's channel
      const ownerChannel = userChannels.find((channel: any) => 
        channel.id === video.snippet.channelId
      );

      res.json({
        isOwner: !!ownerChannel,
        channel: ownerChannel ? {
          id: ownerChannel.id,
          title: ownerChannel.snippet.title,
          customUrl: ownerChannel.snippet.customUrl,
          thumbnails: ownerChannel.snippet.thumbnails,
          statistics: ownerChannel.statistics
        } : null,
        video: {
          id: video.id,
          title: video.snippet.title,
          channelId: video.snippet.channelId,
          channelTitle: video.snippet.channelTitle,
          publishedAt: video.snippet.publishedAt
        }
      });
    } catch (error) {
      console.error('Video verification error:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}
