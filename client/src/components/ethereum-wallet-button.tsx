import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Wallet, ExternalLink, AlertCircle, CheckCircle, Loader2 } from "lucide-react";
import { ethereumWallet, type WalletConnectionState } from "@/lib/ethereumWallet";
import { ethereumService } from "@/lib/ethereum";

export function EthereumWalletButton() {
  const [walletState, setWalletState] = useState<WalletConnectionState>({
    isConnected: false,
    accountAddress: null,
    network: null,
    error: null,
    isConnecting: false,
    chainId: null
  });
  const [showWalletModal, setShowWalletModal] = useState(false);
  const [balance, setBalance] = useState<{ eth: string; nfts: number } | null>(null);

  useEffect(() => {
    // Subscribe to wallet state changes
    const unsubscribe = ethereumWallet.subscribe((state) => {
      setWalletState(state);
      if (state.isConnected) {
        loadBalance();
      } else {
        setBalance(null);
      }
    });

    // Load initial state
    setWalletState(ethereumWallet.getState());

    return unsubscribe;
  }, []);

  const loadBalance = async () => {
    try {
      const balanceData = await ethereumWallet.getBalance();
      setBalance(balanceData);
    } catch (error) {
      console.error('Failed to load balance:', error);
    }
  };

  const handleConnect = async () => {
    try {
      await ethereumWallet.connectMetaMask();
      setShowWalletModal(false);
    } catch (error) {
      console.error('Connection failed:', error);
    }
  };

  const handleDisconnect = async () => {
    try {
      await ethereumWallet.disconnect();
    } catch (error) {
      console.error('Disconnect failed:', error);
    }
  };

  const switchNetwork = async () => {
    try {
      await ethereumWallet.switchNetwork();
    } catch (error) {
      console.error('Network switch failed:', error);
    }
  };

  const formatAddress = (address: string) => {
    return `${address.slice(0, 6)}...${address.slice(-4)}`;
  };

  const isWrongNetwork = walletState.network && !['mainnet', 'sepolia'].includes(walletState.network);

  if (walletState.isConnected) {
    return (
      <div className="flex items-center gap-3">
        {/* Network Status */}
        {isWrongNetwork && (
          <Button
            variant="destructive"
            size="sm"
            onClick={switchNetwork}
            className="flex items-center gap-2"
          >
            <AlertCircle className="w-4 h-4" />
            Switch Network
          </Button>
        )}

        {/* Balance Display */}
        {balance && !isWrongNetwork && (
          <div className="hidden sm:flex items-center gap-2 px-3 py-1 bg-muted rounded-full">
            <span className="text-sm font-medium">{balance.eth} ETH</span>
            <span className="text-xs text-muted-foreground">•</span>
            <span className="text-sm text-muted-foreground">{balance.nfts} NFTs</span>
          </div>
        )}

        {/* Wallet Info */}
        <Dialog open={showWalletModal} onOpenChange={setShowWalletModal}>
          <DialogTrigger asChild>
            <Button variant="outline" className="flex items-center gap-2">
              <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
              <span className="hidden sm:inline">{formatAddress(walletState.accountAddress!)}</span>
              <Wallet className="w-4 h-4" />
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <Wallet className="w-5 h-5" />
                Wallet Connected
              </DialogTitle>
              <DialogDescription>
                Your MetaMask wallet is connected and ready to use
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div className="flex items-center justify-between p-4 bg-muted rounded-lg">
                <div>
                  <p className="font-medium">Address</p>
                  <p className="text-sm text-muted-foreground">{walletState.accountAddress}</p>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => navigator.clipboard.writeText(walletState.accountAddress!)}
                >
                  Copy
                </Button>
              </div>

              <div className="flex items-center justify-between p-4 bg-muted rounded-lg">
                <div>
                  <p className="font-medium">Network</p>
                  <p className="text-sm text-muted-foreground capitalize">{walletState.network}</p>
                </div>
                <Badge variant={isWrongNetwork ? "destructive" : "secondary"}>
                  {isWrongNetwork ? "Wrong Network" : "Connected"}
                </Badge>
              </div>

              {balance && (
                <div className="grid grid-cols-2 gap-4">
                  <div className="p-4 bg-muted rounded-lg text-center">
                    <p className="text-2xl font-bold">{balance.eth}</p>
                    <p className="text-sm text-muted-foreground">ETH</p>
                  </div>
                  <div className="p-4 bg-muted rounded-lg text-center">
                    <p className="text-2xl font-bold">{balance.nfts}</p>
                    <p className="text-sm text-muted-foreground">NFTs</p>
                  </div>
                </div>
              )}

              <div className="flex gap-2">
                <Button
                  variant="outline"
                  onClick={() => window.open(ethereumWallet.getTransactionUrl(walletState.accountAddress!), '_blank')}
                  className="flex items-center gap-2"
                >
                  <ExternalLink className="w-4 h-4" />
                  View on Etherscan
                </Button>
                <Button
                  variant="destructive"
                  onClick={handleDisconnect}
                  className="flex-1"
                >
                  Disconnect
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>
    );
  }

  return (
    <Dialog open={showWalletModal} onOpenChange={setShowWalletModal}>
      <DialogTrigger asChild>
        <Button className="flex items-center gap-2">
          <Wallet className="w-4 h-4" />
          Connect Wallet
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Wallet className="w-5 h-5" />
            Connect Your Wallet
          </DialogTitle>
          <DialogDescription>
            Connect your Ethereum wallet to start creating and trading rights NFTs
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {walletState.error && (
            <div className="p-4 bg-destructive/10 border border-destructive/20 rounded-lg">
              <div className="flex items-center gap-2 text-destructive">
                <AlertCircle className="w-4 h-4" />
                <span className="text-sm font-medium">Connection Error</span>
              </div>
              <p className="text-sm text-destructive/80 mt-1">{walletState.error}</p>
            </div>
          )}

          <Card className="cursor-pointer hover:shadow-md transition-shadow" onClick={handleConnect}>
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-gradient-to-br from-orange-500 to-orange-600 rounded-lg flex items-center justify-center">
                    <span className="text-white font-bold text-sm">M</span>
                  </div>
                  <div>
                    <CardTitle className="text-lg">MetaMask</CardTitle>
                    <CardDescription>Most popular Ethereum wallet</CardDescription>
                  </div>
                </div>
                {walletState.isConnecting ? (
                  <Loader2 className="w-5 h-5 animate-spin" />
                ) : (
                  <CheckCircle className="w-5 h-5 text-green-600" />
                )}
              </div>
            </CardHeader>
            <CardContent className="pt-0">
              <p className="text-sm text-muted-foreground">
                Connect using browser extension or mobile app
              </p>
            </CardContent>
          </Card>

          <div className="text-center">
            <p className="text-sm text-muted-foreground">
              Don't have MetaMask?{" "}
              <a
                href="https://metamask.io/"
                target="_blank"
                rel="noopener noreferrer"
                className="text-primary hover:underline"
              >
                Install it here
              </a>
            </p>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}