import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Wallet, LogOut, Copy, ExternalLink, CheckCircle, AlertCircle } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

// Custom WalletConnect implementation for Hedera
interface HederaWallet {
  name: string;
  icon: string;
  connected: boolean;
  accountId?: string;
  balance?: string;
}

export function WalletConnectModal() {
  const [isOpen, setIsOpen] = useState(false);
  const [wallets, setWallets] = useState<HederaWallet[]>([]);
  const [connectedWallet, setConnectedWallet] = useState<HederaWallet | null>(null);
  const [isConnecting, setIsConnecting] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    // Detect available Hedera wallets
    const detectWallets = () => {
      const availableWallets: HederaWallet[] = [];

      // HashPack Wallet
      if ((window as any).hashconnect || (window as any).HashPack) {
        availableWallets.push({
          name: 'HashPack',
          icon: '🔗',
          connected: false
        });
      }

      // Blade Wallet
      if ((window as any).blade || (window as any).bladeAPI) {
        availableWallets.push({
          name: 'Blade',
          icon: '⚔️',
          connected: false
        });
      }

      // Kabila Wallet
      if ((window as any).kabila) {
        availableWallets.push({
          name: 'Kabila',
          icon: '🪙',
          connected: false
        });
      }

      // Always show common wallets for installation guidance
      if (availableWallets.length === 0) {
        availableWallets.push(
          {
            name: 'HashPack',
            icon: '🔗',
            connected: false
          },
          {
            name: 'Blade',
            icon: '⚔️',
            connected: false
          }
        );
      }

      setWallets(availableWallets);
    };

    // Only detect once when component mounts
    detectWallets();
    
    // Listen for wallet injection events instead of polling
    const handleWalletInjection = () => detectWallets();
    
    window.addEventListener('hashpack:initialized', handleWalletInjection);
    window.addEventListener('blade:initialized', handleWalletInjection);
    window.addEventListener('ethereum#initialized', handleWalletInjection);
    
    return () => {
      window.removeEventListener('hashpack:initialized', handleWalletInjection);
      window.removeEventListener('blade:initialized', handleWalletInjection);
      window.removeEventListener('ethereum#initialized', handleWalletInjection);
    };
  }, []);

  const connectWallet = async (walletName: string) => {
    setIsConnecting(true);
    
    try {
      let result = null;
      
      if (walletName === 'HashPack') {
        // Try multiple HashPack connection methods
        const hashconnect = (window as any).hashconnect || (window as any).HashPack;
        
        if (!hashconnect) {
          toast({
            title: "HashPack Not Detected",
            description: "Please install HashPack wallet extension and refresh the page.",
            variant: "destructive",
          });
          window.open('https://chrome.google.com/webstore/detail/hashpack/gjagmgiddbbciopjhllkdnddhcglnemk', '_blank');
          return;
        }

        // Initialize HashConnect with proper metadata
        const appMetadata = {
          name: "Dright",
          description: "Hedera NFT Rights Marketplace",
          icon: window.location.origin + "/favicon.ico",
          url: window.location.origin
        };

        if (hashconnect.init) {
          await hashconnect.init(appMetadata, "testnet", true);
        }
        
        // Try different connection methods
        if (hashconnect.connectToLocalWallet) {
          result = await hashconnect.connectToLocalWallet();
        } else if (hashconnect.connect) {
          result = await hashconnect.connect();
        } else if (hashconnect.requestAccounts) {
          result = await hashconnect.requestAccounts();
        }
        
      } else if (walletName === 'Blade') {
        const blade = (window as any).blade || (window as any).bladeAPI;
        
        if (!blade) {
          toast({
            title: "Blade Wallet Not Detected",
            description: "Please install Blade wallet extension and refresh the page.",
            variant: "destructive",
          });
          window.open('https://chrome.google.com/webstore/detail/blade-hedera-web3-digital/abogmiocnneedmmepnohnhlijcjpcifd', '_blank');
          return;
        }

        // Try different Blade connection methods
        if (blade.createAccount) {
          result = await blade.createAccount();
        } else if (blade.connect) {
          result = await blade.connect();
        } else if (blade.requestAccounts) {
          result = await blade.requestAccounts();
        }
        
      } else if (walletName === 'Kabila') {
        const kabila = (window as any).kabila;
        
        if (!kabila) {
          toast({
            title: "Kabila Wallet Not Detected",
            description: "Please install Kabila wallet extension and refresh the page.",
            variant: "destructive",
          });
          return;
        }

        result = await kabila.connect();
      }

      // Process the connection result
      if (result) {
        const accountId = result.accountIds?.[0] || result.accountId || result.accounts?.[0];
        
        if (accountId) {
          const wallet = wallets.find(w => w.name === walletName);
          if (wallet) {
            const connectedWallet = {
              ...wallet,
              connected: true,
              accountId: accountId,
              balance: "Loading..."
            };
            
            setConnectedWallet(connectedWallet);
            setIsOpen(false);
            
            toast({
              title: "Wallet Connected",
              description: `Successfully connected to ${walletName} (${accountId})`,
            });
            
            // Try to get balance
            try {
              const response = await fetch(`/api/hedera/balance/${accountId}`);
              if (response.ok) {
                const balanceData = await response.json();
                connectedWallet.balance = balanceData.balance;
                setConnectedWallet({...connectedWallet});
              }
            } catch (error) {
              console.log("Could not fetch balance:", error);
            }
          }
        } else {
          throw new Error("No account information received from wallet");
        }
      } else {
        throw new Error("Connection failed - no response from wallet");
      }
      
    } catch (error: any) {
      console.error("Wallet connection error:", error);
      
      let errorMessage = "Failed to connect to wallet. Please try again.";
      
      if (error.message?.includes("User rejected") || error.message?.includes("rejected")) {
        errorMessage = "Connection was cancelled by user.";
      } else if (error.message?.includes("not available") || error.code === -32002) {
        errorMessage = `${walletName} wallet is not available. Please ensure it's installed and unlocked.`;
      } else if (error.message?.includes("No account")) {
        errorMessage = "Please create an account in your wallet first.";
      }
      
      toast({
        title: "Connection Failed",
        description: errorMessage,
        variant: "destructive",
      });
    } finally {
      setIsConnecting(false);
    }
  };

  const disconnectWallet = () => {
    setConnectedWallet(null);
    toast({
      title: "Wallet Disconnected",
      description: "Successfully disconnected from wallet",
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

  if (connectedWallet) {
    return (
      <div className="flex items-center gap-2">
        <Badge variant="outline" className="flex items-center gap-2">
          <span>{connectedWallet.icon}</span>
          <span className="hidden sm:inline">{connectedWallet.name}</span>
          <span className="text-xs">{connectedWallet.accountId?.slice(0, 8)}...</span>
        </Badge>
        <Button
          variant="ghost"
          size="sm"
          onClick={copyAccountId}
          className="h-8 w-8 p-0"
        >
          <Copy className="h-4 w-4" />
        </Button>
        <Button
          variant="ghost"
          size="sm"
          onClick={disconnectWallet}
          className="h-8 w-8 p-0"
        >
          <LogOut className="h-4 w-4" />
        </Button>
      </div>
    );
  }

  return (
    <>
      <Button
        onClick={() => setIsOpen(true)}
        className="flex items-center gap-2"
        variant="outline"
      >
        <Wallet className="h-4 w-4" />
        Connect Wallet
      </Button>

      {isOpen && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <Card className="w-full max-w-md">
            <CardContent className="p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold">Connect Wallet</h3>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setIsOpen(false)}
                  className="h-8 w-8 p-0"
                >
                  ×
                </Button>
              </div>
              
              <div className="space-y-3">
                {wallets.map((wallet) => (
                  <Button
                    key={wallet.name}
                    variant="outline"
                    className="w-full flex items-center gap-3 p-4 h-auto"
                    onClick={() => connectWallet(wallet.name)}
                    disabled={isConnecting}
                  >
                    <span className="text-2xl">{wallet.icon}</span>
                    <div className="flex-1 text-left">
                      <p className="font-medium">{wallet.name}</p>
                      <p className="text-xs text-muted-foreground">
                        {wallet.name === 'HashPack' && 'Most popular Hedera wallet'}
                        {wallet.name === 'Blade' && 'Multi-chain wallet with DeFi'}
                        {wallet.name === 'Kabila' && 'Native Hedera wallet'}
                      </p>
                    </div>
                    {isConnecting ? (
                      <div className="w-4 h-4 border-2 border-gray-300 border-t-gray-600 rounded-full animate-spin" />
                    ) : (
                      <ExternalLink className="h-4 w-4" />
                    )}
                  </Button>
                ))}
              </div>
              
              <div className="mt-4 p-3 bg-muted/50 rounded-lg">
                <p className="text-xs text-muted-foreground">
                  Don't have a Hedera wallet? Click on any wallet above to install it from the Chrome Web Store.
                </p>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </>
  );
}