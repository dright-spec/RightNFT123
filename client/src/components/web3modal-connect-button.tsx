import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Wallet, LogOut } from "lucide-react";
import { SleekWalletModal } from "./sleek-wallet-modal";
import { getConnectedWallet, disconnectWallet } from "@/lib/wallet-manager";
import { useToast } from "@/hooks/use-toast";
import { useLocation } from "wouter";

export function Web3ModalConnectButton() {
  const [isOpen, setIsOpen] = useState(false);
  const [connecting, setConnecting] = useState(false);
  const [isConnected, setIsConnected] = useState(false);
  const [connectedWallet, setConnectedWallet] = useState<{walletId: string, address: string} | null>(null);
  const { toast } = useToast();
  const [, setLocation] = useLocation();

  // Helper functions for wallet connection storage
  const storeWalletConnection = (walletId: string, address: string) => {
    localStorage.setItem('wallet_connection', JSON.stringify({
      walletId,
      address,
      isConnected: true,
      timestamp: Date.now()
    }));
  };

  const clearWalletConnection = () => {
    localStorage.removeItem('wallet_connection');
  };

  // Check for existing connection on component mount - but don't auto-connect
  useEffect(() => {
    // Only check if there's a stored session for UI display purposes
    // Users must explicitly connect through wallet approval each time
    const stored = localStorage.getItem('wallet_connection');
    if (stored) {
      try {
        const parsed = JSON.parse(stored);
        // Only restore UI state if session is recent (within 24 hours)
        const isRecent = Date.now() - parsed.timestamp < 24 * 60 * 60 * 1000;
        if (isRecent && parsed.isConnected) {
          // Don't auto-connect, but show as connected if session exists
          // User will need to approve connection again if they interact with wallet features
          setIsConnected(true);
          setConnectedWallet({ walletId: parsed.walletId, address: parsed.address });
        } else {
          // Clear expired sessions
          localStorage.removeItem('wallet_connection');
        }
      } catch {
        localStorage.removeItem('wallet_connection');
      }
    }
  }, []);

  const handleWalletConnect = async (walletId: string, address: string) => {
    try {
      setConnecting(true);
      
      console.log(`User approved wallet connection: ${walletId} - ${address}`);
      
      // Validate address format for security
      if (!address || !address.match(/^0x[a-fA-F0-9]{38,40}$/)) {
        throw new Error('Invalid Ethereum address format');
      }
      
      // Store wallet info locally only after successful connection
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
        setIsOpen(false); // Close modal on success
        
        console.log(`Wallet connection successful:`, data);
        
        toast({
          title: "Wallet Connected",
          description: `Successfully connected ${walletId} wallet`,
        });
        
        // Redirect to dashboard for authenticated users
        setTimeout(() => {
          setLocation('/dashboard');
        }, 1000);
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
        size="sm"
        className="flex items-center gap-2"
      >
        <div className="w-2 h-2 bg-green-500 rounded-full" />
        <span className="hidden sm:inline">{formatAddress(connectedWallet.address)}</span>
        <LogOut className="h-4 w-4" />
      </Button>
    );
  }

  return (
    <>
      <Button
        onClick={() => setIsOpen(true)}
        disabled={connecting}
        variant="outline"
        size="sm"
        className="flex items-center gap-2"
      >
        <Wallet className="h-4 w-4" />
        {connecting ? 'Connecting...' : 'Connect Wallet'}
      </Button>

      <SleekWalletModal
        open={isOpen}
        onOpenChange={setIsOpen}
        onConnect={(walletId: string, address: string) => {
          console.log(`Modal onConnect called with: walletId=${walletId}, address=${address}`);
          handleWalletConnect(walletId, address);
        }}
      />
    </>
  );
}