import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Wallet, LogOut } from "lucide-react";
import { SleekWalletModal } from "./sleek-wallet-modal";
import { getConnectedWallet, disconnectWallet } from "@/lib/wallet-manager";
import { useToast } from "@/hooks/use-toast";

export function Web3ModalConnectButton() {
  const [isOpen, setIsOpen] = useState(false);
  const [connecting, setConnecting] = useState(false);
  const [isConnected, setIsConnected] = useState(false);
  const [connectedWallet, setConnectedWallet] = useState<{walletId: string, address: string} | null>(null);
  const { toast } = useToast();

  // Check for existing connection on component mount
  useEffect(() => {
    const wallet = getConnectedWallet();
    if (wallet && wallet.isConnected) {
      setIsConnected(true);
      setConnectedWallet({ walletId: wallet.walletId, address: wallet.address });
    }
  }, []);

  const handleWalletConnect = async (walletId: string, address: string) => {
    try {
      setConnecting(true);
      
      console.log(`Connecting wallet: ${walletId} - ${address}`);
      
      setIsConnected(true);
      setConnectedWallet({ walletId, address });
      setIsOpen(false);
      
      toast({
        title: "Wallet Connected",
        description: `Successfully connected to ${walletId}`,
      });
    } catch (error) {
      console.error("Connection failed:", error);
      toast({
        title: "Connection Failed",
        description: "Failed to connect wallet. Please try again.",
        variant: "destructive",
      });
    } finally {
      setConnecting(false);
    }
  };

  const handleDisconnect = async () => {
    try {
      await disconnectWallet();
      setIsConnected(false);
      setConnectedWallet(null);
      
      toast({
        title: "Wallet Disconnected",
        description: "Successfully disconnected from wallet",
      });
    } catch (error) {
      console.error("Disconnect failed:", error);
      toast({
        title: "Disconnect Failed",
        description: "Failed to disconnect wallet.",
        variant: "destructive",
      });
    }
  };

  const getWalletDisplayName = (walletId: string) => {
    const names: Record<string, string> = {
      metamask: "MetaMask",
      walletconnect: "WalletConnect", 
      coinbase: "Coinbase Wallet"
    };
    return names[walletId] || walletId;
  };

  const formatAddress = (address: string) => {
    if (address.length < 10) return address;
    return `${address.slice(0, 6)}...${address.slice(-4)}`;
  };

  if (isConnected && connectedWallet) {
    return (
      <div className="flex items-center gap-2">
        <div className="flex items-center gap-2 px-3 py-2 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg">
          <div className="w-2 h-2 bg-green-500 rounded-full"></div>
          <span className="text-sm font-medium text-green-700 dark:text-green-300">
            {getWalletDisplayName(connectedWallet.walletId)}
          </span>
          <span className="text-xs text-green-600 dark:text-green-400">
            {formatAddress(connectedWallet.address)}
          </span>
        </div>
        <Button
          onClick={handleDisconnect}
          variant="outline"
          size="sm"
          className="h-9"
        >
          <LogOut className="w-4 h-4 mr-2" />
          Disconnect
        </Button>
      </div>
    );
  }

  return (
    <>
      <Button
        onClick={() => setIsOpen(true)}
        disabled={connecting}
        className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white border-none shadow-lg hover:shadow-xl transition-all duration-200"
      >
        <Wallet className="w-4 h-4 mr-2" />
        {connecting ? "Connecting..." : "Connect Wallet"}
      </Button>

      <SleekWalletModal
        open={isOpen}
        onOpenChange={setIsOpen}
        onConnect={handleWalletConnect}
      />
    </>
  );
}