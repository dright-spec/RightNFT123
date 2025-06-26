// Comprehensive wallet detection for Hedera wallets
// Supports HashPack, Blade, and browser-specific wallet implementations

export interface WalletInfo {
  name: string;
  detected: boolean;
  injectionPoint: string;
  provider?: any;
}

export interface WalletDetectionResult {
  wallets: WalletInfo[];
  hasAnyWallet: boolean;
  preferredWallet?: WalletInfo;
}

class WalletDetector {
  private detectionAttempts = 0;
  private maxAttempts = 10;
  private detectionDelay = 300;

  // Comprehensive list of wallet injection points
  private walletChecks = [
    // HashPack variations
    { name: 'HashPack', points: ['hashpack', 'HashPack', 'hashconnect', 'HashConnect'] },
    // Blade wallet variations  
    { name: 'Blade', points: ['bladeSDK', 'blade', 'BladeSDK', 'Blade'] },
    // Browser-specific wallets
    { name: 'Brave Wallet', points: ['ethereum', 'solana'] },
    // Generic Hedera providers
    { name: 'Hedera Provider', points: ['hedera', 'hederaWallet', 'HederaWallet'] }
  ];

  async detectWallets(): Promise<WalletDetectionResult> {
    const results: WalletInfo[] = [];
    
    // Single detection round to prevent performance issues
    for (const walletType of this.walletChecks) {
      const detected = this.checkWalletType(walletType);
      if (detected && !results.find(r => r.name === walletType.name)) {
        results.push(detected);
      }
    }
    
    const preferredWallet = this.selectPreferredWallet(results);
    
    return {
      wallets: results,
      hasAnyWallet: results.length > 0,
      preferredWallet
    };
  }

  private checkWalletType(walletType: { name: string; points: string[] }): WalletInfo | null {
    for (const point of walletType.points) {
      const provider = this.getNestedProperty(window, point);
      if (provider) {
        return {
          name: walletType.name,
          detected: true,
          injectionPoint: point,
          provider
        };
      }
    }
    return null;
  }

  private getNestedProperty(obj: any, path: string): any {
    // Check direct property
    if (obj[path]) return obj[path];
    
    // Check nested properties (e.g., ethereum.isHashPack)
    const parts = path.split('.');
    let current = obj;
    for (const part of parts) {
      if (current && current[part]) {
        current = current[part];
      } else {
        return null;
      }
    }
    return current;
  }

  private selectPreferredWallet(wallets: WalletInfo[]): WalletInfo | undefined {
    // Preference order: HashPack > Blade > Browser wallets > Others
    const preferences = ['HashPack', 'Blade', 'Brave Wallet', 'Hedera Provider'];
    
    for (const preferred of preferences) {
      const wallet = wallets.find(w => w.name === preferred);
      if (wallet) return wallet;
    }
    
    return wallets[0]; // Return first found if no preference match
  }

  private logDetectionResults() {
    // Silent detection to prevent performance issues
  }

  private delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  // Specific HashPack detection with multiple methods
  async detectHashPack(): Promise<{ detected: boolean; method?: string; provider?: any }> {
    // Method 1: Direct HashPack API
    if ((window as any).hashpack) {
      return { 
        detected: true, 
        method: 'Direct API', 
        provider: (window as any).hashpack 
      };
    }

    // Method 2: HashConnect
    if ((window as any).hashconnect) {
      return { 
        detected: true, 
        method: 'HashConnect', 
        provider: (window as any).hashconnect 
      };
    }

    // Method 3: Ethereum provider with HashPack flag
    const ethereum = (window as any).ethereum;
    if (ethereum?.isHashPack) {
      return { 
        detected: true, 
        method: 'Ethereum Provider', 
        provider: ethereum 
      };
    }

    // Method 4: Multiple providers (MetaMask-style)
    if (ethereum?.providers) {
      const hashPackProvider = ethereum.providers.find((p: any) => p.isHashPack);
      if (hashPackProvider) {
        return { 
          detected: true, 
          method: 'Multi-Provider', 
          provider: hashPackProvider 
        };
      }
    }

    return { detected: false };
  }

  // Specific Blade detection
  async detectBlade(): Promise<{ detected: boolean; method?: string; provider?: any }> {
    // Check various Blade injection points
    const bladePoints = ['bladeSDK', 'blade', 'BladeSDK'];
    
    for (const point of bladePoints) {
      if ((window as any)[point]) {
        return { 
          detected: true, 
          method: point, 
          provider: (window as any)[point] 
        };
      }
    }

    // Check Ethereum provider with Blade flag
    const ethereum = (window as any).ethereum;
    if (ethereum?.isBlade) {
      return { 
        detected: true, 
        method: 'Ethereum Provider', 
        provider: ethereum 
      };
    }

    return { detected: false };
  }
}

export const walletDetector = new WalletDetector();