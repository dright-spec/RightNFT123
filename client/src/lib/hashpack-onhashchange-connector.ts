// HashPack Connector using the onhashchange window property
// This uses the actual detected HashPack API from the window object

interface HashPackConnection {
  accountId: string;
  network: string;
  isConnected: boolean;
}

export class HashPackOnHashChangeConnector {
  private connection: HashPackConnection | null = null;

  async isHashPackAvailable(): Promise<boolean> {
    // Check for the onhashchange property that's being detected
    if (typeof (window as any).onhashchange !== 'undefined') {
      console.log('✅ HashPack detected via onhashchange property');
      return true;
    }

    // Also check for other HashPack-related objects
    const hashPackObjects = [
      'hashpack',
      'HashPack', 
      'hcSdk',
      'hashconnect'
    ];

    for (const obj of hashPackObjects) {
      if ((window as any)[obj]) {
        console.log(`✅ HashPack detected via window.${obj}`);
        return true;
      }
    }

    return false;
  }

  async connectWallet(): Promise<HashPackConnection> {
    console.log('🔗 Connecting to HashPack using detected window properties...');

    // Method 1: Try using the onhashchange property if it's a HashPack API
    if ((window as any).onhashchange && typeof (window as any).onhashchange === 'object') {
      console.log('🔗 Attempting connection via onhashchange object...');
      
      const hashChangeObj = (window as any).onhashchange;
      
      // Check if it has HashPack-like methods
      if (hashChangeObj.requestAccountInfo || hashChangeObj.getAccountInfo || hashChangeObj.connect) {
        try {
          let accountInfo;
          
          if (hashChangeObj.requestAccountInfo) {
            accountInfo = await hashChangeObj.requestAccountInfo();
          } else if (hashChangeObj.getAccountInfo) {
            accountInfo = await hashChangeObj.getAccountInfo();
          } else if (hashChangeObj.connect) {
            accountInfo = await hashChangeObj.connect();
          }

          if (accountInfo?.accountId) {
            const connection: HashPackConnection = {
              accountId: accountInfo.accountId,
              network: accountInfo.network || 'testnet',
              isConnected: true
            };

            this.connection = connection;
            this.saveConnection(connection);
            
            console.log('✅ Connected via onhashchange:', connection.accountId);
            return connection;
          }
        } catch (error) {
          console.log('⚠️ onhashchange connection failed:', error);
        }
      }
    }

    // Method 2: Try other detected HashPack objects
    const possibleApis = [
      (window as any).hashpack,
      (window as any).HashPack,
      (window as any).hcSdk,
      (window as any).hashconnect
    ];

    for (const api of possibleApis) {
      if (api && typeof api === 'object') {
        console.log('🔗 Attempting connection via detected API object...');
        
        try {
          let accountInfo;
          
          // Try different method names that HashPack might use
          const methods = [
            'requestAccountInfo',
            'getAccountInfo', 
            'connect',
            'getAccount',
            'requestAccount',
            'enable'
          ];

          for (const method of methods) {
            if (typeof api[method] === 'function') {
              console.log(`🔗 Trying method: ${method}`);
              accountInfo = await api[method]();
              if (accountInfo?.accountId) break;
            }
          }

          if (accountInfo?.accountId) {
            const connection: HashPackConnection = {
              accountId: accountInfo.accountId,
              network: accountInfo.network || 'testnet',
              isConnected: true
            };

            this.connection = connection;
            this.saveConnection(connection);
            
            console.log('✅ Connected via detected API:', connection.accountId);
            return connection;
          }
        } catch (error) {
          console.log('⚠️ API connection attempt failed:', error);
        }
      }
    }

    // Method 3: Manual account input as fallback
    console.log('🔗 No automatic connection available, requesting manual input...');
    
    const accountId = prompt(
      'HashPack auto-connection not available.\n\n' +
      'Please enter your Hedera Account ID manually:\n' +
      '(Format: 0.0.123456)'
    );

    if (accountId && /^0\.0\.\d+$/.test(accountId)) {
      const connection: HashPackConnection = {
        accountId,
        network: 'testnet',
        isConnected: true
      };

      this.connection = connection;
      this.saveConnection(connection);
      
      console.log('✅ Manual connection established:', accountId);
      return connection;
    } else if (accountId) {
      throw new Error('Invalid account ID format. Please use format: 0.0.123456');
    }

    throw new Error('HashPack connection cancelled or not available');
  }

  async disconnectWallet(): Promise<void> {
    this.connection = null;
    this.clearStoredConnection();
    
    console.log('✅ HashPack disconnected');
    
    // Emit disconnect event
    window.dispatchEvent(new CustomEvent('hashpack-disconnected'));
  }

  getConnection(): HashPackConnection | null {
    return this.connection || this.getStoredConnection();
  }

  private saveConnection(connection: HashPackConnection): void {
    try {
      localStorage.setItem('hashpack_onhashchange_connection', JSON.stringify(connection));
      console.log('💾 Connection saved');
    } catch (error) {
      console.log('⚠️ Failed to save connection:', error);
    }
  }

  private getStoredConnection(): HashPackConnection | null {
    try {
      const stored = localStorage.getItem('hashpack_onhashchange_connection');
      return stored ? JSON.parse(stored) : null;
    } catch (error) {
      return null;
    }
  }

  private clearStoredConnection(): void {
    try {
      localStorage.removeItem('hashpack_onhashchange_connection');
    } catch (error) {
      console.log('⚠️ Failed to clear connection:', error);
    }
  }

  // Debug method to inspect detected window properties
  debugWindowProperties(): void {
    console.log('=== HashPack Window Properties Debug ===');
    
    const properties = [
      'onhashchange',
      'hashpack', 
      'HashPack',
      'hcSdk',
      'hashconnect',
      'hedera',
      'myTonWallet',
      'mytonwallet'
    ];

    properties.forEach(prop => {
      const value = (window as any)[prop];
      if (value !== undefined) {
        console.log(`${prop}:`, {
          type: typeof value,
          isObject: typeof value === 'object' && value !== null,
          methods: typeof value === 'object' && value !== null ? 
            Object.getOwnPropertyNames(value).filter(key => typeof value[key] === 'function') : [],
          value: typeof value === 'function' ? '[Function]' : value
        });
      }
    });
    
    console.log('========================================');
  }
}

// Export singleton instance
export const hashPackOnHashChangeConnector = new HashPackOnHashChangeConnector();