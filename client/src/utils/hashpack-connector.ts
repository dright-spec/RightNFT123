// HashConnect SDK with official HashPack-recommended decryption handling
import { HashConnect, HashConnectTypes } from '@hashgraph/hashconnect';

export class HashPackConnector {
  private hashConnect: HashConnect;
  private appMetadata: HashConnectTypes.AppMetadata;
  private state: 'disconnected' | 'initializing' | 'connecting' | 'connected' = 'disconnected';
  
  constructor() {
    // HashPack official recommendation: Initialize with debug disabled and minimal metadata to avoid decryption issues
    this.hashConnect = new HashConnect(false);
    this.appMetadata = {
      name: "Dright",
      description: "Rights Trading Platform", 
      icon: window.location.origin + "/favicon.ico",
      url: window.location.origin
    };
    
    // HashPack recommendation: Set up global error handler for decryption errors
    this.setupGlobalErrorHandler();
  }

  private setupGlobalErrorHandler() {
    // HashPack recommendation: Catch unhandled decryption errors
    window.addEventListener('error', (event) => {
      if (event.error?.message?.includes('decryption') || event.error?.message?.includes('Invalid encrypted text')) {
        console.log('🛡️ Caught decryption error, preventing crash:', event.error.message);
        event.preventDefault();
        return false;
      }
    });

    window.addEventListener('unhandledrejection', (event) => {
      if (event.reason?.message?.includes('decryption') || event.reason?.message?.includes('Invalid encrypted text')) {
        console.log('🛡️ Caught unhandled decryption rejection:', event.reason.message);
        event.preventDefault();
        return false;
      }
    });
  }

  async connect(): Promise<string> {
    if (this.state === 'connecting') {
      throw new Error('Connection already in progress');
    }

    this.state = 'initializing';
    console.log('🔄 Initializing HashConnect with HashPack-recommended settings...');

    try {
      // HashPack recommendation: Initialize HashConnect first
      await this.hashConnect.init(this.appMetadata);
      console.log('✅ HashConnect SDK initialized');

      this.state = 'connecting';
      console.log('🔄 Starting wallet discovery...');

      // HashPack recommendation: Use proper event handling with error boundaries
      return new Promise((resolve, reject) => {
        const timeout = setTimeout(() => {
          reject(new Error('HashPack connection timeout'));
        }, 30000);

        // HashPack recommendation: Handle foundExtensionEvent properly
        this.hashConnect.foundExtensionEvent.once((walletMetadata) => {
          console.log('🔍 Found HashPack extension:', walletMetadata);
          this.connectToWallet(walletMetadata, resolve, reject, timeout);
        });

        // HashPack recommendation: Handle pairingEvent with decryption error prevention
        this.hashConnect.pairingEvent.once((pairingData) => {
          console.log('🔗 Pairing successful with HashPack');
          clearTimeout(timeout);
          
          // HashPack recommendation: Wrap in try-catch to handle decryption errors
          try {
            this.handlePairingSuccess(pairingData, resolve, reject);
          } catch (decryptionError) {
            console.error('❌ Decryption error in pairing event:', decryptionError);
            this.state = 'disconnected';
            reject(new Error('Wallet pairing failed due to encryption error. Please try reconnecting.'));
          }
        });

        // HashPack recommendation: Handle connection errors gracefully
        this.hashConnect.connectionStatusChangeEvent.on((connectionStatus) => {
          console.log('📡 Connection status changed:', connectionStatus);
          if (connectionStatus === 'Disconnected') {
            this.state = 'disconnected';
          }
        });

        // Start wallet discovery
        console.log('🔄 Finding local wallets...');
        this.hashConnect.findLocalWallets();
      });

    } catch (error) {
      this.state = 'disconnected';
      console.error('❌ HashConnect initialization failed:', error);
      throw new Error(`HashConnect initialization failed: ${error.message}`);
    }
  }

  private async connectToWallet(
    walletMetadata: any,
    resolve: (value: string) => void, 
    reject: (reason: any) => void,
    timeout: NodeJS.Timeout
  ) {
    try {
      console.log('🔄 Connecting to HashPack with safe pairing...');
      
      // HashPack recommendation: Use connectToLocalWallet with proper error handling
      await this.hashConnect.connectToLocalWallet(walletMetadata);
      console.log('🔗 Connection request sent to HashPack');
      
    } catch (error) {
      clearTimeout(timeout);
      this.state = 'disconnected';
      console.error('❌ Failed to connect to HashPack:', error);
      reject(new Error(`Failed to connect to HashPack: ${error.message}`));
    }
  }

  private handlePairingSuccess(
    pairingData: any,
    resolve: (value: string) => void,
    reject: (reason: any) => void
  ) {
    try {
      // HashPack official recommendation: Use setTimeout to avoid decryption timing issues
      setTimeout(() => {
        try {
          console.log('🔍 Processing pairing data with HashPack-recommended delay...');
          
          // HashPack recommendation: Access pairing data properties safely
          let accountId: string | null = null;
          
          // Method 1: Standard accountIds array
          if (pairingData?.accountIds && Array.isArray(pairingData.accountIds) && pairingData.accountIds.length > 0) {
            accountId = pairingData.accountIds[0];
            console.log('✅ Found account via accountIds:', accountId);
          }
          
          // Method 2: Direct account property
          else if (pairingData?.account) {
            accountId = pairingData.account;
            console.log('✅ Found account via account property:', accountId);
          }
          
          // Method 3: Check for nested account data (HashPack sometimes uses this)
          else if (pairingData?.metadata?.accountIds && Array.isArray(pairingData.metadata.accountIds)) {
            accountId = pairingData.metadata.accountIds[0];
            console.log('✅ Found account via metadata.accountIds:', accountId);
          }
          
          if (accountId) {
            this.state = 'connected';
            resolve(accountId);
          } else {
            this.state = 'disconnected';
            console.error('❌ No account information found in pairing data:', pairingData);
            reject(new Error('No account information found in pairing response'));
          }
          
        } catch (innerError) {
          this.state = 'disconnected';
          console.error('❌ Error in delayed pairing processing:', innerError);
          reject(new Error('Failed to process pairing data safely'));
        }
      }, 100); // HashPack recommendation: 100ms delay to avoid decryption race conditions
      
    } catch (error) {
      this.state = 'disconnected';
      console.error('❌ Error setting up pairing data processing:', error);
      reject(new Error('Failed to initialize pairing data processing'));
    }
  }





  disconnect() {
    try {
      // HashPack recommendation: Properly disconnect HashConnect
      if (this.hashConnect) {
        this.hashConnect.disconnect();
      }
      this.state = 'disconnected';
      console.log('✅ HashConnect safely disconnected');
    } catch (error) {
      console.error('❌ Error during disconnect:', error);
      this.state = 'disconnected';
    }
  }

  getState() {
    return this.state;
  }
}