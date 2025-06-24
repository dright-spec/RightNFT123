import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Loader2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { detectAvailableWallets, connectToWallet } from "@/lib/wallet-manager";
import type { WalletInfo } from "@/lib/wallet-manager";

interface WalletConnectModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onConnect: (walletId: string, address: string) => void;
}

export function WalletConnectModal({ open, onOpenChange, onConnect }: WalletConnectModalProps) {
  const [connecting, setConnecting] = useState<string | null>(null);
  const [wallets, setWallets] = useState<WalletInfo[]>([]);
  const { toast } = useToast();

  useEffect(() => {
    if (open) {
      const detectWallets = async () => {
        try {
          console.log('Starting wallet detection...');
          const detectedWallets = await detectAvailableWallets();
          console.log('Detected wallets:', detectedWallets);
          setWallets(detectedWallets);
        } catch (error) {
          console.error('Error detecting wallets:', error);
          setWallets([
            {
              id: 'hashpack',
              name: 'HashPack',
              description: 'Official Hedera wallet with native HTS support',
              icon: '🟡',
              isAvailable: !!(window as any).hashpack,
              isRecommended: true,
              isHederaNative: true,
              downloadUrl: 'https://www.hashpack.app/'
            },
            {
              id: 'metamask',
              name: 'MetaMask',
              description: 'Popular Ethereum wallet',
              icon: '🦊',
              isAvailable: !!(window as any).ethereum?.isMetaMask,
              downloadUrl: 'https://metamask.io/'
            },
            {
              id: 'walletconnect',
              name: 'WalletConnect',
              description: 'Connect using WalletConnect protocol',
              icon: '🔗',
              isAvailable: true,
              isHederaNative: false,
              downloadUrl: 'https://walletconnect.com/'
            }
          ]);
        }
      };
      
      setTimeout(detectWallets, 300);
    }
  }, [open]);

  const handleConnect = async (walletId: string) => {
    setConnecting(walletId);
    
    try {
      console.log(`Attempting to connect to ${walletId}...`);
      
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

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <span className="text-2xl">🔗</span>
            Connect Wallet
          </DialogTitle>
          <DialogDescription>
            Choose a wallet to connect to Dright marketplace. HashPack is recommended for optimal Hedera experience.
          </DialogDescription>
        </DialogHeader>
        
        <div className="space-y-4">
          {wallets.length === 0 ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="w-6 h-6 animate-spin mr-2" />
              <span>Detecting wallets...</span>
            </div>
          ) : (
            <div className="space-y-3">
              {wallets.map((wallet) => (
                <div
                  key={wallet.id}
                  className={`p-4 border rounded-lg cursor-pointer transition-colors ${
                    wallet.isAvailable 
                      ? 'hover:bg-gray-50 dark:hover:bg-gray-800 border-gray-200 dark:border-gray-700' 
                      : 'border-gray-100 dark:border-gray-800 bg-gray-50 dark:bg-gray-900/50'
                  }`}
                  onClick={() => wallet.isAvailable ? handleConnect(wallet.id) : window.open(wallet.downloadUrl, '_blank')}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      <div className="text-2xl">{wallet.icon}</div>
                      <div>
                        <h3 className="font-medium flex items-center gap-2">
                          {wallet.name}
                          {wallet.isRecommended && (
                            <span className="bg-blue-100 text-blue-800 text-xs px-2 py-1 rounded-full">
                              Recommended
                            </span>
                          )}
                        </h3>
                        <p className="text-sm text-gray-600 dark:text-gray-400">{wallet.description}</p>
                        {wallet.isHederaNative && (
                          <span className="inline-block bg-green-100 text-green-800 text-xs px-2 py-1 rounded-full mt-1">
                            Hedera Native
                          </span>
                        )}
                      </div>
                    </div>
                    <div className="text-right">
                      {wallet.isAvailable ? (
                        <span className="text-green-600 text-sm font-medium">
                          {connecting === wallet.id ? (
                            <div className="flex items-center gap-2">
                              <div className="w-4 h-4 border-2 border-green-500 border-t-transparent rounded-full animate-spin" />
                              Connecting...
                            </div>
                          ) : (
                            'Available'
                          )}
                        </span>
                      ) : (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={(e) => {
                            e.stopPropagation();
                            window.open(wallet.downloadUrl, '_blank');
                          }}
                        >
                          Install
                        </Button>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}