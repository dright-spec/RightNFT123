import {
  Client,
  TokenCreateTransaction,
  TokenType,
  TokenSupplyType,
  TokenMintTransaction,
  AccountId,
  PrivateKey,
  TokenId,
  TokenNftInfoQuery,
  AccountBalanceQuery,
  TokenAssociateTransaction,
  Hbar
} from '@hashgraph/sdk';
import { hederaWalletManager } from './hedera-wallet-manager';

export interface HederaNFTMetadata {
  title: string;
  description: string;
  type: 'copyright' | 'royalty' | 'access' | 'ownership' | 'license';
  dividends: boolean;
  payout_address: string;
  doc_uri?: string;
  image_uri?: string;
  creator: string;
  created_at: string;
  properties?: Record<string, any>;
}

export interface HederaNFTMintResult {
  transactionId: string;
  tokenId: string;
  serialNumber: number;
  metadataUri: string;
  explorerUrl: string;
}

export interface HederaNFTInfo {
  tokenId: string;
  serialNumber: number;
  accountId: string;
  metadata: HederaNFTMetadata;
  creationTime: string;
}

class HederaNFTService {
  private client: Client | null = null;
  private readonly IPFS_GATEWAY = 'https://ipfs.io/ipfs/';
  
  constructor() {
    this.initializeClient();
  }

  /**
   * Initialize Hedera client based on current network
   */
  private initializeClient(): void {
    const walletInfo = hederaWalletManager.getWalletInfo();
    const network = walletInfo.network || 'testnet';
    
    this.client = network === 'mainnet' ? Client.forMainnet() : Client.forTestnet();
  }

