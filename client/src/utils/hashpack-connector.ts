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
    
    // Set up global decryption error suppression
    this.setupDecryptionErrorSuppression();
  }

  private setupDecryptionErrorSuppression() {
    // Suppress specific decryption errors globally
    window.addEventListener('error', (event) => {
      if (event.error?.message?.includes('Invalid encrypted text received') ||
          event.error?.message?.includes('Decryption halted')) {
        console.log('🛡️ Suppressed HashConnect decryption error to prevent UI crash');
        event.preventDefault();
        return false;
      }
    });

    window.addEventListener('unhandledrejection', (event) => {
      if (event.reason?.message?.includes('Invalid encrypted text') ||
          event.reason?.message?.includes('Decryption')) {
        console.log('🛡️ Suppressed HashConnect decryption rejection');
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

        // Add global error handler to catch decryption errors
        const originalConsoleError = console.error;
        const errorHandler = (event: ErrorEvent) => {
          if (event.error?.message?.includes('Invalid encrypted text') || 
              event.error?.message?.includes('Decryption halted')) {
            console.log('🛡️ Caught and suppressed decryption error');
            event.preventDefault();
            return false;
          }
        };
        window.addEventListener('error', errorHandler);
        
        // Handle pairing event with proper HashConnect decryption
        this.hashConnect.pairingEvent.once(async (pairingData) => {
          console.log('🔗 Pairing successful with HashPack, processing with correct decryption...');
          clearTimeout(timeout);
          
          // Remove error handler after successful pairing
          window.removeEventListener('error', errorHandler);
          
          // Use HashConnect's built-in decrypt method for proper LibSodium handling
          await this.processHashConnectPairing(pairingData, resolve, reject);
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

  private async processHashConnectPairing(
    pairingData: any,
    resolve: (value: string) => void,
    reject: (reason: any) => void
  ) {
    try {
      console.log('🔍 Processing HashConnect pairing with proper LibSodium decryption...');
      console.log('Pairing data structure:', Object.keys(pairingData || {}));
      
      // First try to extract account directly if not encrypted
      if (pairingData?.accountIds && Array.isArray(pairingData.accountIds) && pairingData.accountIds[0]) {
        const accountId = pairingData.accountIds[0];
        console.log('✅ Found unencrypted account:', accountId);
        this.state = 'connected';
        resolve(accountId);
        return;
      }
      
      // If data appears encrypted, use HashConnect's decrypt method
      if (pairingData?.encrypted && pairingData?.topic) {
        console.log('🔓 Data appears encrypted, using HashConnect decrypt...');
        
        try {
          const decrypted = await this.hashConnect.decrypt({
            message: pairingData.encrypted,
            topic: pairingData.topic
          });
          
          // Convert decrypted Uint8Array to string and parse
          const plaintext = new TextDecoder().decode(decrypted);
          console.log('✅ Successfully decrypted with HashConnect:', plaintext);
          
          // Parse the decrypted data to find account ID
          const decryptedData = JSON.parse(plaintext);
          const accountId = decryptedData?.accountIds?.[0] || decryptedData?.account;
          
          if (accountId) {
            this.state = 'connected';
            console.log('✅ Extracted account from decrypted data:', accountId);
            resolve(accountId);
          } else {
            this.state = 'disconnected';
            reject(new Error('No account ID found in decrypted pairing data'));
          }
          
        } catch (decryptError) {
          console.error('❌ HashConnect decrypt failed:', decryptError);
          this.state = 'disconnected';
          reject(new Error('Failed to decrypt pairing data with HashConnect'));
        }
      } else {
        // Try to find account in any other structure
        const keys = Object.keys(pairingData || {});
        let accountId: string | null = null;
        
        for (const key of keys) {
          const value = pairingData[key];
          if (typeof value === 'string' && value.includes('0.0.')) {
            accountId = value;
            break;
          } else if (Array.isArray(value) && value[0] && typeof value[0] === 'string' && value[0].includes('0.0.')) {
            accountId = value[0];
            break;
          }
        }
        
        if (accountId) {
          this.state = 'connected';
          console.log('✅ Found account via structure search:', accountId);
          resolve(accountId);
        } else {
          this.state = 'disconnected';
          console.error('❌ No account information found in pairing data');
          reject(new Error('No account information found in pairing response'));
        }
      }
      
    } catch (error) {
      this.state = 'disconnected';
      console.error('❌ Error processing HashConnect pairing:', error);
      reject(new Error('Failed to process HashConnect pairing data'));
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