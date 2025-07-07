import { useState, useEffect } from "react";
import { createWeb3Modal, defaultConfig } from '@web3modal/ethers/react';
import { BrowserProvider } from 'ethers';

// 1. Get projectId from environment
const projectId = import.meta.env.VITE_WALLETCONNECT_PROJECT_ID || 'your-project-id';

// 2. Set chains (we'll focus on Hedera but include some common chains)
const chains = [
  {
    chainId: 1,
    name: 'Ethereum',
    currency: 'ETH',
    explorerUrl: 'https://etherscan.io',
    rpcUrl: 'https://cloudflare-eth.com'
  },
  {
    chainId: 295,
    name: 'Hedera Mainnet',
    currency: 'HBAR',
    explorerUrl: 'https://hashscan.io/mainnet',
    rpcUrl: 'https://mainnet.hashio.io/api'
  },
  {
    chainId: 296,
    name: 'Hedera Testnet', 
    currency: 'HBAR',
    explorerUrl: 'https://hashscan.io/testnet',
    rpcUrl: 'https://testnet.hashio.io/api'
  }
];

// 3. Create modal config
const metadata = {
  name: 'Dright - Rights Marketplace',
  description: 'Hedera NFT marketplace for tokenizing legal rights',
  url: window.location.origin,
  icons: [window.location.origin + '/favicon.ico']
};

const config = defaultConfig({
  metadata,
  defaultChainId: 296, // Hedera Testnet
  rpcUrl: 'https://testnet.hashio.io/api'
});

// 4. Create modal
createWeb3Modal({
  ethersConfig: config,
  chains,
  projectId,
  enableAnalytics: false,
  themeMode: 'dark',
  themeVariables: {
    '--w3m-color-mix': '#00ff87',
    '--w3m-color-mix-strength': 20,
    '--w3m-accent': '#00D4AA',
    '--w3m-border-radius-master': '12px'
  }
});

interface WalletConnectButtonProps {
  onConnect?: (address: string) => void;
  onDisconnect?: () => void;
}

export function WalletConnectButton({ onConnect, onDisconnect }: WalletConnectButtonProps) {
  const [isConnected, setIsConnected] = useState(false);
  const [address, setAddress] = useState<string>('');

  useEffect(() => {
    // Check connection status on mount
    checkConnection();
    
    // Listen for account changes
    if (typeof window !== 'undefined' && (window as any).ethereum) {
      (window as any).ethereum.on('accountsChanged', handleAccountsChanged);
      (window as any).ethereum.on('disconnect', handleDisconnect);
    }

    return () => {
      if (typeof window !== 'undefined' && (window as any).ethereum) {
        (window as any).ethereum.removeListener('accountsChanged', handleAccountsChanged);
        (window as any).ethereum.removeListener('disconnect', handleDisconnect);
      }
    };
  }, []);

  const checkConnection = async () => {
    try {
      if (typeof window !== 'undefined' && (window as any).ethereum) {
        const provider = new BrowserProvider((window as any).ethereum);
        const accounts = await provider.listAccounts();
        
        if (accounts.length > 0) {
          const userAddress = accounts[0].address;
          setIsConnected(true);
          setAddress(userAddress);
          onConnect?.(userAddress);
        }
      }
    } catch (error) {
      console.error('Error checking connection:', error);
    }
  };

  const handleAccountsChanged = (accounts: string[]) => {
    if (accounts.length === 0) {
      handleDisconnect();
    } else {
      setIsConnected(true);
      setAddress(accounts[0]);
      onConnect?.(accounts[0]);
    }
  };

  const handleDisconnect = () => {
    setIsConnected(false);
    setAddress('');
    onDisconnect?.();
  };

  const connectWallet = async () => {
    try {
      // Use Web3Modal to connect
      const modal = document.querySelector('w3m-modal');
      if (modal) {
        (modal as any).open();
      } else {
        // Fallback: direct connection
        if (typeof window !== 'undefined' && (window as any).ethereum) {
          const provider = new BrowserProvider((window as any).ethereum);
          const accounts = await provider.send('eth_requestAccounts', []);
          
          if (accounts.length > 0) {
            setIsConnected(true);
            setAddress(accounts[0]);
            onConnect?.(accounts[0]);
          }
        }
      }
    } catch (error) {
      console.error('Connection failed:', error);
    }
  };

  const disconnectWallet = async () => {
    try {
      // Disconnect via Web3Modal
      const modal = document.querySelector('w3m-modal');
      if (modal) {
        (modal as any).disconnect();
      }
      handleDisconnect();
    } catch (error) {
      console.error('Disconnect failed:', error);
      handleDisconnect();
    }
  };

  if (isConnected) {
    return (
      <div className="flex items-center gap-3">
        <div className="text-sm">
          <div className="font-medium">Connected</div>
          <div className="text-gray-500 text-xs">
            {address.slice(0, 6)}...{address.slice(-4)}
          </div>
        </div>
        <button
          onClick={disconnectWallet}
          className="px-4 py-2 text-sm bg-red-100 text-red-700 rounded-lg hover:bg-red-200 transition-colors"
        >
          Disconnect
        </button>
      </div>
    );
  }

  return (
    <button
      onClick={connectWallet}
      className="flex items-center gap-3 px-6 py-3 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-xl hover:from-blue-700 hover:to-purple-700 transition-all duration-200 font-semibold shadow-lg hover:shadow-xl transform hover:scale-[1.02] active:scale-[0.98]"
    >
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
        <path d="M13 3C13.55 3 14 3.45 14 4V10C14 10.55 13.55 11 13 11H11C10.45 11 10 10.55 10 10V4C10 3.45 10.45 3 11 3H13ZM15.5 6.5C15.78 6.5 16 6.72 16 7V17C16 17.28 15.78 17.5 15.5 17.5S15 17.28 15 17V7C15 6.72 15.22 6.5 15.5 6.5ZM8.5 6.5C8.78 6.5 9 6.72 9 7V17C17 17.28 8.78 17.5 8.5 17.5S8 17.28 8 17V7C8 6.72 8.22 6.5 8.5 6.5ZM6 10C6.55 10 7 10.45 7 11V13C7 13.55 6.55 14 6 14H4C3.45 14 3 13.55 3 13V11C3 10.45 3.45 10 4 10H6ZM20 10C20.55 10 21 10.45 21 11V13C21 13.55 20.55 14 20 14H18C17.45 14 17 13.55 17 13V11C17 10.45 17.45 10 18 10H20Z" fill="currentColor"/>
      </svg>
      <span>Connect Wallet</span>
    </button>
  );
}

