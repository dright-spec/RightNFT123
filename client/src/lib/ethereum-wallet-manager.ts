// Enhanced Ethereum wallet manager with support for popular wallets
import { ethers } from 'ethers';

export interface WalletInfo {
  id: string;
  name: string;
  description: string;
  icon: string;
  isAvailable: boolean;
  isRecommended?: boolean;
  isEthereumNative?: boolean;
  downloadUrl?: string;
}

export interface ConnectedWallet {
  walletId: string;  
  address: string;
  isConnected: boolean;
  chainId?: number;
  balance?: string;
}

// Enhanced wallet detection for popular Ethereum wallets
export async function detectAvailableWallets(): Promise<WalletInfo[]> {
  const wallets: WalletInfo[] = [];

  // Wait for wallet extensions to load
  await new Promise(resolve => setTimeout(resolve, 100));

  // MetaMask detection - most popular
  const hasMetaMask = detectMetaMask();
  wallets.push({
    id: "metamask",
    name: "MetaMask",
    description: "Most popular Ethereum wallet with millions of users",
    icon: "🦊",
    isAvailable: hasMetaMask,
    isRecommended: true,
    isEthereumNative: true,
    downloadUrl: "https://metamask.io/",
  });

  // Phantom wallet detection
  const hasPhantom = detectPhantom();
  wallets.push({
    id: "phantom",
    name: "Phantom",
    description: "Multi-chain wallet supporting Ethereum and Solana",
    icon: "👻",
    isAvailable: hasPhantom,
    isRecommended: true,
    isEthereumNative: true,
    downloadUrl: "https://phantom.app/",
  });

  // Coinbase Wallet detection
  const hasCoinbase = detectCoinbaseWallet();
  wallets.push({
    id: "coinbase",
    name: "Coinbase Wallet",
    description: "Non-custodial wallet from Coinbase",
    icon: "🔵",
    isAvailable: hasCoinbase,
    isRecommended: false,
    isEthereumNative: true,
    downloadUrl: "https://wallet.coinbase.com/",
  });

  // Trust Wallet detection
  const hasTrust = detectTrustWallet();
  if (hasTrust) {
    wallets.push({
      id: "trust",
      name: "Trust Wallet",
      description: "Popular mobile wallet with browser extension",
      icon: "🛡️",
      isAvailable: hasTrust,
      isRecommended: false,
      isEthereumNative: true,
      downloadUrl: "https://trustwallet.com/",
    });
  }

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
      isEthereumNative: true,
      downloadUrl: "https://brave.com/wallet/",
    });
  }

  // WalletConnect - for mobile wallets
  wallets.push({
    id: "walletconnect",
    name: "WalletConnect",
    description: "Connect with 300+ mobile wallets via QR code",
    icon: "🔗",
    isAvailable: true, // Always available as it's a protocol
    isRecommended: false,
    isEthereumNative: true,
    downloadUrl: "https://walletconnect.com/",
  });

  console.log('Ethereum wallet detection results:', {
    metamask: hasMetaMask,
    phantom: hasPhantom,
    coinbase: hasCoinbase,
    trust: hasTrust,
    brave: hasBrave,
    windowObjects: {
      ethereum: !!(window as any).ethereum,
      phantom: !!(window as any).phantom,
      coinbase: !!(window as any).coinbaseWalletExtension,
      trust: !!(window as any).trustwallet,
    }
  });

  // Debug: List all ethereum providers
  const win = window as any;
  if (win.ethereum?.providers) {
    console.log('Multiple ethereum providers detected:', win.ethereum.providers.map((p: any) => ({
      isMetaMask: p.isMetaMask,
      isPhantom: p.isPhantom,
      isCoinbaseWallet: p.isCoinbaseWallet,
      isTrust: p.isTrust,
      isBraveWallet: p.isBraveWallet,
    })));
  }

  return wallets;
}

