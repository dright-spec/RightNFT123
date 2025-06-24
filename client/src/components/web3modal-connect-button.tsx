import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Wallet } from "lucide-react";
import { WalletConnectModal } from "./wallet-connect-modal";
import { storeWalletConnection, clearWalletConnection, getStoredWalletConnection } from "@/lib/wallet-manager";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";

export function Web3ModalConnectButton() {
  const [isOpen, setIsOpen] = useState(false);
  const [connecting, setConnecting] = useState(false);
  const [isConnected, setIsConnected] = useState(false);
  const [connectedWallet, setConnectedWallet] = useState<{walletId: string, address: string} | null>(null);
  const { toast } = useToast();

  // Check for existing connection on component mount
  useEffect(() => {
    const stored = getStoredWalletConnection();
    if (stored && stored.isConnected) {
      setIsConnected(true);
      setConnectedWallet({ walletId: stored.walletId, address: stored.address });
    }
  }, []);

  const handleWalletConnect = async (walletId: string, address: string) => {
    try {
      setConnecting(true);
      
      console.log(`Connecting wallet: ${walletId} - ${address}`);
      
      // Store wallet info locally
      storeWalletConnection(walletId, address);
      
      // Authenticate with backend
      const response = await fetch('/api/auth/wallet', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          walletType: walletId, 
          address: address 
        })
      });
      
      const data = await response.json();
      
      if (data.success) {
        setIsConnected(true);
        setConnectedWallet({ walletId, address });
        
        console.log(`Wallet connection successful:`, data);
        
        toast({
          title: "Wallet Connected",
          description: `Successfully connected ${walletId === 'hashpack' ? 'HashPack' : walletId} wallet`,
        });
      } else {
        throw new Error(data.message || 'Connection failed');
      }
    } catch (error) {
      console.error('Wallet connection error:', error);
      
      // Clear stored wallet info on failure
      clearWalletConnection();
      
      toast({
        title: "Connection Failed",
        description: error instanceof Error ? error.message : "Failed to connect wallet. Please try again.",
        variant: "destructive",
      });
    } finally {
      setConnecting(false);
    }
  };

  const handleDisconnect = () => {
    clearWalletConnection();
    setIsConnected(false);
    setConnectedWallet(null);
    
    toast({
      title: "Wallet Disconnected",
      description: "Successfully disconnected from wallet",
    });
  };

  const formatAddress = (address: string) => {
    if (address.startsWith('0.0.')) {
      // Hedera account ID
      return address;
    } else {
      // Ethereum address
      return `${address.slice(0, 6)}...${address.slice(-4)}`;
    }
  };

  if (isConnected && connectedWallet) {
    return (
      <Button
        onClick={handleDisconnect}
        variant="outline"
        className="flex items-center gap-2"
      >
        <div className="w-2 h-2 bg-green-500 rounded-full" />
        <span className="hidden sm:inline">{formatAddress(connectedWallet.address)}</span>
        <Wallet className="h-4 w-4" />
      </Button>
    );
  }

  return (
    <>
      <Button
        onClick={() => setIsOpen(true)}
        disabled={connecting}
        className="flex items-center gap-2"
      >
        <Wallet className="h-4 w-4" />
        {connecting ? 'Connecting...' : 'Connect Wallet'}
      </Button>

      <WalletConnectModal
        open={isOpen}
        onOpenChange={setIsOpen}
        onConnect={handleWalletConnect}
      />
    </>
  );
}