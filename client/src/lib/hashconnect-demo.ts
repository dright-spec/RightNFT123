/**
 * HashConnect v3 Implementation - Based on HashPack Demo
 * https://hashpack.github.io/hashconnect/
 */

import { HashConnect } from "hashconnect";

// App metadata for HashConnect v3
const appMetadata = {
  name: "Dright – Rights Marketplace",
  description: "Hedera NFT marketplace for tokenizing legal rights",
  icons: [window.location.origin + "/favicon.ico"],
  url: window.location.origin
};

class HashConnectV3Demo {
  private hashConnect: HashConnect | null = null;
  private availableExtensions: any[] = [];
  private pairingData: any = null;

  /**
   * Initialize HashConnect v3 - Demo Style
   */
  async init(): Promise<void> {
    if (this.hashConnect) return;

    try {
      console.log('🔄 Initializing HashConnect v3 (Demo)...');
      
      // Create HashConnect instance - try basic constructor first
      this.hashConnect = new HashConnect();

      // Set up event listeners
      this.setupEventListeners();
      
      console.log('✅ HashConnect v3 Demo initialized successfully');
      
    } catch (error) {
      console.error('❌ Failed to initialize HashConnect v3 Demo:', error);
      throw error;
    }
  }

  /**
   * Set up HashConnect event listeners - Demo Style
   */
  private setupEventListeners(): void {
    if (!this.hashConnect) return;

    // Listen for pairing events
    this.hashConnect.pairingEvent.once((pairingData) => {
      console.log('🔗 Wallet paired (Demo):', pairingData);
      this.pairingData = pairingData;
    });

    // Listen for connection status
    this.hashConnect.connectionStatusChangeEvent.on((connectionStatus) => {
      console.log('📡 Connection status changed (Demo):', connectionStatus);
    });
  }

  /**
   * Connect to wallet - Demo Style
   */
  async connectWallet(): Promise<string> {
    await this.init();

    if (!this.hashConnect) {
      throw new Error('HashConnect not initialized');
    }

    try {
      console.log('🚀 Connecting to HashPack wallet (Demo)...');

      // Request wallet connection
      await this.hashConnect.connectToLocalWallet();

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

      const accountId = this.pairingData.accountIds[0];
      console.log('✅ HashPack connected successfully (Demo):', accountId);
      return accountId;

    } catch (error) {
      console.error('❌ HashPack connection failed (Demo):', error);
      throw new Error('Failed to connect to HashPack wallet');
    }
  }

  /**
   * Disconnect wallet
   */
  disconnect(): void {
    if (this.hashConnect && this.pairingData) {
      this.hashConnect.disconnect(this.pairingData.topic);
      this.pairingData = null;
      console.log('🔌 Wallet disconnected (Demo)');
    }
  }

  /**
   * Get current account ID
   */
  getAccountId(): string | null {
    return this.pairingData?.accountIds?.[0] || null;
  }

  /**
   * Check if wallet is connected
   */
  isConnected(): boolean {
    return !!(this.pairingData && this.pairingData.accountIds?.length > 0);
  }
}

// Export singleton instance
export const hashConnectDemo = new HashConnectV3Demo();