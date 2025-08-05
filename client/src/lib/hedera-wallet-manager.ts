import {
  HederaSessionEvent,
  HederaJsonRpcMethod,
  DAppConnector,
  HederaChainId,
} from '@hashgraph/hedera-wallet-connect';
import { LedgerId, Client, Hbar, TransferTransaction, AccountId } from '@hashgraph/sdk';

// Get WalletConnect project ID from environment
const WALLETCONNECT_PROJECT_ID = import.meta.env.VITE_WALLETCONNECT_PROJECT_ID || '';

// DApp metadata for HashPack wallet connection (following FRD spec)
const metadata = {
  name: 'Dright - Digital Rights Marketplace',
  description: 'A cutting-edge web3 marketplace for tokenizing and trading legal rights as NFTs on the Hedera network',
  url: window.location.origin,
  icons: [`${window.location.origin}/favicon.ico`],
};

export interface HederaWalletInfo {
  id: string;
  name: string;
  description: string;
  icon: string;
  isAvailable: boolean;
  isRecommended: boolean;
  isHederaNative: boolean;
  downloadUrl: string;
}

export interface HederaConnectionState {
  isConnected: boolean;
  accountId: string | null;
  network: 'mainnet' | 'testnet' | null;
  balance: string | null;
  error: string | null;
  isConnecting: boolean;
}

class HederaWalletManager {
  private connector: DAppConnector | null = null;
  private connectionState: HederaConnectionState = {
    isConnected: false,
    accountId: null,
    network: null,
    balance: null,
    error: null,
    isConnecting: false,
  };
  
  private listeners: ((state: HederaConnectionState) => void)[] = [];
  private client: Client | null = null;

  constructor() {
    this.loadPersistedState();
  }

  /**
   * Detect available Hedera wallets (primarily HashPack)
   */
  async detectAvailableWallets(): Promise<HederaWalletInfo[]> {
    const wallets: HederaWalletInfo[] = [];

    // HashPack detection - primary Hedera wallet
    const hasHashPack = this.detectHashPack();
    wallets.push({
      id: "hashpack",
      name: "HashPack",
      description: "The premier wallet for the Hedera network with secure key management",
      icon: "🟣",
      isAvailable: hasHashPack,
      isRecommended: true,
      isHederaNative: true,
      downloadUrl: "https://www.hashpack.app/",
    });

    // WalletConnect - for other Hedera-compatible wallets
    wallets.push({
      id: "walletconnect",
      name: "WalletConnect",
      description: "Connect with other Hedera-compatible wallets via QR code",
      icon: "🔗",
      isAvailable: true, // Always available as it's a protocol
      isRecommended: false,
      isHederaNative: true,
      downloadUrl: "https://walletconnect.com/",
    });

    console.log('Hedera wallet detection results:', {
      hashpack: hasHashPack,
      windowObjects: {
        hashconnect: !!(window as any).hashconnect,
        walletconnect: !!(window as any).WalletConnect,
      }
    });

    return wallets;
  }

  /**
   * Detect HashPack wallet installation
   */
  private detectHashPack(): boolean {
    return !!(window as any).hashconnect || !!(window as any).HashPack;
  }

  /**
   * Initialize the Hedera wallet connection
   */
  async initialize(network: 'mainnet' | 'testnet' = 'mainnet'): Promise<void> {
    if (this.connector) {
      return; // Already initialized
    }

    console.log('Initializing Hedera wallet manager...');
    
    if (!WALLETCONNECT_PROJECT_ID) {
      throw new Error('WalletConnect Project ID is not configured. Please set VITE_WALLETCONNECT_PROJECT_ID environment variable.');
    }

    const ledgerId = network === 'mainnet' ? LedgerId.MAINNET : LedgerId.TESTNET;
    const chainId = network === 'mainnet' ? HederaChainId.Mainnet : HederaChainId.Testnet;

    // Create DAppConnector following the functional requirements specification
    this.connector = new DAppConnector(
      metadata,
      ledgerId,
      WALLETCONNECT_PROJECT_ID,
      Object.values(HederaJsonRpcMethod), // All supported Hedera JSON-RPC methods
      [HederaSessionEvent.ChainChanged, HederaSessionEvent.AccountsChanged], // Event subscriptions
      [chainId] // Supported chain IDs
    );

    // Initialize Hedera client
    this.client = network === 'mainnet' ? Client.forMainnet() : Client.forTestnet();

    try {
      await this.connector.init({ logger: 'error' });
      console.log('Hedera DAppConnector initialized successfully');
      
      // Set up event listeners for account and chain changes
      this.setupEventListeners();
      
    } catch (error) {
      console.error('Failed to initialize Hedera DAppConnector:', error);
      this.updateState({ error: 'Failed to initialize wallet connection' });
      throw error;
    }
  }

