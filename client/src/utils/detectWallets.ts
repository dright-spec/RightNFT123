// Wallet detection utilities
export function detectMetaMask(): boolean {
  return Boolean(
    (window as any).ethereum?.isMetaMask
  ); // standard MetaMask flag
}

import { HashPackDetector } from './hashpack-detector';

export function detectHashPack(): boolean {
  // HashPack is always "available" when using official HashConnect SDK
  // The SDK handles wallet discovery and connection automatically
  if (typeof window !== 'undefined') {
    console.log('✅ HashPack available via official HashConnect SDK');
    return true;
  }
  
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