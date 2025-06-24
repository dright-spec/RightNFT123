// Direct HashPack wallet integration without HashConnect
// This connects directly to the HashPack extension API

interface HashPackAPI {
  requestAccountInfo(): Promise<{
    accountId: string;
    network: string;
  }>;
  
  sendTransaction(params: {
    transactionBytes: string;
    accountId: string;
  }): Promise<{
    success: boolean;
    transactionId?: string;
  }>;
  
  signMessage(params: {
    message: string;
    accountId: string;
  }): Promise<{
    signature: string;
  }>;
}

declare global {
  interface Window {
    hashpack?: HashPackAPI;
  }
}

export class HashPackWallet {
  private static instance: HashPackWallet;
  
  static getInstance(): HashPackWallet {
    if (!HashPackWallet.instance) {
      HashPackWallet.instance = new HashPackWallet();
    }
    return HashPackWallet.instance;
  }

  async isAvailable(): Promise<boolean> {
    // Wait a bit for extension injection
    for (let i = 0; i < 10; i++) {
      if (window.hashpack) {
        console.log('✅ HashPack API found directly');
        return true;
      }
      await new Promise(resolve => setTimeout(resolve, 100));
    }
    
    console.log('❌ HashPack API not found');
    return false;
  }

  async connect(): Promise<string> {
    if (!window.hashpack) {
      throw new Error('HashPack wallet not detected. Please install HashPack extension.');
    }

    try {
      console.log('🔗 Requesting account info from HashPack...');
      
      const accountInfo = await window.hashpack.requestAccountInfo();
      
      if (!accountInfo.accountId) {
        throw new Error('No account selected in HashPack');
      }

      console.log('✅ HashPack connection successful:', accountInfo);
      return accountInfo.accountId;
      
    } catch (error) {
      console.error('❌ HashPack connection failed:', error);
      throw error;
    }
  }

  async signMessage(message: string, accountId: string): Promise<string> {
    if (!window.hashpack) {
      throw new Error('HashPack wallet not available');
    }

    try {
      const result = await window.hashpack.signMessage({
        message,
        accountId
      });
      
      return result.signature;
    } catch (error) {
      console.error('Message signing failed:', error);
      throw error;
    }
  }
}

export const hashPackWallet = HashPackWallet.getInstance();