import {
  Client,
  AccountId,
  PrivateKey,
  TokenCreateTransaction,
  TokenType,
  TokenSupplyType,
  TokenMintTransaction,
  TokenInfoQuery,
  Hbar,
  TransferTransaction,
  TokenAssociateTransaction,
  AccountBalanceQuery,
} from "@hashgraph/sdk";

// Hedera client configuration
let client: Client;

export function initializeHederaClient() {
  if (client) return client;

  const accountId = process.env.HEDERA_ACCOUNT_ID;
  const privateKey = process.env.HEDERA_PRIVATE_KEY;
  const network = process.env.HEDERA_NETWORK || "testnet";

  if (!accountId || !privateKey) {
    throw new Error("Hedera credentials not configured. Please set HEDERA_ACCOUNT_ID and HEDERA_PRIVATE_KEY");
  }

  try {
    // Initialize client for testnet or mainnet
    if (network === "mainnet") {
      client = Client.forMainnet();
    } else {
      client = Client.forTestnet();
    }

    client.setOperator(AccountId.fromString(accountId), PrivateKey.fromString(privateKey));
    
    console.log(`[hedera] Client initialized for ${network} with account ${accountId}`);
    return client;
  } catch (error) {
    console.error("[hedera] Failed to initialize client:", error);
    throw error;
  }
}

export interface NFTTokenInfo {
  tokenId: string;
  name: string;
  symbol: string;
  totalSupply: number;
  decimals: number;
  treasury: string;
}

export interface NFTMintResult {
  tokenId: string;
  serialNumber: number;
  transactionId: string;
  metadataUri: string;
  explorerUrl: string;
}

export class HederaNFTService {
  private client: Client;

  constructor() {
    this.client = initializeHederaClient();
  }

  /**
   * Create a new NFT token for rights tokenization
   */
  async createNFTToken(params: {
    name: string;
    symbol: string;
    memo: string;
    maxSupply?: number;
  }): Promise<NFTTokenInfo> {
    try {
      console.log(`[hedera] Creating NFT token: ${params.name} (${params.symbol})`);

      const tokenCreateTx = new TokenCreateTransaction()
        .setTokenName(params.name)
        .setTokenSymbol(params.symbol)
        .setTokenType(TokenType.NonFungibleUnique)
        .setSupplyType(TokenSupplyType.Finite)
        .setInitialSupply(0)
        .setMaxSupply(params.maxSupply || 1000)
        .setDecimals(0)
        .setTreasuryAccountId(this.client.operatorAccountId!)
        .setAdminKey(this.client.operatorPublicKey!)
        .setSupplyKey(this.client.operatorPublicKey!)
        .setTokenMemo(params.memo)
        .freezeWith(this.client);

      const tokenCreateSign = await tokenCreateTx.sign(PrivateKey.fromString(process.env.HEDERA_PRIVATE_KEY!));
      const tokenCreateSubmit = await tokenCreateSign.execute(this.client);
      const tokenCreateRx = await tokenCreateSubmit.getReceipt(this.client);
      
      const tokenId = tokenCreateRx.tokenId!.toString();
      
      console.log(`[hedera] NFT token created successfully: ${tokenId}`);

      return {
        tokenId,
        name: params.name,
        symbol: params.symbol,
        totalSupply: 0,
        decimals: 0,
        treasury: this.client.operatorAccountId!.toString()
      };
    } catch (error) {
      console.error("[hedera] Error creating NFT token:", error);
      throw error;
    }
  }

