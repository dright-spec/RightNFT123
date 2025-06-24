// Enhanced wallet detection with retry logic
export function detectHashPack(): boolean {
  // Check multiple possible HashPack globals
  const checks = [
    () => !!(window as any).hashpack,
    () => !!(window as any).HashPack,
    () => !!(window as any).hashconnect,
    () => !!document.querySelector('[data-hashpack]'),
    () => !!document.querySelector('meta[name="hashpack"]')
  ];
  
  return checks.some(check => {
    try {
      return check();
    } catch {
      return false;
    }
  });
}

export function detectMetaMask(): boolean {
  try {
    return !!(window as any).ethereum?.isMetaMask;
  } catch {
    return false;
  }
}

export function detectBlade(): boolean {
  try {
    return !!(window as any).bladeWallet || !!(window as any).blade;
  } catch {
    return false;
  }
}

// Wait for wallet extensions to load
export async function waitForWalletExtensions(timeout = 3000): Promise<void> {
  return new Promise((resolve) => {
    let elapsed = 0;
    const interval = 100;
    
    const check = () => {
      if (detectHashPack() || elapsed >= timeout) {
        resolve();
      } else {
        elapsed += interval;
        setTimeout(check, interval);
      }
    };
    
    check();
  });
}