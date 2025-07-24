import { ethers } from 'ethers';
import { getCurrentNetwork, getContractAddresses, TESTNET_SETTINGS } from './testnet-config';

// Contract ABIs (simplified for testing)
const DRIGHT_NFT_ABI = [
  "function mintRight(string title, string rightType, string contentFileHash, string metadataURI, uint256 price, bool paysDividends, uint256 distributionPercentage, address[] stakeholders, uint256[] shares) returns (uint256)",
  "function verifyRight(uint256 tokenId, bool verified)",
  "function listRight(uint256 tokenId, uint256 price)",
  "function buyRight(uint256 tokenId) payable",
  "function getRightDetails(uint256 tokenId) view returns (string, string, string, address, address, uint256, bool, bool, bool, uint256)",
  "function verifyCreator(address creator, bool verified)",
  "function platformFeePercentage() view returns (uint256)",
  "function ownerOf(uint256 tokenId) view returns (address)",
  "event RightMinted(uint256 indexed tokenId, address indexed creator, string contentHash)",
  "event RightVerified(uint256 indexed tokenId, bool verified, uint256 timestamp)",
  "event RightSold(uint256 indexed tokenId, address indexed buyer, uint256 price)"
];

const DRIGHT_RIGHTS_NFT_ABI = [
  "function createRight(address to, string metadataUri, tuple(string title, string description, uint8 rightType, address creator, address currentOwner, uint8 verificationStatus, bool paysDividends, uint256 royaltyPercentage, uint256 creationTime, uint256 verificationTime, string[] tags, string externalUrl, string legalDocumentHash) rightData, uint96 royaltyBasisPoints) returns (uint256)",
  "function verifyRight(uint256 tokenId, uint8 status)",
  "function listRight(uint256 tokenId, uint256 price, uint8 listingType, uint256 auctionDuration, uint256 reservePrice)",
  "function purchaseRight(uint256 tokenId) payable",
  "function placeBid(uint256 tokenId) payable",
  "function rightMetadata(uint256 tokenId) view returns (tuple(string title, string description, uint8 rightType, address creator, address currentOwner, uint8 verificationStatus, bool paysDividends, uint256 royaltyPercentage, uint256 creationTime, uint256 verificationTime, string[] tags, string externalUrl, string legalDocumentHash))",
  "event RightCreated(uint256 indexed tokenId, address indexed creator, uint8 rightType, string title)",
  "event RightVerified(uint256 indexed tokenId, address indexed verifier, uint8 status)"
];

export class ContractIntegration {
  private provider: ethers.BrowserProvider | ethers.JsonRpcProvider;
  private signer: ethers.Signer | null = null;
  private drightNFT: ethers.Contract | null = null;
  private drightRightsNFT: ethers.Contract | null = null;

  constructor() {
    this.initializeProvider();
  }

  private initializeProvider() {
    const network = getCurrentNetwork();
    
    if (typeof window !== 'undefined' && (window as any).ethereum) {
      // Use MetaMask/injected provider if available
      this.provider = new ethers.BrowserProvider((window as any).ethereum);
    } else {
      // Fallback to RPC provider
      this.provider = new ethers.JsonRpcProvider(network.rpcUrl);
    }
  }

  async connectWallet() {
    if (typeof window !== 'undefined' && (window as any).ethereum) {
      try {
        await (window as any).ethereum.request({ method: 'eth_requestAccounts' });
        this.signer = await this.provider.getSigner();
        
        const address = await this.signer.getAddress();
        const balance = await this.provider.getBalance(address);
        
        console.log('Wallet connected:', address);
        console.log('Balance:', ethers.formatEther(balance), 'ETH');
        
        return { address, balance: ethers.formatEther(balance) };
      } catch (error) {
        console.error('Failed to connect wallet:', error);
        throw error;
      }
    } else {
      throw new Error('No wallet provider found');
    }
  }

