import { createConfig, http } from 'wagmi'
import { mainnet, arbitrum, polygon, avalanche, bsc, optimism, gnosis } from 'wagmi/chains'
import { walletConnect, injected } from 'wagmi/connectors'

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

// Create wagmi config with standard setup
export const config = createConfig({
  chains: [mainnet, arbitrum, polygon, avalanche, bsc, optimism, gnosis],
  connectors: [
    walletConnect({ projectId }),
    injected(),
  ],
  transports: {
    [mainnet.id]: http(),
    [arbitrum.id]: http(),
    [polygon.id]: http(),
    [avalanche.id]: http(),
    [bsc.id]: http(),
    [optimism.id]: http(),
    [gnosis.id]: http(),
  },
})

declare module 'wagmi' {
  interface Register {
    config: typeof config
  }
}