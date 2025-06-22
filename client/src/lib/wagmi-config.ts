import { http, createConfig } from 'wagmi'
import { mainnet, sepolia, arbitrum, polygon, base, optimism } from 'wagmi/chains'
import { injected, metaMask, walletConnect } from 'wagmi/connectors'

// Get environment variables with Vite's import.meta.env
const projectId = import.meta.env.VITE_WALLETCONNECT_PROJECT_ID || 'demo-project-id'

// Simple wagmi configuration without Web3Modal dependencies
export const wagmiConfig = createConfig({
  chains: [mainnet, sepolia, arbitrum, polygon, base, optimism],
  connectors: [
    injected(),
    metaMask(),
    walletConnect({
      projectId,
      metadata: {
        name: 'Dright - Rights Marketplace',
        description: 'Hedera NFT marketplace for tokenizing legal rights',
        url: typeof window !== 'undefined' ? window.location.origin : 'https://dright.com',
        icons: ['/favicon.ico']
      }
    }),
  ],
  transports: {
    [mainnet.id]: http(),
    [sepolia.id]: http(),
    [arbitrum.id]: http(),
    [polygon.id]: http(),
    [base.id]: http(),
    [optimism.id]: http(),
  },
})