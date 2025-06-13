// Direct wallet detection that actually works with HashPack and Brave
// This approach checks all the real injection points wallets use

export interface DetectedWallet {
  name: string;
  type: 'hedera' | 'ethereum' | 'generic';
  provider: any;
  available: boolean;
}

export interface WalletScanResult {
  wallets: DetectedWallet[];
  hasHedera: boolean;
  hasEthereum: boolean;
  canConnect: boolean;
}

class DirectWalletDetector {
  // Scan for all possible wallet injections
  scanForWallets(): WalletScanResult {
    console.log('=== Direct Wallet Scan Started ===');
    
    const wallets: DetectedWallet[] = [];
    
    // 1. Check for HashPack (multiple injection methods)
    this.checkHashPack(wallets);
    
    // 2. Check for Blade wallet
    this.checkBlade(wallets);
    
    // 3. Check for generic ethereum providers
    this.checkEthereumProviders(wallets);
    
    // 4. Deep scan window object for wallet-related properties
    this.deepScanWindow(wallets);
    
    const result: WalletScanResult = {
      wallets,
      hasHedera: wallets.some(w => w.type === 'hedera'),
      hasEthereum: wallets.some(w => w.type === 'ethereum'),
      canConnect: wallets.length > 0
    };
    
    console.log('=== Wallet Scan Complete ===');
    console.log('Scan Result:', result);
    
    return result;
  }
  
  private checkHashPack(wallets: DetectedWallet[]) {
    console.log('Checking for HashPack wallet...');
    
    // Method 1: Direct hashpack object
    if ((window as any).hashpack) {
      console.log('✓ HashPack found via window.hashpack');
      wallets.push({
        name: 'HashPack (Direct)',
        type: 'hedera',
        provider: (window as any).hashpack,
        available: true
      });
    }
    
    // Method 2: HashConnect
    if ((window as any).hashconnect) {
      console.log('✓ HashConnect found');
      wallets.push({
        name: 'HashConnect',
        type: 'hedera',
        provider: (window as any).hashconnect,
        available: true
      });
    }
    
    // Method 3: Check ethereum provider for HashPack flag
    const ethereum = (window as any).ethereum;
    if (ethereum?.isHashPack) {
      console.log('✓ HashPack found via ethereum.isHashPack');
      wallets.push({
        name: 'HashPack (Ethereum)',
        type: 'hedera',
        provider: ethereum,
        available: true
      });
    }
    
    // Method 4: Check for HashPack in ethereum providers array
    if (ethereum?.providers) {
      const hashPackProvider = ethereum.providers.find((p: any) => p.isHashPack);
      if (hashPackProvider) {
        console.log('✓ HashPack found in ethereum providers array');
        wallets.push({
          name: 'HashPack (Multi-provider)',
          type: 'hedera',
          provider: hashPackProvider,
          available: true
        });
      }
    }
  }
  
  private checkBlade(wallets: DetectedWallet[]) {
    console.log('Checking for Blade wallet...');
    
    // Check various Blade injection points
    const bladeChecks = [
      { key: 'bladeSDK', name: 'Blade SDK' },
      { key: 'blade', name: 'Blade Wallet' },
      { key: 'BladeSDK', name: 'Blade SDK (caps)' }
    ];
    
    for (const check of bladeChecks) {
      if ((window as any)[check.key]) {
        console.log(`✓ ${check.name} found via window.${check.key}`);
        wallets.push({
          name: check.name,
          type: 'hedera',
          provider: (window as any)[check.key],
          available: true
        });
      }
    }
    
    // Check ethereum provider for Blade flag
    const ethereum = (window as any).ethereum;
    if (ethereum?.isBlade) {
      console.log('✓ Blade found via ethereum.isBlade');
      wallets.push({
        name: 'Blade (Ethereum)',
        type: 'hedera',
        provider: ethereum,
        available: true
      });
    }
  }
  
