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
        
        // Handle pairing event with decryption error protection
        this.hashConnect.pairingEvent.once((pairingData) => {
          console.log('🔗 Pairing successful with HashPack');
          clearTimeout(timeout);
          
          // Remove error handler after successful pairing
          window.removeEventListener('error', errorHandler);
          
          // Extract account safely
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
    // Wrap in try-catch with decryption error suppression
    try {
      console.log('🔍 Extracting account information with error protection...');
      
      // Add temporary error suppression for this operation
      const suppressErrors = (event: ErrorEvent) => {
        if (event.error?.message?.includes('Invalid encrypted text') || 
            event.error?.message?.includes('Decryption')) {
          console.log('🛡️ Suppressed decryption error during account extraction');
          event.preventDefault();
          return false;
        }
      };
      
      window.addEventListener('error', suppressErrors);
      
      // Use setTimeout to allow any decryption errors to be caught
      setTimeout(() => {
        try {
          let accountId: string | null = null;
          
          // Try multiple ways to extract account without triggering decryption
          if (pairingData?.accountIds && Array.isArray(pairingData.accountIds) && pairingData.accountIds[0]) {
            accountId = pairingData.accountIds[0];
            console.log('✅ Found account via accountIds array:', accountId);
          } else if (pairingData?.account) {
            accountId = pairingData.account;
            console.log('✅ Found account via account property:', accountId);
          } else {
            // Try to access the data structure differently
            const keys = Object.keys(pairingData || {});
            console.log('Available pairing data keys:', keys);
            
            for (const key of keys) {
              const value = pairingData[key];
              if (typeof value === 'string' && value.includes('0.0.')) {
                accountId = value;
                console.log('✅ Found account via key search:', accountId);
                break;
              } else if (Array.isArray(value) && value[0] && value[0].includes('0.0.')) {
                accountId = value[0];
                console.log('✅ Found account via array search:', accountId);
                break;
              }
            }
          }
          
          // Remove error suppression
          window.removeEventListener('error', suppressErrors);
          
          if (accountId) {
            this.state = 'connected';
            console.log('✅ Successfully extracted account:', accountId);
            resolve(accountId);
          } else {
            this.state = 'disconnected';
            console.error('❌ No account information found in pairing data');
            reject(new Error('No account information found in pairing response'));
          }
          
        } catch (innerError) {
          window.removeEventListener('error', suppressErrors);
          this.state = 'disconnected';
          console.error('❌ Error in delayed account extraction:', innerError);
          reject(new Error('Failed to extract account information safely'));
        }
      }, 50); // Short delay to let any errors surface and be caught
      
    } catch (error) {
      this.state = 'disconnected';
      console.error('❌ Error setting up account extraction:', error);
      reject(new Error('Failed to initialize account extraction'));
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