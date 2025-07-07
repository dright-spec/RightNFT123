import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Wallet, Link2, AlertCircle, CheckCircle, ExternalLink } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

declare global {
  interface Window {
    hashconnect?: any;
  }
}

interface HederaAccount {
  accountId: string;
  balance?: string;
  network: string;
}

interface HederaWalletConnectorProps {
  onAccountConnected?: (account: HederaAccount) => void;
  onAccountDisconnected?: () => void;
}

export function HederaWalletConnector({ 
  onAccountConnected, 
  onAccountDisconnected 
}: HederaWalletConnectorProps) {
  const [isConnected, setIsConnected] = useState(false);
  const [account, setAccount] = useState<HederaAccount | null>(null);
  const [isConnecting, setIsConnecting] = useState(false);
  const [hashConnect, setHashConnect] = useState<any>(null);
  const { toast } = useToast();

  useEffect(() => {
    initializeHashConnect();
  }, []);

  async function initializeHashConnect() {
    try {
      // Check if HashConnect is available
      if (typeof window !== "undefined" && window.hashconnect) {
        const { HashConnect } = window.hashconnect;
        const hashConnect = new HashConnect(true, "testnet", true);
        
        // Set up event listeners
        hashConnect.foundExtensionEvent.once((data: any) => {
          console.log("HashConnect extension found:", data);
        });

        hashConnect.connectionStatusChangeEvent.on((connectionStatus: any) => {
          console.log("Connection status changed:", connectionStatus);
        });

        hashConnect.pairingEvent.once((data: any) => {
          console.log("Paired with wallet:", data);
          if (data.accountIds && data.accountIds.length > 0) {
            const accountData: HederaAccount = {
              accountId: data.accountIds[0],
              network: data.network || "testnet"
            };
            setAccount(accountData);
            setIsConnected(true);
            onAccountConnected?.(accountData);
            
            toast({
              title: "Wallet Connected",
              description: `Connected to Hedera account ${accountData.accountId}`,
            });
          }
        });

        await hashConnect.init();
        setHashConnect(hashConnect);
      }
    } catch (error) {
      console.error("Failed to initialize HashConnect:", error);
    }
  }

  async function connectWallet() {
    if (!hashConnect) {
      toast({
        title: "Wallet Not Available",
        description: "Please install HashPack or another Hedera wallet extension",
        variant: "destructive"
      });
      return;
    }

    setIsConnecting(true);
    try {
      await hashConnect.connectToLocalWallet();
    } catch (error) {
      console.error("Failed to connect wallet:", error);
      toast({
        title: "Connection Failed",
        description: "Failed to connect to Hedera wallet",
        variant: "destructive"
      });
    } finally {
      setIsConnecting(false);
    }
  }

  function disconnectWallet() {
    if (hashConnect) {
      hashConnect.disconnect();
    }
    setAccount(null);
    setIsConnected(false);
    onAccountDisconnected?.();
    
    toast({
      title: "Wallet Disconnected",
      description: "Successfully disconnected from Hedera wallet",
    });
  }

  if (isConnected && account) {
    return (
      <Card className="w-full max-w-md">
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-lg">
            <CheckCircle className="h-5 w-5 text-green-600" />
            Hedera Wallet Connected
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">Account ID:</span>
              <Badge variant="outline" className="font-mono text-xs">
                {account.accountId}
              </Badge>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">Network:</span>
              <Badge variant="secondary" className="capitalize">
                {account.network}
              </Badge>
            </div>
            {account.balance && (
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Balance:</span>
                <span className="text-sm font-medium">{account.balance} HBAR</span>
              </div>
            )}
          </div>
          
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => window.open(`https://hashscan.io/testnet/account/${account.accountId}`, '_blank')}
              className="flex-1"
            >
              <ExternalLink className="h-3 w-3 mr-1" />
              View on Explorer
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={disconnectWallet}
              className="flex-1"
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
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-lg">
          <Wallet className="h-5 w-5" />
          Connect Hedera Wallet
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="text-sm text-muted-foreground">
          Connect your Hedera wallet to mint, buy, and sell NFT rights on the marketplace.
        </div>
        
        <div className="space-y-2">
          <div className="flex items-center gap-2 text-xs">
            <AlertCircle className="h-3 w-3 text-amber-500" />
            <span>Requires HashPack or compatible Hedera wallet</span>
          </div>
          <div className="flex items-center gap-2 text-xs">
            <Link2 className="h-3 w-3 text-blue-500" />
            <span>Connected to Hedera testnet</span>
          </div>
        </div>

        <Button 
          onClick={connectWallet} 
          disabled={isConnecting}
          className="w-full"
        >
          {isConnecting ? "Connecting..." : "Connect Wallet"}
        </Button>
        
        <div className="text-xs text-center text-muted-foreground">
          Don't have a wallet? <br />
          <a 
            href="https://www.hashpack.app/" 
            target="_blank" 
            rel="noopener noreferrer"
            className="text-blue-600 hover:underline"
          >
            Download HashPack
          </a>
        </div>
      </CardContent>
    </Card>
  );
}