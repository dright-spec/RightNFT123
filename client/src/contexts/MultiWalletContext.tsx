import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import { queryClient } from '@/lib/queryClient';
import { hederaWalletService, HederaWalletInfo } from '@/lib/hedera-wallet-connect';

export type WalletType = 'metamask' | 'hashpack' | null;
export type NetworkType = 'ethereum' | 'hedera' | null;

interface MultiWalletContextType {
  // Wallet connection state
  walletType: WalletType;
  networkType: NetworkType;
  walletAddress: string | null;
  hederaAccountId: string | null;
  isConnecting: boolean;
  
  // User authentication state
  isAuthenticated: boolean;
  user: any | null;
  
  // Actions
  connectWallet: (type: WalletType) => Promise<void>;
  disconnectWallet: () => Promise<void>;
  switchNetwork: (network: NetworkType) => Promise<void>;
}

const MultiWalletContext = createContext<MultiWalletContextType | undefined>(undefined);

export function MultiWalletProvider({ children }: { children: ReactNode }) {
  const [walletType, setWalletType] = useState<WalletType>(null);
  const [networkType, setNetworkType] = useState<NetworkType>(null);
  const [walletAddress, setWalletAddress] = useState<string | null>(null);
  const [hederaAccountId, setHederaAccountId] = useState<string | null>(null);
  const [isConnecting, setIsConnecting] = useState(false);

  // Query for current user authentication status
  const { data: authData, isLoading: authLoading } = useQuery({
    queryKey: ['/api/auth/me'],
    retry: false,
  });

  const isAuthenticated = authData && authData.isAuthenticated === true;
  const user = isAuthenticated && authData ? authData : null;

  // Mutation for wallet connection
  const connectWalletMutation = useMutation({
    mutationFn: async ({ address, type, network, hederaId }: { 
      address?: string; 
      type: WalletType; 
      network: NetworkType;
      hederaId?: string;
    }) => {
      const response = await fetch('/api/wallet/connect', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          walletAddress: address,
          hederaAccountId: hederaId,
          walletType: type,
          network: network
        }),
      });
      
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to connect wallet');
      }
      
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/auth/me'] });
    },
  });

  // Connect MetaMask
  const connectMetaMask = async () => {
    if (!window.ethereum) {
      throw new Error('MetaMask not installed');
    }

    try {
      const accounts = await window.ethereum.request({ 
        method: 'eth_requestAccounts' 
      });
      
      if (accounts.length === 0) {
        throw new Error('No accounts found');
      }

      const address = accounts[0];
      setWalletAddress(address);
      setWalletType('metamask');
      setNetworkType('ethereum');
      setHederaAccountId(null);

      // Authenticate with backend
      await connectWalletMutation.mutateAsync({
        address,
        type: 'metamask',
        network: 'ethereum'
      });
    } catch (error) {
      console.error('MetaMask connection error:', error);
      throw error;
    }
  };

  // Connect HashPack
  const connectHashPack = async () => {
    try {
      // Initialize Hedera wallet service
      await hederaWalletService.initialize('mainnet');
      
      // Connect to HashPack
      const walletInfo = await hederaWalletService.connect();
      
      setHederaAccountId(walletInfo.accountId);
      setWalletType('hashpack');
      setNetworkType('hedera');
      setWalletAddress(null);

      // Authenticate with backend
      await connectWalletMutation.mutateAsync({
        hederaId: walletInfo.accountId,
        type: 'hashpack',
        network: 'hedera'
      });
    } catch (error) {
      console.error('HashPack connection error:', error);
      throw error;
    }
  };

  // Main connect wallet function
  const connectWallet = async (type: WalletType) => {
    if (!type) return;
    
    setIsConnecting(true);
    try {
      if (type === 'metamask') {
        await connectMetaMask();
      } else if (type === 'hashpack') {
        await connectHashPack();
      }
    } finally {
      setIsConnecting(false);
    }
  };

  // Disconnect wallet
  const disconnectWallet = async () => {
    try {
      if (walletType === 'hashpack') {
        await hederaWalletService.disconnect();
      }
      
      // Clear local state
      setWalletType(null);
      setNetworkType(null);
      setWalletAddress(null);
      setHederaAccountId(null);
      
      // Logout from backend
      await fetch('/api/auth/logout', { method: 'POST' });
      queryClient.invalidateQueries({ queryKey: ['/api/auth/me'] });
    } catch (error) {
      console.error('Disconnect error:', error);
    }
  };

  // Switch network (future implementation)
  const switchNetwork = async (network: NetworkType) => {
    // This would handle switching between networks
    console.log('Network switching not yet implemented');
  };

  // Listen for MetaMask account changes
  useEffect(() => {
    if (!window.ethereum) return;

    const handleAccountsChanged = (accounts: string[]) => {
      if (accounts.length === 0) {
        disconnectWallet();
      } else if (walletType === 'metamask' && accounts[0] !== walletAddress) {
        setWalletAddress(accounts[0]);
        // Re-authenticate with new address
        connectWalletMutation.mutate({
          address: accounts[0],
          type: 'metamask',
          network: 'ethereum'
        });
      }
    };

    window.ethereum?.on('accountsChanged', handleAccountsChanged);
    return () => {
      window.ethereum?.removeListener('accountsChanged', handleAccountsChanged);
    };
  }, [walletType, walletAddress]);

  const contextValue: MultiWalletContextType = {
    walletType,
    networkType,
    walletAddress,
    hederaAccountId,
    isConnecting,
    isAuthenticated,
    user,
    connectWallet,
    disconnectWallet,
    switchNetwork,
  };

  return (
    <MultiWalletContext.Provider value={contextValue}>
      {children}
    </MultiWalletContext.Provider>
  );
}

export function useMultiWallet() {
  const context = useContext(MultiWalletContext);
  if (!context) {
    throw new Error('useMultiWallet must be used within MultiWalletProvider');
  }
  return context;
}

// Ethereum type declarations
declare global {
  interface Window {
    ethereum?: {
      request: (args: { method: string; params?: any[] }) => Promise<any>;
      on: (event: string, callback: (...args: any[]) => void) => void;
      removeListener: (event: string, callback: (...args: any[]) => void) => void;
    };
  }
}