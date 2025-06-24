import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { detectHashPack, detectMetaMask } from "@/utils/detectWallets";

export function WalletDebug() {
  const [debugInfo, setDebugInfo] = useState<any>({});

  const runDebug = () => {
    // Check for HashPack in multiple ways
    const hashpackChecks = {
      windowHashpack: (window as any).hashpack,
      windowHashConnect: (window as any).hashconnect,
      windowHederaHashpack: (window as any).hedera?.hashpack,
      ethereumHashpack: (window as any).ethereum?.isHashPack,
      documentHashpack: document.querySelector('[data-hashpack]'),
    };

    const info = {
      hasWindow: typeof window !== 'undefined',
      hashpackChecks,
      windowEthereum: !!(window as any).ethereum,
      ethereumIsMetaMask: !!(window as any).ethereum?.isMetaMask,
      ethereumProviders: (window as any).ethereum?.providers || null,
      detectHashPackResult: detectHashPack(),
      detectMetaMaskResult: detectMetaMask(),
      allWindowProps: Object.keys(window).filter(key => 
        key.toLowerCase().includes('hash') || 
        key.toLowerCase().includes('wallet') ||
        key.toLowerCase().includes('web3') ||
        key.toLowerCase().includes('hedera')
      ),
      extensions: {
        chrome: !!(window as any).chrome,
        browser: !!(window as any).browser,
      },
      userAgent: navigator.userAgent,
      timestamp: new Date().toISOString()
    };
    
    console.log('=== COMPREHENSIVE WALLET DEBUG ===');
    console.log('Wallet Debug Info:', info);
    console.log('HashPack Checks:', hashpackChecks);
    console.log('All window keys with wallet/hash/web3:', info.allWindowProps);
    setDebugInfo(info);
  };

  useEffect(() => {
    // Auto-run debug on mount and periodically refresh
    runDebug();
    const interval = setInterval(runDebug, 3000); // Check every 3 seconds
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="fixed bottom-4 right-4 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg p-4 max-w-md text-xs z-50">
      <div className="flex items-center justify-between mb-2">
        <h3 className="font-semibold">Wallet Debug</h3>
        <Button size="sm" onClick={runDebug}>Refresh</Button>
      </div>
      <div className="space-y-1 text-xs max-h-60 overflow-y-auto">
        <div>HashPack Detected: {debugInfo.detectHashPackResult ? '✅' : '❌'}</div>
        <div>MetaMask Detected: {debugInfo.detectMetaMaskResult ? '✅' : '❌'}</div>
        
        {!debugInfo.detectHashPackResult && (
          <div className="bg-yellow-100 dark:bg-yellow-900/30 p-2 rounded text-xs">
            💡 HashPack not found. Install from <a href="https://www.hashpack.app/" target="_blank" className="text-blue-600 underline">hashpack.app</a> and refresh.
          </div>
        )}
        
        <div className="border-t pt-2 mt-2">
          <div className="font-semibold">HashPack Checks:</div>
          {debugInfo.hashpackChecks && Object.entries(debugInfo.hashpackChecks).map(([key, value]) => (
            <div key={key}>{key}: {value ? '✅' : '❌'}</div>
          ))}
        </div>
        
        <div className="border-t pt-2 mt-2">
          <div>window.ethereum: {debugInfo.windowEthereum ? '✅' : '❌'}</div>
          <div>ethereum.isMetaMask: {debugInfo.ethereumIsMetaMask ? '✅' : '❌'}</div>
          {debugInfo.ethereumProviders && (
            <div>Providers: {debugInfo.ethereumProviders.length || 0}</div>
          )}
        </div>

        {debugInfo.allWindowProps?.length > 0 && (
          <div className="border-t pt-2 mt-2">
            <div className="font-semibold">Wallet Props:</div>
            <div>{debugInfo.allWindowProps.join(', ')}</div>
          </div>
        )}
        
        <div className="border-t pt-2 mt-2 text-xs">
          <div>Chrome: {debugInfo.extensions?.chrome ? '✅' : '❌'}</div>
          <div>Browser API: {debugInfo.extensions?.browser ? '✅' : '❌'}</div>
        </div>
      </div>
    </div>
  );
}