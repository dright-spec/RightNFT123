import {
  HederaSessionEvent,
  HederaJsonRpcMethod,
  DAppConnector,
  HederaChainId,
} from '@hashgraph/hedera-wallet-connect';
import { LedgerId } from '@hashgraph/sdk';

// Get WalletConnect project ID from environment
const WALLETCONNECT_PROJECT_ID = import.meta.env.VITE_WALLETCONNECT_PROJECT_ID || '';

// DApp metadata for wallet connection
const metadata = {
  name: 'Dright',
  description: 'NFT Rights Marketplace on Hedera',
  url: window.location.origin,
  icons: [`${window.location.origin}/logo.png`],
};

// Singleton instance of DAppConnector
let dAppConnector: DAppConnector | null = null;

export interface HederaWalletInfo {
  accountId: string;
  network: 'mainnet' | 'testnet';
  publicKey?: string;
}

export class HederaWalletService {
  private static instance: HederaWalletService;
  private connector: DAppConnector | null = null;
  private sessionInfo: HederaWalletInfo | null = null;

  private constructor() {}

  static getInstance(): HederaWalletService {
    if (!HederaWalletService.instance) {
      HederaWalletService.instance = new HederaWalletService();
    }
    return HederaWalletService.instance;
  }

  async initialize(network: 'mainnet' | 'testnet' = 'mainnet'): Promise<void> {
    if (this.connector) {
      return; // Already initialized
    }

    const ledgerId = network === 'mainnet' ? LedgerId.MAINNET : LedgerId.TESTNET;
    const chainId = network === 'mainnet' ? HederaChainId.Mainnet : HederaChainId.Testnet;

    this.connector = new DAppConnector(
      metadata,
      ledgerId,
      WALLETCONNECT_PROJECT_ID,
      Object.values(HederaJsonRpcMethod),
      [HederaSessionEvent.ChainChanged, HederaSessionEvent.AccountsChanged],
      [chainId]
    );

    // Initialize the connector
    await this.connector.init({ logger: 'error' });

    // Set up event listeners
    this.setupEventListeners();
  }

  private setupEventListeners(): void {
    if (!this.connector) return;

    // Note: Event listeners will be set up after connection is established
    // The DAppConnector doesn't support .on() method directly
  }

  async connect(): Promise<HederaWalletInfo> {
    if (!this.connector) {
      throw new Error('HederaWalletService not initialized');
    }

    try {
      // Check if already connected
      const sessions = this.connector.walletConnectClient?.session.getAll();
      if (sessions && sessions.length > 0) {
        const session = sessions[0];
        const namespaces = session.namespaces;
        const hederaNamespace = namespaces['hedera'];
        
        if (hederaNamespace && hederaNamespace.accounts && hederaNamespace.accounts.length > 0) {
          const accountId = hederaNamespace.accounts[0].split(':').pop() || '';
          this.updateSessionInfo(hederaNamespace.accounts[0]);
          return this.sessionInfo!;
        }
      }

      // Open the WalletConnect modal for new connection
      await this.connector.openModal();

      // Return a promise that resolves when connection is established
      return new Promise((resolve, reject) => {
        let attempts = 0;
        const maxAttempts = 60; // 60 seconds timeout
        
        const checkConnection = async () => {
          attempts++;
          
          try {
            const newSessions = this.connector?.walletConnectClient?.session.getAll();
            if (newSessions && newSessions.length > 0) {
              const session = newSessions[0];
              const namespaces = session.namespaces;
              const hederaNamespace = namespaces['hedera'];
              
              if (hederaNamespace && hederaNamespace.accounts && hederaNamespace.accounts.length > 0) {
                const accountString = hederaNamespace.accounts[0];
                this.updateSessionInfo(accountString);
                resolve(this.sessionInfo!);
                return;
              }
            }
          } catch (error) {
            console.warn('Error checking connection:', error);
          }
          
          if (attempts >= maxAttempts) {
            reject(new Error('Connection timeout - please try again'));
            return;
          }
          
          // Continue checking
          setTimeout(checkConnection, 1000);
        };
        
        // Start checking after a short delay
        setTimeout(checkConnection, 1000);
      });
    } catch (error) {
      console.error('Failed to connect HashPack:', error);
      throw error;
    }
  }

  async disconnect(): Promise<void> {
    if (!this.connector) return;

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
      this.sessionInfo = null;
    } catch (error) {
      console.error('Failed to disconnect:', error);
    }
  }

  async getAccounts(): Promise<string[]> {
    if (!this.connector) {
      throw new Error('HederaWalletService not initialized');
    }

    try {
      // Get accounts from the active session
      const sessions = this.connector.walletConnectClient?.session.getAll();
      if (sessions && sessions.length > 0) {
        const session = sessions[0];
        const namespaces = session.namespaces;
        const hederaNamespace = namespaces['hedera'];
        
        if (hederaNamespace && hederaNamespace.accounts) {
          return hederaNamespace.accounts;
        }
      }
      return [];
    } catch (error) {
      console.error('Failed to get accounts:', error);
      return [];
    }
  }

  private updateSessionInfo(accountString: string): void {
    // Parse the account string format: "hedera:mainnet:0.0.12345"
    const parts = accountString.split(':');
    if (parts.length >= 3) {
      this.sessionInfo = {
        accountId: parts[2],
        network: parts[1] === 'mainnet' ? 'mainnet' : 'testnet',
      };
    }
  }

  getSessionInfo(): HederaWalletInfo | null {
    return this.sessionInfo;
  }

  isConnected(): boolean {
    return this.sessionInfo !== null;
  }

  async signTransaction(transaction: any): Promise<any> {
    if (!this.connector || !this.sessionInfo) {
      throw new Error('Wallet not connected');
    }

    // Implementation for transaction signing
    // This will depend on the specific transaction type
    throw new Error('Transaction signing not yet implemented');
  }
}

// Export singleton instance
export const hederaWalletService = HederaWalletService.getInstance();