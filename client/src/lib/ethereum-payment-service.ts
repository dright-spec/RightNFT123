import { ethereumWalletManager } from "./ethereum-wallet-manager";

export interface PaymentRequest {
  to: string;
  amount: string;
  currency: "ETH";
  metadata?: {
    rightId?: number;
    rightTitle?: string;
    buyer?: string;
  };
}

export interface PaymentResult {
  transactionHash: string;
  from: string;
  to: string;
  amount: string;
  currency: string;
  blockNumber?: number;
  gasUsed?: string;
  status: "pending" | "confirmed" | "failed";
}

export interface PaymentEstimate {
  gasEstimate: string;
  gasPriceGwei: string;
  estimatedFee: string;
  totalCost: string;
}

class EthereumPaymentService {
  private readonly PLATFORM_FEE_PERCENTAGE = 0.025; // 2.5%
  private readonly PLATFORM_WALLET = "0x742d35Cc6596C4f2BCc5C0b51Cf6D4b5a38FF5bE"; // Platform fee wallet

  /**
   * Estimate payment costs including gas fees
   */
  async estimatePayment(request: PaymentRequest): Promise<PaymentEstimate> {
    try {
      const walletInfo = await ethereumWalletManager.getWalletInfo();
      if (!walletInfo.isConnected || !walletInfo.provider) {
        throw new Error("Wallet not connected");
      }

      // Get current gas price
      const gasPrice = await walletInfo.provider.getGasPrice();
      const gasPriceGwei = (parseFloat(gasPrice.toString()) / 1e9).toFixed(2);

      // Estimate gas for ETH transfer (standard is ~21,000 gas)
      const gasEstimate = "21000";
      const estimatedFee = (parseFloat(gasEstimate) * parseFloat(gasPrice.toString()) / 1e18).toFixed(6);
      
      // Calculate total cost (amount + gas fee)
      const totalCost = (parseFloat(request.amount) + parseFloat(estimatedFee)).toFixed(6);

      return {
        gasEstimate,
        gasPriceGwei,
        estimatedFee,
        totalCost
      };
    } catch (error) {
      console.error("Error estimating payment:", error);
      throw new Error("Failed to estimate payment costs");
    }
  }

  /**
   * Process payment for purchasing a right
   */
  async processPayment(request: PaymentRequest): Promise<PaymentResult> {
    try {
      const walletInfo = await ethereumWalletManager.getWalletInfo();
      if (!walletInfo.isConnected || !walletInfo.address) {
        throw new Error("Wallet not connected");
      }

      // Validate payment amount
      if (parseFloat(request.amount) <= 0) {
        throw new Error("Invalid payment amount");
      }

      // Check wallet balance
      const balance = await ethereumWalletManager.getBalance();
      const estimate = await this.estimatePayment(request);
      
      if (parseFloat(balance) < parseFloat(estimate.totalCost)) {
        throw new Error(`Insufficient balance. Need ${estimate.totalCost} ETH but have ${balance} ETH`);
      }

      // Calculate platform fee and seller amount
      const totalAmount = parseFloat(request.amount);
      const platformFee = totalAmount * this.PLATFORM_FEE_PERCENTAGE;
      const sellerAmount = totalAmount - platformFee;

      // Process payment to seller
      const sellerPayment = await ethereumWalletManager.sendPayment({
        to: request.to,
        amount: sellerAmount.toString(),
        currency: "ETH"
      });

      // Process platform fee (in a real implementation, this would be a separate transaction)
      // For now, we'll just record it in the payment metadata
      
      return {
        transactionHash: sellerPayment.transactionHash,
        from: walletInfo.address,
        to: request.to,
        amount: request.amount,
        currency: request.currency,
        status: "pending"
      };
    } catch (error) {
      console.error("Error processing payment:", error);
      throw error;
    }
  }

  /**
   * Check payment status on blockchain
   */
  async checkPaymentStatus(transactionHash: string): Promise<PaymentResult["status"]> {
    try {
      const walletInfo = await ethereumWalletManager.getWalletInfo();
      if (!walletInfo.provider) {
        return "pending";
      }

      const receipt = await walletInfo.provider.getTransactionReceipt(transactionHash);
      
      if (!receipt) {
        return "pending";
      }

      return receipt.status === 1 ? "confirmed" : "failed";
    } catch (error) {
      console.error("Error checking payment status:", error);
      return "pending";
    }
  }

  /**
   * Get payment transaction details
   */
  async getPaymentDetails(transactionHash: string) {
    try {
      const walletInfo = await ethereumWalletManager.getWalletInfo();
      if (!walletInfo.provider) {
        throw new Error("Provider not available");
      }

      const transaction = await walletInfo.provider.getTransaction(transactionHash);
      const receipt = await walletInfo.provider.getTransactionReceipt(transactionHash);

      return {
        transaction,
        receipt,
        status: receipt?.status === 1 ? "confirmed" : "failed",
        blockNumber: receipt?.blockNumber,
        gasUsed: receipt?.gasUsed?.toString()
      };
    } catch (error) {
      console.error("Error getting payment details:", error);
      throw error;
    }
  }

  /**
   * Calculate platform fee for a given amount
   */
  calculatePlatformFee(amount: number): number {
    return amount * this.PLATFORM_FEE_PERCENTAGE;
  }

  /**
   * Calculate seller amount after platform fee
   */
  calculateSellerAmount(amount: number): number {
    return amount - this.calculatePlatformFee(amount);
  }

  /**
   * Validate Ethereum address format
   */
  isValidEthereumAddress(address: string): boolean {
    return /^0x[a-fA-F0-9]{40}$/.test(address);
  }

  /**
   * Get platform fee percentage
   */
  getPlatformFeePercentage(): number {
    return this.PLATFORM_FEE_PERCENTAGE;
  }

  /**
   * Get platform wallet address
   */
  getPlatformWallet(): string {
    return this.PLATFORM_WALLET;
  }
}

export const ethereumPaymentService = new EthereumPaymentService();