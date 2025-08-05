import React from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Loader2, Wallet, ExternalLink } from 'lucide-react';
import { useMultiWallet } from '@/contexts/MultiWalletContext';

interface MultiWalletModalProps {
  isOpen: boolean;
  onClose: () => void;
}

interface WalletOption {
  id: 'metamask' | 'hashpack';
  name: string;
  description: string;
  network: string;
  icon: string;
  installUrl?: string;
}

const walletOptions: WalletOption[] = [
  {
    id: 'hashpack',
    name: 'HashPack',
    description: 'The premier wallet for Hedera network - Recommended',
    network: 'Hedera Network',
    icon: '🟣',
    installUrl: 'https://www.hashpack.app/'
  },
  {
    id: 'metamask',
    name: 'MetaMask',
    description: 'Legacy Ethereum support (deprecated)',
    network: 'Ethereum Network',
    icon: '🦊',
    installUrl: 'https://metamask.io/download/'
  }
];

export function MultiWalletModal({ isOpen, onClose }: MultiWalletModalProps) {
  const { connectWallet, isConnecting } = useMultiWallet();
  const [selectedWallet, setSelectedWallet] = React.useState<string | null>(null);
  const [error, setError] = React.useState<string | null>(null);

  const handleWalletConnect = async (walletId: 'metamask' | 'hashpack') => {
    console.log(`Attempting to connect to ${walletId}...`);
    setSelectedWallet(walletId);
    setError(null);

    try {
      await connectWallet(walletId);
      onClose();
    } catch (err: any) {
      console.error(`${walletId} connection error:`, err);
      setError(err.message || 'Failed to connect wallet');
      setSelectedWallet(null);
    }
  };

  const checkWalletInstalled = (walletId: string): boolean => {
    if (walletId === 'hashpack') {
      // HashPack is always available via WalletConnect
      return true;
    }
    if (walletId === 'metamask') {
      return typeof window.ethereum !== 'undefined';
    }
    return false;
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Connect to Hedera Network</DialogTitle>
          <DialogDescription>
            Choose a wallet to connect to Dright - Digital Rights Marketplace on Hedera
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-3 mt-4">
          {walletOptions.map((wallet) => {
            const isInstalled = checkWalletInstalled(wallet.id);
            const isLoading = isConnecting && selectedWallet === wallet.id;

            return (
              <Card
                key={wallet.id}
                className={`p-4 cursor-pointer transition-all hover:border-primary ${
                  selectedWallet === wallet.id ? 'border-primary' : ''
                } ${wallet.id === 'hashpack' ? 'border-2 border-purple-200 bg-purple-50/30' : ''} ${
                  wallet.id === 'metamask' ? 'opacity-60' : ''
                }`}
                onClick={() => isInstalled && handleWalletConnect(wallet.id)}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <div className="w-10 h-10 bg-gray-100 dark:bg-gray-800 rounded-lg flex items-center justify-center">
                      <Wallet className="w-6 h-6" />
                    </div>
                    <div>
                      <h3 className="font-semibold">{wallet.name}</h3>
                      <p className="text-sm text-muted-foreground">{wallet.network}</p>
                    </div>
                  </div>
                  
                  {isLoading ? (
                    <Loader2 className="w-5 h-5 animate-spin" />
                  ) : !isInstalled ? (
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={(e) => {
                        e.stopPropagation();
                        window.open(wallet.installUrl, '_blank');
                      }}
                    >
                      Install
                      <ExternalLink className="w-3 h-3 ml-1" />
                    </Button>
                  ) : (
                    <Button size="sm" variant="ghost">
                      Connect
                    </Button>
                  )}
                </div>
              </Card>
            );
          })}
        </div>

        {error && (
          <div className="mt-3 p-3 bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 rounded-lg text-sm">
            {error}
          </div>
        )}

        <div className="mt-4 text-xs text-muted-foreground text-center">
          By connecting, you agree to our Terms of Service and Privacy Policy
        </div>
      </DialogContent>
    </Dialog>
  );
}