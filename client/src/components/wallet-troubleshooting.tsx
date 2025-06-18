import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { ExternalLink, AlertCircle, CheckCircle } from "lucide-react";

export function WalletTroubleshooting() {
  const openHashPackInstall = () => {
    window.open('https://chrome.google.com/webstore/detail/hashpack/gjagmgiddbbciopjhllkdnddhcglnemk', '_blank');
  };

  const openBladeInstall = () => {
    window.open('https://chrome.google.com/webstore/detail/blade-hedera-web3-digital/abogmiocnneedmmepnohnhlijcjpcifd', '_blank');
  };

  return (
    <Card className="w-full max-w-2xl mx-auto">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <AlertCircle className="h-5 w-5" />
          Hedera Wallet Setup Guide
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <Alert>
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            To use Dright marketplace, you need a Hedera-compatible wallet. Here's how to set one up:
          </AlertDescription>
        </Alert>

        <div className="space-y-6">
          <div className="border rounded-lg p-4">
            <h3 className="font-semibold mb-3 flex items-center gap-2">
              🔗 HashPack Wallet (Recommended)
            </h3>
            <div className="space-y-2 text-sm text-muted-foreground mb-3">
              <p>• Most popular Hedera wallet</p>
              <p>• Easy to use interface</p>
              <p>• Supports Hedera testnet</p>
            </div>
            <Button onClick={openHashPackInstall} className="w-full">
              <ExternalLink className="h-4 w-4 mr-2" />
              Install HashPack Extension
            </Button>
          </div>

          <div className="border rounded-lg p-4">
            <h3 className="font-semibold mb-3 flex items-center gap-2">
              ⚔️ Blade Wallet
            </h3>
            <div className="space-y-2 text-sm text-muted-foreground mb-3">
              <p>• Multi-chain wallet</p>
              <p>• Supports Hedera network</p>
              <p>• Built-in DeFi features</p>
            </div>
            <Button onClick={openBladeInstall} variant="outline" className="w-full">
              <ExternalLink className="h-4 w-4 mr-2" />
              Install Blade Extension
            </Button>
          </div>
        </div>

        <div className="bg-muted/50 rounded-lg p-4">
          <h4 className="font-medium mb-2 flex items-center gap-2">
            <CheckCircle className="h-4 w-4 text-green-500" />
            After Installation:
          </h4>
          <ol className="text-sm space-y-1 text-muted-foreground">
            <li>1. Refresh this page</li>
            <li>2. Click "Connect Wallet" button</li>
            <li>3. Select your preferred wallet</li>
            <li>4. Follow the wallet's connection prompts</li>
          </ol>
        </div>

        <Alert>
          <AlertDescription>
            <strong>Using Brave Browser?</strong> Make sure to enable "Use Google services for push messaging" in Brave settings, as some wallet extensions require this.
          </AlertDescription>
        </Alert>
      </CardContent>
    </Card>
  );
}