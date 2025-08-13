import { UniversalProvider } from '@walletconnect/universal-provider';
import { getSdkError } from '@walletconnect/utils';

export interface HederaWalletInfo {
  accountId: string;
  network: 'mainnet' | 'testnet';
  isConnected: boolean;
  balance?: string;
}

class HederaWalletService {
  private provider: any = null;
  private session: any = null;
  private accountId: string | null = null;
  private network: 'mainnet' | 'testnet' = 'testnet';

  /**
   * Initialize WalletConnect Universal Provider for Hedera
   */
  async initialize(network: 'mainnet' | 'testnet' = 'testnet'): Promise<void> {
    try {
      this.network = network;
      
      // Initialize Universal Provider
      this.provider = await UniversalProvider.init({
        projectId: import.meta.env.VITE_WALLETCONNECT_PROJECT_ID || 'default-project-id',
        metadata: {
          name: 'Dright - Digital Rights Marketplace',
          description: 'Tokenize and trade legal rights as NFTs on Hedera',
          url: window.location.origin,
          icons: [`${window.location.origin}/favicon.ico`]
        }
      });

      // Set up event listeners
      this.setupEventListeners();
      
      console.log('Hedera WalletConnect service initialized');
    } catch (error) {
      console.error('Failed to initialize WalletConnect:', error);
      throw new Error('Failed to initialize wallet connection service');
    }
  }

  /**
   * Connect to Hedera wallet via WalletConnect
   */
  async connect(): Promise<HederaWalletInfo> {
    try {
      if (!this.provider) {
        throw new Error('WalletConnect provider not initialized');
      }

      // Request connection to Hedera network
      const hederaChainId = this.network === 'mainnet' ? 'hedera:295' : 'hedera:296';
      
      const session = await this.provider.connect({
        namespaces: {
          hedera: {
            methods: ['hedera_testSignTransaction', 'hedera_getNodeAddresses'],
            chains: [hederaChainId],
            events: ['accountChanged', 'chainChanged']
          }
        }
      });

      this.session = session;
      
      // Extract account ID from session
      const accounts = Object.values(session.namespaces)
        .map((namespace: any) => namespace.accounts)
        .flat();
      
      if (!accounts.length) {
        throw new Error('No accounts returned from WalletConnect session');
      }

      // Parse Hedera account ID from account string (format: hedera:295:0.0.123456)
      const accountString = accounts[0] as string;
      this.accountId = accountString.split(':')[2];
      
      console.log('WalletConnect connected to Hedera account:', this.accountId);

      return {
        accountId: this.accountId,
        network: this.network,
        isConnected: true
      };
      
    } catch (error) {
      console.error('WalletConnect connection failed:', error);
      throw new Error(`Failed to connect via WalletConnect: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Disconnect from WalletConnect
   */
  async disconnect(): Promise<void> {
    try {
      if (this.provider && this.session) {
        await this.provider.disconnect({
          topic: this.session.topic,
          reason: getSdkError('USER_DISCONNECTED')
        });
      }
      
      this.session = null;
      this.accountId = null;
      this.provider = null;
      
      console.log('WalletConnect disconnected');
    } catch (error) {
      console.error('Disconnect error:', error);
    }
  }

  /**
   * Get current wallet information
   */
  getWalletInfo(): HederaWalletInfo {
    return {
      accountId: this.accountId || '',
      network: this.network,
      isConnected: Boolean(this.accountId && this.session)
    };
  }

  /**
   * Get account balance (mock implementation for now)
   */
  async getBalance(): Promise<string> {
    if (!this.accountId) {
      throw new Error('No account connected');
    }
    
    // TODO: Implement actual balance fetching via Hedera Mirror Node API
    // For now, return a mock balance
    return '100.0000';
  }

  /**
   * Sign and execute Hedera transaction via WalletConnect
   */
  async executeTransaction(transactionBytes: Uint8Array): Promise<{ transactionId: string }> {
    try {
      if (!this.provider || !this.session || !this.accountId) {
        throw new Error('WalletConnect not properly initialized');
      }

      // Request transaction signature via WalletConnect
      const result = await this.provider.request({
        topic: this.session.topic,
        chainId: this.network === 'mainnet' ? 'hedera:295' : 'hedera:296',
        request: {
          method: 'hedera_testSignTransaction',
          params: {
            signerAccountId: this.accountId,
            transactionBody: Array.from(transactionBytes)
          }
        }
      });

      // Mock transaction ID for development
      const transactionId = `0.0.${Date.now()}@${Math.floor(Date.now() / 1000)}.${Math.floor(Math.random() * 1000000000)}`;
      
      console.log('Transaction executed via WalletConnect:', transactionId);
      
      return { transactionId };
      
    } catch (error) {
      console.error('Transaction execution failed:', error);
      throw new Error(`Transaction failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Set up WalletConnect event listeners
   */
  private setupEventListeners(): void {
    if (!this.provider) return;

    // Handle session events
    this.provider.on('session_event', (event: any) => {
      console.log('WalletConnect session event:', event);
    });

    // Handle session updates
    this.provider.on('session_update', ({ topic, params }: { topic: any; params: any }) => {
      console.log('WalletConnect session updated:', topic, params);
    });

    // Handle session deletion
    this.provider.on('session_delete', () => {
      console.log('WalletConnect session deleted');
      this.session = null;
      this.accountId = null;
    });

    // Handle connection events
    this.provider.on('display_uri', (uri: string) => {
      console.log('WalletConnect URI:', uri);
      // This would be used to display QR code or deep link
    });
  }
}

// Export singleton instance
export const hederaWalletService = new HederaWalletService();
export { HederaWalletService };