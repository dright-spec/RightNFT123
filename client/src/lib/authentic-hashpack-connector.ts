// Authentic HashPack Connector - Based on proven working connection code
// This uses the exact same method that was successfully connecting wallets

interface HashPackConnection {
  accountId: string;
  network: string;
  isConnected: boolean;
}

export class AuthenticHashPackConnector {
  private connection: HashPackConnection | null = null;

  async connectWallet(): Promise<HashPackConnection> {
    console.log('🔗 Starting authentic HashPack connection...');

    try {
      // Method 1: Use the proven HashConnect approach (this was working)
      if ((window as any).hashconnect) {
        console.log('✅ Found window.hashconnect - using proven method');
        
        const hashconnect = (window as any).hashconnect;
        const appMetadata = {
          name: "Dright",
          description: "Hedera NFT Rights Marketplace",
          icon: window.location.origin + "/favicon.ico"
        };

        console.log('🔗 Initializing HashConnect...');
        await hashconnect.init(appMetadata, "testnet", true);
        
        console.log('🔗 Connecting to local wallet...');
        const result = await hashconnect.connectToLocalWallet();
        
        console.log('HashConnect result:', result);
        
        if (result?.accountIds?.[0]) {
          const connection: HashPackConnection = {
            accountId: result.accountIds[0],
            network: "testnet",
            isConnected: true
          };
          
          this.connection = connection;
          this.saveConnection(connection);
          
          console.log('✅ HashPack connected successfully via HashConnect:', connection.accountId);
          return connection;
        } else {
          throw new Error('No accounts found in HashConnect result');
        }
      }

      // Method 2: Try direct HashPack extension detection
      const hashPack = (window as any).hashpack || (window as any).HashPack;
      if (hashPack && typeof hashPack.requestAccountInfo === 'function') {
        console.log('✅ Found direct HashPack extension');
        
        const accountInfo = await hashPack.requestAccountInfo();
        console.log('HashPack requestAccountInfo result:', accountInfo);
        
        if (accountInfo?.accountId) {
          const connection: HashPackConnection = {
            accountId: accountInfo.accountId,
            network: accountInfo.network || 'testnet',
            isConnected: true
          };
          
          this.connection = connection;
          this.saveConnection(connection);
          
          console.log('✅ HashPack connected via direct extension:', connection.accountId);
          return connection;
        }
      }

      // Method 3: Check if we're missing HashConnect library
      if (!(window as any).hashconnect) {
        console.log('❌ window.hashconnect not found - HashConnect library may not be loaded');
        
        // Try to dynamically load HashConnect
        try {
          console.log('🔄 Attempting to load HashConnect library...');
          
          // Check if we can access it via other means
          const script = document.createElement('script');
          script.src = 'https://unpkg.com/@hashgraph/hashconnect/dist/browser/hashconnect.js';
          script.onload = () => {
            console.log('✅ HashConnect library loaded');
          };
          document.head.appendChild(script);
          
          // Wait a moment for loading
          await new Promise(resolve => setTimeout(resolve, 2000));
          
          // Try again after loading
          if ((window as any).hashconnect || (window as any).HashConnect) {
            console.log('🔄 Retrying connection after library load...');
            return this.connectWallet(); // Recursive call
          }
        } catch (error) {
          console.log('Failed to load HashConnect library:', error);
        }
      }

      throw new Error('HashPack extension not detected. Please install HashPack wallet extension and ensure it is unlocked.');

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
      
      throw error;
    }
  }

  async disconnectWallet(): Promise<void> {
    this.connection = null;
    this.clearStoredConnection();
    
    console.log('✅ HashPack disconnected');
  }

  getConnection(): HashPackConnection | null {
    return this.connection || this.getStoredConnection();
  }

  private saveConnection(connection: HashPackConnection): void {
    try {
      localStorage.setItem('authentic_hashpack_connection', JSON.stringify(connection));
      console.log('💾 Connection saved to localStorage');
    } catch (error) {
      console.log('⚠️ Failed to save connection:', error);
    }
  }

  private getStoredConnection(): HashPackConnection | null {
    try {
      const stored = localStorage.getItem('authentic_hashpack_connection');
      return stored ? JSON.parse(stored) : null;
    } catch (error) {
      return null;
    }
  }

  private clearStoredConnection(): void {
    try {
      localStorage.removeItem('authentic_hashpack_connection');
    } catch (error) {
      console.log('⚠️ Failed to clear connection:', error);
    }
  }

  // Debug method to check HashConnect availability
  debugHashConnectAvailability(): void {
    console.log('=== HashConnect Debug ===');
    console.log('window.hashconnect:', (window as any).hashconnect);
    console.log('window.HashConnect:', (window as any).HashConnect);
    console.log('window.hashpack:', (window as any).hashpack);
    console.log('window.HashPack:', (window as any).HashPack);
    
    if ((window as any).hashconnect) {
      const hc = (window as any).hashconnect;
      console.log('HashConnect methods:', Object.getOwnPropertyNames(hc).filter(key => typeof hc[key] === 'function'));
    }
    
    console.log('=========================');
  }
}

// Export singleton instance
export const authenticHashPackConnector = new AuthenticHashPackConnector();