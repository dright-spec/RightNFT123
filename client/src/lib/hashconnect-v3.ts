/**
 * HashConnect v3 Implementation
 * Following official HashConnect v3 documentation
 */

import { HashConnect, HashConnectTypes, MessageTypes } from "@hashgraph/hashconnect";

// App metadata for HashConnect v3
const appMetadata: HashConnectTypes.AppMetadata = {
  name: "Dright – Rights Marketplace",
  description: "Hedera NFT marketplace for tokenizing legal rights",
  icon: window.location.origin + "/favicon.ico",
  url: window.location.origin,
};

// Project configuration
const projectId = "dright-rights-marketplace";
const network = "testnet"; // or "mainnet" for production

class HashConnectV3Service {
  private hashConnect: HashConnect | null = null;
  private availableExtensions: HashConnectTypes.WalletMetadata[] = [];
  private pairingData: HashConnectTypes.SavedPairingData | null = null;

  /**
   * Initialize HashConnect v3
   */
  async init(): Promise<void> {
    if (this.hashConnect) return;

    try {
      console.log('🔄 Initializing HashConnect v3...');
      
      // Create HashConnect instance  
      this.hashConnect = new HashConnect();

      // Set up event listeners
      this.setupEventListeners();

      // Initialize the connection
      await this.hashConnect.init(appMetadata, network, false);
      
      console.log('✅ HashConnect v3 initialized successfully');
      
      // Find available extensions
      await this.findExtensions();
      
    } catch (error) {
      console.error('❌ Failed to initialize HashConnect v3:', error);
      throw error;
    }
  }

  /**
   * Set up HashConnect event listeners
   */
  private setupEventListeners(): void {
    if (!this.hashConnect) return;

    // Listen for wallet extension discovery
    this.hashConnect.foundExtensionEvent.on((walletMetadata) => {
      console.log('🔍 Found wallet extension:', walletMetadata);
      this.availableExtensions.push(walletMetadata);
    });

    // Listen for pairing events
    this.hashConnect.pairingEvent.on((pairingData) => {
      console.log('🔗 Wallet paired:', pairingData);
      this.pairingData = {
        ...pairingData,
        lastUsed: Date.now()
      };
    });

    // Listen for connection status
    this.hashConnect.connectionStatusChangeEvent.on((connectionStatus) => {
      console.log('📡 Connection status changed:', connectionStatus);
    });
  }

  /**
   * Find available wallet extensions
   */
  async findExtensions(): Promise<HashConnectTypes.WalletMetadata[]> {
    if (!this.hashConnect) {
      throw new Error('HashConnect not initialized');
    }

    try {
      console.log('🔍 Searching for wallet extensions...');
      
      // Wait for extensions to be discovered
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      console.log(`📱 Found ${this.availableExtensions.length} wallet extensions`);
      return this.availableExtensions;
      
    } catch (error) {
      console.error('❌ Failed to find extensions:', error);
      return [];
    }
  }

  /**
   * Connect to HashPack wallet
   */
  async connectWallet(): Promise<string> {
    if (!this.hashConnect) {
      await this.init();
    }

    try {
      console.log('🚀 Connecting to HashPack wallet...');

      // Find HashPack extension
      const hashPackExtension = this.availableExtensions.find(
        ext => ext.name.toLowerCase().includes('hashpack')
      );

      if (!hashPackExtension) {
        throw new Error('HashPack extension not found. Please install HashPack wallet.');
      }

      console.log('📱 Found HashPack extension:', hashPackExtension);

      // Initiate pairing with HashPack
      await this.hashConnect!.connectToLocalWallet();

      // Wait for pairing to complete
      await new Promise((resolve, reject) => {
        const timeout = setTimeout(() => {
          reject(new Error('Connection timeout'));
        }, 30000);

        const checkPairing = () => {
          if (this.pairingData && this.pairingData.accountIds?.length > 0) {
            clearTimeout(timeout);
            resolve(this.pairingData);
          } else {
            setTimeout(checkPairing, 100);
          }
        };
        checkPairing();
      });

      if (!this.pairingData || !this.pairingData.accountIds?.length) {
        throw new Error('No account information received from HashPack');
      }

      const accountId = this.pairingData.accountIds[0];
      
      // Validate Hedera account format
      if (!/^0\.0\.\d+$/.test(accountId)) {
        throw new Error(`Invalid Hedera account format: ${accountId}`);
      }

      console.log('✅ HashPack connected successfully:', accountId);
      return accountId;

    } catch (error: any) {
      console.error('❌ HashPack connection failed:', error);
      
      if (error.message?.includes('User rejected') || error.code === 4001) {
        throw new Error('Connection cancelled by user');
      }
      
      throw new Error(`HashPack connection failed: ${error.message || 'Unknown error'}`);
    }
  }

  /**
   * Check if HashPack is connected
   */
  isConnected(): boolean {
    return !!(this.pairingData && this.pairingData.accountIds?.length > 0);
  }

  /**
   * Get connected account ID
   */
  getAccountId(): string | null {
    return this.pairingData?.accountIds?.[0] || null;
  }

  /**
   * Disconnect from wallet
   */
  async disconnect(): Promise<void> {
    if (this.hashConnect && this.pairingData) {
      try {
        await this.hashConnect.disconnect(this.pairingData.topic);
        this.pairingData = null;
        console.log('✅ Disconnected from HashPack');
      } catch (error) {
        console.warn('Warning during disconnect:', error);
      }
    }
  }

  /**
   * Get available extensions
   */
  getAvailableExtensions(): HashConnectTypes.WalletMetadata[] {
    return this.availableExtensions;
  }
}

// Export singleton instance
export const hashConnectV3 = new HashConnectV3Service();

// For debugging
if (typeof window !== 'undefined') {
  (window as any).hashConnectV3 = hashConnectV3;
}