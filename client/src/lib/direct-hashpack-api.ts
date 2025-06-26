// Direct HashPack API implementation without HashConnect encryption
// This bypasses all HashConnect encryption to prevent "Invalid encrypted text received" errors

interface DirectHashPackAPI {
  requestAccountInfo(): Promise<{ accountIds: string[] }>;
  sendTransaction(transaction: any): Promise<{ response: any }>;
  signMessage?(message: string): Promise<{ signature: string }>;
}

declare global {
  interface Window {
    hashpack?: DirectHashPackAPI;
  }
}

export class DirectHashPackConnector {
  private static instance: DirectHashPackConnector;
  
  static getInstance(): DirectHashPackConnector {
    if (!DirectHashPackConnector.instance) {
      DirectHashPackConnector.instance = new DirectHashPackConnector();
    }
    return DirectHashPackConnector.instance;
  }

  async detectHashPack(): Promise<boolean> {
    return Boolean(window.hashpack);
  }

  async connectWallet(): Promise<string> {
    if (!window.hashpack) {
      throw new Error('HashPack wallet not detected. Please install HashPack extension.');
    }

    try {
      // Direct API call without any encryption layer
      const response = await window.hashpack.requestAccountInfo();
      
      if (!response || !response.accountIds || response.accountIds.length === 0) {
        throw new Error('No accounts found in HashPack wallet');
      }

      const accountId = response.accountIds[0];
      
      // Store connection state
      localStorage.setItem('hashpack_connected', 'true');
      localStorage.setItem('hashpack_account', accountId);
      
      return accountId;
    } catch (error: any) {
      console.error('Direct HashPack connection failed:', error);
      throw new Error(`HashPack connection failed: ${error.message}`);
    }
  }

  async disconnectWallet(): Promise<void> {
    localStorage.removeItem('hashpack_connected');
    localStorage.removeItem('hashpack_account');
  }

  getStoredAccount(): string | null {
    const isConnected = localStorage.getItem('hashpack_connected');
    const account = localStorage.getItem('hashpack_account');
    
    return isConnected === 'true' ? account : null;
  }

  isConnected(): boolean {
    return localStorage.getItem('hashpack_connected') === 'true';
  }
}

// Export singleton instance
export const directHashPack = DirectHashPackConnector.getInstance();