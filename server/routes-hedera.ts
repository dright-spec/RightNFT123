import type { Express } from "express";
import { hederaNFTService } from "./hedera";

export function registerHederaRoutes(app: Express) {
  // Get Hedera network status
  app.get("/api/hedera/status", async (req, res) => {
    try {
      const accountId = process.env.HEDERA_ACCOUNT_ID;
      const network = process.env.HEDERA_NETWORK || "testnet";
      
      if (!accountId) {
        return res.status(500).json({ 
          status: "error", 
          message: "Hedera credentials not configured" 
        });
      }

      // Try to get account balance to verify connection
      const balance = await hederaNFTService.getAccountBalance(accountId);
      
      res.json({
        status: "connected",
        network,
        accountId,
        balance: balance.hbars,
        message: `Connected to Hedera ${network}`
      });
    } catch (error) {
      console.error("Hedera status check failed:", error);
      res.status(500).json({
        status: "error",
        message: "Failed to connect to Hedera network"
      });
    }
  });

  // Get all Hedera transactions for explorer
  app.get("/api/hedera/transactions", async (req, res) => {
    try {
      // This would typically come from your database
      // For now, return mock data structure
      const transactions = [
        {
          transactionId: "0.0.123456-1234567890-123456789",
          tokenId: "0.0.987654",
          serialNumber: 1,
          type: "mint",
          timestamp: new Date().toISOString(),
          rightTitle: "Sample NFT Right",
          explorerUrl: "https://hashscan.io/testnet/transaction/0.0.123456-1234567890-123456789"
        }
      ];
      
      res.json(transactions);
    } catch (error) {
      console.error("Error fetching Hedera transactions:", error);
      res.status(500).json({ error: "Failed to fetch transactions" });
    }
  });

  // Test NFT minting endpoint
  app.post("/api/hedera/test-mint", async (req, res) => {
    try {
      const { name, symbol, description } = req.body;
      
      if (!name || !symbol) {
        return res.status(400).json({ error: "Name and symbol are required" });
      }

      console.log(`[hedera] Testing NFT creation: ${name} (${symbol})`);

      // Create test NFT token
      const tokenInfo = await hederaNFTService.createNFTToken({
        name: name,
        symbol: symbol,
        memo: description || "Test NFT from Dright platform",
        maxSupply: 10
      });

      // Mint the NFT
      const metadata = JSON.stringify({
        name,
        description: description || "Test NFT from Dright platform",
        image: "",
        attributes: [
          { trait_type: "Type", value: "test" },
          { trait_type: "Platform", value: "Dright" },
          { trait_type: "Created", value: new Date().toISOString() }
        ]
      });

      const mintResult = await hederaNFTService.mintNFT({
        tokenId: tokenInfo.tokenId,
        metadata: metadata
      });

      console.log(`[hedera] Test NFT minted successfully: ${mintResult.tokenId}/${mintResult.serialNumber}`);

      res.json({
        success: true,
        message: "Test NFT minted successfully on Hedera testnet",
        tokenInfo,
        mintResult
      });
    } catch (error: any) {
      console.error("Test minting failed:", error);
      res.status(500).json({
        error: "Test minting failed",
        details: error?.message || "Unknown error"
      });
    }
  });

  // Get token information
  app.get("/api/hedera/token/:tokenId", async (req, res) => {
    try {
      const { tokenId } = req.params;
      
      if (!tokenId || !tokenId.match(/^0\.0\.\d+$/)) {
        return res.status(400).json({ error: "Invalid token ID format" });
      }

      const tokenInfo = await hederaNFTService.getTokenInfo(tokenId);
      res.json(tokenInfo);
    } catch (error: any) {
      console.error("Error fetching token info:", error);
      res.status(500).json({
        error: "Failed to fetch token information",
        details: error?.message || "Unknown error"
      });
    }
  });
}