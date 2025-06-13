// Comprehensive wallet diagnostics to identify all available wallet objects
// This helps debug why installed wallets are not being detected

export interface WalletDiagnostics {
  windowObjects: string[];
  ethereumProvider: any;
  ethereumProviders: any[];
  walletRelatedKeys: string[];
  potentialWallets: Array<{
    key: string;
    type: string;
    hasRequiredMethods: boolean;
    details: any;
  }>;
  browserInfo: {
    userAgent: string;
    vendor: string;
    extensions: boolean;
  };
}

class WalletDiagnosticsService {
  
  performFullDiagnostics(): WalletDiagnostics {
    console.log('=== WALLET DIAGNOSTICS STARTED ===');
    
    const diagnostics: WalletDiagnostics = {
      windowObjects: [],
      ethereumProvider: null,
      ethereumProviders: [],
      walletRelatedKeys: [],
      potentialWallets: [],
      browserInfo: {
        userAgent: navigator.userAgent,
        vendor: navigator.vendor,
        extensions: this.detectExtensionsCapability()
      }
    };
    
    // 1. Get all window object keys
    diagnostics.windowObjects = this.getAllWindowKeys();
    
    // 2. Analyze ethereum provider
    this.analyzeEthereumProvider(diagnostics);
    
    // 3. Find wallet-related keys
    diagnostics.walletRelatedKeys = this.findWalletRelatedKeys(diagnostics.windowObjects);
    
    // 4. Identify potential wallets
    diagnostics.potentialWallets = this.identifyPotentialWallets(diagnostics.walletRelatedKeys);
    
    // 5. Log comprehensive results
    this.logDiagnostics(diagnostics);
    
    return diagnostics;
  }
  
  private getAllWindowKeys(): string[] {
    try {
      const keys = Object.getOwnPropertyNames(window);
      console.log(`Found ${keys.length} window properties`);
      return keys;
    } catch (error) {
      console.log('Error getting window keys:', error);
      return [];
    }
  }
  
  private analyzeEthereumProvider(diagnostics: WalletDiagnostics) {
    const ethereum = (window as any).ethereum;
    
    if (ethereum) {
      console.log('=== ETHEREUM PROVIDER ANALYSIS ===');
      
      diagnostics.ethereumProvider = {
        exists: true,
        isMetaMask: ethereum.isMetaMask,
        isBrave: ethereum.isBrave,
        isHashPack: ethereum.isHashPack,
        isHashpack: ethereum.isHashpack,
        isBlade: ethereum.isBlade,
        isBladeWallet: ethereum.isBladeWallet,
        chainId: ethereum.chainId,
        networkVersion: ethereum.networkVersion,
        selectedAddress: ethereum.selectedAddress,
        isConnected: typeof ethereum.isConnected === 'function' ? ethereum.isConnected() : 'unknown',
        providerInfo: ethereum.providerInfo,
        _state: ethereum._state,
        constructor: ethereum.constructor?.name,
        availableMethods: this.getAvailableMethods(ethereum)
      };
      
      // Check for providers array
      if (ethereum.providers && Array.isArray(ethereum.providers)) {
        console.log(`Found ${ethereum.providers.length} providers in ethereum.providers`);
        diagnostics.ethereumProviders = ethereum.providers.map((provider: any, index: number) => ({
          index,
          isMetaMask: provider.isMetaMask,
          isBrave: provider.isBrave,
          isHashPack: provider.isHashPack,
          isHashpack: provider.isHashpack,
          isBlade: provider.isBlade,
          isBladeWallet: provider.isBladeWallet,
          constructor: provider.constructor?.name,
          providerInfo: provider.providerInfo,
          _state: provider._state,
          availableMethods: this.getAvailableMethods(provider)
        }));
      }
      
      console.log('Ethereum provider details:', diagnostics.ethereumProvider);
    } else {
      console.log('No ethereum provider found');
      diagnostics.ethereumProvider = { exists: false };
    }
  }
  
  private findWalletRelatedKeys(windowKeys: string[]): string[] {
    const walletKeywords = [
      'wallet', 'ethereum', 'web3', 'metamask', 'brave',
      'hashpack', 'hashconnect', 'hedera', 'blade',
      'connect', 'provider', 'injected'
    ];
    
    const walletKeys = windowKeys.filter(key => 
      walletKeywords.some(keyword => 
        key.toLowerCase().includes(keyword.toLowerCase())
      )
    );
    
    console.log('Wallet-related window keys:', walletKeys);
    return walletKeys;
  }
  