  /**
   * Connect to HashPack wallet
   */
  async connectHashPack(): Promise<string> {
    if (!this.connector) {
      await this.initialize();
    }

    this.updateState({ isConnecting: true, error: null });

    try {
      console.log('Starting HashPack connection...');
      
      // Open WalletConnect modal for HashPack connection
      await this.connector!.openModal();
      
      // Wait for connection to be established
      const accountInfo = await this.waitForConnection();
      
      // Parse account ID from the connection response
      const accountId = this.parseAccountId(accountInfo);
      
      // Get account balance
      const balance = await this.getBalance(accountId);
      
      this.updateState({
        isConnected: true,
        accountId,
        network: 'mainnet', // Default to mainnet, can be updated based on connection
        balance,
        isConnecting: false,
        error: null,
      });

      // Persist connection state
      this.persistState();
      
      console.log('HashPack connected successfully:', accountId);
      return accountId;
      
    } catch (error) {
      console.error('HashPack connection failed:', error);
      this.updateState({ 
        isConnecting: false, 
        error: error instanceof Error ? error.message : 'Connection failed' 
      });
      throw error;
    }
  }

  /**
   * Wait for wallet connection to be established
   */
  private async waitForConnection(): Promise<any> {
    return new Promise((resolve, reject) => {
      let attempts = 0;
      const maxAttempts = 60; // 1 minute timeout
      
      const checkConnection = async () => {
        attempts++;
        
        try {
          const sessions = this.connector?.walletConnectClient?.session.getAll();
          
          if (sessions && sessions.length > 0) {
            const session = sessions[0];
            const namespaces = session.namespaces;
            const hederaNamespace = namespaces['hedera'];
            
            if (hederaNamespace && hederaNamespace.accounts && hederaNamespace.accounts.length > 0) {
              resolve(hederaNamespace.accounts[0]);
              return;
            }
          }
        } catch (error) {
          console.warn('Error checking connection:', error);
        }
        
        if (attempts >= maxAttempts) {
          reject(new Error('Connection timeout. Please ensure HashPack is unlocked and try again.'));
          return;
        }
        
        setTimeout(checkConnection, 1000);
      };
      
      setTimeout(checkConnection, 1000);
    });
  }

  /**
   * Parse account ID from connection response
   */
  private parseAccountId(accountString: string): string {
    // Parse format: "hedera:mainnet:0.0.123456" or similar
    const parts = accountString.split(':');
    return parts[parts.length - 1];
  }

  /**
   * Get account balance in HBAR
   */
  async getBalance(accountId?: string): Promise<string> {
    if (!this.client) {
      throw new Error('Hedera client not initialized');
    }

    const targetAccountId = accountId || this.connectionState.accountId;
    if (!targetAccountId) {
      throw new Error('No account ID available');
    }

    try {
      const balance = await this.client.getAccountBalance(AccountId.fromString(targetAccountId));
      return balance.hbars.toString();
    } catch (error) {
      console.error('Failed to get account balance:', error);
      return '0';
    }
  }

