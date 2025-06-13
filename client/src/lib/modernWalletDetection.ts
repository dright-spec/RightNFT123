// Modern wallet detection using EIP-6963 and browser-specific APIs
// This approach works with Brave, MetaMask, HashPack, and other modern wallets

export interface WalletProvider {
  name: string;
  icon: string;
  uuid: string;
  provider: any;
  detected: boolean;
  isHedera?: boolean;
}

export interface WalletDetectionResult {
  providers: WalletProvider[];
  hasHederaWallet: boolean;
  hasBraveWallet: boolean;
  hasAnyWallet: boolean;
}

class ModernWalletDetector {
  private providers: Map<string, WalletProvider> = new Map();
  private listeners: Array<() => void> = [];

  constructor() {
    this.setupEIP6963Listeners();
    this.detectBrowserWallets();
  }

  // EIP-6963 standard for wallet detection
  private setupEIP6963Listeners() {
    // Listen for wallet announcements
    window.addEventListener('eip6963:announceProvider', (event: any) => {
      console.log('EIP-6963 wallet announced:', event.detail);
      this.handleWalletAnnouncement(event.detail);
    });

    // Request wallet announcements
    window.dispatchEvent(new Event('eip6963:requestProvider'));
  }

  private handleWalletAnnouncement(detail: any) {
    const { info, provider } = detail;
    
    const walletProvider: WalletProvider = {
      name: info.name,
      icon: info.icon,
      uuid: info.uuid,
      provider: provider,
      detected: true,
      isHedera: this.isHederaWallet(info, provider)
    };

    console.log(`Detected wallet via EIP-6963: ${info.name}`, walletProvider);
    this.providers.set(info.uuid, walletProvider);
    this.notifyListeners();
  }

  private isHederaWallet(info: any, provider: any): boolean {
    // Check if wallet supports Hedera
    const name = info.name?.toLowerCase() || '';
    const isHashPack = name.includes('hashpack') || provider.isHashPack;
    const isBlade = name.includes('blade') || provider.isBlade;
    
    return isHashPack || isBlade;
  }

  // Detect browser-specific wallets
  private detectBrowserWallets() {
    // Brave browser detection
    if (this.isBraveBrowser()) {
      console.log('Brave browser detected, checking for built-in wallet');
      this.detectBraveWallet();
    }

    // Legacy ethereum provider detection
    this.detectEthereumProvider();
    
    // Direct Hedera wallet detection
    this.detectHederaWallets();
  }

  private isBraveBrowser(): boolean {
    return !!(window.navigator as any).brave;
  }

  private async detectBraveWallet() {
    // Brave wallet detection - more comprehensive approach
    const ethereum = (window as any).ethereum;
    
    if (ethereum) {
      console.log('Ethereum object found:', {
        isBraveWallet: ethereum.isBraveWallet,
        isMetaMask: ethereum.isMetaMask,
        isHashPack: ethereum.isHashPack,
        isBlade: ethereum.isBlade,
        providers: ethereum.providers?.length || 0
      });

      // Check if it's Brave's wallet
      const isBrave = ethereum.isBraveWallet || 
                     ethereum._metamask?.isBrave ||
                     (await this.checkBraveWalletAPI());

      if (isBrave) {
        const braveWallet: WalletProvider = {
          name: 'Brave Wallet',
          icon: 'data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24"><path fill="%23ff6600" d="M12 0L2 12l10 12L22 12z"/></svg>',
          uuid: 'brave-wallet',
          provider: ethereum,
          detected: true,
          isHedera: false // Brave doesn't natively support Hedera but can be used
        };

        console.log('✓ Brave Wallet detected and added');
        this.providers.set('brave-wallet', braveWallet);
        this.notifyListeners();
      } else if (ethereum) {
        // Any ethereum provider should be detected
        const genericWallet: WalletProvider = {
          name: 'Web3 Wallet',
          icon: 'data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24"><circle cx="12" cy="12" r="10" fill="%236366f1"/></svg>',
          uuid: 'ethereum-generic',
          provider: ethereum,
          detected: true,
          isHedera: ethereum.isHashPack || ethereum.isBlade
        };

        console.log('✓ Generic Web3 wallet detected');
        this.providers.set('ethereum-generic', genericWallet);
        this.notifyListeners();
      }
    } else {
      console.log('No ethereum object found in window');
    }
  }

  private async checkBraveWalletAPI(): Promise<boolean> {
    try {
      // Brave wallet has specific API characteristics
      const ethereum = (window as any).ethereum;
      if (!ethereum) return false;

      // Check for Brave-specific methods or properties
      return !!(ethereum.isBraveWallet || 
               ethereum.send || 
               (ethereum.request && await this.testBraveWalletRequest(ethereum)));
    } catch {
      return false;
    }
  }