  async switchToTestnet() {
    const network = getCurrentNetwork();
    
    if (typeof window !== 'undefined' && (window as any).ethereum) {
      try {
        await (window as any).ethereum.request({
          method: 'wallet_switchEthereumChain',
          params: [{ chainId: ethers.toQuantity(network.chainId) }],
        });
      } catch (switchError: any) {
        // If the chain doesn't exist, add it
        if (switchError.code === 4902) {
          await (window as any).ethereum.request({
            method: 'wallet_addEthereumChain',
            params: [
              {
                chainId: ethers.toQuantity(network.chainId),
                chainName: network.name,
                rpcUrls: [network.rpcUrl],
                nativeCurrency: {
                  name: network.currency,
                  symbol: network.currency,
                  decimals: 18,
                },
                blockExplorerUrls: network.blockExplorer ? [network.blockExplorer] : null,
              },
            ],
          });
        } else {
          throw switchError;
        }
      }
    }
  }

  private initializeContracts() {
    const addresses = getContractAddresses();
    
    if (addresses.DrightNFT && this.signer) {
      this.drightNFT = new ethers.Contract(addresses.DrightNFT, DRIGHT_NFT_ABI, this.signer);
    }
    
    if (addresses.DrightRightsNFT && this.signer) {
      this.drightRightsNFT = new ethers.Contract(addresses.DrightRightsNFT, DRIGHT_RIGHTS_NFT_ABI, this.signer);
    }
  }

  // NFT Minting Functions
  async mintRightNFT(rightData: {
    title: string;
    rightType: string;
    contentFileHash: string;
    metadataURI: string;
    price: string;
    paysDividends: boolean;
    distributionPercentage: number;
  }) {
    if (!this.drightNFT || !this.signer) {
      throw new Error('Contract not initialized or wallet not connected');
    }

    try {
      const signerAddress = await this.signer.getAddress();
      const stakeholders = [signerAddress];
      const shares = [10000]; // 100%
      
      const tx = await this.drightNFT.mintRight(
        rightData.title,
        rightData.rightType,
        rightData.contentFileHash,
        rightData.metadataURI,
        ethers.parseEther(rightData.price),
        rightData.paysDividends,
        rightData.distributionPercentage,
        stakeholders,
        shares
      );

      console.log('Minting transaction sent:', tx.hash);
      const receipt = await tx.wait();
      
      const mintEvent = receipt.events?.find((e: any) => e.event === 'RightMinted');
      const tokenId = mintEvent?.args?.tokenId;
      
      console.log('NFT minted successfully! Token ID:', tokenId?.toString());
      
      return {
        tokenId: tokenId?.toString(),
        transactionHash: tx.hash,
        blockNumber: receipt.blockNumber
      };
    } catch (error) {
      console.error('Minting failed:', error);
      throw error;
    }
  }

  async mintAdvancedRightNFT(rightData: {
    title: string;
    description: string;
    rightType: number; // 0=COPYRIGHT, 1=ROYALTY, 2=ACCESS, 3=OWNERSHIP, 4=LICENSE
    metadataURI: string;
    paysDividends: boolean;
    royaltyPercentage: number;
    tags: string[];
    externalUrl: string;
    legalDocumentHash: string;
  }) {
    if (!this.drightRightsNFT || !this.signer) {
      throw new Error('Contract not initialized or wallet not connected');
    }

    try {
      const signerAddress = await this.signer.getAddress();
      
      const tx = await this.drightRightsNFT.createRight(
        signerAddress,
        rightData.metadataURI,
        {
          title: rightData.title,
          description: rightData.description,
          rightType: rightData.rightType,
          creator: signerAddress,
          currentOwner: signerAddress,
          verificationStatus: 0, // PENDING
          paysDividends: rightData.paysDividends,
          royaltyPercentage: rightData.royaltyPercentage,
          creationTime: 0,
          verificationTime: 0,
          tags: rightData.tags,
          externalUrl: rightData.externalUrl,
          legalDocumentHash: rightData.legalDocumentHash
        },
        rightData.royaltyPercentage // royalty basis points
      );

      console.log('Advanced minting transaction sent:', tx.hash);
      const receipt = await tx.wait();
      
      const createEvent = receipt.events?.find((e: any) => e.event === 'RightCreated');
      const tokenId = createEvent?.args?.tokenId;
      
      console.log('Advanced NFT minted successfully! Token ID:', tokenId?.toString());
      
      return {
        tokenId: tokenId?.toString(),
        transactionHash: tx.hash,
        blockNumber: receipt.blockNumber
      };
    } catch (error) {
      console.error('Advanced minting failed:', error);
      throw error;
    }
  }

