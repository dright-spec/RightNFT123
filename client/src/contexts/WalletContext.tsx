import React, { createContext, useContext, useEffect, ReactNode } from 'react'
import { WagmiProvider, useAccount, useDisconnect, useConnect, useBalance, useChainId, useSwitchChain } from 'wagmi'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
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
  const [account, setAccount] = React.useState<any>(null)
  
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
    isConnected,
    address,
    chainId,
    isConnecting,
    balance,
    isBalanceLoading,
    account,
    setAccount,
    isHedera,
    networkName,
    disconnect,
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