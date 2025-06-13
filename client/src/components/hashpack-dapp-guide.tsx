import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Copy, ExternalLink, Smartphone, Monitor, CheckCircle } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface HashPackDAppGuideProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onConnectionSuccess?: () => void;
}

export function HashPackDAppGuide({ open, onOpenChange, onConnectionSuccess }: HashPackDAppGuideProps) {
  const [step, setStep] = useState(1);
  const { toast } = useToast();
  
  const currentUrl = window.location.origin;

  const copyUrl = () => {
    navigator.clipboard.writeText(currentUrl);
    toast({
      title: "URL Copied",
      description: "Website URL copied to clipboard",
    });
  };

  const openHashPack = () => {
    // Try to open HashPack app directly
    const hashpackUrl = `hashpack://dapp/connect?url=${encodeURIComponent(currentUrl)}&name=Dright`;
    window.location.href = hashpackUrl;
    
    // Fallback to website after delay
    setTimeout(() => {
      window.open('https://hashpack.app', '_blank');
    }, 2000);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Smartphone className="w-5 h-5" />
            Connect with HashPack dApp
          </DialogTitle>
          <DialogDescription>
            Follow these steps to connect your HashPack wallet
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* Step Progress */}
          <div className="flex items-center justify-between">
            {[1, 2, 3].map((num) => (
              <div key={num} className="flex items-center">
                <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium transition-colors ${
                  step >= num ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground'
                }`}>
                  {step > num ? <CheckCircle className="w-4 h-4" /> : num}
                </div>
                {num < 3 && <div className={`w-16 h-0.5 mx-2 transition-colors ${
                  step > num ? 'bg-primary' : 'bg-muted'
                }`} />}
              </div>
            ))}
          </div>

          {/* Step 1: Open HashPack */}
          {step === 1 && (
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Step 1: Open HashPack Wallet</CardTitle>
                <CardDescription>
                  Open your HashPack wallet app or extension
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex gap-3">
                  <Button onClick={openHashPack} className="flex-1">
                    <Smartphone className="w-4 h-4 mr-2" />
                    Open HashPack App
                  </Button>
                  <Button variant="outline" asChild>
                    <a href="https://hashpack.app" target="_blank" rel="noopener noreferrer">
                      <ExternalLink className="w-4 h-4 mr-2" />
                      HashPack Website
                    </a>
                  </Button>
                </div>
                
                <Alert>
                  <Monitor className="h-4 w-4" />
                  <AlertDescription>
                    If you don't have HashPack installed, download it from hashpack.app first.
                  </AlertDescription>
                </Alert>

                <Button onClick={() => setStep(2)} className="w-full">
                  I've opened HashPack
                </Button>
              </CardContent>
            </Card>
          )}

          {/* Step 2: Connect to dApp */}
          {step === 2 && (
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Step 2: Connect to dApp</CardTitle>
                <CardDescription>
                  In HashPack, find and tap "Connect to dApp" or "dApp Browser"
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="bg-muted p-4 rounded-lg">
                  <h4 className="font-medium mb-2">In HashPack wallet:</h4>
                  <ol className="list-decimal list-inside space-y-1 text-sm">
                    <li>Look for "Connect to dApp" or "dApp Browser"</li>
                    <li>Tap on it to open the connection screen</li>
                    <li>You'll see options to scan QR code or enter URL</li>
                  </ol>
                </div>

                <div className="flex gap-2">
                  <Button onClick={() => setStep(1)} variant="outline">
                    Back
                  </Button>
                  <Button onClick={() => setStep(3)} className="flex-1">
                    Found "Connect to dApp"
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Step 3: Enter Website URL */}
          {step === 3 && (
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Step 3: Enter Website URL</CardTitle>
                <CardDescription>
                  Copy and paste this website's URL into HashPack
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-3">
                  <label className="text-sm font-medium">Website URL to copy:</label>
                  <div className="flex gap-2">
                    <div className="flex-1 p-3 bg-muted rounded-lg font-mono text-sm break-all">
                      {currentUrl}
                    </div>
                    <Button onClick={copyUrl} size="sm">
                      <Copy className="w-4 h-4" />
                    </Button>
                  </div>
                </div>

                <div className="bg-blue-50 dark:bg-blue-950/30 p-4 rounded-lg">
                  <h4 className="font-medium mb-2">In HashPack:</h4>
                  <ol className="list-decimal list-inside space-y-1 text-sm">
                    <li>Paste the URL above into the connection field</li>
                    <li>Tap "Connect" or "Approve"</li>
                    <li>Select the account you want to connect</li>
                    <li>Confirm the connection</li>
                  </ol>
                </div>

                <Alert>
                  <CheckCircle className="h-4 w-4 text-green-600" />
                  <AlertDescription>
                    Once connected, you'll be redirected back to Dright automatically.
                  </AlertDescription>
                </Alert>

                <div className="flex gap-2">
                  <Button onClick={() => setStep(2)} variant="outline">
                    Back
                  </Button>
                  <Button 
                    onClick={() => {
                      onConnectionSuccess?.();
                      onOpenChange(false);
                    }} 
                    className="flex-1"
                  >
                    I've connected in HashPack
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Troubleshooting */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Having trouble?</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2 text-sm">
                <p>• Make sure HashPack is updated to the latest version</p>
                <p>• Ensure your wallet is unlocked and has a Hedera account</p>
                <p>• Try refreshing this page after connecting</p>
                <p>• Check that you're on the correct network (testnet)</p>
              </div>
            </CardContent>
          </Card>

          {/* Action Buttons */}
          <div className="flex gap-3 pt-4">
            <Button 
              variant="outline" 
              onClick={() => onOpenChange(false)}
              className="flex-1"
            >
              Cancel
            </Button>
            <Button 
              onClick={() => {
                setStep(1);
                onOpenChange(false);
                // Try automatic connection after a delay
                setTimeout(() => {
                  window.location.reload();
                }, 1000);
              }}
              className="flex-1"
            >
              Try Auto-Connect
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}