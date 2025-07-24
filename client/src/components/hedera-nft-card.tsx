import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { hederaService } from "@/lib/hederaSimple";
import { ExternalLink, Shield, CheckCircle, Clock, Hash, X } from "lucide-react";
import type { RightWithCreator } from "@shared/schema";

interface HederaNFTCardProps {
  right: RightWithCreator;
}

export function HederaNFTCard({ right }: HederaNFTCardProps) {
  const hasEthereumData = right.tokenId && right.contractAddress;
  
  const handleViewOnEtherscan = () => {
    if (right.transactionHash) {
      const url = `https://etherscan.io/tx/${right.transactionHash}`;
      window.open(url, '_blank');
    }
  };

  const handleViewNFT = () => {
    if (right.contractAddress && right.tokenId) {
      const url = `https://etherscan.io/token/${right.contractAddress}?a=${right.tokenId}`;
      window.open(url, '_blank');
    }
  };

  if (!hasEthereumData) {
    const isVerified = right.verificationStatus === "verified";
    const isPending = right.verificationStatus === "pending";
    const isRejected = right.verificationStatus === "rejected";

    return (
      <Card className={`border-2 ${
        isVerified ? "border-green-200 bg-green-50 dark:bg-green-950/20" :
        isPending ? "border-amber-200 bg-amber-50 dark:bg-amber-950/20" :
        isRejected ? "border-red-200 bg-red-50 dark:bg-red-950/20" :
        "border-gray-200 bg-gray-50 dark:bg-gray-950/20"
      }`}>
        <CardHeader className="pb-3">
          <CardTitle className={`flex items-center gap-2 ${
            isVerified ? "text-green-800 dark:text-green-200" :
            isPending ? "text-amber-800 dark:text-amber-200" :
            isRejected ? "text-red-800 dark:text-red-200" :
            "text-gray-800 dark:text-gray-200"
          }`}>
            {isVerified ? <CheckCircle className="w-4 h-4" /> :
             isPending ? <Clock className="w-4 h-4" /> :
             isRejected ? <X className="w-4 h-4" /> :
             <Clock className="w-4 h-4" />}
            NFT Status
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-2">
            <Badge variant="outline" className={`${
              isVerified ? "border-green-300 text-green-700 bg-green-100" :
              isPending ? "border-amber-300 text-amber-700 bg-amber-100" :
              isRejected ? "border-red-300 text-red-700 bg-red-100" :
              "border-gray-300 text-gray-700 bg-gray-100"
            }`}>
              {isVerified ? <CheckCircle className="w-3 h-3 mr-1" /> :
               isPending ? <Clock className="w-3 h-3 mr-1" /> :
               isRejected ? <X className="w-3 h-3 mr-1" /> :
               <Clock className="w-3 h-3 mr-1" />}
              {isVerified ? "Verified - NFT Pending" :
               isPending ? "Pending Verification" :
               isRejected ? "Verification Rejected" :
               "Not Yet Verified"}
            </Badge>
          </div>
          <p className={`text-sm mt-2 ${
            isVerified ? "text-green-700 dark:text-green-300" :
            isPending ? "text-amber-700 dark:text-amber-300" :
            isRejected ? "text-red-700 dark:text-red-300" :
            "text-gray-700 dark:text-gray-300"
          }`}>
            {isVerified ? "Right is verified. NFT will be minted automatically on Ethereum blockchain." :
             isPending ? "Right is pending admin verification before NFT can be minted." :
             isRejected ? "Right verification was rejected. NFT cannot be minted." :
             "This right was created before verification system implementation."}
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
            Minted on Ethereum
          </Badge>
          <Badge variant="secondary" className="text-xs">
            mainnet
          </Badge>
        </div>

        {/* NFT Details */}
        <div className="space-y-2">
          <div className="flex justify-between items-center">
            <span className="text-sm font-medium text-green-700 dark:text-green-300">Token ID:</span>
            <code className="text-xs bg-green-100 dark:bg-green-900/30 px-2 py-1 rounded">
              {right.tokenId}
            </code>
          </div>
          
          <div className="flex justify-between items-center">
            <span className="text-sm font-medium text-green-700 dark:text-green-300">Contract:</span>
            <code className="text-xs bg-green-100 dark:bg-green-900/30 px-2 py-1 rounded">
              {right.contractAddress?.slice(0, 10)}...
            </code>
          </div>

          {right.ownerAddress && (
            <div className="flex justify-between items-center">
              <span className="text-sm font-medium text-green-700 dark:text-green-300">Owner:</span>
              <code className="text-xs bg-green-100 dark:bg-green-900/30 px-2 py-1 rounded">
                {right.ownerAddress.slice(0, 10)}...
              </code>
            </div>
          )}
        </div>

        {/* Blockchain Links */}
        <div className="flex flex-col gap-2 pt-2">
          {right.transactionHash && (
            <Button
              variant="outline"
              size="sm"
              onClick={handleViewOnEtherscan}
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
        {right.metadataUri && (
          <div className="pt-2 border-t border-green-200">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => window.open(right.metadataUri!, '_blank')}
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