/**
 * Working HashConnect v3 Implementation
 * Based on real hashconnect@3.0.13 package API
 */

import { HashConnect } from "hashconnect";

// Simple app metadata
const appMetadata = {
  name: "Dright",
  description: "Hedera NFT marketplace",
  icons: [window.location.origin + "/favicon.ico"],
  url: window.location.origin
};

class WorkingHashConnect {
  private hashConnect: HashConnect | null = null;
  private pairingData: any = null;

  async init(): Promise<void> {
    if (this.hashConnect) return;

    try {
      console.log('🔄 Initializing HashConnect v3...');
      
      // Create HashConnect instance with correct v3 parameters
      this.hashConnect = new HashConnect("testnet", "dright-app", appMetadata, true);

      // Set up basic event listeners
      this.setupEventListeners();
      
      console.log('✅ HashConnect initialized successfully');
      
    } catch (error) {
      console.error('❌ Failed to initialize HashConnect:', error);
      // Try fallback constructor
      try {
        console.log('🔄 Trying fallback HashConnect initialization...');
        this.hashConnect = new HashConnect();
        this.setupEventListeners();
        console.log('✅ HashConnect fallback initialization successful');
      } catch (fallbackError) {
        console.error('❌ Fallback initialization also failed:', fallbackError);
        throw fallbackError;
      }
    }
  }

  private setupEventListeners(): void {
    if (!this.hashConnect) return;

    try {
      // Listen for pairing events
      if (this.hashConnect.pairingEvent) {
        this.hashConnect.pairingEvent.on((pairingData: any) => {
          console.log('🔗 Wallet paired:', pairingData);
          this.pairingData = pairingData;
        });
      }

      // Listen for connection status
      if (this.hashConnect.connectionStatusChangeEvent) {
        this.hashConnect.connectionStatusChangeEvent.on((status: any) => {
          console.log('📡 Connection status:', status);
        });
      }
    } catch (error) {
      console.warn('Event listeners setup failed:', error);
    }
  }

  async connectWallet(): Promise<string> {
    await this.init();

    if (!this.hashConnect) {
      throw new Error('HashConnect not initialized');
    }

    try {
      console.log('🚀 Connecting to HashPack wallet...');

      // Try different connection methods
      if (typeof this.hashConnect.connectToLocalWallet === 'function') {
        await this.hashConnect.connectToLocalWallet();
      } else if (typeof this.hashConnect.openRequestedPairing === 'function') {
        this.hashConnect.openRequestedPairing();
      } else {
        // Fallback - direct HashPack integration
        if (typeof window !== 'undefined' && (window as any).hashpack) {
          const hashpack = (window as any).hashpack;
          const response = await hashpack.requestAccountInfo();
          if (response.success) {
            return response.accountId;
          }
        }
        throw new Error('No wallet connection method available');
      }

      // Wait for pairing
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
      console.log('✅ HashPack connected:', accountId);
      return accountId;

    } catch (error) {
      console.error('❌ HashPack connection failed:', error);
      throw new Error('Failed to connect to HashPack wallet');
    }
  }

  disconnect(): void {
    if (this.hashConnect && this.pairingData) {
      try {
        if (typeof this.hashConnect.disconnect === 'function') {
          this.hashConnect.disconnect(this.pairingData.topic);
        }
      } catch (error) {
        console.warn('Disconnect failed:', error);
      }
      this.pairingData = null;
    }
  }

  getAccountId(): string | null {
    return this.pairingData?.accountIds?.[0] || null;
  }

  isConnected(): boolean {
    return !!(this.pairingData && this.pairingData.accountIds?.length > 0);
  }
}

export const workingHashConnect = new WorkingHashConnect();