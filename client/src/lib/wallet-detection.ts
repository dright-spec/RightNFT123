import { HashConnect, HashConnectTypes } from "@hashgraph/hashconnect";

let hashconnect: HashConnect | null = null;

/**
 * Returns true if HashPack is available (direct inject OR via HashConnect).
 * Uses the community-recommended "kitchen sink" approach.
 */
export async function detectHashPack(timeout = 1000): Promise<boolean> {
  // 1) Quick direct check
  if (typeof (window as any).hashpack !== "undefined") {
    console.log('HashPack detected via direct window.hashpack');
    return true;
  }

  try {
    // 2) Init HashConnect once
    if (!hashconnect) {
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

    // 3) Listen for foundExtension
    let found = false;
    if (hashconnect.foundExtension) {
      const sub = hashconnect.foundExtension.subscribe((ext) => {
        const id = ext.metadata.id.toLowerCase();
        const name = ext.metadata.name.toLowerCase();
        if (id.includes("hashpack") || name.includes("hashpack")) {
          console.log('HashPack detected via HashConnect foundExtension:', ext.metadata);
          found = true;
          sub.unsubscribe();
        }
      });

      // 4) Wait up to `timeout` ms
      await new Promise((r) => setTimeout(r, timeout));
      sub.unsubscribe();
    }
    
    return found;
  } catch (error) {
    console.warn('Error in HashConnect detection:', error);
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

// Wait for wallet extensions to load - simplified version
export async function waitForWalletExtensions(timeout = 1000): Promise<void> {
  return new Promise((resolve) => {
    setTimeout(resolve, timeout);
  });
}