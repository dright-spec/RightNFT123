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

// 4. Create AppKit
export const appkit = createAppKit({
  adapters: [wagmiAdapter],
  projectId,
  networks: [...chains] as any,
  metadata,
  features: {
    analytics: true,
    onramp: false,
  },
  themeMode: 'light',
  themeVariables: {
    '--w3m-color-mix': '#00D4AA',
    '--w3m-color-mix-strength': 20,
  }
})

export { projectId }