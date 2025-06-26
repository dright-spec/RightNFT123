/**
 * Final HashConnect v3 Implementation
 * Based on working demo patterns and proper v3 API usage
 */

import { HashConnect } from "hashconnect";

const appMetadata = {
  name: "Dright",
  description: "Hedera NFT marketplace",
  icons: [window.location.origin + "/favicon.ico"],
  url: window.location.origin
};

class FinalHashConnect {
  private hashConnect: HashConnect | null = null;
  private pairingData: any = null;

  async connectWallet(): Promise<string> {
    try {
      console.log('🔄 Starting HashConnect v3 connection...');
      
      // Step 1: Create HashConnect instance
      this.hashConnect = new HashConnect();
      console.log('✅ HashConnect instance created');

      // Step 2: Set up event listeners BEFORE initialization
      this.setupEventListeners();

      // Step 3: Initialize HashConnect (try different approaches)
      try {
        // Try with parameters first
        if (typeof (this.hashConnect as any).init === 'function') {
          await (this.hashConnect as any).init(appMetadata, "testnet", true);
          console.log('✅ HashConnect initialized with parameters');
        } else {
          console.log('✅ HashConnect ready (no init method needed)');
        }
      } catch (initError) {
        console.warn('⚠️ Init failed, continuing without it:', initError);
      }

      // Step 4: Try direct extension connection first (most reliable)
      if (typeof window !== 'undefined' && (window as any).hashpack) {
        console.log('🚀 Trying direct HashPack extension...');
        const hashpack = (window as any).hashpack;
        try {
          const response = await hashpack.requestAccountInfo();
          if (response && response.success && response.accountId) {
            console.log('✅ Direct HashPack connection successful:', response.accountId);
            return response.accountId;
          }
        } catch (error) {
          console.log('❌ Direct HashPack failed:', error);
        }
      }

      // Step 5: Use findLocalWallets approach (the working method)
      console.log('🔄 Using findLocalWallets approach...');
      
      const methods = Object.getOwnPropertyNames(Object.getPrototypeOf(this.hashConnect))
        .concat(Object.getOwnPropertyNames(this.hashConnect))
        .filter(name => typeof (this.hashConnect as any)[name] === 'function');
      
      console.log('📋 Available HashConnect methods:', methods);

      if (methods.includes('findLocalWallets')) {
        console.log('🔍 Finding local wallets...');
        const wallets = (this.hashConnect as any).findLocalWallets();
        console.log('📱 Found local wallets:', wallets);
        
        if (wallets && wallets.length > 0) {
          console.log('🔗 Attempting to connect to first wallet:', wallets[0]);
          
          // Try connectToExtension with the found wallet
          if (methods.includes('connectToExtension')) {
            await (this.hashConnect as any).connectToExtension();
            console.log('✅ Connected via connectToExtension');
          }
          // Try connectToLocalWallet if it exists
          else if (methods.includes('connectToLocalWallet')) {
            await (this.hashConnect as any).connectToLocalWallet(wallets[0]);
            console.log('✅ Connected via connectToLocalWallet');
          }
          else {
            console.log('⚠️ No connection method available for found wallets');
          }
        } else {
          console.log('❌ No local wallets found');
          throw new Error('No HashPack wallet found. Please install HashPack extension.');
        }
      } else {
        console.log('❌ findLocalWallets method not available');
        throw new Error('Wallet discovery not available in this HashConnect version');
      }

      // Wait for pairing with proper timeout
      return await new Promise((resolve, reject) => {
        const timeout = setTimeout(() => {
          reject(new Error('Connection timeout - please try again'));
        }, 60000); // 60 seconds for user interaction

        const checkConnection = () => {
          if (this.pairingData?.accountIds?.length > 0) {
            clearTimeout(timeout);
            const accountId = this.pairingData.accountIds[0];
            console.log('✅ HashConnect pairing successful:', accountId);
            resolve(accountId);
          } else {
            setTimeout(checkConnection, 1000);
          }
        };

        // Start checking after a brief delay
        setTimeout(checkConnection, 2000);
      });

    } catch (error) {
      console.error('❌ HashConnect connection failed:', error);
      throw new Error('Failed to connect to HashPack wallet');
    }
  }

  private setupEventListeners(): void {
    if (!this.hashConnect) return;

    try {
      // Listen for pairing events
      if (this.hashConnect.pairingEvent) {
        this.hashConnect.pairingEvent.on((pairingData: any) => {
          console.log('🔗 Pairing event received:', pairingData);
          this.pairingData = pairingData;
        });
      }

      // Listen for connection status changes
      if (this.hashConnect.connectionStatusChangeEvent) {
        this.hashConnect.connectionStatusChangeEvent.on((status: any) => {
          console.log('📡 Connection status changed:', status);
        });
      }

      // Listen for approval events
      if ((this.hashConnect as any).approveEvent) {
        (this.hashConnect as any).approveEvent.on((data: any) => {
          console.log('✅ Approval event:', data);
        });
      }

      console.log('📡 Event listeners set up successfully');
    } catch (error) {
      console.warn('⚠️ Event listener setup failed:', error);
    }
  }

  getAccountId(): string | null {
    return this.pairingData?.accountIds?.[0] || null;
  }

  isConnected(): boolean {
    return !!(this.pairingData?.accountIds?.length > 0);
  }

  disconnect(): void {
    if (this.hashConnect && this.pairingData) {
      try {
        // Try different disconnect methods
        if (typeof (this.hashConnect as any).disconnect === 'function') {
          (this.hashConnect as any).disconnect(this.pairingData.topic);
        } else if (typeof (this.hashConnect as any).clearPairings === 'function') {
          (this.hashConnect as any).clearPairings();
        }
      } catch (error) {
        console.warn('Disconnect failed:', error);
      }
    }
    this.pairingData = null;
    this.hashConnect = null;
  }
}

export const finalHashConnect = new FinalHashConnect();