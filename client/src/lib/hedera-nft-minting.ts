// Proper Hedera HTS NFT minting following the exact specifications
import {
  Client,
  PrivateKey,
  AccountId,
  TokenId,
  TokenCreateTransaction,
  TokenMintTransaction,
  TokenType,
  TokenSupplyType,
  TransactionId,
  Hbar
} from "@hashgraph/sdk";

// HIP-412 compliant metadata structure
export interface HIP412Metadata {
  name: string;
  description: string;
  image: string;
  type: string;
  properties: {
    rights: {
      rightType: string;
      grantee: string;
      granter: string;
      termsUrl?: string;
      allowedUses: string[];
      exclusive: boolean;
      expiration?: string;
      royaltyPercent: number;
      attribution: string;
    };
    workRefs?: string[];
  };
  attributes: Array<{ trait_type: string; value: string }>;
}

export class HederaNFTService {
  private client: Client;
  private operatorAccountId: AccountId;
  private operatorPrivateKey: PrivateKey;
  private network: string;

  constructor(network: "mainnet" | "testnet" = "testnet") {
    this.network = network;
    this.client = network === "mainnet" ? Client.forMainnet() : Client.forTestnet();
    
    // For demo purposes, we'll use environment variables or create test keys
    // In production, these should come from secure key management
    const operatorId = import.meta.env.VITE_HEDERA_OPERATOR_ID || "0.0.2";
    const operatorKey = import.meta.env.VITE_HEDERA_OPERATOR_KEY;
    
    // Generate test key if not provided
    const testKey = operatorKey || PrivateKey.generateED25519().toString();
    
    this.operatorAccountId = AccountId.fromString(operatorId);
    this.operatorPrivateKey = PrivateKey.fromString(testKey);
    
    this.client.setOperator(this.operatorAccountId, this.operatorPrivateKey);
    
    console.log('Hedera client initialized:', {
      network: this.network,
      operatorId: operatorId,
      hasOperatorKey: !!operatorKey
    });
  }

  // Create HIP-412 compliant metadata JSON
  createHIP412Metadata(params: {
    name: string;
    description: string;
    creator: string;
    rightType: string;
    imageUrl: string;
    allowedUses?: string[];
    exclusive?: boolean;
    royaltyPercent?: number;
  }): HIP412Metadata {
    return {
      name: params.name,
      description: params.description,
      image: params.imageUrl,
      type: "image",
      properties: {
        rights: {
          rightType: params.rightType,
          grantee: this.operatorAccountId.toString(),
          granter: params.creator,
          allowedUses: params.allowedUses || ["display", "sell"],
          exclusive: params.exclusive || false,
          royaltyPercent: params.royaltyPercent || 5,
          attribution: `© ${new Date().getFullYear()} ${params.creator}`
        }
      },
      attributes: [
        { trait_type: "Right Type", value: params.rightType },
        { trait_type: "Creator", value: params.creator },
        { trait_type: "Platform", value: "Dright" },
        { trait_type: "Created", value: new Date().toISOString() }
      ]
    };
  }

  // Create metadata pointer (simulate IPFS pinning)
  async pinMetadataToIPFS(metadata: HIP412Metadata): Promise<string> {
    // In production, this would actually pin to IPFS
    // For now, we'll create a mock CID and log the metadata
    console.log('Metadata to pin:', JSON.stringify(metadata, null, 2));
    
    const mockCID = 'bafybeig' + Math.random().toString(36).substring(2, 15);
    const pointer = `ipfs://${mockCID}`;
    
    // Ensure pointer is <= 100 bytes
    if (Buffer.byteLength(pointer, 'utf8') > 100) {
      throw new Error('Metadata pointer exceeds 100 bytes - consider using HFS');
    }
    
    return pointer;
  }

  // Create a new NFT collection token
  async createNFTCollection(params: {
    name: string;
    symbol: string;
    maxSupply?: number;
  }): Promise<string> {
    try {
      console.log('Creating NFT collection:', params);

      const tx = await new TokenCreateTransaction()
        .setTokenName(params.name)
        .setTokenSymbol(params.symbol)
        .setTokenType(TokenType.NonFungibleUnique)
        .setDecimals(0)
        .setInitialSupply(0)
        .setTreasuryAccountId(this.operatorAccountId)
        .setSupplyType(TokenSupplyType.Finite)
        .setMaxSupply(params.maxSupply || 1000)
        .setSupplyKey(this.operatorPrivateKey.publicKey) // Critical: supply key needed for minting
        .setMaxTransactionFee(new Hbar(2))
        .freezeWith(this.client);

      const signed = await tx.sign(this.operatorPrivateKey);
      const response = await signed.execute(this.client);
      const receipt = await response.getReceipt(this.client);
      
      const tokenId = receipt.tokenId!.toString();
      console.log('NFT collection created:', tokenId);
      
      return tokenId;
    } catch (error) {
      console.error('Error creating NFT collection:', error);
      throw error;
    }
  }

  // Mint an NFT with proper metadata
  async mintNFT(params: {
    tokenId: string;
    metadata: HIP412Metadata;
    treasuryAccountId?: string;
  }): Promise<{ success: boolean; transactionId: string; serialNumber?: number }> {
    try {
      console.log('Starting NFT minting process...');

      // Pin metadata to IPFS and get pointer
      const metadataPointer = await this.pinMetadataToIPFS(params.metadata);
      console.log('Metadata pointer:', metadataPointer);

      // Ensure metadata pointer is within 100 byte limit
      if (Buffer.byteLength(metadataPointer, 'utf8') > 100) {
        throw new Error('Metadata pointer exceeds 100 bytes');
      }

      const treasuryAccount = params.treasuryAccountId 
        ? AccountId.fromString(params.treasuryAccountId)
        : this.operatorAccountId;

      // Create mint transaction
      const mintTx = await new TokenMintTransaction()
        .setTokenId(TokenId.fromString(params.tokenId))
        .setMetadata([Buffer.from(metadataPointer, 'utf8')]) // Single NFT
        .setTransactionId(TransactionId.generate(treasuryAccount))
        .freezeWith(this.client);

      console.log('Executing mint transaction...');

      // Sign with supply key (operator in this case)
      const signed = await mintTx.sign(this.operatorPrivateKey);
      const response = await signed.execute(this.client);
      const receipt = await response.getReceipt(this.client);

      console.log('Mint transaction status:', receipt.status.toString());
      
      // Get the serial numbers from receipt
      const serialNumbers = receipt.serials || [];
      const serialNumber = serialNumbers.length > 0 ? Number(serialNumbers[0]) : undefined;
      
      console.log('Minted NFT serial numbers:', serialNumbers);

      return {
        success: true,
        transactionId: response.transactionId.toString(),
        serialNumber: serialNumber
      };

    } catch (error) {
      console.error('Error minting NFT:', error);
      return {
        success: false,
        transactionId: '',
      };
    }
  }
}

// Singleton service
export const hederaNFTService = new HederaNFTService("testnet");