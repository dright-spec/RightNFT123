import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogTrigger } from "@/components/ui/dialog";
import { Wallet, LogOut, Copy, ExternalLink, CheckCircle } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface WalletConnection {
  name: string;
  accountId: string;
  network: string;
}

export function SimpleWalletButton() {
  const [connectedWallet, setConnectedWallet] = useState<WalletConnection | null>(null);
  const [isConnecting, setIsConnecting] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const { toast } = useToast();

  // Check for existing connection on load
  React.useEffect(() => {
    const stored = localStorage.getItem('hedera_wallet_connection');
    if (stored) {
      try {
        const connection = JSON.parse(stored);
        setConnectedWallet(connection);
      } catch (error) {
        console.log("Invalid stored connection");
      }
    }
  }, []);

  const connectHashPack = async () => {
    try {
      setIsConnecting(true);

      // Try to connect via HashConnect
      if ((window as any).hashconnect) {
        const hashconnect = (window as any).hashconnect;
        const appMetadata = {
          name: "Dright",
          description: "Hedera NFT Rights Marketplace",
          icon: window.location.origin + "/favicon.ico"
        };

        await hashconnect.init(appMetadata, "testnet", true);
        const result = await hashconnect.connectToLocalWallet();
        
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

      // Fallback: Manual entry
      const accountId = prompt("HashPack not detected. Enter your Hedera Account ID (format: 0.0.123456):");
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

    } catch (error: any) {
      console.error("Connection error:", error);
      toast({
        title: "Connection Failed",
        description: error.message || "Failed to connect. Please try again.",
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
              <Button
                variant="outline"
                className="w-full justify-start p-4 h-auto"
                onClick={connectHashPack}
                disabled={isConnecting}
              >
                <div className="flex items-center gap-3 w-full">
                  <div className="text-2xl">🔗</div>
                  <div className="flex-1 text-left">
                    <p className="font-medium">HashPack Wallet</p>
                    <p className="text-xs text-muted-foreground">
                      {isConnecting ? "Connecting..." : "Most popular Hedera wallet"}
                    </p>
                  </div>
                  {isConnecting && (
                    <div className="w-4 h-4 border-2 border-gray-300 border-t-gray-600 rounded-full animate-spin" />
                  )}
                </div>
              </Button>
              
              <div className="text-xs text-muted-foreground space-y-2 pt-2 border-t">
                <p><strong>Don't have HashPack?</strong></p>
                <Button 
                  variant="link" 
                  size="sm" 
                  className="h-auto p-0 text-xs"
                  onClick={() => window.open('https://chrome.google.com/webstore/detail/hashpack/gjagmgiddbbciopjhllkdnddhcglnemk', '_blank')}
                >
                  Install HashPack Extension
                </Button>
              </div>
            </CardContent>
          </Card>
        </DialogContent>
      </Dialog>
    </>
  );
}