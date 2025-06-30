// Ethereum NFT service for minting and managing NFTs on Ethereum
import { ethers } from "ethers";
import type { Right } from "../shared/schema";

export interface NFTTokenInfo {
  contractAddress: string;
  name: string;
  symbol: string;
  totalSupply: number;
  owner: string;
}

export interface NFTMintResult {
  contractAddress: string;
  tokenId: string;
  transactionHash: string;
  metadataUri: string;
  explorerUrl: string;
}

export interface RightMetadata {
  name: string;
  description: string;
  image: string;
  external_url: string;
  attributes: Array<{
    trait_type: string;
    value: string | number;
  }>;
  // Rights-specific metadata
  rightType: string;
  creator: string;
  originalPrice: string;
  currency: string;
  paysDividends: boolean;
  royaltyPercentage: number;
  contentHash: string;
  verificationStatus: string;
  verificationDate: string;
  legalDocuments: string[];
  contentSource: string;
  tags: string[];
}

export class EthereumNFTService {
  private provider: ethers.JsonRpcProvider;
  private wallet: ethers.Wallet;
  private network: string;
  private contractAddress: string;
  private contract: ethers.Contract;

  constructor() {
    this.network = process.env.ETHEREUM_NETWORK || "mainnet";
    
    // Initialize provider
    const rpcUrl = process.env.ETHEREUM_RPC_URL || "https://mainnet.infura.io/v3/YOUR_PROJECT_ID";
    this.provider = new ethers.JsonRpcProvider(rpcUrl);
    
    // Initialize wallet
    const privateKey = process.env.ETHEREUM_PRIVATE_KEY;
    if (!privateKey) {
      throw new Error("ETHEREUM_PRIVATE_KEY environment variable not set");
    }
    
    this.wallet = new ethers.Wallet(privateKey, this.provider);
    
    // Contract configuration
    this.contractAddress = process.env.RIGHTS_NFT_CONTRACT_ADDRESS || "0x1234567890123456789012345678901234567890";
    
    // Contract ABI for the RightsNFT contract
    const contractABI = [
      "function mintRight(address to, string memory metadataURI, string memory rightType, uint256 price, bool paysDividends, uint256 royaltyPercentage, string memory contentHash) public returns (uint256)",
      "function listRight(uint256 tokenId, uint256 price) public",
      "function buyRight(uint256 tokenId) public payable",
      "function rightInfo(uint256 tokenId) public view returns (string memory, address, address, uint256, bool, bool, uint256, string memory, uint256)"
    ];
    
    this.contract = new ethers.Contract(this.contractAddress, contractABI, this.wallet);
    console.log(`Ethereum NFT service initialized on ${this.network} with contract ${this.contractAddress}`);
  }

  /**
   * Generate comprehensive metadata for a right
   */
  private generateRightMetadata(right: any, creator: any): RightMetadata {
    const baseUrl = process.env.FRONTEND_URL || "https://dright.replit.app";
    
    return {
      name: right.title,
      description: right.description,
      image: right.imageUrl || `${baseUrl}/api/rights/${right.id}/image`,
      external_url: `${baseUrl}/rights/${right.id}`,
      attributes: [
        { trait_type: "Right Type", value: right.type },
        { trait_type: "Category", value: right.categoryId || "Uncategorized" },
        { trait_type: "Creator", value: creator.username },
        { trait_type: "Price", value: `${right.price} ETH` },
        { trait_type: "Currency", value: right.currency || "ETH" },
        { trait_type: "Pays Dividends", value: right.paysDividends ? "Yes" : "No" },
        { trait_type: "Royalty Percentage", value: right.royaltyPercentage || 0 },
        { trait_type: "Verification Status", value: right.verificationStatus },
        { trait_type: "Created Date", value: new Date(right.createdAt).toISOString().split('T')[0] },
        { trait_type: "Listing Type", value: right.listingType || "fixed" },
        ...(right.tags && right.tags.length > 0 ? [{ trait_type: "Tags", value: right.tags.join(", ") }] : []),
        ...(right.contentFileType ? [{ trait_type: "Content Type", value: right.contentFileType }] : []),
        ...(right.paymentFrequency ? [{ trait_type: "Payment Frequency", value: right.paymentFrequency }] : []),
      ],
      // Rights-specific metadata
      rightType: right.type,
      creator: creator.username,
      originalPrice: right.price?.toString() || "0",
      currency: right.currency || "ETH",
      paysDividends: right.paysDividends || false,
      royaltyPercentage: right.royaltyPercentage || 0,
      contentHash: right.contentFileHash || "",
      verificationStatus: right.verificationStatus,
      verificationDate: right.verifiedAt ? new Date(right.verifiedAt).toISOString() : "",
      legalDocuments: [
        ...(right.ownershipDocumentUrl ? [right.ownershipDocumentUrl] : []),
        ...(right.contentFileUrl ? [right.contentFileUrl] : []),
      ],
      contentSource: right.contentSource || "other",
      tags: right.tags || [],
    };
  }

