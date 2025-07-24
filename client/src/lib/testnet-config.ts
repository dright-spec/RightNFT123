// Testnet configuration for local development and testing
export const TESTNET_CONFIG = {
  // Local development network (Hardhat/Ganache)
  local: {
    name: 'Local',
    chainId: 1337,
    rpcUrl: 'http://127.0.0.1:8545',
    currency: 'ETH',
    blockExplorer: null,
    isTestnet: true
  },
  
  // Ethereum Sepolia Testnet
  sepolia: {
    name: 'Sepolia Testnet',
    chainId: 11155111,
    rpcUrl: 'https://eth-sepolia.g.alchemy.com/v2/demo',
    currency: 'SepoliaETH',
    blockExplorer: 'https://sepolia.etherscan.io',
    faucet: 'https://sepoliafaucet.com',
    isTestnet: true
  },
  
  // Polygon Mumbai Testnet
  mumbai: {
    name: 'Mumbai Testnet',
    chainId: 80001,
    rpcUrl: 'https://polygon-mumbai.g.alchemy.com/v2/demo',
    currency: 'MATIC',
    blockExplorer: 'https://mumbai.polygonscan.com',
    faucet: 'https://faucet.polygon.technology',
    isTestnet: true
  }
};

// Contract deployment addresses (will be populated after deployment)
export const CONTRACT_ADDRESSES = {
  [TESTNET_CONFIG.local.chainId]: {
    DrightNFT: '',
    DrightRightsNFT: ''
  },
  [TESTNET_CONFIG.sepolia.chainId]: {
    DrightNFT: '',
    DrightRightsNFT: ''
  },
  [TESTNET_CONFIG.mumbai.chainId]: {
    DrightNFT: '',
    DrightRightsNFT: ''
  }
};

// Get current network configuration
export function getCurrentNetwork() {
  const isDevelopment = import.meta.env.MODE === 'development';
  const chainId = import.meta.env.VITE_CHAIN_ID;
  
  if (isDevelopment && !chainId) {
    return TESTNET_CONFIG.local;
  }
  
  switch (chainId) {
    case '1337':
      return TESTNET_CONFIG.local;
    case '11155111':
      return TESTNET_CONFIG.sepolia;
    case '80001':
      return TESTNET_CONFIG.mumbai;
    default:
      return TESTNET_CONFIG.local;
  }
}

// Get contract addresses for current network
export function getContractAddresses() {
  const network = getCurrentNetwork();
  return CONTRACT_ADDRESSES[network.chainId] || CONTRACT_ADDRESSES[1337];
}

// Check if current network is testnet
export function isTestnetEnvironment() {
  const network = getCurrentNetwork();
  return network.isTestnet;
}

// Testnet-specific configurations
export const TESTNET_SETTINGS = {
  // Gas settings for testnet
  gasLimit: 6000000,
  gasPrice: '20000000000', // 20 gwei
  
  // Platform settings
  platformFeePercentage: 250, // 2.5%
  minimumListingPrice: '0.001', // 0.001 ETH
  
  // Test accounts (for local development)
  testAccounts: [
    {
      name: 'Deployer',
      privateKey: '0x0000000000000000000000000000000000000000000000000000000000000001'
    },
    {
      name: 'Creator',
      privateKey: '0x0000000000000000000000000000000000000000000000000000000000000002'
    },
    {
      name: 'Buyer',
      privateKey: '0x0000000000000000000000000000000000000000000000000000000000000003'
    }
  ]
};

// Environment validation
export function validateTestnetEnvironment() {
  const network = getCurrentNetwork();
  const issues = [];
  
  if (!network.rpcUrl) {
    issues.push('RPC URL not configured');
  }
  
  if (network.chainId === 1) {
    issues.push('WARNING: Connected to mainnet instead of testnet');
  }
  
  return {
    isValid: issues.length === 0,
    issues
  };
}