/**
 * Hedera Faucet-Style Wallet Connection
 * Simple, reliable wallet detection and connection based on portal.hedera.com/faucet approach
 */

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { ExternalLink, Wallet, Copy, Check, AlertCircle } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface WalletProvider {
  name: string;
  icon: string;
  detected: boolean;
  connect: () => Promise<void>;
  installUrl?: string;
}

interface WalletState {
  isConnected: boolean;
  accountId: string | null;
  balance: string | null;
  isConnecting: boolean;
  error: string | null;
}

export function HederaFaucetWallet() {
  const [walletState, setWalletState] = useState<WalletState>({
    isConnected: false,
    accountId: null,
    balance: null,
    isConnecting: false,
    error: null
  });
  
  const [manualAccountId, setManualAccountId] = useState('');
  const [walletProviders, setWalletProviders] = useState<WalletProvider[]>([]);
  const [copied, setCopied] = useState(false);
  const { toast } = useToast();

  // Detect available wallets on component mount
  useEffect(() => {
    detectWallets();
    
    // Re-check every 2 seconds for newly installed wallets
    const interval = setInterval(detectWallets, 2000);
    return () => clearInterval(interval);
  }, []);

  const detectWallets = () => {
    const providers: WalletProvider[] = [];
    
    // HashPack detection (multiple methods like Hedera faucet)
    const hashPackDetected = !!(
      (window as any).hashpack ||
      (window as any).hashconnect ||
      ((window as any).ethereum?.isHashPack) ||
      ((window as any).ethereum?.providers?.find((p: any) => p.isHashPack))
    );
    
    providers.push({
      name: 'HashPack',
      icon: '🔗',
      detected: hashPackDetected,
      connect: connectHashPack,
      installUrl: 'https://chrome.google.com/webstore/detail/hashpack/gjagmgiddbbciopjhllkdnddhcglnemk'
    });

    // Blade detection
    const bladeDetected = !!(
      (window as any).bladeSDK ||
      (window as any).blade ||
      (window as any).BladeSDK
    );
    
    providers.push({
      name: 'Blade Wallet',
      icon: '⚔️',
      detected: bladeDetected,
      connect: connectBlade,
      installUrl: 'https://chrome.google.com/webstore/detail/blade-hedera-web3-digital/abogmiocnneedmmepnohnhlijcjpcifd'
    });

    setWalletProviders(providers);
  };

  const connectHashPack = async () => {
    setWalletState(prev => ({ ...prev, isConnecting: true, error: null }));
    
    try {
      let hashconnect;
      
      // Try direct HashPack connection first
      if ((window as any).hashpack) {
        hashconnect = (window as any).hashpack;
      } else if ((window as any).hashconnect) {
        hashconnect = (window as any).hashconnect;
      } else if ((window as any).ethereum?.isHashPack) {
        hashconnect = (window as any).ethereum;
      } else {
        throw new Error('HashPack not properly installed');
      }

      // Simple connection request (similar to faucet approach)
      const accounts = await hashconnect.requestAccounts?.() || [];
      
      if (accounts.length === 0) {
        throw new Error('No accounts available');
      }

      const accountId = accounts[0];
      
      setWalletState({
        isConnected: true,
        accountId,
        balance: null, // Balance fetched separately if needed
        isConnecting: false,
        error: null
      });

      toast({
        title: "Wallet Connected",
        description: `Connected to ${accountId}`,
      });

    } catch (error) {
      console.error('HashPack connection failed:', error);
      setWalletState(prev => ({
        ...prev,
        isConnecting: false,
        error: error instanceof Error ? error.message : 'Connection failed'
      }));
      
      toast({
        title: "Connection Failed",
        description: "Please ensure HashPack is installed and unlocked",
        variant: "destructive"
      });
    }
  };

  const connectBlade = async () => {
    setWalletState(prev => ({ ...prev, isConnecting: true, error: null }));
    
    try {
      const blade = (window as any).bladeSDK || (window as any).blade || (window as any).BladeSDK;
      
      if (!blade) {
        throw new Error('Blade wallet not found');
      }

      // Blade connection method
      const result = await blade.connect();
      
      if (!result.success) {
        throw new Error(result.error || 'Blade connection failed');
      }

      setWalletState({
        isConnected: true,
        accountId: result.accountId,
        balance: null,
        isConnecting: false,
        error: null
      });

      toast({
        title: "Wallet Connected",
        description: `Connected to ${result.accountId}`,
      });

    } catch (error) {
      console.error('Blade connection failed:', error);
      setWalletState(prev => ({
        ...prev,
        isConnecting: false,
        error: error instanceof Error ? error.message : 'Connection failed'
      }));
      
      toast({
        title: "Connection Failed",
        description: "Please ensure Blade wallet is installed and unlocked",
        variant: "destructive"
      });
    }
  };

  const handleManualConnect = () => {
    if (!manualAccountId.trim()) {
      toast({
        title: "Invalid Account",
        description: "Please enter a valid Hedera account ID",
        variant: "destructive"
      });
      return;
    }

    // Validate Hedera account ID format (0.0.XXXXXX)
    const accountPattern = /^0\.0\.\d+$/;
    if (!accountPattern.test(manualAccountId.trim())) {
      toast({
        title: "Invalid Format",
        description: "Account ID must be in format: 0.0.123456",
        variant: "destructive"
      });
      return;
    }

    setWalletState({
      isConnected: true,
      accountId: manualAccountId.trim(),
      balance: null,
      isConnecting: false,
      error: null
    });

    toast({
      title: "Account Connected",
      description: `Manually connected to ${manualAccountId.trim()}`,
    });
  };

  const disconnect = () => {
    setWalletState({
      isConnected: false,
      accountId: null,
      balance: null,
      isConnecting: false,
      error: null
    });
    setManualAccountId('');
    
    toast({
      title: "Disconnected",
      description: "Wallet disconnected successfully",
    });
  };

  const copyAccountId = async () => {
    if (walletState.accountId) {
      await navigator.clipboard.writeText(walletState.accountId);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
      
      toast({
        title: "Copied",
        description: "Account ID copied to clipboard",
      });
    }
  };

  const openHashScan = () => {
    if (walletState.accountId) {
      window.open(`https://hashscan.io/testnet/account/${walletState.accountId}`, '_blank');
    }
  };

  if (walletState.isConnected) {
    return (
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Wallet className="w-5 h-5" />
            Wallet Connected
          </CardTitle>
          <CardDescription>
            Your Hedera account is connected
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label>Account ID</Label>
            <div className="flex items-center gap-2">
              <Input
                value={walletState.accountId || ''}
                readOnly
                className="font-mono text-sm"
              />
              <Button
                variant="outline"
                size="icon"
                onClick={copyAccountId}
              >
                {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
              </Button>
            </div>
          </div>
          
          <div className="flex gap-2">
            <Button
              variant="outline"
              onClick={openHashScan}
              className="flex-1"
            >
              <ExternalLink className="w-4 h-4 mr-2" />
              View on HashScan
            </Button>
            <Button
              variant="outline"
              onClick={disconnect}
            >
              Disconnect
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="w-full max-w-md">
      <CardHeader>
        <CardTitle>Connect Hedera Wallet</CardTitle>
        <CardDescription>
          Connect your wallet to interact with the marketplace
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Tabs defaultValue="wallets" className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="wallets">Wallets</TabsTrigger>
            <TabsTrigger value="manual">Manual</TabsTrigger>
          </TabsList>
          
          <TabsContent value="wallets" className="space-y-4">
            <div className="space-y-3">
              {walletProviders.map((provider) => (
                <div key={provider.name}>
                  {provider.detected ? (
                    <Button
                      variant="outline"
                      className="w-full justify-between p-4 h-auto"
                      onClick={provider.connect}
                      disabled={walletState.isConnecting}
                    >
                      <div className="flex items-center gap-3">
                        <span className="text-2xl">{provider.icon}</span>
                        <div className="text-left">
                          <p className="font-medium">{provider.name}</p>
                          <Badge variant="secondary" className="text-xs">
                            Detected
                          </Badge>
                        </div>
                      </div>
                    </Button>
                  ) : (
                    <div className="border rounded-lg p-4 bg-muted/20">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <span className="text-2xl opacity-50">{provider.icon}</span>
                          <div>
                            <p className="font-medium text-muted-foreground">{provider.name}</p>
                            <Badge variant="outline" className="text-xs">
                              Not Installed
                            </Badge>
                          </div>
                        </div>
                        {provider.installUrl && (
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => window.open(provider.installUrl, '_blank')}
                          >
                            Install
                            <ExternalLink className="w-3 h-3 ml-1" />
                          </Button>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
            
            {walletState.error && (
              <div className="flex items-center gap-2 p-3 border rounded-lg bg-destructive/10 text-destructive">
                <AlertCircle className="w-4 h-4" />
                <span className="text-sm">{walletState.error}</span>
              </div>
            )}
          </TabsContent>
          
          <TabsContent value="manual" className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="accountId">Hedera Account ID</Label>
              <Input
                id="accountId"
                placeholder="0.0.123456"
                value={manualAccountId}
                onChange={(e) => setManualAccountId(e.target.value)}
                className="font-mono"
              />
              <p className="text-xs text-muted-foreground">
                Enter your Hedera account ID to connect manually
              </p>
            </div>
            
            <Button
              onClick={handleManualConnect}
              className="w-full"
              disabled={!manualAccountId.trim()}
            >
              Connect Account
            </Button>
            
            <Separator />
            
            <div className="text-xs text-muted-foreground space-y-1">
              <p>Don't have a Hedera account?</p>
              <Button
                variant="link"
                size="sm"
                className="p-0 h-auto text-xs"
                onClick={() => window.open('https://portal.hedera.com/register', '_blank')}
              >
                Create account on Hedera Portal
                <ExternalLink className="w-3 h-3 ml-1" />
              </Button>
            </div>
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
}