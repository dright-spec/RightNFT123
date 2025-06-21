import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ExternalLink, Hash, Copy, Check, Eye } from "lucide-react";
import { useState } from "react";
import { useToast } from "@/hooks/use-toast";

interface NFTViewerProps {
  nftData: {
    tokenId: string;
    serialNumber: number;
    transactionId: string;
    explorerUrl?: string;
    name?: string;
    symbol?: string;
    metadata?: any;
  };
  className?: string;
}

export function NFTViewer({ nftData, className = "" }: NFTViewerProps) {
  const [copied, setCopied] = useState<string | null>(null);
  const { toast } = useToast();

  const copyToClipboard = async (text: string, type: string) => {
    await navigator.clipboard.writeText(text);
    setCopied(type);
    setTimeout(() => setCopied(null), 2000);
    toast({
      title: "Copied",
      description: `${type} copied to clipboard`,
    });
  };

  const fullNFTId = `${nftData.tokenId}/${nftData.serialNumber}`;

  return (
    <Card className={`bg-gradient-to-br from-green-50 to-blue-50 border-green-200 shadow-lg ${className}`}>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-green-800">
          <Eye className="w-5 h-5" />
          NFT Successfully Minted
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* NFT Visual Representation */}
        <div className="bg-white rounded-lg border-2 border-dashed border-blue-300 p-6 text-center">
          <div className="w-20 h-20 bg-gradient-to-br from-purple-500 to-blue-500 rounded-xl mx-auto mb-4 flex items-center justify-center">
            <Hash className="w-10 h-10 text-white" />
          </div>
          <h3 className="font-bold text-xl text-gray-800 mb-2">
            {nftData.name || "Hedera NFT"}
          </h3>
          {nftData.symbol && (
            <div className="text-sm text-gray-600 mb-3">
              Symbol: {nftData.symbol}
            </div>
          )}
          <div className="inline-flex items-center gap-2 bg-blue-100 text-blue-800 px-4 py-2 rounded-full text-sm font-medium">
            <span className="w-2 h-2 bg-blue-500 rounded-full animate-pulse"></span>
            Live on Hedera Testnet
          </div>
        </div>

        {/* NFT Identifier Showcase */}
        <div className="bg-gradient-to-r from-blue-600 to-purple-600 p-4 rounded-lg text-white text-center">
          <p className="text-xs font-medium opacity-90 mb-2">COMPLETE NFT IDENTIFIER</p>
          <div className="flex items-center justify-center gap-3">
            <p className="font-mono text-2xl font-bold tracking-wider">
              {fullNFTId}
            </p>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => copyToClipboard(fullNFTId, 'NFT ID')}
              className="h-8 w-8 p-0 text-white hover:bg-white/20"
            >
              {copied === 'NFT ID' ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
            </Button>
          </div>
        </div>

        {/* Detailed Information Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          <div className="bg-white p-4 rounded-lg border shadow-sm">
            <p className="text-xs font-medium text-gray-500 mb-2">TOKEN ID</p>
            <div className="flex items-center justify-between">
              <p className="font-mono text-sm font-bold text-gray-800">
                {nftData.tokenId}
              </p>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => copyToClipboard(nftData.tokenId, 'Token ID')}
                className="h-6 w-6 p-0"
              >
                {copied === 'Token ID' ? <Check className="h-3 w-3" /> : <Copy className="h-3 w-3" />}
              </Button>
            </div>
          </div>
          
          <div className="bg-white p-4 rounded-lg border shadow-sm">
            <p className="text-xs font-medium text-gray-500 mb-2">SERIAL NUMBER</p>
            <p className="font-mono text-sm font-bold text-gray-800">
              #{nftData.serialNumber}
            </p>
          </div>
        </div>

        {/* Transaction Information */}
        <div className="bg-gray-50 p-4 rounded-lg border">
          <p className="text-xs font-medium text-gray-500 mb-2">TRANSACTION HASH</p>
          <div className="flex items-start gap-2">
            <p className="font-mono text-xs text-gray-700 break-all leading-relaxed flex-1">
              {nftData.transactionId}
            </p>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => copyToClipboard(nftData.transactionId, 'Transaction Hash')}
              className="h-6 w-6 p-0 flex-shrink-0"
            >
              {copied === 'Transaction Hash' ? <Check className="h-3 w-3" /> : <Copy className="h-3 w-3" />}
            </Button>
          </div>
        </div>

        {/* Metadata Display */}
        {nftData.metadata && (
          <div className="bg-yellow-50 p-4 rounded-lg border border-yellow-200">
            <p className="text-xs font-medium text-yellow-700 mb-2">NFT METADATA</p>
            <pre className="text-xs text-yellow-800 whitespace-pre-wrap font-mono">
              {typeof nftData.metadata === 'string' 
                ? nftData.metadata 
                : JSON.stringify(nftData.metadata, null, 2)
              }
            </pre>
          </div>
        )}

        {/* Action Buttons */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pt-2">
          {nftData.explorerUrl && (
            <Button
              variant="outline"
              onClick={() => {
                console.log('Opening NFT explorer URL:', nftData.explorerUrl);
                window.open(nftData.explorerUrl, '_blank');
              }}
              className="flex-1"
            >
              <ExternalLink className="h-4 w-4 mr-2" />
              View on HashScan
            </Button>
          )}
          <Button
            onClick={() => copyToClipboard(JSON.stringify(nftData, null, 2), 'Complete NFT Data')}
            className="flex-1 bg-blue-600 hover:bg-blue-700 text-white"
          >
            <Hash className="h-4 w-4 mr-2" />
            Copy All Data
          </Button>
        </div>

        {/* Success Message with Instructions */}
        <div className="text-center text-sm text-green-700 bg-green-100 p-4 rounded-lg border border-green-200">
          <div className="font-semibold mb-2">🎉 Congratulations! Your NFT is Live</div>
          <div className="text-xs leading-relaxed">
            This is a real NFT minted on Hedera testnet blockchain. You can now:
            <br />• View it on HashScan explorer • Share the NFT ID with others • Transfer ownership • Use in applications
          </div>
        </div>
      </CardContent>
    </Card>
  );
}