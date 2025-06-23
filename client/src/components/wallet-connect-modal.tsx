import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Loader2, Wallet, ExternalLink, AlertCircle, CheckCircle } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { detectAvailableWallets, connectToWallet } from "@/lib/wallet-manager";
import type { WalletInfo } from "@/lib/wallet-manager";

// Remove the old WalletOption interface since we're using WalletInfo from wallet-manager

interface WalletConnectModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onConnect: (walletId: string, address: string) => void;
}

export function WalletConnectModal({ open, onOpenChange, onConnect }: WalletConnectModalProps) {
  const [connecting, setConnecting] = useState<string | null>(null);
  const [wallets, setWallets] = useState<WalletInfo[]>([]);
  const { toast } = useToast();

  // Detect available wallets on component mount and when modal opens
  useEffect(() => {
    if (open) {
      // Add a small delay to ensure wallet extensions are loaded
      setTimeout(() => {
        const detectedWallets = detectAvailableWallets();
        console.log('Detected wallets:', detectedWallets);
        setWallets(detectedWallets);
      }, 100);
    }
  }, [open]);

  const handleWalletConnect = async (walletId: string) => {
    setConnecting(walletId);

    try {
      console.log(`Attempting to connect to ${walletId}...`);
      
      // Use the wallet manager to connect
      const address = await connectToWallet(walletId);
      
      if (address) {
        const walletName = wallets.find(w => w.id === walletId)?.name || walletId;
        
        console.log(`Successfully connected to ${walletName}: ${address}`);
        
        toast({
          title: "Wallet Connected",
          description: `Successfully connected to ${walletName}`,
        });
        
        onConnect(walletId, address);
        onOpenChange(false);
      }
    } catch (error) {
      console.error(`Failed to connect ${walletId}:`, error);
      
      const walletName = wallets.find(w => w.id === walletId)?.name || walletId;
      
      toast({
        title: "Connection Failed",
        description: error instanceof Error ? error.message : `Failed to connect to ${walletName}`,
        variant: "destructive",
      });
    } finally {
      setConnecting(null);
    }
  };

  // Remove all the individual wallet connection functions since they're now in wallet-manager

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Wallet className="h-5 w-5" />
            Connect Your Wallet
          </DialogTitle>
          <DialogDescription>
            Connect a wallet to start trading rights on the Hedera network. We recommend using Hedera-native wallets for the best experience.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-3 mt-4">
          {wallets.map((wallet) => (
            <div
              key={wallet.id}
              className={`border rounded-lg p-4 cursor-pointer transition-all duration-200 hover:shadow-md ${
                wallet.isAvailable ? 'hover:border-primary/50 border-border' : 'opacity-60 border-muted'
              }`}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="text-2xl">{wallet.icon}</div>
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <h3 className="font-medium">{wallet.name}</h3>
                      {wallet.isRecommended && (
                        <Badge variant="secondary" className="text-xs">
                          Recommended
                        </Badge>
                      )}
                      {wallet.isHederaNative && (
                        <Badge variant="outline" className="text-xs">
                          Hedera Native
                        </Badge>
                      )}
                    </div>
                    <p className="text-sm text-muted-foreground">{wallet.description}</p>
                    <div className="text-xs text-muted-foreground mt-1">
                      Status: {wallet.isAvailable ? (
                        <span className="text-green-600">Detected</span>
                      ) : (
                        <span className="text-orange-600">Not installed</span>
                      )}
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  {wallet.isAvailable ? (
                    <Button
                      onClick={() => handleWalletConnect(wallet.id)}
                      disabled={connecting === wallet.id}
                      className="min-w-[80px]"
                    >
                      {connecting === wallet.id ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        'Connect'
                      )}
                    </Button>
                  ) : (
                    <div className="flex items-center gap-2">
                      <AlertCircle className="h-4 w-4 text-muted-foreground" />
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => window.open(wallet.downloadUrl, '_blank')}
                      >
                        Install
                        <ExternalLink className="h-3 w-3 ml-1" />
                      </Button>
                    </div>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>

        <div className="mt-6 p-4 bg-muted/50 rounded-lg">
          <div className="flex items-start gap-2">
            <CheckCircle className="h-4 w-4 text-green-600 mt-0.5 flex-shrink-0" />
            <div className="text-sm">
              <p className="font-medium text-foreground">Secure Connection</p>
              <p className="text-muted-foreground">
                Your wallet connection is encrypted and secure. We never store your private keys.
              </p>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}