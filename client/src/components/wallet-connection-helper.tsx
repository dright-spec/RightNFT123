import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { ExternalLink, Wallet, CheckCircle, XCircle, RefreshCw, Download } from "lucide-react";

interface WalletDetectionResult {
  hashpack: boolean;
  blade: boolean;
  detected: boolean;
}

interface WalletConnectionHelperProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function WalletConnectionHelper({ open, onOpenChange }: WalletConnectionHelperProps) {
  const [detection, setDetection] = useState<WalletDetectionResult>({
    hashpack: false,
    blade: false,
    detected: false
  });
  const [isDetecting, setIsDetecting] = useState(false);

  const detectWallets = async () => {
    setIsDetecting(true);
    
    // Wait for extensions to fully load
    await new Promise(resolve => setTimeout(resolve, 500));
    
    const hashpack = !!(window as any).hashpack;
    const blade = !!((window as any).bladeSDK || (window as any).blade);
    
    console.log('Wallet detection:', { hashpack, blade });
    
    setDetection({
      hashpack,
      blade,
      detected: hashpack || blade
    });
    
    setIsDetecting(false);
  };

  useEffect(() => {
    if (open) {
      detectWallets();
    }
  }, [open]);

  const refreshDetection = () => {
    detectWallets();
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Wallet className="w-5 h-5" />
            Hedera Wallet Setup
          </DialogTitle>
          <DialogDescription>
            Connect your Hedera wallet to interact with the marketplace
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* Detection Status */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg flex items-center justify-between">
                Wallet Detection
                <Button
                  variant="outline"
                  size="sm"
                  onClick={refreshDetection}
                  disabled={isDetecting}
                  className="transition-all duration-300 hover:scale-105"
                >
                  <RefreshCw className={`w-4 h-4 mr-2 ${isDetecting ? 'animate-spin' : ''}`} />
                  Refresh
                </Button>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <div className="flex items-center justify-between p-3 border rounded-lg">
                  <div className="flex items-center gap-3">
                    <img 
                      src="https://hashpack.app/img/logo.png" 
                      alt="HashPack" 
                      className="w-8 h-8 rounded"
                    />
                    <div>
                      <div className="font-medium">HashPack</div>
                      <div className="text-sm text-muted-foreground">Most popular Hedera wallet</div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    {detection.hashpack ? (
                      <Badge className="flex items-center gap-1 bg-green-100 text-green-800 hover:bg-green-200">
                        <CheckCircle className="w-3 h-3" />
                        Detected
                      </Badge>
                    ) : (
                      <Badge variant="secondary" className="flex items-center gap-1">
                        <XCircle className="w-3 h-3" />
                        Not Found
                      </Badge>
                    )}
                  </div>
                </div>

                <div className="flex items-center justify-between p-3 border rounded-lg">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 bg-gradient-to-r from-blue-600 to-purple-600 rounded flex items-center justify-center">
                      <span className="text-white font-bold text-sm">B</span>
                    </div>
                    <div>
                      <div className="font-medium">Blade Wallet</div>
                      <div className="text-sm text-muted-foreground">Multi-chain wallet with Hedera support</div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    {detection.blade ? (
                      <Badge className="flex items-center gap-1 bg-green-100 text-green-800 hover:bg-green-200">
                        <CheckCircle className="w-3 h-3" />
                        Detected
                      </Badge>
                    ) : (
                      <Badge variant="secondary" className="flex items-center gap-1">
                        <XCircle className="w-3 h-3" />
                        Not Found
                      </Badge>
                    )}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Status Alert */}
          {detection.detected ? (
            <Alert className="border-green-200 bg-green-50 dark:border-green-800 dark:bg-green-950/30">
              <CheckCircle className="h-4 w-4 text-green-600" />
              <AlertDescription className="text-green-800 dark:text-green-200">
                Wallet extension detected! You can now connect to the marketplace.
              </AlertDescription>
            </Alert>
          ) : (
            <Alert className="border-amber-200 bg-amber-50 dark:border-amber-800 dark:bg-amber-950/30">
              <Download className="h-4 w-4 text-amber-600" />
              <AlertDescription className="text-amber-800 dark:text-amber-200">
                No Hedera wallet extensions found. Please install one of the supported wallets below.
              </AlertDescription>
            </Alert>
          )}

