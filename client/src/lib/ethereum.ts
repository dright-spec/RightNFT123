import { ethers } from 'ethers';
import { create } from './ipfs-wrapper';

// Ethereum network configuration
const ETHEREUM_NETWORK = process.env.NODE_ENV === 'production' ? 'mainnet' : 'sepolia';
const ETHEREUM_RPC_URL = process.env.VITE_ETHEREUM_RPC_URL || 
  (ETHEREUM_NETWORK === 'mainnet' ? 'https://eth-mainnet.g.alchemy.com/v2/demo' : 'https://eth-sepolia.g.alchemy.com/v2/demo');

// IPFS configuration
const IPFS_GATEWAY = 'https://ipfs.io/ipfs/';
const ipfs = create({ 
  url: 'https://ipfs.infura.io:5001/api/v0',
  headers: {
    authorization: process.env.VITE_IPFS_AUTH ? `Basic ${process.env.VITE_IPFS_AUTH}` : undefined
  }
});

interface EthereumWalletStatus {
  isConnected: boolean;
  accountAddress: string | null;
  network: string;
  chainId: number | null;
}

export interface RightMetadata {
  title: string;
  description: string;
  type: 'copyright' | 'royalty' | 'access' | 'ownership' | 'license';
  dividends: boolean;
  payout_address: string;
  doc_uri?: string;
  image_uri?: string;
  creator: string;
  created_at: string;
}

export interface NFTMintResult {
  transactionHash: string;
  tokenId: string;
  contractAddress: string;
  metadataUri: string;
}

class EthereumService {
  private provider: ethers.JsonRpcProvider | ethers.BrowserProvider | null = null;
  private signer: ethers.Signer | null = null;
  private walletStatus: EthereumWalletStatus = {
    isConnected: false,
    accountAddress: null,
    network: ETHEREUM_NETWORK,
    chainId: null
  };

  constructor() {
    this.initializeProvider();
  }

  private initializeProvider() {
    try {
      this.provider = new ethers.JsonRpcProvider(ETHEREUM_RPC_URL);
    } catch (error) {
      console.error('Failed to initialize Ethereum provider:', error);
    }
  }

  // MetaMask wallet integration
  async connectMetaMask(): Promise<string> {
    if (!window.ethereum) {
      throw new Error('MetaMask not detected. Please install MetaMask extension.');
    }

    try {
      // Request account access
      const accounts = await window.ethereum.request({ 
        method: 'eth_requestAccounts' 
      });
      
      if (!accounts || accounts.length === 0) {
        throw new Error('No accounts returned from MetaMask');
      }

      const accountAddress = accounts[0];
      
      // Get network info
      const chainId = await window.ethereum.request({ method: 'eth_chainId' });
      const networkName = this.getNetworkName(parseInt(chainId, 16));

      // Create provider and signer
      const browserProvider = new ethers.BrowserProvider(window.ethereum);
      this.provider = browserProvider;
      this.signer = await browserProvider.getSigner();

      this.walletStatus = {
        isConnected: true,
        accountAddress: accountAddress,
        network: networkName,
        chainId: parseInt(chainId, 16)
      };

      localStorage.setItem('ethereum_wallet', JSON.stringify(this.walletStatus));
      console.log('MetaMask connected successfully:', accountAddress);
      
      // Listen for account changes
      window.ethereum.on('accountsChanged', (accounts: string[]) => {
        if (accounts.length === 0) {
          this.disconnectWallet();
        } else {
          this.walletStatus.accountAddress = accounts[0];
          localStorage.setItem('ethereum_wallet', JSON.stringify(this.walletStatus));
        }
      });

      // Listen for network changes
      window.ethereum.on('chainChanged', (chainId: string) => {
        this.walletStatus.chainId = parseInt(chainId, 16);
        this.walletStatus.network = this.getNetworkName(this.walletStatus.chainId);
        localStorage.setItem('ethereum_wallet', JSON.stringify(this.walletStatus));
      });

      return accountAddress;
      
    } catch (error) {
      console.error('MetaMask connection error:', error);
      throw new Error('Failed to connect to MetaMask.');
    }
  }

  private getNetworkName(chainId: number): string {
    switch (chainId) {
      case 1: return 'mainnet';
      case 11155111: return 'sepolia';
      case 5: return 'goerli';
      case 137: return 'polygon';
      case 80001: return 'mumbai';
      default: return 'unknown';
    }
  }

  disconnectWallet(): void {
    this.walletStatus = {
      isConnected: false,
      accountAddress: null,
      network: ETHEREUM_NETWORK,
      chainId: null
    };
    this.signer = null;
    localStorage.removeItem('ethereum_wallet');
  }

  getWalletStatus(): EthereumWalletStatus {
    const savedWallet = localStorage.getItem('ethereum_wallet');
    if (savedWallet) {
      try {
        this.walletStatus = JSON.parse(savedWallet);
      } catch (error) {
        console.error('Failed to parse saved wallet data:', error);
      }
    }
    return this.walletStatus;
  }

