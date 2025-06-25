import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { detectHashPack, detectMetaMask } from "@/utils/detectWallets";
import { HashPackDetector } from "@/utils/hashpack-detector";

export function WalletDebug() {
  const [debugInfo, setDebugInfo] = useState<any>({});

  const runDebug = () => {
    // Comprehensive HashPack detection checks
    const hashpackChecks = {
      windowHashpack: (window as any).hashpack,
      windowHashConnect: (window as any).hashConnect || (window as any).hashconnect,
      windowHedera: (window as any).hedera,
      windowHederaWallet: (window as any).hederaWallet,
      ethereumHashpack: (window as any).ethereum?.isHashPack,
      ethereumProviders: (window as any).ethereum?.providers?.length || 0,
      hashpackInProviders: (window as any).ethereum?.providers?.some((p: any) => 
        p.isHashPack || p.constructor?.name?.toLowerCase().includes('hashpack')
      ),
      documentElements: [
        document.querySelector('[data-hashpack]'),
        document.querySelector('[data-hedera]'),
        document.querySelector('script[src*="hashpack"]'),
        document.querySelector('meta[name*="hashpack"]')
      ].filter(Boolean).length,
      extensionObjects: Object.keys(window).filter(key => 
        key.toLowerCase().includes('hashpack') || 
        key.toLowerCase().includes('hedera')
      ),
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
    // Auto-run debug on mount
    runDebug();
    
    // Subscribe to HashPack detection changes
    const detector = HashPackDetector.getInstance();
    detector.onDetectionChange((detected) => {
      console.log(`HashPack detection changed: ${detected}`);
      runDebug();
    });
    
    // Periodic refresh
    const interval = setInterval(runDebug, 5000);
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
        
        {!debugInfo.detectHashPackResult && debugInfo.hashpackChecks && !localStorage.getItem('hashpack-manual-override') && (
          <div className="bg-red-100 dark:bg-red-900/30 p-2 rounded text-xs">
            <div>🔍 HashPack installed but not detected!</div>
            <div>Extension objects found: {debugInfo.hashpackChecks.extensionObjects?.join(', ') || 'none'}</div>
            <div>DOM elements: {debugInfo.hashpackChecks.documentElements || 0}</div>
            <div className="flex gap-1 mt-2 flex-wrap">
              <button 
                onClick={() => {
                  console.log('Manual HashPack detection...');
                  const detector = HashPackDetector.getInstance();
                  const result = detector.forceRecheck();
                  console.log('Manual detection result:', result);
                  runDebug();
                }}
                className="px-2 py-1 bg-blue-500 text-white rounded text-xs hover:bg-blue-600"
              >
                Force Check
              </button>
              <button 
                onClick={async () => {
                  console.log('🔄 Resetting HashPack connection state...');
                  
                  // Clear any stored connection state
                  localStorage.removeItem('hashpack-paired');
                  localStorage.removeItem('hashpack-topic');
                  localStorage.removeItem('hashpack-account');
                  sessionStorage.clear();
                  
                  // Check for HashPack in various states
                  console.log('Current window.hashpack:', (window as any).hashpack);
                  
                  if ((window as any).hashpack) {
                    console.log('HashPack object exists');
                    console.log('HashPack state:', (window as any).hashpack.isConnected?.());
                    console.log('HashPack methods:', Object.keys((window as any).hashpack));
                    
                    // Try to disconnect first
                    try {
                      if ((window as any).hashpack.disconnect) {
                        await (window as any).hashpack.disconnect();
                        console.log('HashPack disconnected');
                      }
                    } catch (e) {
                      console.log('Disconnect failed or not needed');
                    }
                  }
                  
                  // Force page refresh to reset everything
                  const shouldRefresh = confirm('HashPack state reset. Refresh page to complete reset?');
                  if (shouldRefresh) {
                    window.location.reload();
                  }
                }}
                className="px-2 py-1 bg-red-500 text-white rounded text-xs hover:bg-red-600"
              >
                Reset HashPack
              </button>
              <button 
                onClick={async () => {
                  console.log('🚀 Testing Proper HashConnect Protocol...');
                  
                  try {
                    const { ProperHashConnectService } = await import('@/utils/proper-hashconnect');
                    const service = new ProperHashConnectService();
                    
                    console.log('🔄 Starting proper HashConnect connection...');
                    const accountId = await service.connectToHashPack();
                    
                    console.log('✅ Proper HashConnect successful:', accountId);
                    alert(`🎉 HashPack Connected Successfully!\n\nAccount: ${accountId}\n\nUsing official HashConnect protocol!`);
                    
                  } catch (error) {
                    console.error('❌ Proper HashConnect failed:', error);
                    alert(`❌ Connection Failed\n\n${(error as Error).message}\n\nEnsure HashPack is installed and unlocked.`);
                  }
                }}
                className="px-2 py-1 bg-green-500 text-white rounded text-xs hover:bg-green-600"
              >
                Test Proper Protocol
              </button>
            </div>
          </div>
        )}
        
        {localStorage.getItem('hashpack-manual-override') && (
          <div className="bg-green-100 dark:bg-green-900/30 p-2 rounded text-xs">
            <div>✅ HashPack manual override enabled</div>
            <button 
              onClick={() => {
                localStorage.removeItem('hashpack-manual-override');
                runDebug();
              }}
              className="mt-1 px-2 py-1 bg-red-500 text-white rounded text-xs hover:bg-red-600"
            >
              Remove Override
            </button>
          </div>
        )}
        
        <div className="border-t pt-2 mt-2">
          <div className="font-semibold">HashPack Checks:</div>
          {debugInfo.hashpackChecks && Object.entries(debugInfo.hashpackChecks).map(([key, value]) => (
            <div key={key} className="flex justify-between">
              <span>{key}:</span>
              <span>{Array.isArray(value) ? `[${value.length}]` : value ? '✅' : '❌'}</span>
            </div>
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