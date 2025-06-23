import { connectWalletConnect, isWalletConnectAvailable } from './walletconnect';
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
export function detectAvailableWallets(): WalletInfo[] {
  const wallets: WalletInfo[] = [
    {
      id: 'hashpack',
      name: 'HashPack',
      description: 'Official Hedera wallet with native HTS support',
      icon: '🟡',
      isAvailable: !!(window as any).hashpack,
      isRecommended: true,
      isHederaNative: true,
      downloadUrl: 'https://www.hashpack.app/'
    },
    {
      id: 'metamask',
      name: 'MetaMask',
      description: 'Popular Ethereum wallet',
      icon: '🦊',
      isAvailable: !!(window as any).ethereum?.isMetaMask,
      downloadUrl: 'https://metamask.io/'
    },
    {
      id: 'walletconnect',
      name: 'WalletConnect',
      description: 'Connect with 300+ wallets via QR code',
      icon: '🔗',
      isAvailable: !!config.walletConnect.projectId,
      downloadUrl: 'https://walletconnect.com/'
    },
    {
      id: 'blade',
      name: 'Blade Wallet',
      description: 'Multi-chain wallet with Hedera support',
      icon: '⚔️',
      isAvailable: !!(window as any).bladeWallet,
      isHederaNative: true,
      downloadUrl: 'https://bladewallet.io/'
    }
  ];

  return wallets;
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

// HashPack connection
async function connectHashPack(): Promise<string> {
  if (!(window as any).hashpack) {
    throw new Error('HashPack wallet not installed. Please install the HashPack browser extension.');
  }

  try {
    const hashpack = (window as any).hashpack;
    
    // Request account info which prompts connection if needed
    const result = await hashpack.requestAccountInfo();
    
    if (!result || !result.accountId) {
      throw new Error('Failed to get account information from HashPack');
    }
    
    // Validate Hedera account format
    if (!/^0\.0\.\d+$/.test(result.accountId)) {
      throw new Error('Invalid Hedera account ID format');
    }
    
    return result.accountId;
  } catch (error) {
    if (error.message?.includes('User rejected') || error.code === 4001) {
      throw new Error('Connection cancelled by user');
    }
    throw error;
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

// Check if a wallet is connected by looking at localStorage
export function getStoredWalletConnection(): ConnectedWallet | null {
  const walletId = localStorage.getItem('connected_wallet');
  const address = localStorage.getItem('wallet_address');
  
  if (walletId && address) {
    return {
      walletId,
      address,
      isConnected: true
    };
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