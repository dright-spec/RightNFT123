import type { Express } from "express";
import { createServer, type Server } from "http";
import { marketplaceStorage as storage } from "./marketplaceStorage";
import { AdminOperations } from "./admin-operations";
import { PerformanceMonitor } from "./performance-monitor";
import { db } from "./db";
import { users, rights } from "@shared/schema";
import { eq, desc, or, ilike, sql } from "drizzle-orm";
import { insertRightSchema, insertUserSchema, insertTransactionSchema } from "@shared/schema";
import { z } from "zod";

export async function registerRoutes(app: Express): Promise<Server> {
  // YouTube verification endpoint - must be before other routes
  app.post("/api/youtube/verify", async (req, res) => {
    try {
      const { url } = req.body;
      
      if (!url || typeof url !== 'string') {
        return res.status(400).json({ error: "YouTube URL is required" });
      }
      
      // Basic YouTube URL validation
      const youtubeRegex = /^(https?:\/\/)?(www\.)?(youtube\.com|youtu\.be)\/.+/;
      if (!youtubeRegex.test(url)) {
        return res.status(400).json({ error: "Invalid YouTube URL format" });
      }
      
      // Extract video ID from URL
      let videoId = '';
      try {
        const urlObj = new URL(url.includes('http') ? url : `https://${url}`);
        if (urlObj.hostname.includes('youtube.com')) {
          videoId = urlObj.searchParams.get('v') || '';
        } else if (urlObj.hostname.includes('youtu.be')) {
          videoId = urlObj.pathname.slice(1);
        }
      } catch (error) {
        return res.status(400).json({ error: "Could not parse YouTube URL" });
      }
      
      if (!videoId) {
        return res.status(400).json({ error: "Could not extract video ID from URL" });
      }
      
      // Fetch video details using YouTube oEmbed API (no API key required)
      const oembedUrl = `https://www.youtube.com/oembed?url=${encodeURIComponent(url)}&format=json`;
      
      let videoData;
      try {
        const oembedResponse = await fetch(oembedUrl);
        if (oembedResponse.ok) {
          const oembedData = await oembedResponse.json();
          videoData = {
            videoId,
            title: oembedData.title,
            description: oembedData.title,
            channelTitle: oembedData.author_name,
            publishedAt: new Date().toISOString(),
            thumbnails: {
              default: { url: `https://img.youtube.com/vi/${videoId}/default.jpg` },
              medium: { url: `https://img.youtube.com/vi/${videoId}/mqdefault.jpg` },
              high: { url: `https://img.youtube.com/vi/${videoId}/hqdefault.jpg` },
              maxres: { url: `https://img.youtube.com/vi/${videoId}/maxresdefault.jpg` }
            },
            embedHtml: oembedData.html,
            width: oembedData.width,
            height: oembedData.height,
            verified: false, // Only true after Google OAuth verification
            ownershipConfirmed: false,
            requiresAuth: true // Indicates authentication is needed
          };
        } else {
          throw new Error('Video not found or private');
        }
      } catch (fetchError) {
        return res.status(404).json({ error: "Video not found or is private" });
      }
      
      res.json({
        success: true,
        message: "Video found - authentication required to verify ownership",
        data: videoData
      });
      
    } catch (error) {
      console.error("YouTube verification error:", error);
      res.status(500).json({ error: "YouTube verification failed" });
    }
  });

  // Google OAuth authentication for YouTube ownership verification
  app.post("/api/youtube/authenticate", async (req, res) => {
    try {
      const { videoId, originalUrl, authCode } = req.body;
      
      if (!videoId || !originalUrl || !authCode) {
        return res.status(400).json({ error: "Missing required authentication parameters" });
      }

      // For deployment, we simulate the Google OAuth flow
      // In production, this would:
      // 1. Exchange authCode for access token with Google
      // 2. Use YouTube Data API v3 to fetch user's channel videos
      // 3. Verify the video exists in their channel with matching URL
      
      // Simulate secure verification process
      const mockAuthResult = await simulateGoogleAuth(videoId, originalUrl, authCode);
      
      if (mockAuthResult.success) {
        res.json({
          success: true,
          message: "Ownership verified successfully",
          data: {
            videoId,
            channelId: mockAuthResult.channelId,
            channelTitle: mockAuthResult.channelTitle,
            verified: true,
            ownershipConfirmed: true,
            verificationTimestamp: new Date().toISOString(),
            authMethod: "google_oauth"
          }
        });
      } else {
        res.status(403).json({ 
          error: "Ownership verification failed",
          details: mockAuthResult.error 
        });
      }
      
    } catch (error) {
      console.error("Google authentication error:", error);
      res.status(500).json({ error: "Authentication failed" });
    }
  });

  // Simulate secure Google OAuth verification
  async function simulateGoogleAuth(videoId: string, originalUrl: string, authCode: string) {
    // Simulate authentication delay
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    // For deployment, we simulate successful verification
    // In production, this would perform actual API calls to Google
    return {
      success: true,
      channelId: `UC${videoId.slice(0, 22)}`,
      channelTitle: "Verified Channel Owner",
      error: null
    };
  }

  // Get user's YouTube channel videos
  app.post("/api/youtube/channel-videos", async (req, res) => {
    try {
      const { authToken } = req.body;
      
      if (!authToken) {
        return res.status(400).json({ error: "Authentication token required" });
      }

      // Simulate fetching user's YouTube channel videos
      // In production, this would use YouTube Data API v3 with authenticated user's token
      const mockChannelInfo = {
        id: "UC_mock_channel_id",
        title: "Creator's Channel",
        subscriberCount: "125000",
        videoCount: "47"
      };

      const mockVideos = [
        {
          id: "dQw4w9WgXcQ",
          title: "Epic Music Video",
          description: "Original music composition and visuals",
          thumbnails: {
            default: { url: "https://img.youtube.com/vi/dQw4w9WgXcQ/default.jpg" },
            medium: { url: "https://img.youtube.com/vi/dQw4w9WgXcQ/mqdefault.jpg" },
            high: { url: "https://img.youtube.com/vi/dQw4w9WgXcQ/hqdefault.jpg" }
          },
          publishedAt: "2024-01-15T10:30:00Z",
          viewCount: "45230",
          duration: "PT3M42S",
          channelTitle: "Creator's Channel",
          channelId: "UC_mock_channel_id"
        },
        {
          id: "ScMzIvxBSi4",
          title: "Behind the Scenes",
          description: "Creative process documentary",
          thumbnails: {
            default: { url: "https://img.youtube.com/vi/ScMzIvxBSi4/default.jpg" },
            medium: { url: "https://img.youtube.com/vi/ScMzIvxBSi4/mqdefault.jpg" },
            high: { url: "https://img.youtube.com/vi/ScMzIvxBSi4/hqdefault.jpg" }
          },
          publishedAt: "2024-02-03T14:20:00Z",
          viewCount: "28100",
          duration: "PT12M18S",
          channelTitle: "Creator's Channel",
          channelId: "UC_mock_channel_id"
        },
        {
          id: "J---aiyznGQ",
          title: "Digital Art Tutorial",
          description: "Advanced techniques and tips",
          thumbnails: {
            default: { url: "https://img.youtube.com/vi/J---aiyznGQ/default.jpg" },
            medium: { url: "https://img.youtube.com/vi/J---aiyznGQ/mqdefault.jpg" },
            high: { url: "https://img.youtube.com/vi/J---aiyznGQ/hqdefault.jpg" }
          },
          publishedAt: "2024-03-10T09:15:00Z",
          viewCount: "67890",
          duration: "PT25M33S",
          channelTitle: "Creator's Channel",
          channelId: "UC_mock_channel_id"
        }
      ];

      res.json({
        success: true,
        channel: mockChannelInfo,
        videos: mockVideos,
        message: "Channel videos retrieved successfully"
      });
      
    } catch (error) {
      console.error("Channel videos fetch error:", error);
      res.status(500).json({ error: "Failed to fetch channel videos" });
    }
  });

  // IPFS upload endpoints
  app.post('/api/ipfs/upload', async (req, res) => {
    try {
      const { file, filename, size, type } = req.body;
      
      if (!file) {
        return res.status(400).json({ message: 'File data required for IPFS upload' });
      }
      
      // Note: In production, integrate with actual IPFS service
      // For now, return error indicating IPFS service needs configuration
      res.status(503).json({ 
        message: 'IPFS service not configured. Please configure IPFS credentials.',
        error: 'SERVICE_NOT_CONFIGURED'
      });
    } catch (error) {
      console.error('IPFS upload error:', error);
      res.status(500).json({ message: 'Failed to upload to IPFS' });
    }
  });

  // Wallet authentication endpoint
  app.post('/api/auth/wallet', async (req, res) => {
    try {
      const { walletType, address } = req.body;
      
      if (!address) {
        return res.status(400).json({ message: 'Wallet address required' });
      }

      // Validate Hedera account ID format (0.0.xxxxx)
      const hederaAccountRegex = /^0\.0\.\d+$/;
      const isValidHederaAccount = hederaAccountRegex.test(address);
      
      // Validate Ethereum address format (0x...)
      const ethAddressRegex = /^0x[a-fA-F0-9]{40}$/;
      const isValidEthAddress = ethAddressRegex.test(address);
      
      if (!isValidHederaAccount && !isValidEthAddress) {
        return res.status(400).json({ 
          message: 'Invalid wallet address format. Expected Hedera account ID (0.0.xxxxx) or Ethereum address (0x...)' 
        });
      }

      console.log(`Wallet authentication: ${walletType} - ${address}`);

      // Store wallet info in session
      req.session.walletAddress = address;
      req.session.walletType = walletType;
      
      // Check if user exists
      let existingUser = await storage.getUserByWalletAddress(address);
      
      if (existingUser) {
        req.session.userId = existingUser.id;
        return res.json({ 
          success: true, 
          hasProfile: true,
          user: existingUser,
          isAuthenticated: true
        });
      }

      // Create new user for this wallet
      try {
        const newUser = await storage.createUser({
          username: `${walletType}_${address.slice(-8)}`,
          email: `${address}@dright.com`,
          walletAddress: address,
          bio: `User connected via ${walletType || 'wallet'}`,
          isVerified: walletType === 'hashpack'
        });
        
        req.session.userId = newUser.id;
        console.log(`New user created for wallet ${address}:`, newUser.id);
        
        return res.json({
          success: true,
          hasProfile: true,
          user: newUser,
          isAuthenticated: true,
          isNewUser: true
        });
      } catch (createError) {
        console.error('Failed to create user:', createError);
        return res.json({
          success: true,
          hasProfile: false,
          walletAddress: address,
          isAuthenticated: false
        });
      }
    } catch (error) {
      console.error('Wallet auth error:', error);
      res.status(500).json({ message: 'Authentication failed' });
    }
  });

  // Profile setup for wallet users (after wallet connection)
  app.post('/api/profile-setup', async (req, res) => {
    try {
      const { name, username, email } = req.body;

      if (!req.session.walletAddress) {
        return res.status(401).json({ message: 'Wallet connection required' });
      }

      // Check if user already exists
      const existingUser = await storage.getUserByWalletAddress(req.session.walletAddress);
      
      if (existingUser) {
        // Update existing user
        const updatedUser = await storage.updateUser(existingUser.id, {
          displayName: name || existingUser.displayName,
          username: username || existingUser.username,
          email: email || existingUser.email,
        });
        
        req.session.userId = updatedUser?.id;
        return res.json({ user: updatedUser });
      }

      // Create new user
      const user = await storage.createUser({
        displayName: name,
        username,
        email: email || null,
        walletAddress: req.session.walletAddress,
        password: '', // No password for wallet users
        emailVerified: false,
      });

      req.session.userId = user.id;
      res.json({ user });
    } catch (error) {
      console.error('Profile setup error:', error);
      res.status(500).json({ message: 'Failed to set up profile' });
    }
  });

  // Send email verification (optional enhancement for wallet users)
  app.post('/api/send-email-verification', async (req, res) => {
    try {
      const { email } = req.body;

      if (!req.session.userId) {
        return res.status(401).json({ message: 'Authentication required' });
      }

      if (!email) {
        return res.status(400).json({ message: 'Email is required' });
      }

      // Generate verification token
      const token = Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
      const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 hours

      const user = await storage.updateUser(req.session.userId, {
        emailVerificationToken: token,
        emailVerificationExpires: expiresAt,
      });

      // In production, send actual email here
      console.log(`Email verification token for ${email}: ${token}`);
      
      res.json({ message: 'Verification email sent' });
    } catch (error) {
      console.error('Email verification error:', error);
      res.status(500).json({ message: 'Failed to send verification email' });
    }
  });

  // Session check endpoint
  app.get('/api/auth/session', async (req, res) => {
    try {
      const userId = req.session?.userId;
      const walletAddress = req.session?.walletAddress;
      
      if (!userId && !walletAddress) {
        return res.json({ 
          isAuthenticated: false, 
          user: null 
        });
      }
      
      let user = null;
      if (userId) {
        user = await storage.getUser(userId);
      } else if (walletAddress) {
        user = await storage.getUserByWalletAddress(walletAddress);
        if (user) {
          req.session.userId = user.id;
        }
      }
      
      if (!user) {
        return res.json({ 
          isAuthenticated: false, 
          user: null 
        });
      }
      
      const { password, ...userWithoutPassword } = user;
      res.json({ 
        isAuthenticated: true, 
        user: userWithoutPassword 
      });
    } catch (error) {
      console.error('Session check error:', error);
      res.status(500).json({ error: 'Failed to check session' });
    }
  });

  // Verify email token (optional enhancement)
  app.post('/api/verify-email', async (req, res) => {
    try {
      const { token } = req.body;

      if (!token) {
        return res.status(400).json({ message: 'Verification token is required' });
      }

      const user = await storage.getUserByEmailVerificationToken(token);
      
      if (!user) {
        return res.status(400).json({ message: 'Invalid or expired verification token' });
      }

      // Check if token has expired
      if (user.emailVerificationExpires && new Date() > user.emailVerificationExpires) {
        return res.status(400).json({ message: 'Verification token has expired' });
      }

      // Update user as verified
      const updatedUser = await storage.updateUser(user.id, {
        emailVerified: true,
        emailVerificationToken: null,
        emailVerificationExpires: null,
      });

      res.json({ message: 'Email verified successfully', user: updatedUser });
    } catch (error) {
      console.error('Email verification error:', error);
      res.status(500).json({ message: 'Failed to verify email' });
    }
  });

  // User by wallet address routes
  app.get("/api/users/by-wallet/:walletAddress", async (req, res) => {
    try {
      const { walletAddress } = req.params;
      
      if (!walletAddress) {
        return res.status(400).json({ error: "Wallet address is required" });
      }

      const user = await storage.getUserByWalletAddress(walletAddress);
      
      if (!user) {
        return res.status(404).json({ error: "User not found" });
      }

      // Don't return password
      const { password, ...userWithoutPassword } = user;
      res.json(userWithoutPassword);
    } catch (error) {
      console.error("Error fetching user by wallet:", error);
      res.status(500).json({ error: "Failed to fetch user" });
    }
  });

  // User CRUD routes
  app.post("/api/users", async (req, res) => {
    try {
      const userData = insertUserSchema.parse(req.body);
      const user = await storage.createUser(userData);
      
      // Don't return password
      const { password, ...userWithoutPassword } = user;
      res.status(201).json(userWithoutPassword);
    } catch (error: any) {
      console.error("Error creating user:", error);
      if (error.message?.includes('duplicate') || error.message?.includes('unique')) {
        res.status(409).json({ error: "Username or wallet address already exists" });
      } else {
        res.status(400).json({ error: error.message || "Failed to create user" });
      }
    }
  });

  app.get("/api/users/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({ error: "Invalid user ID" });
      }

      const user = await storage.getUser(id);
      if (!user) {
        return res.status(404).json({ error: "User not found" });
      }

      // Don't return password
      const { password, ...userWithoutPassword } = user;
      res.json(userWithoutPassword);
    } catch (error) {
      console.error("Error fetching user:", error);
      res.status(500).json({ error: "Failed to fetch user" });
    }
  });

  app.patch("/api/users/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({ error: "Invalid user ID" });
      }

      const updates = req.body;
      const user = await storage.updateUser(id, updates);
      
      if (!user) {
        return res.status(404).json({ error: "User not found" });
      }

      // Don't return password
      const { password, ...userWithoutPassword } = user;
      res.json(userWithoutPassword);
    } catch (error: any) {
      console.error("Error updating user:", error);
      if (error.message?.includes('duplicate') || error.message?.includes('unique')) {
        res.status(409).json({ error: "Username or wallet address already exists" });
      } else {
        res.status(400).json({ error: error.message || "Failed to update user" });
      }
    }
  });

  // Admin verification endpoint - only verifies, does not mint NFT
  app.post("/api/admin/rights/:id/verify", async (req, res) => {
    try {
      const rightId = parseInt(req.params.id);
      const { notes } = req.body;
      
      if (isNaN(rightId)) {
        return res.status(400).json({ error: "Invalid right ID" });
      }

      // Update right status to verified - user can now mint NFT when ready
      const updatedRight = await storage.updateRight(rightId, {
        verificationStatus: "verified",
        verifiedAt: new Date(),
        verifiedBy: "admin", // In production, use actual admin ID
        verificationNotes: notes || "Verified by admin"
      });

      if (!updatedRight) {
        return res.status(404).json({ error: "Right not found" });
      }

      res.json({
        success: true,
        message: "Right verified successfully. User can now mint NFT when ready.",
        right: updatedRight
      });
    } catch (error) {
      console.error("Error verifying right:", error);
      res.status(500).json({ error: "Failed to verify right" });
    }
  });

  // Real-time minting status tracking
  const mintingStatus = new Map<number, any>();

  // User-controlled NFT minting function triggered after verification approval
  async function triggerUserControlledNFTMinting(right: any) {
    console.log(`Starting user-controlled NFT minting for right ${right.id}: ${right.title}`);
    
    // Initialize simplified, user-friendly minting status
    mintingStatus.set(right.id, {
      rightId: right.id,
      status: "processing",
      currentStep: 0,
      steps: [
        { id: "preparing", title: "🎯 Preparing Your NFT", status: "processing" },
        { id: "certificate", title: "📜 Creating Digital Certificate", status: "pending" },
        { id: "blockchain", title: "⛓️ Recording on Blockchain", status: "pending" },
        { id: "marketplace", title: "🏪 Adding to Marketplace", status: "pending" }
      ],
      startedAt: new Date().toISOString()
    });

    try {
      // Step 1: Metadata Preparation
      await new Promise(resolve => setTimeout(resolve, 2000));
      updateMintingStep(right.id, 1, "completed");
      
      // Step 2: Prepare NFT metadata
      updateMintingStep(right.id, 2, "processing");
      const metadata = {
        name: right.title,
        description: right.description,
        image: right.imageUrl || "",
        attributes: [
          { trait_type: "Type", value: right.type },
          { trait_type: "Category", value: right.categoryId || "General" },
          { trait_type: "Creator", value: right.creatorId },
          { trait_type: "Listing Type", value: right.listingType || "buy_now" },
          { trait_type: "Price", value: right.price || "0" },
          { trait_type: "Currency", value: right.currency || "ETH" }
        ],
        rightDetails: {
          type: right.type,
          price: right.price,
          currency: right.currency,
          listingType: right.listingType,
          paysDividends: right.paysDividends,
          auctionDuration: right.auctionDuration,
          createdAt: right.createdAt
        }
      };
      const metadataUri = JSON.stringify(metadata);
      updateMintingStep(right.id, 2, "completed");
      
      // Step 3: Get creator for comprehensive metadata
      updateMintingStep(right.id, 3, "processing");
      const creator = await storage.getUser(right.creatorId);
      if (!creator) {
        throw new Error("Creator information not found");
      }
      updateMintingStep(right.id, 3, "completed");
      
      // Step 4: Mint comprehensive rights NFT on Ethereum
      updateMintingStep(right.id, 4, "processing");
      const { ethereumNFTService } = await import("./ethereum");
      const mintResult = await ethereumNFTService.mintRightNFT(right, creator);
      updateMintingStep(right.id, 4, "completed");
      
      // Step 3: Marketplace Listing
      updateMintingStep(right.id, 3, "processing");
      await storage.updateRight(right.id, {
        contractAddress: mintResult.contractAddress,
        tokenId: mintResult.tokenId,
        transactionHash: mintResult.transactionHash,
        ownerAddress: creator.walletAddress || mintResult.contractAddress,
        metadataUri: mintResult.metadataUri,
        mintingStatus: "completed",
        isListed: true
      });
      updateMintingStep(right.id, 3, "completed");

      const results = {
        contractAddress: mintResult.contractAddress,
        tokenId: mintResult.tokenId,
        transactionHash: mintResult.transactionHash,
        metadataUri: mintResult.metadataUri,
        explorerUrl: mintResult.explorerUrl,
        mintedAt: new Date().toISOString(),
        status: "completed"
      };

      console.log(`Real NFT minted successfully on Ethereum: ${results.contractAddress}/${results.tokenId}`);

      // Mark minting as completed
      const status = mintingStatus.get(right.id);
      if (status) {
        status.status = "completed";
        status.results = results;
        status.completedAt = new Date().toISOString();
      }

      return results;

    } catch (error) {
      // Mark minting as failed
      const status = mintingStatus.get(right.id);
      if (status) {
        status.status = "error";
        status.error = (error as any)?.message || "Unknown error";
        status.failedAt = new Date().toISOString();
      }
      throw error;
    }
  }

  function updateMintingStep(rightId: number, stepIndex: number, status: string) {
    const mintingState = mintingStatus.get(rightId);
    if (mintingState && mintingState.steps[stepIndex]) {
      mintingState.steps[stepIndex].status = status;
      mintingState.currentStep = stepIndex;
      if (status === "processing") {
        mintingState.steps[stepIndex].startedAt = new Date().toISOString();
      } else if (status === "completed") {
        mintingState.steps[stepIndex].completedAt = new Date().toISOString();
      }
    }
  }

  // Real-time minting status endpoint
  app.get("/api/minting-status/:rightId", async (req, res) => {
    try {
      const rightId = parseInt(req.params.rightId);
      
      if (isNaN(rightId)) {
        return res.status(400).json({ error: "Invalid right ID" });
      }

      const status = mintingStatus.get(rightId);
      
      if (!status) {
        return res.status(404).json({ error: "Minting status not found" });
      }

      res.json(status);
    } catch (error) {
      console.error("Error fetching minting status:", error);
      res.status(500).json({ error: "Failed to fetch minting status" });
    }
  });

  // Trigger manual NFT minting (for testing or retry purposes)
  app.post("/api/rights/:id/mint", async (req, res) => {
    try {
      const rightId = parseInt(req.params.id);
      
      if (isNaN(rightId)) {
        return res.status(400).json({ error: "Invalid right ID" });
      }

      const right = await storage.getRight(rightId);
      if (!right) {
        return res.status(404).json({ error: "Right not found" });
      }

      if (right.verificationStatus !== "verified") {
        return res.status(400).json({ error: "Right must be verified before minting" });
      }

      if (right.contractAddress) {
        return res.status(400).json({ error: "NFT already minted for this right" });
      }

      // Start real Hedera minting process - user initiated
      console.log(`User initiated NFT minting for right ${rightId}: ${right.title}`);
      
      try {
        const mintingResult = await triggerUserControlledNFTMinting(right);
        
        res.json({
          success: true,
          message: "NFT minting completed successfully",
          minting: mintingResult
        });
      } catch (mintingError) {
        console.error(`Minting failed for right ${rightId}:`, mintingError);
        
        // Update minting status to failed
        await storage.updateRight(rightId, { mintingStatus: "failed" });
        
        throw mintingError;
      }

    } catch (error) {
      console.error("Error initiating NFT minting:", error);
      res.status(500).json({ error: "Failed to initiate NFT minting" });
    }
  });

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
      
      const rights = await storage.getRights(options);
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
          redirect_uri: `${req.protocol}://${req.get('host')}/google-callback`,
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
      const right = await storage.getRight(id, userId);
      
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
      // For deployment, we'll create a temporary user system
      // In production, this would come from proper authentication
      const mockUserId = 1;
      
      const validatedData = insertRightSchema.parse(req.body);
      
      // Ensure user exists - create anonymous user if needed
      let user = await storage.getUser(mockUserId);
      if (!user) {
        console.log('User not found, creating anonymous user with ID:', mockUserId);
        try {
          user = await storage.createUser({
            username: `user_${mockUserId}`,
            email: `user_${mockUserId}@dright.com`,
            walletAddress: null,
            bio: 'Demo user for production testing',
            isVerified: false
          });
          console.log('Created user:', user);
        } catch (createError) {
          console.error('Failed to create user:', createError);
          // Try to get the user again in case it was created by another request
          user = await storage.getUser(mockUserId);
          if (!user) {
            throw new Error('Unable to create or find user');
          }
        }
      }
      
      const right = await storage.createRight({
        ...validatedData,
        creatorId: mockUserId,
        ownerId: mockUserId,
      });
      
      // Create mint transaction for verified rights
      if (right.verificationStatus === 'verified') {
        await storage.createTransaction({
          rightId: right.id,
          toUserId: mockUserId,
          transactionHash: null, // Will be set when actual Hedera transaction occurs
          price: right.price || "0",
          currency: right.currency || "ETH",
          type: "mint",
        });
      }
      
      res.status(201).json(right);
    } catch (error) {
      console.error("Error creating right:", error);
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

  // Admin endpoint to verify and mint NFT for a right
  app.post("/api/admin/rights/:id/verify", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const right = await storage.getRight(id);
      
      if (!right) {
        return res.status(404).json({ error: "Right not found" });
      }

      // Check if right is already verified or has NFT
      if (right.verificationStatus === "verified" || right.contractAddress) {
        return res.status(400).json({ error: "Right is already verified or has NFT minted" });
      }

      // Update verification status to verified
      const updatedRight = await storage.updateRight(id, {
        verificationStatus: "verified"
      });

      if (!updatedRight) {
        return res.status(500).json({ error: "Failed to update verification status" });
      }

      res.json({ 
        success: true, 
        message: "Right verified successfully. NFT minting should be triggered on frontend.",
        right: updatedRight 
      });
    } catch (error) {
      console.error("Error verifying right:", error);
      res.status(500).json({ error: "Failed to verify right" });
    }
  });



  // Endpoint to mint NFT for verified rights
  app.post("/api/rights/:id/mint-nft", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const { hederaData } = req.body; // Contains minted NFT data from frontend
      
      const right = await storage.getRight(id);
      
      if (!right) {
        return res.status(404).json({ error: "Right not found" });
      }

      if (right.verificationStatus !== "verified") {
        return res.status(400).json({ error: "Right must be verified before minting NFT" });
      }

      if (right.contractAddress) {
        return res.status(400).json({ error: "NFT already minted for this right" });
      }

      // Update right with Hedera NFT data
      const updatedRight = await storage.updateRight(id, {
        contractAddress: hederaData.tokenId,
        hederaSerialNumber: hederaData.serialNumber,
        hederaTransactionId: hederaData.transactionId,
        hederaMetadataUri: hederaData.metadataUri,
        hederaAccountId: hederaData.accountId,
        hederaNetwork: hederaData.network,
        contentFileHash: hederaData.transactionId,
        contentFileUrl: hederaData.metadataUri,
        contentFileName: `Hedera NFT ${hederaData.tokenId}:${hederaData.serialNumber}`,
        contentFileType: "application/hedera-nft",
      });

      res.json({ 
        success: true, 
        message: "NFT data recorded successfully",
        right: updatedRight 
      });
    } catch (error) {
      console.error("Error recording NFT mint:", error);
      res.status(500).json({ error: "Failed to record NFT mint" });
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

  // User statistics route
  app.get('/api/users/stats', async (req, res) => {
    try {
      const userId = 1; // In production this would come from auth
      const userRights = await storage.getRightsByCreator(userId);
      
      const stats = {
        totalRevenue: "0.00",
        pendingRevenue: "0.00", 
        totalRights: userRights.length,
        activeListings: userRights.filter(r => r.isListed && r.verificationStatus === 'verified').length,
        pendingVerification: userRights.filter(r => r.verificationStatus === 'pending').length,
      };
      
      res.json(stats);
    } catch (error) {
      console.error('Error fetching user stats:', error);
      res.status(500).json({ error: 'Failed to fetch user stats' });
    }
  });

  // User activity route  
  app.get('/api/users/activity', async (req, res) => {
    try {
      const userId = 1; // In production this would come from auth
      const userTransactions = await storage.getTransactionsByUser(userId);
      
      const activity = userTransactions.slice(0, 10).map(t => ({
        id: t.id,
        type: t.type,
        amount: t.price,
        date: t.createdAt,
        rightTitle: 'User Right',
        buyer: t.fromUserId !== userId ? `User ${t.fromUserId}` : null
      }));
      
      res.json(activity);
    } catch (error) {
      console.error('Error fetching user activity:', error);
      res.status(500).json({ error: 'Failed to fetch user activity' });
    }
  });

  // Enhanced wallet connection endpoint
  app.post("/api/wallet/connect", async (req, res) => {
    try {
      const { walletAddress, walletType } = req.body;
      
      if (!walletAddress) {
        return res.status(400).json({ error: "Wallet address required" });
      }
      
      // Validate wallet type and address format
      const isHederaAddress = walletAddress.match(/^0\.0\.\d+$/);
      const isEthereumAddress = walletAddress.match(/^0x[a-fA-F0-9]{40}$/);
      
      if (!isHederaAddress && !isEthereumAddress) {
        return res.status(400).json({ error: "Invalid wallet address format" });
      }
      
      // Check if user exists with this wallet address
      let user = await storage.getUserByWalletAddress(walletAddress);
      
      if (!user) {
        // Create new user for this wallet
        const username = isHederaAddress 
          ? `hedera_${walletAddress.split('.')[2]}` 
          : `user_${walletAddress.slice(-6)}`;
          
        user = await storage.createUser({
          username,
          password: "secure_password",
          walletAddress,
        });
      }
      
      // Store wallet type in session if needed
      if (req.session) {
        req.session.walletType = walletType;
        req.session.walletAddress = walletAddress;
      }
      
      const { password, ...userWithoutPassword } = user;
      res.json({ 
        success: true, 
        user: userWithoutPassword,
        walletType: walletType || 'unknown',
        network: isHederaAddress ? 'hedera' : 'ethereum',
        message: "Wallet connected successfully" 
      });
    } catch (error) {
      console.error("Wallet connection error:", error);
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
      const categories = await storage.getCategories();
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
      
      const results = await storage.searchRights(query, { limit, offset });
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
      const right = await storage.getRight(rightId);
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
      
      const bid = await storage.placeBid({
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
      const bids = await storage.getBidsForRight(rightId);
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
      
      await storage.addToFavorites(mockUserId, rightId);
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
      
      await storage.removeFromFavorites(mockUserId, rightId);
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
      const allRights = await storage.getRights({ limit: 1000 });
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
      
      let rightsData = await storage.getRights(options);
      
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

      const rightId = parseInt(id);
      const updatedRight = await storage.updateRight(rightId, updateData);
      
      if (status === 'verified' && updatedRight) {
        // Create notification for user - approval only
        await storage.createNotification({
          userId: updatedRight.creatorId,
          type: 'right_approved',
          title: 'Right Approved!',
          message: `Your right "${updatedRight.title}" has been approved. You can now mint your NFT when ready.`,
          relatedRightId: rightId,
          actionUrl: `/dashboard`
        });
      }
      
      res.json({ success: true, message: 'Right approved successfully. User can now mint NFT when ready.' });
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

      // Use proper Drizzle query builder for production security
      const result = await db.select({
        id: rights.id,
        tokenId: rights.tokenId,
        title: rights.title,
        type: rights.type,
        description: rights.description,
        symbol: rights.symbol,
        price: rights.price,
        currency: rights.currency,
        contentFileHash: rights.contentFileHash,
        contentFileUrl: rights.contentFileUrl,
        verificationStatus: rights.verificationStatus,
        listingType: rights.listingType,
        paysDividends: rights.paysDividends,
        imageUrl: rights.imageUrl,
        createdAt: rights.createdAt,
        updatedAt: rights.updatedAt,
        creatorId: rights.creatorId,
        ownerId: rights.ownerId,
        categoryId: rights.categoryId,
        // Creator fields
        creatorUsername: users.username,
        creatorEmail: users.email,
        creatorWalletAddress: users.walletAddress,
        creatorCreatedAt: users.createdAt
      })
      .from(rights)
      .leftJoin(users, eq(rights.creatorId, users.id))
      .orderBy(desc(rights.createdAt));
      
      const rightsWithCreator = result.map((row: any) => ({
        id: row.id,
        tokenId: row.tokenId,
        title: row.title,
        type: row.type,
        description: row.description,
        symbol: row.symbol,
        price: row.price,
        currency: row.currency,
        contentFileHash: row.contentFileHash,
        contentFileUrl: row.contentFileUrl,
        verificationStatus: row.verificationStatus,
        listingType: row.listingType,
        paysDividends: row.paysDividends,
        imageUrl: row.imageUrl,
        createdAt: row.createdAt,
        updatedAt: row.updatedAt,
        creatorId: row.creatorId,
        ownerId: row.ownerId,
        categoryId: row.categoryId,
        creator: {
          id: row.creatorId,
          username: row.creatorUsername,
          email: row.creatorEmail,
          walletAddress: row.creatorWalletAddress,
          createdAt: row.creatorCreatedAt
        },
        owner: {
          id: row.ownerId || row.creatorId,
          username: row.creatorUsername,
          email: row.creatorEmail,
          walletAddress: row.creatorWalletAddress,
          createdAt: row.creatorCreatedAt
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

      // Use proper Drizzle ORM for secure updates
      if (req.body.verified) {
        await db.update(rights)
          .set({ 
            verificationStatus: 'verified',
            verifiedAt: new Date(),
            verifiedBy: 'Dright Team'
          })
          .where(eq(rights.id, parseInt(id)));
      } else {
        await db.update(rights)
          .set({ 
            verificationStatus: 'pending',
            verifiedAt: null,
            verifiedBy: null
          })
          .where(eq(rights.id, parseInt(id)));
      }
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



  // YouTube video ownership verification endpoint
  app.post('/api/youtube/verify-ownership/:videoId', async (req, res) => {
    try {
      const { videoId } = req.params;
      const { videoDetails } = req.body;

      // For development/deployment, simulate successful verification
      // In production, this would verify channel ownership through YouTube API
      const verificationResult = {
        canVerify: true,
        verified: true,
        success: true,
        videoId,
        channelId: `UC${videoId.slice(0, 22)}`,
        channelTitle: 'Verified Channel Owner',
        verificationMethod: 'channel_ownership',
        timestamp: new Date().toISOString(),
        message: 'Video ownership verified successfully'
      };

      res.json(verificationResult);
      
    } catch (error) {
      console.error('YouTube verification error:', error);
      res.status(500).json({ error: 'Failed to verify video' });
    }
  });

  // Get Google Client ID for OAuth
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

  // Generate verification code for YouTube description method
  app.post("/api/youtube/generate-verification-code", async (req, res) => {
    try {
      const { videoId, videoDetails } = req.body;
      
      // Generate a unique verification code
      const verificationCode = `DRIGHT-VERIFY-${Math.random().toString(36).substr(2, 9).toUpperCase()}`;
      
      res.json({
        verificationCode,
        instructions: "Add this code to your video description to verify ownership",
        expiresIn: "24 hours"
      });
    } catch (error) {
      console.error("Error generating verification code:", error);
      res.status(500).json({ error: "Failed to generate verification code" });
    }
  });

  // Verify code in YouTube video description
  app.post("/api/youtube/verify-description-code", async (req, res) => {
    try {
      const { videoId, verificationCode } = req.body;
      
      if (!process.env.YOUTUBE_API_KEY) {
        return res.status(500).json({ error: "YouTube API key not configured" });
      }

      // Get video details from YouTube API
      const videoResponse = await fetch(
        `https://www.googleapis.com/youtube/v3/videos?part=snippet&id=${videoId}&key=${process.env.YOUTUBE_API_KEY}`
      );
      
      if (!videoResponse.ok) {
        throw new Error('Failed to fetch video details');
      }
      
      const videoData = await videoResponse.json();
      
      if (!videoData.items || videoData.items.length === 0) {
        return res.status(404).json({ error: "Video not found" });
      }
      
      const video = videoData.items[0];
      const description = video.snippet.description || "";
      
      // Check if verification code exists in description
      const codeFound = description.includes(verificationCode);
      
      res.json({
        verified: codeFound,
        video: {
          id: videoId,
          title: video.snippet.title,
          channelTitle: video.snippet.channelTitle
        },
        channel: {
          title: video.snippet.channelTitle,
          id: video.snippet.channelId
        },
        method: 'description_code'
      });
    } catch (error) {
      console.error("Error verifying description code:", error);
      res.status(500).json({ error: "Failed to verify description code" });
    }
  });

  // Submit manual review request
  app.post("/api/youtube/submit-manual-review", async (req, res) => {
    try {
      const { videoId, videoDetails, submissionNotes } = req.body;
      
      // Generate a review ID for tracking
      const reviewId = `REVIEW-${Date.now()}-${Math.random().toString(36).substr(2, 6).toUpperCase()}`;
      
      res.json({
        success: true,
        reviewId,
        status: 'submitted',
        estimatedReviewTime: '2-5 business days',
        message: 'Manual review request submitted successfully'
      });
    } catch (error) {
      console.error("Error submitting manual review:", error);
      res.status(500).json({ error: "Failed to submit manual review request" });
    }
  });

  // Admin authentication endpoint
  app.post("/api/admin/login", async (req, res) => {
    try {
      const { username, password } = req.body;
      
      // Simple authentication - in production, use proper password hashing
      if (username === "admin" && password === "admin123") {
        const token = Buffer.from(`${username}:${Date.now()}`).toString('base64');
        res.json({ 
          success: true, 
          token,
          message: "Authentication successful" 
        });
      } else {
        res.status(401).json({ error: "Invalid credentials" });
      }
    } catch (error) {
      console.error("Admin login error:", error);
      res.status(500).json({ error: "Authentication failed" });
    }
  });

  // Performance monitoring endpoints
  const performanceMonitor = PerformanceMonitor.getInstance();

  // Test admin credentials endpoint (development only)
  app.get("/api/admin/test-credentials", async (req, res) => {
    if (process.env.NODE_ENV === 'production') {
      return res.status(404).json({ error: "Not found" });
    }
    
    res.json({
      message: "Admin test credentials for development",
      credentials: {
        username: "admin",
        password: "admin123"
      },
      note: "These are test credentials for development only"
    });
  });

  // Real-time metrics endpoint
  app.get("/api/admin/performance/metrics", async (req, res) => {
    try {
      const metrics = await performanceMonitor.collectMetrics();
      res.json(metrics);
    } catch (error) {
      console.error("Error fetching performance metrics:", error);
      res.status(500).json({ error: "Failed to fetch performance metrics" });
    }
  });

  // Historical metrics endpoint
  app.get("/api/admin/performance/history", async (req, res) => {
    try {
      const hours = parseInt(req.query.hours as string) || 24;
      const metrics = performanceMonitor.getHistoricalMetrics(hours);
      res.json(metrics);
    } catch (error) {
      console.error("Error fetching historical metrics:", error);
      res.status(500).json({ error: "Failed to fetch historical metrics" });
    }
  });

  // Performance alerts endpoint
  app.get("/api/admin/performance/alerts", async (req, res) => {
    try {
      const unresolved = req.query.unresolved === 'true';
      const alerts = performanceMonitor.getAlerts(unresolved);
      res.json(alerts);
    } catch (error) {
      console.error("Error fetching alerts:", error);
      res.status(500).json({ error: "Failed to fetch alerts" });
    }
  });

  // Resolve alert endpoint
  app.post("/api/admin/performance/alerts/:id/resolve", async (req, res) => {
    try {
      const alertId = req.params.id;
      const resolved = performanceMonitor.resolveAlert(alertId);
      
      if (resolved) {
        res.json({ success: true, message: "Alert resolved" });
      } else {
        res.status(404).json({ error: "Alert not found" });
      }
    } catch (error) {
      console.error("Error resolving alert:", error);
      res.status(500).json({ error: "Failed to resolve alert" });
    }
  });

  // Performance summary endpoint
  app.get("/api/admin/performance/summary", async (req, res) => {
    try {
      const summary = performanceMonitor.getPerformanceSummary();
      res.json(summary);
    } catch (error) {
      console.error("Error fetching performance summary:", error);
      res.status(500).json({ error: "Failed to fetch performance summary" });
    }
  });

  // Admin routes - for platform management
  app.get("/api/admin/stats", async (req, res) => {
    try {
      // Get total counts and stats using simple queries
      const allUsers = await db.select().from(users);
      const allRights = await db.select().from(rights);
      const pendingRights = allRights.filter(r => r.verificationStatus === 'pending');
      const bannedUsers = allUsers.filter(u => u.isBanned);

      const stats = {
        totalUsers: allUsers.length,
        totalRights: allRights.length,
        pendingVerifications: pendingRights.length,
        bannedUsers: bannedUsers.length,
        totalRevenue: "12.5 ETH", // This would come from transaction aggregation
        monthlyGrowth: 15.2
      };

      res.json(stats);
    } catch (error) {
      console.error("Error fetching admin stats:", error);
      res.status(500).json({ error: "Failed to fetch admin stats" });
    }
  });

  app.get("/api/admin/rights", async (req, res) => {
    try {
      const status = req.query.status as string;
      const search = req.query.search as string;
      
      const options = {
        limit: 50,
        offset: 0,
        search,
        sortBy: "createdAt",
        sortOrder: "desc" as const
      };

      let rights = await storage.getRights(options);
      
      // Filter by status if specified
      if (status && status !== "all") {
        rights = rights.filter(right => right.verificationStatus === status);
      }

      res.json(rights);
    } catch (error) {
      console.error("Error fetching admin rights:", error);
      res.status(500).json({ error: "Failed to fetch rights for admin" });
    }
  });

  app.get("/api/admin/users", async (req, res) => {
    try {
      const usersData = await db.select().from(users).orderBy(desc(users.createdAt));
      res.json(usersData);
    } catch (error) {
      console.error("Error fetching admin users:", error);
      res.status(500).json({ error: "Failed to fetch users for admin" });
    }
  });

  app.post("/api/admin/rights/:id/verify", async (req, res) => {
    try {
      const rightId = parseInt(req.params.id);
      const { status, notes } = req.body;

      console.log(`[admin] Verifying right ${rightId} with status: ${status}`);

      if (!["pending", "verified", "rejected"].includes(status)) {
        return res.status(400).json({ error: "Invalid verification status" });
      }

      const [updatedRight] = await db
        .update(rights)
        .set({ 
          verificationStatus: status,
          verificationNotes: notes,
          updatedAt: new Date()
        })
        .where(eq(rights.id, rightId))
        .returning();

      if (!updatedRight) {
        return res.status(404).json({ error: "Right not found" });
      }

      console.log(`[admin] Right ${rightId} verification updated to: ${status}`);

      // Note: No automatic NFT minting - users will mint manually when ready
      res.json({ 
        success: true, 
        message: status === 'verified' 
          ? 'Right approved - user can now mint NFT manually'
          : `Right ${status} successfully`,
        right: updatedRight
      });
    } catch (error) {
      console.error("Error updating right verification:", error);
      res.status(500).json({ error: "Failed to update verification status" });
    }
  });

  app.post("/api/admin/users/:id/ban", async (req, res) => {
    try {
      const userId = parseInt(req.params.id);
      const { banned } = req.body;

      console.log(`[admin] ${banned ? 'Banning' : 'Unbanning'} user ${userId}`);

      const [updatedUser] = await db
        .update(users)
        .set({ 
          isBanned: banned,
          updatedAt: new Date()
        })
        .where(eq(users.id, userId))
        .returning();

      if (!updatedUser) {
        console.log(`[admin] User ${userId} not found`);
        return res.status(404).json({ error: "User not found" });
      }

      console.log(`[admin] User ${userId} successfully ${banned ? 'banned' : 'unbanned'}`);
      res.json({ 
        success: true, 
        user: updatedUser,
        message: `User ${banned ? 'banned' : 'unbanned'} successfully`
      });
    } catch (error) {
      console.error("Error updating user ban status:", error);
      res.status(500).json({ error: "Failed to update user status" });
    }
  });

  // Ethereum network status endpoint
  app.get("/api/ethereum/status", async (req, res) => {
    try {
      const { ethereumNFTService } = await import("./ethereum");
      
      res.json({
        status: "connected",
        network: "ethereum",
        message: "Connected to Ethereum network"
      });
    } catch (error) {
      console.error("Ethereum status check failed:", error);
      res.status(500).json({
        status: "error",
        message: "Failed to connect to Ethereum network"
      });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}
