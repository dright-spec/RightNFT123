import { ethers } from 'ethers';
import { apiRequest } from "./queryClient";

declare global {
  interface Window {
    ethereum?: any;
  }
}

interface WalletStatus {
  isConnected: boolean;
  address: string | null;
  chainId?: number;
}

let walletStatus: WalletStatus = {
  isConnected: false,
  address: null,
};

let provider: ethers.BrowserProvider | null = null;
let signer: ethers.JsonRpcSigner | null = null;

// Event handlers for wallet changes
function handleAccountsChanged(accounts: string[]) {
  if (accounts.length === 0) {
    // User disconnected wallet
    disconnectWallet();
    window.location.reload();
  } else {
    // User changed account
    const newAddress = accounts[0];
    walletStatus.address = newAddress;
    localStorage.setItem("wallet_address", newAddress);
    window.location.reload();
  }
}

function handleChainChanged(chainId: string) {
  // Reload page on chain change
  window.location.reload();
}

// Initialize provider
async function initializeProvider(): Promise<ethers.BrowserProvider> {
  if (!window.ethereum) {
    throw new Error('No wallet detected. Please install MetaMask or another Web3 wallet.');
  }
  
  provider = new ethers.BrowserProvider(window.ethereum);
  return provider;
}

export async function connectWallet(): Promise<string> {
  try {
    // Check if wallet is available
    if (!window.ethereum) {
      throw new Error('No wallet detected. Please install MetaMask or another Web3 wallet.');
    }

    await initializeProvider();
    
    // Request account access
    const accounts = await window.ethereum.request({
      method: 'eth_requestAccounts',
    });

    if (!accounts || accounts.length === 0) {
      throw new Error('No accounts found. Please check your wallet.');
    }

    const address = accounts[0];
    signer = await provider!.getSigner();
    
    // Get network information
    const network = await provider!.getNetwork();
    const chainId = Number(network.chainId);

    // Register wallet connection with backend
    try {
      await apiRequest("POST", "/api/wallet/connect", {
        walletAddress: address,
        chainId: chainId,
      });
    } catch (error) {
      console.warn('Failed to register wallet with backend:', error);
      // Continue even if backend registration fails
    }
    
    walletStatus = {
      isConnected: true,
      address: address,
      chainId: chainId,
    };
    
    // Store in localStorage for persistence
    localStorage.setItem("wallet_address", address);
    localStorage.setItem("wallet_connected", "true");
    localStorage.setItem("wallet_chainId", chainId.toString());
    
    // Listen for account changes
    window.ethereum.on('accountsChanged', handleAccountsChanged);
    window.ethereum.on('chainChanged', handleChainChanged);
    
    return address;
  } catch (error) {
    console.error('Wallet connection error:', error);
    throw error;
  }
}

export function disconnectWallet(): void {
  // Remove event listeners
  if (window.ethereum) {
    window.ethereum.removeListener('accountsChanged', handleAccountsChanged);
    window.ethereum.removeListener('chainChanged', handleChainChanged);
  }

  walletStatus = {
    isConnected: false,
    address: null,
  };
  
  provider = null;
  signer = null;
  
  localStorage.removeItem("wallet_address");
  localStorage.removeItem("wallet_connected");
  localStorage.removeItem("wallet_chainId");
}

export function getWalletStatus(): WalletStatus {
  // Check localStorage for persisted connection
  const savedAddress = localStorage.getItem("wallet_address");
  const isConnected = localStorage.getItem("wallet_connected") === "true";
  const chainId = localStorage.getItem("wallet_chainId");
  
  if (isConnected && savedAddress) {
    walletStatus = {
      isConnected: true,
      address: savedAddress,
      chainId: chainId ? parseInt(chainId) : undefined,
    };
  }
  
  return walletStatus;
}

