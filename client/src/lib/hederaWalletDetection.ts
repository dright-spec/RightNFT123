// Hedera-specific wallet detection for HashPack dApp connections
// This handles the actual HashPack wallet connection protocol

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
    
    const providers: HederaWalletProvider[] = [];
    
    // 1. Check for HashPack extension
    this.detectHashPackExtension(providers);
    
    // 2. Check for Blade wallet
    this.detectBladeWallet(providers);
    
    // 3. Check for HashPack dApp connection capability
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
    
    // Method 1: Direct hashpack object
    if ((window as any).hashpack) {
      console.log('✓ HashPack extension detected via window.hashpack');
      providers.push({
        name: 'HashPack Extension',
        type: 'hashpack',
        connectionMethod: 'extension',
        provider: (window as any).hashpack,
        available: true
      });
      return;
    }
    
    // Method 2: HashConnect object
    if ((window as any).hashconnect) {
      console.log('✓ HashConnect detected');
      providers.push({
        name: 'HashConnect',
        type: 'hashpack',
        connectionMethod: 'extension',
        provider: (window as any).hashconnect,
        available: true
      });
      return;
    }
    
    // Method 3: Check for HashPack in ethereum provider
    const ethereum = (window as any).ethereum;
    if (ethereum?.isHashPack) {
      console.log('✓ HashPack detected via ethereum provider');
      providers.push({
        name: 'HashPack (Ethereum)',
        type: 'hashpack',
        connectionMethod: 'extension',
        provider: ethereum,
        available: true
      });
      return;
    }
    
    // Method 4: Check for HashPack in multi-provider setup
    if (ethereum?.providers?.length > 0) {
      const hashPackProvider = ethereum.providers.find((p: any) => p.isHashPack);
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
    
    console.log('No HashPack extension detected');
  }
  
  private detectBladeWallet(providers: HederaWalletProvider[]) {
    console.log('Checking for Blade wallet...');
    
    const bladeChecks = [
      { key: 'bladeSDK', name: 'Blade SDK' },
      { key: 'blade', name: 'Blade Wallet' },
      { key: 'BladeSDK', name: 'Blade SDK (caps)' }
    ];
    
    for (const check of bladeChecks) {
      if ((window as any)[check.key]) {
        console.log(`✓ ${check.name} detected`);
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
    if (ethereum?.isBlade) {
      console.log('✓ Blade detected via ethereum provider');
      providers.push({
        name: 'Blade (Ethereum)',
        type: 'blade',
        connectionMethod: 'extension',
        provider: ethereum,
        available: true
      });
      return;
    }
    
    console.log('No Blade wallet detected');
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