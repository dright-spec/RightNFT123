// Import the proper HashConnect integration
import { properHashPackConnector } from './proper-hashpack-connector';
import { detectHashPack, detectMetaMask, detectBlade } from './wallet-detection';
import { debugWalletEnvironment } from './debug-wallet';
import { config } from './env';

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

// Detect available wallets in the browser
export async function detectAvailableWallets(): Promise<WalletInfo[]> {
  try {
    // Check if HashConnect is already connected
    let isHashConnected = false;
    try {
      isHashConnected = hashConnectService.isConnected();
    } catch (error) {
      console.warn('Error checking HashConnect status:', error);
    }
    
    // Enhanced HashPack detection using community-recommended approach
    let hasHashPack = false;
    try {
      hasHashPack = await detectHashPack(3000); // Give more time for detection
      
      // Also check using our direct API
      if (!hasHashPack) {
        hasHashPack = await hashPackWallet.isAvailable();
      }
    } catch (error) {
      console.warn('Error detecting HashPack:', error);
    }
    
    // Additional manual HashPack check for debugging
    const manualHashPackCheck = !!(window as any).hashpack;
    
    // Run comprehensive wallet debugging
    debugWalletEnvironment();
    
    // Debug wallet detection
    console.log('Wallet detection:', {
      hashpack: hasHashPack,
      manualHashPackCheck,
      hashConnected: isHashConnected,
      metamask: detectMetaMask(),
      blade: detectBlade(),
      finalHashPackAvailable: hasHashPack || isHashConnected || manualHashPackCheck,
      windowObjects: {
        hashpack: typeof (window as any).hashpack,
        HashPack: typeof (window as any).HashPack,
        hashconnect: typeof (window as any).hashconnect
      }
    });
    
    const wallets: WalletInfo[] = [
      {
        id: 'hashpack',
        name: 'HashPack',
        description: 'Official Hedera wallet with native HTS support',
        icon: '🟡',
        isAvailable: hasHashPack || isHashConnected || manualHashPackCheck,
        isRecommended: true,
        isHederaNative: true,
        downloadUrl: 'https://www.hashpack.app/'
      },
      {
        id: 'metamask',
        name: 'MetaMask',
        description: 'Popular Ethereum wallet',
        icon: '🦊',
        isAvailable: detectMetaMask(),
        downloadUrl: 'https://metamask.io/'
      },
      {
        id: 'walletconnect',
        name: 'HashConnect',
        description: 'Connect using HashConnect protocol',
        icon: '🔗',
        isAvailable: true,
        isHederaNative: true,
        downloadUrl: 'https://docs.hedera.com/hedera/sdks-and-apis/sdks/wallet-integrations/hashconnect'
      },
      {
        id: 'blade',
        name: 'Blade Wallet',
        description: 'Multi-chain wallet with Hedera support',
        icon: '⚔️',
        isAvailable: detectBlade(),
        isHederaNative: true,
        downloadUrl: 'https://bladewallet.io/'
      }
    ];

    return wallets;
  } catch (error) {
    console.error('Error in detectAvailableWallets:', error);
    
    // Return basic wallet list on error
    return [
      {
        id: 'hashpack',
        name: 'HashPack',
        description: 'Official Hedera wallet with native HTS support',
        icon: '🟡',
        isAvailable: !!(window as any).hashpack || !!(window as any).HashPack,
        isRecommended: true,
        isHederaNative: true,
        downloadUrl: 'https://www.hashpack.app/'
      },
      {
        id: 'metamask',
        name: 'MetaMask',
        description: 'Popular Ethereum wallet',
        icon: '🦊',
        isAvailable: detectMetaMask(),
        downloadUrl: 'https://metamask.io/'
      }
    ];
  }
}

// Connect to a specific wallet
export async function connectToWallet(walletId: string): Promise<string> {
  switch (walletId) {
    case 'hashpack':
      return await connectHashPack();
    case 'metamask':
      return await connectMetaMask();
    case 'walletconnect':
      return await connectWalletConnect();
    case 'blade':
      return await connectBlade();
    default:
      throw new Error(`Unsupported wallet: ${walletId}`);
  }
}

