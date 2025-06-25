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

      // Multiple response handling strategies
      let responseReceived = false;

      // Strategy 1: Direct promise response
      try {
        const directCall = hashpack.requestAccountInfo();
        
        if (directCall && typeof directCall.then === 'function') {
          directCall
            .then((response: any) => {
              if (responseReceived) return;
              responseReceived = true;
              clearTimeout(timeout);
              
              const accountId = response?.accountId || response?.account;
              if (accountId) {
                console.log('✅ Direct promise response:', accountId);
                resolve(accountId);
              } else {
                console.log('⚠️ Direct response but no account:', response);
                // Don't reject yet, wait for other strategies
              }
            })
            .catch((error: any) => {
              console.log('⚠️ Direct promise failed:', error.message);
              // Don't reject yet, wait for other strategies
            });
        }
      } catch (directError) {
        console.log('⚠️ Direct call failed:', directError.message);
      }

      // Strategy 2: Event listener for responses
      const messageHandler = (event: MessageEvent) => {
        if (responseReceived) return;

        const data = event.data;
        if (data && (data.accountId || data.account)) {
          responseReceived = true;
          clearTimeout(timeout);
          window.removeEventListener('message', messageHandler);
          
          const accountId = data.accountId || data.account;
          console.log('✅ Event response:', accountId);
          resolve(accountId);
        }
      };

      window.addEventListener('message', messageHandler);

      // Strategy 3: Polling for hashpack state changes
      let pollAttempts = 0;
      const maxPollAttempts = 60; // 30 seconds
      
      const pollInterval = setInterval(() => {
        pollAttempts++;
        
        if (responseReceived) {
          clearInterval(pollInterval);
          return;
        }

        // Check if HashPack has account info available
        try {
          if (hashpack.state && hashpack.state.accountId) {
            responseReceived = true;
            clearTimeout(timeout);
            clearInterval(pollInterval);
            window.removeEventListener('message', messageHandler);
            
            console.log('✅ Polling response:', hashpack.state.accountId);
            resolve(hashpack.state.accountId);
            return;
          }
        } catch (pollError) {
          // Ignore polling errors
        }

        if (pollAttempts >= maxPollAttempts) {
          clearInterval(pollInterval);
          
          if (!responseReceived) {
            responseReceived = true;
            clearTimeout(timeout);
            window.removeEventListener('message', messageHandler);
            reject(new Error('No response from HashPack after 30 seconds'));
          }
        }
      }, 500);

      // Trigger the actual API call
      try {
        hashpack.requestAccountInfo();
      } catch (apiError) {
        console.log('⚠️ API call trigger failed:', apiError.message);
      }
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