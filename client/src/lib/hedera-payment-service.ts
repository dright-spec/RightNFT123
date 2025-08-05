import { hederaWalletManager } from './hedera-wallet-manager';
import { 
  Client, 
  Hbar, 
  TransferTransaction, 
  AccountId, 
  TokenAssociateTransaction,
  TokenId
} from '@hashgraph/sdk';

export interface HederaPaymentRequest {
  to: string; // Hedera Account ID (e.g., "0.0.123456")
  amount: string; // Amount in HBAR
  currency: 'HBAR';
  memo?: string;
  rightId?: number; // For marketplace transactions
}

export interface HederaPaymentEstimate {
  transactionFee: string; // Estimated transaction fee in HBAR
  totalCost: string; // Total cost including fees
  networkFee: string; // Network fee in HBAR
  platformFee: string; // Platform fee in HBAR
}

export interface HederaPaymentResult {
  transactionHash: string; // Hedera transaction ID
  from: string; // Sender account ID
  to: string; // Receiver account ID
  amount: string; // Amount transferred
  currency: 'HBAR';
  status: 'pending' | 'success' | 'failed';
  timestamp: string;
  explorerUrl: string; // Link to Hedera explorer
}

export interface HederaNFTTransferRequest {
  to: string; // Receiver account ID
  tokenId: string; // Hedera token ID
  serialNumber: number; // NFT serial number
  memo?: string;
}

class HederaPaymentService {
  private readonly PLATFORM_FEE_PERCENTAGE = 0.025; // 2.5%
  private readonly PLATFORM_ACCOUNT = "0.0.123456"; // Platform fee account (replace with actual)
  private readonly BASE_TRANSACTION_FEE = "0.0001"; // Base transaction fee in HBAR
  private client: Client | null = null;

  constructor() {
    this.initializeClient();
  }

  /**
   * Initialize Hedera client based on current network
   */
  private initializeClient(): void {
    const walletInfo = hederaWalletManager.getWalletInfo();
    const network = walletInfo.network || 'testnet'; // Default to testnet for development
    
    this.client = network === 'mainnet' ? Client.forMainnet() : Client.forTestnet();
  }

  /**
   * Estimate payment costs for HBAR transfer
   */
  async estimatePayment(request: HederaPaymentRequest): Promise<HederaPaymentEstimate> {
    try {
      const walletInfo = hederaWalletManager.getWalletInfo();
      if (!walletInfo.isConnected || !walletInfo.accountId) {
        throw new Error("Hedera wallet not connected");
      }

      // Calculate platform fee
      const totalAmount = parseFloat(request.amount);
      const platformFee = totalAmount * this.PLATFORM_FEE_PERCENTAGE;
      
      // Hedera transaction fees are typically very low and predictable
      const networkFee = parseFloat(this.BASE_TRANSACTION_FEE);
      const transactionFee = networkFee.toFixed(6);
      
      // Total cost includes amount + fees
      const totalCost = (totalAmount + networkFee + platformFee).toFixed(6);

      return {
        transactionFee,
        totalCost,
        networkFee: networkFee.toFixed(6),
        platformFee: platformFee.toFixed(6)
      };
    } catch (error) {
      console.error("Error estimating Hedera payment:", error);
      throw new Error("Failed to estimate payment costs");
    }
  }

