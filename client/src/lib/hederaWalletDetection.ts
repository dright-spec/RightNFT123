// Hedera-specific wallet detection for HashPack dApp connections
// This handles the actual HashPack wallet connection protocol

import { walletDiagnostics } from './walletDiagnostics';

export interface HederaWalletProvider {
  name: string;
  type: 'hashpack' | 'blade' | 'generic';
  connectionMethod: 'extension' | 'dapp' | 'mobile';
  provider?: any;
  available: boolean;
}

export interface HederaWalletScan {
  providers: HederaWalletProvider[];
  hasHashPack: boolean;
  hasBlade: boolean;
  canConnectDirectly: boolean;
  needsDAppConnection: boolean;
}

class HederaWalletDetector {
  
  scanForHederaWallets(): HederaWalletScan {
    console.log('=== Hedera Wallet Detection Started ===');
    
    // Run comprehensive diagnostics first
    const diagnostics = walletDiagnostics.performFullDiagnostics();
    
    const providers: HederaWalletProvider[] = [];
    
    // 1. Check for HashPack extension
    this.detectHashPackExtension(providers);
    
    // 2. Check for Blade wallet
    this.detectBladeWallet(providers);
    
    // 3. Use diagnostics to find any missed wallets
    this.analyzeDiscoveredWallets(providers, diagnostics);
    
    // 4. Check for HashPack dApp connection capability
    this.detectHashPackDAppCapability(providers);
    
    const result: HederaWalletScan = {
      providers,
      hasHashPack: providers.some(p => p.type === 'hashpack'),
      hasBlade: providers.some(p => p.type === 'blade'),
      canConnectDirectly: providers.some(p => p.available && p.connectionMethod === 'extension'),
      needsDAppConnection: !providers.some(p => p.available && p.connectionMethod === 'extension')
    };
    
    console.log('Hedera wallet scan result:', result);
    return result;
  }
  
