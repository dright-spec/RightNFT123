import { HashConnect } from '@hashgraph/hashconnect';

// Hedera wallet configuration for HashPack and Blade
export interface HederaWalletConfig {
  name: string;
  description: string;
  icon: string;
  connectMethod: () => Promise<void>;
}

// Simplified Hedera wallet manager with better error handling
export class HederaWalletManager {
  private hashConnect: HashConnect | null = null;
  private isInitialized = false;
  private connectionAttempts = 0;
  private maxRetries = 3;

  private appMetadata = {
    name: "Dright - Rights Marketplace",
    description: "Hedera NFT marketplace for tokenizing legal rights",
    icons: ["/favicon.ico"],
    url: typeof window !== 'undefined' ? window.location.origin : 'https://dright.com'
  };

  constructor() {
    // Delay initialization to avoid WebSocket issues
    this.initializeWithDelay();
  }

  private async initializeWithDelay() {
    // Wait for DOM to be ready
    if (typeof window !== 'undefined') {
      setTimeout(() => {
        this.safeInitialize();
      }, 1000);
    }
  }

  private async safeInitialize() {
    try {
      this.hashConnect = new HashConnect(false); // Use testnet for development
      await this.hashConnect.init(this.appMetadata);
      this.isInitialized = true;
      console.log('HashConnect initialized successfully');
    } catch (error) {
      console.warn('HashConnect initialization failed:', error);
      this.isInitialized = false;
    }
  }

  // Initialize HashConnect with retry logic
  async initialize() {
    if (this.isInitialized && this.hashConnect) {
      return true;
    }

    if (this.connectionAttempts >= this.maxRetries) {
      console.warn('Max HashConnect initialization attempts reached');
      return false;
    }

    this.connectionAttempts++;
    
    try {
      if (!this.hashConnect) {
        this.hashConnect = new HashConnect(false); // testnet for development
      }
      
      await this.hashConnect.init(this.appMetadata);
      this.isInitialized = true;
      return true;
    } catch (error) {
      console.warn(`HashConnect initialization attempt ${this.connectionAttempts} failed:`, error);
      return false;
    }
  }

  // Connect to HashPack wallet with fallback
  async connectHashPack() {
    if (!this.isInitialized) {
      const initialized = await this.initialize();
      if (!initialized) {
        throw new Error('HashConnect not available. Please ensure HashPack wallet is installed.');
      }
    }

    try {
      if (this.hashConnect) {
        await this.hashConnect.connect();
        return this.hashConnect.pairingData;
      }
      throw new Error('HashConnect not initialized');
    } catch (error) {
      console.error('HashPack connection failed:', error);
      throw new Error('Failed to connect to HashPack. Please ensure the wallet is installed and try again.');
    }
  }

  // Get available Hedera wallets
  getAvailableWallets(): HederaWalletConfig[] {
    return [
      {
        name: 'HashPack',
        description: 'The most popular Hedera wallet',
        icon: '🟢',
        connectMethod: () => this.connectHashPack()
      },
      {
        name: 'Manual Connect',
        description: 'Connect with any Hedera wallet',
        icon: '🔗',
        connectMethod: () => this.connectManual()
      }
    ];
  }

  // Manual connection method for any Hedera wallet
  async connectManual() {
    // For now, just open HashPack download page
    if (typeof window !== 'undefined') {
      window.open('https://www.hashpack.app/download', '_blank');
    }
    throw new Error('Please install HashPack wallet and try again.');
  }

  // Disconnect wallet
  async disconnect() {
    try {
      if (this.hashConnect) {
        await this.hashConnect.disconnect();
      }
    } catch (error) {
      console.warn('Disconnect failed:', error);
    }
  }

  // Get connection status
  get isConnected() {
    return this.hashConnect?.pairingData?.accountIds?.length > 0;
  }

  // Get connected account
  get connectedAccount() {
    return this.hashConnect?.pairingData?.accountIds?.[0];
  }

  // Check if HashConnect is available
  get isAvailable() {
    return this.isInitialized && this.hashConnect !== null;
  }
}

export const hederaWalletManager = new HederaWalletManager();