  private identifyPotentialWallets(walletKeys: string[]): Array<{
    key: string;
    type: string;
    hasRequiredMethods: boolean;
    details: any;
  }> {
    const potentialWallets = [];
    
    for (const key of walletKeys) {
      try {
        const obj = (window as any)[key];
        if (obj && typeof obj === 'object') {
          const walletInfo = {
            key,
            type: this.identifyWalletType(key, obj),
            hasRequiredMethods: this.checkRequiredMethods(obj),
            details: {
              constructor: obj.constructor?.name,
              isFunction: typeof obj === 'function',
              isObject: typeof obj === 'object',
              hasRequest: typeof obj.request === 'function',
              hasRequestAccounts: typeof obj.requestAccounts === 'function',
              hasEnable: typeof obj.enable === 'function',
              hasConnect: typeof obj.connect === 'function',
              availableMethods: this.getAvailableMethods(obj),
              flags: this.getWalletFlags(obj)
            }
          };
          
          potentialWallets.push(walletInfo);
          console.log(`Potential wallet found: ${key}`, walletInfo);
        }
      } catch (error) {
        console.log(`Error analyzing ${key}:`, error);
      }
    }
    
    return potentialWallets;
  }
  
  private identifyWalletType(key: string, obj: any): string {
    const keyLower = key.toLowerCase();
    
    if (keyLower.includes('hashpack') || keyLower.includes('hashconnect')) {
      return 'hashpack';
    }
    if (keyLower.includes('blade')) {
      return 'blade';
    }
    if (keyLower.includes('metamask')) {
      return 'metamask';
    }
    if (keyLower.includes('brave')) {
      return 'brave';
    }
    if (keyLower.includes('hedera')) {
      return 'hedera';
    }
    if (obj.isHashPack || obj.isHashpack) {
      return 'hashpack';
    }
    if (obj.isBlade || obj.isBladeWallet) {
      return 'blade';
    }
    if (obj.isMetaMask) {
      return 'metamask';
    }
    if (obj.isBrave) {
      return 'brave';
    }
    
    return 'unknown';
  }
  
  private checkRequiredMethods(obj: any): boolean {
    const requiredMethods = ['request', 'requestAccounts'];
    return requiredMethods.some(method => typeof obj[method] === 'function');
  }
  
  private getAvailableMethods(obj: any): string[] {
    if (!obj || typeof obj !== 'object') return [];
    
    const methods = [];
    for (const prop in obj) {
      try {
        if (typeof obj[prop] === 'function') {
          methods.push(prop);
        }
      } catch (error) {
        // Skip properties that can't be accessed
      }
    }
    return methods;
  }
  
  private getWalletFlags(obj: any): Record<string, any> {
    const flags: Record<string, any> = {};
    const flagKeys = [
      'isMetaMask', 'isBrave', 'isHashPack', 'isHashpack', 
      'isBlade', 'isBladeWallet', 'isHedera', 'isConnected'
    ];
    
    for (const flag of flagKeys) {
      if (obj[flag] !== undefined) {
        flags[flag] = obj[flag];
      }
    }
    
    return flags;
  }
  
  private detectExtensionsCapability(): boolean {
    // Check if the browser supports extensions
    return !!(window.chrome || window.browser || (window as any).moz);
  }
  
  private logDiagnostics(diagnostics: WalletDiagnostics) {
    console.log('=== COMPLETE WALLET DIAGNOSTICS ===');
    console.log('Browser Info:', diagnostics.browserInfo);
    console.log('Total Window Objects:', diagnostics.windowObjects.length);
    console.log('Wallet-Related Keys:', diagnostics.walletRelatedKeys);
    console.log('Potential Wallets Found:', diagnostics.potentialWallets.length);
    console.log('Ethereum Provider:', diagnostics.ethereumProvider);
    console.log('Ethereum Providers Array:', diagnostics.ethereumProviders);
    
    // Summary
    const summary = {
      hasEthereumProvider: !!diagnostics.ethereumProvider?.exists,
      hasMultipleProviders: diagnostics.ethereumProviders.length > 0,
      potentialWalletsCount: diagnostics.potentialWallets.length,
      walletTypes: [...new Set(diagnostics.potentialWallets.map(w => w.type))],
      hasExtensionSupport: diagnostics.browserInfo.extensions
    };
    
    console.log('DIAGNOSTICS SUMMARY:', summary);
    console.log('=== END WALLET DIAGNOSTICS ===');
  }
}

export const walletDiagnostics = new WalletDiagnosticsService();