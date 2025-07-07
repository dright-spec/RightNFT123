import { createWeb3Modal, defaultConfig } from '@web3modal/ethers/react'

// 1. Get projectId from environment
const projectId = import.meta.env.VITE_WALLETCONNECT_PROJECT_ID

// 2. Set chains - include Hedera and Ethereum networks
const hedera = {
  chainId: 295,
  name: 'Hedera Mainnet',
  currency: 'HBAR',
  explorerUrl: 'https://hashscan.io',
  rpcUrl: 'https://mainnet.hashio.io/api'
}

const hederaTestnet = {
  chainId: 296,
  name: 'Hedera Testnet',
  currency: 'HBAR',
  explorerUrl: 'https://hashscan.io/testnet',
  rpcUrl: 'https://testnet.hashio.io/api'
}

const mainnet = {
  chainId: 1,
  name: 'Ethereum',
  currency: 'ETH',
  explorerUrl: 'https://etherscan.io',
  rpcUrl: 'https://cloudflare-eth.com'
}

// 3. Create modal configuration
const metadata = {
  name: 'Dright - Rights Marketplace',
  description: 'Tokenize and trade legal rights as NFTs on Hedera',
  url: window.location.origin,
  icons: [`${window.location.origin}/favicon.ico`]
}

// 4. Create Web3Modal config
export const web3ModalConfig = defaultConfig({
  metadata,
  enableEIP6963: true, // Enable EIP-6963 support
  enableInjected: true, // Enable injected wallet support
  enableCoinbase: true, // Enable Coinbase Wallet support
  rpcUrl: '...', // Used for the Coinbase SDK
  defaultChainId: 1 // Used for the Coinbase SDK
})

// 5. Create the modal
export const web3Modal = createWeb3Modal({
  ethersConfig: web3ModalConfig,
  chains: [hedera, hederaTestnet, mainnet],
  projectId,
  enableAnalytics: true, // Optional - defaults to your Cloud configuration
  enableOnramp: true, // Optional - false as default
  featuredWalletIds: [
    'c57ca95b47569778a828d19178114f4db188b89b763c899ba0be274e97267d96', // MetaMask
    'ecc4036f814562b41a5268adc86270fda1365906e5a2a5eaf824ceab6c5ba7de', // HashPack
  ]
})