  private detectHashPackExtension(providers: HederaWalletProvider[]) {
    console.log('Checking for HashPack extension...');
    
    // First check if HashPack is actually injected by the extension
    if ((window as any).hashconnect || (window as any).HashConnect) {
      console.log('✓ HashConnect API detected - HashPack extension is installed');
      providers.push({
        name: 'HashPack Extension',
        type: 'hashpack',
        connectionMethod: 'extension',
        provider: (window as any).hashconnect || (window as any).HashConnect,
        available: true
      });
      return;
    }

    // Check for HashPack in the document/DOM (extension injection)
    const extensionScripts = document.querySelectorAll('script[src*="hashpack"], script[src*="HashPack"]');
    if (extensionScripts.length > 0) {
      console.log('✓ HashPack extension scripts detected in DOM');
      providers.push({
        name: 'HashPack Extension (DOM)',
        type: 'hashpack',
        connectionMethod: 'extension',
        provider: null, // Will be resolved via HashConnect
        available: true
      });
      return;
    }

    // Comprehensive window object scan for HashPack
    const hashpackChecks = [
      { key: 'hashpack', name: 'HashPack Direct' },
      { key: 'HashPack', name: 'HashPack Capitalized' },
      { key: 'HASHPACK', name: 'HashPack All Caps' },
      { key: 'hedera', name: 'Hedera Object' },
      { key: 'Hedera', name: 'Hedera Capitalized' }
    ];
    
    // Check for direct HashPack objects
    for (const check of hashpackChecks) {
      if ((window as any)[check.key]) {
        console.log(`✓ ${check.name} detected via window.${check.key}`);
        providers.push({
          name: `${check.name} Extension`,
          type: 'hashpack',
          connectionMethod: 'extension',
          provider: (window as any)[check.key],
          available: true
        });
        return;
      }
    }
    
    // Check ethereum provider for HashPack
    const ethereum = (window as any).ethereum;
    if (ethereum) {
      console.log('Checking ethereum provider for HashPack indicators...');
      
      // Direct HashPack flag
      if (ethereum.isHashPack) {
        console.log('✓ HashPack detected via ethereum.isHashPack');
        providers.push({
          name: 'HashPack (Ethereum Provider)',
          type: 'hashpack',
          connectionMethod: 'extension',
          provider: ethereum,
          available: true
        });
        return;
      }
      
      // Check provider info
      if (ethereum.isHashpack || ethereum._state?.isHashPack) {
        console.log('✓ HashPack detected via ethereum provider state');
        providers.push({
          name: 'HashPack (Provider State)',
          type: 'hashpack',
          connectionMethod: 'extension',
          provider: ethereum,
          available: true
        });
        return;
      }
      
      // Check for HashPack in providers array
      if (ethereum.providers && Array.isArray(ethereum.providers)) {
        const hashPackProvider = ethereum.providers.find((p: any) => 
          p.isHashPack || p.isHashpack || p._state?.isHashPack ||
          (p.constructor && p.constructor.name?.toLowerCase().includes('hashpack'))
        );
        if (hashPackProvider) {
          console.log('✓ HashPack found in ethereum providers array');
          providers.push({
            name: 'HashPack (Multi-provider)',
            type: 'hashpack',
            connectionMethod: 'extension',
            provider: hashPackProvider,
            available: true
          });
          return;
        }
      }
      
      // Check if ethereum provider has HashPack methods
      const hashpackMethods = ['requestAccounts', 'request', 'hashConnect'];
      const hasHashPackMethods = hashpackMethods.some(method => 
        typeof ethereum[method] === 'function'
      );
      
      if (hasHashPackMethods && (ethereum.chainId === '0x127' || ethereum.networkVersion === '295')) {
        console.log('✓ HashPack detected via Hedera network and methods');
        providers.push({
          name: 'HashPack (Hedera Network)',
          type: 'hashpack',
          connectionMethod: 'extension',
          provider: ethereum,
          available: true
        });
        return;
      }
    }
    
    // Deep scan for any HashPack-related objects
    console.log('Performing deep window scan for HashPack...');
    const windowKeys = Object.getOwnPropertyNames(window);
    const hashpackKeys = windowKeys.filter(key => 
      key.toLowerCase().includes('hashpack') ||
      key.toLowerCase().includes('hashconnect') ||
      key.toLowerCase().includes('hedera')
    );
    
    if (hashpackKeys.length > 0) {
      console.log('Found potential HashPack objects:', hashpackKeys);
      for (const key of hashpackKeys) {
        const obj = (window as any)[key];
        if (obj && typeof obj === 'object') {
          console.log(`✓ HashPack detected via window.${key}`);
          providers.push({
            name: `HashPack (${key})`,
            type: 'hashpack',
            connectionMethod: 'extension',
            provider: obj,
            available: true
          });
          return;
        }
      }
    }
    
    console.log('No HashPack extension detected after comprehensive scan');
  }
  
