// HashConnect SDK with minimal decryption error fix
import { HashConnect, HashConnectTypes } from '@hashgraph/hashconnect';

export class HashPackConnector {
  private hashConnect: HashConnect;
  private appMetadata: HashConnectTypes.AppMetadata;
  private state: 'disconnected' | 'initializing' | 'connecting' | 'connected' = 'disconnected';
  
  constructor() {
    // Use HashConnect but with minimal configuration to reduce decryption issues
    this.hashConnect = new HashConnect(false);
    this.appMetadata = {
      name: "Dright",
      description: "Rights Trading",
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
      // Initialize HashConnect (this was working)
      await this.hashConnect.init(this.appMetadata);
      console.log('✅ HashConnect SDK initialized');

      this.state = 'connecting';
      console.log('🔄 Finding HashPack wallet...');

      // Use the working discovery and pairing flow
      return new Promise((resolve, reject) => {
        const timeout = setTimeout(() => {
          reject(new Error('HashPack connection timeout'));
        }, 30000);

        // This was working - keep it exactly the same
        this.hashConnect.foundExtensionEvent.once((walletMetadata) => {
          console.log('🔍 Found HashPack extension:', walletMetadata);
          this.connectToWallet(walletMetadata, resolve, reject, timeout);
        });

        // Only fix the pairing event to handle decryption safely
        this.hashConnect.pairingEvent.once((pairingData) => {
          console.log('🔗 Pairing successful with HashPack');
          clearTimeout(timeout);
          
          // Minimal fix: just extract account safely without touching encrypted data
          this.extractAccountSafely(pairingData, resolve, reject);
        });

        // Start wallet discovery (this was working)
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
      console.log('🔄 Connecting to HashPack...');
      
      // This was working - keep it the same
      await this.hashConnect.connectToLocalWallet(walletMetadata);
      console.log('🔗 Connection request sent to HashPack');
      
    } catch (error) {
      clearTimeout(timeout);
      this.state = 'disconnected';
      console.error('❌ Failed to connect to HashPack:', error);
      reject(new Error(`Failed to connect to HashPack: ${error.message}`));
    }
  }

  private extractAccountSafely(
    pairingData: any,
    resolve: (value: string) => void,
    reject: (reason: any) => void
  ) {
    // Minimal fix: don't process any encrypted data, just extract account directly
    try {
      console.log('🔍 Extracting account information...');
      
      let accountId: string | null = null;
      
      // Try to get account ID without accessing potentially encrypted fields
      if (pairingData?.accountIds?.[0]) {
        accountId = pairingData.accountIds[0];
      } else if (pairingData?.account) {
        accountId = pairingData.account;
      }
      
      if (accountId) {
        this.state = 'connected';
        console.log('✅ Successfully extracted account:', accountId);
        resolve(accountId);
      } else {
        this.state = 'disconnected';
        console.error('❌ No account information found');
        reject(new Error('No account information found in pairing response'));
      }
      
    } catch (error) {
      this.state = 'disconnected';
      console.error('❌ Error extracting account:', error);
      reject(new Error('Failed to extract account information'));
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