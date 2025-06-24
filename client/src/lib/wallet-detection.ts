import { HashConnect, HashConnectTypes } from "@hashgraph/hashconnect";

let hashconnect: HashConnect | null = null;

/**
 * Returns true if HashPack is available (direct inject OR via HashConnect).
 * Uses the community-recommended "kitchen sink" approach with additional checks.
 */
export async function detectHashPack(timeout = 2000): Promise<boolean> {
  console.log('🔍 Starting comprehensive HashPack detection...');
  
  // 1) Quick direct checks - try multiple possible global names
  const directChecks = [
    () => typeof (window as any).hashpack !== "undefined",
    () => typeof (window as any).HashPack !== "undefined", 
    () => typeof (window as any).hcSdk !== "undefined",
    () => typeof (window as any).hedera !== "undefined",
    () => typeof (window as any).hashconnect !== "undefined"
  ];
  
  for (let i = 0; i < directChecks.length; i++) {
    if (directChecks[i]()) {
      console.log(`✅ HashPack detected via direct check ${i + 1}`);
      return true;
    }
  }

  // 2) Check for extension in navigator
  if (typeof navigator !== 'undefined' && (navigator as any).extensions) {
    console.log('🔍 Checking navigator.extensions...');
    try {
      const extensions = (navigator as any).extensions;
      if (extensions && typeof extensions === 'object') {
        const hasHashPack = Object.keys(extensions).some(key => 
          key.toLowerCase().includes('hashpack')
        );
        if (hasHashPack) {
          console.log('✅ HashPack detected via navigator.extensions');
          return true;
        }
      }
    } catch (e) {
      console.log('⚠️ Error checking navigator.extensions:', e);
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
      console.log(`✅ HashPack detected via content script check ${i + 1}`);
      return true;
    }
  }

  try {
    // 4) HashConnect foundExtension detection with longer timeout
    if (!hashconnect) {
      console.log('🔍 Initializing HashConnect for extension detection...');
      hashconnect = new HashConnect();
      await hashconnect.init(
        { 
          name: "Dright Detection", 
          description: "HashPack detection for Dright marketplace", 
          icon: window.location.origin + "/favicon.ico", 
          url: window.location.origin 
        } as HashConnectTypes.AppMetadata,
        "testnet"
      );
    }

    // 5) Listen for foundExtension with extended timeout
    let found = false;
    if (hashconnect.foundExtension) {
      console.log('🔍 Listening for HashConnect foundExtension events...');
      const sub = hashconnect.foundExtension.subscribe((ext) => {
        console.log('🔍 Found extension via HashConnect:', ext.metadata);
        const id = ext.metadata.id.toLowerCase();
        const name = ext.metadata.name.toLowerCase();
        if (id.includes("hashpack") || name.includes("hashpack")) {
          console.log('✅ HashPack detected via HashConnect foundExtension:', ext.metadata);
          found = true;
          sub.unsubscribe();
        }
      });

      // Wait for extension detection with longer timeout
      await new Promise((r) => setTimeout(r, timeout));
      sub.unsubscribe();
    }
    
    if (found) return true;
  } catch (error) {
    console.warn('⚠️ Error in HashConnect detection:', error);
  }

  // 6) Final polling check - sometimes extensions inject after initial load
  console.log('🔍 Final polling check for delayed injection...');
  for (let i = 0; i < 5; i++) {
    await new Promise(r => setTimeout(r, 200));
    if (typeof (window as any).hashpack !== "undefined") {
      console.log('✅ HashPack detected via delayed polling');
      return true;
    }
  }

  console.log('❌ HashPack not detected after comprehensive checks');
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