  private detectBladeWallet(providers: HederaWalletProvider[]) {
    console.log('Checking for Blade wallet...');
    
    // Comprehensive Blade wallet checks
    const bladeChecks = [
      { key: 'bladeSDK', name: 'Blade SDK' },
      { key: 'blade', name: 'Blade Wallet' },
      { key: 'BladeSDK', name: 'Blade SDK (caps)' },
      { key: 'Blade', name: 'Blade Capitalized' },
      { key: 'BLADE', name: 'Blade All Caps' },
      { key: 'bladewallet', name: 'Blade Wallet Lower' },
      { key: 'BladeWallet', name: 'Blade Wallet Camel' }
    ];
    
    // Check for direct Blade objects
    for (const check of bladeChecks) {
      if ((window as any)[check.key]) {
        console.log(`✓ ${check.name} detected via window.${check.key}`);
        providers.push({
          name: check.name,
          type: 'blade',
          connectionMethod: 'extension',
          provider: (window as any)[check.key],
          available: true
        });
        return;
      }
    }
    
    // Check ethereum provider for Blade
    const ethereum = (window as any).ethereum;
    if (ethereum) {
      console.log('Checking ethereum provider for Blade indicators...');
      
      // Direct Blade flags
      if (ethereum.isBlade || ethereum.isBladeWallet) {
        console.log('✓ Blade detected via ethereum provider flags');
        providers.push({
          name: 'Blade (Ethereum Provider)',
          type: 'blade',
          connectionMethod: 'extension',
          provider: ethereum,
          available: true
        });
        return;
      }
      
      // Check provider state
      if (ethereum._state?.isBlade || ethereum.providerInfo?.name?.toLowerCase().includes('blade')) {
        console.log('✓ Blade detected via ethereum provider state');
        providers.push({
          name: 'Blade (Provider State)',
          type: 'blade',
          connectionMethod: 'extension',
          provider: ethereum,
          available: true
        });
        return;
      }
      
      // Check for Blade in providers array
      if (ethereum.providers && Array.isArray(ethereum.providers)) {
        const bladeProvider = ethereum.providers.find((p: any) => 
          p.isBlade || p.isBladeWallet || p._state?.isBlade ||
          (p.constructor && p.constructor.name?.toLowerCase().includes('blade')) ||
          (p.providerInfo && p.providerInfo.name?.toLowerCase().includes('blade'))
        );
        if (bladeProvider) {
          console.log('✓ Blade found in ethereum providers array');
          providers.push({
            name: 'Blade (Multi-provider)',
            type: 'blade',
            connectionMethod: 'extension',
            provider: bladeProvider,
            available: true
          });
          return;
        }
      }
    }
    
    // Deep scan for Blade-related objects
    console.log('Performing deep window scan for Blade...');
    const windowKeys = Object.getOwnPropertyNames(window);
    const bladeKeys = windowKeys.filter(key => 
      key.toLowerCase().includes('blade')
    );
    
    if (bladeKeys.length > 0) {
      console.log('Found potential Blade objects:', bladeKeys);
      for (const key of bladeKeys) {
        const obj = (window as any)[key];
        if (obj && typeof obj === 'object' && !key.includes('blade-player')) {
          console.log(`✓ Blade detected via window.${key}`);
          providers.push({
            name: `Blade (${key})`,
            type: 'blade',
            connectionMethod: 'extension',
            provider: obj,
            available: true
          });
          return;
        }
      }
    }
    
    console.log('No Blade wallet detected after comprehensive scan');
  }
  
  private analyzeDiscoveredWallets(providers: HederaWalletProvider[], diagnostics: any) {
    console.log('Analyzing discovered wallets from diagnostics...');
    
    // Check if diagnostics found any potential wallets we missed
    if (diagnostics.potentialWallets && diagnostics.potentialWallets.length > 0) {
      for (const wallet of diagnostics.potentialWallets) {
        // Only add if we haven't already detected this type
        const existingProvider = providers.find(p => p.type === wallet.type && p.connectionMethod === 'extension');
        
        if (!existingProvider && wallet.hasRequiredMethods) {
          console.log(`Adding wallet from diagnostics: ${wallet.key} (${wallet.type})`);
          
          // Map wallet types to supported types, treating MetaMask as generic Hedera-compatible
          let walletType: 'hashpack' | 'blade' | 'generic' = 'generic';
          if (wallet.type === 'hashpack') walletType = 'hashpack';
          else if (wallet.type === 'blade') walletType = 'blade';
          else if (wallet.type === 'metamask') walletType = 'generic'; // MetaMask can work with Hedera
          
          providers.push({
            name: wallet.type === 'metamask' ? 'MetaMask (Hedera Compatible)' : `${wallet.key} (Discovered)`,
            type: walletType,
            connectionMethod: 'extension',
            provider: (window as any)[wallet.key],
            available: true
          });
        }
      }
    }
    
    // Check ethereum provider details from diagnostics
    if (diagnostics.ethereumProvider?.exists) {
      const eth = diagnostics.ethereumProvider;
      
      // Check for any Hedera-related flags we might have missed
      const hederaFlags = ['isHashPack', 'isHashpack', 'isBlade', 'isBladeWallet'];
      const hasHederaFlag = hederaFlags.some(flag => eth[flag]);
      
      if (hasHederaFlag && !providers.some(p => p.connectionMethod === 'extension')) {
        const walletType = (eth.isHashPack || eth.isHashpack) ? 'hashpack' : 
                          (eth.isBlade || eth.isBladeWallet) ? 'blade' : 'generic';
        
        console.log(`Adding ethereum provider with Hedera flags: ${walletType}`);
        providers.push({
          name: `Ethereum Provider (${walletType})`,
          type: walletType as 'hashpack' | 'blade' | 'generic',
          connectionMethod: 'extension',
          provider: (window as any).ethereum,
          available: true
        });
      }
    }
  }

