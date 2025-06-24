// Import the proper HashConnect integration
import { connectWallet as connectHashConnect, isConnected as isHashConnectConnected, getConnectedAccountIds } from './hashconnect';
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
  // Check if HashConnect is already connected
  const isHashConnected = isHashConnectConnected();
  
  // HashPack detection via HashConnect
  const hasHashPack = !!(
    (window as any).hashpack || 
    (window as any).HashPack || 
    isHashConnected
  );
  
  // Debug HashPack detection
  console.log('HashPack detection:', {
    hashpack: !!(window as any).hashpack,
    HashPack: !!(window as any).HashPack,
    hashConnected: isHashConnected,
    detected: hasHashPack
  });
  
  const wallets: WalletInfo[] = [
    {
      id: 'hashpack',
      name: 'HashPack',
      description: 'Official Hedera wallet with native HTS support',
      icon: '🟡',
      isAvailable: hasHashPack,
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
      description: 'Connect manually with wallet address',
      icon: '🔗',
      isAvailable: true, // Always available as manual entry
      downloadUrl: 'https://walletconnect.com/'
    },
    {
      id: 'blade',
      name: 'Blade Wallet',
      description: 'Multi-chain wallet with Hedera support',
      icon: '⚔️',
      isAvailable: !!(window as any).bladeWallet || !!(window as any).blade,
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

// HashPack connection using proper HashConnect SDK
async function connectHashPack(): Promise<string> {
  try {
    console.log('Attempting HashPack connection via HashConnect...');
    
    // Use the official HashConnect integration
    const accountId = await connectHashConnect();
    
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

// Simplified WalletConnect that opens a prompt for manual entry
async function connectWalletConnect(): Promise<string> {
  const address = prompt('Enter your wallet address (0x... for Ethereum or 0.0.xxx for Hedera):');
  
  if (!address) {
    throw new Error('Connection cancelled by user');
  }
  
  // Basic validation
  const isEthAddress = /^0x[a-fA-F0-9]{40}$/.test(address);
  const isHederaAccount = /^0\.0\.\d+$/.test(address);
  
  if (!isEthAddress && !isHederaAccount) {
    throw new Error('Invalid address format. Use 0x... for Ethereum or 0.0.xxx for Hedera');
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