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
      // Open the WalletConnect modal
      await this.connector.openModal();

      // Get the connected accounts
      const accounts = await this.getAccounts();
      if (accounts.length === 0) {
        throw new Error('No accounts connected');
      }

      // Update session info with the first account
      this.updateSessionInfo(accounts[0]);

      return this.sessionInfo!;
    } catch (error) {
      console.error('Failed to connect HashPack:', error);
      throw error;
    }
  }

  async disconnect(): Promise<void> {
    if (!this.connector) return;

    try {
      await this.connector.disconnect();
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
      const accounts = await this.connector.getAccountIds();
      return accounts || [];
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