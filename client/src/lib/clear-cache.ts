// Clear browser storage to force refresh of wallet connections
export function clearBrowserCache() {
  if (typeof window !== 'undefined') {
    // Clear localStorage
    localStorage.clear();
    
    // Clear sessionStorage
    sessionStorage.clear();
    
    // Clear any wallet-specific data
    try {
      localStorage.removeItem('connected_wallet');
      localStorage.removeItem('wallet_address');
      localStorage.removeItem('hashpack_connected');
      localStorage.removeItem('hashpack_account');
      localStorage.removeItem('profile_setup_skipped');
    } catch (error) {
      console.log('Error clearing storage:', error);
    }
    
    console.log('Browser cache and storage cleared');
  }
}

// Initialize cache clearing on page load
if (typeof window !== 'undefined') {
  // Clear cache on reload in development
  if (import.meta.env.DEV) {
    clearBrowserCache();
  }
}