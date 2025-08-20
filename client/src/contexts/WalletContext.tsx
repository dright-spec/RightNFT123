import React, { createContext, useContext, useEffect, ReactNode, useState } from 'react'
import { WagmiProvider, useAccount, useDisconnect, useConnect, useBalance, useChainId, useSwitchChain } from 'wagmi'
import { QueryClient, QueryClientProvider, useQuery } from '@tanstack/react-query'
import { config } from '@/lib/walletconnect'

// Create React Query client
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 3,
      staleTime: 1000 * 60 * 5, // 5 minutes
    },
  },
})

interface WalletContextType {
  // Connection state
  isConnected: boolean
  address: string | undefined
  chainId: number | undefined
  isConnecting: boolean
  
  // Account info
  balance: string | undefined
  isBalanceLoading: boolean
  account?: {
    id: number;
    username: string;
    walletAddress: string;
    hederaAccountId?: string;
  }
  setAccount?: (account: any) => void;
  
  // Network info
  isHedera: boolean
  networkName: string
  
  // Actions
  disconnect: () => void
  switchToHedera: () => Promise<void>
  switchToMainnet: () => Promise<void>
}

const WalletContext = createContext<WalletContextType | undefined>(undefined)

function WalletProviderInner({ children }: { children: ReactNode }) {
  const { address, isConnected, chainId } = useAccount()
  const { disconnect } = useDisconnect()
  const { isPending: isConnecting } = useConnect()
  const { switchChain } = useSwitchChain()
  const [account, setAccount] = useState<any>(null)

  // Check for existing session on app load
  const { data: sessionUser, error: sessionError, isLoading: sessionLoading } = useQuery({
    queryKey: ['/api/auth/me'],
    queryFn: async () => {
      const response = await fetch('/api/auth/me', {
        credentials: 'include'
      });
      if (!response.ok) {
        throw new Error('Not authenticated');
      }
      return response.json();
    },
    retry: false,
    refetchOnWindowFocus: false,
    staleTime: 1000 * 60 * 5, // 5 minutes
  })

  // Update account state when session data changes
  useEffect(() => {
    if (sessionUser?.user && !sessionError) {
      setAccount({
        ...sessionUser.user,
        isConnected: true,
        userId: sessionUser.user.id
      });
      console.log('Session restored for user:', sessionUser.user.username);
    } else if (sessionError || sessionUser === null) {
      // No valid session, clear account
      if (account) {
        setAccount(null);
        console.log('Session expired or invalid, user logged out');
      }
    }
  }, [sessionUser, sessionError, account])

  // Auto-connect when wallet connects if no session exists
  useEffect(() => {
    if (isConnected && address && !account && !sessionLoading) {
      console.log('Wallet connected but no session, auto-registering...');
      handleWalletConnect(address);
    }
  }, [isConnected, address, account, sessionLoading])

  // Handle wallet connection and registration
  const handleWalletConnect = async (walletAddress: string) => {
    try {
      const hederaAccountId = walletAddress.startsWith('hedera:') 
        ? walletAddress.split(':')[2] 
        : undefined;

      const response = await fetch('/api/auth/wallet-connect', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          walletAddress,
          hederaAccountId,
          walletType: 'hashpack',
        }),
        credentials: 'include' // Include cookies
      });

      const data = await response.json();
      
      if (data.success) {
        setAccount({
          ...data.data.user,
          isConnected: true,
          userId: data.data.user.id
        });
        console.log('User registered/logged in successfully:', data.data.user.username);
        
        // Refresh session query to update UI  
        queryClient.invalidateQueries({ queryKey: ['/api/auth/me'] });
      } else {
        console.error('Wallet connection failed:', data.message);
      }
    } catch (error) {
      console.error('Wallet connection error:', error);
    }
  };

  // Enhanced disconnect function
  const handleDisconnect = async () => {
    try {
      // Call logout endpoint to destroy session
      await fetch('/api/auth/logout', {
        method: 'POST',
        credentials: 'include'
      });
      
      // Clear local state
      setAccount(null);
      
      // Disconnect wallet
      disconnect();
      
      // Clear query cache
      queryClient.clear();
      
      console.log('User logged out successfully');
    } catch (error) {
      console.error('Logout error:', error);
      // Still clear local state even if API call fails
      setAccount(null);
      disconnect();
    }
  };
  
  const { data: balanceData, isLoading: isBalanceLoading } = useBalance({
    address: address,
  })
  
  // Format balance
  const balance = balanceData ? `${parseFloat(balanceData.formatted).toFixed(4)} ${balanceData.symbol}` : undefined
  
  // Network detection
  const isHedera = chainId === 295 || chainId === 296
  const networkName = chainId === 295 ? 'Hedera Mainnet' : 
                     chainId === 296 ? 'Hedera Testnet' : 
                     chainId === 1 ? 'Ethereum' : 
                     chainId === 137 ? 'Polygon' : 
                     'Unknown Network'
  
  // Network switching functions
  const switchToHedera = async () => {
    try {
      await switchChain({ chainId: 296 }) // Switch to Hedera Testnet
    } catch (error) {
      console.error('Failed to switch to Hedera:', error)
      throw error
    }
  }
  
  const switchToMainnet = async () => {
    try {
      await switchChain({ chainId: 295 }) // Switch to Hedera Mainnet
    } catch (error) {
      console.error('Failed to switch to Hedera Mainnet:', error)
      throw error
    }
  }
  
  const contextValue: WalletContextType = {
    isConnected: account?.isConnected || false,
    address: account?.walletAddress || address,
    chainId,
    isConnecting,
    balance,
    isBalanceLoading,
    account,
    setAccount,
    isHedera,
    networkName,
    disconnect: handleDisconnect,
    switchToHedera,
    switchToMainnet,
  }
  
  return (
    <WalletContext.Provider value={contextValue}>
      {children}
    </WalletContext.Provider>
  )
}

export function WalletProvider({ children }: { children: ReactNode }) {
  return (
    <WagmiProvider config={config}>
      <QueryClientProvider client={queryClient}>
        <WalletProviderInner>
          {children}
        </WalletProviderInner>
      </QueryClientProvider>
    </WagmiProvider>
  )
}

export function useWallet() {
  const context = useContext(WalletContext)
  if (context === undefined) {
    throw new Error('useWallet must be used within a WalletProvider')
  }
  return context
}