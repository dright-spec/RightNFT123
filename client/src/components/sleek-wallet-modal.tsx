import { useState, useEffect, useCallback } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Loader2, Search, RefreshCw } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { showErrorToast } from "@/lib/emoji-error-translator";
import {
  detectAvailableWallets,
  connectToWallet,
} from "@/lib/ethereum-wallet-manager";
import type { WalletInfo } from "@/lib/ethereum-wallet-manager";

interface WalletConnectModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onConnect: (walletId: string, address: string) => void;
}

// Use WalletInfo directly from ethereum-wallet-manager

export function SleekWalletModal({
  open,
  onOpenChange,
  onConnect,
}: WalletConnectModalProps) {
  const [wallets, setWallets] = useState<WalletInfo[]>([]);
  const [loading, setLoading] = useState(false);
  const [connectingId, setConnectingId] = useState<string | null>(null);
  const { toast } = useToast();

  // Detect wallets when `open` goes true
  useEffect(() => {
    if (!open) return;
    let active = true;
    setLoading(true);

    (async () => {
      try {
        const detected = await detectAvailableWallets();
        if (!active) return;
        setWallets(detected);
      } catch {
        if (!active) return;
        // fallback defaults (all fields filled)
        setWallets([
          {
            id: "metamask",
            name: "MetaMask",
            description: "Most popular Ethereum wallet with millions of users",
            icon: "🦊",
            isAvailable: Boolean((window as any).ethereum?.isMetaMask),
            isRecommended: true,
            isEthereumNative: true,
            downloadUrl: "https://metamask.io/",
          },
          {
            id: "phantom",
            name: "Phantom",
            description: "Multi-chain wallet supporting Ethereum and Solana",
            icon: "👻",
            isAvailable: Boolean((window as any).phantom?.ethereum),
            isRecommended: true,
            isEthereumNative: true,
            downloadUrl: "https://phantom.app/",
          },
          {
            id: "coinbase",
            name: "Coinbase Wallet",
            description: "Non-custodial wallet from Coinbase",
            icon: "🔵",
            isAvailable: Boolean((window as any).ethereum?.isCoinbaseWallet),
            isRecommended: false,
            isEthereumNative: true,
            downloadUrl: "https://wallet.coinbase.com/",
          },
        ]);
      } finally {
        if (active) setLoading(false);
      }
    })();

    return () => {
      active = false;
    };
  }, [open]);

  const handleConnect = useCallback(
    async (walletId: string) => {
      if (connectingId || loading) return;
      setConnectingId(walletId);

      try {
        const connectedWallet = await connectToWallet(walletId);
        if (!connectedWallet.address) throw new Error("No address returned");
        const wallet = wallets.find((w) => w.id === walletId)!;
        toast({
          title: "Wallet Connected",
          description: `Connected to ${wallet.name}`,
        });
        onConnect(walletId, connectedWallet.address);
        onOpenChange(false);
      } catch (err: any) {
        const wallet = wallets.find((w) => w.id === walletId);
        showErrorToast(
          err?.message || `Could not connect to ${wallet?.name || walletId}`,
          toast,
          'wallet'
        );
      } finally {
        setConnectingId(null);
      }
    },
    [connectingId, loading, wallets, onConnect, onOpenChange, toast]
  );



  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <span className="text-2xl">🔗</span>
            Connect Wallet
          </DialogTitle>
          <DialogDescription>
            Choose a wallet to connect to the Ethereum network. MetaMask is recommended for best experience.
            {!wallets.some(w => w.isAvailable) && (
              <span className="block text-amber-600 dark:text-amber-400 mt-1">
                No wallets detected. Please install a wallet extension to continue.
              </span>
            )}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {loading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="w-6 h-6 animate-spin mr-2" />
              Detecting wallets...
            </div>
          ) : (
            wallets.map((w) => (
              <div
                key={w.id}
                className={`
                  p-4 border rounded-lg transition-colors cursor-pointer
                  ${
                    w.isAvailable
                      ? "hover:bg-gray-50 dark:hover:bg-gray-800 border-gray-200 dark:border-gray-700"
                      : "bg-gray-50 dark:bg-gray-900/50 border-gray-100 dark:border-gray-800"
                  }
                `}
                onClick={() =>
                  w.isAvailable
                    ? handleConnect(w.id)
                    : window.open(w.downloadUrl, "_blank")
                }
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <div className="text-2xl">{w.icon}</div>
                    <div>
                      <h3 className="font-medium flex items-center gap-2">
                        {w.name}
                        {w.isRecommended && (
                          <span className="px-2 py-1 text-xs rounded-full bg-blue-100 text-blue-800">
                            Recommended
                          </span>
                        )}
                      </h3>
                      <p className="text-sm text-gray-600 dark:text-gray-400">
                        {w.description}
                      </p>
                      {w.isEthereumNative && (
                        <span className="inline-block mt-1 px-2 py-1 text-xs rounded-full bg-blue-100 text-blue-800">
                          Ethereum Native
                        </span>
                      )}
                    </div>
                  </div>
                  <div>
                    {w.isAvailable ? (
                      connectingId === w.id ? (
                        <div className="flex items-center text-green-600 text-sm font-medium gap-2">
                          <span className="w-4 h-4 border-2 border-green-500 border-t-transparent rounded-full animate-spin" />
                          Connecting…
                        </div>
                      ) : (
                        <span className="text-green-600 text-sm font-medium">
                          Available
                        </span>
                      )
                    ) : (
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={(e) => {
                          e.stopPropagation();
                          window.open(w.downloadUrl, "_blank");
                        }}
                      >
                        Install
                      </Button>
                    )}
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}