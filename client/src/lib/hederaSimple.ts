// Simplified Hedera integration for NFT minting
// This provides the interface for Hedera blockchain operations

export interface HederaWalletStatus {
  isConnected: boolean;
  accountId: string | null;
  network: string;
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
  transactionId: string;
  tokenId: string;
  serialNumber: number;
  metadataUri: string;
}

class HederaService {
  private walletStatus: HederaWalletStatus = {
    isConnected: false,
    accountId: null,
    network: 'testnet'
  };

  async connectWallet(): Promise<string> {
    try {
      // Check if we're in a browser environment
      if (typeof window === 'undefined') {
        throw new Error('Wallet connection only available in browser environment');
      }

      // Check for HashPack extension
      const hashPackAvailable = await this.checkHashPackAvailability();
      
      if (!hashPackAvailable) {
        throw new Error('HashPack wallet extension not detected. Please install HashPack from hashpack.app');
      }

      // For development environment, use mock connection
      const isDevelopment = window.location.hostname === 'localhost' || window.location.hostname.includes('replit');
      
      if (isDevelopment) {
        return this.mockWalletConnection();
      }

      // Production HashPack connection
      return this.connectToHashPack();
      
    } catch (error) {
      console.error('Wallet connection error:', error);
      throw error;
    }
  }

  private async checkHashPackAvailability(): Promise<boolean> {
    // Check multiple possible HashPack injection points
    const providers = [
      (window as any).hashpack,
      (window as any).hashconnect,
      (window as any).ethereum?.isHashPack,
      (window as any).hedera
    ];

    return providers.some(provider => provider !== undefined);
  }

  private async mockWalletConnection(): Promise<string> {
    // Development mock connection
    const mockAccountId = '0.0.123456';
    
    this.walletStatus = {
      isConnected: true,
      accountId: mockAccountId,
      network: 'testnet'
    };

    localStorage.setItem('hedera_wallet', JSON.stringify(this.walletStatus));
    return mockAccountId;
  }

  private async connectToHashPack(): Promise<string> {
    const hashPack = (window as any).hashpack;
    
    if (!hashPack || !hashPack.connectToExtension) {
      throw new Error('HashPack API not available');
    }

    try {
      // Initialize HashPack connection
      const result = await hashPack.connectToExtension();
      
      if (!result || !result.accountIds || result.accountIds.length === 0) {
        throw new Error('No accounts found. Please create a Hedera account in HashPack.');
      }

      const accountId = result.accountIds[0];
      const network = result.network || 'testnet';
      
      this.walletStatus = {
        isConnected: true,
        accountId: accountId,
        network: network
      };

      localStorage.setItem('hedera_wallet', JSON.stringify(this.walletStatus));
      return accountId;
      
    } catch (error) {
      if (error instanceof Error) {
        if (error.message.includes('rejected') || error.message.includes('denied')) {
          throw new Error('Connection cancelled by user');
        }
        if (error.message.includes('timeout')) {
          throw new Error('Connection timeout - please ensure HashPack is unlocked');
        }
      }
      
      throw new Error('Failed to connect to HashPack. Please ensure the extension is installed and unlocked.');
    }
  }

  disconnectWallet(): void {
    this.walletStatus = {
      isConnected: false,
      accountId: null,
      network: 'testnet'
    };
    localStorage.removeItem('hedera_wallet');
  }

  getWalletStatus(): HederaWalletStatus {
    const savedWallet = localStorage.getItem('hedera_wallet');
    if (savedWallet) {
      try {
        this.walletStatus = JSON.parse(savedWallet);
      } catch (error) {
        console.error('Failed to parse saved wallet data:', error);
      }
    }
    return this.walletStatus;
  }

  async uploadToIPFS(file: File): Promise<string> {
    // Upload to IPFS using a public gateway or service
    // For demonstration, we'll simulate the upload
    
    const formData = new FormData();
    formData.append('file', file);

    try {
      // This would typically use a service like Pinata, Infura, or Web3.Storage
      // For now, we'll simulate the response
      const mockCid = `Qm${Math.random().toString(36).substring(2, 15)}${Math.random().toString(36).substring(2, 15)}`;
      
      console.log('File uploaded to IPFS:', mockCid);
      return mockCid;
    } catch (error) {
      console.error('IPFS upload failed:', error);
      throw new Error('Failed to upload file to IPFS');
    }
  }

