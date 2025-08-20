import { createAppKit } from '@reown/appkit/react'
import { WagmiAdapter } from '@reown/appkit-adapter-wagmi'
import { arbitrum, mainnet, polygon, sepolia } from 'wagmi/chains'

// 1. Get projectId from environment
const projectId = import.meta.env.VITE_WALLETCONNECT_PROJECT_ID || 'e9dbb7f560f19eadf594a7e128200176'

// 2. Create wagmiConfig
const metadata = {
  name: 'Dright - Digital Rights Marketplace',
  description: 'Tokenize and trade legal rights as NFTs on Hedera',
  url: 'https://dright.com', 
  icons: ['https://avatars.githubusercontent.com/u/37784886']
}

// Add Hedera networks to supported chains  
const hederaTestnet = {
  id: 296,
  name: 'Hedera Testnet',
  network: 'hedera-testnet',
  nativeCurrency: { name: 'HBAR', symbol: 'HBAR', decimals: 18 },
  rpcUrls: {
    public: { http: ['https://testnet.hashio.io/api'] },
    default: { http: ['https://testnet.hashio.io/api'] },
  },
  blockExplorers: {
    etherscan: { name: 'HashScan', url: 'https://hashscan.io/testnet' },
    default: { name: 'HashScan', url: 'https://hashscan.io/testnet' },
  },
  testnet: true,
} as const

const hederaMainnet = {
  id: 295,
  name: 'Hedera Mainnet', 
  network: 'hedera-mainnet',
  nativeCurrency: { name: 'HBAR', symbol: 'HBAR', decimals: 18 },
  rpcUrls: {
    public: { http: ['https://mainnet.hashio.io/api'] },
    default: { http: ['https://mainnet.hashio.io/api'] },
  },
  blockExplorers: {
    etherscan: { name: 'HashScan', url: 'https://hashscan.io/mainnet' },
    default: { name: 'HashScan', url: 'https://hashscan.io/mainnet' },
  },
} as const

const chains = [hederaMainnet, hederaTestnet, mainnet, arbitrum, polygon, sepolia]

// 3. Set up Wagmi adapter
const wagmiAdapter = new WagmiAdapter({
  storage: typeof window !== 'undefined' ? localStorage : null,
  ssr: false,
  projectId,
  networks: [...chains] as any
})

export const config = wagmiAdapter.wagmiConfig

// 4. Create AppKit with Hedera wallet prioritization
export const appkit = createAppKit({
  adapters: [wagmiAdapter],
  projectId,
  networks: [...chains] as any,
  defaultNetwork: hederaMainnet,
  metadata,
  featuredWalletIds: [
    // HashPack - Primary Hedera wallet (most important for Hedera users)
    'f2436c67184f158d1beda5df53298ee84abfc367581e4505134b5bcf5f46467d',
    // Blade Wallet - Popular Hedera wallet
    '971e689d0a5be527bac79629b4ee9b925e82208e5168b733496a09c0faed0709',
    // MetaMask - For Ethereum compatibility  
    'c57ca95b47569778a828d19178114f4db188b89b763c899ba0be274e97267d96'
  ],
  includeWalletIds: [
    // Hedera wallets first
    'f2436c67184f158d1beda5df53298ee84abfc367581e4505134b5bcf5f46467d', // HashPack
    '971e689d0a5be527bac79629b4ee9b925e82208e5168b733496a09c0faed0709', // Blade Wallet
    // Ethereum wallets for compatibility
    'c57ca95b47569778a828d19178114f4db188b89b763c899ba0be274e97267d96', // MetaMask
    'fd20dc426fb37566d803205b19bbc1d4096b248ac04548e3cfb6b3a38bd033aa', // Coinbase Wallet
    '4622a2b2d6af1c9844944291e5e7351a6aa24cd7b23099efac1b2fd875da31a0'  // Trust Wallet
  ],
  features: {
    analytics: true,
    onramp: false,
    email: false,
    socials: false
  },
  themeMode: 'light',
  themeVariables: {
    '--w3m-color-mix': '#00D4AA',
    '--w3m-color-mix-strength': 20,
  }
})

export { projectId }