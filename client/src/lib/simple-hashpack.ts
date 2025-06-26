/**
 * Simple HashPack Wallet Integration
 * Bypasses HashConnect entirely to avoid encryption and API compatibility issues
 */

// Declare HashPack extension interface
declare global {
  interface Window {
    hashpack?: any;
  }
}

class SimpleHashPack {
  private accountId: string | null = null;
  private readonly STORAGE_KEY = 'hashpack_account';

  /**
   * Check if HashPack extension is available
   */
  isAvailable(): boolean {
    return !!window.hashpack;
  }

  /**
   * Check if wallet is connected
   */
  isConnected(): boolean {
    // Check both runtime state and stored account
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
    } catch (error) {
      console.warn('Failed to store account:', error);
    }
  }

  /**
   * Connect to HashPack wallet using multiple fallback methods
   */
  async connectWallet(): Promise<string> {
    if (!this.isAvailable()) {
      throw new Error('HashPack extension not found. Please install HashPack wallet.');
    }

    const hashpack = window.hashpack;
    
    try {
      console.log('🚀 Connecting to HashPack via direct API...');

      // Method 1: Try requestAccountInfo (most common)
      let result;
      if (hashpack.requestAccountInfo) {
        console.log('📞 Using requestAccountInfo method...');
        result = await hashpack.requestAccountInfo();
      }
      // Method 2: Try getAccountInfo fallback
      else if (hashpack.getAccountInfo) {
        console.log('📞 Using getAccountInfo fallback...');
        result = await hashpack.getAccountInfo();
      }
      // Method 3: Try direct account access
      else if (hashpack.account) {
        console.log('📞 Using direct account access...');
        result = { accountId: hashpack.account };
      }
      else {
        throw new Error('No compatible HashPack API methods found');
      }

      // Extract account ID from various response formats
      let accountId: string;
      if (typeof result === 'string') {
        accountId = result;
      } else if (result?.accountId) {
        accountId = result.accountId;
      } else if (result?.account) {
        accountId = result.account;
      } else if (result?.data?.accountId) {
        accountId = result.data.accountId;
      } else {
        throw new Error('Invalid response format from HashPack');
      }

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
      
      // Handle user rejection
      if (error.message?.includes('rejected') || error.code === 4001) {
        throw new Error('Connection cancelled by user');
      }
      
      // Handle extension errors
      if (error.message?.includes('extension')) {
        throw new Error('HashPack extension error. Please try refreshing the page.');
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

      // Try to disconnect from extension if method exists
      const hashpack = window.hashpack;
      if (hashpack?.disconnect) {
        await hashpack.disconnect();
      }

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
}

// Export singleton instance
export const simpleHashPack = new SimpleHashPack();