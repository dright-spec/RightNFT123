// Debug utility to inspect wallet availability
export function debugWalletEnvironment() {
  console.log('=== Wallet Environment Debug ===');
  console.log('Window object keys containing "hash":', Object.keys(window).filter(k => k.toLowerCase().includes('hash')));
  console.log('Window object keys containing "pack":', Object.keys(window).filter(k => k.toLowerCase().includes('pack')));
  console.log('Window object keys containing "connect":', Object.keys(window).filter(k => k.toLowerCase().includes('connect')));
  
  // Check for common wallet globals
  const walletChecks = {
    'window.hashpack': (window as any).hashpack,
    'window.HashPack': (window as any).HashPack,
    'window.hashconnect': (window as any).hashconnect,
    'window.hcSdk': (window as any).hcSdk,
    'window.hedera': (window as any).hedera,
    'window.ethereum': (window as any).ethereum,
    'window.ethereum?.isMetaMask': (window as any).ethereum?.isMetaMask,
    'window.bladeWallet': (window as any).bladeWallet,
    'window.blade': (window as any).blade
  };
  
  console.log('Wallet globals:', walletChecks);
  
  // Check DOM for wallet-related elements
  const domChecks = {
    '[data-hashpack]': document.querySelector('[data-hashpack]'),
    '[data-extension="hashpack"]': document.querySelector('[data-extension="hashpack"]'),
    'meta[name="hashpack"]': document.querySelector('meta[name="hashpack"]'),
    'script[src*="hashpack"]': document.querySelector('script[src*="hashpack"]'),
    'script[src*="hashconnect"]': document.querySelector('script[src*="hashconnect"]')
  };
  
  console.log('DOM elements:', domChecks);
  
  // Check localStorage for wallet traces
  const storageKeys = Object.keys(localStorage).filter(k => 
    k.toLowerCase().includes('hash') || 
    k.toLowerCase().includes('pack') || 
    k.toLowerCase().includes('wallet')
  );
  console.log('LocalStorage wallet keys:', storageKeys);
  
  console.log('=== End Debug ===');
}