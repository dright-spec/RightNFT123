// Official HashConnect SDK integration for HashPack wallet
import { HashConnect, HashConnectTypes } from '@hashgraph/hashconnect';

export class HashPackConnector {
  private hashConnect: HashConnect;
  private appMetadata: HashConnectTypes.AppMetadata;
  private state: 'disconnected' | 'initializing' | 'connecting' | 'connected' = 'disconnected';
  
  constructor() {
    this.hashConnect = new HashConnect(true); // Enable debug mode
    this.appMetadata = {
      name: "Dright Marketplace",
      description: "Decentralized Rights Trading Platform",
      icon: window.location.origin + "/favicon.ico",
      url: window.location.origin
    };
  }

  async connect(): Promise<string> {
    if (this.state === 'connecting') {
      throw new Error('Connection already in progress');
    }

    this.state = 'initializing';
    console.log('🔄 Initializing HashConnect SDK...');
    
    try {
      // Initialize HashConnect
      await this.hashConnect.init(this.appMetadata);
      console.log('✅ HashConnect SDK initialized');

      this.state = 'connecting';
      console.log('🔄 Scanning for available wallets...');

      // Set up event listeners for wallet discovery
      return new Promise((resolve, reject) => {
        const timeout = setTimeout(() => {
          reject(new Error('HashPack connection timeout - no wallets found'));
        }, 15000); // 15 second timeout

        // Listen for wallet discovery
        this.hashConnect.foundExtensionEvent.once((walletMetadata) => {
          console.log('🔍 Found wallet extension:', walletMetadata);
          
          // Check if it's HashPack
          if (walletMetadata.name.toLowerCase().includes('hashpack')) {
            console.log('✅ HashPack wallet detected');
            this.connectToWallet(walletMetadata, resolve, reject, timeout);
          } else {
            console.log('ℹ️ Non-HashPack wallet found, continuing search...');
          }
        });

        // Listen for pairing events
        this.hashConnect.pairingEvent.once((pairingData) => {
          console.log('🔗 Wallet pairing successful:', pairingData);
          clearTimeout(timeout);
          
          if (pairingData.accountIds && pairingData.accountIds.length > 0) {
            const accountId = pairingData.accountIds[0];
            this.state = 'connected';
            console.log('✅ Connected to account:', accountId);
            resolve(accountId);
          } else {
            this.state = 'disconnected';
            reject(new Error('No account IDs received from wallet'));
          }
        });

        // Start looking for wallets
        console.log('🔄 Starting wallet discovery...');
        this.hashConnect.findLocalWallets();
      });

    } catch (error) {
      this.state = 'disconnected';
      console.error('❌ HashConnect initialization failed:', error);
      throw new Error(`HashConnect initialization failed: ${error.message || 'Unknown error'}`);
    }
  }

  private async connectToWallet(
    walletMetadata: any, 
    resolve: (value: string) => void, 
    reject: (reason: any) => void,
    timeout: NodeJS.Timeout
  ) {
    try {
      console.log('🔄 Attempting to connect to HashPack...');
      
      // Connect to the specific wallet
      await this.hashConnect.connectToLocalWallet(walletMetadata);
      console.log('🔗 Connection request sent to HashPack');
      
      // The pairing event listener will handle the response
      
    } catch (error) {
      clearTimeout(timeout);
      this.state = 'disconnected';
      console.error('❌ Failed to connect to HashPack:', error);
      reject(new Error(`Failed to connect to HashPack: ${error.message || 'Unknown error'}`));
    }
  }

  disconnect() {
    try {
      this.hashConnect.disconnect();
      this.state = 'disconnected';
      console.log('✅ HashConnect disconnected');
    } catch (error) {
      console.error('❌ Error during disconnect:', error);
    }
  }

  getState() {
    return this.state;
  }
}