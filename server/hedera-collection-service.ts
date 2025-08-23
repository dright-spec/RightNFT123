import {
  Client,
  TokenCreateTransaction,
  TokenType,
  TokenSupplyType,
  AccountId,
  PrivateKey,
  PublicKey
} from "@hashgraph/sdk";

export interface CollectionCreationParams {
  userAccountId: string; // e.g., "0.0.1234567"
  userName: string;
  supplyKey: PrivateKey; // Platform's supply key for minting
}

export interface CollectionCreationResult {
  tokenId: string;
  transactionId: string;
  treasuryAccountId: string;
}

export class HederaCollectionService {
  private client: Client;
  private operatorId: AccountId;
  private operatorKey: PrivateKey;

  constructor() {
    // Initialize Hedera client for mainnet
    this.client = Client.forMainnet();
    
    // These would normally come from environment variables
    // For now, we'll set them up when the operator keys are provided
    const operatorIdStr = process.env.HEDERA_OPERATOR_ID;
    const operatorKeyStr = process.env.HEDERA_OPERATOR_KEY;
    
    if (!operatorIdStr || !operatorKeyStr) {
      throw new Error("Missing HEDERA_OPERATOR_ID or HEDERA_OPERATOR_KEY environment variables");
    }
    
    this.operatorId = AccountId.fromString(operatorIdStr);
    this.operatorKey = PrivateKey.fromString(operatorKeyStr);
    
    // Set operator for the client
    this.client.setOperator(this.operatorId, this.operatorKey);
  }

  /**
   * Create a dedicated NFT collection for a user
   */
  async createUserCollection(params: CollectionCreationParams): Promise<CollectionCreationResult> {
    const { userAccountId, userName, supplyKey } = params;
    
    console.log(`Creating NFT collection for user ${userName} (${userAccountId})`);
    
    try {
      // Generate unique token name and symbol
      const tokenName = `${userName} Rights Collection`;
      const tokenSymbol = this.generateTokenSymbol(userName);
      
      console.log(`Token details: ${tokenName} (${tokenSymbol})`);
      
      // Create the collection token
      const tokenCreateTx = await new TokenCreateTransaction()
        .setTokenName(tokenName)
        .setTokenSymbol(tokenSymbol)
        .setTokenType(TokenType.NonFungibleUnique)
        .setSupplyType(TokenSupplyType.Infinite)
        .setTreasuryAccountId(AccountId.fromString(userAccountId))
        .setSupplyKey(supplyKey.publicKey) // Platform controls minting
        .setAdminKey(this.operatorKey.publicKey) // Platform can manage token
        .freezeWith(this.client);
      
      // Sign with both operator (pays fee) and supply key (required for supply key)
      const operatorSigned = await tokenCreateTx.sign(this.operatorKey);
      const signedTx = await operatorSigned.sign(supplyKey);
      
      console.log('Submitting token creation transaction...');
      const response = await signedTx.execute(this.client);
      
      console.log('Waiting for receipt...');
      const receipt = await response.getReceipt(this.client);
      
      const tokenId = receipt.tokenId;
      if (!tokenId) {
        throw new Error('Token creation failed - no token ID returned');
      }
      
      console.log(`Collection created successfully! Token ID: ${tokenId.toString()}`);
      
      return {
        tokenId: tokenId.toString(),
        transactionId: response.transactionId.toString(),
        treasuryAccountId: userAccountId
      };
      
    } catch (error) {
      console.error('Failed to create user collection:', error);
      throw new Error(`Collection creation failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }
  
  /**
   * Generate a unique token symbol for the user
   */
  private generateTokenSymbol(userName: string): string {
    // Take first 3 characters of username, uppercase, add 'R' for Rights
    const baseSymbol = userName.substring(0, 3).toUpperCase() + 'R';
    
    // Add timestamp suffix to ensure uniqueness
    const timestamp = Date.now().toString().slice(-4);
    
    return `${baseSymbol}${timestamp}`;
  }
  
  /**
   * Get collection info
   */
  async getCollectionInfo(tokenId: string) {
    try {
      // Use TokenInfoQuery to get token information
      const { TokenInfoQuery } = await import("@hashgraph/sdk");
      const tokenInfoQuery = new TokenInfoQuery().setTokenId(tokenId);
      const tokenInfo = await tokenInfoQuery.execute(this.client);
      
      return {
        tokenId: tokenInfo.tokenId.toString(),
        name: tokenInfo.name,
        symbol: tokenInfo.symbol,
        totalSupply: tokenInfo.totalSupply.toString(),
        treasuryAccountId: tokenInfo.treasuryAccountId?.toString() || '',
        supplyKey: tokenInfo.supplyKey?.toString(),
        adminKey: tokenInfo.adminKey?.toString()
      };
    } catch (error) {
      console.error('Failed to get collection info:', error);
      throw error;
    }
  }
}

// Export singleton instance
export const hederaCollectionService = new HederaCollectionService();