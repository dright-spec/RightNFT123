import { HashConnect, HashConnectTypes, MessageTypes } from '@hashgraph/hashconnect';

// Proper HashConnect implementation following official patterns
export class ProperHashConnectService {
  private hashConnect: HashConnect;
  private state: HashConnectTypes.HashConnectConnectionState = HashConnectTypes.HashConnectConnectionState.Disconnected;
  private pairingData: HashConnectTypes.SessionData | null = null;
  private appMetadata: HashConnectTypes.AppMetadata;

  constructor() {
    this.appMetadata = {
      name: 'Dright Marketplace',
      description: 'Hedera NFT Rights Marketplace',
      icons: [window.location.origin + '/favicon.ico'],
      url: window.location.origin
    };
  }

  async init(): Promise<void> {
    console.log('🔄 Initializing HashConnect properly...');
    
    try {
      // Create new HashConnect instance with proper testnet configuration
      this.hashConnect = new HashConnect(false); // false = testnet, true = mainnet
      
      // Set up event listeners before initialization
      this.setupEventListeners();
      
      // Initialize HashConnect
      const initData = await this.hashConnect.init(this.appMetadata);
      console.log('✅ HashConnect initialized:', initData);
      
    } catch (error) {
      console.error('❌ HashConnect initialization failed:', error);
      throw new Error(`HashConnect initialization failed: ${(error as Error).message}`);
    }
  }

  private setupEventListeners(): void {
    // Connection state changes
    this.hashConnect.connectionStatusChangeEvent.on((state) => {
      console.log('🔄 HashConnect state changed:', state);
      this.state = state;
    });

    // Pairing event - this is where we get the account
    this.hashConnect.pairingEvent.on((pairingData) => {
      console.log('🔗 Pairing event received:', pairingData);
      this.pairingData = pairingData;
    });

    // Disconnection event
    this.hashConnect.disconnectionEvent.on(() => {
      console.log('🔌 Disconnection event');
      this.pairingData = null;
      this.state = HashConnectTypes.HashConnectConnectionState.Disconnected;
    });

    // Found extension event
    this.hashConnect.foundExtensionEvent.on((walletMetadata) => {
      console.log('🔍 Found wallet extension:', walletMetadata);
    });
  }

  async connectToHashPack(): Promise<string> {
    if (!this.hashConnect) {
      await this.init();
    }

    console.log('🔄 Connecting to HashPack...');

    return new Promise((resolve, reject) => {
      const timeout = setTimeout(() => {
        reject(new Error('HashPack connection timeout after 30 seconds'));
      }, 30000);

      // Listen for pairing completion
      const pairingHandler = (pairingData: HashConnectTypes.SessionData) => {
        if (pairingData && pairingData.accountIds && pairingData.accountIds.length > 0) {
          clearTimeout(timeout);
          this.hashConnect.pairingEvent.off(pairingHandler);
          
          const accountId = pairingData.accountIds[0];
          console.log('✅ HashPack connected successfully:', accountId);
          resolve(accountId);
        }
      };

      // Set up pairing listener
      this.hashConnect.pairingEvent.on(pairingHandler);

      // Request pairing with HashPack
      try {
        this.hashConnect.connectToLocalWallet();
        console.log('🔄 Pairing request sent to HashPack...');
      } catch (error) {
        clearTimeout(timeout);
        this.hashConnect.pairingEvent.off(pairingHandler);
        reject(new Error(`Failed to request pairing: ${(error as Error).message}`));
      }
    });
  }

  async disconnect(): Promise<void> {
    if (this.hashConnect && this.pairingData) {
      await this.hashConnect.disconnect(this.pairingData.topic);
      this.pairingData = null;
      this.state = HashConnectTypes.HashConnectConnectionState.Disconnected;
      console.log('✅ HashConnect disconnected');
    }
  }

  isConnected(): boolean {
    return this.state === HashConnectTypes.HashConnectConnectionState.Paired && !!this.pairingData;
  }

  getAccountId(): string | null {
    return this.pairingData?.accountIds?.[0] || null;
  }

  getState(): HashConnectTypes.HashConnectConnectionState {
    return this.state;
  }
}

// Global instance
export const properHashConnect = new ProperHashConnectService();