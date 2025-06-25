// Simplified HashPack connector that bypasses encryption issues
export class HashPackConnector {
  private state: 'disconnected' | 'connecting' | 'connected' = 'disconnected';
  
  constructor() {
    // No complex initialization needed
  }

  async connect(): Promise<string> {
    if (this.state === 'connecting') {
      throw new Error('Connection already in progress');
    }

    this.state = 'connecting';
    console.log('🔄 Starting HashPack connection...');

    try {
      // Method 1: Try HashPack extension direct communication
      const result = await this.tryExtensionMethod();
      if (result) return result;

      // Method 2: Try postMessage communication
      const result2 = await this.tryPostMessageMethod();
      if (result2) return result2;

      // Method 3: Try delayed injection detection
      const result3 = await this.tryDelayedDetection();
      if (result3) return result3;

      throw new Error('HashPack not accessible via any method');

    } catch (error) {
      this.state = 'disconnected';
      throw error;
    }
  }

  private async tryExtensionMethod(): Promise<string | null> {
    console.log('🔍 Method 1: Trying extension detection...');
    
    const possibleNames = [
      'hashpack', 'HashPack', 'hashConnect', 'HashConnect', 
      'hedera', 'Hedera', 'hederaWallet', 'HederaWallet'
    ];
    
    for (const name of possibleNames) {
      const obj = (window as any)[name];
      if (obj && typeof obj === 'object') {
        console.log(`🔍 Found ${name}:`, obj);
        console.log(`${name} properties:`, Object.keys(obj));
        
        // Check if wallet is already connected
        if (obj.isConnected && obj.isConnected()) {
          console.log(`${name} is already connected, getting account info...`);
          try {
            const account = obj.getAccountId ? obj.getAccountId() : obj.accountId;
            if (account) {
              console.log(`✅ Already connected to ${name}:`, account);
              this.state = 'connected';
              return account;
            }
          } catch (error) {
            console.log(`Failed to get account from connected ${name}:`, error.message);
          }
        }
        
        // Try to request connection
        if (obj.requestAccountInfo) {
          try {
            console.log(`🔄 Calling ${name}.requestAccountInfo()...`);
            const result = await obj.requestAccountInfo();
            if (result?.accountId) {
              console.log(`✅ Connected via ${name}:`, result.accountId);
              this.state = 'connected';
              return result.accountId;
            }
          } catch (error) {
            console.log(`❌ ${name} requestAccountInfo failed:`, error.message);
          }
        }
        
        // Try alternative connection methods
        const connectionMethods = ['connect', 'connectWallet', 'enable', 'request'];
        for (const method of connectionMethods) {
          if (obj[method] && typeof obj[method] === 'function') {
            try {
              console.log(`🔄 Trying ${name}.${method}()...`);
              const result = await obj[method]();
              if (result?.accountId || result?.account || result?.[0]) {
                const accountId = result.accountId || result.account || result[0];
                console.log(`✅ Connected via ${name}.${method}:`, accountId);
                this.state = 'connected';
                return accountId;
              }
            } catch (error) {
              console.log(`❌ ${name}.${method} failed:`, error.message);
            }
          }
        }
      }
    }
    
    return null;
  }

  private async tryPostMessageMethod(): Promise<string | null> {
    console.log('🔍 Method 2: Trying postMessage communication...');
    
    return new Promise((resolve) => {
      const timeout = setTimeout(() => resolve(null), 3000);
      
      const messageHandler = (event: MessageEvent) => {
        if (event.data?.type === 'hashpack-response' && event.data?.accountId) {
          clearTimeout(timeout);
          window.removeEventListener('message', messageHandler);
          console.log('✅ Connected via postMessage:', event.data.accountId);
          this.state = 'connected';
          resolve(event.data.accountId);
        }
      };
      
      window.addEventListener('message', messageHandler);
      
      // Send message to HashPack
      window.postMessage({
        type: 'hashpack-request',
        method: 'requestAccountInfo'
      }, '*');
    });
  }

  private async tryDelayedDetection(): Promise<string | null> {
    console.log('🔍 Method 3: Trying delayed detection and forced refresh...');
    
    // Check if HashPack exists but needs refresh
    if ((window as any).hashpack) {
      console.log('HashPack object exists, checking connection state...');
      const hashpack = (window as any).hashpack;
      
      // Try to refresh the connection
      try {
        if (hashpack.refresh) {
          await hashpack.refresh();
          console.log('HashPack refreshed');
        }
        
        if (hashpack.requestAccountInfo) {
          const result = await hashpack.requestAccountInfo();
          if (result?.accountId) {
            console.log('✅ Connected after refresh:', result.accountId);
            this.state = 'connected';
            return result.accountId;
          }
        }
      } catch (error) {
        console.log('❌ Refresh failed:', error.message);
      }
    }
    
    // Wait for HashPack to inject if not found
    for (let i = 0; i < 10; i++) {
      await new Promise(resolve => setTimeout(resolve, 500));
      
      const hashpack = (window as any).hashpack;
      if (hashpack?.requestAccountInfo) {
        try {
          console.log(`🔄 HashPack found after ${(i + 1) * 500}ms, connecting...`);
          const result = await hashpack.requestAccountInfo();
          if (result?.accountId) {
            console.log('✅ Connected after delay:', result.accountId);
            this.state = 'connected';
            return result.accountId;
          }
        } catch (error) {
          console.log(`❌ Delayed connection attempt ${i + 1} failed:`, error.message);
        }
      }
    }
    
    return null;
  }

  disconnect() {
    this.state = 'disconnected';
    console.log('✅ HashPack disconnected');
  }

  getState() {
    return this.state;
  }
}