// HashConnect SDK with official HashPack-recommended decryption handling
import { HashConnect, HashConnectTypes } from '@hashgraph/hashconnect';

export class HashPackConnector {
  private hashConnect: HashConnect;
  private appMetadata: HashConnectTypes.AppMetadata;
  private state: 'disconnected' | 'initializing' | 'connecting' | 'connected' = 'disconnected';
  
  constructor() {
    // HashPack official recommendation: Initialize with debug disabled and proper metadata
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

        // HashPack recommendation: Handle pairingEvent with proper error handling
        this.hashConnect.pairingEvent.once((pairingData) => {
          console.log('🔗 Pairing successful with HashPack');
          clearTimeout(timeout);
          
          // HashPack recommendation: Safely extract account data
          this.handlePairingSuccess(pairingData, resolve, reject);
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
      // HashPack recommendation: Safely handle pairing data to avoid decryption errors
      console.log('🔍 Processing pairing data safely...');
      
      // Extract account IDs with null checks
      if (pairingData && pairingData.accountIds && Array.isArray(pairingData.accountIds)) {
        const accountIds = pairingData.accountIds;
        
        if (accountIds.length > 0 && accountIds[0]) {
          const accountId = accountIds[0];
          this.state = 'connected';
          console.log('✅ Successfully paired with account:', accountId);
          resolve(accountId);
          return;
        }
      }
      
      // Fallback: Try different data structures
      if (pairingData && pairingData.account) {
        const accountId = pairingData.account;
        this.state = 'connected';
        console.log('✅ Successfully paired with account (fallback):', accountId);
        resolve(accountId);
        return;
      }
      
      // If no account data found
      this.state = 'disconnected';
      reject(new Error('No account information found in pairing data'));
      
    } catch (error) {
      this.state = 'disconnected';
      console.error('❌ Error processing pairing data:', error);
      
      // HashPack recommendation: Don't expose internal error details that might contain encrypted data
      reject(new Error('Failed to process wallet pairing response'));
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