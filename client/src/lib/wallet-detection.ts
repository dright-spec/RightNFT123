// Simplified wallet detection without HashConnect to prevent performance issues

/**
 * Returns true if HashPack is available (direct inject OR via HashConnect).
 * Uses the community-recommended "kitchen sink" approach with additional checks.
 */
export async function detectHashPack(timeout = 2000): Promise<boolean> {
  // Silent detection to prevent excessive logging
  
  // 1) Priority check for direct HashPack API
  if (typeof (window as any).hashpack !== "undefined") {
    return true;
  }
  
  // 2) Wait for delayed injection (reduced iterations)
  for (let i = 0; i < 5; i++) {
    if (typeof (window as any).hashpack !== "undefined") {
      return true;
    }
    await new Promise(r => setTimeout(r, 100));
  }
  
  // 3) Other possible global names
  const alternativeChecks = [
    () => typeof (window as any).HashPack !== "undefined", 
    () => typeof (window as any).hcSdk !== "undefined",
    () => typeof (window as any).hedera !== "undefined",
    () => typeof (window as any).hashconnect !== "undefined"
  ];
  
  for (let i = 0; i < alternativeChecks.length; i++) {
    if (alternativeChecks[i]()) {
      return true;
    }
  }

  // 2) Check for extension in navigator
  if (typeof navigator !== 'undefined' && (navigator as any).extensions) {
    try {
      const extensions = (navigator as any).extensions;
      if (extensions && typeof extensions === 'object') {
        const hasHashPack = Object.keys(extensions).some(key => 
          key.toLowerCase().includes('hashpack')
        );
        if (hasHashPack) {
          return true;
        }
      }
    } catch (e) {
      // Silent error handling
    }
  }

  // 3) Check for content script injection markers
  const contentScriptChecks = [
    () => document.querySelector('script[src*="hashpack"]'),
    () => document.querySelector('*[data-hashpack]'),
    () => document.querySelector('meta[name*="hashpack"]'),
    () => document.documentElement.hasAttribute('data-hashpack-injected')
  ];
  
  for (let i = 0; i < contentScriptChecks.length; i++) {
    if (contentScriptChecks[i]()) {
      return true;
    }
  }

  // Skip complex HashConnect detection to prevent performance issues
  // Just return false if basic checks didn't find HashPack
  return false;
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

// Wait for wallet extensions to load - simplified version
export async function waitForWalletExtensions(timeout = 1000): Promise<void> {
  return new Promise((resolve) => {
    setTimeout(resolve, timeout);
  });
}