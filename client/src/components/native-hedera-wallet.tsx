import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogTrigger } from "@/components/ui/dialog";
import { Wallet, LogOut, Copy, ExternalLink, CheckCircle, AlertCircle, Smartphone, Monitor } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface ConnectedWallet {
  name: string;
  accountId: string;
  balance?: string;
  network: string;
}

export function NativeHederaWallet() {
  const [connectedWallet, setConnectedWallet] = useState<ConnectedWallet | null>(null);
  const [isConnecting, setIsConnecting] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const { toast } = useToast();

  // Check for existing connections on load
  useEffect(() => {
    checkExistingConnection();
  }, []);

  const checkExistingConnection = async () => {
    try {
      // Check HashPack
      if ((window as any).hashconnect?.state?.pairingData) {
        const pairingData = (window as any).hashconnect.state.pairingData;
        if (pairingData.accountIds && pairingData.accountIds.length > 0) {
          setConnectedWallet({
            name: "HashPack",
            accountId: pairingData.accountIds[0],
            network: "testnet"
          });
          return;
        }
      }

      // Check for stored connection
      const stored = localStorage.getItem('hedera_wallet_connection');
      if (stored) {
        const connection = JSON.parse(stored);
        setConnectedWallet(connection);
      }
    } catch (error) {
      console.log("No existing connection found");
    }
  };

  const connectHashPack = async () => {
    try {
      setIsConnecting(true);

      // Method 1: Direct HashConnect API
      if ((window as any).hashconnect) {
        const hashconnect = (window as any).hashconnect;
        
        const appMetadata = {
          name: "Dright",
          description: "Hedera NFT Rights Marketplace",
          icon: window.location.origin + "/favicon.ico"
        };

        await hashconnect.init(appMetadata, "testnet", true);
        const result = await hashconnect.connectToLocalWallet();
        
        if (result && result.accountIds && result.accountIds.length > 0) {
          const connection = {
            name: "HashPack",
            accountId: result.accountIds[0],
            network: "testnet"
          };
          
          setConnectedWallet(connection);
          localStorage.setItem('hedera_wallet_connection', JSON.stringify(connection));
          setShowModal(false);
          
          toast({
            title: "HashPack Connected",
            description: `Account: ${result.accountIds[0]}`,
          });
          return;
        }
      }

      // Method 2: Direct HashPack window object
      if ((window as any).HashPack) {
        const hashpack = (window as any).HashPack;
        const result = await hashpack.connectToLocalWallet();
        
        if (result?.accountIds?.[0]) {
          const connection = {
            name: "HashPack",
            accountId: result.accountIds[0],
            network: "testnet"
          };
          
          setConnectedWallet(connection);
          localStorage.setItem('hedera_wallet_connection', JSON.stringify(connection));
          setShowModal(false);
          
          toast({
            title: "HashPack Connected",
            description: `Account: ${result.accountIds[0]}`,
          });
          return;
        }
      }

      // Method 3: Check if extension is installed but not loaded
      const isInstalled = await new Promise(resolve => {
        const timeout = setTimeout(() => resolve(false), 2000);
        const checkInterval = setInterval(() => {
          if ((window as any).hashconnect || (window as any).HashPack) {
            clearTimeout(timeout);
            clearInterval(checkInterval);
            resolve(true);
          }
        }, 100);
      });

      if (!isInstalled) {
        toast({
          title: "HashPack Not Detected",
          description: "Please install HashPack extension and refresh the page.",
          variant: "destructive",
        });
        window.open('https://chrome.google.com/webstore/detail/hashpack/gjagmgiddbbciopjhllkdnddhcglnemk', '_blank');
        return;
      }

      throw new Error("Failed to connect with available methods");

    } catch (error: any) {
      console.error("HashPack connection error:", error);
      toast({
        title: "Connection Failed",
        description: error.message || "Failed to connect to HashPack. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsConnecting(false);
    }
  };

  const connectBlade = async () => {
    try {
      setIsConnecting(true);

      // Method 1: Standard Blade API
      if ((window as any).blade) {
        const blade = (window as any).blade;
        const result = await blade.getAccountInfo();
        
        if (result?.accountId) {
          const connection = {
            name: "Blade Wallet",
            accountId: result.accountId,
            network: "testnet"
          };
          
          setConnectedWallet(connection);
          localStorage.setItem('hedera_wallet_connection', JSON.stringify(connection));
          setShowModal(false);
          
          toast({
            title: "Blade Wallet Connected",
            description: `Account: ${result.accountId}`,
          });
          return;
        }
      }

      // Method 2: Alternative Blade API
      if ((window as any).bladeAPI) {
        const blade = (window as any).bladeAPI;
        const result = await blade.connect();
        
        if (result?.accountId) {
          const connection = {
            name: "Blade Wallet",
            accountId: result.accountId,
            network: "testnet"
          };
          
          setConnectedWallet(connection);
          localStorage.setItem('hedera_wallet_connection', JSON.stringify(connection));
          setShowModal(false);
          
          toast({
            title: "Blade Wallet Connected",
            description: `Account: ${result.accountId}`,
          });
          return;
        }
      }

      toast({
        title: "Blade Wallet Not Found",
        description: "Please install Blade Wallet extension and refresh the page.",
        variant: "destructive",
      });
      window.open('https://chrome.google.com/webstore/detail/blade-hedera-web3-digital/abogmiocnneedmmepnohnhlijcjpcifd', '_blank');

    } catch (error: any) {
      console.error("Blade connection error:", error);
      toast({
        title: "Connection Failed",
        description: error.message || "Failed to connect to Blade Wallet. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsConnecting(false);
    }
  };

  const disconnectWallet = () => {
    setConnectedWallet(null);
    localStorage.removeItem('hedera_wallet_connection');
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

  const openHashScan = () => {
    if (connectedWallet?.accountId) {
      window.open(`https://hashscan.io/testnet/account/${connectedWallet.accountId}`, '_blank');
    }
  };

  if (connectedWallet) {
    return (
      <div className="flex items-center gap-2">
        <Badge variant="outline" className="flex items-center gap-2">
          <CheckCircle className="h-3 w-3 text-green-500" />
          <span className="hidden sm:inline">{connectedWallet.name}</span>
          <span className="text-xs font-mono">{connectedWallet.accountId.slice(0, 8)}...</span>
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
          onClick={openHashScan}
          className="h-8 w-8 p-0"
        >
          <ExternalLink className="h-4 w-4" />
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
        onClick={() => setShowModal(true)}
        className="flex items-center gap-2"
      >
        <Wallet className="h-4 w-4" />
        Connect Wallet
      </Button>

      <Dialog open={showModal} onOpenChange={setShowModal}>
        <DialogContent className="max-w-lg">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Wallet className="h-5 w-5" />
                Connect Hedera Wallet
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Desktop Wallets */}
              <div>
                <h4 className="font-medium mb-3 flex items-center gap-2">
                  <Monitor className="h-4 w-4" />
                  Desktop Wallets
                </h4>
                <div className="space-y-2">
                  <Button
                    variant="outline"
                    className="w-full justify-start p-4 h-auto"
                    onClick={connectHashPack}
                    disabled={isConnecting}
                  >
                    <div className="flex items-center gap-3 w-full">
                      <div className="text-2xl">🔗</div>
                      <div className="flex-1 text-left">
                        <p className="font-medium">HashPack</p>
                        <p className="text-xs text-muted-foreground">Most popular Hedera wallet</p>
                      </div>
                      {isConnecting ? (
                        <div className="w-4 h-4 border-2 border-gray-300 border-t-gray-600 rounded-full animate-spin" />
                      ) : (
                        <ExternalLink className="h-4 w-4" />
                      )}
                    </div>
                  </Button>
                  
                  <Button
                    variant="outline"
                    className="w-full justify-start p-4 h-auto"
                    onClick={connectBlade}
                    disabled={isConnecting}
                  >
                    <div className="flex items-center gap-3 w-full">
                      <div className="text-2xl">⚔️</div>
                      <div className="flex-1 text-left">
                        <p className="font-medium">Blade Wallet</p>
                        <p className="text-xs text-muted-foreground">Multi-chain wallet with DeFi</p>
                      </div>
                      {isConnecting ? (
                        <div className="w-4 h-4 border-2 border-gray-300 border-t-gray-600 rounded-full animate-spin" />
                      ) : (
                        <ExternalLink className="h-4 w-4" />
                      )}
                    </div>
                  </Button>
                </div>
              </div>

              {/* Mobile Alternative */}
              <div className="border-t pt-4">
                <h4 className="font-medium mb-3 flex items-center gap-2">
                  <Smartphone className="h-4 w-4" />
                  Mobile Alternative
                </h4>
                <div className="text-center p-4 bg-muted/50 rounded-lg">
                  <p className="text-sm text-muted-foreground mb-2">
                    For mobile users, manually enter your Hedera account ID:
                  </p>
                  <Button 
                    variant="link" 
                    size="sm"
                    onClick={() => {
                      const accountId = prompt("Enter your Hedera Account ID (format: 0.0.123456):");
                      if (accountId && /^0\.0\.\d+$/.test(accountId)) {
                        const connection = {
                          name: "Manual Entry",
                          accountId,
                          network: "testnet"
                        };
                        setConnectedWallet(connection);
                        localStorage.setItem('hedera_wallet_connection', JSON.stringify(connection));
                        setShowModal(false);
                        toast({
                          title: "Account Connected",
                          description: `Account: ${accountId}`,
                        });
                      } else if (accountId) {
                        toast({
                          title: "Invalid Format",
                          description: "Please enter a valid Hedera account ID (e.g., 0.0.123456)",
                          variant: "destructive",
                        });
                      }
                    }}
                  >
                    Manual Entry
                  </Button>
                </div>
              </div>

              {/* Troubleshooting */}
              <div className="text-xs text-muted-foreground space-y-2 pt-2 border-t">
                <p><strong>Having trouble?</strong></p>
                <ul className="space-y-1 ml-4">
                  <li>• Make sure your wallet extension is installed and unlocked</li>
                  <li>• Try refreshing the page after installing wallets</li>
                  <li>• In Brave browser, enable "Use Google services for push messaging"</li>
                  <li>• Some wallets require creating an account first</li>
                </ul>
              </div>
            </CardContent>
          </Card>
        </DialogContent>
      </Dialog>
    </>
  );
}