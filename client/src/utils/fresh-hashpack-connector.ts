// Fresh HashPack connector with clean state management
export class FreshHashPackConnector {
  private state: 'disconnected' | 'connecting' | 'connected' = 'disconnected';
  
  constructor() {
    // Always start with completely clean state
    this.clearAllConnectionData();
  }

  private clearAllConnectionData() {
    try {
      // Clear all HashConnect/HashPack related localStorage
      Object.keys(localStorage).forEach(key => {
        if (key.includes('hashconnect') || 
            key.includes('hashpack') || 
            key.includes('pairing') ||
            key.includes('encryption') ||
            key.includes('wallet')) {
          localStorage.removeItem(key);
        }
      });
      console.log('🧹 Cleared all connection data');
    } catch (error) {
      console.log('⚠️ Could not clear localStorage:', error);
    }
  }

  async connect(): Promise<string> {
    if (this.state === 'connecting') {
      throw new Error('Connection already in progress');
    }

    this.state = 'connecting';
    console.log('🔄 Starting fresh HashPack connection...');

    try {
      // Wait for HashPack extension
      const hashpack = await this.waitForHashPack();
      if (!hashpack) {
        throw new Error('HashPack extension not found. Please install HashPack wallet.');
      }

      console.log('✅ HashPack extension detected, requesting account access...');
      
      // Request account with fresh state
      const result = await this.requestAccountAccess(hashpack);
      
      this.state = 'connected';
      console.log('✅ Fresh HashPack connection successful:', result);
      return result;

    } catch (error) {
      this.state = 'disconnected';
      console.error('❌ Fresh HashPack connection failed:', error);
      throw new Error(`HashPack connection failed: ${error.message}`);
    }
  }

  private async waitForHashPack(): Promise<any> {
    console.log('🔍 Detecting HashPack extension...');
    
    // Check immediate availability
    if ((window as any).hashpack) {
      console.log('✅ HashPack immediately available');
      return (window as any).hashpack;
    }

    // Wait for extension injection with timeout
    return new Promise((resolve) => {
      let attempts = 0;
      const maxAttempts = 30; // 15 seconds
      
      const checkInterval = setInterval(() => {
        attempts++;
        
        if ((window as any).hashpack) {
          clearInterval(checkInterval);
          console.log('✅ HashPack detected after waiting');
          resolve((window as any).hashpack);
          return;
        }
        
        if (attempts >= maxAttempts) {
          clearInterval(checkInterval);
          console.log('❌ HashPack not found after 15 seconds');
          resolve(null);
        }
      }, 500);
    });
  }

  private async requestAccountAccess(hashpack: any): Promise<string> {
    console.log('🔑 Requesting account access from HashPack...');
    
    return new Promise((resolve, reject) => {
      const timeout = setTimeout(() => {
        reject(new Error('HashPack account request timeout after 30 seconds'));
      }, 30000);

      let responseReceived = false;

      // Listen for HashPack responses
      const messageHandler = (event: MessageEvent) => {
        if (responseReceived) return;

        const data = event.data;
        if (data && typeof data === 'object') {
          // Look for account response in various formats
          const accountId = this.extractAccountId(data);
          
          if (accountId) {
            responseReceived = true;
            clearTimeout(timeout);
            window.removeEventListener('message', messageHandler);
            
            console.log('✅ Account received via message:', accountId);
            resolve(accountId);
            return;
          }
        }
      };

      window.addEventListener('message', messageHandler);

      // Try multiple request methods
      this.tryAccountRequest(hashpack)
        .then((accountId) => {
          if (responseReceived) return;
          
          if (accountId) {
            responseReceived = true;
            clearTimeout(timeout);
            window.removeEventListener('message', messageHandler);
            console.log('✅ Account received directly:', accountId);
            resolve(accountId);
          }
        })
        .catch((error) => {
          console.log('⚠️ Direct request failed, waiting for message response:', error.message);
        });

      // Fallback timeout
      setTimeout(() => {
        if (!responseReceived) {
          responseReceived = true;
          clearTimeout(timeout);
          window.removeEventListener('message', messageHandler);
          reject(new Error('No response from HashPack. Please ensure wallet is unlocked and try again.'));
        }
      }, 25000);
    });
  }

  private async tryAccountRequest(hashpack: any): Promise<string | null> {
    const methods = [
      () => hashpack.requestAccountInfo(),
      () => hashpack.getAccount(),
      () => hashpack.connect(),
      () => hashpack.requestAccount()
    ];

    for (const method of methods) {
      try {
        const result = await method();
        const accountId = this.extractAccountId(result);
        if (accountId) {
          return accountId;
        }
      } catch (error) {
        // Continue to next method
      }
    }

    return null;
  }

  private extractAccountId(data: any): string | null {
    if (!data) return null;

    // Try various response formats
    const possibleIds = [
      data.accountId,
      data.account,
      data.result?.accountId,
      data.result?.account,
      data.response?.accountId,
      data.response?.account,
      data.data?.accountId,
      data.data?.account
    ];

    for (const id of possibleIds) {
      if (id && typeof id === 'string' && id.match(/^0\.0\.\d+$/)) {
        return id;
      }
    }

    return null;
  }

  disconnect() {
    this.state = 'disconnected';
    this.clearAllConnectionData();
    console.log('✅ Fresh HashPack connection cleaned');
  }

  getState() {
    return this.state;
  }
}