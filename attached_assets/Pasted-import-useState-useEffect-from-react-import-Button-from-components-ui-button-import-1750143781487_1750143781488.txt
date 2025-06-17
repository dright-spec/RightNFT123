import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Separator } from "@/components/ui/separator";
import { useToast } from "@/hooks/use-toast";
import { hederaWallet, type WalletConnectionState, type HederaWalletProvider } from "@/lib/hederaWallet";
import { Wallet, Loader2, ExternalLink, CheckCircle, AlertCircle, RefreshCw, Download } from "lucide-react";

interface WalletConnectProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess?: (accountId: string) => void;
}

export function WalletConnect({ open, onOpenChange, onSuccess }: WalletConnectProps) {
  const [walletState, setWalletState] = useState<WalletConnectionState>(hederaWallet.getState());
  const [availableWallets, setAvailableWallets] = useState<HederaWalletProvider[]>([]);
  const [isDetecting, setIsDetecting] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    const unsubscribe = hederaWallet.subscribe(setWalletState);
    return unsubscribe;
  }, []);

  useEffect(() => {
    if (open) {
      detectWallets();
    }
  }, [open]);

  const detectWallets = async () => {
    setIsDetecting(true);
    try {
      // Wait for wallet extensions to load
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      const wallets = await hederaWallet.detectWallets();
      setAvailableWallets(wallets);
    } catch (error) {
      console.error('Wallet detection failed:', error);
      toast({
        title: "Detection Failed",
        description: "Unable to detect wallets. Please refresh and try again.",
        variant: "destructive"
      });
    } finally {
      setIsDetecting(false);
    }
  };

  const handleConnect = async (provider: HederaWalletProvider) => {
    try {
      const accountId = await provider.connect();
      
      toast({
        title: "Wallet Connected",
        description: `Successfully connected to ${provider.name}`,
      });
      
      onSuccess?.(accountId);
      onOpenChange(false);
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Connection failed';
      toast({
        title: "Connection Failed",
        description: message,
        variant: "destructive"
      });
    }
  };

  const handleDisconnect = async () => {
    try {
      await hederaWallet.disconnect();
      toast({
        title: "Wallet Disconnected",
        description: "Your wallet has been disconnected",
      });
    } catch (error) {
      toast({
        title: "Disconnect Failed",
        description: "Failed to disconnect wallet",
        variant: "destructive"
      });
    }
  };

  const openHashPackWebsite = () => {
    window.open('https://www.hashpack.app/', '_blank');
  };

  const openBladeWebsite = () => {
    window.open('https://bladewallet.io/', '_blank');
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Wallet className="w-5 h-5" />
            Connect Hedera Wallet
          </DialogTitle>
          <DialogDescription>
            Connect your Hedera wallet to access the marketplace
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* Current Connection Status */}
          {walletState.isConnected && (
            <Card>
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-sm">Connected</CardTitle>
                  <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
                    <CheckCircle className="w-3 h-3 mr-1" />
                    Active
                  </Badge>
                </div>
              </CardHeader>
              <CardContent className="pt-0">
                <p className="text-sm font-mono bg-muted p-2 rounded">
                  {hederaWallet.formatAccountId(walletState.accountId || '')}
                </p>
                <Button 
                  variant="outline" 
                  size="sm" 
                  onClick={handleDisconnect}
                  className="w-full mt-3"
                >
                  Disconnect
                </Button>
              </CardContent>
            </Card>
          )}

          {/* Error Display */}
          {walletState.error && (
            <Alert variant="destructive">
              <AlertCircle className="w-4 h-4" />
              <AlertDescription>{walletState.error}</AlertDescription>
            </Alert>
          )}

          {/* Wallet Detection */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="font-medium">Available Wallets</h3>
              <Button
                variant="ghost"
                size="sm"
                onClick={detectWallets}
                disabled={isDetecting}
              >
                <RefreshCw className={`w-4 h-4 ${isDetecting ? 'animate-spin' : ''}`} />
              </Button>
            </div>

            {isDetecting ? (
              <Card>
                <CardContent className="flex items-center justify-center py-8">
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Detecting wallets...
                  </div>
                </CardContent>
              </Card>
            ) : availableWallets.length > 0 ? (
              <div className="space-y-2">
                {availableWallets.map((wallet) => (
                  <Card key={wallet.name} className="transition-colors hover:bg-muted/50">
                    <CardContent className="p-4">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 bg-primary/10 rounded-full flex items-center justify-center">
                            <Wallet className="w-4 h-4" />
                          </div>
                          <div>
                            <p className="font-medium">{wallet.name}</p>
                            <p className="text-xs text-muted-foreground">
                              {wallet.type === 'hashpack' ? 'HashPack Wallet' : 'Blade Wallet'}
                            </p>
                          </div>
                        </div>
                        <Button
                          onClick={() => handleConnect(wallet)}
                          disabled={walletState.isConnecting}
                        >
                          {walletState.isConnecting ? (
                            <Loader2 className="w-4 h-4 animate-spin" />
                          ) : (
                            'Connect'
                          )}
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            ) : (
              <Card>
                <CardHeader>
                  <CardTitle className="text-sm">No Wallets Detected</CardTitle>
                  <CardDescription>
                    Install a Hedera wallet to connect to the marketplace
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="space-y-2">
                    <Button
                      variant="outline"
                      onClick={openHashPackWebsite}
                      className="w-full justify-between"
                    >
                      <span>Install HashPack</span>
                      <ExternalLink className="w-4 h-4" />
                    </Button>
                    <Button
                      variant="outline"
                      onClick={openBladeWebsite}
                      className="w-full justify-between"
                    >
                      <span>Install Blade</span>
                      <ExternalLink className="w-4 h-4" />
                    </Button>
                  </div>
                  
                  <Separator />
                  
                  <div className="text-xs text-muted-foreground space-y-1">
                    <p>After installation:</p>
                    <ol className="list-decimal list-inside space-y-1 ml-2">
                      <li>Create or import your Hedera account</li>
                      <li>Refresh this page</li>
                      <li>Click the refresh button above</li>
                    </ol>
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}