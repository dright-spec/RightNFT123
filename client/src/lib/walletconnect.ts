import { EthereumProvider } from '@walletconnect/ethereum-provider';
import { createModal } from '@walletconnect/modal';

// WalletConnect configuration for real wallet connections
const projectId = import.meta.env.VITE_WALLETCONNECT_PROJECT_ID;

if (!projectId) {
  console.warn('WalletConnect Project ID not found. Some wallet features may not work.');
}

// WalletConnect modal instance
let modal: any = null;
let provider: EthereumProvider | null = null;

export async function initializeWalletConnect() {
  if (!projectId) {
    throw new Error('WalletConnect Project ID is required');
  }

  try {
    // Initialize the provider
    provider = await EthereumProvider.init({
      projectId,
      chains: [1], // Ethereum mainnet, can add more chains
      showQrModal: true,
      metadata: {
        name: 'Dright - Rights Marketplace',
        description: 'Hedera NFT marketplace for tokenizing legal rights',
        url: window.location.origin,
        icons: [window.location.origin + '/favicon.ico']
      }
    });

    // Create modal
    modal = createModal({
      projectId,
      chains: [1, 295], // Ethereum + Hedera (if supported)
      defaultChain: 1
    });

    return { provider, modal };
  } catch (error) {
    console.error('Failed to initialize WalletConnect:', error);
    throw error;
  }
}

export async function connectWalletConnect(): Promise<string> {
  if (!provider) {
    await initializeWalletConnect();
  }

  if (!provider) {
    throw new Error('WalletConnect provider not initialized');
  }

  try {
    // Enable provider (this opens the modal)
    const accounts = await provider.enable();
    
    if (accounts && accounts.length > 0) {
      return accounts[0];
    }
    
    throw new Error('No accounts returned from WalletConnect');
  } catch (error) {
    console.error('WalletConnect connection error:', error);
    throw error;
  }
}

export async function disconnectWalletConnect(): Promise<void> {
  if (provider) {
    await provider.disconnect();
    provider = null;
  }
}

// Check if WalletConnect is available
export function isWalletConnectAvailable(): boolean {
  return !!projectId;
}

// Get current provider
export function getWalletConnectProvider(): EthereumProvider | null {
  return provider;
}