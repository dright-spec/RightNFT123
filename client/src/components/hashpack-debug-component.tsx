import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { hashPackOnHashChangeConnector } from '@/lib/hashpack-onhashchange-connector';
import { workingHashPackExtensionConnector } from '@/lib/working-hashpack-extension-connector';

export function HashPackDebugComponent() {
  const [debugInfo, setDebugInfo] = useState<any>(null);
  const [connection, setConnection] = useState<any>(null);
  const [isConnecting, setIsConnecting] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    inspectWindowProperties();
  }, []);

  const inspectWindowProperties = () => {
    console.log('🔍 Inspecting window properties for HashPack...');
    
    const properties = [
      'onhashchange',
      'hashpack', 
      'HashPack',
      'hcSdk',
      'hashconnect',
      'hedera',
      'myTonWallet',
      'mytonwallet'
    ];

    const debugData: any = {};

    properties.forEach(prop => {
      const value = (window as any)[prop];
      if (value !== undefined) {
        debugData[prop] = {
          type: typeof value,
          isObject: typeof value === 'object' && value !== null,
          isFunction: typeof value === 'function',
          methods: typeof value === 'object' && value !== null ? 
            Object.getOwnPropertyNames(value).filter(key => typeof value[key] === 'function') : [],
          properties: typeof value === 'object' && value !== null ?
            Object.getOwnPropertyNames(value).filter(key => typeof value[key] !== 'function') : [],
          value: typeof value === 'function' ? '[Function]' : 
                 typeof value === 'object' && value !== null ? '[Object]' : value
        };
      }
    });

    // Special inspection of onhashchange
    if ((window as any).onhashchange !== undefined) {
      const onHashChange = (window as any).onhashchange;
      debugData.onhashchange_detailed = {
        actualValue: onHashChange,
        stringValue: String(onHashChange),
        constructor: onHashChange?.constructor?.name,
        prototype: onHashChange?.prototype ? Object.getOwnPropertyNames(onHashChange.prototype) : null
      };
    }

    setDebugInfo(debugData);
    
    // Log to console for detailed inspection
    console.log('=== Detected Window Properties ===');
    Object.entries(debugData).forEach(([key, value]) => {
      console.log(`${key}:`, value);
    });
    console.log('===================================');
  };

  const testHashPackConnection = async () => {
    setIsConnecting(true);
    
    try {
      console.log('🔗 Testing HashPack connection...');
      
      // First debug the properties
      hashPackOnHashChangeConnector.debugWindowProperties();
      
      // Check if HashPack is available
      const isAvailable = await hashPackOnHashChangeConnector.isHashPackAvailable();
      console.log('HashPack availability:', isAvailable);
      
      if (isAvailable) {
        // Attempt connection
        const walletConnection = await hashPackOnHashChangeConnector.connectWallet();
        setConnection(walletConnection);
        
        toast({
          title: "Connection Successful",
          description: `Connected to account: ${walletConnection.accountId}`,
        });
      } else {
        toast({
          title: "HashPack Not Available",
          description: "HashPack wallet not detected in window properties",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error('Connection test failed:', error);
      toast({
        title: "Connection Failed", 
        description: error instanceof Error ? error.message : 'Unknown error',
        variant: "destructive",
      });
    } finally {
      setIsConnecting(false);
    }
  };

  const testWorkingExtensionConnector = async () => {
    setIsConnecting(true);
    
    try {
      console.log('🔗 Testing working HashPack extension connector...');
      
      // Debug detected objects first
      workingHashPackExtensionConnector.debugDetectedObjects();
      
      // Attempt connection using the proven connectToExtension method
      const walletConnection = await workingHashPackExtensionConnector.connectWallet();
      setConnection(walletConnection);
      
      toast({
        title: "Working Connector Success",
        description: `Connected to account: ${walletConnection.accountId}`,
      });
      
    } catch (error) {
      console.error('Working extension connector failed:', error);
      toast({
        title: "Working Connector Failed", 
        description: error instanceof Error ? error.message : 'Unknown error',
        variant: "destructive",
      });
    } finally {
      setIsConnecting(false);
    }
  };

  const testOnHashChange = () => {
    const onHashChange = (window as any).onhashchange;
    
    console.log('=== Testing onhashchange Property ===');
    console.log('Raw value:', onHashChange);
    console.log('Type:', typeof onHashChange);
    
    if (typeof onHashChange === 'function') {
      console.log('onhashchange is a function - this is the normal browser event handler');
      console.log('Function string:', onHashChange.toString());
    } else if (typeof onHashChange === 'object' && onHashChange !== null) {
      console.log('onhashchange is an object - potential HashPack API!');
      console.log('Object properties:', Object.getOwnPropertyNames(onHashChange));
      console.log('Object methods:', Object.getOwnPropertyNames(onHashChange).filter(key => typeof onHashChange[key] === 'function'));
      
      // Try calling potential HashPack methods
      const potentialMethods = ['requestAccountInfo', 'getAccountInfo', 'connect', 'enable'];
      
      potentialMethods.forEach(method => {
        if (typeof onHashChange[method] === 'function') {
          console.log(`✅ Found potential HashPack method: ${method}`);
        }
      });
    } else {
      console.log('onhashchange value:', onHashChange);
    }
    
    console.log('=====================================');
    
    toast({
      title: "onhashchange Tested",
      description: "Check console for detailed analysis",
    });
  };

  return (
    <Card className="w-full max-w-4xl mx-auto">
      <CardHeader>
        <CardTitle>HashPack Debug Tool</CardTitle>
        <CardDescription>
          Inspect window properties and test HashPack connection methods
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex gap-2 flex-wrap">
          <Button onClick={inspectWindowProperties} variant="outline">
            Refresh Window Properties
          </Button>
          <Button onClick={testOnHashChange} variant="outline">
            Test onhashchange
          </Button>
          <Button 
            onClick={testHashPackConnection} 
            disabled={isConnecting}
            variant="outline"
          >
            {isConnecting ? 'Testing...' : 'Test HashPack Connection'}
          </Button>
          <Button 
            onClick={testWorkingExtensionConnector} 
            disabled={isConnecting}
            className="bg-primary"
          >
            {isConnecting ? 'Testing...' : 'Test Working Extension Connector'}
          </Button>
        </div>

        {connection && (
          <div className="p-4 bg-green-50 dark:bg-green-900/20 rounded-lg">
            <h3 className="font-semibold text-green-800 dark:text-green-200">Connection Successful!</h3>
            <p className="text-sm text-green-600 dark:text-green-300">
              Account: {connection.accountId} | Network: {connection.network}
            </p>
          </div>
        )}

        {debugInfo && (
          <div className="space-y-2">
            <h3 className="font-semibold">Detected Window Properties:</h3>
            <div className="bg-muted p-4 rounded-lg overflow-auto max-h-96">
              <pre className="text-xs">
                {JSON.stringify(debugInfo, null, 2)}
              </pre>
            </div>
          </div>
        )}

        <div className="text-sm text-muted-foreground">
          <p><strong>Current Detection Status:</strong></p>
          <ul className="list-disc list-inside space-y-1">
            <li>onhashchange: {typeof (window as any).onhashchange !== 'undefined' ? '✅ Detected' : '❌ Not found'}</li>
            <li>window.hashpack: {typeof (window as any).hashpack !== 'undefined' ? '✅ Detected' : '❌ Not found'}</li>
            <li>myTonWallet: {typeof (window as any).myTonWallet !== 'undefined' ? '✅ Detected' : '❌ Not found'}</li>
            <li>window.ethereum: {typeof (window as any).ethereum !== 'undefined' ? '✅ Detected' : '❌ Not found'}</li>
          </ul>
        </div>
      </CardContent>
    </Card>
  );
}