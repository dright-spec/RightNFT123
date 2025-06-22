// Web3Modal configuration for wallet connections
import { defaultWagmiConfig } from '@web3modal/wagmi/react/config'
import { arbitrum, mainnet, polygon, sepolia, base, optimism } from 'wagmi/chains'
import { QueryClient } from '@tanstack/react-query'
import { createWeb3Modal } from '@web3modal/wagmi/react'

// WalletConnect Project ID - you'll need to get this from https://cloud.walletconnect.com
const projectId = process.env.VITE_WALLETCONNECT_PROJECT_ID || 'demo-project-id'

// Create a metadata object for the dApp
const metadata = {
  name: 'Dright - Rights Marketplace',
  description: 'Hedera NFT marketplace for tokenizing legal rights',
  url: typeof window !== 'undefined' ? window.location.origin : 'https://dright.com',
  icons: ['/favicon.ico']
}

// Define chains (including Ethereum for broader wallet compatibility)
const chains = [mainnet, arbitrum, polygon, base, optimism, sepolia] as const

// Create wagmi configuration
export const wagmiConfig = defaultWagmiConfig({
  chains,
  projectId,
  metadata,
  enableCoinbase: true,
  enableInjected: true,
  enableEIP6963: true,
  enableEmail: false, // Disable email login for cleaner experience
})

// Create the Web3Modal instance
export const web3Modal = createWeb3Modal({
  wagmiConfig,
  projectId,
  enableAnalytics: false, // Privacy-focused
  enableOnramp: false, // Disable fiat on-ramp for simplicity
  themeMode: 'dark',
  themeVariables: {
    '--w3m-color-mix': '#6366f1',
    '--w3m-color-mix-strength': 20,
    '--w3m-font-family': 'Inter, system-ui, sans-serif',
    '--w3m-border-radius-master': '8px'
  },
  featuredWalletIds: [
    // MetaMask
    'c57ca95b47569778a828d19178114f4db188b89b763c899ba0be274e97267d96',
    // WalletConnect
    '4622a2b2d6af1c9844944291e5e7351a6aa24cd7b23099efac1b2fd875da31a0',
    // Coinbase Wallet  
    'fd20dc426fb37566d803205b19bbc1d4096b248ac04548e3cfb6b3a38bd033aa',
    // Trust Wallet
    '4457fd9d3f6bfe4b9fb63e8b92ff88e07b85a1d0a35d1b1b54827ac1fedf4f11'
  ]
})

// Export wagmiConfig as 'config' for compatibility
export const config = wagmiConfig;