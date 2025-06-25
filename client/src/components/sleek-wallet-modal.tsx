import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { getAvailableWallets, type WalletInfo } from "@/utils/detectWallets";
import { HashPackConnector } from "@/utils/hashpack-connector";

interface SleekWalletModalProps {
  open: boolean;
  onClose: () => void;
  onConnect?: (address: string) => void;
}

export function SleekWalletModal({ open, onClose, onConnect }: SleekWalletModalProps) {
  const [isConnecting, setIsConnecting] = useState(false);
  const [wallets, setWallets] = useState<WalletInfo[]>([]);
  const { toast } = useToast();

  useEffect(() => {
    if (open) {
      // Wait a bit for wallets to inject, then refresh detection
      setTimeout(() => {
        console.log('Refreshing wallet detection...');
        setWallets(getAvailableWallets());
      }, 500);
      
      // Also refresh immediately
      setWallets(getAvailableWallets());
    }
  }, [open]);

  if (!open) return null;

  const handleWalletConnect = async (walletId: string) => {
    setIsConnecting(true);
    
    try {
      if (walletId === 'hashpack') {
        console.log('🚀 Starting HashPack connection via official HashConnect SDK...');
        
        try {
          const { HashPackConnector } = await import('@/utils/hashpack-connector');
          const connector = new HashPackConnector();
          console.log('🔄 Initializing connection to HashPack wallet...');
          
          const accountId = await connector.connect();
          
          console.log('✅ HashPack connected successfully:', accountId);
          onConnect?.(accountId);
          onClose();
          toast({
            title: "HashPack Connected",
            description: `Connected to Hedera account ${accountId}`,
          });
          return;
          
        } catch (error) {
          console.error('❌ HashPack connection failed:', error);
          toast({
            title: "HashPack Connection Failed",
            description: `${(error as Error).message || 'Unknown error occurred'}`,
            variant: "destructive",
          });
          return;
        }
      }
      
      if (walletId === 'metamask') {
        if ((window as any).ethereum?.isMetaMask) {
          const accounts = await (window as any).ethereum.request({
            method: 'eth_requestAccounts'
          });
          
          if (accounts && accounts.length > 0) {
            onConnect?.(accounts[0]);
            onClose();
            toast({
              title: "MetaMask Connected",
              description: "Successfully connected to MetaMask",
            });
            return;
          }
        } else {
          toast({
            title: "MetaMask Not Found",
            description: "Please install MetaMask wallet extension",
            variant: "destructive",
          });
          return;
        }
      }

      // Fallback to Web3Modal for WalletConnect and other wallets
      const modal = document.querySelector('w3m-modal');
      if (modal) {
        (modal as any).open();
        onClose();
      } else {
        throw new Error('No wallet connection method available');
      }
    } catch (error) {
      console.error('Connection failed:', error);
      toast({
        title: "Connection Failed",
        description: "Failed to connect wallet. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsConnecting(false);
    }
  };

  const getWalletGradient = (walletId: string) => {
    const gradients: Record<string, string> = {
      hashpack: "from-yellow-500 to-orange-500",
      metamask: "from-orange-500 to-red-500", 
      walletconnect: "from-blue-500 to-purple-500",
      blade: "from-purple-500 to-pink-500"
    };
    return gradients[walletId] || "from-gray-500 to-gray-600";
  };

  return (
    <div className="fixed inset-0 bg-black/70 backdrop-blur-md flex items-center justify-center z-50 animate-in fade-in duration-300">
      <div className="bg-white dark:bg-gray-900 rounded-3xl p-8 max-w-lg w-full mx-4 shadow-2xl border border-gray-200 dark:border-gray-700 animate-in zoom-in-95 duration-300">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="w-20 h-20 bg-gradient-to-r from-blue-500 via-purple-500 to-pink-500 rounded-3xl mx-auto mb-6 flex items-center justify-center shadow-xl">
            <svg width="40" height="40" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M12 2L13.09 8.26L19 7L17.91 13.26L23 12L21.91 18.26L18 17L16.91 23.26L12 22L7.09 23.26L6 17L2.09 18.26L1 12L5.09 13.26L4 7L10.91 8.26L12 2Z" fill="white"/>
            </svg>
          </div>
          <h2 className="text-3xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent mb-3">
            Connect Your Wallet
          </h2>
          <p className="text-gray-600 dark:text-gray-400 text-lg leading-relaxed">
            Choose your preferred wallet to securely access the Hedera marketplace
          </p>
        </div>

        {/* Wallet Options */}
        <div className="space-y-4 mb-8">
          {wallets.map((wallet, index) => (
            <button
              key={wallet.id}
              onClick={() => handleWalletConnect(wallet.id)}
              disabled={!wallet.isAvailable || isConnecting}
              className={`w-full p-4 rounded-2xl border-2 transition-all duration-200 transform hover:scale-[1.02] active:scale-[0.98] ${
                wallet.isAvailable
                  ? 'border-gray-200 dark:border-gray-700 hover:border-blue-300 dark:hover:border-blue-600 bg-white dark:bg-gray-800 hover:bg-blue-50 dark:hover:bg-blue-900/20 shadow-md hover:shadow-xl'
                  : 'border-gray-100 dark:border-gray-800 bg-gray-50 dark:bg-gray-900 opacity-60 cursor-not-allowed'
              }`}
              style={{ animationDelay: `${index * 100}ms` }}
            >
              <div className="flex items-center gap-4">
                <div className={`w-12 h-12 rounded-xl bg-gradient-to-r ${getWalletGradient(wallet.id)} flex items-center justify-center text-2xl shadow-lg`}>
                  {wallet.icon}
                </div>
                <div className="flex-1 text-left">
                  <div className="flex items-center gap-2">
                    <h3 className="font-semibold text-gray-900 dark:text-white text-lg">
                      {wallet.name}
                    </h3>
                    {wallet.isRecommended && (
                      <span className="px-2 py-1 bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300 text-xs rounded-full font-medium">
                        Recommended
                      </span>
                    )}
                    {wallet.isHederaNative && (
                      <span className="px-2 py-1 bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 text-xs rounded-full font-medium">
                        Hedera
                      </span>
                    )}
                  </div>
                  <p className="text-gray-600 dark:text-gray-400 text-sm">
                    {wallet.description}
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  {wallet.isAvailable ? (
                    <>
                      <div className="w-3 h-3 bg-green-500 rounded-full animate-pulse"></div>
                      <span className="text-sm font-medium text-green-600 dark:text-green-400">
                        Available
                      </span>
                    </>
                  ) : (
                    <div className="text-right">
                      <span className="text-sm text-gray-400 block">
                        Not Installed
                      </span>
                      <a 
                        href={wallet.downloadUrl} 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="text-xs text-blue-500 hover:text-blue-600"
                        onClick={(e) => e.stopPropagation()}
                      >
                        Install
                      </a>
                    </div>
                  )}
                </div>
              </div>
            </button>
          ))}
        </div>

        {/* Security Notice */}
        <div className="bg-blue-50 dark:bg-blue-900/20 rounded-2xl p-4 mb-6 border border-blue-200 dark:border-blue-800">
          <div className="flex items-start gap-3">
            <div className="w-6 h-6 bg-blue-500 rounded-lg flex items-center justify-center flex-shrink-0 mt-0.5">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M12 1L3 5V11C3 16.55 6.84 21.74 12 23C17.16 21.74 21 16.55 21 11V5L12 1Z" fill="white"/>
              </svg>
            </div>
            <div>
              <h4 className="font-semibold text-blue-900 dark:text-blue-100 mb-1">
                Secure Connection
              </h4>
              <p className="text-blue-700 dark:text-blue-200 text-sm leading-relaxed">
                Your wallet connection is encrypted and secure. We never store your private keys or access your funds without permission.
              </p>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="text-center pt-4 border-t border-gray-200 dark:border-gray-700">
          <div className="flex items-center justify-center gap-2 text-sm text-gray-500">
            <span>Powered by</span>
            <div className="flex items-center gap-2 font-semibold">
              <div className="w-5 h-5 bg-gradient-to-r from-blue-500 to-purple-600 rounded-md"></div>
              <span className="bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                WalletConnect
              </span>
            </div>
            <span>•</span>
            <div className="flex items-center gap-2 font-semibold">
              <div className="w-5 h-5 bg-gradient-to-r from-green-500 to-blue-500 rounded-md"></div>
              <span className="bg-gradient-to-r from-green-600 to-blue-600 bg-clip-text text-transparent">
                Hedera
              </span>
            </div>
          </div>
        </div>

        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-6 right-6 w-10 h-10 flex items-center justify-center rounded-xl text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 transition-all duration-200 transform hover:scale-110 active:scale-95"
        >
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M18 6L6 18M6 6l12 12" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
        </button>

        {/* Loading Overlay */}
        {isConnecting && (
          <div className="absolute inset-0 bg-white/80 dark:bg-gray-900/80 backdrop-blur-sm rounded-3xl flex items-center justify-center">
            <div className="text-center">
              <div className="w-16 h-16 border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin mx-auto mb-4"></div>
              <p className="text-gray-600 dark:text-gray-400 font-medium">
                Connecting to wallet...
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}