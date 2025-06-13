import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { hederaService } from "@/lib/hederaSimple";
import { ExternalLink, Shield, CheckCircle, Clock, Hash } from "lucide-react";
import type { RightWithCreator } from "@shared/schema";

interface HederaNFTCardProps {
  right: RightWithCreator;
}

export function HederaNFTCard({ right }: HederaNFTCardProps) {
  const hasHederaData = right.hederaTokenId && right.hederaSerialNumber;
  
  const handleViewOnHashscan = () => {
    if (right.hederaTransactionId) {
      const url = hederaService.getHederaExplorerUrl(right.hederaTransactionId);
      window.open(url, '_blank');
    }
  };

  const handleViewNFT = () => {
    if (right.hederaTokenId && right.hederaSerialNumber) {
      const url = hederaService.getTokenExplorerUrl(right.hederaTokenId, right.hederaSerialNumber);
      window.open(url, '_blank');
    }
  };

  if (!hasHederaData) {
    return (
      <Card className="border-amber-200 bg-amber-50 dark:bg-amber-950/20">
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-amber-800 dark:text-amber-200">
            <Clock className="w-4 h-4" />
            NFT Status
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-2">
            <Badge variant="outline" className="border-amber-300 text-amber-700">
              <Clock className="w-3 h-3 mr-1" />
              Traditional Right
            </Badge>
          </div>
          <p className="text-sm text-amber-700 dark:text-amber-300 mt-2">
            This right was created before Hedera NFT integration
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="border-green-200 bg-green-50 dark:bg-green-950/20">
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-green-800 dark:text-green-200">
          <Shield className="w-4 h-4" />
          Hedera NFT
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {/* NFT Status */}
        <div className="flex items-center gap-2">
          <Badge variant="outline" className="border-green-300 text-green-700 bg-green-100">
            <CheckCircle className="w-3 h-3 mr-1" />
            Minted on Hedera
          </Badge>
          <Badge variant="secondary" className="text-xs">
            {right.hederaNetwork || 'testnet'}
          </Badge>
        </div>

        {/* NFT Details */}
        <div className="space-y-2">
          <div className="flex justify-between items-center">
            <span className="text-sm font-medium text-green-700 dark:text-green-300">Token ID:</span>
            <code className="text-xs bg-green-100 dark:bg-green-900/30 px-2 py-1 rounded">
              {right.hederaTokenId}
            </code>
          </div>
          
          <div className="flex justify-between items-center">
            <span className="text-sm font-medium text-green-700 dark:text-green-300">Serial #:</span>
            <code className="text-xs bg-green-100 dark:bg-green-900/30 px-2 py-1 rounded">
              {right.hederaSerialNumber}
            </code>
          </div>

          {right.hederaAccountId && (
            <div className="flex justify-between items-center">
              <span className="text-sm font-medium text-green-700 dark:text-green-300">Owner:</span>
              <code className="text-xs bg-green-100 dark:bg-green-900/30 px-2 py-1 rounded">
                {right.hederaAccountId}
              </code>
            </div>
          )}
        </div>

        {/* Blockchain Links */}
        <div className="flex flex-col gap-2 pt-2">
          {right.hederaTransactionId && (
            <Button
              variant="outline"
              size="sm"
              onClick={handleViewOnHashscan}
              className="w-full justify-between text-green-700 border-green-300 hover:bg-green-100"
            >
              <span className="flex items-center gap-2">
                <Hash className="w-3 h-3" />
                View Mint Transaction
              </span>
              <ExternalLink className="w-3 h-3" />
            </Button>
          )}
          
          <Button
            variant="outline"
            size="sm"
            onClick={handleViewNFT}
            className="w-full justify-between text-green-700 border-green-300 hover:bg-green-100"
          >
            <span className="flex items-center gap-2">
              <Shield className="w-3 h-3" />
              View NFT Details
            </span>
            <ExternalLink className="w-3 h-3" />
          </Button>
        </div>

        {/* Metadata Link */}
        {right.hederaMetadataUri && (
          <div className="pt-2 border-t border-green-200">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => window.open(right.hederaMetadataUri!, '_blank')}
              className="w-full text-xs text-green-600 hover:text-green-700"
            >
              View IPFS Metadata
              <ExternalLink className="w-3 h-3 ml-1" />
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
}