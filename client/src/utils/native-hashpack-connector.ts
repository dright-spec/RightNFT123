// Native browser-only HashPack connector - zero HashConnect dependencies
export class NativeHashPackConnector {
  private state: 'disconnected' | 'connecting' | 'connected' = 'disconnected';
  private messageId: string;
  
  constructor() {
    this.messageId = `hashpack_${Date.now()}_${Math.random()}`;
  }

  async connect(): Promise<string> {
    if (this.state === 'connecting') {
      throw new Error('Connection already in progress');
    }

    this.state = 'connecting';
    console.log('🔄 Starting native HashPack connection...');

    try {
      // Direct browser extension communication only
      const accountId = await this.requestAccountViaBrowser();
      
      this.state = 'connected';
      console.log('✅ Native HashPack connection successful:', accountId);
      return accountId;

    } catch (error) {
      this.state = 'disconnected';
      console.error('❌ Native HashPack connection failed:', error);
      throw new Error(`HashPack connection failed: ${(error as Error).message}`);
    }
  }

  private async requestAccountViaBrowser(): Promise<string> {
    return new Promise((resolve, reject) => {
      const timeout = setTimeout(() => {
        reject(new Error('HashPack response timeout - please ensure wallet is unlocked'));
      }, 30000);

      let responseReceived = false;

      // Listen for direct browser extension responses
      const responseHandler = (event: MessageEvent) => {
        if (responseReceived) return;

        // Only process messages from HashPack extension
        if (event.origin !== window.location.origin && 
            !event.source && 
            event.data && 
            typeof event.data === 'object') {
          
          const data = event.data;
          
          // Look for HashPack account response
          if (data.type === 'hashpack-response' || 
              data.action === 'account-info' ||
              data.accountId ||
              (data.result && data.result.accountId)) {
            
            const accountId = data.accountId || 
                             data.result?.accountId || 
                             data.account ||
                             data.result?.account;

            if (accountId && typeof accountId === 'string' && accountId.match(/^0\.0\.\d+$/)) {
              responseReceived = true;
              clearTimeout(timeout);
              window.removeEventListener('message', responseHandler);
              console.log('✅ Native browser response:', accountId);
              resolve(accountId);
              return;
            }
          }
        }
      };

      window.addEventListener('message', responseHandler);

      // Direct extension API calls without any encryption
      this.callExtensionAPI()
        .then((accountId) => {
          if (responseReceived) return;
          
          if (accountId) {
            responseReceived = true;
            clearTimeout(timeout);
            window.removeEventListener('message', responseHandler);
            resolve(accountId);
          }
        })
        .catch((error) => {
          console.log('⚠️ Extension API failed, waiting for message response:', error.message);
        });
    });
  }

  private async callExtensionAPI(): Promise<string | null> {
    // Wait for extension to be available
    const extension = await this.waitForExtension();
    if (!extension) {
      throw new Error('HashPack extension not found');
    }

    // Try different direct API patterns
    const apiMethods = [
      // Standard method
      () => {
        console.log('🔄 Trying standard requestAccountInfo...');
        return extension.requestAccountInfo();
      },
      
      // Alternative methods
      () => {
        console.log('🔄 Trying getAccount...');
        return extension.getAccount();
      },
      
      () => {
        console.log('🔄 Trying connect...');
        return extension.connect();
      },

      // Direct property access
      () => {
        console.log('🔄 Checking account property...');
        return Promise.resolve(extension.account);
      },

      // Legacy patterns
      () => {
        console.log('🔄 Trying requestAccount...');
        return extension.requestAccount();
      }
    ];

    for (const method of apiMethods) {
      try {
        const result = await method();
        
        if (result) {
          // Extract account from various response formats
          const accountId = this.extractAccount(result);
          if (accountId) {
            console.log('✅ API method successful:', accountId);
            return accountId;
          }
        }
      } catch (error) {
        console.log('⚠️ API method failed:', (error as Error).message);
        continue;
      }
    }

    return null;
  }

  private async waitForExtension(): Promise<any> {
    // Check immediate availability
    if ((window as any).hashpack) {
      console.log('✅ HashPack extension immediately available');
      return (window as any).hashpack;
    }

    // Wait for injection
    return new Promise((resolve) => {
      let attempts = 0;
      const maxAttempts = 20;
      
      const checkInterval = setInterval(() => {
        attempts++;
        
        if ((window as any).hashpack) {
          clearInterval(checkInterval);
          console.log('✅ HashPack extension detected');
          resolve((window as any).hashpack);
          return;
        }
        
        if (attempts >= maxAttempts) {
          clearInterval(checkInterval);
          console.log('❌ HashPack extension not found');
          resolve(null);
        }
      }, 500);
    });
  }

  private extractAccount(data: any): string | null {
    if (!data) return null;

    // Handle string responses
    if (typeof data === 'string' && data.match(/^0\.0\.\d+$/)) {
      return data;
    }

    // Handle object responses
    if (typeof data === 'object') {
      const candidates = [
        data.accountId,
        data.account,
        data.result?.accountId,
        data.result?.account,
        data.response?.accountId,
        data.response?.account,
        data.data?.accountId,
        data.data?.account
      ];

      for (const candidate of candidates) {
        if (candidate && typeof candidate === 'string' && candidate.match(/^0\.0\.\d+$/)) {
          return candidate;
        }
      }
    }

    return null;
  }

  disconnect() {
    this.state = 'disconnected';
    console.log('✅ Native HashPack connection closed');
  }

  getState() {
    return this.state;
  }
}