// Enhanced Hedera wallet manager with robust detection methods
export interface WalletInfo {
  id: string;
  name: string;
  description: string;
  icon: string;
  isAvailable: boolean;
  isRecommended?: boolean;
  isHederaNative?: boolean;
  downloadUrl?: string;
}

export interface ConnectedWallet {
  walletId: string;
  address: string;
  isConnected: boolean;
}

// Enhanced wallet detection with multiple methods and timing
export async function detectAvailableWallets(): Promise<WalletInfo[]> {
  const wallets: WalletInfo[] = [];

  // Wait for wallets to inject into the page
  await new Promise(resolve => setTimeout(resolve, 100));

  // HashPack detection - multiple methods
  const hasHashPack = detectHashPack();
  wallets.push({
    id: "hashpack",
    name: "HashPack",
    description: "Official Hedera wallet with native HTS support",
    icon: "🟡",
    isAvailable: hasHashPack,
    isRecommended: true,
    isHederaNative: true,
    downloadUrl: "https://www.hashpack.app/",
  });

  // Blade wallet detection
  const hasBlade = detectBlade();
  wallets.push({
    id: "blade",
    name: "Blade Wallet",
    description: "Multi-chain wallet with Hedera support",
    icon: "⚔️",
    isAvailable: hasBlade,
    isRecommended: false,
    isHederaNative: true,
    downloadUrl: "https://bladewallet.io/",
  });

  // Brave wallet detection
  const hasBrave = detectBrave();
  if (hasBrave) {
    wallets.push({
      id: "brave",
      name: "Brave Wallet",
      description: "Built-in Brave browser wallet",
      icon: "🦁",
      isAvailable: hasBrave,
      isRecommended: false,
      isHederaNative: false,
      downloadUrl: "https://brave.com/wallet/",
    });
  }

  console.log('Enhanced wallet detection results:', {
    hashpack: hasHashPack,
    blade: hasBlade,
    brave: hasBrave,
    windowObjects: {
      hashpack: !!(window as any).hashpack,
      blade: !!(window as any).blade,
      ethereum: !!(window as any).ethereum,
      hashconnect: !!(window as any).hashconnect,
    }
  });

  return wallets;
}

// Enhanced HashPack detection
function detectHashPack(): boolean {
  const win = window as any;
  
  // Method 1: Direct hashpack object
  if (win.hashpack) {
    console.log('HashPack detected via window.hashpack');
    return true;
  }
  
  // Method 2: HashConnect object
  if (win.hashconnect || win.HashConnect) {
    console.log('HashPack detected via HashConnect');
    return true;
  }
  
  // Method 3: Check ethereum providers for HashPack
  if (win.ethereum) {
    if (win.ethereum.isHashPack) {
      console.log('HashPack detected via ethereum.isHashPack');
      return true;
    }
    
    // Check providers array
    if (win.ethereum.providers && Array.isArray(win.ethereum.providers)) {
      const hashPackProvider = win.ethereum.providers.find((p: any) => 
        p.isHashPack || p.isHashpack || 
        (p.constructor && p.constructor.name?.toLowerCase().includes('hashpack'))
      );
      if (hashPackProvider) {
        console.log('HashPack detected in ethereum providers array');
        return true;
      }
    }
  }
  
  // Method 4: Check for HashPack specific methods
  if (win.ethereum && typeof win.ethereum.request === 'function') {
    // Check if this looks like HashPack by network
    try {
      if (win.ethereum.chainId === '0x127' || win.ethereum.networkVersion === '295') {
        console.log('HashPack detected via Hedera network');
        return true;
      }
    } catch (e) {
      // Ignore errors
    }
  }
  
  // Method 5: Document inspection for extension presence
  const scripts = document.querySelectorAll('script[src*="hashpack"], script[src*="hashconnect"]');
  if (scripts.length > 0) {
    console.log('HashPack detected via injected scripts');
    return true;
  }
  
  return false;
}

// Enhanced Blade detection
function detectBlade(): boolean {
  const win = window as any;
  
  // Method 1: Direct blade object
  if (win.blade) {
    console.log('Blade wallet detected via window.blade');
    return true;
  }
  
  // Method 2: Check ethereum providers for Blade
  if (win.ethereum && win.ethereum.providers && Array.isArray(win.ethereum.providers)) {
    const bladeProvider = win.ethereum.providers.find((p: any) => 
      p.isBlade || p.isBladewallet ||
      (p.constructor && p.constructor.name?.toLowerCase().includes('blade'))
    );
    if (bladeProvider) {
      console.log('Blade wallet detected in ethereum providers array');
      return true;
    }
  }
  
  return false;
}

// Enhanced Brave detection
function detectBrave(): boolean {
  const win = window as any;
  return !!(win.ethereum?.isBraveWallet);
}

// Connect to a specific wallet
export async function connectToWallet(walletId: string): Promise<string> {
  console.log(`Attempting to connect to ${walletId}...`);

  switch (walletId) {
    case "hashpack":
      return await connectHashPack();
    case "blade":
      return await connectBlade();
    case "brave":
      return await connectBrave();
    default:
      throw new Error(`Unsupported wallet: ${walletId}`);
  }
}

