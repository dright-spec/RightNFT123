// HashPack Reality Check - handles actual extension presence
export class HashPackRealityCheck {
  
  static async isHashPackActuallyInstalled(): Promise<boolean> {
    // Check 1: Direct window object
    if ((window as any).hashpack) {
      console.log('✅ HashPack found via window.hashpack');
      return true;
    }

    // Check 2: Chrome extension APIs
    if (typeof chrome !== 'undefined' && chrome.runtime) {
      try {
        // HashPack extension ID (if known)
        const hashpackExtensionId = 'nkbihfbeogaeaoehlefnkodbefgpgknn';
        await new Promise((resolve, reject) => {
          chrome.runtime.sendMessage(hashpackExtensionId, { method: 'ping' }, (response) => {
            if (chrome.runtime.lastError) {
              reject(chrome.runtime.lastError);
            } else {
              resolve(response);
            }
          });
        });
        console.log('✅ HashPack found via Chrome extension API');
        return true;
      } catch (error) {
        console.log('⚠️ HashPack not found via Chrome extension API');
      }
    }

    // Check 3: Wait for injection (HashPack loads after page)
    return new Promise((resolve) => {
      let attempts = 0;
      const maxAttempts = 10;
      
      const checkInterval = setInterval(() => {
        attempts++;
        
        if ((window as any).hashpack) {
          clearInterval(checkInterval);
          console.log('✅ HashPack found after waiting');
          resolve(true);
          return;
        }
        
        if (attempts >= maxAttempts) {
          clearInterval(checkInterval);
          console.log('❌ HashPack not found after waiting');
          resolve(false);
        }
      }, 500);
    });
  }

  static async connectToHashPack(): Promise<string> {
    console.log('🔄 Starting HashPack reality check...');
    
    // First, verify HashPack is actually installed
    const isInstalled = await this.isHashPackActuallyInstalled();
    
    if (!isInstalled) {
      const installUrl = 'https://chrome.google.com/webstore/detail/hashpack/nkbihfbeogaeaoehlefnkodbefgpgknn';
      throw new Error(`HashPack wallet is not installed.\n\nPlease install HashPack from:\n${installUrl}\n\nThen refresh this page and try again.`);
    }

    // If installed, try connection methods
    return this.attemptConnection();
  }

  private static async attemptConnection(): Promise<string> {
    const hashpack = (window as any).hashpack;
    
    if (!hashpack) {
      throw new Error('HashPack extension found but API not available');
    }

    console.log('🔄 Attempting HashPack connection...');

    // Method 1: Direct API call
    try {
      if (hashpack.requestAccountInfo) {
        console.log('🔄 Trying requestAccountInfo...');
        const result = await hashpack.requestAccountInfo();
        
        if (result && result.accountId) {
          console.log('✅ HashPack connected via requestAccountInfo:', result.accountId);
          return result.accountId;
        }
      }
    } catch (error) {
      console.log('⚠️ requestAccountInfo failed:', (error as Error).message);
    }

    // Method 2: Alternative APIs
    const methods = ['connect', 'getAccount', 'requestAccount'];
    
    for (const method of methods) {
      try {
        if (hashpack[method]) {
          console.log(`🔄 Trying ${method}...`);
          const result = await hashpack[method]();
          
          // Extract account ID from various response formats
          const accountId = this.extractAccountId(result);
          if (accountId) {
            console.log(`✅ HashPack connected via ${method}:`, accountId);
            return accountId;
          }
        }
      } catch (error) {
        console.log(`⚠️ ${method} failed:`, (error as Error).message);
      }
    }

    throw new Error('HashPack is installed but failed to connect. Please ensure:\n\n1. HashPack is unlocked\n2. You have at least one account\n3. Try refreshing the page');
  }

  private static extractAccountId(result: any): string | null {
    if (!result) return null;

    // String response
    if (typeof result === 'string' && result.match(/^0\.0\.\d+$/)) {
      return result;
    }

    // Object response
    if (typeof result === 'object') {
      const candidates = [
        result.accountId,
        result.account,
        result.data?.accountId,
        result.data?.account,
        result.response?.accountId,
        result.response?.account
      ];

      for (const candidate of candidates) {
        if (candidate && typeof candidate === 'string' && candidate.match(/^0\.0\.\d+$/)) {
          return candidate;
        }
      }
    }

    return null;
  }

  static getInstallInstructions(): string {
    return `HashPack Wallet Installation Required

To use Hedera features, you need HashPack wallet:

1. Visit: https://chrome.google.com/webstore/detail/hashpack/nkbihfbeogaeaoehlefnkodbefgpgknn
2. Click "Add to Chrome"
3. Create or import your Hedera account
4. Return to this page and try connecting again

HashPack is the recommended wallet for Hedera applications.`;
  }
}