  /**
   * Send HBAR payment
   */
  async sendPayment(params: {
    to: string;
    amount: string;
    currency: 'HBAR';
  }): Promise<{ transactionHash: string }> {
    if (!this.connector || !this.connectionState.isConnected || !this.connectionState.accountId) {
      throw new Error('Wallet not connected');
    }

    try {
      const transaction = new TransferTransaction()
        .addHbarTransfer(AccountId.fromString(this.connectionState.accountId), Hbar.fromString(`-${params.amount}`))
        .addHbarTransfer(AccountId.fromString(params.to), Hbar.fromString(params.amount));

      // Sign and execute transaction through HashPack
      const signedTransaction = await this.signTransaction(transaction);
      
      // This would typically return the transaction ID/hash
      // Implementation depends on the exact HashPack integration
      return {
        transactionHash: 'mock-transaction-hash-' + Date.now()
      };
      
    } catch (error) {
      console.error('Payment failed:', error);
      throw new Error(`Payment failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Sign a transaction using HashPack
   */
  async signTransaction(transaction: any): Promise<any> {
    if (!this.connector) {
      throw new Error('Wallet not connected');
    }

    // Implementation would use the DAppConnector to send transaction to HashPack for signing
    // This is a simplified version - actual implementation would depend on the transaction type
    console.log('Signing transaction with HashPack...');
    
    // The actual signing would happen here using the connector
    throw new Error('Transaction signing implementation needed');
  }

  /**
   * Disconnect wallet
   */
  async disconnect(): Promise<void> {
    if (this.connector) {
      try {
        const sessions = this.connector.walletConnectClient?.session.getAll();
        if (sessions && sessions.length > 0) {
          for (const session of sessions) {
            await this.connector.walletConnectClient?.session.delete(session.topic, {
              code: 6000,
              message: 'User disconnected'
            });
          }
        }
      } catch (error) {
        console.error('Error during disconnect:', error);
      }
    }

    this.updateState({
      isConnected: false,
      accountId: null,
      network: null,
      balance: null,
      error: null,
      isConnecting: false,
    });

    this.clearPersistedState();
    console.log('Hedera wallet disconnected');
  }

  /**
   * Set up event listeners for wallet changes
   */
  private setupEventListeners(): void {
    if (!this.connector) return;

    // Listen for account changes
    this.connector.walletConnectClient?.on('session_event', async (event) => {
      if (event.params.event.name === HederaSessionEvent.AccountsChanged) {
        console.log('Account changed:', event.params.event.data);
        // Handle account change
        await this.handleAccountChange(event.params.event.data);
      } else if (event.params.event.name === HederaSessionEvent.ChainChanged) {
        console.log('Chain changed:', event.params.event.data);
        // Handle network change
        await this.handleChainChange(event.params.event.data);
      }
    });
  }

  /**
   * Handle account change event
   */
  private async handleAccountChange(accounts: string[]): Promise<void> {
    if (accounts.length > 0) {
      const newAccountId = this.parseAccountId(accounts[0]);
      const balance = await this.getBalance(newAccountId);
      
      this.updateState({
        accountId: newAccountId,
        balance,
      });
      
      this.persistState();
    }
  }

  /**
   * Handle network/chain change event
   */
  private async handleChainChange(chainData: any): Promise<void> {
    // Determine network from chain data
    const network = chainData.chainId === HederaChainId.Mainnet ? 'mainnet' : 'testnet';
    
    this.updateState({ network });
    this.persistState();
  }

  /**
   * Get current wallet information
   */
  getWalletInfo(): HederaConnectionState {
    return { ...this.connectionState };
  }

  /**
   * Subscribe to wallet state changes
   */
  subscribe(listener: (state: HederaConnectionState) => void): () => void {
    this.listeners.push(listener);
    
    // Return unsubscribe function
    return () => {
      const index = this.listeners.indexOf(listener);
      if (index > -1) {
        this.listeners.splice(index, 1);
      }
    };
  }

  /**
   * Update internal state and notify listeners
   */
  private updateState(updates: Partial<HederaConnectionState>): void {
    this.connectionState = { ...this.connectionState, ...updates };
    this.listeners.forEach(listener => listener(this.connectionState));
  }

  /**
   * Persist connection state to localStorage
   */
  private persistState(): void {
    if (this.connectionState.isConnected) {
      localStorage.setItem('hedera_wallet_state', JSON.stringify({
        accountId: this.connectionState.accountId,
        network: this.connectionState.network,
      }));
    }
  }

  /**
   * Load persisted connection state
   */
  private loadPersistedState(): void {
    try {
      const savedState = localStorage.getItem('hedera_wallet_state');
      if (savedState) {
        const parsed = JSON.parse(savedState);
        // Only restore if we have valid data
        if (parsed.accountId) {
          this.updateState({
            isConnected: true,
            accountId: parsed.accountId,
            network: parsed.network || 'mainnet',
          });
        }
      }
    } catch (error) {
      console.error('Error loading persisted wallet state:', error);
      this.clearPersistedState();
    }
  }

  /**
   * Clear persisted connection state
   */
  private clearPersistedState(): void {
    localStorage.removeItem('hedera_wallet_state');
  }
}

// Export singleton instance
export const hederaWalletManager = new HederaWalletManager();