  private async testBraveWalletRequest(ethereum: any): Promise<boolean> {
    try {
      // Test a simple request that Brave wallet supports
      const chainId = await ethereum.request({ method: 'eth_chainId' });
      return typeof chainId === 'string';
    } catch {
      return false;
    }
  }

  private detectEthereumProvider() {
    const ethereum = (window as any).ethereum;
    if (!ethereum) return;

    // Check for multiple providers (modern wallet setup)
    if (ethereum.providers && Array.isArray(ethereum.providers)) {
      console.log('Multiple ethereum providers detected:', ethereum.providers);
      
      ethereum.providers.forEach((provider: any, index: number) => {
        const name = this.getProviderName(provider);
        const walletProvider: WalletProvider = {
          name: name,
          icon: 'data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24"><circle cx="12" cy="12" r="10" fill="%236366f1"/></svg>',
          uuid: `ethereum-provider-${index}`,
          provider: provider,
          detected: true,
          isHedera: this.isHederaProvider(provider)
        };

        console.log(`Detected ethereum provider: ${name}`, walletProvider);
        this.providers.set(`ethereum-provider-${index}`, walletProvider);
      });
    } else {
      // Single ethereum provider
      const name = this.getProviderName(ethereum);
      const walletProvider: WalletProvider = {
        name: name,
        icon: 'data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24"><circle cx="12" cy="12" r="10" fill="%236366f1"/></svg>',
        uuid: 'ethereum-single',
        provider: ethereum,
        detected: true,
        isHedera: this.isHederaProvider(ethereum)
      };

      console.log(`Detected single ethereum provider: ${name}`, walletProvider);
      this.providers.set('ethereum-single', walletProvider);
    }

    this.notifyListeners();
  }

  private getProviderName(provider: any): string {
    if (provider.isHashPack) return 'HashPack';
    if (provider.isBlade) return 'Blade Wallet';
    if (provider.isBraveWallet) return 'Brave Wallet';
    if (provider.isMetaMask) return 'MetaMask';
    if (provider.isCoinbaseWallet) return 'Coinbase Wallet';
    return 'Unknown Wallet';
  }

  private isHederaProvider(provider: any): boolean {
    return !!(provider.isHashPack || provider.isBlade);
  }

  private detectHederaWallets() {
    // Direct detection of Hedera-specific wallets
    const hederaWallets = [
      { key: 'hashpack', name: 'HashPack' },
      { key: 'hashconnect', name: 'HashConnect' },
      { key: 'bladeSDK', name: 'Blade SDK' },
      { key: 'blade', name: 'Blade Wallet' }
    ];

    for (const wallet of hederaWallets) {
      const provider = (window as any)[wallet.key];
      if (provider && typeof provider === 'object') {
        const walletProvider: WalletProvider = {
          name: wallet.name,
          icon: 'data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24"><path fill="%23ff6600" d="M12 2L2 12l10 10L22 12z"/></svg>',
          uuid: `hedera-${wallet.key}`,
          provider: provider,
          detected: true,
          isHedera: true
        };

        console.log(`Detected Hedera wallet: ${wallet.name}`, walletProvider);
        this.providers.set(`hedera-${wallet.key}`, walletProvider);
        this.notifyListeners();
      }
    }
  }

  public getDetectionResult(): WalletDetectionResult {
    const providers = Array.from(this.providers.values());
    
    return {
      providers,
      hasHederaWallet: providers.some(p => p.isHedera),
      hasBraveWallet: providers.some(p => p.name === 'Brave Wallet'),
      hasAnyWallet: providers.length > 0
    };
  }

  public onWalletDetected(callback: () => void) {
    this.listeners.push(callback);
  }

  public removeListener(callback: () => void) {
    const index = this.listeners.indexOf(callback);
    if (index > -1) {
      this.listeners.splice(index, 1);
    }
  }

  private notifyListeners() {
    this.listeners.forEach(callback => callback());
  }

  // Force refresh detection
  public async refreshDetection(): Promise<WalletDetectionResult> {
    console.log('Refreshing wallet detection...');
    
    // Clear existing providers
    this.providers.clear();
    
    // Re-run detection
    this.detectBrowserWallets();
    
    // Request EIP-6963 announcements again
    window.dispatchEvent(new Event('eip6963:requestProvider'));
    
    // Wait a bit for async operations
    await new Promise(resolve => setTimeout(resolve, 500));
    
    const result = this.getDetectionResult();
    console.log('Refreshed detection result:', result);
    
    return result;
  }
}

export const modernWalletDetector = new ModernWalletDetector();