// Sleek WalletConnect Modal with Official Branding
export function SimpleWalletModal({ open, onClose }: { open: boolean; onClose: () => void }) {
  if (!open) return null;

  const connectWallet = () => {
    // Trigger Web3Modal
    const modal = document.querySelector('w3m-modal');
    if (modal) {
      (modal as any).open();
    }
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 animate-in fade-in duration-200">
      <div className="bg-white dark:bg-gray-900 rounded-3xl p-8 max-w-md w-full mx-4 shadow-2xl border border-gray-200 dark:border-gray-700 animate-in zoom-in-95 duration-300">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="w-16 h-16 bg-gradient-to-r from-blue-500 to-purple-600 rounded-2xl mx-auto mb-4 flex items-center justify-center">
            <svg width="32" height="32" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M12 2L13.09 8.26L19 7L17.91 13.26L23 12L21.91 18.26L18 17L16.91 23.26L12 22L7.09 23.26L6 17L2.09 18.26L1 12L5.09 13.26L4 7L10.91 8.26L12 2Z" fill="white"/>
            </svg>
          </div>
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">Connect Wallet</h2>
          <p className="text-gray-600 dark:text-gray-400 text-sm leading-relaxed">
            Connect your wallet to access the Hedera ecosystem and start trading rights
          </p>
        </div>

        {/* Connect Button */}
        <button
          onClick={connectWallet}
          className="w-full bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white font-semibold py-4 px-6 rounded-2xl transition-all duration-200 transform hover:scale-[1.02] active:scale-[0.98] mb-6 shadow-lg hover:shadow-xl"
        >
          <div className="flex items-center justify-center gap-3">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M13 3C13.55 3 14 3.45 14 4V10C14 10.55 13.55 11 13 11H11C10.45 11 10 10.55 10 10V4C10 3.45 10.45 3 11 3H13ZM15.5 6.5C15.78 6.5 16 6.72 16 7V17C16 17.28 15.78 17.5 15.5 17.5S15 17.28 15 17V7C15 6.72 15.22 6.5 15.5 6.5ZM8.5 6.5C8.78 6.5 9 6.72 9 7V17C9 17.28 8.78 17.5 8.5 17.5S8 17.28 8 17V7C8 6.72 8.22 6.5 8.5 6.5ZM6 10C6.55 10 7 10.45 7 11V13C7 13.55 6.55 14 6 14H4C3.45 14 3 13.55 3 13V11C3 10.45 3.45 10 4 10H6ZM20 10C20.55 10 21 10.45 21 11V13C21 13.55 20.55 14 20 14H18C17.45 14 17 13.55 17 13V11C17 10.45 17.45 10 18 10H20Z" fill="currentColor"/>
            </svg>
            <span>CONNECT WALLET</span>
          </div>
        </button>

        {/* Features */}
        <div className="space-y-3 mb-6">
          <div className="flex items-center gap-3 text-sm text-gray-600 dark:text-gray-400">
            <div className="w-2 h-2 bg-green-500 rounded-full"></div>
            <span>Secure connection via WalletConnect protocol</span>
          </div>
          <div className="flex items-center gap-3 text-sm text-gray-600 dark:text-gray-400">
            <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
            <span>Support for all major Hedera wallets</span>
          </div>
          <div className="flex items-center gap-3 text-sm text-gray-600 dark:text-gray-400">
            <div className="w-2 h-2 bg-purple-500 rounded-full"></div>
            <span>Native HTS token support</span>
          </div>
        </div>

        {/* Powered by */}
        <div className="text-center pt-4 border-t border-gray-200 dark:border-gray-700">
          <div className="flex items-center justify-center gap-2 text-xs text-gray-500">
            <span>Powered by</span>
            <div className="flex items-center gap-1 font-medium">
              <div className="w-4 h-4 bg-gradient-to-r from-blue-500 to-purple-600 rounded"></div>
              <span>WalletConnect</span>
            </div>
          </div>
        </div>

        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 w-8 h-8 flex items-center justify-center rounded-lg text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M18 6L6 18M6 6l12 12" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
        </button>
      </div>
    </div>
  );
}