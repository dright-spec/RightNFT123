import { ethereumService } from "./ethereum";

export interface WalletConnectionState {
  isConnected: boolean;
  accountAddress: string | null;
  network: string | null;
  error: string | null;
  isConnecting: boolean;
  chainId: number | null;
}

export interface EthereumWalletProvider {
  name: string;
  type: 'metamask' | 'walletconnect' | 'coinbase';
  isAvailable: boolean;
  connect: () => Promise<string>;
  disconnect: () => Promise<void>;
}

class EthereumWalletManager {
  private connectionState: WalletConnectionState = {
    isConnected: false,
    accountAddress: null,
    network: null,
    error: null,
    isConnecting: false,
    chainId: null
  };

  private listeners: Array<(state: WalletConnectionState) => void> = [];

  constructor() {
    this.loadPersistedState();
    this.setupEventListeners();
  }

  private loadPersistedState() {
    const saved = localStorage.getItem('ethereum_wallet');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        this.connectionState = { ...this.connectionState, ...parsed };
      } catch (error) {
        console.error('Failed to load persisted wallet state:', error);
      }
    }
  }

  private setupEventListeners() {
    // Listen for MetaMask events
    if (window.ethereum) {
      window.ethereum.on('accountsChanged', (accounts: string[]) => {
        if (accounts.length === 0) {
          this.updateState({ 
            isConnected: false, 
            accountAddress: null,
            error: 'Account disconnected'
          });
        } else {
          this.updateState({ 
            accountAddress: accounts[0],
            error: null
          });
        }
      });

      window.ethereum.on('chainChanged', (chainId: string) => {
        const newChainId = parseInt(chainId, 16);
        const networkName = this.getNetworkName(newChainId);
        this.updateState({ 
          chainId: newChainId,
          network: networkName
        });
      });

      window.ethereum.on('disconnect', () => {
        this.updateState({
          isConnected: false,
          accountAddress: null,
          error: 'Wallet disconnected'
        });
      });
    }
  }

  private getNetworkName(chainId: number): string {
    switch (chainId) {
      case 1: return 'mainnet';
      case 11155111: return 'sepolia';
      case 5: return 'goerli';
      case 137: return 'polygon';
      case 80001: return 'mumbai';
      default: return 'unknown';
    }
  }

  private updateState(updates: Partial<WalletConnectionState>) {
    this.connectionState = { ...this.connectionState, ...updates };
    
    // Persist to localStorage
    localStorage.setItem('ethereum_wallet', JSON.stringify(this.connectionState));
    
    // Notify listeners
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

  // Detect available Ethereum wallets
  async detectWallets(): Promise<EthereumWalletProvider[]> {
    const providers: EthereumWalletProvider[] = [];

    // Check for MetaMask
    if (this.isMetaMaskAvailable()) {
      providers.push({
        name: 'MetaMask',
        type: 'metamask',
        isAvailable: true,
        connect: () => this.connectMetaMask(),
        disconnect: () => this.disconnect()
      });
    }

    // Check for Coinbase Wallet
    if (this.isCoinbaseWalletAvailable()) {
      providers.push({
        name: 'Coinbase Wallet',
        type: 'coinbase',
        isAvailable: true,
        connect: () => this.connectCoinbaseWallet(),
        disconnect: () => this.disconnect()
      });
    }

    return providers;
  }

  private isMetaMaskAvailable(): boolean {
    return !!(window.ethereum && window.ethereum.isMetaMask);
  }

  private isCoinbaseWalletAvailable(): boolean {
    return !!(window.ethereum && window.ethereum.isCoinbaseWallet);
  }

  // Connect to MetaMask
  async connectMetaMask(): Promise<string> {
    if (!this.isMetaMaskAvailable()) {
      const error = 'MetaMask not detected. Please install MetaMask extension.';
      this.updateState({ error, isConnecting: false });
      throw new Error(error);
    }

    this.updateState({ isConnecting: true, error: null });

    try {
      const accountAddress = await ethereumService.connectMetaMask();
      const walletStatus = ethereumService.getWalletStatus();
      
      this.updateState({
        isConnected: true,
        accountAddress: walletStatus.accountAddress,
        network: walletStatus.network,
        chainId: walletStatus.chainId,
        isConnecting: false,
        error: null
      });

      return accountAddress;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to connect to MetaMask';
      this.updateState({ 
        isConnecting: false, 
        error: errorMessage 
      });
      throw error;
    }
  }

  // Connect to Coinbase Wallet
  async connectCoinbaseWallet(): Promise<string> {
    if (!this.isCoinbaseWalletAvailable()) {
      const error = 'Coinbase Wallet not detected. Please install Coinbase Wallet extension.';
      this.updateState({ error, isConnecting: false });
      throw new Error(error);
    }

    this.updateState({ isConnecting: true, error: null });

    try {
      // Similar to MetaMask connection but for Coinbase Wallet
      const accounts = await window.ethereum.request({ 
        method: 'eth_requestAccounts' 
      });
      
      if (!accounts || accounts.length === 0) {
        throw new Error('No accounts returned from Coinbase Wallet');
      }

      const accountAddress = accounts[0];
      const chainId = await window.ethereum.request({ method: 'eth_chainId' });
      const networkName = this.getNetworkName(parseInt(chainId, 16));

      this.updateState({
        isConnected: true,
        accountAddress: accountAddress,
        network: networkName,
        chainId: parseInt(chainId, 16),
        isConnecting: false,
        error: null
      });

      return accountAddress;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to connect to Coinbase Wallet';
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
      ethereumService.disconnectWallet();
      this.updateState({
        isConnected: false,
        accountAddress: null,
        network: null,
        chainId: null,
        error: null,
        isConnecting: false
      });
      
      localStorage.removeItem('ethereum_wallet');
    } catch (error) {
      console.error('Error during disconnect:', error);
    }
  }

  // Switch to correct network
  async switchNetwork(): Promise<void> {
    if (!this.connectionState.isConnected) {
      throw new Error('Wallet not connected');
    }

    try {
      await ethereumService.switchToCorrectNetwork();
      // State will be updated via the chainChanged event
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to switch network';
      this.updateState({ error: errorMessage });
      throw error;
    }
  }

  // Get account balance
  async getBalance(): Promise<{ eth: string; nfts: number }> {
    if (!this.connectionState.isConnected) {
      throw new Error('Wallet not connected');
    }

    try {
      return await ethereumService.getAccountBalance();
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to get balance';
      this.updateState({ error: errorMessage });
      throw error;
    }
  }

  // Get transaction URL
  getTransactionUrl(transactionHash: string): string {
    return ethereumService.getEtherscanUrl(transactionHash);
  }

  // Get token URL
  getTokenUrl(contractAddress: string, tokenId: string): string {
    return ethereumService.getTokenUrl(contractAddress, tokenId);
  }
}

// Create singleton instance
export const ethereumWallet = new EthereumWalletManager();