// Check if wallet is already connected on page load
export async function checkWalletConnection(): Promise<boolean> {
  if (!window.ethereum) {
    return false;
  }

  try {
    const accounts = await window.ethereum.request({
      method: 'eth_accounts',
    });

    if (accounts && accounts.length > 0) {
      await initializeProvider();
      signer = await provider!.getSigner();
      
      const address = accounts[0];
      const network = await provider!.getNetwork();
      const chainId = Number(network.chainId);

      walletStatus = {
        isConnected: true,
        address: address,
        chainId: chainId,
      };

      // Update localStorage
      localStorage.setItem("wallet_address", address);
      localStorage.setItem("wallet_connected", "true");
      localStorage.setItem("wallet_chainId", chainId.toString());

      // Set up event listeners
      window.ethereum.on('accountsChanged', handleAccountsChanged);
      window.ethereum.on('chainChanged', handleChainChanged);

      return true;
    }
  } catch (error) {
    console.error('Error checking wallet connection:', error);
  }

  return false;
}

export async function signMessage(message: string): Promise<string> {
  if (!walletStatus.isConnected || !signer) {
    throw new Error("Wallet not connected");
  }
  
  try {
    const signature = await signer.signMessage(message);
    return signature;
  } catch (error) {
    console.error('Error signing message:', error);
    throw error;
  }
}

export async function sendTransaction(to: string, value: string): Promise<string> {
  if (!walletStatus.isConnected || !signer) {
    throw new Error("Wallet not connected");
  }
  
  try {
    const tx = await signer.sendTransaction({
      to: to,
      value: ethers.parseEther(value),
    });
    
    return tx.hash;
  } catch (error) {
    console.error('Error sending transaction:', error);
    throw error;
  }
}

export async function getBalance(): Promise<string> {
  if (!walletStatus.isConnected || !provider || !walletStatus.address) {
    throw new Error("Wallet not connected");
  }
  
  try {
    const balance = await provider.getBalance(walletStatus.address);
    return ethers.formatEther(balance);
  } catch (error) {
    console.error('Error getting balance:', error);
    throw error;
  }
}

// Contract interaction functions
export async function mintRight(rightData: any): Promise<string> {
  if (!walletStatus.isConnected || !signer) {
    throw new Error("Wallet not connected");
  }
  
  // This would interact with your smart contract
  // For now, return a mock transaction hash
  console.log('Minting right:', rightData);
  
  // In production, you would:
  // 1. Create contract instance
  // 2. Call mint function
  // 3. Return transaction hash
  
  return new Promise((resolve) => {
    setTimeout(() => {
      const mockTxHash = `0x${Math.random().toString(16).substr(2, 64)}`;
      resolve(mockTxHash);
    }, 3000);
  });
}

export async function transferRight(tokenId: number, to: string): Promise<string> {
  if (!walletStatus.isConnected || !signer) {
    throw new Error("Wallet not connected");
  }
  
  // This would interact with your smart contract
  console.log('Transferring right:', { tokenId, to });
  
  // In production, you would:
  // 1. Create contract instance
  // 2. Call transfer function
  // 3. Return transaction hash
  
  return new Promise((resolve) => {
    setTimeout(() => {
      const mockTxHash = `0x${Math.random().toString(16).substr(2, 64)}`;
      resolve(mockTxHash);
    }, 2000);
  });
}

// Network utilities
export async function switchToMainnet(): Promise<void> {
  if (!window.ethereum) {
    throw new Error('No wallet detected');
  }

  try {
    await window.ethereum.request({
      method: 'wallet_switchEthereumChain',
      params: [{ chainId: '0x1' }], // Mainnet
    });
  } catch (error) {
    console.error('Error switching network:', error);
    throw error;
  }
}

export async function addTokenToWallet(tokenAddress: string, tokenSymbol: string, tokenDecimals: number): Promise<void> {
  if (!window.ethereum) {
    throw new Error('No wallet detected');
  }

  try {
    await window.ethereum.request({
      method: 'wallet_watchAsset',
      params: {
        type: 'ERC20',
        options: {
          address: tokenAddress,
          symbol: tokenSymbol,
          decimals: tokenDecimals,
        },
      },
    });
  } catch (error) {
    console.error('Error adding token to wallet:', error);
    throw error;
  }
}