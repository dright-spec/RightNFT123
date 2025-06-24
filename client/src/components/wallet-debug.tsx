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
                  console.log('🔍 Investigating onhashchange object...');
                  
                  // Check if onhashchange is related to HashPack
                  const onhashchange = (window as any).onhashchange;
                  console.log('onhashchange object:', onhashchange);
                  console.log('onhashchange type:', typeof onhashchange);
                  
                  if (onhashchange && typeof onhashchange === 'object') {
                    console.log('onhashchange keys:', Object.keys(onhashchange));
                    console.log('onhashchange methods:', Object.getOwnPropertyNames(onhashchange));
                  }
                  
                  // Check if there are any hashpack-related methods on window
                  const windowKeys = Object.getOwnPropertyNames(window);
                  const hashRelated = windowKeys.filter(key => 
                    key.toLowerCase().includes('hash') || 
                    key.toLowerCase().includes('hedera') ||
                    key.toLowerCase().includes('pack')
                  );
                  
                  console.log('Hash-related window properties:', hashRelated);
                  
                  // Try to access HashPack directly via different possible names
                  const possibleNames = ['hashpack', 'HashPack', 'hashConnect', 'HashConnect', 'hedera', 'Hedera'];
                  for (const name of possibleNames) {
                    const obj = (window as any)[name];
                    if (obj) {
                      console.log(`Found ${name}:`, obj);
                      console.log(`${name} methods:`, Object.keys(obj));
                    }
                  }
                  
                  // Also check if onhashchange has any wallet-like functionality
                  if (onhashchange && typeof onhashchange === 'function') {
                    console.log('onhashchange is a function, not HashPack related');
                  } else if (onhashchange && typeof onhashchange === 'object') {
                    // Check if it might be HashPack masquerading as onhashchange
                    const methods = Object.keys(onhashchange);
                    const walletMethods = methods.filter(m => 
                      m.includes('account') || m.includes('connect') || 
                      m.includes('request') || m.includes('sign')
                    );
                    
                    if (walletMethods.length > 0) {
                      console.log('⚠️ onhashchange might be HashPack!', walletMethods);
                      alert(`Potential HashPack found in onhashchange!\nWallet methods: ${walletMethods.join(', ')}`);
                      return;
                    }
                  }
                  
                  alert(`Debug complete. Check console for details.\n\nFound hash-related properties: ${hashRelated.join(', ')}`);
                }}
                className="px-2 py-1 bg-orange-500 text-white rounded text-xs hover:bg-orange-600"
              >
                Investigate Hash Objects
              </button>
              <button 
                onClick={async () => {
                  console.log('🚀 Testing enhanced HashConnect with alternative detection...');
                  
                  try {
                    const { HashPackConnector } = await import('@/utils/hashpack-connector');
                    const connector = new HashPackConnector();
                    
                    console.log('🔄 Starting enhanced HashPack connection...');
                    const accountId = await connector.connect();
                    
                    console.log('✅ Enhanced connection successful:', accountId);
                    alert(`🎉 HashPack Connected!\n\nAccount: ${accountId}\n\nConnection method worked with alternative detection.`);
                    
                  } catch (error) {
                    console.error('❌ Enhanced connection failed:', error);
                    alert(`❌ Connection Failed\n\n${error.message}\n\nTried both alternative detection and official SDK.`);
                  }
                }}
                className="px-2 py-1 bg-green-500 text-white rounded text-xs hover:bg-green-600"
              >
                Test Enhanced Connection
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