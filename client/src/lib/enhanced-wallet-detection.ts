// Advanced wallet detection with retry logic and deep scanning
export async function performDeepWalletScan(): Promise<{
  hashpack: boolean;
  blade: boolean;
  brave: boolean;
  details: any;
}> {
  const results = {
    hashpack: false,
    blade: false,
    brave: false,
    details: {} as any
  };

  // Wait for extensions to fully load
  await waitForExtensions();

  // Deep scan for HashPack
  results.hashpack = await scanForHashPack();
  
  // Deep scan for Blade
  results.blade = await scanForBlade();
  
  // Deep scan for Brave
  results.brave = await scanForBrave();
  
  // Collect detailed information
  results.details = {
    windowObjects: getWindowObjects(),
    extensionScripts: getExtensionScripts(),
    providerAnalysis: analyzeProviders(),
    networkInfo: getNetworkInfo(),
    userAgent: navigator.userAgent,
    timing: Date.now()
  };

  console.log('Deep wallet scan completed:', results);
  return results;
}

// Wait for wallet extensions to inject
async function waitForExtensions(): Promise<void> {
  const maxWait = 3000; // 3 seconds max
  const checkInterval = 100;
  let elapsed = 0;

  while (elapsed < maxWait) {
    const win = window as any;
    
    // Check if any wallet has injected
    if (win.hashpack || win.blade || win.ethereum) {
      console.log(`Wallets detected after ${elapsed}ms`);
      break;
    }
    
    await new Promise(resolve => setTimeout(resolve, checkInterval));
    elapsed += checkInterval;
  }

  // Additional wait for full initialization
  await new Promise(resolve => setTimeout(resolve, 200));
}

// Comprehensive HashPack detection
async function scanForHashPack(): Promise<boolean> {
  const win = window as any;
  const checks = [];

  // Check 1: Direct object
  checks.push({
    method: 'window.hashpack',
    result: !!(win.hashpack),
    value: win.hashpack
  });

  // Check 2: HashConnect variations - including onhashconnect
  checks.push({
    method: 'window.onhashconnect',
    result: !!(win.onhashconnect),
    value: win.onhashconnect
  });

  checks.push({
    method: 'window.hashconnect',
    result: !!(win.hashconnect),
    value: win.hashconnect
  });

  checks.push({
    method: 'window.HashConnect',
    result: !!(win.HashConnect),
    value: win.HashConnect
  });

  // Check 3: Ethereum provider analysis
  if (win.ethereum) {
    checks.push({
      method: 'ethereum.isHashPack',
      result: !!(win.ethereum.isHashPack),
      value: win.ethereum.isHashPack
    });

    // Check providers array
    if (win.ethereum.providers && Array.isArray(win.ethereum.providers)) {
      const hashPackProvider = win.ethereum.providers.find((p: any) => {
        return p.isHashPack || 
               p.isHashpack || 
               (p.constructor?.name?.toLowerCase().includes('hashpack')) ||
               (p._metamask?.isHashPack);
      });
      
      checks.push({
        method: 'ethereum.providers.hashpack',
        result: !!hashPackProvider,
        value: hashPackProvider
      });
    }

    // Check network ID for Hedera
    checks.push({
      method: 'ethereum.chainId.hedera',
      result: win.ethereum.chainId === '0x127' || win.ethereum.networkVersion === '295',
      value: { chainId: win.ethereum.chainId, networkVersion: win.ethereum.networkVersion }
    });
  }

  // Check 4: Extension manifest detection
  try {
    const hasExtensionScripts = document.querySelectorAll('script[src*="hashpack"], script[src*="hashconnect"]').length > 0;
    checks.push({
      method: 'extension.scripts',
      result: hasExtensionScripts,
      value: hasExtensionScripts
    });
  } catch (e) {
    // Ignore
  }

  // Check 5: Look for HashPack specific methods
  if (win.ethereum) {
    const hasHashPackMethods = [
      'requestAccountInfo',
      'sendTransaction',
      'signMessage'
    ].some(method => typeof win.ethereum[method] === 'function');
    
    checks.push({
      method: 'ethereum.hashpack.methods',
      result: hasHashPackMethods,
      value: hasHashPackMethods
    });
  }

  console.log('HashPack detection checks:', checks);
  return checks.some(check => check.result);
}