  /**
   * Create a new NFT collection token
   */
  async createNFTToken(params: {
    name: string;
    symbol: string;
    memo?: string;
    royaltyFee?: number; // Percentage (e.g., 5 for 5%)
    royaltyAccount?: string; // Account ID to receive royalties
  }): Promise<string> {
    try {
      const walletInfo = hederaWalletManager.getWalletInfo();
      if (!walletInfo.isConnected || !walletInfo.accountId) {
        throw new Error("Hedera wallet not connected");
      }

      if (!this.client) {
        throw new Error("Hedera client not initialized");
      }

      const treasuryAccountId = AccountId.fromString(walletInfo.accountId);
      
      // Create NFT token
      const tokenCreateTransaction = new TokenCreateTransaction()
        .setTokenName(params.name)
        .setTokenSymbol(params.symbol)
        .setTokenType(TokenType.NonFungibleUnique)
        .setSupplyType(TokenSupplyType.Finite)
        .setMaxSupply(10000) // Maximum number of NFTs that can be minted
        .setTreasuryAccountId(treasuryAccountId)
        .setSupplyKey(treasuryAccountId) // Key required to mint NFTs
        .setAdminKey(treasuryAccountId) // Key required to update token properties
        .setWipeKey(treasuryAccountId) // Key required to wipe tokens from accounts
        .setFreezeDefault(false)
        .setInitialSupply(0); // NFTs start with 0 supply

      // Add memo if provided
      if (params.memo) {
        tokenCreateTransaction.setTokenMemo(params.memo);
      }

      // Add royalty fee if specified
      if (params.royaltyFee && params.royaltyAccount) {
        const royaltyFeeSchedule = [
          {
            numerator: Math.floor(params.royaltyFee * 100), // Convert percentage to basis points
            denominator: 10000,
            feeCollectorAccountId: AccountId.fromString(params.royaltyAccount),
            fallbackFee: Hbar.fromTinybars(0)
          }
        ];
        tokenCreateTransaction.setCustomFees(royaltyFeeSchedule);
      }

      // Execute transaction through wallet
      const result = await this.executeTransaction(tokenCreateTransaction);
      
      return result.tokenId;
      
    } catch (error) {
      console.error("Failed to create NFT token:", error);
      throw new Error(`NFT token creation failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Mint a new NFT with metadata
   */
  async mintNFT(params: {
    tokenId: string;
    metadata: HederaNFTMetadata;
    metadataUri: string;
  }): Promise<HederaNFTMintResult> {
    try {
      const walletInfo = hederaWalletManager.getWalletInfo();
      if (!walletInfo.isConnected || !walletInfo.accountId) {
        throw new Error("Hedera wallet not connected");
      }

      if (!this.client) {
        throw new Error("Hedera client not initialized");
      }

      // Create metadata bytes from URI
      const metadataBytes = Buffer.from(params.metadataUri, 'utf8');

      // Mint NFT
      const tokenMintTransaction = new TokenMintTransaction()
        .setTokenId(TokenId.fromString(params.tokenId))
        .setMetadata([metadataBytes]); // Hedera stores metadata as bytes

      // Execute transaction
      const result = await this.executeTransaction(tokenMintTransaction);
      
      const explorerUrl = this.getExplorerUrl(result.transactionId, walletInfo.network || 'testnet');

      return {
        transactionId: result.transactionId,
        tokenId: params.tokenId,
        serialNumber: result.serialNumber || 1, // First NFT gets serial number 1
        metadataUri: params.metadataUri,
        explorerUrl
      };
      
    } catch (error) {
      console.error("Failed to mint NFT:", error);
      throw new Error(`NFT minting failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Get NFT information
   */
  async getNFTInfo(tokenId: string, serialNumber: number): Promise<HederaNFTInfo | null> {
    try {
      if (!this.client) {
        throw new Error("Hedera client not initialized");
      }

      const nftInfoQuery = new TokenNftInfoQuery()
        .setNftId(TokenId.fromString(tokenId).nft(serialNumber));

      const nftInfo = await nftInfoQuery.execute(this.client);
      
      if (!nftInfo || nftInfo.length === 0) {
        return null;
      }

      const info = nftInfo[0];
      
      // Parse metadata from bytes
      let metadata: HederaNFTMetadata;
      try {
        const metadataString = Buffer.from(info.metadata).toString('utf8');
        
        // If it's a URI, fetch the metadata
        if (metadataString.startsWith('http') || metadataString.startsWith('ipfs://')) {
          const metadataUrl = metadataString.startsWith('ipfs://') 
            ? metadataString.replace('ipfs://', this.IPFS_GATEWAY)
            : metadataString;
          
          const response = await fetch(metadataUrl);
          metadata = await response.json();
        } else {
          // Direct JSON metadata
          metadata = JSON.parse(metadataString);
        }
      } catch (error) {
        console.error("Failed to parse NFT metadata:", error);
        // Fallback metadata
        metadata = {
          title: "Unknown NFT",
          description: "Metadata unavailable",
          type: "ownership",
          dividends: false,
          payout_address: "",
          creator: "Unknown",
          created_at: new Date().toISOString()
        };
      }

      return {
        tokenId,
        serialNumber,
        accountId: info.accountId.toString(),
        metadata,
        creationTime: info.creationTime.toDate().toISOString()
      };
      
    } catch (error) {
      console.error("Failed to get NFT info:", error);
      return null;
    }
  }

  /**
   * Get all NFTs owned by an account
   */
  async getAccountNFTs(accountId: string): Promise<HederaNFTInfo[]> {
    try {
      if (!this.client) {
        throw new Error("Hedera client not initialized");
      }

      const accountBalanceQuery = new AccountBalanceQuery()
        .setAccountId(AccountId.fromString(accountId));

      const balance = await accountBalanceQuery.execute(this.client);
      const nfts: HederaNFTInfo[] = [];

      // Iterate through token balances to find NFTs
      if (balance.tokens) {
        for (const [tokenIdString, tokenBalance] of balance.tokens) {
          // For NFTs, get each individual token
          for (let serial = 1; serial <= tokenBalance.toNumber(); serial++) {
            const nftInfo = await this.getNFTInfo(tokenIdString, serial);
            if (nftInfo) {
              nfts.push(nftInfo);
            }
          }
        }
      }

      return nfts;
      
    } catch (error) {
      console.error("Failed to get account NFTs:", error);
      return [];
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

      const result = await this.executeTransaction(tokenAssociateTransaction);
      
      return result.transactionId;
      
    } catch (error) {
      console.error("Token association failed:", error);
      throw new Error(`Token association failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Upload metadata to IPFS and return URI
   */
  async uploadMetadataToIPFS(metadata: HederaNFTMetadata): Promise<string> {
    try {
      // This would integrate with an IPFS service
      // For now, return a mock IPFS URI
      const metadataJson = JSON.stringify(metadata, null, 2);
      console.log('Uploading metadata to IPFS:', metadataJson);
      
      // Mock IPFS hash
      const mockHash = 'Qm' + Math.random().toString(36).substring(2, 48);
      return `ipfs://${mockHash}`;
      
    } catch (error) {
      console.error("Failed to upload metadata to IPFS:", error);
      throw new Error("Failed to upload metadata to IPFS");
    }
  }

  /**
   * Execute transaction through the wallet manager
   */
  private async executeTransaction(transaction: any): Promise<{ transactionId: string; tokenId?: string; serialNumber?: number }> {
    try {
      // This would use the wallet manager to sign and submit the transaction
      console.log('Executing Hedera NFT transaction:', transaction);
      
      // Mock transaction result for development
      const mockTransactionId = `0.0.${Math.floor(Math.random() * 1000000)}@${Date.now()}.${Math.floor(Math.random() * 1000000)}`;
      const mockTokenId = `0.0.${Math.floor(Math.random() * 1000000)}`;
      
      return {
        transactionId: mockTransactionId,
        tokenId: mockTokenId,
        serialNumber: 1
      };
      
    } catch (error) {
      console.error('NFT transaction execution failed:', error);
      throw error;
    }
  }

  /**
   * Get Hedera explorer URL
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
}

// Export singleton instance
export const hederaNFTService = new HederaNFTService();