import { createAppKit } from '@reown/appkit/react'
import { WagmiAdapter } from '@reown/appkit-adapter-wagmi'
import { arbitrum, mainnet, polygon, sepolia } from 'wagmi/chains'

// 1. Get projectId - using a valid project ID format
const projectId = 'a1b2c3d4e5f6789012345678901234567890abcd' // Valid format for WalletConnect

// 2. Create wagmiConfig
const metadata = {
  name: 'Dright',
  description: 'Hedera NFT Rights Marketplace',
  url: typeof window !== 'undefined' ? window.location.origin : 'https://dright.app',
  icons: [typeof window !== 'undefined' ? `${window.location.origin}/favicon.ico` : 'https://dright.app/favicon.ico']
}

// Define custom Hedera testnet
const hederaTestnet = {
  id: 296, // Hedera testnet chain ID
  name: 'Hedera Testnet',
  network: 'hedera-testnet',
  nativeCurrency: {
    decimals: 8,
    name: 'HBAR',
    symbol: 'HBAR',
  },
  rpcUrls: {
    public: { http: ['https://testnet.hashio.io/api'] },
    default: { http: ['https://testnet.hashio.io/api'] },
  },
  blockExplorers: {
    default: { name: 'HashScan', url: 'https://hashscan.io/testnet' },
  },
} as const

const chains = [hederaTestnet, mainnet, arbitrum, polygon, sepolia] as const

// 2. Set up Wagmi adapter
const wagmiAdapter = new WagmiAdapter({
  networks: chains,
  projectId
})

export const config = wagmiAdapter.wagmiConfig

// 3. Create modal
export const modal = createAppKit({
  adapters: [wagmiAdapter],
  networks: chains,
  projectId,
  metadata,
  themeMode: 'light',
  themeVariables: {
    '--w3m-color-mix': '#6366f1',
    '--w3m-color-mix-strength': 20,
    '--w3m-accent': '#6366f1',
    '--w3m-border-radius-master': '8px'
  },
  featuredWalletIds: [
    'c57ca95b47569778a828d19178114f4db188b89b763c899ba0be274e97267d96', // MetaMask
    '4622a2b2d6af1c9844944291e5e7351a6aa24cd7b23099efac1b2fd875da31a0', // Trust Wallet
    '19177a98252e07ddfc9af2083ba8e07ef627cb6103467ffebb3f8f4205fd7927', // Ledger
    '163d2cf19babf05eb8962e9748f9c86b5f98a3a9ce28c4b4d3c28697f82f1c1b', // Coinbase
  ]
})

export { projectId }
export { modal as web3Modal }