// Comprehensive Blade detection
async function scanForBlade(): Promise<boolean> {
  const win = window as any;
  const checks = [];

  // Check 1: Direct object
  checks.push({
    method: 'window.blade',
    result: !!(win.blade),
    value: win.blade
  });

  // Check 2: Ethereum provider analysis
  if (win.ethereum && win.ethereum.providers && Array.isArray(win.ethereum.providers)) {
    const bladeProvider = win.ethereum.providers.find((p: any) => {
      return p.isBlade || 
             p.isBladewallet ||
             (p.constructor?.name?.toLowerCase().includes('blade'));
    });
    
    checks.push({
      method: 'ethereum.providers.blade',
      result: !!bladeProvider,
      value: bladeProvider
    });
  }

  // Check 3: Extension detection
  try {
    const hasBladeScripts = document.querySelectorAll('script[src*="blade"]').length > 0;
    checks.push({
      method: 'extension.blade.scripts',
      result: hasBladeScripts,
      value: hasBladeScripts
    });
  } catch (e) {
    // Ignore
  }

  console.log('Blade detection checks:', checks);
  return checks.some(check => check.result);
}

// Comprehensive Brave detection
async function scanForBrave(): Promise<boolean> {
  const win = window as any;
  const checks = [];

  // Check 1: Brave wallet flag
  checks.push({
    method: 'ethereum.isBraveWallet',
    result: !!(win.ethereum?.isBraveWallet),
    value: win.ethereum?.isBraveWallet
  });

  // Check 2: User agent
  const isBraveBrowser = navigator.userAgent.includes('Brave');
  checks.push({
    method: 'userAgent.brave',
    result: isBraveBrowser,
    value: isBraveBrowser
  });

  console.log('Brave detection checks:', checks);
  return checks.some(check => check.result);
}

// Get all window objects for debugging
function getWindowObjects(): any {
  const win = window as any;
  return {
    hashpack: !!win.hashpack,
    onhashconnect: !!win.onhashconnect,
    hashconnect: !!win.hashconnect,
    HashConnect: !!win.HashConnect,
    blade: !!win.blade,
    ethereum: !!win.ethereum,
    web3: !!win.web3,
    solana: !!win.solana,
    hedera: !!win.hedera
  };
}

// Get extension-related scripts
function getExtensionScripts(): string[] {
  const scripts = Array.from(document.querySelectorAll('script[src]'));
  return scripts
    .map(script => (script as HTMLScriptElement).src)
    .filter(src => src.includes('extension') || src.includes('wallet') || src.includes('hashpack') || src.includes('blade'));
}

// Analyze ethereum providers
function analyzeProviders(): any {
  const win = window as any;
  if (!win.ethereum) return null;

  const analysis = {
    isMetaMask: win.ethereum.isMetaMask,
    isHashPack: win.ethereum.isHashPack,
    isBraveWallet: win.ethereum.isBraveWallet,
    chainId: win.ethereum.chainId,
    networkVersion: win.ethereum.networkVersion,
    selectedAddress: win.ethereum.selectedAddress,
    providers: []
  };

  if (win.ethereum.providers && Array.isArray(win.ethereum.providers)) {
    analysis.providers = win.ethereum.providers.map((p: any) => ({
      isMetaMask: p.isMetaMask,
      isHashPack: p.isHashPack,
      isBraveWallet: p.isBraveWallet,
      constructor: p.constructor?.name
    }));
  }

  return analysis;
}

// Get network information
function getNetworkInfo(): any {
  const win = window as any;
  if (!win.ethereum) return null;

  return {
    chainId: win.ethereum.chainId,
    networkVersion: win.ethereum.networkVersion,
    isHedera: win.ethereum.chainId === '0x127' || win.ethereum.networkVersion === '295'
  };
}