  // Verification Functions
  async verifyRight(tokenId: string, verified: boolean = true) {
    if (!this.drightNFT) {
      throw new Error('Contract not initialized');
    }

    try {
      const tx = await this.drightNFT.verifyRight(tokenId, verified);
      console.log('Verification transaction sent:', tx.hash);
      
      const receipt = await tx.wait();
      console.log('Right verification completed:', verified);
      
      return {
        transactionHash: tx.hash,
        blockNumber: receipt.blockNumber
      };
    } catch (error) {
      console.error('Verification failed:', error);
      throw error;
    }
  }

  // Marketplace Functions
  async listRight(tokenId: string, price: string) {
    if (!this.drightNFT) {
      throw new Error('Contract not initialized');
    }

    try {
      const tx = await this.drightNFT.listRight(tokenId, ethers.parseEther(price));
      console.log('Listing transaction sent:', tx.hash);
      
      const receipt = await tx.wait();
      console.log('Right listed successfully');
      
      return {
        transactionHash: tx.hash,
        blockNumber: receipt.blockNumber
      };
    } catch (error) {
      console.error('Listing failed:', error);
      throw error;
    }
  }

  async buyRight(tokenId: string, price: string) {
    if (!this.drightNFT) {
      throw new Error('Contract not initialized');
    }

    try {
      const tx = await this.drightNFT.buyRight(tokenId, {
        value: ethers.parseEther(price)
      });
      console.log('Purchase transaction sent:', tx.hash);
      
      const receipt = await tx.wait();
      console.log('Right purchased successfully');
      
      return {
        transactionHash: tx.hash,
        blockNumber: receipt.blockNumber
      };
    } catch (error) {
      console.error('Purchase failed:', error);
      throw error;
    }
  }

  // Query Functions
  async getRightDetails(tokenId: string) {
    if (!this.drightNFT) {
      throw new Error('Contract not initialized');
    }

    try {
      const details = await this.drightNFT.getRightDetails(tokenId);
      return {
        title: details[0],
        rightType: details[1],
        contentFileHash: details[2],
        creator: details[3],
        currentOwner: details[4],
        price: ethers.formatEther(details[5]),
        isListed: details[6],
        paysDividends: details[7],
        isVerified: details[8],
        totalRevenue: ethers.formatEther(details[9])
      };
    } catch (error) {
      console.error('Failed to get right details:', error);
      throw error;
    }
  }

  // Initialize contracts after wallet connection
  async initialize() {
    await this.connectWallet();
    this.initializeContracts();
    
    return {
      drightNFT: !!this.drightNFT,
      drightRightsNFT: !!this.drightRightsNFT,
      network: getCurrentNetwork()
    };
  }

  // Test contract functionality
  async runContractTests() {
    console.log('🧪 Running contract integration tests...');
    
    try {
      // Test 1: Connect wallet
      const wallet = await this.connectWallet();
      console.log('✅ Wallet connected:', wallet.address);
      
      // Test 2: Check network
      await this.switchToTestnet();
      console.log('✅ Network switched to testnet');
      
      // Test 3: Initialize contracts
      const init = await this.initialize();
      console.log('✅ Contracts initialized:', init);
      
      // Test 4: Mint test NFT
      const mintResult = await this.mintRightNFT({
        title: 'Test Right #' + Date.now(),
        rightType: 'copyright',
        contentFileHash: 'QmTest' + Date.now(),
        metadataURI: 'ipfs://QmTestMetadata' + Date.now(),
        price: '0.001',
        paysDividends: true,
        distributionPercentage: 1000
      });
      console.log('✅ Test NFT minted:', mintResult);
      
      // Test 5: Verify the NFT
      if (mintResult.tokenId) {
        await this.verifyRight(mintResult.tokenId, true);
        console.log('✅ Test NFT verified');
      }
      
      console.log('🎉 All contract tests passed!');
      return true;
      
    } catch (error) {
      console.error('❌ Contract tests failed:', error);
      return false;
    }
  }
}

// Export singleton instance
export const contractIntegration = new ContractIntegration();