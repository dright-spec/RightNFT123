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
      className="flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-lg hover:from-blue-700 hover:to-purple-700 transition-all duration-200 font-medium"
    >
      <span className="text-lg">🔗</span>
      Connect Wallet
    </button>
  );
}

// Alternative simple modal component that matches the design
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
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-gray-900 rounded-2xl p-8 max-w-sm w-full mx-4 text-center text-white">
        <h2 className="text-xl font-bold mb-2">Hedera dapp</h2>
        <p className="text-gray-400 mb-6 text-sm">
          Connect any Hedera wallet using WalletConnect to continue
        </p>
        
        <button
          onClick={connectWallet}
          className="w-full bg-white text-black font-medium py-3 px-6 rounded-lg hover:bg-gray-100 transition-colors mb-4"
        >
          ⭐ CONNECT WALLET
        </button>
        
        <p className="text-xs text-gray-500">All Hedera wallets supported.</p>
        
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-gray-400 hover:text-white"
        >
          ✕
        </button>
      </div>
    </div>
  );
}