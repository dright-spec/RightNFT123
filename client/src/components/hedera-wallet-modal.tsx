import React, { useState } from "react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Wallet, ExternalLink, AlertCircle, CheckCircle, Loader2, Star, Download } from "lucide-react";
import { hederaWalletManager } from "@/lib/hedera-wallet-manager";
import { useToast } from "@/hooks/use-toast";

interface HederaWalletModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConnect?: (accountId: string) => void;
}

export function HederaWalletModal({ isOpen, onClose, onConnect }: HederaWalletModalProps) {
  const [isConnecting, setIsConnecting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { toast } = useToast();

  const handleHashPackConnect = async () => {
    setIsConnecting(true);
    setError(null);

    try {
      console.log('Connecting to HashPack...');
      
      // Initialize and connect
      await hederaWalletManager.initialize('mainnet');
      const accountId = await hederaWalletManager.connectHashPack();
      
      console.log('HashPack connected:', accountId);
      
      toast({
        title: "HashPack Connected",
        description: `Connected to account ${accountId}`,
      });

      if (onConnect) {
        onConnect(accountId);
      }
      
      onClose();
    } catch (error) {
      console.error('HashPack connection failed:', error);
      const errorMessage = error instanceof Error ? error.message : 'Failed to connect HashPack';
      setError(errorMessage);
      
      toast({
        variant: "destructive",
        title: "Connection Failed",
        description: errorMessage,
      });
    } finally {
      setIsConnecting(false);
    }
  };

  const handleDownloadHashPack = () => {
    window.open('https://www.hashpack.app/', '_blank');
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <div className="w-6 h-6 rounded-full bg-purple-100 flex items-center justify-center">
              <span className="text-sm">🟣</span>
            </div>
            Connect to Hedera Network
          </DialogTitle>
          <DialogDescription>
            Connect your HashPack wallet to trade digital rights on the Hedera blockchain
          </DialogDescription>
        </DialogHeader>
        
        <div className="space-y-4">
          {/* HashPack Primary Option */}
          <Card className="border-2 border-purple-200 bg-purple-50/30">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg bg-purple-100 flex items-center justify-center">
                    <span className="text-lg">🟣</span>
                  </div>
                  <div>
                    <CardTitle className="text-base flex items-center gap-2">
                      HashPack
                      <Badge variant="secondary" className="text-xs">
                        <Star className="w-3 h-3 mr-1" />
                        Recommended
                      </Badge>
                    </CardTitle>
                    <CardDescription className="text-sm">
                      The premier wallet for Hedera network
                    </CardDescription>
                  </div>
                </div>
                <CheckCircle className="w-5 h-5 text-green-500" />
              </div>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="text-sm text-muted-foreground">
                <div className="flex items-center gap-2 mb-2">
                  <div className="w-1 h-1 bg-green-500 rounded-full"></div>
                  <span>Secure key management</span>
                </div>
                <div className="flex items-center gap-2 mb-2">
                  <div className="w-1 h-1 bg-green-500 rounded-full"></div>
                  <span>Native Hedera integration</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-1 h-1 bg-green-500 rounded-full"></div>
                  <span>Fast transaction processing</span>
                </div>
              </div>
              
              <Button 
                onClick={handleHashPackConnect}
                disabled={isConnecting}
                className="w-full"
              >
                {isConnecting ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Connecting...
                  </>
                ) : (
                  <>
                    <Wallet className="w-4 h-4 mr-2" />
                    Connect HashPack
                  </>
                )}
              </Button>
            </CardContent>
          </Card>

          {/* Error Display */}
          {error && (
            <div className="flex items-start gap-3 p-4 rounded-lg bg-destructive/10 border border-destructive/20">
              <AlertCircle className="w-5 h-5 text-destructive mt-0.5" />
              <div className="space-y-1">
                <p className="text-sm font-medium text-destructive">Connection Failed</p>
                <p className="text-sm text-destructive/80">{error}</p>
                {error.includes('not installed') && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleDownloadHashPack}
                    className="mt-2"
                  >
                    <Download className="w-4 h-4 mr-2" />
                    Download HashPack
                  </Button>
                )}
              </div>
            </div>
          )}

          {/* Help Section */}
          <div className="border-t pt-4">
            <div className="text-center space-y-2">
              <p className="text-sm text-muted-foreground">New to HashPack?</p>
              <div className="flex gap-2 justify-center">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => window.open('https://www.hashpack.app/', '_blank')}
                >
                  <ExternalLink className="w-4 h-4 mr-2" />
                  Get HashPack
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => window.open('https://help.hashpack.app/', '_blank')}
                >
                  Help & Support
                </Button>
              </div>
            </div>
          </div>

          {/* Network Info */}
          <div className="bg-muted/50 rounded-lg p-3">
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">Network:</span>
              <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
                Hedera Mainnet
              </Badge>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}