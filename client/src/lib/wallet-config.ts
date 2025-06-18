import { defaultWagmiConfig } from '@web3modal/wagmi'
import { createWeb3Modal } from '@web3modal/wagmi'
import { mainnet, arbitrum, polygon, avalanche, bsc, optimism, gnosis } from 'wagmi/chains'

// Define Hedera chains for future integration
export const hederaTestnet = {
  id: 296,
  name: 'Hedera Testnet',
  nativeCurrency: {
    decimals: 18,
    name: 'HBAR',
    symbol: 'HBAR',
  },
  rpcUrls: {
    default: {
      http: ['https://testnet.hashio.io/api'],
    },
  },
  blockExplorers: {
    default: { name: 'HashScan', url: 'https://hashscan.io/testnet' },
  },
  testnet: true,
} as const

export const hederaMainnet = {
  id: 295,
  name: 'Hedera Mainnet',
  nativeCurrency: {
    decimals: 18,
    name: 'HBAR',
    symbol: 'HBAR',
  },
  rpcUrls: {
    default: {
      http: ['https://mainnet.hashio.io/api'],
    },
  },
  blockExplorers: {
    default: { name: 'HashScan', url: 'https://hashscan.io/mainnet' },
  },
} as const

// Get project ID from environment
export const projectId = import.meta.env.VITE_WALLETCONNECT_PROJECT_ID || '2f5a2b1c3e4d5f6a7b8c9d0e1f2a3b4c'

// Create wagmi config
export const config = defaultWagmiConfig({
  chains: [mainnet, arbitrum, polygon, avalanche, bsc, optimism, gnosis], // Multiple chains for demonstration
  projectId,
  metadata: {
    name: 'Dright - Hedera NFT Rights Marketplace',
    description: 'Tokenize and trade legal rights as NFTs on Hedera blockchain',
    url: typeof window !== 'undefined' ? window.location.origin : 'https://dright.com',
    icons: ['/favicon.ico']
  }
})

// Create Web3Modal - this must be called immediately after config creation
createWeb3Modal({
  wagmiConfig: config,
  projectId,
  enableAnalytics: true,
  enableOnramp: true,
  themeMode: 'light',
  themeVariables: {
    '--w3m-font-family': 'Inter, sans-serif',
    '--w3m-accent': 'hsl(262.1 83.3% 57.8%)',
  }
})

declare module 'wagmi' {
  interface Register {
    config: typeof config
  }
}