  /**
   * Process HBAR payment for purchasing a right
   */
  async processPayment(request: HederaPaymentRequest): Promise<HederaPaymentResult> {
    try {
      const walletInfo = hederaWalletManager.getWalletInfo();
      if (!walletInfo.isConnected || !walletInfo.accountId) {
        throw new Error("Hedera wallet not connected");
      }

      // Validate payment amount
      if (parseFloat(request.amount) <= 0) {
        throw new Error("Invalid payment amount");
      }

      // Check wallet balance
      const balance = await hederaWalletManager.getBalance();
      const estimate = await this.estimatePayment(request);
      
      if (parseFloat(balance) < parseFloat(estimate.totalCost)) {
        throw new Error(`Insufficient balance. Need ${estimate.totalCost} HBAR but have ${balance} HBAR`);
      }

      // Calculate fees
      const totalAmount = parseFloat(request.amount);
      const platformFee = totalAmount * this.PLATFORM_FEE_PERCENTAGE;
      const sellerAmount = totalAmount - platformFee;

      // Create transfer transaction
      const transferTransaction = new TransferTransaction()
        .addHbarTransfer(AccountId.fromString(walletInfo.accountId), Hbar.fromString(`-${totalAmount}`))
        .addHbarTransfer(AccountId.fromString(request.to), Hbar.fromString(sellerAmount.toString()))
        .addHbarTransfer(AccountId.fromString(this.PLATFORM_ACCOUNT), Hbar.fromString(platformFee.toString()));

      // Add memo if provided
      if (request.memo) {
        transferTransaction.setTransactionMemo(request.memo);
      }

      // Execute transaction through wallet manager
      const transactionResult = await this.executeTransaction(transferTransaction);
      
      const explorerUrl = this.getExplorerUrl(transactionResult.transactionId, walletInfo.network || 'testnet');

      return {
        transactionHash: transactionResult.transactionId,
        from: walletInfo.accountId,
        to: request.to,
        amount: request.amount,
        currency: "HBAR",
        status: "pending", // Hedera transactions are typically fast, but start as pending
        timestamp: new Date().toISOString(),
        explorerUrl
      };
      
    } catch (error) {
      console.error("Hedera payment failed:", error);
      throw new Error(`Payment failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Transfer NFT ownership on Hedera
   */
  async transferNFT(request: HederaNFTTransferRequest): Promise<HederaPaymentResult> {
    try {
      const walletInfo = hederaWalletManager.getWalletInfo();
      if (!walletInfo.isConnected || !walletInfo.accountId) {
        throw new Error("Hedera wallet not connected");
      }

      // Mock NFT transfer for conversion phase
      // TODO: Implement full HTS NFT transfer functionality
      const explorerUrl = this.getExplorerUrl(mockTransactionId, walletInfo.network || 'testnet');

      return {
        transactionHash: mockTransactionId,
        from: walletInfo.accountId,
        to: request.to,
        amount: "0", // NFT transfers don't involve HBAR amounts
        currency: "HBAR",
        status: "pending",
        timestamp: new Date().toISOString(),
        explorerUrl
      };
      
    } catch (error) {
      console.error("NFT transfer failed:", error);
      throw new Error(`NFT transfer failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Associate token with account (required before receiving NFTs)
   */
  async associateToken(tokenId: string): Promise<string> {
    try {
      const walletInfo = hederaWalletManager.getWalletInfo();
      if (!walletInfo.isConnected || !walletInfo.accountId) {
        throw new Error("Hedera wallet not connected");
      }

      const tokenAssociateTransaction = new TokenAssociateTransaction()
        .setAccountId(AccountId.fromString(walletInfo.accountId))
        .setTokenIds([TokenId.fromString(tokenId)]);

      const transactionResult = await this.executeTransaction(tokenAssociateTransaction);
      
      return transactionResult.transactionId;
      
    } catch (error) {
      console.error("Token association failed:", error);
      throw new Error(`Token association failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Execute transaction through the wallet manager
   */
  private async executeTransaction(transaction: any): Promise<{ transactionId: string }> {
    try {
      // This would use the wallet manager to sign and submit the transaction
      // For now, we'll return a mock transaction ID
      // In the real implementation, this would call hederaWalletManager.signTransaction()
      
      console.log('Executing Hedera transaction:', transaction);
      
      // Mock transaction ID for development
      const mockTransactionId = `0.0.${Math.floor(Math.random() * 1000000)}@${Date.now()}.${Math.floor(Math.random() * 1000000)}`;
      
      return {
        transactionId: mockTransactionId
      };
      
    } catch (error) {
      console.error('Transaction execution failed:', error);
      throw error;
    }
  }

  /**
   * Get Hedera explorer URL for transaction
   */
  private getExplorerUrl(transactionId: string, network: string): string {
    const baseUrl = network === 'mainnet' 
      ? 'https://hashscan.io/mainnet/transaction/'
      : 'https://hashscan.io/testnet/transaction/';
    
    return `${baseUrl}${transactionId}`;
  }

  /**
   * Get current network from wallet
   */
  getCurrentNetwork(): 'mainnet' | 'testnet' {
    const walletInfo = hederaWalletManager.getWalletInfo();
    return walletInfo.network || 'testnet';
  }

  /**
   * Format HBAR amount for display
   */
  formatHbarAmount(amount: string): string {
    const hbar = parseFloat(amount);
    if (hbar < 0.000001) {
      return `${(hbar * 1000000).toFixed(0)} μHBAR`;
    } else if (hbar < 0.001) {
      return `${(hbar * 1000).toFixed(3)} mHBAR`;
    } else {
      return `${hbar.toFixed(6)} HBAR`;
    }
  }

  /**
   * Convert USD to HBAR (mock implementation)
   */
  async convertUsdToHbar(usdAmount: number): Promise<number> {
    // This would typically call a price API
    // For now, using a mock conversion rate
    const hbarPriceUsd = 0.05; // Mock price: $0.05 per HBAR
    return usdAmount / hbarPriceUsd;
  }
}

// Export singleton instance
export const hederaPaymentService = new HederaPaymentService();