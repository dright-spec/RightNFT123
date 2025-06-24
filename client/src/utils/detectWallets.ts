// Wallet detection utilities
export function detectMetaMask(): boolean {
  return Boolean(
    (window as any).ethereum?.isMetaMask
  ); // standard MetaMask flag
}

export function detectHashPack(): boolean {
  if (typeof window === 'undefined') return false;
  
  // Primary detection method - HashPack injects window.hashpack
  if ((window as any).hashpack) {
    console.log('✅ HashPack detected via window.hashpack');
    return true;
  }
  
  // Alternative detection methods
  const alternativeChecks = [
    () => (window as any).hashconnect,
    () => (window as any).hedera?.hashpack,
    () => (window as any).ethereum?.isHashPack,
    () => (window as any).ethereum?.providers?.some((p: any) => p.isHashPack || p._state?.isHashPack),
    () => document.querySelector('[data-hashpack]'),
  ];
  
  for (let i = 0; i < alternativeChecks.length; i++) {
    try {
      if (alternativeChecks[i]()) {
        console.log(`✅ HashPack detected via alternative method ${i + 1}`);
        return true;
      }
    } catch (error) {
      // Ignore errors from detection methods
    }
  }
  
  console.log('❌ HashPack not detected - extension may not be installed');
  return false;
}

export function detectBlade(): boolean {
  return Boolean(
    (window as any).blade
  ); // Blade wallet detection
}

export function detectWalletConnect(): boolean {
  // WalletConnect is always available as it's protocol-based
  return true;
}

export interface WalletInfo {
  id: string;
  name: string;
  description: string;
  icon: string;
  isAvailable: boolean;
  isRecommended?: boolean;
  isHederaNative?: boolean;
  downloadUrl: string;
}

export function getAvailableWallets(): WalletInfo[] {
  return [
    {
      id: 'hashpack',
      name: 'HashPack',
      description: 'Official Hedera wallet with native HTS support',
      icon: '🟡',
      isAvailable: detectHashPack(),
      isRecommended: true,
      isHederaNative: true,
      downloadUrl: 'https://www.hashpack.app/'
    },
    {
      id: 'metamask',
      name: 'MetaMask',
      description: 'Popular Ethereum wallet',
      icon: '🦊',
      isAvailable: detectMetaMask(),
      downloadUrl: 'https://metamask.io/'
    },
    {
      id: 'walletconnect',
      name: 'WalletConnect',
      description: 'Connect any wallet via QR code',
      icon: '🔗',
      isAvailable: detectWalletConnect(),
      downloadUrl: 'https://walletconnect.com/'
    },
    {
      id: 'blade',
      name: 'Blade Wallet',
      description: 'Multi-chain wallet with Hedera support',
      icon: '⚔️',
      isAvailable: detectBlade(),
      isHederaNative: true,
      downloadUrl: 'https://bladewallet.io/'
    }
  ];
}