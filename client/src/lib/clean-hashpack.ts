/**
 * Clean HashPack Wallet Integration
 * Direct browser extension API without HashConnect complexity
 */

// Simple HashPack extension interface
declare global {
  interface Window {
    hashpack?: any;
    hashconnect?: any;
    HashPack?: any;
    hcSdk?: any;
    hedera?: any;
  }
}

class CleanHashPack {
  private accountId: string | null = null;
  private readonly STORAGE_KEY = 'hashpack_account_clean';

  /**
   * Check if HashPack extension is available
   * Uses the same detection logic that was working before
   */
  isAvailable(): boolean {
    // Check all possible HashPack global objects
    return !!(
      window.hashpack ||
      window.hashconnect ||
      window.HashPack ||
      window.hcSdk ||
      window.hedera ||
      (window as any).hashpack ||
      (window as any).hashconnect ||
      (window as any).HashPack ||
      (window as any).hcSdk ||
      (window as any).hedera
    );
  }

  /**
   * Check if wallet is connected
   */
  isConnected(): boolean {
    return !!(this.accountId || this.getStoredAccount());
  }

  /**
   * Get stored account from localStorage
   */
  getStoredAccount(): string | null {
    try {
      return localStorage.getItem(this.STORAGE_KEY);
    } catch {
      return null;
    }
  }

  /**
   * Store account to localStorage
   */
  private storeAccount(accountId: string): void {
    try {
      localStorage.setItem(this.STORAGE_KEY, accountId);
      this.accountId = accountId;
      console.log('💾 Account stored:', accountId);
    } catch (error) {
      console.warn('Failed to store account:', error);
    }
  }

  /**
   * Connect to HashPack wallet
   */
  async connectWallet(): Promise<string> {
    if (!this.isAvailable()) {
      throw new Error('HashPack extension not found. Please install HashPack wallet from https://www.hashpack.app/');
    }

    try {
      console.log('🚀 Connecting to HashPack...');
      
      // Try to find the HashPack extension using multiple approaches
      let hashpackExtension = window.hashpack || 
                            window.hashconnect || 
                            window.HashPack || 
                            window.hcSdk || 
                            window.hedera ||
                            (window as any).hashpack ||
                            (window as any).hashconnect ||
                            (window as any).HashPack ||
                            (window as any).hcSdk ||
                            (window as any).hedera;
      
      if (!hashpackExtension) {
        throw new Error('HashPack extension not found');
      }

      console.log('📱 Found HashPack extension object:', hashpackExtension);
      
      // Try different method names for requesting account info
      let result;
      if (hashpackExtension.requestAccountInfo) {
        console.log('📞 Using requestAccountInfo method...');
        result = await hashpackExtension.requestAccountInfo();
      } else if (hashpackExtension.getAccountInfo) {
        console.log('📞 Using getAccountInfo method...');
        result = await hashpackExtension.getAccountInfo();
      } else if (hashpackExtension.connect) {
        console.log('📞 Using connect method...');
        result = await hashpackExtension.connect();
      } else {
        throw new Error('No compatible HashPack API methods found');
      }
      
      console.log('📞 HashPack response:', result);

      if (!result || !result.accountId) {
        throw new Error('No account information received from HashPack');
      }

      const accountId = result.accountId;

      // Validate Hedera account format
      if (!accountId || !/^0\.0\.\d+$/.test(accountId)) {
        throw new Error(`Invalid Hedera account format: ${accountId}`);
      }

      // Store and return the account ID
      this.storeAccount(accountId);
      console.log('✅ HashPack connected successfully:', accountId);
      
      return accountId;

    } catch (error: any) {
      console.error('❌ HashPack connection failed:', error);
      
      // Handle specific error cases
      if (error.message?.includes('User rejected') || 
          error.message?.includes('cancelled') || 
          error.code === 4001) {
        throw new Error('Connection cancelled by user');
      }
      
      if (error.message?.includes('not found') || 
          error.message?.includes('install')) {
        throw new Error('HashPack extension not found. Please install HashPack wallet.');
      }

      throw new Error(`HashPack connection failed: ${error.message || 'Unknown error'}`);
    }
  }

  /**
   * Disconnect from HashPack wallet
   */
  async disconnect(): Promise<void> {
    try {
      // Clear stored account
      localStorage.removeItem(this.STORAGE_KEY);
      this.accountId = null;

      console.log('✅ HashPack disconnected successfully');
    } catch (error) {
      console.warn('Warning during HashPack disconnect:', error);
    }
  }

  /**
   * Get current account information
   */
  getCurrentAccount(): string | null {
    return this.accountId || this.getStoredAccount();
  }

  /**
   * Get current connection status
   */
  getConnectionStatus(): {
    isAvailable: boolean;
    isConnected: boolean;
    account: string | null;
  } {
    return {
      isAvailable: this.isAvailable(),
      isConnected: this.isConnected(),
      account: this.getCurrentAccount(),
    };
  }
}

// Export singleton instance
export const cleanHashPack = new CleanHashPack();

// For debugging
if (typeof window !== 'undefined') {
  (window as any).cleanHashPack = cleanHashPack;
}