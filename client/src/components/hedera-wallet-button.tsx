import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Wallet, ExternalLink, AlertCircle, CheckCircle, Loader2, Copy, Star } from "lucide-react";
import { hederaWalletManager, type HederaConnectionState } from "@/lib/hedera-wallet-manager";
import { useToast } from "@/hooks/use-toast";

export function HederaWalletButton() {
  const [walletState, setWalletState] = useState<HederaConnectionState>({
    isConnected: false,
    accountId: null,
    network: null,
    balance: null,
    error: null,
    isConnecting: false,
  });
  const [showWalletModal, setShowWalletModal] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    // Subscribe to wallet state changes
    const unsubscribe = hederaWalletManager.subscribe((state) => {
      setWalletState(state);
    });

    // Load initial state
    setWalletState(hederaWalletManager.getWalletInfo());

    // Initialize wallet manager
    hederaWalletManager.initialize().catch(console.error);

    return unsubscribe;
  }, []);

  const handleConnect = async () => {
    try {
      await hederaWalletManager.connectHashPack();
      setShowWalletModal(false);
      toast({
        title: "HashPack Connected",
        description: "Your Hedera wallet has been connected successfully.",
      });
    } catch (error) {
      console.error('HashPack connection failed:', error);
      toast({
        variant: "destructive",
        title: "Connection Failed",
        description: error instanceof Error ? error.message : "Failed to connect HashPack wallet",
      });
    }
  };

  const handleDisconnect = async () => {
    try {
      await hederaWalletManager.disconnect();
      toast({
        title: "Wallet Disconnected",
        description: "Your Hedera wallet has been disconnected.",
      });
    } catch (error) {
      console.error('Disconnect failed:', error);
      toast({
        variant: "destructive",
        title: "Disconnect Failed",
        description: "Failed to disconnect wallet",
      });
    }
  };

  const copyAccountId = async () => {
    if (walletState.accountId) {
      await navigator.clipboard.writeText(walletState.accountId);
      toast({
        title: "Copied",
        description: "Account ID copied to clipboard",
      });
    }
  };

  const formatAccountId = (accountId: string) => {
    // Hedera account IDs are in format 0.0.123456
    return accountId;
  };

  const formatBalance = (balance: string) => {
    const hbar = parseFloat(balance);
    if (hbar < 0.000001) {
      return `${(hbar * 1000000).toFixed(0)} μℏ`;
    } else if (hbar < 0.001) {
      return `${(hbar * 1000).toFixed(3)} mℏ`;
    } else {
      return `${hbar.toFixed(6)} ℏ`;
    }
  };

  const getNetworkBadgeColor = (network: string) => {
    return network === 'mainnet' 
      ? "bg-green-50 text-green-700 border-green-200"
      : "bg-orange-50 text-orange-700 border-orange-200";
  };

  const getExplorerUrl = (accountId: string, network: string) => {
    const baseUrl = network === 'mainnet' 
      ? 'https://hashscan.io/mainnet/account/'
      : 'https://hashscan.io/testnet/account/';
    return `${baseUrl}${accountId}`;
  };

  if (walletState.isConnected) {
    return (
      <div className="flex items-center gap-3">
        <Dialog open={showWalletModal} onOpenChange={setShowWalletModal}>
          <DialogTrigger asChild>
            <Button variant="outline" className="flex items-center gap-2">
              <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
              <span className="hidden sm:inline font-mono">
                {formatAccountId(walletState.accountId!)}
              </span>
              <Wallet className="w-4 h-4" />
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                HashPack Wallet Connected
              </DialogTitle>
              <DialogDescription>
                Your Hedera wallet is connected and ready to use
              </DialogDescription>
            </DialogHeader>
            
            <div className="space-y-4">
              {/* Account Info */}
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm">Account Information</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">Account ID</span>
                    <div className="flex items-center gap-2">
                      <span className="font-mono text-sm">{walletState.accountId}</span>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={copyAccountId}
                        className="h-6 w-6 p-0"
                      >
                        <Copy className="w-3 h-3" />
                      </Button>
                    </div>
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">Network</span>
                    <Badge variant="outline" className={getNetworkBadgeColor(walletState.network!)}>
                      {walletState.network === 'mainnet' ? 'Hedera Mainnet' : 'Hedera Testnet'}
                    </Badge>
                  </div>
                  
                  {walletState.balance && (
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-muted-foreground">Balance</span>
                      <span className="font-mono text-sm">{formatBalance(walletState.balance)}</span>
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Actions */}
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => window.open(getExplorerUrl(walletState.accountId!, walletState.network!), '_blank')}
                  className="flex-1"
                >
                  <ExternalLink className="w-4 h-4 mr-2" />
                  View on HashScan
                </Button>
                <Button
                  variant="destructive"
                  size="sm"
                  onClick={handleDisconnect}
                  className="flex-1"
                >
                  Disconnect
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>
    );
  }

  return (
    <>
      <Dialog open={showWalletModal} onOpenChange={setShowWalletModal}>
        <DialogTrigger asChild>
          <Button className="flex items-center gap-2">
            <Wallet className="w-4 h-4" />
            Connect HashPack
          </Button>
        </DialogTrigger>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Connect Your Hedera Wallet</DialogTitle>
            <DialogDescription>
              Connect your HashPack wallet to start trading digital rights on Hedera
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4">
            {/* HashPack Option */}
            <Card className="cursor-pointer hover:bg-accent/50 transition-colors border-2 border-purple-200 bg-purple-50/50">
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-lg bg-purple-100 flex items-center justify-center">
                      <span className="text-lg">🟣</span>
                    </div>
                    <div>
                      <CardTitle className="text-base flex items-center gap-2">
                        HashPack
                        <Badge variant="secondary" className="text-xs">
                          <Star className="w-3 h-3 mr-1" />
                          Recommended
                        </Badge>
                      </CardTitle>
                      <CardDescription className="text-sm">
                        The premier wallet for Hedera network
                      </CardDescription>
                    </div>
                  </div>
                  <CheckCircle className="w-5 h-5 text-green-500" />
                </div>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground mb-3">
                  Secure, user-friendly wallet designed specifically for Hedera applications
                </p>
                <Button 
                  onClick={handleConnect}
                  disabled={walletState.isConnecting}
                  className="w-full"
                >
                  {walletState.isConnecting ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Connecting...
                    </>
                  ) : (
                    <>
                      <Wallet className="w-4 h-4 mr-2" />
                      Connect HashPack
                    </>
                  )}
                </Button>
              </CardContent>
            </Card>

            {/* Error Display */}
            {walletState.error && (
              <div className="flex items-center gap-2 p-3 rounded-lg bg-destructive/10 border border-destructive/20">
                <AlertCircle className="w-4 h-4 text-destructive" />
                <span className="text-sm text-destructive">{walletState.error}</span>
              </div>
            )}

            {/* Help Text */}
            <div className="text-xs text-muted-foreground text-center space-y-1">
              <p>Don't have HashPack?</p>
              <Button
                variant="link"
                size="sm"
                onClick={() => window.open('https://www.hashpack.app/', '_blank')}
                className="h-auto p-0 text-xs"
              >
                Download HashPack Wallet <ExternalLink className="w-3 h-3 ml-1" />
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}