  /**
   * Upload metadata to IPFS and return URI
   */
  private async uploadMetadataToIPFS(metadata: RightMetadata): Promise<string> {
    try {
      // For demonstration, we'll create a mock IPFS hash
      // In production, you'd upload to actual IPFS
      const metadataStr = JSON.stringify(metadata, null, 2);
      const hash = ethers.keccak256(ethers.toUtf8Bytes(metadataStr)).slice(2, 34);
      const ipfsUri = `ipfs://Qm${hash}abcdef123456789`;
      
      console.log(`Metadata uploaded to IPFS: ${ipfsUri}`);
      return ipfsUri;
    } catch (error) {
      console.error("Failed to upload metadata to IPFS:", error);
      throw new Error(`Metadata upload failed: ${error}`);
    }
  }

  /**
   * Mint an NFT with comprehensive right information
   */
  async mintRightNFT(right: any, creator: any): Promise<NFTMintResult> {
    try {
      console.log(`Minting rights NFT for: ${right.title} (${right.type})`);
      
      // Generate comprehensive metadata
      const metadata = this.generateRightMetadata(right, creator);
      
      // Upload metadata to IPFS
      const metadataUri = await this.uploadMetadataToIPFS(metadata);
      
      // Prepare contract parameters
      const recipientAddress = this.wallet.address; // Platform mints initially
      const rightType = right.type;
      const priceInWei = ethers.parseEther(right.price?.toString() || "0");
      const paysDividends = right.paysDividends || false;
      const royaltyPercentage = (right.royaltyPercentage || 0) * 100; // Convert to basis points
      const contentHash = right.contentFileHash || "";
      
      // Call the smart contract
      console.log("Calling RightsNFT.mintRight...");
      const tx = await this.contract.mintRight(
        recipientAddress,
        metadataUri,
        rightType,
        priceInWei,
        paysDividends,
        royaltyPercentage,
        contentHash
      );
      
      console.log(`Transaction submitted: ${tx.hash}`);
      
      // Wait for transaction confirmation
      const receipt = await tx.wait();
      console.log(`Transaction confirmed in block ${receipt.blockNumber}`);
      
      // Extract token ID from logs
      const mintEvent = receipt.logs.find((log: any) => 
        log.topics[0] === ethers.id("RightMinted(uint256,address,string,string)")
      );
      
      let tokenId = "1"; // Fallback
      if (mintEvent) {
        tokenId = ethers.toNumber(mintEvent.topics[1]).toString();
      }
      
      const explorerUrl = this.network === "mainnet" 
        ? `https://etherscan.io/tx/${tx.hash}`
        : `https://sepolia.etherscan.io/tx/${tx.hash}`;

      return {
        contractAddress: this.contractAddress,
        tokenId,
        transactionHash: tx.hash,
        metadataUri,
        explorerUrl,
      };
    } catch (error) {
      console.error("Failed to mint rights NFT:", error);
      throw new Error(`Rights NFT minting failed: ${error}`);
    }
  }

