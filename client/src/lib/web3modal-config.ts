import { http, createConfig } from 'wagmi'
import { mainnet, sepolia } from 'wagmi/chains'
import { injected, metaMask } from 'wagmi/connectors'

// Define custom Hedera testnet
const hederaTestnet = {
  id: 296,
  name: 'Hedera Testnet',
  nativeCurrency: {
    decimals: 8,
    name: 'HBAR',
    symbol: 'HBAR',
  },
  rpcUrls: {
    default: { http: ['https://testnet.hashio.io/api'] },
  },
  blockExplorers: {
    default: { name: 'HashScan', url: 'https://hashscan.io/testnet' },
  },
}

export const config = createConfig({
  chains: [hederaTestnet, mainnet, sepolia],
  connectors: [
    injected(),
    metaMask(),
  ],
  transports: {
    [hederaTestnet.id]: http(),
    [mainnet.id]: http(),
    [sepolia.id]: http(),
  },
})