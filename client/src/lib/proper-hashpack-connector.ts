// Proper HashPack Connector using official HashConnect SDK
// This implements the correct HashPack connection workflow with proper window object usage

import { HashConnect, HashConnectTypes, MessageTypes } from '@hashgraph/hashconnect';

interface HashPackWalletInfo {
  accountId: string;
  network: 'testnet' | 'mainnet';
  isConnected: boolean;
}

export class ProperHashPackConnector {
  private hashConnect: HashConnect | null = null;
  private appMetadata: HashConnectTypes.AppMetadata = {
    name: 'Dright Marketplace',
    description: 'Legal Rights NFT Marketplace on Hedera',
    url: window.location.origin,
    icon: `${window.location.origin}/favicon.ico`
  };
  private network: 'testnet' | 'mainnet' = 'testnet' as const;
  private isInitialized = false;
  private pairingTopic: string | null = null;

  async initialize(): Promise<boolean> {
    if (this.isInitialized && this.hashConnect) {
      return true;
    }

    console.log('🔗 Initializing proper HashPack connector...');

    try {
      // Create new HashConnect instance
      this.hashConnect = new HashConnect(false); // production mode

      // Initialize HashConnect
      const initData = await this.hashConnect.init(
        this.appMetadata,
        this.network,
        false // debug disabled
      );

      this.pairingTopic = initData.topic;
      this.isInitialized = true;

      console.log('✅ HashConnect initialized with topic:', this.pairingTopic);

      // Set up event listeners
      this.setupEventListeners();

      return true;
    } catch (error) {
      console.error('❌ HashConnect initialization failed:', error);
      return false;
    }
  }

  private setupEventListeners(): void {
    if (!this.hashConnect) return;

    try {
      // Listen for pairing events using proper HashConnect event handling
      this.hashConnect.pairingEvent?.once((pairingData: MessageTypes.ApprovePairing) => {
        console.log('🔗 Pairing event received:', pairingData);
        
        if (pairingData.accountIds && pairingData.accountIds.length > 0) {
          const accountId = pairingData.accountIds[0];
          console.log('✅ Wallet connected:', accountId);
          
          // Store connection info
          this.storeConnectionInfo({
            accountId,
            network: this.network,
            isConnected: true
          });

          // Emit custom event for UI updates
          window.dispatchEvent(new CustomEvent('hashpack-connected', {
            detail: { accountId, network: this.network }
          }));
        }
      });

      // Listen for connection status changes
      this.hashConnect.connectionStatusChangeEvent?.once((connectionStatus: any) => {
        console.log('🔗 Connection status changed:', connectionStatus);
      });

      // Listen for found extensions
      this.hashConnect.foundExtensionEvent?.once((walletMetadata: any) => {
        console.log('🔗 Found wallet extension:', walletMetadata);
      });
    } catch (error) {
      console.log('⚠️ Event listener setup failed:', error);
    }
  }

