// Direct HashPack connection implementation
// This bypasses WalletConnect modal issues and connects directly to HashPack

export async function connectHashPackDirect(): Promise<{ accountId: string; network: string }> {
  console.log('Attempting direct HashPack connection...');
  
  // HashPack browser extension detection
  const isHashPackInstalled = () => {
    if (typeof window === 'undefined') return false;
    
    // Check for HashPack extension
    return !!(window as any).hashpack || !!(window as any).HashPackExtension;
  };

  // HashPack mobile app detection
  const isMobile = () => {
    return /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
  };

  if (!isHashPackInstalled() && !isMobile()) {
    // Open HashPack website for installation
    window.open('https://www.hashpack.app/download', '_blank');
    throw new Error('HashPack wallet not detected. Please install HashPack extension and try again.');
  }

  // For mobile, use deep link
  if (isMobile()) {
    const deepLink = `https://wallet.hashpack.app/`;
    window.location.href = deepLink;
    throw new Error('Redirecting to HashPack mobile app...');
  }

  // If we reach here, HashPack extension should be available
  // but WalletConnect modal isn't showing it properly
  throw new Error('Please open HashPack extension manually and connect to this dApp. HashPack should prompt you to connect.');
}

export function checkHashPackAvailability(): { installed: boolean; mobile: boolean } {
  const installed = !!(window as any).hashpack || !!(window as any).HashPackExtension;
  const mobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
  
  return { installed, mobile };
}