import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { connectWallet, disconnectWallet, getWalletStatus } from "@/lib/web3";
import { Wallet, Loader2 } from "lucide-react";

export function WalletButton() {
  const [isConnecting, setIsConnecting] = useState(false);
  const [walletAddress, setWalletAddress] = useState<string | null>(null);
  const { toast } = useToast();

  const handleWalletAction = async () => {
    if (walletAddress) {
      // Disconnect wallet
      disconnectWallet();
      setWalletAddress(null);
      toast({
        title: "Wallet Disconnected",
        description: "Your wallet has been disconnected successfully.",
      });
    } else {
      // Connect wallet
      setIsConnecting(true);
      try {
        const address = await connectWallet();
        setWalletAddress(address);
        toast({
          title: "Wallet Connected",
          description: `Connected to ${address.slice(0, 6)}...${address.slice(-4)}`,
        });
      } catch (error) {
        toast({
          title: "Connection Failed",
          description: error instanceof Error ? error.message : "Failed to connect wallet",
          variant: "destructive",
        });
      } finally {
        setIsConnecting(false);
      }
    }
  };

  // Check wallet status on component mount
  useEffect(() => {
    const status = getWalletStatus();
    if (status.isConnected && status.address) {
      setWalletAddress(status.address);
    }
  }, []);

  return (
    <Button
      onClick={handleWalletAction}
      disabled={isConnecting}
      className={`flex items-center space-x-2 ${
        walletAddress ? "bg-accent hover:bg-accent/90" : ""
      }`}
    >
      {isConnecting ? (
        <Loader2 className="w-4 h-4 animate-spin" />
      ) : (
        <Wallet className="w-4 h-4" />
      )}
      <span>
        {isConnecting
          ? "Connecting..."
          : walletAddress
          ? `${walletAddress.slice(0, 6)}...${walletAddress.slice(-4)}`
          : "Connect Wallet"}
      </span>
    </Button>
  );
}
