// Environment configuration for client-side
export const config = {
  walletConnect: {
    projectId: import.meta.env.VITE_WALLETCONNECT_PROJECT_ID || process.env.WALLETCONNECT_PROJECT_ID,
  }
};

// Validate required environment variables
if (!config.walletConnect.projectId) {
  console.warn('WalletConnect Project ID not found. WalletConnect functionality will be disabled.');
}