// Direct HashPack API integration bypassing encrypted HashConnect
export class HashPackConnector {
  private state: 'disconnected' | 'connecting' | 'connected' = 'disconnected';
  private retryCount = 0;
  private maxRetries = 3;
  
  constructor() {
    // No complex initialization - use direct HashPack API
  }

  async connect(): Promise<string> {
    if (this.state === 'connecting') {
      throw new Error('Connection already in progress');
    }

    this.state = 'connecting';
    console.log('🔄 Starting direct HashPack connection (bypassing encryption)...');

    try {
      // Wait for HashPack to be available
      const hashpack = await this.waitForHashPack();
      
      if (!hashpack) {
        throw new Error('HashPack extension not found or not accessible');
      }

      console.log('✅ HashPack found, attempting direct connection...');
      
      // Use direct API call without encrypted communication
      const accountId = await this.connectDirectly(hashpack);
      
      this.state = 'connected';
      console.log('✅ Direct connection successful:', accountId);
      return accountId;

    } catch (error) {
      this.state = 'disconnected';
      this.retryCount++;
      
      if (this.retryCount < this.maxRetries) {
        console.log(`⚠️ Connection attempt ${this.retryCount} failed, retrying...`);
        await new Promise(resolve => setTimeout(resolve, 1000));
        return this.connect();
      }
      
      throw new Error(`HashPack connection failed after ${this.maxRetries} attempts: ${error.message}`);
    }
  }

  private async waitForHashPack(): Promise<any> {
    console.log('🔍 Waiting for HashPack extension...');
    
    // Check if already available
    if ((window as any).hashpack) {
      return (window as any).hashpack;
    }

    // Wait up to 10 seconds for HashPack to inject
    return new Promise((resolve) => {
      let attempts = 0;
      const maxAttempts = 20; // 10 seconds with 500ms intervals
      
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
          console.log('❌ HashPack not found after waiting');
          resolve(null);
        }
      }, 500);
    });
  }

  private async connectDirectly(hashpack: any): Promise<string> {
    console.log('🔄 Calling HashPack API directly...');
    
    try {
      // Call requestAccountInfo directly without going through encrypted channels
      const response = await hashpack.requestAccountInfo();
      
      if (response && response.accountId) {
        console.log('✅ Direct API response received:', response.accountId);
        return response.accountId;
      } else if (response && response.account) {
        console.log('✅ Direct API response received:', response.account);
        return response.account;
      } else {
        throw new Error('No account information in HashPack response');
      }
      
    } catch (directError) {
      console.log('⚠️ Direct API call failed, trying alternative approach...');
      
      // Try alternative approach with explicit promise handling
      return new Promise((resolve, reject) => {
        const timeout = setTimeout(() => {
          reject(new Error('HashPack connection timeout'));
        }, 15000);

        // Listen for HashPack messages
        const messageHandler = (event: MessageEvent) => {
          if (event.data && event.data.accountId) {
            clearTimeout(timeout);
            window.removeEventListener('message', messageHandler);
            console.log('✅ Account received via message:', event.data.accountId);
            resolve(event.data.accountId);
          }
        };

        window.addEventListener('message', messageHandler);

        // Trigger connection
        try {
          hashpack.requestAccountInfo()
            .then((result: any) => {
              clearTimeout(timeout);
              window.removeEventListener('message', messageHandler);
              
              if (result?.accountId) {
                resolve(result.accountId);
              } else {
                // Wait for message
                console.log('🔄 Waiting for HashPack message response...');
              }
            })
            .catch((error: any) => {
              console.log('⚠️ Promise rejected, waiting for message response...');
            });
        } catch (error) {
          console.log('⚠️ Call failed, waiting for message response...');
        }
      });
    }
  }





  disconnect() {
    this.state = 'disconnected';
    this.retryCount = 0;
    console.log('✅ HashPack disconnected');
  }

  getState() {
    return this.state;
  }
}