  async uploadMetadataToIPFS(metadata: RightMetadata): Promise<string> {
    try {
      // Simulate metadata upload to IPFS
      const mockCid = `Qm${Math.random().toString(36).substring(2, 15)}${Math.random().toString(36).substring(2, 15)}`;
      
      console.log('Metadata uploaded to IPFS:', {
        cid: mockCid,
        metadata
      });
      
      return mockCid;
    } catch (error) {
      console.error('Metadata upload failed:', error);
      throw new Error('Failed to upload metadata to IPFS');
    }
  }

  async mintRightNFT(
    metadata: RightMetadata,
    legalDocument?: File
  ): Promise<NFTMintResult> {
    if (!this.walletStatus.isConnected) {
      throw new Error('Wallet not connected');
    }

    try {
      // Upload legal document to IPFS if provided
      let docUri: string | undefined;
      if (legalDocument) {
        const docCid = await this.uploadToIPFS(legalDocument);
        docUri = `https://ipfs.io/ipfs/${docCid}`;
        metadata.doc_uri = docUri;
      }

      // Upload metadata to IPFS
      const metadataCid = await this.uploadMetadataToIPFS(metadata);
      const metadataUri = `https://ipfs.io/ipfs/${metadataCid}`;

      // Simulate NFT minting on Hedera
      // In production, this would use Hedera SDK to create and mint NFT
      const mockResult: NFTMintResult = {
        transactionId: `0.0.123-${Date.now()}-${Math.random().toString(36).substring(2, 8)}`,
        tokenId: `0.0.${Math.floor(Math.random() * 1000000) + 100000}`,
        serialNumber: Math.floor(Math.random() * 10000) + 1,
        metadataUri
      };

      console.log('NFT minted successfully:', mockResult);
      
      // Simulate processing time
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      return mockResult;
    } catch (error) {
      console.error('Failed to mint NFT:', error);
      throw error;
    }
  }

  async transferNFT(
    tokenId: string,
    serialNumber: number,
    toAccountId: string,
    price?: number
  ): Promise<string> {
    if (!this.walletStatus.isConnected) {
      throw new Error('Wallet not connected');
    }

    try {
      // Simulate NFT transfer on Hedera
      const transactionId = `0.0.123-${Date.now()}-${Math.random().toString(36).substring(2, 8)}`;
      
      console.log('NFT transfer initiated:', {
        tokenId,
        serialNumber,
        from: this.walletStatus.accountId,
        to: toAccountId,
        price,
        transactionId
      });

      // Simulate processing time
      await new Promise(resolve => setTimeout(resolve, 1500));
      
      return transactionId;
    } catch (error) {
      console.error('Failed to transfer NFT:', error);
      throw error;
    }
  }

  async getAccountBalance(): Promise<{ hbars: string; nfts: number }> {
    if (!this.walletStatus.isConnected) {
      throw new Error('Wallet not connected');
    }

    try {
      // Simulate account balance query
      const balance = {
        hbars: (Math.random() * 1000).toFixed(2),
        nfts: Math.floor(Math.random() * 50) + 1
      };

      return balance;
    } catch (error) {
      console.error('Failed to get account balance:', error);
      throw error;
    }
  }

  getHederaExplorerUrl(transactionId: string): string {
    const baseUrl = this.walletStatus.network === 'mainnet' 
      ? 'https://hashscan.io/mainnet' 
      : 'https://hashscan.io/testnet';
    return `${baseUrl}/transaction/${transactionId}`;
  }

  getTokenExplorerUrl(tokenId: string, serialNumber?: number): string {
    const baseUrl = this.walletStatus.network === 'mainnet' 
      ? 'https://hashscan.io/mainnet' 
      : 'https://hashscan.io/testnet';
    return serialNumber 
      ? `${baseUrl}/token/${tokenId}?nftSerial=${serialNumber}`
      : `${baseUrl}/token/${tokenId}`;
  }
}

// Export singleton instance
export const hederaService = new HederaService();

// Utility functions
export function formatAccountId(accountId: string | null): string {
  if (!accountId) return 'Not connected';
  return accountId;
}

export function formatTokenId(tokenId: string, serialNumber?: number): string {
  return serialNumber ? `${tokenId}:${serialNumber}` : tokenId;
}

// Network configuration
export const HEDERA_NETWORKS = {
  mainnet: 'Hedera Mainnet',
  testnet: 'Hedera Testnet',
  previewnet: 'Hedera Previewnet'
} as const;

export type HederaNetwork = keyof typeof HEDERA_NETWORKS;