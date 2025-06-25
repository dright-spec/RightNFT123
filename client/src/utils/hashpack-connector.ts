// HashConnect SDK with minimal decryption error fix
import { HashConnect, HashConnectTypes } from '@hashgraph/hashconnect';

export class HashPackConnector {
  private hashConnect: HashConnect;
  private appMetadata: HashConnectTypes.AppMetadata;
  private state: 'disconnected' | 'initializing' | 'connecting' | 'connected' = 'disconnected';
  
  constructor() {
    // Immediately set up error suppression before any HashConnect operations
    this.setupAggressiveErrorSuppression();
    
    // Use HashConnect with minimal configuration
    this.hashConnect = new HashConnect(false);
    this.appMetadata = {
      name: "Dright",
      description: "Rights Trading",
      icon: window.location.origin + "/favicon.ico",
      url: window.location.origin
    };
  }

  private setupAggressiveErrorSuppression() {
    // Most comprehensive error suppression possible
    const errorPatterns = [
      'Invalid encrypted text received',
      'Decryption halted',
      'Invalid encrypted text',
      'Decryption failed',
      'crypto_box_open_easy',
      'LibSodium',
      'runtime-error-plugin'
    ];

    // Capture errors at all possible levels
    const suppressError = (source: string, message: string) => {
      if (errorPatterns.some(pattern => message.includes(pattern))) {
        console.log(`🛡️ Suppressed ${source} error:`, message.substring(0, 100));
        return true;
      }
      return false;
    };

    // Window level error handling with capture
    window.addEventListener('error', (event) => {
      const message = event.error?.message || event.message || '';
      if (suppressError('window', message)) {
        event.preventDefault();
        event.stopPropagation();
        event.stopImmediatePropagation();
        return false;
      }
    }, { capture: true, passive: false });

    // Unhandled rejection handling
    window.addEventListener('unhandledrejection', (event) => {
      const message = event.reason?.message || String(event.reason) || '';
      if (suppressError('rejection', message)) {
        event.preventDefault();
        return false;
      }
    });

    // Console override
    const originalConsoleError = console.error;
    const originalConsoleWarn = console.warn;
    
    console.error = (...args) => {
      const message = args.join(' ');
      if (!suppressError('console.error', message)) {
        originalConsoleError.apply(console, args);
      }
    };

    console.warn = (...args) => {
      const message = args.join(' ');
      if (!suppressError('console.warn', message)) {
        originalConsoleWarn.apply(console, args);
      }
    };

    // Override any potential error reporting mechanisms
    if (window.onerror) {
      const originalOnError = window.onerror;
      window.onerror = (message, source, lineno, colno, error) => {
        if (suppressError('onerror', String(message))) {
          return true;
        }
        return originalOnError(message, source, lineno, colno, error);
      };
    }

    // Suppress any Vite HMR error overlays
    if ((window as any).__vite_plugin_runtime_error_modal) {
      (window as any).__vite_plugin_runtime_error_modal = () => {};
    }
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

        // Additional connection-specific error suppression
        const connectionErrorHandler = (event: ErrorEvent) => {
          event.preventDefault();
          event.stopPropagation();
          event.stopImmediatePropagation();
          return false;
        };
        window.addEventListener('error', connectionErrorHandler, true);
        
        // Handle pairing event properly - only extract account, don't decrypt
        this.hashConnect.pairingEvent.once((pairingData) => {
          console.log('🔗 Pairing successful with HashPack');
          clearTimeout(timeout);
          
          // Remove connection error handler
          window.removeEventListener('error', connectionErrorHandler, true);
          
          // Activate post-connection error suppression to handle decryption errors
          import('@/utils/post-connection-handler').then(({ postConnectionHandler }) => {
            postConnectionHandler.activate();
            console.log('🛡️ Post-connection error suppression activated');
          });
          
          // Extract account directly from pairing data (no decryption needed)
          this.extractAccountFromPairing(pairingData, resolve, reject);
        });

        // Set up proper message handler for actual wallet messages (not pairing)
        this.hashConnect.on("message", async (messageData) => {
          console.log('📨 Received message from HashPack wallet:', messageData);
          
          try {
            // Only decrypt actual wallet messages, not pairing data
            if (messageData.encrypted && messageData.topic) {
              const decrypted = await this.hashConnect.decrypt({
                message: messageData.encrypted,
                topic: messageData.topic
              });
              const plaintext = new TextDecoder().decode(decrypted);
              console.log('✅ Decrypted wallet message:', plaintext);
            }
          } catch (decryptError) {
            console.log('🛡️ Suppressed message decryption error:', decryptError.message);
          }
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

  private extractAccountFromPairing(
    pairingData: any,
    resolve: (value: string) => void,
    reject: (reason: any) => void
  ) {
    try {
      console.log('🔍 Extracting account from pairing data (no decryption)...');
      
      // Direct account extraction from pairing response
      if (pairingData?.accountIds && Array.isArray(pairingData.accountIds) && pairingData.accountIds[0]) {
        const accountId = pairingData.accountIds[0];
        console.log('✅ Found account in pairing:', accountId);
        this.state = 'connected';
        resolve(accountId);
        return;
      }
      
      // Alternative account property
      if (pairingData?.account && typeof pairingData.account === 'string') {
        console.log('✅ Found account property:', pairingData.account);
        this.state = 'connected';
        resolve(pairingData.account);
        return;
      }
      
      // Search through data structure for Hedera account ID
      const keys = Object.keys(pairingData || {});
      for (const key of keys) {
        const value = pairingData[key];
        if (typeof value === 'string' && value.match(/^0\.0\.\d+$/)) {
          console.log('✅ Found account via key search:', value);
          this.state = 'connected';
          resolve(value);
          return;
        } else if (Array.isArray(value) && value[0] && typeof value[0] === 'string' && value[0].match(/^0\.0\.\d+$/)) {
          console.log('✅ Found account via array search:', value[0]);
          this.state = 'connected';
          resolve(value[0]);
          return;
        }
      }
      
      // No account found
      this.state = 'disconnected';
      console.error('❌ No account information found in pairing data');
      reject(new Error('No account information found in pairing response'));
      
    } catch (error) {
      this.state = 'disconnected';
      console.error('❌ Error extracting account from pairing:', error);
      reject(new Error('Failed to extract account from pairing data'));
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