          {/* Installation Guide */}
          {!detection.detected && (
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Install a Hedera Wallet</CardTitle>
                <CardDescription>
                  Choose one of these trusted wallet extensions
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid gap-4">
                  <div className="flex items-center justify-between p-4 border rounded-lg hover:bg-muted/50 transition-colors">
                    <div className="flex items-center gap-3">
                      <img 
                        src="https://hashpack.app/img/logo.png" 
                        alt="HashPack" 
                        className="w-10 h-10 rounded"
                      />
                      <div>
                        <div className="font-medium">HashPack (Recommended)</div>
                        <div className="text-sm text-muted-foreground">
                          Official Hedera wallet with best marketplace support
                        </div>
                      </div>
                    </div>
                    <Button asChild className="transition-all duration-300 hover:scale-105">
                      <a 
                        href="https://chrome.google.com/webstore/detail/hashpack/gjagmgiddbbciopjhllkdnddhcglnemk" 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="flex items-center gap-2"
                      >
                        Install
                        <ExternalLink className="w-4 h-4" />
                      </a>
                    </Button>
                  </div>

                  <div className="flex items-center justify-between p-4 border rounded-lg hover:bg-muted/50 transition-colors">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-gradient-to-r from-blue-600 to-purple-600 rounded flex items-center justify-center">
                        <span className="text-white font-bold">B</span>
                      </div>
                      <div>
                        <div className="font-medium">Blade Wallet</div>
                        <div className="text-sm text-muted-foreground">
                          Multi-chain wallet with Hedera integration
                        </div>
                      </div>
                    </div>
                    <Button asChild variant="outline" className="transition-all duration-300 hover:scale-105">
                      <a 
                        href="https://chrome.google.com/webstore/detail/blade-%E2%80%93-hedera-web3-digit/abogmiocnneedmmepnohnhlijcjpcifd" 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="flex items-center gap-2"
                      >
                        Install
                        <ExternalLink className="w-4 h-4" />
                      </a>
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Troubleshooting */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Troubleshooting</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3 text-sm">
                <div className="flex gap-2">
                  <span className="font-medium">1.</span>
                  <span>Make sure your wallet extension is enabled in your browser</span>
                </div>
                <div className="flex gap-2">
                  <span className="font-medium">2.</span>
                  <span>Refresh this page after installing or enabling the extension</span>
                </div>
                <div className="flex gap-2">
                  <span className="font-medium">3.</span>
                  <span>Ensure your wallet is unlocked and has a Hedera account</span>
                </div>
                <div className="flex gap-2">
                  <span className="font-medium">4.</span>
                  <span>Try disabling ad blockers or privacy extensions temporarily</span>
                </div>
                <div className="flex gap-2">
                  <span className="font-medium">5.</span>
                  <span>Clear browser cache and cookies for this site</span>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Action Buttons */}
          <div className="flex gap-3 pt-4">
            {detection.detected ? (
              <Button 
                onClick={() => onOpenChange(false)} 
                className="flex-1 transition-all duration-300 hover:scale-105"
              >
                Continue to Connect Wallet
              </Button>
            ) : (
              <Button 
                variant="outline" 
                onClick={refreshDetection}
                className="flex-1 transition-all duration-300 hover:scale-105"
                disabled={isDetecting}
              >
                {isDetecting ? (
                  <>
                    <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                    Checking...
                  </>
                ) : (
                  <>
                    <RefreshCw className="w-4 h-4 mr-2" />
                    Check Again
                  </>
                )}
              </Button>
            )}
            <Button 
              variant="ghost" 
              onClick={() => onOpenChange(false)}
              className="transition-all duration-300 hover:scale-105"
            >
              Close
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}