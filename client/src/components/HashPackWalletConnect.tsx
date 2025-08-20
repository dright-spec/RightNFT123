import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Wallet, LogOut, Copy, MessageSquare, AlertCircle } from "lucide-react";
import { connectHashPack, signMessage, disconnect, WCSession, getHederaAccountId, isHashPackWallet } from "@/lib/wc-hedera";
import { useToast } from "@/hooks/use-toast";

interface HashPackWalletConnectProps {
  onConnect?: (session: WCSession, accountId: string) => void;
  onDisconnect?: () => void;
}

export function HashPackWalletConnect({ onConnect, onDisconnect }: HashPackWalletConnectProps) {
  const [wc, setWc] = useState<WCSession | null>(null);
  const [accountId, setAccountId] = useState<string>("");
  const [isConnecting, setIsConnecting] = useState(false);
  const [isSigning, setIsSigning] = useState(false);
  const { toast } = useToast();

  const handleConnect = async () => {
    setIsConnecting(true);
    try {
      const session = await connectHashPack({ 
        chains: ["hedera:mainnet"], 
        themeMode: "light" 
      });
      
      const hederaAccount = getHederaAccountId(session.session);
      if (!hederaAccount) {
        throw new Error("No Hedera account found in session");
      }

      setWc(session);
      setAccountId(hederaAccount);
      
      toast({
        title: "HashPack Connected!",
        description: `Connected with account ${hederaAccount.split(':')[2]}`,
      });

      onConnect?.(session, hederaAccount);
    } catch (error) {
      console.error("Connection failed:", error);
      toast({
        title: "Connection Failed",
        description: error instanceof Error ? error.message : "Failed to connect to HashPack",
        variant: "destructive",
      });
    } finally {
      setIsConnecting(false);
    }
  };

  const handleDisconnect = async () => {
    if (!wc) return;
    
    try {
      await disconnect({ client: wc.client, session: wc.session });
      setWc(null);
      setAccountId("");
      
      toast({
        title: "Disconnected",
        description: "HashPack wallet disconnected",
      });

      onDisconnect?.();
    } catch (error) {
      console.error("Disconnect failed:", error);
      toast({
        title: "Disconnect Failed",
        description: "Failed to disconnect wallet",
        variant: "destructive",
      });
    }
  };

  const handleSignMessage = async () => {
    if (!wc || !accountId) return;
    
    setIsSigning(true);
    try {
      const message = "Hello from Dright - Digital Rights Marketplace";
      const signature = await signMessage({
        client: wc.client,
        session: wc.session,
        signerAccountId: accountId,
        message,
      });
      
      console.log("Message signed:", signature);
      toast({
        title: "Message Signed!",
        description: "Successfully signed message with HashPack",
      });
    } catch (error) {
      console.error("Signing failed:", error);
      toast({
        title: "Signing Failed",
        description: error instanceof Error ? error.message : "Failed to sign message",
        variant: "destructive",
      });
    } finally {
      setIsSigning(false);
    }
  };

  const copyAccountId = async () => {
    if (accountId) {
      const shortId = accountId.split(':')[2]; // Extract just the account number
      await navigator.clipboard.writeText(shortId);
      toast({
        title: "Account ID Copied!",
        description: `${shortId} copied to clipboard`,
      });
    }
  };

  const formatAccountId = (fullAccountId: string) => {
    const parts = fullAccountId.split(':');
    const accountNumber = parts[2] || fullAccountId;
    return accountNumber.length > 10 ? `${accountNumber.slice(0, 6)}...${accountNumber.slice(-4)}` : accountNumber;
  };

  if (!wc) {
    return (
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <CardTitle className="flex items-center justify-center gap-2">
            <Wallet className="h-5 w-5" />
            Connect HashPack Wallet
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <Button 
            onClick={handleConnect}
            disabled={isConnecting}
            className="w-full gap-2"
            size="lg"
          >
            {isConnecting ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                Connecting...
              </>
            ) : (
              <>
                <Wallet className="h-4 w-4" />
                Connect HashPack
              </>
            )}
          </Button>
          
          <div className="text-center">
            <p className="text-sm text-muted-foreground">
              Uses WalletConnect protocol to connect securely
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  const isHashPack = isHashPackWallet(wc.session);
  const walletName = wc.session.peer.metadata?.name || "Unknown Wallet";

  return (
    <Card className="w-full max-w-md">
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 bg-green-500 rounded-full" />
            Connected
          </div>
          {isHashPack ? (
            <Badge variant="default" className="bg-purple-100 text-purple-800">
              HashPack
            </Badge>
          ) : (
            <Badge variant="secondary" className="gap-1">
              <AlertCircle className="h-3 w-3" />
              {walletName}
            </Badge>
          )}
        </CardTitle>
      </CardHeader>
      
      <CardContent className="space-y-4">
        <div className="p-3 bg-gray-50 rounded-lg">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium">Account ID</p>
              <p className="text-xs text-muted-foreground font-mono">
                {formatAccountId(accountId)}
              </p>
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={copyAccountId}
              className="gap-1"
            >
              <Copy className="h-3 w-3" />
            </Button>
          </div>
        </div>

        <div className="flex gap-2">
          <Dialog>
            <DialogTrigger asChild>
              <Button variant="outline" className="flex-1 gap-2">
                <MessageSquare className="h-4 w-4" />
                Test Sign
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Sign Test Message</DialogTitle>
              </DialogHeader>
              <div className="space-y-4">
                <p className="text-sm text-muted-foreground">
                  This will sign a test message using your HashPack wallet to verify the connection works.
                </p>
                <Button 
                  onClick={handleSignMessage}
                  disabled={isSigning}
                  className="w-full gap-2"
                >
                  {isSigning ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                      Signing...
                    </>
                  ) : (
                    <>
                      <MessageSquare className="h-4 w-4" />
                      Sign Message
                    </>
                  )}
                </Button>
              </div>
            </DialogContent>
          </Dialog>

          <Button 
            variant="outline" 
            onClick={handleDisconnect}
            className="flex-1 gap-2"
          >
            <LogOut className="h-4 w-4" />
            Disconnect
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}