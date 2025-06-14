import { useState, useEffect } from "react";
import { useLocation, Link } from "wouter";
import { Button } from "@/components/ui/button";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { hederaWallet, type WalletConnectionState } from "@/lib/hederaWallet";
import { WalletConnect } from "@/components/wallet-connect";
import { Wallet, Loader2, User, Settings, LogOut, BarChart3, AlertCircle, CheckCircle } from "lucide-react";

export function WalletButton() {
  const [walletState, setWalletState] = useState<WalletConnectionState>(hederaWallet.getState());
  const [showWalletConnect, setShowWalletConnect] = useState(false);
  const { toast } = useToast();
  const [location] = useLocation();

  useEffect(() => {
    const unsubscribe = hederaWallet.subscribe(setWalletState);
    return unsubscribe;
  }, []);

  const handleConnect = () => {
    setShowWalletConnect(true);
  };

  const handleDisconnect = async () => {
    try {
      await hederaWallet.disconnect();
      toast({
        title: "Wallet Disconnected",
        description: "Successfully disconnected from wallet",
      });
    } catch (error) {
      console.error('Failed to disconnect:', error);
      toast({
        title: "Disconnect Failed",
        description: "Failed to disconnect wallet",
        variant: "destructive",
      });
    }
  };

  const handleWalletSuccess = (accountId: string) => {
    toast({
      title: "Wallet Connected",
      description: `Connected to ${hederaWallet.formatAccountId(accountId)}`,
    });
  };

  const formatDisplayAddress = (accountId: string) => {
    if (!accountId) return '';
    
    const formatted = hederaWallet.formatAccountId(accountId);
    if (formatted.length > 12) {
      return `${formatted.slice(0, 8)}...${formatted.slice(-4)}`;
    }
    return formatted;
  };

  const isConnected = walletState.isConnected;
  const accountId = walletState.accountId;
  const displayAddress = accountId ? formatDisplayAddress(accountId) : '';

  return (
    <>
      {isConnected ? (
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="outline" className="gap-2">
              <div className="w-2 h-2 bg-green-500 rounded-full" />
              <span className="hidden sm:inline">{displayAddress}</span>
              <Wallet className="w-4 h-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-64">
            <div className="px-3 py-2">
              <p className="text-sm text-muted-foreground">Connected Account</p>
              <p className="font-mono text-sm">{hederaWallet.formatAccountId(accountId || '')}</p>
              {walletState.network && (
                <Badge variant="outline" className="mt-1">
                  {walletState.network}
                </Badge>
              )}
            </div>
            <DropdownMenuSeparator />
            <DropdownMenuItem asChild>
              <Link href="/profile" className="cursor-pointer">
                <User className="w-4 h-4 mr-2" />
                Profile
              </Link>
            </DropdownMenuItem>
            <DropdownMenuItem asChild>
              <Link href="/my-rights" className="cursor-pointer">
                <BarChart3 className="w-4 h-4 mr-2" />
                My Rights
              </Link>
            </DropdownMenuItem>
            <DropdownMenuItem asChild>
              <Link href="/settings" className="cursor-pointer">
                <Settings className="w-4 h-4 mr-2" />
                Settings
              </Link>
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={handleDisconnect} className="text-red-600">
              <LogOut className="w-4 h-4 mr-2" />
              Disconnect
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      ) : (
        <Button onClick={handleConnect} disabled={walletState.isConnecting} className="gap-2">
          {walletState.isConnecting ? (
            <Loader2 className="w-4 h-4 animate-spin" />
          ) : (
            <Wallet className="w-4 h-4" />
          )}
          <span className="hidden sm:inline">
            {walletState.isConnecting ? "Connecting..." : "Connect Wallet"}
          </span>
        </Button>
      )}

      {walletState.error && (
        <div className="fixed bottom-4 right-4 z-50">
          <div className="bg-destructive text-destructive-foreground p-3 rounded-md shadow-lg max-w-sm">
            <div className="flex items-center gap-2">
              <AlertCircle className="w-4 h-4" />
              <span className="text-sm">{walletState.error}</span>
            </div>
          </div>
        </div>
      )}

      <WalletConnect
        open={showWalletConnect}
        onOpenChange={setShowWalletConnect}
        onSuccess={handleWalletSuccess}
      />
    </>
  );
}