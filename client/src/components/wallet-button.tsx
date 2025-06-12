import { useState, useEffect } from "react";
import { useLocation, Link } from "wouter";
import { Button } from "@/components/ui/button";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { connectWallet, disconnectWallet, getWalletStatus, checkWalletConnection } from "@/lib/web3";
import { Wallet, Loader2, User, Settings, Shield, LogOut, BarChart3, AlertCircle, CheckCircle } from "lucide-react";

export function WalletButton() {
  const [isConnecting, setIsConnecting] = useState(false);
  const [walletAddress, setWalletAddress] = useState<string | null>(null);
  const [chainId, setChainId] = useState<number | undefined>(undefined);
  const [hasWallet, setHasWallet] = useState(false);
  const [, setLocation] = useLocation();
  const { toast } = useToast();

  const handleConnect = async () => {
    setIsConnecting(true);
    try {
      const address = await connectWallet();
      setWalletAddress(address);
      
      // Get updated status including chain info
      const status = getWalletStatus();
      setChainId(status.chainId);
      
      toast({
        title: "Wallet Connected",
        description: `Connected to ${address.slice(0, 6)}...${address.slice(-4)}`,
      });
      
      // Redirect to dashboard after successful connection
      setLocation("/dashboard");
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : "Failed to connect wallet";
      
      if (errorMessage.includes("No wallet detected")) {
        toast({
          title: "No Wallet Found",
          description: "Please install MetaMask or another Web3 wallet to continue.",
          variant: "destructive",
        });
      } else if (errorMessage.includes("User rejected")) {
        toast({
          title: "Connection Cancelled",
          description: "Wallet connection was cancelled by user.",
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
    disconnectWallet();
    setWalletAddress(null);
    setChainId(undefined);
    toast({
      title: "Wallet Disconnected",
      description: "Your wallet has been disconnected successfully.",
    });
    setLocation("/");
  };

  // Check wallet status and detect wallet on component mount
  useEffect(() => {
    const initializeWallet = async () => {
      // Check if wallet is available
      setHasWallet(!!window.ethereum);
      
      // Check existing connection
      const status = getWalletStatus();
      if (status.isConnected && status.address) {
        setWalletAddress(status.address);
        setChainId(status.chainId);
      } else {
        // Try to detect existing connection
        try {
          const isConnected = await checkWalletConnection();
          if (isConnected) {
            const updatedStatus = getWalletStatus();
            setWalletAddress(updatedStatus.address);
            setChainId(updatedStatus.chainId);
          }
        } catch (error) {
          console.log("No existing wallet connection found");
        }
      }
    };

    initializeWallet();
  }, []);

  if (!walletAddress) {
    return (
      <Button
        onClick={handleConnect}
        disabled={isConnecting}
        className="flex items-center space-x-2"
      >
        {isConnecting ? (
          <Loader2 className="w-4 h-4 animate-spin" />
        ) : (
          <Wallet className="w-4 h-4" />
        )}
        <span>
          {isConnecting ? "Connecting..." : "Connect Wallet"}
        </span>
      </Button>
    );
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" className="flex items-center space-x-2">
          <Wallet className="w-4 h-4" />
          <span>{`${walletAddress.slice(0, 6)}...${walletAddress.slice(-4)}`}</span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-56">
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
        <DropdownMenuItem onClick={handleDisconnect}>
          <LogOut className="mr-2 h-4 w-4" />
          Disconnect Wallet
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