  async uploadToIPFS(metadata: RightMetadata): Promise<string> {
    try {
      const metadataString = JSON.stringify(metadata, null, 2);
      const encoder = new TextEncoder();
      const metadataBuffer = encoder.encode(metadataString);
      
      const result = await ipfs.add(metadataBuffer);

      const ipfsUri = `ipfs://${result.path}`;
      console.log('Metadata uploaded to IPFS:', ipfsUri);
      return ipfsUri;
    } catch (error) {
      console.error('IPFS upload failed:', error);
      throw new Error('Failed to upload metadata to IPFS');
    }
  }

  async uploadFileToIPFS(file: File): Promise<string> {
    try {
      const buffer = await file.arrayBuffer();
      const uint8Array = new Uint8Array(buffer);
      
      const result = await ipfs.add(uint8Array);

      const ipfsUri = `ipfs://${result.path}`;
      console.log('File uploaded to IPFS:', ipfsUri);
      return ipfsUri;
    } catch (error) {
      console.error('IPFS file upload failed:', error);
      throw new Error('Failed to upload file to IPFS');
    }
  }

  // Simple NFT contract interaction (ERC-721)
  async mintNFT(metadata: RightMetadata, imageFile?: File): Promise<NFTMintResult> {
    if (!this.walletStatus.isConnected || !this.signer) {
      throw new Error('Wallet not connected');
    }

    try {
      // Upload image to IPFS if provided
      let imageUri = '';
      if (imageFile) {
        imageUri = await this.uploadFileToIPFS(imageFile);
      }

      // Create complete metadata with image
      const completeMetadata: RightMetadata = {
        ...metadata,
        image_uri: imageUri
      };

      // Upload metadata to IPFS
      const metadataUri = await this.uploadToIPFS(completeMetadata);

      // For demo purposes, simulate NFT minting
      // In production, you would deploy an NFT contract and call its mint function
      const transactionHash = `0x${Math.random().toString(16).substr(2, 64)}`;
      const tokenId = Math.floor(Math.random() * 1000000).toString();
      const contractAddress = '0x1234567890123456789012345678901234567890'; // Demo contract address

      console.log('NFT minted successfully:', {
        transactionHash,
        tokenId,
        contractAddress,
        metadataUri
      });

      return {
        transactionHash,
        tokenId,
        contractAddress,
        metadataUri
      };
    } catch (error) {
      console.error('Failed to mint NFT:', error);
      throw error;
    }
  }

  async transferNFT(tokenId: string, toAddress: string, price: string): Promise<string> {
    if (!this.walletStatus.isConnected || !this.signer) {
      throw new Error('Wallet not connected');
    }

    try {
      // For demo purposes, simulate NFT transfer
      // In production, you would interact with the NFT contract
      const transactionHash = `0x${Math.random().toString(16).substr(2, 64)}`;
      
      console.log('NFT transferred successfully:', {
        tokenId,
        toAddress,
        price,
        transactionHash
      });

      return transactionHash;
    } catch (error) {
      console.error('Failed to transfer NFT:', error);
      throw error;
    }
  }

  async getAccountBalance(): Promise<{ eth: string; nfts: number }> {
    if (!this.walletStatus.isConnected || !this.provider) {
      throw new Error('Wallet not connected');
    }

    try {
      const balance = await this.provider.getBalance(this.walletStatus.accountAddress!);
      const ethBalance = ethers.formatEther(balance);

      // For demo purposes, simulate NFT count
      const nftCount = Math.floor(Math.random() * 50) + 1;

      return {
        eth: parseFloat(ethBalance).toFixed(4),
        nfts: nftCount
      };
    } catch (error) {
      console.error('Failed to get account balance:', error);
      throw error;
    }
  }

  getEtherscanUrl(transactionHash: string): string {
    const baseUrl = this.walletStatus.network === 'mainnet' 
      ? 'https://etherscan.io' 
      : `https://${this.walletStatus.network}.etherscan.io`;
    return `${baseUrl}/tx/${transactionHash}`;
  }

  getTokenUrl(contractAddress: string, tokenId: string): string {
    const baseUrl = this.walletStatus.network === 'mainnet' 
      ? 'https://etherscan.io' 
      : `https://${this.walletStatus.network}.etherscan.io`;
    return `${baseUrl}/token/${contractAddress}?a=${tokenId}`;
  }

  async switchToCorrectNetwork(): Promise<void> {
    if (!window.ethereum) {
      throw new Error('MetaMask not detected');
    }

    const targetChainId = ETHEREUM_NETWORK === 'mainnet' ? '0x1' : '0xaa36a7'; // Sepolia

    try {
      await window.ethereum.request({
        method: 'wallet_switchEthereumChain',
        params: [{ chainId: targetChainId }],
      });
    } catch (error: any) {
      // If the network doesn't exist, add it
      if (error.code === 4902 && ETHEREUM_NETWORK === 'sepolia') {
        await window.ethereum.request({
          method: 'wallet_addEthereumChain',
          params: [{
            chainId: '0xaa36a7',
            chainName: 'Sepolia Test Network',
            nativeCurrency: {
              name: 'Ethereum',
              symbol: 'ETH',
              decimals: 18
            },
            rpcUrls: ['https://sepolia.infura.io/v3/'],
            blockExplorerUrls: ['https://sepolia.etherscan.io/']
          }]
        });
      } else {
        throw error;
      }
    }
  }
}

// Export singleton instance
export const ethereumService = new EthereumService();

// Global types for window.ethereum
declare global {
  interface Window {
    ethereum?: any;
  }
}