  /**
   * Mint an NFT with metadata
   */
  async mintNFT(params: {
    tokenId: string;
    metadata: string; // IPFS hash or metadata URI
    recipientAccountId?: string;
  }): Promise<NFTMintResult> {
    try {
      console.log(`[hedera] Minting NFT for token ${params.tokenId}`);

      // Convert metadata to bytes if it's a string
      const metadataBytes = Buffer.from(params.metadata, 'utf8');

      const tokenMintTx = new TokenMintTransaction()
        .setTokenId(params.tokenId)
        .addMetadata(metadataBytes)
        .freezeWith(this.client);

      const tokenMintSign = await tokenMintTx.sign(PrivateKey.fromString(process.env.HEDERA_PRIVATE_KEY!));
      const tokenMintSubmit = await tokenMintSign.execute(this.client);
      const tokenMintRx = await tokenMintSubmit.getReceipt(this.client);

      const serialNumber = tokenMintRx.serials[0].toNumber();
      const transactionId = tokenMintSubmit.transactionId.toString();

      console.log(`[hedera] NFT minted successfully: ${params.tokenId}/${serialNumber}`);

      // Transfer to recipient if specified
      if (params.recipientAccountId && params.recipientAccountId !== this.client.operatorAccountId!.toString()) {
        await this.transferNFT({
          tokenId: params.tokenId,
          serialNumber,
          fromAccountId: this.client.operatorAccountId!.toString(),
          toAccountId: params.recipientAccountId
        });
      }

      const network = process.env.HEDERA_NETWORK || "testnet";
      const explorerUrl = network === "mainnet" 
        ? `https://hashscan.io/mainnet/transaction/${transactionId}`
        : `https://hashscan.io/testnet/transaction/${transactionId}`;

      return {
        tokenId: params.tokenId,
        serialNumber,
        transactionId,
        metadataUri: params.metadata,
        explorerUrl
      };
    } catch (error) {
      console.error("[hedera] Error minting NFT:", error);
      throw error;
    }
  }

  /**
   * Transfer NFT to another account
   */
  async transferNFT(params: {
    tokenId: string;
    serialNumber: number;
    fromAccountId: string;
    toAccountId: string;
  }): Promise<string> {
    try {
      console.log(`[hedera] Transferring NFT ${params.tokenId}/${params.serialNumber} to ${params.toAccountId}`);

      // First, associate the token with the recipient account if needed
      try {
        const associateTx = new TokenAssociateTransaction()
          .setAccountId(params.toAccountId)
          .setTokenIds([params.tokenId])
          .freezeWith(this.client);

        const associateSign = await associateTx.sign(PrivateKey.fromString(process.env.HEDERA_PRIVATE_KEY!));
        await associateSign.execute(this.client);
      } catch (error) {
        // Token might already be associated, continue with transfer
        console.log("[hedera] Token association may already exist, continuing with transfer");
      }

      const transferTx = new TransferTransaction()
        .addNftTransfer(params.tokenId, params.serialNumber, params.fromAccountId, params.toAccountId)
        .freezeWith(this.client);

      const transferSign = await transferTx.sign(PrivateKey.fromString(process.env.HEDERA_PRIVATE_KEY!));
      const transferSubmit = await transferSign.execute(this.client);
      const transferRx = await transferSubmit.getReceipt(this.client);

      const transactionId = transferSubmit.transactionId.toString();
      console.log(`[hedera] NFT transferred successfully: ${transactionId}`);

      return transactionId;
    } catch (error) {
      console.error("[hedera] Error transferring NFT:", error);
      throw error;
    }
  }

  /**
   * Get token information
   */
  async getTokenInfo(tokenId: string): Promise<NFTTokenInfo> {
    try {
      const tokenInfoQuery = new TokenInfoQuery()
        .setTokenId(tokenId);

      const tokenInfo = await tokenInfoQuery.execute(this.client);

      return {
        tokenId: tokenInfo.tokenId.toString(),
        name: tokenInfo.name,
        symbol: tokenInfo.symbol,
        totalSupply: tokenInfo.totalSupply.toNumber(),
        decimals: tokenInfo.decimals,
        treasury: tokenInfo.treasuryAccountId?.toString() || this.client.operatorAccountId!.toString()
      };
    } catch (error) {
      console.error("[hedera] Error getting token info:", error);
      throw error;
    }
  }

  /**
   * Get account balance including NFTs
   */
  async getAccountBalance(accountId: string) {
    try {
      const balanceQuery = new AccountBalanceQuery()
        .setAccountId(accountId);

      const balance = await balanceQuery.execute(this.client);
      
      return {
        hbars: balance.hbars.toString(),
        tokens: balance.tokens,
      };
    } catch (error) {
      console.error("[hedera] Error getting account balance:", error);
      throw error;
    }
  }
}

export const hederaNFTService = new HederaNFTService();