  private checkEthereumProviders(wallets: DetectedWallet[]) {
    console.log('Checking for Ethereum providers...');
    
    const ethereum = (window as any).ethereum;
    if (!ethereum) {
      console.log('No ethereum object found');
      return;
    }
    
    console.log('Ethereum provider details:', {
      isMetaMask: ethereum.isMetaMask,
      isBraveWallet: ethereum.isBraveWallet,
      isHashPack: ethereum.isHashPack,
      isBlade: ethereum.isBlade,
      providersCount: ethereum.providers?.length || 0
    });
    
    // Check for Brave Wallet
    if (ethereum.isBraveWallet || this.isBraveBrowser()) {
      console.log('✓ Brave Wallet detected');
      wallets.push({
        name: 'Brave Wallet',
        type: 'ethereum',
        provider: ethereum,
        available: true
      });
    }
    
    // Check for MetaMask
    if (ethereum.isMetaMask && !ethereum.isBraveWallet) {
      console.log('✓ MetaMask detected');
      wallets.push({
        name: 'MetaMask',
        type: 'ethereum',
        provider: ethereum,
        available: true
      });
    }
    
    // Check for any generic ethereum provider
    if (ethereum && !wallets.some(w => w.provider === ethereum)) {
      console.log('✓ Generic Ethereum provider detected');
      wallets.push({
        name: 'Web3 Wallet',
        type: 'ethereum',
        provider: ethereum,
        available: true
      });
    }
  }
  
  private deepScanWindow(wallets: DetectedWallet[]) {
    console.log('Performing deep window scan...');
    
    // Get all window properties
    const windowKeys = Object.getOwnPropertyNames(window);
    
    // Look for wallet-related keys
    const walletKeys = windowKeys.filter(key => {
      const lowerKey = key.toLowerCase();
      return lowerKey.includes('wallet') || 
             lowerKey.includes('hash') || 
             lowerKey.includes('blade') || 
             lowerKey.includes('hedera') ||
             lowerKey.includes('metamask') ||
             lowerKey.includes('ethereum');
    });
    
    console.log('Found wallet-related window properties:', walletKeys);
    
    // Check each key for a valid provider object
    for (const key of walletKeys) {
      try {
        const obj = (window as any)[key];
        if (obj && typeof obj === 'object' && !wallets.some(w => w.provider === obj)) {
          console.log(`Found potential wallet at window.${key}:`, obj);
          
          // Try to determine if it's a wallet provider
          if (this.looksLikeWalletProvider(obj)) {
            wallets.push({
              name: `${key} Wallet`,
              type: 'generic',
              provider: obj,
              available: true
            });
          }
        }
      } catch (error) {
        // Ignore errors when accessing properties
      }
    }
  }
  
  private looksLikeWalletProvider(obj: any): boolean {
    // Check if object has wallet-like methods
    const walletMethods = ['request', 'send', 'sendAsync', 'enable', 'connect'];
    const hasWalletMethods = walletMethods.some(method => typeof obj[method] === 'function');
    
    // Check for wallet-like properties
    const walletProps = ['isConnected', 'selectedAddress', 'chainId', 'networkVersion'];
    const hasWalletProps = walletProps.some(prop => prop in obj);
    
    return hasWalletMethods || hasWalletProps;
  }
  
  private isBraveBrowser(): boolean {
    return !!(window.navigator as any).brave;
  }
  
  // Test connection to a specific wallet
  async testWalletConnection(wallet: DetectedWallet): Promise<boolean> {
    console.log(`Testing connection to ${wallet.name}...`);
    
    try {
      if (wallet.type === 'ethereum' && wallet.provider.request) {
        // Test ethereum provider
        const accounts = await wallet.provider.request({ method: 'eth_accounts' });
        console.log(`${wallet.name} connection test result:`, { accounts: accounts?.length || 0 });
        return true;
      } else if (wallet.type === 'hedera') {
        // Test Hedera provider
        console.log(`${wallet.name} is a Hedera wallet - assuming available`);
        return true;
      }
    } catch (error) {
      console.log(`${wallet.name} connection test failed:`, error);
    }
    
    return false;
  }
}

export const directWalletDetector = new DirectWalletDetector();