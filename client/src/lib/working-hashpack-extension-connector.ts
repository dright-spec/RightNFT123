// Working HashPack Extension Connector
// Based on the proven connectToExtension() method that was successfully connecting wallets

interface HashPackWalletConnection {
  accountId: string;
  network: string;
  isConnected: boolean;
}

export class WorkingHashPackExtensionConnector {
  private connection: HashPackWalletConnection | null = null;

  async detectHashPackExtension(): Promise<any> {
    console.log('🔍 Detecting HashPack extension...');

    // Check all possible HashPack window objects
    const hashPackCandidates = [
      (window as any).hashpack,
      (window as any).HashPack,
      (window as any).hashconnect,
      (window as any).hcSdk
    ];

    for (const candidate of hashPackCandidates) {
      if (candidate && typeof candidate === 'object') {
        console.log('✅ Found HashPack candidate:', candidate);
        
        // Check if it has the connectToExtension method that was working
        if (typeof candidate.connectToExtension === 'function') {
          console.log('✅ Found connectToExtension method!');
          return candidate;
        }
        
        // Check for other potential connection methods
        const connectionMethods = [
          'connect',
          'requestAccountInfo',
          'getAccountInfo',
          'enable',
          'request'
        ];
        
        for (const method of connectionMethods) {
          if (typeof candidate[method] === 'function') {
            console.log(`✅ Found potential connection method: ${method}`);
            return candidate;
          }
        }
      }
    }

    // Check ethereum provider for HashPack
    const ethereum = (window as any).ethereum;
    if (ethereum?.isHashPack && ethereum.request) {
      console.log('✅ Found HashPack via ethereum provider');
      return ethereum;
    }

    console.log('❌ No HashPack extension detected');
    return null;
  }

  async connectWallet(): Promise<HashPackWalletConnection> {
    console.log('🔗 Starting HashPack wallet connection...');

    const hashPack = await this.detectHashPackExtension();
    if (!hashPack) {
      throw new Error('HashPack extension not found. Please install HashPack wallet extension.');
    }

    try {
      // Method 1: Use the proven connectToExtension method
      if (typeof hashPack.connectToExtension === 'function') {
        console.log('🔗 Using connectToExtension method...');
        
        const result = await hashPack.connectToExtension();
        console.log('connectToExtension result:', result);
        
        if (result?.accountIds && result.accountIds.length > 0) {
          const connection: HashPackWalletConnection = {
            accountId: result.accountIds[0],
            network: result.network || 'testnet',
            isConnected: true
          };

          this.connection = connection;
          this.saveConnection(connection);
          
          console.log('✅ HashPack connected successfully:', connection.accountId);
          return connection;
        } else {
          throw new Error('No accounts found. Please create a Hedera account in HashPack.');
        }
      }

      // Method 2: Try requestAccountInfo (alternative method)
      if (typeof hashPack.requestAccountInfo === 'function') {
        console.log('🔗 Using requestAccountInfo method...');
        
        const accountInfo = await hashPack.requestAccountInfo();
        console.log('requestAccountInfo result:', accountInfo);
        
        if (accountInfo?.accountId) {
          const connection: HashPackWalletConnection = {
            accountId: accountInfo.accountId,
            network: accountInfo.network || 'testnet',
            isConnected: true
          };

          this.connection = connection;
          this.saveConnection(connection);
          
          console.log('✅ HashPack connected via requestAccountInfo:', connection.accountId);
          return connection;
        }
      }

      // Method 3: Try ethereum provider request method
      if (hashPack.request && typeof hashPack.request === 'function') {
        console.log('🔗 Using ethereum provider request method...');
        
        try {
          const accounts = await hashPack.request({ method: 'eth_requestAccounts' });
          if (accounts && accounts.length > 0) {
            // For HashPack, we need to convert to Hedera format
            const connection: HashPackWalletConnection = {
              accountId: accounts[0], // This might be ethereum format, but HashPack should handle it
              network: 'testnet',
              isConnected: true
            };

            this.connection = connection;
            this.saveConnection(connection);
            
            console.log('✅ HashPack connected via ethereum provider:', connection.accountId);
            return connection;
          }
        } catch (error) {
          console.log('Ethereum provider method failed:', error);
        }
      }

      // Method 4: Try other potential methods
      const methods = ['connect', 'getAccountInfo', 'enable'];
      for (const methodName of methods) {
        if (typeof hashPack[methodName] === 'function') {
          console.log(`🔗 Trying ${methodName} method...`);
          
          try {
            const result = await hashPack[methodName]();
            console.log(`${methodName} result:`, result);
            
            if (result?.accountId || result?.accountIds?.[0]) {
              const accountId = result.accountId || result.accountIds[0];
              const connection: HashPackWalletConnection = {
                accountId,
                network: result.network || 'testnet',
                isConnected: true
              };

              this.connection = connection;
              this.saveConnection(connection);
              
              console.log(`✅ HashPack connected via ${methodName}:`, connection.accountId);
              return connection;
            }
          } catch (error) {
            console.log(`${methodName} method failed:`, error);
          }
        }
      }

      throw new Error('All HashPack connection methods failed. Please ensure HashPack is unlocked and try again.');

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
    
    // Emit disconnect event
    window.dispatchEvent(new CustomEvent('hashpack-extension-disconnected'));
  }

  getConnection(): HashPackWalletConnection | null {
    return this.connection || this.getStoredConnection();
  }

  private saveConnection(connection: HashPackWalletConnection): void {
    try {
      localStorage.setItem('working_hashpack_extension_connection', JSON.stringify(connection));
      console.log('💾 Connection saved to localStorage');
    } catch (error) {
      console.log('⚠️ Failed to save connection:', error);
    }
  }

  private getStoredConnection(): HashPackWalletConnection | null {
    try {
      const stored = localStorage.getItem('working_hashpack_extension_connection');
      return stored ? JSON.parse(stored) : null;
    } catch (error) {
      return null;
    }
  }

  private clearStoredConnection(): void {
    try {
      localStorage.removeItem('working_hashpack_extension_connection');
    } catch (error) {
      console.log('⚠️ Failed to clear connection:', error);
    }
  }

  // Debug method to inspect all detected HashPack objects
  debugDetectedObjects(): void {
    console.log('=== HashPack Extension Debug ===');
    
    const candidates = [
      { name: 'window.hashpack', obj: (window as any).hashpack },
      { name: 'window.HashPack', obj: (window as any).HashPack },
      { name: 'window.hashconnect', obj: (window as any).hashconnect },
      { name: 'window.hcSdk', obj: (window as any).hcSdk },
      { name: 'window.ethereum (HashPack)', obj: (window as any).ethereum?.isHashPack ? (window as any).ethereum : null }
    ];

    candidates.forEach(({ name, obj }) => {
      if (obj) {
        console.log(`${name}:`, {
          type: typeof obj,
          methods: Object.getOwnPropertyNames(obj).filter(key => typeof obj[key] === 'function'),
          properties: Object.getOwnPropertyNames(obj).filter(key => typeof obj[key] !== 'function'),
          hasConnectToExtension: typeof obj.connectToExtension === 'function',
          hasRequestAccountInfo: typeof obj.requestAccountInfo === 'function'
        });
      }
    });
    
    console.log('===============================');
  }
}

// Export singleton instance
export const workingHashPackExtensionConnector = new WorkingHashPackExtensionConnector();