// MetaMask detection with multiple methods
function detectMetaMask(): boolean {
  const win = window as any;
  
  // Method 1: Direct ethereum.isMetaMask check
  if (win.ethereum?.isMetaMask) {
    console.log('MetaMask detected via ethereum.isMetaMask');
    return true;
  }
  
  // Method 2: Check providers array for MetaMask
  if (win.ethereum?.providers && Array.isArray(win.ethereum.providers)) {
    const metaMaskProvider = win.ethereum.providers.find((p: any) => p.isMetaMask);
    if (metaMaskProvider) {
      console.log('MetaMask detected in providers array');
      return true;
    }
  }
  
  // Method 3: Check for MetaMask-specific properties
  if (win.ethereum?._metamask) {
    console.log('MetaMask detected via _metamask property');
    return true;
  }
  
  return false;
}

// Phantom wallet detection
function detectPhantom(): boolean {
  const win = window as any;
  
  // Method 1: Direct phantom object
  if (win.phantom?.ethereum) {
    console.log('Phantom detected via window.phantom.ethereum');
    return true;  
  }
  
  // Method 2: Check ethereum provider for Phantom
  if (win.ethereum?.isPhantom) {
    console.log('Phantom detected via ethereum.isPhantom');
    return true;
  }
  
  // Method 3: Check providers array
  if (win.ethereum?.providers && Array.isArray(win.ethereum.providers)) {
    const phantomProvider = win.ethereum.providers.find((p: any) => p.isPhantom);
    if (phantomProvider) {
      console.log('Phantom detected in providers array');
      return true;
    }
  }
  
  return false;
}

// Coinbase Wallet detection
function detectCoinbaseWallet(): boolean {
  const win = window as any;
  
  // Method 1: Direct coinbaseWalletExtension
  if (win.coinbaseWalletExtension) {
    console.log('Coinbase Wallet detected via coinbaseWalletExtension');
    return true;
  }
  
  // Method 2: Check ethereum provider
  if (win.ethereum?.isCoinbaseWallet) {
    console.log('Coinbase Wallet detected via ethereum.isCoinbaseWallet');
    return true;
  }
  
  // Method 3: Check providers array
  if (win.ethereum?.providers && Array.isArray(win.ethereum.providers)) {
    const coinbaseProvider = win.ethereum.providers.find((p: any) => p.isCoinbaseWallet);
    if (coinbaseProvider) {
      console.log('Coinbase Wallet detected in providers array');
      return true;
    }
  }
  
  return false;
}

// Trust Wallet detection
function detectTrustWallet(): boolean {
  const win = window as any;
  
  // Method 1: Direct trustwallet object
  if (win.trustwallet) {
    console.log('Trust Wallet detected via window.trustwallet');
    return true;
  }
  
  // Method 2: Check ethereum provider
  if (win.ethereum?.isTrust) {
    console.log('Trust Wallet detected via ethereum.isTrust');
    return true;
  }
  
  return false;
}

// Brave wallet detection  
function detectBrave(): boolean {
  const win = window as any;
  return !!(win.ethereum?.isBraveWallet);
}

// Connect to a specific wallet
export async function connectToWallet(walletId: string): Promise<ConnectedWallet> {
  console.log(`Attempting to connect to ${walletId}...`);

  switch (walletId) {
    case "metamask":
      return await connectMetaMask();
    case "phantom":
      return await connectPhantom();
    case "coinbase":
      return await connectCoinbaseWallet();
    case "trust":
      return await connectTrustWallet();
    case "brave":
      return await connectBrave();
    case "walletconnect":
      return await connectWalletConnect();
    default:
      throw new Error(`Unsupported wallet: ${walletId}`);
  }
}

