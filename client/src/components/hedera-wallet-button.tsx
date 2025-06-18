import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Wallet, LogOut, Copy, ExternalLink, CheckCircle, AlertCircle } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface HederaWallet {
  name: string;
  icon: string;
  connected: boolean;
  accountId?: string;
  balance?: string;
}

export function HederaWalletButton() {
  const [wallets, setWallets] = useState<HederaWallet[]>([]);
  const [connectedWallet, setConnectedWallet] = useState<HederaWallet | null>(null);
  const [isConnecting, setIsConnecting] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    // Check for available Hedera wallets
    const detectWallets = () => {
      const availableWallets: HederaWallet[] = [];

      // HashPack Wallet
      if ((window as any).hashconnect) {
        availableWallets.push({
          name: "HashPack",
          icon: "🔗",
          connected: false
        });
      }

      // Blade Wallet
      if ((window as any).bladeWallet) {
        availableWallets.push({
          name: "Blade",
          icon: "⚔️",
          connected: false
        });
      }

      // Kabila Wallet
      if ((window as any).kabila) {
        availableWallets.push({
          name: "Kabila",
          icon: "🪙",
          connected: false
        });
      }

      if (availableWallets.length === 0) {
        availableWallets.push({
          name: "No Wallet Detected",
          icon: "❌",
          connected: false
        });
      }

      setWallets(availableWallets);
    };

    detectWallets();
  }, []);

  const connectWallet = async (wallet: HederaWallet) => {
    if (wallet.name === "No Wallet Detected") {
      toast({
        title: "No Hedera Wallet Found",
        description: "Please install HashPack, Blade, or Kabila wallet to connect.",
        variant: "destructive"
      });
      return;
    }

    setIsConnecting(true);
    
    try {
      // Simulate wallet connection for demonstration
      await new Promise(resolve => setTimeout(resolve, 1500));
      
      const mockConnectedWallet: HederaWallet = {
        ...wallet,
        connected: true,
        accountId: "0.0.123456",
        balance: "100.5 HBAR"
      };

      setConnectedWallet(mockConnectedWallet);
      
      toast({
        title: "Wallet Connected",
        description: `Successfully connected to ${wallet.name}`,
      });
    } catch (error) {
      toast({
        title: "Connection Failed",
        description: `Failed to connect to ${wallet.name}`,
        variant: "destructive"
      });
    } finally {
      setIsConnecting(false);
    }
  };

  const disconnectWallet = () => {
    setConnectedWallet(null);
    toast({
      title: "Wallet Disconnected",
      description: "Your wallet has been disconnected",
    });
  };

  const copyAccountId = () => {
    if (connectedWallet?.accountId) {
      navigator.clipboard.writeText(connectedWallet.accountId);
      toast({
        title: "Copied",
        description: "Account ID copied to clipboard",
      });
    }
  };

  const openHashScan = () => {
    if (connectedWallet?.accountId) {
      window.open(`https://hashscan.io/testnet/account/${connectedWallet.accountId}`, '_blank');
    }
  };

  if (connectedWallet) {
    return (
      <Popover>
        <PopoverTrigger asChild>
          <Button variant="outline" className="gap-2">
            <span>{connectedWallet.icon}</span>
            <span className="hidden sm:inline">
              {connectedWallet.accountId?.slice(0, 8)}...
            </span>
            <Badge variant="secondary" className="bg-green-100 text-green-700 hidden md:inline">
              Connected
            </Badge>
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-80" align="end">
          <div className="space-y-4">
            <div className="flex items-center gap-3">
              <div className="text-2xl">{connectedWallet.icon}</div>
              <div>
                <h3 className="font-semibold">{connectedWallet.name}</h3>
                <p className="text-sm text-muted-foreground">Connected to Hedera</p>
              </div>
            </div>
            
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">Account ID</span>
                <div className="flex items-center gap-1">
                  <span className="text-sm font-mono">{connectedWallet.accountId}</span>
                  <Button variant="ghost" size="sm" onClick={copyAccountId}>
                    <Copy className="h-3 w-3" />
                  </Button>
                </div>
              </div>
              
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">Balance</span>
                <span className="text-sm font-mono">{connectedWallet.balance}</span>
              </div>
            </div>

            <div className="flex gap-2">
              <Button variant="outline" size="sm" onClick={openHashScan} className="flex-1">
                <ExternalLink className="h-3 w-3 mr-1" />
                HashScan
              </Button>
              <Button variant="outline" size="sm" onClick={disconnectWallet} className="flex-1">
                <LogOut className="h-3 w-3 mr-1" />
                Disconnect
              </Button>
            </div>
          </div>
        </PopoverContent>
      </Popover>
    );
  }

  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button className="gap-2">
          <Wallet className="h-4 w-4" />
          Connect Wallet
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-80" align="end">
        <div className="space-y-4">
          <div>
            <h3 className="font-semibold mb-2">Connect Hedera Wallet</h3>
            <p className="text-sm text-muted-foreground">
              Choose a wallet to connect to the Hedera network
            </p>
          </div>
          
          <div className="space-y-2">
            {wallets.map((wallet, index) => (
              <Card 
                key={index} 
                className={`cursor-pointer transition-colors hover:bg-muted/50 ${
                  wallet.name === "No Wallet Detected" ? "opacity-50" : ""
                }`}
                onClick={() => !isConnecting && connectWallet(wallet)}
              >
                <CardContent className="p-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <span className="text-xl">{wallet.icon}</span>
                      <span className="font-medium">{wallet.name}</span>
                    </div>
                    {wallet.name === "No Wallet Detected" ? (
                      <AlertCircle className="h-4 w-4 text-destructive" />
                    ) : (
                      <CheckCircle className="h-4 w-4 text-muted-foreground" />
                    )}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          {wallets.some(w => w.name === "No Wallet Detected") && (
            <div className="text-xs text-muted-foreground space-y-1">
              <p>Install a Hedera wallet:</p>
              <div className="flex gap-1 flex-wrap">
                <Button 
                  variant="link" 
                  size="sm" 
                  className="h-auto p-0 text-xs"
                  onClick={() => window.open("https://www.hashpack.app/", "_blank")}
                >
                  HashPack
                </Button>
                <span className="text-xs">•</span>
                <Button 
                  variant="link" 
                  size="sm" 
                  className="h-auto p-0 text-xs"
                  onClick={() => window.open("https://www.bladewallet.io/", "_blank")}
                >
                  Blade
                </Button>
                <span className="text-xs">•</span>
                <Button 
                  variant="link" 
                  size="sm" 
                  className="h-auto p-0 text-xs"
                  onClick={() => window.open("https://kabila.app/", "_blank")}
                >
                  Kabila
                </Button>
              </div>
            </div>
          )}

          {isConnecting && (
            <div className="text-center text-sm text-muted-foreground">
              Connecting to wallet...
            </div>
          )}
        </div>
      </PopoverContent>
    </Popover>
  );
}