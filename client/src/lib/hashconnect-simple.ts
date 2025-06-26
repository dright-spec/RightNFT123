/**
 * Simplified HashConnect v3 Implementation
 * Focus on what actually works without TypeScript errors
 */

import { HashConnect } from "hashconnect";

const appMetadata = {
  name: "Dright",
  description: "Hedera NFT marketplace",
  icons: [window.location.origin + "/favicon.ico"],
  url: window.location.origin
};

class SimpleHashConnect {
  private hashConnect: HashConnect | null = null;
  private pairingData: any = null;

  async connectWallet(): Promise<string> {
    try {
      console.log('🔄 Initializing HashConnect v3...');
      
      // Create HashConnect instance - using basic constructor since params cause errors
      this.hashConnect = new HashConnect();

      // Set up event listeners if they exist
      this.setupEventListeners();
      
      console.log('✅ HashConnect initialized successfully');

      // Try direct HashPack extension first (most reliable)
      if (typeof window !== 'undefined' && (window as any).hashpack) {
        console.log('🚀 Using direct HashPack extension...');
        const hashpack = (window as any).hashpack;
        const response = await hashpack.requestAccountInfo();
        if (response.success) {
          console.log('✅ HashPack connected via extension:', response.accountId);
          return response.accountId;
        }
      }

      // Fallback: Try HashConnect methods if they exist
      console.log('🔄 Trying HashConnect wallet connection...');
      
      // Check what methods are actually available
      const availableMethods = Object.getOwnPropertyNames(this.hashConnect)
        .concat(Object.getOwnPropertyNames(Object.getPrototypeOf(this.hashConnect)))
        .filter(name => typeof (this.hashConnect as any)[name] === 'function');
      
      console.log('📋 Available HashConnect methods:', availableMethods);

      // Try the actual v3 methods that were discovered
      const v3Methods = ['connectToExtension', 'openPairingModal', 'findLocalWallets'];
      
      for (const method of v3Methods) {
        if (availableMethods.includes(method)) {
          console.log(`🔄 Trying HashConnect v3 method: ${method}...`);
          try {
            if (method === 'findLocalWallets') {
              const wallets = await (this.hashConnect as any)[method]();
              console.log('📱 Found wallets:', wallets);
              if (wallets && wallets.length > 0) {
                // Try to connect to first wallet
                await (this.hashConnect as any).connectToExtension(wallets[0]);
              }
            } else {
              await (this.hashConnect as any)[method]();
            }
            
            // Wait for pairing with longer timeout for user interaction
            await new Promise((resolve, reject) => {
              const timeout = setTimeout(() => reject(new Error('Connection timeout - user may have cancelled')), 30000);
              const check = () => {
                if (this.pairingData?.accountIds?.length > 0) {
                  clearTimeout(timeout);
                  resolve(this.pairingData);
                } else {
                  setTimeout(check, 500);
                }
              };
              check();
            });
            
            return this.pairingData.accountIds[0];
          } catch (error) {
            console.log(`❌ ${method} failed:`, error);
          }
        }
      }

      throw new Error('No working connection method found');

    } catch (error) {
      console.error('❌ HashConnect connection failed:', error);
      throw new Error('Failed to connect to HashPack wallet');
    }
  }

  private setupEventListeners(): void {
    if (!this.hashConnect) return;

    try {
      // Check what events are available
      const events = Object.getOwnPropertyNames(this.hashConnect)
        .filter(name => name.includes('Event') || name.includes('event'));
      
      console.log('📋 Available HashConnect events:', events);

      // Try to set up pairing event listener
      if ((this.hashConnect as any).pairingEvent?.on) {
        (this.hashConnect as any).pairingEvent.on((data: any) => {
          console.log('🔗 Pairing event:', data);
          this.pairingData = data;
        });
      }

      // Try other event patterns
      if ((this.hashConnect as any).on) {
        (this.hashConnect as any).on('pairingEvent', (data: any) => {
          console.log('🔗 Pairing event (on):', data);
          this.pairingData = data;
        });
      }

    } catch (error) {
      console.warn('Event listeners setup failed:', error);
    }
  }

  getAccountId(): string | null {
    return this.pairingData?.accountIds?.[0] || null;
  }

  isConnected(): boolean {
    return !!(this.pairingData?.accountIds?.length > 0);
  }

  disconnect(): void {
    this.pairingData = null;
    if (this.hashConnect) {
      try {
        const disconnectMethods = ['disconnect', 'clearPairings', 'reset'];
        for (const method of disconnectMethods) {
          if (typeof (this.hashConnect as any)[method] === 'function') {
            (this.hashConnect as any)[method]();
            break;
          }
        }
      } catch (error) {
        console.warn('Disconnect failed:', error);
      }
    }
  }
}

export const simpleHashConnect = new SimpleHashConnect();