// MetaMask connection
async function connectMetaMask(): Promise<ConnectedWallet> {
  const win = window as any;
  
  if (!win.ethereum?.isMetaMask && !win.ethereum?.providers?.find((p: any) => p.isMetaMask)) {
    throw new Error("MetaMask wallet not installed");
  }

  try {
    // Get the MetaMask provider
    let provider = win.ethereum;
    if (win.ethereum.providers && Array.isArray(win.ethereum.providers)) {
      provider = win.ethereum.providers.find((p: any) => p.isMetaMask) || win.ethereum;
    }

    // Request account access
    const accounts = await provider.request({
      method: 'eth_requestAccounts'
    });
    
    if (!accounts || accounts.length === 0) {
      throw new Error("No accounts found");
    }

    // Get chain ID and balance
    const chainId = await provider.request({ method: 'eth_chainId' });
    const balance = await provider.request({
      method: 'eth_getBalance',
      params: [accounts[0], 'latest']
    });

    console.log('MetaMask connected successfully:', {
      address: accounts[0],
      chainId: parseInt(chainId, 16),
      balance: ethers.formatEther(balance)
    });

    return {
      walletId: "metamask",
      address: accounts[0],
      isConnected: true,
      chainId: parseInt(chainId, 16),
      balance: ethers.formatEther(balance)
    };
  } catch (error: any) {
    throw new Error(`MetaMask connection failed: ${error.message}`);
  }
}

// Phantom wallet connection
async function connectPhantom(): Promise<ConnectedWallet> {
  const win = window as any;
  
  if (!win.phantom?.ethereum && !win.ethereum?.isPhantom) {
    throw new Error("Phantom wallet not installed");
  }

  try {
    // Get Phantom's ethereum provider
    let provider = win.phantom?.ethereum || win.ethereum;
    if (win.ethereum?.providers && Array.isArray(win.ethereum.providers)) {
      provider = win.ethereum.providers.find((p: any) => p.isPhantom) || provider;
    }

    const accounts = await provider.request({
      method: 'eth_requestAccounts'
    });
    
    if (!accounts || accounts.length === 0) {
      throw new Error("No accounts found");
    }

    const chainId = await provider.request({ method: 'eth_chainId' });
    const balance = await provider.request({
      method: 'eth_getBalance',
      params: [accounts[0], 'latest']
    });

    console.log('Phantom connected successfully:', accounts[0]);

    return {
      walletId: "phantom",
      address: accounts[0],
      isConnected: true,
      chainId: parseInt(chainId, 16),
      balance: ethers.formatEther(balance)
    };
  } catch (error: any) {
    throw new Error(`Phantom connection failed: ${error.message}`);
  }
}

// Coinbase Wallet connection
async function connectCoinbaseWallet(): Promise<ConnectedWallet> {
  const win = window as any;
  
  if (!win.coinbaseWalletExtension && !win.ethereum?.isCoinbaseWallet) {
    throw new Error("Coinbase Wallet not installed");
  }

  try {
    let provider = win.coinbaseWalletExtension || win.ethereum;
    if (win.ethereum?.providers && Array.isArray(win.ethereum.providers)) {
      provider = win.ethereum.providers.find((p: any) => p.isCoinbaseWallet) || provider;
    }

    const accounts = await provider.request({
      method: 'eth_requestAccounts'
    });
    
    if (!accounts || accounts.length === 0) {
      throw new Error("No accounts found");
    }

    const chainId = await provider.request({ method: 'eth_chainId' });
    const balance = await provider.request({
      method: 'eth_getBalance',
      params: [accounts[0], 'latest']
    });

    console.log('Coinbase Wallet connected successfully:', accounts[0]);

    return {
      walletId: "coinbase",
      address: accounts[0],
      isConnected: true,
      chainId: parseInt(chainId, 16),
      balance: ethers.formatEther(balance)
    };
  } catch (error: any) {
    throw new Error(`Coinbase Wallet connection failed: ${error.message}`);
  }
}

// Trust Wallet connection
async function connectTrustWallet(): Promise<ConnectedWallet> {
  const win = window as any;
  
  if (!win.trustwallet && !win.ethereum?.isTrust) {
    throw new Error("Trust Wallet not installed");
  }

  try {
    const provider = win.trustwallet || win.ethereum;
    
    const accounts = await provider.request({
      method: 'eth_requestAccounts'
    });
    
    if (!accounts || accounts.length === 0) {
      throw new Error("No accounts found");
    }

    const chainId = await provider.request({ method: 'eth_chainId' });
    const balance = await provider.request({
      method: 'eth_getBalance', 
      params: [accounts[0], 'latest']
    });

    console.log('Trust Wallet connected successfully:', accounts[0]);

    return {
      walletId: "trust",
      address: accounts[0],
      isConnected: true,
      chainId: parseInt(chainId, 16),
      balance: ethers.formatEther(balance)
    };
  } catch (error: any) {
    throw new Error(`Trust Wallet connection failed: ${error.message}`);
  }
}

