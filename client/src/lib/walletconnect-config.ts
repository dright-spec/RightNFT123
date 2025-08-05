// WalletConnect configuration for HashPack integration
// Based on the troubleshooting guide recommendations

export const WALLETCONNECT_PROJECT_ID = import.meta.env.VITE_WALLETCONNECT_PROJECT_ID || '';

// HashPack-specific wallet metadata
export const HASHPACK_WALLET_METADATA = {
  id: 'hashpack',
  name: 'HashPack',
  homepage: 'https://www.hashpack.app/',
  chains: ['hedera:mainnet', 'hedera:testnet'],
  app: {
    browser: 'https://wallet.hashpack.app/',
    ios: 'https://apps.apple.com/app/hashpack/id1642120025',
    android: 'https://play.google.com/store/apps/details?id=app.hashpack.wallet',
    chrome: 'https://chrome.google.com/webstore/detail/hashpack/gjagmgiddbbciopjhllkdnddhcglnemk',
    firefox: 'https://addons.mozilla.org/en-US/firefox/addon/hashpack/',
    edge: 'https://microsoftedge.microsoft.com/addons/detail/hashpack/kbpeijmlpidiooogbeefnokckjmedojn'
  },
  mobile: {
    native: 'hashpack://',
    universal: 'https://wallet.hashpack.app/'
  },
  desktop: {
    native: 'hashpack://',
    universal: 'https://wallet.hashpack.app/'
  },
  rdns: 'app.hashpack',
  injected: [
    {
      namespace: 'eip155',
      injected_id: 'isHashPack'
    }
  ]
};

// DApp metadata
export const DAPP_METADATA = {
  name: 'Dright',
  description: 'NFT Rights Marketplace on Hedera',
  url: window.location.origin,
  icons: [`${window.location.origin}/logo.png`],
};

// Required namespaces for Hedera
export const HEDERA_REQUIRED_NAMESPACES = {
  hedera: {
    methods: [
      'hedera_getAccountInfo',
      'hedera_getAccountBalance', 
      'hedera_signMessage',
      'hedera_signAndExecuteTransaction',
      'hedera_signAndExecuteQuery',
      'hedera_signTransaction',
      'hedera_executeTransaction'
    ],
    chains: ['hedera:mainnet', 'hedera:testnet'],
    events: ['chainChanged', 'accountsChanged']
  }
};

// Helper to ensure HashPack appears in WalletConnect modal
export function configureWalletConnectForHashPack() {
  // Check if WalletConnect explorer API has HashPack
  const explorerUrl = `https://explorer-api.walletconnect.com/v3/wallets?projectId=${WALLETCONNECT_PROJECT_ID}&chains=hedera:mainnet,hedera:testnet`;
  
  console.log('WalletConnect Explorer URL:', explorerUrl);
  console.log('HashPack wallet metadata configured');
  
  return {
    projectId: WALLETCONNECT_PROJECT_ID,
    metadata: DAPP_METADATA,
    requiredNamespaces: HEDERA_REQUIRED_NAMESPACES,
    walletMetadata: HASHPACK_WALLET_METADATA
  };
}