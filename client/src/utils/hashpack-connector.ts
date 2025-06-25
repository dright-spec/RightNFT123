// Direct HashPack connector that handles post-confirmation communication properly
export class HashPackConnector {
  private state: 'disconnected' | 'connecting' | 'connected' = 'disconnected';
  private connectionPromise: Promise<string> | null = null;
  
  constructor() {
    // Set up message listeners for HashPack responses
    this.setupMessageListeners();
  }

  private setupMessageListeners() {
    // Listen for HashPack messages that might come after user confirmation
    window.addEventListener('message', (event) => {
      if (event.data && typeof event.data === 'object') {
        const data = event.data;
        
        // Handle HashPack connection success
        if (data.type === 'hashpack' && data.action === 'connect' && data.accountId) {
          console.log('✅ HashPack connected via message:', data.accountId);
          this.state = 'connected';
          return;
        }
        
        // Handle other HashPack events
        if (data.origin === 'hashpack' || data.source === 'hashpack') {
          console.log('📨 HashPack message received:', data);
        }
      }
    });
  }

  async connect(): Promise<string> {
    if (this.connectionPromise) {
      console.log('🔄 Using existing connection promise...');
      return this.connectionPromise;
    }

    this.connectionPromise = this.performConnection();
    return this.connectionPromise;
  }

  private async performConnection(): Promise<string> {
    this.state = 'connecting';
    console.log('🔄 Starting HashPack connection...');

    try {
      // Method 1: Direct extension method with proper error handling
      const result = await this.tryDirectConnection();
      if (result) {
        this.connectionPromise = null;
        return result;
      }

      // Method 2: Try event-based connection
      const result2 = await this.tryEventBasedConnection();
      if (result2) {
        this.connectionPromise = null;
        return result2;
      }

      throw new Error('HashPack connection failed - wallet may need to be unlocked or refreshed');

    } catch (error) {
      this.state = 'disconnected';
      this.connectionPromise = null;
      throw error;
    }
  }

  private async tryDirectConnection(): Promise<string | null> {
    console.log('🔍 Method 1: Trying direct HashPack connection...');
    
    // Check for HashPack object
    const hashpack = (window as any).hashpack;
    if (!hashpack) {
      console.log('❌ HashPack object not found');
      return null;
    }

    console.log('✅ HashPack object found:', Object.keys(hashpack));

    try {
      // Use a promise wrapper to handle the async response properly
      const accountId = await new Promise<string>((resolve, reject) => {
        const timeout = setTimeout(() => {
          reject(new Error('HashPack connection timeout'));
        }, 30000); // 30 second timeout

        // Set up one-time listener for HashPack response
        const messageHandler = (event: MessageEvent) => {
          if (event.data?.accountId || (event.data?.type === 'hashpack' && event.data?.account)) {
            clearTimeout(timeout);
            window.removeEventListener('message', messageHandler);
            const account = event.data.accountId || event.data.account;
            console.log('✅ Received account from HashPack:', account);
            resolve(account);
          }
        };

        window.addEventListener('message', messageHandler);

        // Call HashPack requestAccountInfo
        hashpack.requestAccountInfo()
          .then((result: any) => {
            clearTimeout(timeout);
            window.removeEventListener('message', messageHandler);
            
            if (result?.accountId) {
              console.log('✅ Direct response from HashPack:', result.accountId);
              resolve(result.accountId);
            } else {
              // Wait for message response
              console.log('🔄 Waiting for HashPack message response...');
            }
          })
          .catch((error: any) => {
            // Don't reject immediately, wait for message response
            console.log('⚠️ Direct call failed, waiting for message response:', error.message);
          });
      });

      this.state = 'connected';
      return accountId;

    } catch (error) {
      console.log('❌ Direct connection failed:', error.message);
      return null;
    }
  }

  private async tryEventBasedConnection(): Promise<string | null> {
    console.log('🔍 Method 2: Trying event-based connection...');
    
    return new Promise((resolve) => {
      const timeout = setTimeout(() => resolve(null), 10000);
      
      const messageHandler = (event: MessageEvent) => {
        if (event.data && typeof event.data === 'object') {
          const data = event.data;
          
          // Check for various HashPack response formats
          if (data.accountId || (data.type === 'hashpack' && data.account)) {
            clearTimeout(timeout);
            window.removeEventListener('message', messageHandler);
            const accountId = data.accountId || data.account;
            console.log('✅ Connected via event:', accountId);
            this.state = 'connected';
            resolve(accountId);
          }
        }
      };
      
      window.addEventListener('message', messageHandler);
      
      // Try to trigger HashPack if it exists
      const hashpack = (window as any).hashpack;
      if (hashpack) {
        // Send a custom event to trigger HashPack
        window.dispatchEvent(new CustomEvent('hashpack-connect-request'));
        
        // Also try postMessage
        window.postMessage({
          type: 'hashpack-request',
          method: 'connect'
        }, '*');
      }
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