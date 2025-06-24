// Enhanced wallet detection with retry logic
export async function detectHashPack(): Promise<boolean> {
  // Check multiple possible HashPack globals - more comprehensive
  const checks = [
    () => !!(window as any).hashpack,
    () => !!(window as any).HashPack,
    () => !!(window as any).hashconnect,
    () => !!(window as any).hcSdk,
    () => !!document.querySelector('[data-hashpack]'),
    () => !!document.querySelector('meta[name="hashpack"]'),
    () => !!document.querySelector('[data-extension="hashpack"]'),
    () => !!window.localStorage.getItem('hashpack-connected')
  ];
  
  // Initial synchronous check
  const syncResult = checks.some(check => {
    try {
      return check();
    } catch {
      return false;
    }
  });
  
  if (syncResult) {
    console.log('HashPack detected immediately');
    return true;
  }
  
  try {
    // Wait for potential async wallet loading
    console.log('Waiting for HashPack extension to load...');
    await waitForWalletExtensions(1000); // 1 second wait
    
    // Re-check after waiting
    const result = checks.some(check => {
      try {
        return check();
      } catch {
        return false;
      }
    });
    
    console.log('HashPack detection after waiting:', result);
    return result;
  } catch (error) {
    console.warn('Error waiting for wallet extensions:', error);
    return false;
  }
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
    
    const check = async () => {
      try {
        // Use synchronous detection to avoid recursion
        const hasHashPack = !!(
          (window as any).hashpack || 
          (window as any).HashPack || 
          (window as any).hashconnect
        );
        
        if (hasHashPack || elapsed >= timeout) {
          resolve();
        } else {
          elapsed += interval;
          setTimeout(check, interval);
        }
      } catch (error) {
        // If there's an error, resolve to prevent hanging
        resolve();
      }
    };
    
    check();
  });
}