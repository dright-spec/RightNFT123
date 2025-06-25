// HashConnect SDK integration with decryption error fix
import { HashConnect, HashConnectTypes } from '@hashgraph/hashconnect';

export class HashPackConnector {
  private hashConnect: HashConnect;
  private appMetadata: HashConnectTypes.AppMetadata;
  private state: 'disconnected' | 'initializing' | 'connecting' | 'connected' = 'disconnected';
  
  constructor() {
    // Initialize with debug mode disabled to prevent decryption errors
    this.hashConnect = new HashConnect(false);
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
    console.log('🔄 Initializing HashConnect SDK (decryption fix)...');
    
    try {
      // Initialize HashConnect with error handling for decryption issues
      await this.hashConnect.init(this.appMetadata);
      console.log('✅ HashConnect SDK initialized successfully');

      this.state = 'connecting';
      console.log('🔄 Starting wallet discovery...');

      // Set up event listeners with proper error handling
      return new Promise((resolve, reject) => {
        const timeout = setTimeout(() => {
          reject(new Error('HashPack connection timeout - no wallets found'));
        }, 30000); // 30 second timeout for user confirmation

        let walletFound = false;

        // Listen for wallet discovery with improved error handling
        this.hashConnect.foundExtensionEvent.once((walletMetadata) => {
          console.log('🔍 Found wallet extension:', walletMetadata);
          walletFound = true;
          
          // Improved wallet connection with decryption error prevention
          this.connectToWalletSafely(walletMetadata, resolve, reject, timeout);
        });

        // Listen for pairing events with decryption error handling
        this.hashConnect.pairingEvent.once((pairingData) => {
          console.log('🔗 Wallet pairing successful:', pairingData);
          clearTimeout(timeout);
          
          try {
            if (pairingData.accountIds && pairingData.accountIds.length > 0) {
              const accountId = pairingData.accountIds[0];
              this.state = 'connected';
              console.log('✅ Successfully connected to account:', accountId);
              resolve(accountId);
            } else {
              this.state = 'disconnected';
              reject(new Error('No account IDs received from wallet'));
            }
          } catch (error) {
            this.state = 'disconnected';
            reject(new Error(`Pairing data processing failed: ${error.message}`));
          }
        });

        // Start wallet discovery
        console.log('🔄 Initiating wallet discovery...');
        this.hashConnect.findLocalWallets();

        // Fallback timeout check
        setTimeout(() => {
          if (!walletFound) {
            console.log('⚠️ No wallets found after 5 seconds, continuing search...');
          }
        }, 5000);
      });

    } catch (error) {
      this.state = 'disconnected';
      console.error('❌ HashConnect initialization failed:', error);
      throw new Error(`HashConnect initialization failed: ${error.message || 'Unknown error'}`);
    }
  }

  private async connectToWalletSafely(
    walletMetadata: any, 
    resolve: (value: string) => void, 
    reject: (reason: any) => void,
    timeout: NodeJS.Timeout
  ) {
    try {
      console.log('🔄 Attempting safe connection to HashPack...');
      
      // Add error handling wrapper to prevent decryption errors
      try {
        await this.hashConnect.connectToLocalWallet(walletMetadata);
        console.log('🔗 Connection request sent successfully to HashPack');
        
        // The pairing event listener will handle the response
        
      } catch (connectionError) {
        // Handle specific decryption errors
        if (connectionError.message && connectionError.message.includes('decryption')) {
          console.log('⚠️ Decryption error detected, attempting recovery...');
          
          // Try to reinitialize HashConnect to clear any corrupted state
          try {
            this.hashConnect = new HashConnect(false);
            await this.hashConnect.init(this.appMetadata);
            await this.hashConnect.connectToLocalWallet(walletMetadata);
            console.log('✅ Connection recovered after decryption error');
          } catch (recoveryError) {
            clearTimeout(timeout);
            this.state = 'disconnected';
            reject(new Error('Failed to recover from decryption error'));
            return;
          }
        } else {
          throw connectionError;
        }
      }
      
    } catch (error) {
      clearTimeout(timeout);
      this.state = 'disconnected';
      console.error('❌ Failed to connect to HashPack:', error);
      reject(new Error(`Failed to connect to HashPack: ${error.message || 'Unknown error'}`));
    }
  }



  disconnect() {
    try {
      if (this.hashConnect) {
        this.hashConnect.disconnect();
      }
      this.state = 'disconnected';
      console.log('✅ HashConnect disconnected');
    } catch (error) {
      console.error('❌ Error during disconnect:', error);
      this.state = 'disconnected';
    }
  }

  getState() {
    return this.state;
  }
}