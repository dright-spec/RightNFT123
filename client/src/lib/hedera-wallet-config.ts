import { HashConnect } from '@hashgraph/hashconnect';

// Hedera wallet configuration for HashPack and Blade
export interface HederaWalletConfig {
  name: string;
  description: string;
  icon: string;
  connectMethod: () => Promise<void>;
}

// Initialize HashConnect for Hedera wallets
export class HederaWalletManager {
  private hashConnect: HashConnect;
  private appMetadata = {
    name: "Dright - Rights Marketplace",
    description: "Hedera NFT marketplace for tokenizing legal rights",
    icons: ["/favicon.ico"],
    url: typeof window !== 'undefined' ? window.location.origin : 'https://dright.com'
  };

  constructor() {
    this.hashConnect = new HashConnect(true); // true for mainnet
  }

  // Initialize HashConnect
  async initialize() {
    try {
      await this.hashConnect.init(this.appMetadata);
      return true;
    } catch (error) {
      console.error('Failed to initialize HashConnect:', error);
      return false;
    }
  }

  // Connect to HashPack wallet
  async connectHashPack() {
    try {
      await this.hashConnect.connect();
      return this.hashConnect.pairingData;
    } catch (error) {
      console.error('Failed to connect to HashPack:', error);
      throw error;
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
        name: 'Blade Wallet',
        description: 'Secure Hedera wallet with staking',
        icon: '⚔️',
        connectMethod: () => this.connectBlade()
      }
    ];
  }

  // Connect to Blade wallet (placeholder for future implementation)
  async connectBlade() {
    // Blade wallet integration would go here
    throw new Error('Blade wallet integration not yet implemented');
  }

  // Disconnect wallet
  async disconnect() {
    try {
      await this.hashConnect.disconnect();
    } catch (error) {
      console.error('Failed to disconnect:', error);
    }
  }

  // Get connection status
  get isConnected() {
    return this.hashConnect.pairingData?.accountIds?.length > 0;
  }

  // Get connected account
  get connectedAccount() {
    return this.hashConnect.pairingData?.accountIds?.[0];
  }
}

export const hederaWalletManager = new HederaWalletManager();