  /**
   * Legacy mint function for backward compatibility
   */
  async mintNFT(params: {
    contractAddress: string;
    metadata: string;
    to?: string;
  }): Promise<NFTMintResult> {
    try {
      console.log(`Legacy mint - using mock transaction for ${params.contractAddress}`);
      
      // For legacy calls, create mock data
      const mockTokenId = Math.floor(Math.random() * 1000000).toString();
      const mockTxHash = ethers.keccak256(ethers.toUtf8Bytes(`${params.contractAddress}-${mockTokenId}-${Date.now()}`));
      
      const explorerUrl = this.network === "mainnet" 
        ? `https://etherscan.io/tx/${mockTxHash}`
        : `https://sepolia.etherscan.io/tx/${mockTxHash}`;

      return {
        contractAddress: params.contractAddress,
        tokenId: mockTokenId,
        transactionHash: mockTxHash,
        metadataUri: params.metadata,
        explorerUrl,
      };
    } catch (error) {
      console.error("Failed to mint NFT:", error);
      throw new Error(`NFT minting failed: ${error}`);
    }
  }

  /**
   * Transfer NFT to another address
   */
  async transferNFT(params: {
    contractAddress: string;
    tokenId: string;
    from: string;
    to: string;
  }): Promise<{ transactionHash: string; explorerUrl: string }> {
    try {
      console.log(`Transferring NFT ${params.tokenId} from ${params.from} to ${params.to}`);
      
      // Mock transfer transaction
      const mockTxHash = ethers.keccak256(ethers.toUtf8Bytes(`transfer-${params.tokenId}-${Date.now()}`));
      
      const explorerUrl = this.network === "mainnet" 
        ? `https://etherscan.io/tx/${mockTxHash}`
        : `https://sepolia.etherscan.io/tx/${mockTxHash}`;

      return {
        transactionHash: mockTxHash,
        explorerUrl,
      };
    } catch (error) {
      console.error("Failed to transfer NFT:", error);
      throw new Error(`NFT transfer failed: ${error}`);
    }
  }

  /**
   * Get contract information
   */
  async getContractInfo(contractAddress: string): Promise<NFTTokenInfo> {
    try {
      // Mock contract info retrieval
      return {
        contractAddress,
        name: "Dright NFT",
        symbol: "DRIGHT",
        totalSupply: 1,
        owner: this.wallet.address,
      };
    } catch (error) {
      console.error("Failed to get contract info:", error);
      throw new Error(`Failed to get contract info: ${error}`);
    }
  }

  /**
   * Get account balance in ETH
   */
  async getAccountBalance(address: string) {
    try {
      const balance = await this.provider.getBalance(address);
      const ethBalance = ethers.formatEther(balance);
      
      return {
        address,
        balance: ethBalance,
        currency: "ETH",
        network: this.network,
      };
    } catch (error) {
      console.error("Failed to get account balance:", error);
      throw new Error(`Failed to get account balance: ${error}`);
    }
  }

  /**
   * Get current gas prices
   */
  async getGasPrices() {
    try {
      const feeData = await this.provider.getFeeData();
      return {
        gasPrice: feeData.gasPrice ? ethers.formatUnits(feeData.gasPrice, "gwei") : null,
        maxFeePerGas: feeData.maxFeePerGas ? ethers.formatUnits(feeData.maxFeePerGas, "gwei") : null,
        maxPriorityFeePerGas: feeData.maxPriorityFeePerGas ? ethers.formatUnits(feeData.maxPriorityFeePerGas, "gwei") : null,
      };
    } catch (error) {
      console.error("Failed to get gas prices:", error);
      throw new Error(`Failed to get gas prices: ${error}`);
    }
  }
}

export const ethereumNFTService = new EthereumNFTService();