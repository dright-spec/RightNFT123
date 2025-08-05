import {
  HederaSessionEvent,
  HederaJsonRpcMethod,
  DAppConnector,
  HederaChainId,
  ExtensionData,
} from '@hashgraph/hedera-wallet-connect';
import { LedgerId } from '@hashgraph/sdk';
import { SignClient } from '@walletconnect/sign-client';
import { 
  WALLETCONNECT_PROJECT_ID, 
  DAPP_METADATA as metadata,
  configureWalletConnectForHashPack,
  HEDERA_REQUIRED_NAMESPACES
} from './walletconnect-config';

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

    console.log('Initializing Hedera wallet service...');
    console.log('WalletConnect Project ID:', WALLETCONNECT_PROJECT_ID ? 'Present' : 'Missing');

    if (!WALLETCONNECT_PROJECT_ID) {
      throw new Error('WalletConnect Project ID is not configured');
    }

    // Get WalletConnect configuration optimized for HashPack
    const config = configureWalletConnectForHashPack();
    console.log('WalletConnect configuration:', config);

    const ledgerId = network === 'mainnet' ? LedgerId.MAINNET : LedgerId.TESTNET;
    const chainId = network === 'mainnet' ? HederaChainId.Mainnet : HederaChainId.Testnet;

    // Create DAppConnector with proper configuration
    this.connector = new DAppConnector(
      metadata,
      ledgerId,
      WALLETCONNECT_PROJECT_ID,
      Object.values(HederaJsonRpcMethod),
      [HederaSessionEvent.ChainChanged, HederaSessionEvent.AccountsChanged],
      [chainId]
    );

    // Initialize the connector with enhanced logging
    console.log('Initializing DAppConnector with enhanced configuration...');
    try {
      await this.connector.init({ 
        logger: 'debug',
        relayUrl: 'wss://relay.walletconnect.org' 
      });
      console.log('DAppConnector initialized successfully');
      console.log('WalletConnect client:', this.connector.walletConnectClient ? 'Created' : 'Not created');
      
      // Log available wallets
      if (this.connector.walletConnectClient) {
        console.log('WalletConnect ready for HashPack connection');
      }
    } catch (error) {
      console.error('Failed to initialize DAppConnector:', error);
      throw error;
    }

    // Set up event listeners
    this.setupEventListeners();
  }

  private setupEventListeners(): void {
    if (!this.connector) return;

    // Note: Event listeners will be set up after connection is established
    // The DAppConnector doesn't support .on() method directly
  }

  private async cleanupStaleSessions(): Promise<void> {
    try {
      const sessions = this.connector?.walletConnectClient?.session.getAll();
      if (sessions && sessions.length > 0) {
        console.log(`Found ${sessions.length} existing sessions, checking validity...`);
        for (const session of sessions) {
          try {
            // Check if session is expired
            const expiryDate = new Date(session.expiry * 1000);
            if (expiryDate < new Date()) {
              console.log(`Removing expired session: ${session.topic}`);
              await this.connector?.walletConnectClient?.session.delete(session.topic, {
                code: 6000,
                message: 'Session expired'
              });
            }
          } catch (error) {
            console.error('Error cleaning up session:', error);
          }
        }
      }
    } catch (error) {
      console.error('Error during session cleanup:', error);
    }
  }

  private async detectHashPackExtension(): Promise<boolean> {
    // Check multiple ways HashPack might be exposed
    const win = window as any;
    const checks = [
      typeof win.hashpack !== 'undefined',
      typeof win.HashPackExtension !== 'undefined',
      typeof win.hashconnect !== 'undefined',
      // Check for HashPack in navigator
      navigator.userAgent.includes('HashPack')
    ];
    
    const detected = checks.some(check => check);
    console.log('HashPack extension detection:', { detected, checks });
    return detected;
  }

  private updateSessionInfo(accountString: string): void {
    // Parse the account string format: "hedera:mainnet:0.0.123456"
    const parts = accountString.split(':');
    const accountId = parts[parts.length - 1];
    const network = parts.includes('testnet') ? 'testnet' : 'mainnet';
    
    this.sessionInfo = {
      accountId,
      network: network as 'mainnet' | 'testnet'
    };
    
    console.log('Session info updated:', this.sessionInfo);
  }

  async connect(): Promise<HederaWalletInfo> {
    if (!this.connector) {
      throw new Error('HederaWalletService not initialized');
    }

    console.log('Starting HashPack connection...');
    console.log('DApp URL:', window.location.origin);
    console.log('DApp Metadata:', metadata);

    try {
      // Clean up any stale sessions first
      await this.cleanupStaleSessions();
      
      // Check if already connected with a valid session
      const sessions = this.connector.walletConnectClient?.session.getAll();
      console.log('Active sessions after cleanup:', sessions?.length || 0);
      
      if (sessions && sessions.length > 0) {
        const session = sessions[0];
        const namespaces = session.namespaces;
        const hederaNamespace = namespaces['hedera'];
        
        if (hederaNamespace && hederaNamespace.accounts && hederaNamespace.accounts.length > 0) {
          console.log('Found existing valid Hedera session');
          this.updateSessionInfo(hederaNamespace.accounts[0]);
          return this.sessionInfo!;
        }
      }

      // Detect if HashPack extension is available
      const hashPackDetected = await this.detectHashPackExtension();
      console.log('HashPack extension detected:', hashPackDetected);

      // Clear any existing modal state
      if (this.connector.modal) {
        this.connector.modal.closeModal();
        await new Promise(resolve => setTimeout(resolve, 200));
      }

      // Open the WalletConnect modal for new connection
      console.log('Opening WalletConnect modal with HashPack support...');
      
      try {
        // The DAppConnector should show HashPack in the modal
        await this.connector.openModal();
        console.log('WalletConnect modal opened successfully');
        
        // Provide guidance if HashPack isn't detected
        if (!hashPackDetected) {
          console.warn('HashPack extension not detected. User may need to install it.');
        }
      } catch (error) {
        console.error('Failed to open WalletConnect modal:', error);
        
        if (!hashPackDetected) {
          throw new Error('HashPack wallet not detected. Please install the HashPack browser extension from https://www.hashpack.app/download and refresh the page.');
        } else {
          throw new Error('Failed to open wallet connection modal. Please ensure HashPack is unlocked and try again.');
        }
      }

      // Return a promise that resolves when connection is established
      return new Promise((resolve, reject) => {
        let attempts = 0;
        const maxAttempts = 120; // 2 minutes timeout
        let modalClosed = false;
        
        const checkConnection = async () => {
          attempts++;
          
          try {
            // Check if modal was closed by user
            if (this.connector?.modal && !this.connector.modal.getIsOpen() && attempts > 3) {
              modalClosed = true;
              console.log('WalletConnect modal was closed by user');
              reject(new Error('Connection cancelled by user'));
              return;
            }
            
            const newSessions = this.connector?.walletConnectClient?.session.getAll();
            if (newSessions && newSessions.length > 0) {
              console.log('New session detected');
              const session = newSessions[0];
              const namespaces = session.namespaces;
              const hederaNamespace = namespaces['hedera'];
              
              if (hederaNamespace && hederaNamespace.accounts && hederaNamespace.accounts.length > 0) {
                console.log('HashPack connected successfully');
                const accountString = hederaNamespace.accounts[0];
                this.updateSessionInfo(accountString);
                
                // Close the modal
                if (this.connector.modal) {
                  this.connector.modal.closeModal();
                }
                
                resolve(this.sessionInfo!);
                return;
              }
            }
          } catch (error) {
            console.warn('Error checking connection:', error);
          }
          
          if (attempts >= maxAttempts) {
            console.error('Connection timeout');
            if (this.connector.modal) {
              this.connector.modal.closeModal();
            }
            reject(new Error('Connection timeout. Please ensure HashPack is unlocked and try again.'));
            return;
          }
          
          // Continue checking if modal is still open
          if (!modalClosed) {
            setTimeout(checkConnection, 1000);
          }
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