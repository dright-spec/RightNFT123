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

  private setupWalletListener(): Promise<boolean> {
    return new Promise((resolve) => {
      let resolved = false;
      
      // Immediate check
      const immediateResult = this.performWalletCheck();
      if (immediateResult) {
        resolved = true;
        resolve(true);
        return;
      }

      // Listen for wallet injection events
      const walletInjectionHandler = () => {
        if (resolved) return;
        const result = this.performWalletCheck();
        if (result) {
          resolved = true;
          resolve(true);
        }
      };

      // Multiple event listeners for different wallet injection patterns
      window.addEventListener('ethereum#initialized', walletInjectionHandler);
      window.addEventListener('eip6963:announceProvider', walletInjectionHandler);
      document.addEventListener('DOMContentLoaded', walletInjectionHandler);
      
      // Custom events that some wallets fire
      window.addEventListener('hashpack:initialized', walletInjectionHandler);
      window.addEventListener('blade:initialized', walletInjectionHandler);

      // Polling fallback with exponential backoff
      let attempts = 0;
      const maxAttempts = 20;
      const pollForWallet = () => {
        attempts++;
        console.log(`Wallet detection attempt ${attempts}/${maxAttempts}`);
        
        const result = this.performWalletCheck();
        if (result) {
          resolved = true;
          resolve(true);
          return;
        }

        if (attempts < maxAttempts) {
          setTimeout(pollForWallet, Math.min(attempts * 200, 2000));
        } else {
          resolved = true;
          resolve(false);
        }
      };

      // Start polling after a short delay
      setTimeout(pollForWallet, 100);
    });
  }

  private performWalletCheck(): boolean {
    // Check window properties dynamically
    const windowKeys = Object.keys(window);
    const walletKeys = windowKeys.filter(key => 
      key.toLowerCase().includes('hash') || 
      key.toLowerCase().includes('blade') || 
      key.toLowerCase().includes('hedera')
    );

    console.log('Found wallet-related keys:', walletKeys);

    // Direct property checks
    const providers = [
      // HashPack variations
      { name: 'HashPack', provider: (window as any).hashpack },
      { name: 'HashConnect', provider: (window as any).hashconnect },
      { name: 'HashPack (caps)', provider: (window as any).HashPack },
      
      // Blade variations
      { name: 'Blade SDK', provider: (window as any).bladeSDK },
      { name: 'Blade', provider: (window as any).blade },
      { name: 'Blade (caps)', provider: (window as any).Blade },
      
      // Ethereum provider checks
      { name: 'Ethereum (HashPack)', provider: (window as any).ethereum?.isHashPack ? (window as any).ethereum : null },
      { name: 'Ethereum (Blade)', provider: (window as any).ethereum?.isBlade ? (window as any).ethereum : null },
    ];

    for (const { name, provider } of providers) {
      if (provider && typeof provider === 'object') {
        console.log(`✓ Detected ${name}:`, provider);
        return true;
      }
    }

    // Check for EIP-6963 providers (modern wallet detection)
    if ((window as any).ethereum?.providers?.length > 0) {
      const providers = (window as any).ethereum.providers;
      console.log('Found EIP-6963 providers:', providers);
      
      for (const provider of providers) {
        if (provider.isHashPack || provider.isBlade || provider.isHedera) {
          console.log('✓ Detected Hedera wallet via EIP-6963:', provider);
          return true;
        }
      }
    }

    // Browser-specific wallet detection
    if ((window as any).navigator?.brave) {
      console.log('Brave browser detected - checking for built-in wallet');
      if ((window as any).ethereum) {
        console.log('✓ Brave wallet (Ethereum provider) detected');
        return true;
      }
    }

    return false;
  }

  private async checkHashPackAvailability(): Promise<boolean> {
    console.log('Starting advanced wallet detection...');
    
    // Use the new detection system
    const detected = await this.setupWalletListener();
    
    if (!detected) {
      console.log('No wallets detected after comprehensive search');
      // Log final state for debugging
      console.log('Final window state:', {
        ethereum: !!(window as any).ethereum,
        hashpack: !!(window as any).hashpack,
        blade: !!(window as any).blade,
        allKeys: Object.keys(window).slice(0, 100)
      });
    }
    
    return detected;
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
    console.log('Starting HashPack connection process...');
    
    // Wait for extension to fully load
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    // Method 1: Try HashPack direct extension API
    if ((window as any).hashpack?.connectToExtension) {
      try {
        console.log('Attempting HashPack direct extension connection...');
        const result = await (window as any).hashpack.connectToExtension();
        console.log('HashPack connection result:', result);
        
        if (result?.accountIds?.length > 0) {
          const accountId = result.accountIds[0];
          this.walletStatus = {
            isConnected: true,
            accountId: accountId,
            network: result.network || 'testnet'
          };
          localStorage.setItem('hedera_wallet', JSON.stringify(this.walletStatus));
          return accountId;
        }
      } catch (error) {
        console.log('Direct HashPack connection failed:', error);
      }
    }

    // Method 2: Try opening HashPack directly
    try {
      console.log('Attempting to open HashPack wallet...');
      const dappUrl = `hashpack://dapp-bridge?` + new URLSearchParams({
        origin: window.location.origin,
        name: 'Dright',
        description: 'Legal Rights Marketplace',
        network: 'testnet'
      }).toString();
      
      window.location.href = dappUrl;
      
      // Show instructions to user
      throw new Error('Opening HashPack wallet. Please approve the connection in your wallet and return to this page.');
      
    } catch (error) {
      console.log('HashPack deep link failed:', error);
    }

    // Method 3: Try Blade wallet as fallback
    const blade = (window as any).bladeSDK || (window as any).blade;
    if (blade) {
      console.log('Trying Blade wallet as fallback...');
      return this.connectBlade(blade);
    }

    throw new Error('Please open HashPack wallet, go to "Connect to dApp", and enter this website URL to connect.');
  }

  private async connectHashPack(hashPack: any): Promise<string> {
    try {
      console.log('Attempting HashPack connection...');
      
      if (!hashPack.connectToExtension) {
        throw new Error('HashPack API not available');
      }

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
      console.log('HashPack connected successfully:', accountId);
      return accountId;
      
    } catch (error) {
      console.error('HashPack connection error:', error);
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

  private async connectBlade(blade: any): Promise<string> {
    try {
      console.log('Attempting Blade wallet connection...');
      
      // Initialize Blade SDK
      const appMetadata = {
        name: "Dright",
        description: "Legal Rights Marketplace",
        url: window.location.origin,
        icons: [window.location.origin + "/favicon.ico"]
      };

      // Connect to Blade wallet
      const result = await blade.createSession(appMetadata);
      
      if (!result || !result.accountId) {
        throw new Error('No account found. Please create a Hedera account in Blade wallet.');
      }

      const accountId = result.accountId;
      const network = result.network || 'testnet';
      
      this.walletStatus = {
        isConnected: true,
        accountId: accountId,
        network: network
      };

      localStorage.setItem('hedera_wallet', JSON.stringify(this.walletStatus));
      console.log('Blade wallet connected successfully:', accountId);
      return accountId;
      
    } catch (error) {
      console.error('Blade wallet connection error:', error);
      if (error instanceof Error) {
        if (error.message.includes('rejected') || error.message.includes('denied')) {
          throw new Error('Connection cancelled by user');
        }
      }
      
      throw new Error('Failed to connect to Blade wallet. Please ensure the extension is installed and unlocked.');
    }
  }

  private async connectHashConnect(hashConnect: any): Promise<string> {
    try {
      console.log('Attempting HashConnect connection...');
      
      // Basic HashConnect connection
      const result = await hashConnect.connect();
      
      if (!result || !result.accountIds || result.accountIds.length === 0) {
        throw new Error('No accounts found in HashConnect.');
      }

      const accountId = result.accountIds[0];
      const network = result.network || 'testnet';
      
      this.walletStatus = {
        isConnected: true,
        accountId: accountId,
        network: network
      };

      localStorage.setItem('hedera_wallet', JSON.stringify(this.walletStatus));
      console.log('HashConnect connected successfully:', accountId);
      return accountId;
      
    } catch (error) {
      console.error('HashConnect connection error:', error);
      throw new Error('Failed to connect via HashConnect.');
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