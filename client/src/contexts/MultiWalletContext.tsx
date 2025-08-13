import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import { queryClient } from '@/lib/queryClient';
import { hederaWalletManager } from '@/lib/hedera-wallet-manager';
import { hederaWalletService, HederaWalletInfo } from '@/lib/hedera-wallet-connect';

export type WalletType = 'walletconnect' | 'metamask' | null;
export type NetworkType = 'hedera' | 'ethereum' | null;

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

  const isAuthenticated = Boolean(authData && (authData as any).isAuthenticated === true);
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

  // Connect WalletConnect (Hedera via WalletConnect)
  const connectWalletConnect = async () => {
    try {
      console.log('Starting WalletConnect connection process...');
      
      // Initialize Hedera wallet service with WalletConnect
      await hederaWalletService.initialize();
      console.log('Hedera WalletConnect service initialized');
      
      // Connect using WalletConnect
      const walletInfo = await hederaWalletService.connect();
      console.log('WalletConnect connected with account:', walletInfo.accountId);
      
      // Update state
      setHederaAccountId(walletInfo.accountId);
      setWalletType('walletconnect');
      setNetworkType('hedera');
      setWalletAddress(null); // Clear Ethereum address
      
      // Authenticate with backend using Hedera account
      await connectWalletMutation.mutateAsync({
        hederaId: walletInfo.accountId,
        type: 'walletconnect',
        network: 'hedera'
      });
      
      console.log('WalletConnect wallet connected and authenticated successfully');
      
    } catch (error) {
      console.error('WalletConnect connection error:', error);
      throw error;
    }
  };

  // Connect MetaMask (LEGACY ETHEREUM SUPPORT)
  const connectMetaMask = async () => {
    console.warn('MetaMask connection deprecated - Hedera/HashPack is now the primary wallet');
    
    if (!window.ethereum) {
      throw new Error('MetaMask not installed. Please use HashPack for the best experience on Hedera.');
    }

    try {
      const accounts = await (window.ethereum as any).request({ 
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

  // Main connect wallet function
  const connectWallet = async (type: WalletType) => {
    if (!type) return;
    
    setIsConnecting(true);
    try {
      if (type === 'walletconnect') {
        await connectWalletConnect();
      } else if (type === 'metamask') {
        await connectMetaMask();
      }
    } finally {
      setIsConnecting(false);
    }
  };

  // Disconnect wallet
  const disconnectWallet = async () => {
    try {
      if (walletType === 'walletconnect') {
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

  // Switch network (for Hedera mainnet/testnet)
  const switchNetwork = async (network: NetworkType) => {
    console.log('Network switching:', network);
    setNetworkType(network);
  };

  // Listen for MetaMask account changes (legacy support)
  useEffect(() => {
    if (!window.ethereum) return;

    const handleAccountsChanged = (accounts: string[]) => {
      if (accounts.length === 0) {
        disconnectWallet();
      } else if (walletType === 'metamask') {
        setWalletAddress(accounts[0]);
      }
    };

    (window.ethereum as any).on('accountsChanged', handleAccountsChanged);
    return () => {
      (window.ethereum as any).removeListener('accountsChanged', handleAccountsChanged);
    };
  }, [walletType]);

  // Context value with Hedera as primary blockchain
  const value: MultiWalletContextType = {
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
    <MultiWalletContext.Provider value={value}>
      {children}
    </MultiWalletContext.Provider>
  );
}

export function useMultiWallet() {
  const context = useContext(MultiWalletContext);
  if (context === undefined) {
    throw new Error('useMultiWallet must be used within a MultiWalletProvider');
  }
  return context;
}