// Brave wallet connection
async function connectBrave(): Promise<ConnectedWallet> {
  const win = window as any;
  
  if (!win.ethereum?.isBraveWallet) {
    throw new Error("Brave wallet not available");
  }

  try {
    const accounts = await win.ethereum.request({
      method: 'eth_requestAccounts'
    });
    
    if (!accounts || accounts.length === 0) {
      throw new Error("No accounts found");
    }

    const chainId = await win.ethereum.request({ method: 'eth_chainId' });
    const balance = await win.ethereum.request({
      method: 'eth_getBalance',
      params: [accounts[0], 'latest']
    });

    console.log('Brave wallet connected successfully:', accounts[0]);

    return {
      walletId: "brave",
      address: accounts[0],
      isConnected: true,
      chainId: parseInt(chainId, 16),
      balance: ethers.formatEther(balance)
    };
  } catch (error: any) {
    throw new Error(`Brave wallet connection failed: ${error.message}`);
  }
}

// WalletConnect connection (simplified - would normally use WalletConnect SDK)
async function connectWalletConnect(): Promise<ConnectedWallet> {
  throw new Error("WalletConnect integration requires additional setup. Please use MetaMask or another browser extension wallet for now.");
}

// Get current connected wallet
export function getConnectedWallet(): ConnectedWallet | null {
  const win = window as any;
  
  if (!win.ethereum) return null;
  
  // Check if any wallet is connected
  if (win.ethereum.selectedAddress) {
    let walletId = "unknown";
    
    // Identify which wallet is connected
    if (win.ethereum.isMetaMask) walletId = "metamask";
    else if (win.ethereum.isPhantom) walletId = "phantom";
    else if (win.ethereum.isCoinbaseWallet) walletId = "coinbase";
    else if (win.ethereum.isTrust) walletId = "trust";
    else if (win.ethereum.isBraveWallet) walletId = "brave";
    
    return {
      walletId,
      address: win.ethereum.selectedAddress,
      isConnected: true,
      chainId: win.ethereum.chainId ? parseInt(win.ethereum.chainId, 16) : undefined
    };
  }
  
  return null;
}

// Switch to Ethereum mainnet
export async function switchToMainnet(): Promise<void> {
  const win = window as any;
  
  if (!win.ethereum) {
    throw new Error("No Ethereum wallet detected");
  }

  try {
    await win.ethereum.request({
      method: 'wallet_switchEthereumChain',
      params: [{ chainId: '0x1' }], // Ethereum mainnet
    });
  } catch (error: any) {
    // If chain doesn't exist, add it
    if (error.code === 4902) {
      await win.ethereum.request({
        method: 'wallet_addEthereumChain',
        params: [
          {
            chainId: '0x1',
            chainName: 'Ethereum Mainnet',
            nativeCurrency: {
              name: 'Ether',
              symbol: 'ETH',
              decimals: 18,
            },
            rpcUrls: ['https://mainnet.infura.io/v3/'],
            blockExplorerUrls: ['https://etherscan.io/'],
          },
        ],
      });
    } else {
      throw error;
    }
  }
}

// Listen for account and chain changes
export function setupWalletListeners(
  onAccountChange: (accounts: string[]) => void,
  onChainChange: (chainId: number) => void
): void {
  const win = window as any;
  
  if (win.ethereum) {
    win.ethereum.on('accountsChanged', onAccountChange);
    win.ethereum.on('chainChanged', (chainId: string) => {
      onChainChange(parseInt(chainId, 16));
    });
  }
}

// Disconnect wallet
export async function disconnectWallet(): Promise<void> {
  // Clear any stored connection data
  localStorage.removeItem('walletConnection');
  console.log("Wallet disconnected");
}