  private detectHashPackDAppCapability(providers: HederaWalletProvider[]) {
    // Always add dApp connection as an option since HashPack supports it
    console.log('Adding HashPack dApp connection capability');
    providers.push({
      name: 'HashPack dApp Connection',
      type: 'hashpack',
      connectionMethod: 'dapp',
      available: true
    });
  }
  
  // Test if we can actually connect to HashPack
  async testHashPackConnection(): Promise<boolean> {
    console.log('Testing HashPack connection...');
    
    try {
      // Try direct connection first
      if ((window as any).hashpack) {
        console.log('Testing direct HashPack connection');
        return true;
      }
      
      // Try HashConnect
      if ((window as any).hashconnect) {
        console.log('Testing HashConnect connection');
        return true;
      }
      
      // Try ethereum provider
      const ethereum = (window as any).ethereum;
      if (ethereum?.isHashPack) {
        console.log('Testing HashPack via ethereum provider');
        return true;
      }
      
      console.log('No direct HashPack connection available - will need dApp connection');
      return false;
    } catch (error) {
      console.log('HashPack connection test failed:', error);
      return false;
    }
  }
  
  // Get connection instructions based on available methods
  getConnectionInstructions(scan: HederaWalletScan): string[] {
    const instructions: string[] = [];
    
    if (scan.canConnectDirectly) {
      if (scan.hasHashPack) {
        instructions.push('HashPack extension detected - click Connect to proceed');
      }
      if (scan.hasBlade) {
        instructions.push('Blade wallet detected - click Connect to proceed');
      }
    } else {
      instructions.push('No Hedera wallet extensions detected');
      instructions.push('To connect with HashPack:');
      instructions.push('1. Open your HashPack mobile app or install the browser extension');
      instructions.push('2. Go to "Connect to dApp" in HashPack');
      instructions.push('3. Enter this website URL or scan the QR code');
      instructions.push('4. Approve the connection in HashPack');
      instructions.push('5. Return here and click Connect Wallet');
    }
    
    return instructions;
  }
  
  // Create a HashPack dApp connection URL
  createDAppConnectionUrl(): string {
    const currentUrl = window.location.origin;
    const appName = 'Dright Marketplace';
    
    // HashPack dApp connection protocol
    const dappUrl = `hashpack://dapp/connect?url=${encodeURIComponent(currentUrl)}&name=${encodeURIComponent(appName)}`;
    
    console.log('Generated HashPack dApp URL:', dappUrl);
    return dappUrl;
  }
  
  // Listen for HashPack connection events
  listenForConnection(callback: () => void): () => void {
    console.log('Setting up HashPack connection listeners...');
    
    const checkForConnection = () => {
      const scan = this.scanForHederaWallets();
      if (scan.canConnectDirectly) {
        console.log('HashPack connection detected!');
        callback();
      }
    };
    
    // Listen for various events that might indicate wallet injection
    const events = ['hashpack:ready', 'hashpack:connected', 'wallet:ready'];
    const listeners: Array<() => void> = [];
    
    events.forEach(event => {
      const listener = () => checkForConnection();
      window.addEventListener(event, listener);
      listeners.push(() => window.removeEventListener(event, listener));
    });
    
    // Poll for changes
    const interval = setInterval(checkForConnection, 1000);
    
    // Return cleanup function
    return () => {
      listeners.forEach(cleanup => cleanup());
      clearInterval(interval);
    };
  }
}

export const hederaWalletDetector = new HederaWalletDetector();