  async connectWallet(): Promise<HashPackWalletInfo | null> {
    console.log('🔗 Starting HashPack wallet connection...');

    if (!this.isInitialized) {
      const initialized = await this.initialize();
      if (!initialized) {
        throw new Error('Failed to initialize HashConnect');
      }
    }

    try {
      // Method 1: Try direct HashPack window object first
      if ((window as any).hashpack) {
        console.log('🔗 Attempting direct HashPack window object connection...');
        
        const hashpack = (window as any).hashpack;
        
        if (hashpack.requestAccountInfo) {
          try {
            const accountInfo = await hashpack.requestAccountInfo();
            console.log('✅ HashPack account info:', accountInfo);
            
            if (accountInfo.accountId) {
              const walletInfo: HashPackWalletInfo = {
                accountId: accountInfo.accountId,
                network: this.network,
                isConnected: true
              };
              
              this.storeConnectionInfo(walletInfo);
              return walletInfo;
            }
          } catch (error) {
            console.log('⚠️ Direct HashPack connection failed:', error);
          }
        }
      }

      // Method 2: Use HashConnect local wallet connection
      if (this.hashConnect && this.hashConnect.connectToLocalWallet) {
        console.log('🔗 Attempting HashConnect local wallet connection...');
        
        try {
          await this.hashConnect.connectToLocalWallet();
          
          // Wait for pairing event
          return new Promise((resolve, reject) => {
            const timeout = setTimeout(() => {
              reject(new Error('Connection timeout - please ensure HashPack is installed and unlocked'));
            }, 10000);

            const handlePairing = (event: CustomEvent) => {
              clearTimeout(timeout);
              window.removeEventListener('hashpack-connected', handlePairing as EventListener);
              resolve({
                accountId: event.detail.accountId,
                network: event.detail.network,
                isConnected: true
              });
            };

            window.addEventListener('hashpack-connected', handlePairing as EventListener);
          });
        } catch (error) {
          console.log('⚠️ HashConnect local wallet connection failed:', error);
        }
      }

      // Method 3: Generate pairing string for QR code
      if (this.hashConnect && this.pairingTopic) {
        console.log('🔗 Generating pairing string for QR code connection...');
        
        const pairingString = this.hashConnect.generatePairingString(
          this.pairingTopic,
          this.network,
          false
        );

        console.log('📱 Use this pairing string or scan QR code:', pairingString);
        
        // For now, throw an error to indicate QR code method needed
        throw new Error(`HashPack not detected. Please install HashPack extension or use pairing string: ${pairingString}`);
      }

      throw new Error('HashConnect not properly initialized');

    } catch (error) {
      console.error('❌ HashPack connection failed:', error);
      throw error;
    }
  }

  async disconnectWallet(): Promise<void> {
    console.log('🔗 Disconnecting HashPack wallet...');
    
    if (this.hashConnect && this.pairingTopic) {
      try {
        await this.hashConnect.disconnect(this.pairingTopic);
        console.log('✅ HashPack disconnected');
      } catch (error) {
        console.error('⚠️ Disconnect error:', error);
      }
    }

    // Clear stored connection
    this.clearConnectionInfo();
    
    // Emit disconnect event
    window.dispatchEvent(new CustomEvent('hashpack-disconnected'));
  }

  getStoredConnection(): HashPackWalletInfo | null {
    try {
      const stored = localStorage.getItem('proper_hashpack_connection');
      if (stored) {
        return JSON.parse(stored);
      }
    } catch (error) {
      console.log('⚠️ Failed to load stored connection:', error);
    }
    return null;
  }

  private storeConnectionInfo(info: HashPackWalletInfo): void {
    try {
      localStorage.setItem('proper_hashpack_connection', JSON.stringify(info));
      console.log('💾 Connection info stored');
    } catch (error) {
      console.error('⚠️ Failed to store connection info:', error);
    }
  }

  private clearConnectionInfo(): void {
    try {
      localStorage.removeItem('proper_hashpack_connection');
      console.log('🗑️ Connection info cleared');
    } catch (error) {
      console.error('⚠️ Failed to clear connection info:', error);
    }
  }

  // Check if HashPack extension is properly available
  static async isHashPackAvailable(): Promise<boolean> {
    // Check for direct window object
    if ((window as any).hashpack) {
      console.log('✅ HashPack window object detected');
      return true;
    }

    // Check via HashConnect extension detection
    try {
      const hashConnect = new HashConnect(false);
      await hashConnect.init(
        {
          name: "Detection Test",
          description: "HashPack detection",
          url: window.location.origin,
          icon: `${window.location.origin}/favicon.ico`
        },
        'testnet',
        false
      );

      // Wait for extension detection
      return new Promise((resolve) => {
        let found = false;
        const timeout = setTimeout(() => {
          if (!found) {
            console.log('❌ HashPack not detected via HashConnect');
            resolve(false);
          }
        }, 3000);

        if (hashConnect.foundExtensionEvent) {
          hashConnect.foundExtensionEvent.on((walletMetadata: any) => {
            const name = walletMetadata.name.toLowerCase();
            if (name.includes('hashpack')) {
              found = true;
              clearTimeout(timeout);
              console.log('✅ HashPack detected via HashConnect:', walletMetadata.name);
              resolve(true);
            }
          });
        }
      });
    } catch (error) {
      console.error('❌ HashConnect detection failed:', error);
      return false;
    }
  }
}

// Export singleton instance
export const properHashPackConnector = new ProperHashPackConnector();