// HashPack connection using proper HashConnect SDK
async function connectHashPack(): Promise<string> {
  try {
    console.log('Attempting HashPack connection via HashConnect...');
    
    // Use the official HashConnect integration
    const accountId = await hashConnectService.connectWallet();
    
    // Validate Hedera account format
    if (!/^0\.0\.\d+$/.test(accountId)) {
      throw new Error('Invalid Hedera account ID format received');
    }
    
    console.log('HashPack connected successfully via HashConnect:', accountId);
    return accountId;
  } catch (error) {
    console.error('HashPack connection error:', error);
    
    if (error.message?.includes('User rejected') || error.code === 4001) {
      throw new Error('Connection cancelled by user');
    }
    
    throw new Error(`HashPack connection failed: ${error.message || 'Unknown error'}`);
  }
}

// MetaMask connection
async function connectMetaMask(): Promise<string> {
  if (!(window as any).ethereum?.isMetaMask) {
    throw new Error('MetaMask not installed');
  }

  try {
    const accounts = await (window as any).ethereum.request({
      method: 'eth_requestAccounts'
    });

    if (accounts && accounts.length > 0) {
      return accounts[0];
    }

    throw new Error('No accounts found in MetaMask');
  } catch (error) {
    if (error.code === 4001) {
      throw new Error('Connection cancelled by user');
    }
    throw error;
  }
}

// WalletConnect that tries HashConnect first, then manual entry
async function connectWalletConnect(): Promise<string> {
  // First try to use HashConnect if available
  try {
    if (hashConnectService.isConnected()) {
      const accountId = hashConnectService.getAccountId();
      if (accountId) {
        return accountId;
      }
    }
    
    // Try to initialize HashConnect
    const accountId = await hashConnectService.connectWallet();
    if (accountId) {
      return accountId;
    }
  } catch (error) {
    console.log('HashConnect not available, falling back to manual entry');
  }
  
  // Fallback to manual entry only if HashConnect fails
  const address = prompt('Enter your Hedera account ID (format: 0.0.xxxxx):');
  
  if (!address) {
    throw new Error('Connection cancelled by user');
  }
  
  // Validate Hedera account format
  if (!/^0\.0\.\d+$/.test(address)) {
    throw new Error('Invalid Hedera account ID format. Use 0.0.xxxxx format');
  }
  
  return address;
}

// Blade wallet connection
async function connectBlade(): Promise<string> {
  if (!(window as any).bladeWallet) {
    throw new Error('Blade wallet not installed');
  }

  try {
    const blade = (window as any).bladeWallet;
    const result = await blade.connect();
    
    if (result.success && result.accountId) {
      return result.accountId;
    }

    throw new Error('Failed to connect to Blade wallet');
  } catch (error) {
    throw error;
  }
}

// Check if a wallet is connected by looking at HashConnect first, then localStorage
export function getStoredWalletConnection(): ConnectedWallet | null {
  try {
    // Check if HashConnect is connected first
    if (hashConnectService.isConnected()) {
      const accountId = hashConnectService.getAccountId();
      if (accountId) {
        return {
          walletId: 'hashpack',
          address: accountId,
          isConnected: true
        };
      }
    }
    
    // Fallback to localStorage for other wallets
    const walletId = localStorage.getItem('connected_wallet');
    const address = localStorage.getItem('wallet_address');
    
    if (walletId && address) {
      return {
        walletId,
        address,
        isConnected: true
      };
    }
  } catch (error) {
    console.error('Error getting stored wallet connection:', error);
  }
  
  return null;
}

// Store wallet connection info
export function storeWalletConnection(walletId: string, address: string): void {
  localStorage.setItem('connected_wallet', walletId);
  localStorage.setItem('wallet_address', address);
}

// Clear stored wallet connection
export function clearWalletConnection(): void {
  localStorage.removeItem('connected_wallet');
  localStorage.removeItem('wallet_address');
}