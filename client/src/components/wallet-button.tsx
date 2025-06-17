import { useEffect } from "react";
import { useLocation, Link } from "wouter";
import { Button } from "@/components/ui/button";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Badge } from "@/components/ui/badge";
import { useWalletUser } from "@/hooks/use-wallet-user";
import { Wallet, User, Settings, LogOut, BarChart3, Plus, ArrowRight } from "lucide-react";

export function WalletButton(props: any) {
  const {
    user,
    isLoading,
    walletAddress,
    isConnected,
    needsProfileSetup,
    connectWallet,
    disconnectWallet,
    navigateToProfileSetup,
  } = useWalletUser();
  
  const [location, setLocation] = useLocation();

  // Auto-navigate to profile setup after successful wallet connection
  useEffect(() => {
    if (needsProfileSetup && location === '/marketplace') {
      // Small delay to ensure wallet connection is complete
      const timer = setTimeout(() => {
        navigateToProfileSetup();
      }, 1000);
      return () => clearTimeout(timer);
    }
  }, [needsProfileSetup, location, navigateToProfileSetup]);

  const formatDisplayAddress = (address: string) => {
    if (!address) return '';
    return `${address.slice(0, 6)}...${address.slice(-4)}`;
  };

  const handleConnect = async () => {
    const success = await connectWallet();
    if (success && needsProfileSetup) {
      navigateToProfileSetup();
    }
  };

  if (isLoading) {
    return (
      <Button variant="outline" disabled {...props}>
        <Wallet className="w-4 h-4 animate-spin" />
      </Button>
    );
  }

  return (
    <>
      {isConnected && user ? (
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="outline" className="gap-2" {...props}>
              <div className="w-2 h-2 bg-green-500 rounded-full" />
              <span className="hidden sm:inline">{user.username}</span>
              <Wallet className="w-4 h-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-64">
            <div className="px-3 py-2">
              <p className="text-sm text-muted-foreground">Connected Wallet</p>
              <p className="font-mono text-sm">{formatDisplayAddress(walletAddress || '')}</p>
              <p className="text-sm font-medium mt-1">@{user.username}</p>
              <Badge variant="outline" className="mt-1 bg-green-50 text-green-700 border-green-200">
                Ethereum
              </Badge>
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
              <Link href="/create-right" className="cursor-pointer">
                <Plus className="w-4 h-4 mr-2" />
                Create Right
              </Link>
            </DropdownMenuItem>
            <DropdownMenuItem asChild>
              <Link href="/settings" className="cursor-pointer">
                <Settings className="w-4 h-4 mr-2" />
                Settings
              </Link>
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={disconnectWallet} className="text-red-600">
              <LogOut className="w-4 h-4 mr-2" />
              Disconnect
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      ) : isConnected && needsProfileSetup ? (
        <Button onClick={navigateToProfileSetup} className="gap-2" {...props}>
          Complete Setup
          <ArrowRight className="w-4 h-4" />
        </Button>
      ) : (
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