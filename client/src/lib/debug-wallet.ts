// Debug utility to inspect wallet availability
export function debugWalletEnvironment() {
  console.log('🔍 === Enhanced Wallet Environment Debug ===');
  
  // Check all window keys for wallet-related patterns
  const allWindowKeys = Object.keys(window);
  console.log('📊 Total window keys:', allWindowKeys.length);
  console.log('🔑 Keys containing "hash":', allWindowKeys.filter(k => k.toLowerCase().includes('hash')));
  console.log('🔑 Keys containing "pack":', allWindowKeys.filter(k => k.toLowerCase().includes('pack')));
  console.log('🔑 Keys containing "connect":', allWindowKeys.filter(k => k.toLowerCase().includes('connect')));
  console.log('🔑 Keys containing "wallet":', allWindowKeys.filter(k => k.toLowerCase().includes('wallet')));
  console.log('🔑 Keys containing "hedera":', allWindowKeys.filter(k => k.toLowerCase().includes('hedera')));
  
  // Check for common wallet globals with detailed info
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
  
  console.log('🌐 Wallet globals:', walletChecks);
  
  // More comprehensive DOM checks
  const domChecks = {
    '[data-hashpack]': document.querySelector('[data-hashpack]'),
    '[data-extension="hashpack"]': document.querySelector('[data-extension="hashpack"]'),
    'meta[name="hashpack"]': document.querySelector('meta[name="hashpack"]'),
    'script[src*="hashpack"]': document.querySelector('script[src*="hashpack"]'),
    'script[src*="hashconnect"]': document.querySelector('script[src*="hashconnect"]'),
    '*[class*="hashpack"]': document.querySelector('*[class*="hashpack"]'),
    '*[id*="hashpack"]': document.querySelector('*[id*="hashpack"]')
  };
  
  console.log('🏗️ DOM elements:', domChecks);
  
  // Check for extension-specific markers
  console.log('🔍 Extension detection markers:');
  console.log('  - document.documentElement attributes:', Array.from(document.documentElement.attributes).map(a => a.name));
  console.log('  - Extension content scripts in head:', document.head.querySelectorAll('script').length);
  console.log('  - Extension stylesheets:', document.head.querySelectorAll('link[rel="stylesheet"]').length);
  
  // Check localStorage and sessionStorage for wallet traces
  const localStorageKeys = Object.keys(localStorage).filter(k => 
    k.toLowerCase().includes('hash') || 
    k.toLowerCase().includes('pack') || 
    k.toLowerCase().includes('wallet') ||
    k.toLowerCase().includes('hedera')
  );
  
  const sessionStorageKeys = Object.keys(sessionStorage).filter(k => 
    k.toLowerCase().includes('hash') || 
    k.toLowerCase().includes('pack') || 
    k.toLowerCase().includes('wallet') ||
    k.toLowerCase().includes('hedera')
  );
  
  console.log('💾 LocalStorage wallet keys:', localStorageKeys);
  console.log('💾 SessionStorage wallet keys:', sessionStorageKeys);
  
  // Check for Chrome extension APIs (if available)
  if (typeof chrome !== 'undefined' && chrome.runtime) {
    console.log('🔧 Chrome extension API available');
  } else {
    console.log('❌ Chrome extension API not available');
  }
  
  // Check user agent for browser info
  console.log('🌐 User Agent:', navigator.userAgent);
  console.log('🌐 Browser vendor:', navigator.vendor);
  
  console.log('🔍 === End Enhanced Debug ===');
}