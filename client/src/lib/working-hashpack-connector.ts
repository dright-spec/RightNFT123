// Working HashPack Connector using HashConnect SDK
// This uses the proven HashConnect approach with proper pairing workflow

import { HashConnect, HashConnectTypes, MessageTypes } from '@hashgraph/hashconnect';

interface WalletConnection {
  accountId: string;
  network: string;
  isConnected: boolean;
}

export class WorkingHashPackConnector {
  private hashConnect: HashConnect | null = null;
  private isInitialized = false;
  private pairingTopic: string | null = null;
  private connectionData: WalletConnection | null = null;

  private appMetadata: HashConnectTypes.AppMetadata = {
    name: 'Dright Marketplace',
    description: 'Legal Rights NFT Marketplace on Hedera',
    url: window.location.origin,
    icon: `${window.location.origin}/favicon.ico`
  };

  async initialize(): Promise<boolean> {
    if (this.isInitialized) return true;

    console.log('🔗 Initializing HashPack connector...');

    try {
      this.hashConnect = new HashConnect(false);
      
      const initData = await this.hashConnect.init(
        this.appMetadata,
        'testnet',
        false
      );

      this.pairingTopic = initData.topic;
      this.isInitialized = true;

      console.log('✅ HashConnect initialized successfully');
      this.setupEventListeners();
      
      return true;
    } catch (error) {
      console.error('❌ HashConnect initialization failed:', error);
      return false;
    }
  }

  private setupEventListeners(): void {
    if (!this.hashConnect) return;

    // Handle pairing events
    this.hashConnect.pairingEvent.on('pairing', (pairingData: MessageTypes.ApprovePairing) => {
      console.log('🔗 Wallet paired:', pairingData);
      
      if (pairingData.accountIds && pairingData.accountIds.length > 0) {
        this.connectionData = {
          accountId: pairingData.accountIds[0],
          network: pairingData.network || 'testnet',
          isConnected: true
        };

        // Store connection
        this.saveConnection(this.connectionData);

        // Notify UI
        window.dispatchEvent(new CustomEvent('wallet-connected', {
          detail: this.connectionData
        }));

        console.log('✅ HashPack connected:', this.connectionData.accountId);
      }
    });

    // Handle connection status changes
    this.hashConnect.connectionStatusChangeEvent.on('connectionStatusChange', (status: any) => {
      console.log('🔗 Connection status:', status);
    });
  }

  async connectWallet(): Promise<WalletConnection> {
    if (!this.isInitialized) {
      const initialized = await this.initialize();
      if (!initialized) {
        throw new Error('Failed to initialize HashConnect');
      }
    }

    // Check existing connection first
    const stored = this.getStoredConnection();
    if (stored) {
      console.log('✅ Using stored connection:', stored.accountId);
      this.connectionData = stored;
      return stored;
    }

    console.log('🔗 Connecting to HashPack...');

    try {
      // Method 1: Try direct window.hashpack if available
      if ((window as any).hashpack) {
        console.log('🔗 Using direct HashPack API...');
        const hashpack = (window as any).hashpack;
        
        if (hashpack.requestAccountInfo) {
          const accountInfo = await hashpack.requestAccountInfo();
          if (accountInfo?.accountId) {
            const connection: WalletConnection = {
              accountId: accountInfo.accountId,
              network: 'testnet',
              isConnected: true
            };
            
            this.connectionData = connection;
            this.saveConnection(connection);
            return connection;
          }
        }
      }

      // Method 2: Use HashConnect local wallet connection
      if (this.hashConnect) {
        console.log('🔗 Using HashConnect local wallet...');
        
        await this.hashConnect.connectToLocalWallet();
        
        // Wait for pairing event
        return new Promise<WalletConnection>((resolve, reject) => {
          const timeout = setTimeout(() => {
            reject(new Error('Connection timeout - ensure HashPack is installed and unlocked'));
          }, 15000);

          const handleConnection = (event: CustomEvent) => {
            clearTimeout(timeout);
            window.removeEventListener('wallet-connected', handleConnection as EventListener);
            resolve(event.detail);
          };

          window.addEventListener('wallet-connected', handleConnection as EventListener);
        });
      }

      throw new Error('HashConnect not available');

    } catch (error) {
      console.error('❌ HashPack connection failed:', error);
      throw error;
    }
  }

  async disconnectWallet(): Promise<void> {
    if (this.hashConnect && this.pairingTopic) {
      try {
        await this.hashConnect.disconnect(this.pairingTopic);
      } catch (error) {
        console.log('⚠️ Disconnect error:', error);
      }
    }

    this.connectionData = null;
    this.clearStoredConnection();
    
    window.dispatchEvent(new CustomEvent('wallet-disconnected'));
    console.log('✅ HashPack disconnected');
  }

  getConnection(): WalletConnection | null {
    return this.connectionData || this.getStoredConnection();
  }

  private saveConnection(connection: WalletConnection): void {
    try {
      localStorage.setItem('hashpack_connection', JSON.stringify(connection));
    } catch (error) {
      console.log('⚠️ Failed to save connection:', error);
    }
  }

  private getStoredConnection(): WalletConnection | null {
    try {
      const stored = localStorage.getItem('hashpack_connection');
      return stored ? JSON.parse(stored) : null;
    } catch (error) {
      return null;
    }
  }

  private clearStoredConnection(): void {
    try {
      localStorage.removeItem('hashpack_connection');
    } catch (error) {
      console.log('⚠️ Failed to clear connection:', error);
    }
  }

  // Static method to check if HashPack is available
  static async isAvailable(): Promise<boolean> {
    // Check for direct window object
    if ((window as any).hashpack) {
      return true;
    }

    // Check via HashConnect
    try {
      const hashConnect = new HashConnect(false);
      await hashConnect.init(
        {
          name: 'Detection',
          description: 'HashPack detection',
          url: window.location.origin,
          icon: `${window.location.origin}/favicon.ico`
        },
        'testnet',
        false
      );

      return new Promise((resolve) => {
        let found = false;
        const timeout = setTimeout(() => {
          if (!found) resolve(false);
        }, 2000);

        if (hashConnect.foundExtensionEvent) {
          hashConnect.foundExtensionEvent.on('foundExtension', (metadata: any) => {
            if (metadata.name.toLowerCase().includes('hashpack')) {
              found = true;
              clearTimeout(timeout);
              resolve(true);
            }
          });
        }
      });
    } catch (error) {
      return false;
    }
  }
}

// Export singleton instance
export const workingHashPackConnector = new WorkingHashPackConnector();