import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { ExternalLink, CheckCircle, AlertCircle, Download, RefreshCw } from "lucide-react";

interface WalletConnectionHelperProps {
  onRetryConnection: () => void;
  isConnecting: boolean;
}

export function WalletConnectionHelper({ onRetryConnection, isConnecting }: WalletConnectionHelperProps) {
  const [hashPackDetected, setHashPackDetected] = useState(false);
  const [browserSupported, setBrowserSupported] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    checkWalletAvailability();
  }, []);

  const checkWalletAvailability = () => {
    // Check if browser supports required APIs
    const supportsExtensions = typeof window !== 'undefined' && 
      ((window as any).chrome?.runtime || (window as any).browser?.runtime || (window as any).moz);
    
    setBrowserSupported(supportsExtensions);

    // Check for HashPack extension
    const providers = [
      (window as any).hashpack,
      (window as any).hashconnect,
      (window as any).ethereum?.isHashPack,
      (window as any).hedera
    ];

    const detected = providers.some(provider => provider !== undefined);
    setHashPackDetected(detected);
  };

  const handleInstallHashPack = () => {
    window.open('https://www.hashpack.app/download', '_blank');
    toast({
      title: "Opening HashPack Download",
      description: "Please install the extension and refresh this page.",
    });
  };

  const handleRefreshPage = () => {
    window.location.reload();
  };

  return (
    <Card className="w-full max-w-md mx-auto">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <AlertCircle className="w-5 h-5 text-amber-500" />
          Wallet Connection Setup
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Browser Compatibility */}
        <div className="flex items-center justify-between p-3 border rounded-lg">
          <span className="text-sm font-medium">Browser Support</span>
          <Badge variant={browserSupported ? "default" : "destructive"}>
            {browserSupported ? (
              <>
                <CheckCircle className="w-3 h-3 mr-1" />
                Supported
              </>
            ) : (
              <>
                <AlertCircle className="w-3 h-3 mr-1" />
                Unsupported
              </>
            )}
          </Badge>
        </div>

        {/* HashPack Detection */}
        <div className="flex items-center justify-between p-3 border rounded-lg">
          <span className="text-sm font-medium">HashPack Extension</span>
          <Badge variant={hashPackDetected ? "default" : "secondary"}>
            {hashPackDetected ? (
              <>
                <CheckCircle className="w-3 h-3 mr-1" />
                Detected
              </>
            ) : (
              <>
                <Download className="w-3 h-3 mr-1" />
                Not Found
              </>
            )}
          </Badge>
        </div>

        {/* Installation Steps */}
        {!hashPackDetected && (
          <Alert>
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              HashPack wallet extension is required to connect to Hedera blockchain.
            </AlertDescription>
          </Alert>
        )}

        {/* Action Buttons */}
        <div className="space-y-2">
          {!hashPackDetected ? (
            <>
              <Button 
                onClick={handleInstallHashPack}
                className="w-full"
                variant="default"
              >
                <Download className="w-4 h-4 mr-2" />
                Install HashPack
                <ExternalLink className="w-3 h-3 ml-2" />
              </Button>
              <Button 
                onClick={handleRefreshPage}
                variant="outline"
                className="w-full"
              >
                <RefreshCw className="w-4 h-4 mr-2" />
                Refresh Page
              </Button>
            </>
          ) : (
            <Button 
              onClick={onRetryConnection}
              disabled={isConnecting}
              className="w-full"
            >
              {isConnecting ? (
                <>
                  <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                  Connecting...
                </>
              ) : (
                <>
                  <CheckCircle className="w-4 h-4 mr-2" />
                  Connect HashPack
                </>
              )}
            </Button>
          )}
        </div>

        {/* Troubleshooting Tips */}
        <div className="text-xs text-muted-foreground space-y-1">
          <p className="font-medium">Troubleshooting:</p>
          <ul className="list-disc list-inside space-y-1">
            <li>Ensure HashPack extension is installed and enabled</li>
            <li>Make sure your HashPack wallet is unlocked</li>
            <li>Try refreshing the page after installing</li>
            <li>Check that you have a Hedera account in HashPack</li>
          </ul>
        </div>
      </CardContent>
    </Card>
  );
}