// Enhanced HashPack connection with multiple methods
async function connectHashPack(): Promise<string> {
  const win = window as any;
  
  // Method 1: Direct HashPack API
  if (win.hashpack) {
    try {
      console.log('Attempting HashPack connection via direct API...');
      let response;
      
      // Try different HashPack API methods
      if (typeof win.hashpack.requestAccountInfo === 'function') {
        response = await win.hashpack.requestAccountInfo();
      } else if (typeof win.hashpack.connect === 'function') {
        response = await win.hashpack.connect();
      } else if (typeof win.hashpack.enable === 'function') {
        response = await win.hashpack.enable();
      }
      
      if (response?.accountId) {
        console.log('HashPack connected successfully:', response.accountId);
        return response.accountId;
      }
    } catch (error) {
      console.warn('Direct HashPack API failed:', error);
    }
  }
  
  // Method 2: HashConnect API
  if (win.hashconnect || win.HashConnect) {
    try {
      console.log('Attempting HashPack connection via HashConnect...');
      const hc = win.hashconnect || win.HashConnect;
      
      if (typeof hc.requestAccountInfo === 'function') {
        const response = await hc.requestAccountInfo();
        if (response?.accountId) {
          console.log('HashPack connected via HashConnect:', response.accountId);
          return response.accountId;
        }
      }
    } catch (error) {
      console.warn('HashConnect API failed:', error);
    }
  }
  
  // Method 3: Ethereum provider (if HashPack is using it)
  if (win.ethereum && (win.ethereum.isHashPack || win.ethereum.chainId === '0x127')) {
    try {
      console.log('Attempting HashPack connection via ethereum provider...');
      const accounts = await win.ethereum.request({
        method: 'eth_requestAccounts'
      });
      
      if (accounts && accounts.length > 0) {
        // Convert Ethereum address to Hedera account format if needed
        const accountId = accounts[0];
        console.log('HashPack connected via ethereum provider:', accountId);
        return accountId;
      }
    } catch (error) {
      console.warn('Ethereum provider method failed:', error);
    }
  }
  
  throw new Error("HashPack wallet not found or connection failed");
}

// Enhanced Blade wallet connection
async function connectBlade(): Promise<string> {
  const win = window as any;
  
  if (!win.blade) {
    throw new Error("Blade wallet not installed");
  }

  try {
    console.log('Attempting Blade wallet connection...');
    let response;
    
    // Try different Blade API methods
    if (typeof win.blade.requestAccountInfo === 'function') {
      response = await win.blade.requestAccountInfo();
    } else if (typeof win.blade.connect === 'function') {
      response = await win.blade.connect();
    } else if (typeof win.blade.enable === 'function') {
      response = await win.blade.enable();
    }
    
    if (response?.accountId) {
      console.log('Blade wallet connected:', response.accountId);
      return response.accountId;
    }
    
    throw new Error("No account found");
  } catch (error: any) {
    throw new Error(`Blade wallet connection failed: ${error.message}`);
  }
}

// Enhanced Brave wallet connection
async function connectBrave(): Promise<string> {
  const win = window as any;
  
  if (!win.ethereum?.isBraveWallet) {
    throw new Error("Brave wallet not available");
  }

  try {
    console.log('Attempting Brave wallet connection...');
    const accounts = await win.ethereum.request({
      method: 'eth_requestAccounts'
    });
    
    if (accounts && accounts.length > 0) {
      // For now, return the Ethereum address
      // In a production app, you'd need to configure Hedera network
      console.log('Brave wallet connected:', accounts[0]);
      return accounts[0];
    }
    
    throw new Error("No accounts found");
  } catch (error: any) {
    throw new Error(`Brave wallet connection failed: ${error.message}`);
  }
}

// Enhanced connected wallet detection
export function getConnectedWallet(): ConnectedWallet | null {
  const win = window as any;
  
  // Check HashPack first
  if (win.hashpack) {
    try {
      let accountInfo;
      
      if (typeof win.hashpack.getAccountInfo === 'function') {
        accountInfo = win.hashpack.getAccountInfo();
      } else if (typeof win.hashpack.account === 'object') {
        accountInfo = win.hashpack.account;
      }
      
      if (accountInfo?.accountId) {
        return {
          walletId: "hashpack",
          address: accountInfo.accountId,
          isConnected: true,
        };
      }
    } catch (error) {
      console.warn("Error getting HashPack account info:", error);
    }
  }
  
  // Check Blade
  if (win.blade) {
    try {
      let accountInfo;
      
      if (typeof win.blade.getAccountInfo === 'function') {
        accountInfo = win.blade.getAccountInfo();
      } else if (typeof win.blade.account === 'object') {
        accountInfo = win.blade.account;
      }
      
      if (accountInfo?.accountId) {
        return {
          walletId: "blade",
          address: accountInfo.accountId,
          isConnected: true,
        };
      }
    } catch (error) {
      console.warn("Error getting Blade account info:", error);
    }
  }
  
  // Check Brave (if connected to Hedera network)
  if (win.ethereum?.isBraveWallet && win.ethereum.selectedAddress) {
    return {
      walletId: "brave",
      address: win.ethereum.selectedAddress,
      isConnected: true,
    };
  }
  
  return null;
}

// Disconnect wallet
export async function disconnectWallet(): Promise<void> {
  // Clear any stored connection data
  localStorage.removeItem('walletConnection');
  console.log("Wallet disconnected");
}