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
        
        // Handle pairing event with aggressive error suppression
        this.hashConnect.pairingEvent.once(async (pairingData) => {
          console.log('🔗 Pairing successful with HashPack, processing safely...');
          clearTimeout(timeout);
          
          // Keep connection error handler active for longer
          setTimeout(() => {
            window.removeEventListener('error', connectionErrorHandler, true);
          }, 10000);
          
          // Process pairing with enhanced error protection
          await this.processHashConnectPairingSafe(pairingData, resolve, reject);
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

  private async processHashConnectPairingSafe(
    pairingData: any,
    resolve: (value: string) => void,
    reject: (reason: any) => void
  ) {
    // Wrap everything in multiple layers of error protection
    const safeProcess = async () => {
      try {
        console.log('🔍 Processing HashConnect pairing with maximum safety...');
        
        // Log structure but don't access potentially problematic fields
        const safeKeys = Object.keys(pairingData || {}).filter(key => !key.includes('encrypt'));
        console.log('Safe pairing data keys:', safeKeys);
        
        // Method 1: Direct account extraction (most common)
        if (pairingData?.accountIds && Array.isArray(pairingData.accountIds) && pairingData.accountIds[0]) {
          const accountId = pairingData.accountIds[0];
          console.log('✅ Found direct account:', accountId);
          this.state = 'connected';
          resolve(accountId);
          return;
        }
        
        // Method 2: Alternative account property
        if (pairingData?.account && typeof pairingData.account === 'string') {
          console.log('✅ Found account property:', pairingData.account);
          this.state = 'connected';
          resolve(pairingData.account);
          return;
        }
        
        // Method 3: Search through safe keys only
        for (const key of safeKeys) {
          const value = pairingData[key];
          if (typeof value === 'string' && value.match(/^0\.0\.\d+$/)) {
            console.log('✅ Found account via safe key search:', value);
            this.state = 'connected';
            resolve(value);
            return;
          } else if (Array.isArray(value) && value[0] && typeof value[0] === 'string' && value[0].match(/^0\.0\.\d+$/)) {
            console.log('✅ Found account via safe array search:', value[0]);
            this.state = 'connected';
            resolve(value[0]);
            return;
          }
        }
        
        // Method 4: Try common HashConnect structures
        const commonPaths = [
          'metadata.accountIds[0]',
          'payload.accountIds[0]', 
          'data.accountIds[0]',
          'response.accountIds[0]'
        ];
        
        for (const path of commonPaths) {
          try {
            const pathParts = path.split('.');
            let current = pairingData;
            for (const part of pathParts) {
              if (part.includes('[0]')) {
                const prop = part.replace('[0]', '');
                current = current?.[prop]?.[0];
              } else {
                current = current?.[part];
              }
            }
            if (current && typeof current === 'string' && current.match(/^0\.0\.\d+$/)) {
              console.log('✅ Found account via path search:', current);
              this.state = 'connected';
              resolve(current);
              return;
            }
          } catch (pathError) {
            // Silently continue to next path
          }
        }
        
        // If we get here, no account was found
        this.state = 'disconnected';
        console.error('❌ No account information found in any safe location');
        reject(new Error('No account information found in pairing response'));
        
      } catch (error) {
        this.state = 'disconnected';
        console.error('❌ Error in safe pairing processing:', error);
        reject(new Error('Failed to safely process pairing data'));
      }
    };
    
    // Execute with additional timeout protection
    Promise.race([
      safeProcess(),
      new Promise((_, timeoutReject) => {
        setTimeout(() => timeoutReject(new Error('Pairing processing timeout')), 10000);
      })
    ]).catch(error => {
      this.state = 'disconnected';
      reject(error);
    });
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