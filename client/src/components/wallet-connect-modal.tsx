import { useState } from "react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Loader2, Wallet, ExternalLink, AlertCircle, CheckCircle } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface WalletOption {
  id: string;
  name: string;
  description: string;
  icon: string;
  isRecommended?: boolean;
  isHederaNative?: boolean;
  downloadUrl?: string;
  status: 'available' | 'not_installed' | 'connecting' | 'connected';
}

interface WalletConnectModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onConnect: (walletId: string, address: string) => void;
}

export function WalletConnectModal({ open, onOpenChange, onConnect }: WalletConnectModalProps) {
  const [connecting, setConnecting] = useState<string | null>(null);
  const { toast } = useToast();

  // Detect available wallets
  const detectWalletStatus = (walletId: string): 'available' | 'not_installed' => {
    switch (walletId) {
      case 'hashpack':
        // HashPack injects itself as window.hashpack, not hashconnect
        return (window as any).hashpack ? 'available' : 'not_installed';
      case 'blade':
        return (window as any).bladeWallet ? 'available' : 'not_installed';
      case 'metamask':
        return (window as any).ethereum?.isMetaMask ? 'available' : 'not_installed';
      case 'walletconnect':
        return 'available'; // WalletConnect is always available via QR
      default:
        return 'not_installed';
    }
  };

  const walletOptions: WalletOption[] = [
    {
      id: 'hashpack',
      name: 'HashPack',
      description: 'Official Hedera wallet with native HTS support',
      icon: '🟡',
      isRecommended: true,
      isHederaNative: true,
      downloadUrl: 'https://www.hashpack.app/',
      status: detectWalletStatus('hashpack')
    },
    {
      id: 'blade',
      name: 'Blade Wallet',
      description: 'Multi-chain wallet with Hedera support',
      icon: '⚔️',
      isHederaNative: true,
      downloadUrl: 'https://bladewallet.io/',
      status: detectWalletStatus('blade')
    },
    {
      id: 'walletconnect',
      name: 'WalletConnect',
      description: 'Connect with 300+ wallets via QR code',
      icon: '🔗',
      downloadUrl: 'https://walletconnect.com/',
      status: detectWalletStatus('walletconnect')
    },
    {
      id: 'metamask',
      name: 'MetaMask',
      description: 'Popular Ethereum wallet (limited Hedera support)',
      icon: '🦊',
      downloadUrl: 'https://metamask.io/',
      status: detectWalletStatus('metamask')
    }
  ];

  const connectWallet = async (walletId: string) => {
    setConnecting(walletId);

    try {
      let address: string | null = null;

      switch (walletId) {
        case 'hashpack':
          address = await connectHashPack();
          break;
        case 'blade':
          address = await connectBlade();
          break;
        case 'walletconnect':
          address = await connectWalletConnect();
          break;
        case 'metamask':
          address = await connectMetaMask();
          break;
        default:
          throw new Error('Unsupported wallet');
      }

      if (address) {
        toast({
          title: "Wallet Connected",
          description: `Successfully connected to ${walletOptions.find(w => w.id === walletId)?.name}`,
        });
        onConnect(walletId, address);
        onOpenChange(false);
      }
    } catch (error) {
      console.error(`Failed to connect ${walletId}:`, error);
      toast({
        title: "Connection Failed",
        description: error instanceof Error ? error.message : `Failed to connect to ${walletId}`,
        variant: "destructive",
      });
    } finally {
      setConnecting(null);
    }
  };

  const connectHashPack = async (): Promise<string> => {
    if (!(window as any).hashpack) {
      throw new Error('HashPack wallet not installed. Please install the HashPack browser extension.');
    }

    try {
      const hashpack = (window as any).hashpack;
      
      // Request account info which should prompt the user to connect if not already connected
      const result = await hashpack.requestAccountInfo();
      
      if (!result || !result.accountId) {
        throw new Error('Failed to get account information from HashPack');
      }
      
      const accountId = result.accountId;
      console.log('HashPack connected successfully:', accountId);
      
      // Verify this is a real Hedera account ID format
      if (!/^0\.0\.\d+$/.test(accountId)) {
        throw new Error('Invalid Hedera account ID format received from HashPack');
      }
      
      // Store connection state
      localStorage.setItem('hashpack_connected', 'true');
      localStorage.setItem('hashpack_account', accountId);
      
      return accountId;
    } catch (error) {
      console.error('HashPack connection error:', error);
      // Handle user rejection gracefully
      if (error.message?.includes('User rejected') || error.code === 4001) {
        throw new Error('Connection cancelled by user');
      }
      throw new Error(`HashPack connection failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  };

  const connectBlade = async (): Promise<string> => {
    if (!(window as any).bladeWallet) {
      throw new Error('Blade wallet not installed');
    }

    const blade = (window as any).bladeWallet;
    const result = await blade.connect();
    
    if (result.success && result.accountId) {
      return result.accountId;
    }

    throw new Error('Failed to connect Blade wallet');
  };

  const connectWalletConnect = async (): Promise<string> => {
    // For now, return a mock address
    // In production, implement actual WalletConnect v2 integration
    throw new Error('WalletConnect integration coming soon');
  };

  const connectMetaMask = async (): Promise<string> => {
    if (!(window as any).ethereum?.isMetaMask) {
      throw new Error('MetaMask not installed');
    }

    const accounts = await (window as any).ethereum.request({
      method: 'eth_requestAccounts'
    });

    if (accounts && accounts.length > 0) {
      return accounts[0];
    }

    throw new Error('Failed to connect MetaMask');
  };

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
          {walletOptions.map((wallet) => (
            <Card 
              key={wallet.id}
              className={`cursor-pointer transition-all duration-200 hover:shadow-md ${
                wallet.status === 'available' ? 'hover:border-primary/50' : 'opacity-60'
              }`}
            >
              <CardContent className="p-4">
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
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    {wallet.status === 'available' ? (
                      <Button
                        onClick={() => connectWallet(wallet.id)}
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
              </CardContent>
            </Card>
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