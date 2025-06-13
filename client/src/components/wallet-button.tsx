import { useState, useEffect } from "react";
import { useLocation, Link } from "wouter";
import { Button } from "@/components/ui/button";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { hederaService, formatAccountId, type HederaWalletStatus } from "@/lib/hederaSimple";
import { WalletConnectionHelper } from "@/components/wallet-connection-helper";
import { HashPackDAppGuide } from "@/components/hashpack-dapp-guide";
import { Wallet, Loader2, User, Settings, Shield, LogOut, BarChart3, AlertCircle, CheckCircle } from "lucide-react";

export function WalletButton() {
  const [isConnecting, setIsConnecting] = useState(false);
  const [showConnectionHelper, setShowConnectionHelper] = useState(false);
  const [showDAppGuide, setShowDAppGuide] = useState(false);
  const [walletStatus, setWalletStatus] = useState<HederaWalletStatus>({
    isConnected: false,
    accountId: null,
    network: 'testnet'
  });
  const [, setLocation] = useLocation();
  const { toast } = useToast();

  const handleConnect = async () => {
    setIsConnecting(true);
    try {
      // Check for wallet extensions first
      const hashpack = !!(window as any).hashpack;
      const blade = !!((window as any).bladeSDK || (window as any).blade);
      
      if (!hashpack && !blade) {
        console.log('No wallet extensions detected, showing connection helper');
        setShowConnectionHelper(true);
        setIsConnecting(false);
        return;
      }

      const accountId = await hederaService.connectWallet();
      const status = hederaService.getWalletStatus();
      setWalletStatus(status);
      
      toast({
        title: "Wallet Connected",
        description: `Connected to ${formatAccountId(accountId)}`,
      });
      
      // Redirect to dashboard after successful connection
      setLocation("/dashboard");
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : "Failed to connect wallet";
      console.error("Wallet connection error:", error);
      
      if (errorMessage.includes("not found") || errorMessage.includes("install") || errorMessage.includes("not detected")) {
        setShowDAppGuide(true);
      } else if (errorMessage.includes("dApp") || errorMessage.includes("HashPack wallet")) {
        setShowDAppGuide(true);
      } else if (errorMessage.includes("timeout")) {
        toast({
          title: "Connection Timeout",
          description: "Please ensure your wallet is unlocked and try again.",
          variant: "destructive",
        });
      } else if (errorMessage.includes("cancelled") || errorMessage.includes("rejected")) {
        toast({
          title: "Connection Cancelled",
          description: "Wallet connection was cancelled by user.",
          variant: "destructive",
        });
      } else if (errorMessage.includes("No accounts")) {
        toast({
          title: "No Accounts Found",
          description: "Please create a Hedera account in your wallet first.",
          variant: "destructive",
        });
      } else {
        toast({
          title: "Connection Failed",
          description: errorMessage,
          variant: "destructive",
        });
      }
    } finally {
      setIsConnecting(false);
    }
  };

  const handleDisconnect = () => {
    hederaService.disconnectWallet();
    setWalletStatus({
      isConnected: false,
      accountId: null,
      network: 'testnet'
    });
    toast({
      title: "Wallet Disconnected",
      description: "Your wallet has been disconnected successfully.",
    });
    setLocation("/");
  };

  // Check wallet status on component mount
  useEffect(() => {
    const status = hederaService.getWalletStatus();
    setWalletStatus(status);
  }, []);

  // Get network name for display
  const getNetworkName = (network: string) => {
    switch (network) {
      case 'mainnet': return "Hedera Mainnet";
      case 'testnet': return "Hedera Testnet";
      case 'previewnet': return "Hedera Previewnet";
      default: return "Hedera Network";
    }
  };

  if (!walletStatus.isConnected || !walletStatus.accountId) {
    return (
      <>
        <Button
          onClick={handleConnect}
          disabled={isConnecting}
          className="flex items-center space-x-2 transition-all duration-300 hover:scale-105 hover:shadow-lg active:scale-95"
        >
          {isConnecting ? (
            <Loader2 className="w-4 h-4 animate-spin" />
          ) : (
            <Wallet className="w-4 h-4 transition-transform duration-200 group-hover:scale-110" />
          )}
          <span className="transition-all duration-200">
            {isConnecting ? "Connecting..." : "Connect HashPack"}
          </span>
        </Button>

        <WalletConnectionHelper
          open={showConnectionHelper}
          onOpenChange={(open) => {
            setShowConnectionHelper(open);
            if (!open) {
              // Try connecting again after closing the helper
              setTimeout(() => {
                const hashpack = !!(window as any).hashpack;
                const blade = !!((window as any).bladeSDK || (window as any).blade);
                if (hashpack || blade) {
                  handleConnect();
                }
              }, 500);
            }
          }}
        />

        <HashPackDAppGuide
          open={showDAppGuide}
          onOpenChange={setShowDAppGuide}
          onConnectionSuccess={() => {
            setShowDAppGuide(false);
            // Retry connection after user indicates they've connected
            setTimeout(() => {
              handleConnect();
            }, 1000);
          }}
        />
      </>
    );
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" className="flex items-center space-x-2">
          <div className="flex items-center gap-2">
            <CheckCircle className="w-4 h-4 text-green-500" />
            <span>{formatAccountId(walletStatus.accountId)}</span>
            <Badge variant="secondary" className="text-xs">
              {getNetworkName(walletStatus.network)}
            </Badge>
          </div>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-64">
        {/* Wallet Info */}
        <div className="px-3 py-2 border-b">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium">HashPack Wallet</span>
            <Badge variant="outline" className="text-xs bg-green-50 border-green-200 text-green-700">
              <CheckCircle className="w-3 h-3 mr-1" />
              Connected
            </Badge>
          </div>
          <div className="text-xs text-muted-foreground mt-1">
            {walletStatus.accountId}
          </div>
          <div className="text-xs text-muted-foreground">
            Network: {getNetworkName(walletStatus.network)}
          </div>
        </div>

        {/* Navigation Items */}
        <DropdownMenuItem 
          onClick={(e) => {
            e.preventDefault();
            setLocation("/dashboard");
          }}
        >
          <BarChart3 className="mr-2 h-4 w-4" />
          Dashboard
        </DropdownMenuItem>
        <DropdownMenuItem 
          onClick={(e) => {
            e.preventDefault();
            setLocation("/marketplace");
          }}
        >
          <User className="mr-2 h-4 w-4" />
          Browse Marketplace
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem 
          onClick={(e) => {
            e.preventDefault();
            setLocation("/settings");
          }}
        >
          <Settings className="mr-2 h-4 w-4" />
          Settings
        </DropdownMenuItem>
        <DropdownMenuItem 
          onClick={(e) => {
            e.preventDefault();
            setLocation("/admin");
          }}
        >
          <Shield className="mr-2 h-4 w-4" />
          Admin Panel
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem onClick={handleDisconnect} className="text-red-600 focus:text-red-600">
          <LogOut className="mr-2 h-4 w-4" />
          Disconnect Wallet
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
