// Direct HashPack API without HashConnect encryption layer
export class HashPackConnector {
  private state: 'disconnected' | 'connecting' | 'connected' = 'disconnected';
  
  constructor() {
    // Direct HashPack API - no HashConnect initialization needed
  }

  async connect(): Promise<string> {
    if (this.state === 'connecting') {
      throw new Error('Connection already in progress');
    }

    this.state = 'connecting';
    console.log('🔄 Connecting directly to HashPack (no encryption)...');

    try {
      // Step 1: Ensure HashPack is available
      const hashpack = await this.waitForHashPack();
      if (!hashpack) {
        throw new Error('HashPack extension not found');
      }

      console.log('✅ HashPack detected, requesting account access...');

      // Step 2: Direct API call to HashPack
      const accountId = await this.requestAccountDirect(hashpack);
      
      this.state = 'connected';
      console.log('✅ Successfully connected to HashPack:', accountId);
      return accountId;

    } catch (error) {
      this.state = 'disconnected';
      console.error('❌ HashPack connection failed:', error);
      throw new Error(`HashPack connection failed: ${error.message}`);
    }
  }

  private async waitForHashPack(): Promise<any> {
    // Check if HashPack is already available
    if ((window as any).hashpack) {
      console.log('✅ HashPack already available');
      return (window as any).hashpack;
    }

    // Wait for HashPack to inject (up to 10 seconds)
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

  private async requestAccountDirect(hashpack: any): Promise<string> {
    console.log('🔄 Calling HashPack.requestAccountInfo() directly...');
    
    return new Promise((resolve, reject) => {
      const timeout = setTimeout(() => {
        reject(new Error('HashPack account request timeout'));
      }, 20000); // 20 second timeout for user interaction

      // Set up message listener for HashPack response
      const handleMessage = (event: MessageEvent) => {
        if (event.data && (event.data.accountId || event.data.account)) {
          clearTimeout(timeout);
          window.removeEventListener('message', handleMessage);
          const account = event.data.accountId || event.data.account;
          console.log('✅ Received account via message:', account);
          resolve(account);
        }
      };

      window.addEventListener('message', handleMessage);

      // Call HashPack API
      hashpack.requestAccountInfo()
        .then((result: any) => {
          clearTimeout(timeout);
          window.removeEventListener('message', handleMessage);
          
          if (result?.accountId) {
            console.log('✅ Direct response from HashPack:', result.accountId);
            resolve(result.accountId);
          } else if (result?.account) {
            console.log('✅ Direct response from HashPack:', result.account);
            resolve(result.account);
          } else {
            console.log('⚠️ No direct response, waiting for message...');
            // Re-add message listener and wait
            window.addEventListener('message', handleMessage);
            setTimeout(() => {
              clearTimeout(timeout);
              window.removeEventListener('message', handleMessage);
              reject(new Error('No account information received from HashPack'));
            }, 15000);
          }
        })
        .catch((error: any) => {
          console.log('⚠️ HashPack API call failed, waiting for message response:', error.message);
          // Keep message listener active for potential delayed response
        });
    });
  }







  disconnect() {
    this.state = 'disconnected';
    console.log('✅ HashPack disconnected');
  }

  getState() {
    return this.state;
  }
}