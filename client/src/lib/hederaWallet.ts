import { hashConnectService } from "@/lib/hashConnectService";

export interface WalletConnectionState {
  isConnected: boolean;
  accountId: string | null;
  network: string | null;
  error: string | null;
  isConnecting: boolean;
}

export interface HederaWalletProvider {
  name: string;
  type: 'hashpack' | 'blade';
  isAvailable: boolean;
  connect: () => Promise<string>;
  disconnect: () => Promise<void>;
}

class HederaWalletManager {
  private connectionState: WalletConnectionState = {
    isConnected: false,
    accountId: null,
    network: null,
    error: null,
    isConnecting: false
  };

  private listeners: Array<(state: WalletConnectionState) => void> = [];

  constructor() {
    this.initializeFromStorage();
  }

  private initializeFromStorage() {
    try {
      const stored = localStorage.getItem('hedera_wallet_state');
      if (stored) {
        const state = JSON.parse(stored);
        if (state.accountId && state.isConnected) {
          this.connectionState = { ...state, isConnecting: false };
        }
      }
    } catch (error) {
      console.warn('Failed to restore wallet state:', error);
      this.clearStoredState();
    }
  }

  private saveToStorage() {
    try {
      localStorage.setItem('hedera_wallet_state', JSON.stringify(this.connectionState));
    } catch (error) {
      console.warn('Failed to save wallet state:', error);
    }
  }

  private clearStoredState() {
    localStorage.removeItem('hedera_wallet_state');
    localStorage.removeItem('hashconnect_topic');
    localStorage.removeItem('hashconnect_pairing_data');
  }

  private updateState(updates: Partial<WalletConnectionState>) {
    this.connectionState = { ...this.connectionState, ...updates };
    this.saveToStorage();
    this.notifyListeners();
  }

  private notifyListeners() {
    this.listeners.forEach(listener => listener(this.connectionState));
  }

  // Subscribe to state changes
  subscribe(listener: (state: WalletConnectionState) => void): () => void {
    this.listeners.push(listener);
    return () => {
      const index = this.listeners.indexOf(listener);
      if (index > -1) {
        this.listeners.splice(index, 1);
      }
    };
  }

  // Get current state
  getState(): WalletConnectionState {
    return { ...this.connectionState };
  }

  // Detect available Hedera wallets
  async detectWallets(): Promise<HederaWalletProvider[]> {
    const providers: HederaWalletProvider[] = [];

    // Check for HashPack extension
    if (this.isHashPackAvailable()) {
      providers.push({
        name: 'HashPack',
        type: 'hashpack',
        isAvailable: true,
        connect: () => this.connectHashPack(),
        disconnect: () => this.disconnect()
      });
    }

    // Check for Blade wallet
    if (this.isBladeAvailable()) {
      providers.push({
        name: 'Blade',
        type: 'blade',
        isAvailable: true,
        connect: () => this.connectBlade(),
        disconnect: () => this.disconnect()
      });
    }

    return providers;
  }

  private isHashPackAvailable(): boolean {
    return !!(
      (window as any).hashpack ||
      (window as any).HashPack ||
      (window as any).ethereum?.isHashPack ||
      (window as any).hashconnect
    );
  }

  private isBladeAvailable(): boolean {
    return !!(
      (window as any).bladeSDK ||
      (window as any).blade ||
      (window as any).BladeSDK
    );
  }

  // Connect to HashPack wallet
  async connectHashPack(): Promise<string> {
    this.updateState({ isConnecting: true, error: null });

    try {
      // Method 1: Try direct HashPack extension API
      if ((window as any).hashpack) {
        const result = await this.connectDirectHashPack();
        if (result) {
          this.updateState({
            isConnected: true,
            accountId: result,
            network: 'testnet',
            isConnecting: false,
            error: null
          });
          return result;
        }
      }

      // Method 2: Try HashConnect service if available
      if (hashConnectService) {
        const accountId = await hashConnectService.connectWallet();
        if (accountId) {
          this.updateState({
            isConnected: true,
            accountId,
            network: 'testnet',
            isConnecting: false,
            error: null
          });
          return accountId;
        }
      }

      throw new Error('HashPack wallet not available or connection failed');

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown wallet connection error';
      this.updateState({
        isConnecting: false,
        error: errorMessage
      });
      throw error;
    }
  }

  private async connectDirectHashPack(): Promise<string | null> {
    try {
      const hashpack = (window as any).hashpack;
      if (!hashpack) return null;

      // Request connection
      const result = await hashpack.requestAccountInfo();
      if (result && result.accountId) {
        return result.accountId;
      }

      return null;
    } catch (error) {
      console.warn('Direct HashPack connection failed:', error);
      return null;
    }
  }

  // Connect to Blade wallet
  async connectBlade(): Promise<string> {
    this.updateState({ isConnecting: true, error: null });

    try {
      const blade = (window as any).bladeSDK || (window as any).blade;
      if (!blade) {
        throw new Error('Blade wallet not found');
      }

      // Initialize Blade connection
      const result = await blade.connectWallet();
      if (!result || !result.accountId) {
        throw new Error('Failed to connect to Blade wallet');
      }

      this.updateState({
        isConnected: true,
        accountId: result.accountId,
        network: result.network || 'testnet',
        isConnecting: false,
        error: null
      });

      return result.accountId;

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Blade wallet connection failed';
      this.updateState({
        isConnecting: false,
        error: errorMessage
      });
      throw error;
    }
  }

  // Disconnect wallet
  async disconnect(): Promise<void> {
    try {
      // Disconnect from HashConnect service if available
      if (hashConnectService && hashConnectService.disconnect) {
        await hashConnectService.disconnect();
      }

      // Clear state
      this.updateState({
        isConnected: false,
        accountId: null,
        network: null,
        error: null,
        isConnecting: false
      });

      this.clearStoredState();

    } catch (error) {
      console.warn('Disconnect error:', error);
      // Still clear local state even if disconnect fails
      this.connectionState = {
        isConnected: false,
        accountId: null,
        network: null,
        error: null,
        isConnecting: false
      };
      this.clearStoredState();
      this.notifyListeners();
    }
  }

  // Get connection instructions for user
  async getConnectionInstructions(): Promise<string[]> {
    const wallets = await this.detectWallets();
    
    if (wallets.length === 0) {
      return [
        'No Hedera wallets detected.',
        'To connect, please:',
        '1. Install HashPack from hashpack.app',
        '2. Create or import your Hedera account',
        '3. Return here and click Connect Wallet'
      ];
    }

    return [
      'Hedera wallets detected.',
      'Click Connect Wallet to proceed.',
      'Make sure your wallet is unlocked and ready to connect.'
    ];
  }

  // Format account ID for display
  formatAccountId(accountId: string): string {
    if (!accountId) return '';
    
    // Hedera account IDs are in format 0.0.12345
    if (accountId.includes('.')) {
      return accountId;
    }
    
    // If it's just a number, format it
    return `0.0.${accountId}`;
  }

  // Validate account ID format
  isValidAccountId(accountId: string): boolean {
    const hederaAccountRegex = /^0\.0\.\d+$/;
    return hederaAccountRegex.test(accountId);
  }
}

// Create singleton instance
export const hederaWallet = new HederaWalletManager();