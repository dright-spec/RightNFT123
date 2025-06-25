// Direct HashPack API integration - bypasses HashConnect completely
export class DirectHashPackConnector {
  private state: 'disconnected' | 'connecting' | 'connected' = 'disconnected';
  
  constructor() {
    // No HashConnect initialization - pure HashPack API
  }

  async connect(): Promise<string> {
    if (this.state === 'connecting') {
      throw new Error('Connection already in progress');
    }

    this.state = 'connecting';
    console.log('🔄 Connecting directly to HashPack API...');

    try {
      // Wait for HashPack to be available
      const hashpack = await this.waitForHashPack();
      if (!hashpack) {
        throw new Error('HashPack extension not detected');
      }

      console.log('✅ HashPack extension found, requesting account...');
      
      // Direct API call - no encryption involved
      const result = await this.callHashPackAPI(hashpack);
      
      this.state = 'connected';
      console.log('✅ Successfully connected to HashPack:', result);
      return result;

    } catch (error) {
      this.state = 'disconnected';
      console.error('❌ Direct HashPack connection failed:', error);
      throw new Error(`HashPack connection failed: ${error.message}`);
    }
  }

  private async waitForHashPack(): Promise<any> {
    // Check if already available
    if ((window as any).hashpack) {
      console.log('✅ HashPack already available');
      return (window as any).hashpack;
    }

    // Wait for injection
    console.log('🔄 Waiting for HashPack injection...');
    return new Promise((resolve) => {
      let attempts = 0;
      const maxAttempts = 20;
      
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
          console.log('❌ HashPack not found after 10 seconds');
          resolve(null);
        }
      }, 500);
    });
  }

  private async callHashPackAPI(hashpack: any): Promise<string> {
    console.log('🔄 Calling HashPack requestAccountInfo directly...');
    
    return new Promise((resolve, reject) => {
      const timeout = setTimeout(() => {
        reject(new Error('HashPack API call timeout'));
      }, 30000);

      let responseReceived = false;

      // Set up event listener for HashPack responses
      const messageHandler = (event: MessageEvent) => {
        if (responseReceived) return;

        // Check for HashPack response patterns
        const data = event.data;
        if (data && typeof data === 'object') {
          // Look for account ID in various possible response formats
          const accountId = data.accountId || 
                           data.account || 
                           data.result?.accountId || 
                           data.result?.account ||
                           data.response?.accountId ||
                           data.response?.account;

          if (accountId && typeof accountId === 'string' && accountId.match(/^0\.0\.\d+$/)) {
            responseReceived = true;
            clearTimeout(timeout);
            window.removeEventListener('message', messageHandler);
            
            console.log('✅ HashPack response received:', accountId);
            resolve(accountId);
            return;
          }
        }
      };

      window.addEventListener('message', messageHandler);

      // Try different HashPack API call patterns
      try {
        console.log('🔄 Attempting HashPack API call...');
        
        // Method 1: Direct call
        if (typeof hashpack.requestAccountInfo === 'function') {
          const result = hashpack.requestAccountInfo();
          
          // Check if it returns a promise
          if (result && typeof result.then === 'function') {
            result
              .then((response: any) => {
                if (responseReceived) return;
                
                const accountId = response?.accountId || response?.account;
                if (accountId && typeof accountId === 'string' && accountId.match(/^0\.0\.\d+$/)) {
                  responseReceived = true;
                  clearTimeout(timeout);
                  window.removeEventListener('message', messageHandler);
                  console.log('✅ Direct promise response:', accountId);
                  resolve(accountId);
                }
              })
              .catch((error: any) => {
                console.log('⚠️ Direct promise failed, waiting for message response:', error.message);
              });
          }
          
          // Check if it returns data immediately
          if (result && typeof result === 'object') {
            const accountId = result.accountId || result.account;
            if (accountId && typeof accountId === 'string' && accountId.match(/^0\.0\.\d+$/)) {
              responseReceived = true;
              clearTimeout(timeout);
              window.removeEventListener('message', messageHandler);
              console.log('✅ Immediate response:', accountId);
              resolve(accountId);
              return;
            }
          }
        }

        // Method 2: Try legacy API patterns
        if (hashpack.getAccount && typeof hashpack.getAccount === 'function') {
          const account = hashpack.getAccount();
          if (account && typeof account === 'string' && account.match(/^0\.0\.\d+$/)) {
            responseReceived = true;
            clearTimeout(timeout);
            window.removeEventListener('message', messageHandler);
            console.log('✅ Legacy getAccount response:', account);
            resolve(account);
            return;
          }
        }

        // Method 3: Check for existing account in state
        if (hashpack.account && typeof hashpack.account === 'string' && hashpack.account.match(/^0\.0\.\d+$/)) {
          responseReceived = true;
          clearTimeout(timeout);
          window.removeEventListener('message', messageHandler);
          console.log('✅ Existing account found:', hashpack.account);
          resolve(hashpack.account);
          return;
        }

        console.log('⚠️ No immediate response, waiting for message events...');

      } catch (apiError) {
        console.log('⚠️ API call failed, waiting for message events:', apiError.message);
      }

      // Fallback timeout
      setTimeout(() => {
        if (!responseReceived) {
          responseReceived = true;
          clearTimeout(timeout);
          window.removeEventListener('message', messageHandler);
          reject(new Error('No response from HashPack wallet - please ensure it is unlocked and try again'));
        }
      }, 25000);
    });
  }

  disconnect() {
    this.state = 'disconnected';
    console.log('✅ Direct HashPack connection closed');
  }

  getState() {
    return this.state;
  }
}