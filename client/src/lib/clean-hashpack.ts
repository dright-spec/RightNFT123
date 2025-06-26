/**
 * Clean HashPack Wallet Integration
 * Direct browser extension API without HashConnect complexity
 */

// Simple HashPack extension interface
declare global {
  interface Window {
    hashpack?: {
      requestAccountInfo(): Promise<{
        accountId: string;
        network: string;
      }>;
      isInjected?: boolean;
      isConnected?: boolean;
    };
  }
}

class CleanHashPack {
  private accountId: string | null = null;
  private readonly STORAGE_KEY = 'hashpack_account_clean';

  /**
   * Check if HashPack extension is available
   */
  isAvailable(): boolean {
    return !!(window.hashpack || (window as any).hashpack);
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
      
      const hashpack = window.hashpack || (window as any).hashpack;
      
      if (!hashpack.requestAccountInfo) {
        throw new Error('HashPack extension is outdated. Please update to the latest version.');
      }

      // Request account info from HashPack
      const result = await hashpack.requestAccountInfo();
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