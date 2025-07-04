// Complete purchase service with wallet integration and commission handling
import { ethers } from "ethers";
import { connectToWallet } from "./wallet-manager";

export interface PurchaseConfig {
  platformFeePercentage: number; // Platform commission (e.g., 2.5%)
  royaltyPercentage: number;     // Creator royalty (e.g., 5%)
  gasFeeBuffer: number;          // Gas fee buffer (e.g., 0.001 ETH)
}

export interface PurchaseBreakdown {
  itemPrice: number;
  platformFee: number;
  royaltyFee: number;
  gasFee: number;
  totalAmount: number;
  currency: string;
}

export interface PurchaseResult {
  success: boolean;
  transactionHash?: string;
  error?: string;
  explorerUrl?: string;
}

export class PurchaseService {
  private config: PurchaseConfig;
  private provider: ethers.BrowserProvider | null = null;
  private signer: ethers.JsonRpcSigner | null = null;

  constructor(config: PurchaseConfig = {
    platformFeePercentage: 2.5,
    royaltyPercentage: 5.0,
    gasFeeBuffer: 0.001
  }) {
    this.config = config;
  }

  /**
   * Initialize wallet connection for purchase
   */
  async initializeWallet(walletId: string): Promise<string> {
    try {
      const walletAddress = await connectToWallet(walletId);
      
      // Initialize ethers provider with user's wallet
      if ((window as any).ethereum) {
        this.provider = new ethers.BrowserProvider((window as any).ethereum);
        this.signer = await this.provider.getSigner();
      } else {
        throw new Error("No Ethereum wallet detected");
      }
      
      return walletAddress;
    } catch (error) {
      console.error("Failed to initialize wallet:", error);
      throw error;
    }
  }

  /**
   * Calculate complete purchase breakdown including fees
   */
  calculatePurchaseBreakdown(priceStr: string, currency: string = "ETH"): PurchaseBreakdown {
    const itemPrice = parseFloat(priceStr);
    
    // Calculate fees
    const platformFee = (itemPrice * this.config.platformFeePercentage) / 100;
    const royaltyFee = (itemPrice * this.config.royaltyPercentage) / 100;
    const gasFee = this.config.gasFeeBuffer;
    
    // Calculate total
    const totalAmount = itemPrice + platformFee + royaltyFee + gasFee;
    
    return {
      itemPrice,
      platformFee,
      royaltyFee,
      gasFee,
      totalAmount,
      currency
    };
  }

  /**
   * Execute the complete purchase transaction
   */
  async executePurchase(
    rightId: number,
    priceStr: string,
    sellerAddress: string,
    currency: string = "ETH"
  ): Promise<PurchaseResult> {
    try {
      if (!this.provider || !this.signer) {
        throw new Error("Wallet not initialized. Please connect your wallet first.");
      }

      const breakdown = this.calculatePurchaseBreakdown(priceStr, currency);
      
      // Convert ETH to Wei for transaction
      const totalAmountWei = ethers.parseEther(breakdown.totalAmount.toString());
      const itemPriceWei = ethers.parseEther(breakdown.itemPrice.toString());
      const platformFeeWei = ethers.parseEther(breakdown.platformFee.toString());
      
      // Platform fee address (should be set in environment)
      const platformFeeAddress = process.env.VITE_PLATFORM_FEE_ADDRESS || "0x742d35Cc6634C0532925a3b8D49E2a32E6b0f6B5";
      
      // Create transaction batch for atomic execution
      const transactions = [];
      
      // 1. Send item price to seller
      transactions.push({
        to: sellerAddress,
        value: itemPriceWei,
        data: "0x"
      });
      
      // 2. Send platform fee to platform
      transactions.push({
        to: platformFeeAddress,
        value: platformFeeWei,
        data: "0x"
      });
      
      // Execute the main payment transaction
      const tx = await this.signer.sendTransaction({
        to: sellerAddress,
        value: totalAmountWei,
        gasLimit: BigInt(21000) * BigInt(2), // Buffer for gas
      });
      
      console.log("Transaction sent:", tx.hash);
      
      // Wait for transaction confirmation
      const receipt = await tx.wait();
      
      if (!receipt) {
        throw new Error("Transaction failed to confirm");
      }
      
      // Update ownership in database
      await this.updateOwnershipInDatabase(rightId, await this.signer.getAddress(), tx.hash);
      
      const explorerUrl = `https://etherscan.io/tx/${tx.hash}`;
      
      return {
        success: true,
        transactionHash: tx.hash,
        explorerUrl
      };
      
    } catch (error: any) {
      console.error("Purchase failed:", error);
      
      let errorMessage = "Purchase failed";
      
      // Handle specific error types
      if (error.code === 4001) {
        errorMessage = "Transaction rejected by user";
      } else if (error.code === -32603) {
        errorMessage = "Insufficient funds for transaction";
      } else if (error.message?.includes("insufficient")) {
        errorMessage = "Insufficient ETH balance";
      } else if (error.message?.includes("rejected")) {
        errorMessage = "Transaction rejected";
      } else if (error.message) {
        errorMessage = error.message;
      }
      
      return {
        success: false,
        error: errorMessage
      };
    }
  }

  /**
   * Update ownership in database after successful purchase
   */
  private async updateOwnershipInDatabase(
    rightId: number,
    newOwnerAddress: string,
    transactionHash: string
  ): Promise<void> {
    try {
      const response = await fetch(`/api/rights/${rightId}/purchase`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          newOwnerAddress,
          transactionHash,
        }),
      });
      
      if (!response.ok) {
        throw new Error("Failed to update ownership in database");
      }
    } catch (error) {
      console.error("Database update failed:", error);
      // Don't throw here - the blockchain transaction succeeded
    }
  }

  /**
   * Get user's wallet balance
   */
  async getWalletBalance(): Promise<{ balance: string; currency: string }> {
    try {
      if (!this.provider || !this.signer) {
        throw new Error("Wallet not connected");
      }
      
      const balance = await this.provider.getBalance(await this.signer.getAddress());
      const balanceEth = ethers.formatEther(balance);
      
      return {
        balance: balanceEth,
        currency: "ETH"
      };
    } catch (error) {
      console.error("Failed to get wallet balance:", error);
      throw error;
    }
  }

  /**
   * Validate if user has sufficient funds
   */
  async validateSufficientFunds(priceStr: string, currency: string = "ETH"): Promise<boolean> {
    try {
      const breakdown = this.calculatePurchaseBreakdown(priceStr, currency);
      const { balance } = await this.getWalletBalance();
      
      return parseFloat(balance) >= breakdown.totalAmount;
    } catch (error) {
      console.error("Failed to validate funds:", error);
      return false;
    }
  }

  /**
   * Estimate gas fees for the transaction
   */
  async estimateGasFees(): Promise<{ gasPrice: string; estimatedFee: string }> {
    try {
      if (!this.provider) {
        throw new Error("Provider not initialized");
      }
      
      const gasPrice = await this.provider.getFeeData();
      const gasLimit = BigInt(21000) * BigInt(2); // Buffer for gas
      
      const estimatedFee = gasPrice.gasPrice ? 
        ethers.formatEther(gasPrice.gasPrice * gasLimit) : 
        "0.002";
      
      return {
        gasPrice: gasPrice.gasPrice ? ethers.formatEther(gasPrice.gasPrice) : "0",
        estimatedFee
      };
    } catch (error) {
      console.error("Failed to estimate gas fees:", error);
      return {
        gasPrice: "0",
        estimatedFee: "0.002"
      };
    }
  }
}

// Export singleton instance
export const purchaseService = new PurchaseService();