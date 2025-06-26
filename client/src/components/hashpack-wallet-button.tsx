import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { useToast } from '@/hooks/use-toast';
import { workingHashPackConnector } from '@/lib/working-hashpack-connector';
import { Wallet, Copy, ExternalLink } from 'lucide-react';

interface WalletConnection {
  accountId: string;
  network: string;
  isConnected: boolean;
}

export function HashPackWalletButton() {
  const [connection, setConnection] = useState<WalletConnection | null>(null);
  const [isConnecting, setIsConnecting] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [pairingString, setPairingString] = useState<string>('');
  const { toast } = useToast();

  useEffect(() => {
    // Check for existing connection
    const stored = workingHashPackConnector.getConnection();
    if (stored) {
      setConnection(stored);
    }

    // Listen for wallet connection events
    const handleWalletConnected = (event: CustomEvent) => {
      setConnection(event.detail);
      setShowModal(false);
      setIsConnecting(false);
      toast({
        title: "HashPack Connected",
        description: `Connected to account: ${event.detail.accountId}`,
      });
    };

    const handleWalletDisconnected = () => {
      setConnection(null);
      toast({
        title: "HashPack Disconnected",
        description: "Wallet has been disconnected",
      });
    };

    window.addEventListener('wallet-connected', handleWalletConnected as EventListener);
    window.addEventListener('wallet-disconnected', handleWalletDisconnected as EventListener);

    return () => {
      window.removeEventListener('wallet-connected', handleWalletConnected as EventListener);
      window.removeEventListener('wallet-disconnected', handleWalletDisconnected as EventListener);
    };
  }, [toast]);

  const handleConnect = async () => {
    setIsConnecting(true);
    
    try {
      const walletConnection = await workingHashPackConnector.connectWallet();
      setConnection(walletConnection);
      setShowModal(false);
      
      toast({
        title: "HashPack Connected",
        description: `Connected to account: ${walletConnection.accountId}`,
      });
    } catch (error) {
      console.error('Connection failed:', error);
      
      // Handle specific error cases
      if (error instanceof Error) {
        if (error.message.includes('timeout') || error.message.includes('install')) {
          toast({
            title: "Connection Failed",
            description: "Please ensure HashPack wallet is installed and unlocked, then try again.",
            variant: "destructive",
          });
        } else if (error.message.includes('pairing')) {
          setPairingString(error.message.split('pairing string: ')[1] || '');
          toast({
            title: "QR Code Connection Required",
            description: "Use the pairing string below to connect via QR code",
          });
        } else {
          toast({
            title: "Connection Error",
            description: error.message,
            variant: "destructive",
          });
        }
      }
    } finally {
      setIsConnecting(false);
    }
  };

  const handleDisconnect = async () => {
    try {
      await workingHashPackConnector.disconnectWallet();
      setConnection(null);
      
      toast({
        title: "Disconnected",
        description: "HashPack wallet has been disconnected",
      });
    } catch (error) {
      console.error('Disconnect failed:', error);
      toast({
        title: "Disconnect Error",
        description: "Failed to disconnect wallet",
        variant: "destructive",
      });
    }
  };

  const copyPairingString = () => {
    if (pairingString) {
      navigator.clipboard.writeText(pairingString);
      toast({
        title: "Copied",
        description: "Pairing string copied to clipboard",
      });
    }
  };

  if (connection) {
    return (
      <div className="flex items-center gap-3">
        <div className="text-sm">
          <div className="font-medium">HashPack Connected</div>
          <div className="text-muted-foreground">{connection.accountId}</div>
        </div>
        <Button variant="outline" size="sm" onClick={handleDisconnect}>
          Disconnect
        </Button>
      </div>
    );
  }

  return (
    <Dialog open={showModal} onOpenChange={setShowModal}>
      <DialogTrigger asChild>
        <Button variant="outline" className="gap-2">
          <Wallet className="h-4 w-4" />
          Connect HashPack
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Connect HashPack Wallet</DialogTitle>
          <DialogDescription>
            Connect your HashPack wallet to access the marketplace
          </DialogDescription>
        </DialogHeader>
        
        <div className="space-y-4">
          {pairingString ? (
            <div className="space-y-3">
              <div className="text-sm text-muted-foreground">
                Use this pairing string to connect via QR code in HashPack:
              </div>
              <div className="flex items-center space-x-2">
                <code className="flex-1 px-3 py-2 bg-muted rounded text-xs break-all">
                  {pairingString}
                </code>
                <Button size="sm" variant="outline" onClick={copyPairingString}>
                  <Copy className="h-4 w-4" />
                </Button>
              </div>
              <div className="text-xs text-muted-foreground">
                1. Open HashPack wallet
                2. Go to "Connect" or "Pair"
                3. Scan QR code or paste the string above
              </div>
            </div>
          ) : (
            <div className="space-y-3">
              <div className="text-sm text-muted-foreground">
                Click below to connect your HashPack wallet. Make sure HashPack is installed and unlocked.
              </div>
              
              <Button 
                onClick={handleConnect} 
                disabled={isConnecting}
                className="w-full"
              >
                {isConnecting ? 'Connecting...' : 'Connect HashPack Wallet'}
              </Button>
              
              <div className="text-xs text-muted-foreground text-center">
                Don't have HashPack?{' '}
                <a 
                  href="https://www.hashpack.app/" 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="text-primary hover:underline inline-flex items-center gap-1"
                >
                  Download here <ExternalLink className="h-3 w-3" />
                </a>
              </div>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}