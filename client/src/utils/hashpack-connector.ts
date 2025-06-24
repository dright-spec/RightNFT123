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

    // First, try to detect if HashPack is available via alternative methods
    console.log('🔍 Checking for HashPack via alternative detection...');
    
    // Check onhashchange object - might be HashPack related
    const onhashchange = (window as any).onhashchange;
    if (onhashchange && typeof onhashchange === 'object') {
      console.log('🔍 Found onhashchange object, investigating...');
      console.log('onhashchange properties:', Object.keys(onhashchange));
    }
    
    // Check for HashPack under different possible names
    const possibleHashPackObjects = [
      'hashpack', 'HashPack', 'hashConnect', 'HashConnect', 
      'hedera', 'Hedera', 'hederaWallet', 'HederaWallet'
    ];
    
    for (const name of possibleHashPackObjects) {
      const obj = (window as any)[name];
      if (obj && typeof obj === 'object') {
        console.log(`🔍 Found potential HashPack object: ${name}`, obj);
        
        // Check if it has HashPack-like methods
        const methods = Object.keys(obj);
        if (methods.some(m => m.includes('account') || m.includes('connect') || m.includes('request'))) {
          console.log(`✅ ${name} has wallet-like methods:`, methods);
          
          // Try to use it directly
          try {
            if (obj.requestAccountInfo) {
              console.log(`🔄 Attempting connection via ${name}.requestAccountInfo...`);
              const result = await obj.requestAccountInfo();
              if (result && result.accountId) {
                console.log(`✅ Connected via ${name}:`, result.accountId);
                return result.accountId;
              }
            }
          } catch (error) {
            console.log(`❌ ${name} connection failed:`, error);
          }
        }
      }
    }

    // Fallback to official HashConnect SDK
    this.state = 'initializing';
    console.log('🔄 Falling back to official HashConnect SDK...');
    
    try {
      // Initialize HashConnect
      await this.hashConnect.init(this.appMetadata);
      console.log('✅ HashConnect SDK initialized');

      this.state = 'connecting';
      console.log('🔄 Scanning for available wallets...');

      // Set up event listeners for wallet discovery
      return new Promise((resolve, reject) => {
        const timeout = setTimeout(() => {
          reject(new Error('HashPack connection timeout - no wallets found after 15 seconds'));
        }, 15000);

        // Listen for any wallet discovery
        this.hashConnect.foundExtensionEvent.once((walletMetadata) => {
          console.log('🔍 Found wallet extension:', walletMetadata);
          this.connectToWallet(walletMetadata, resolve, reject, timeout);
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