import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { CheckCircle, Clock, ArrowRight, ExternalLink, Copy } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useMintingProgress } from "@/hooks/use-minting-progress";

interface SimpleMintingProgressProps {
  rightId: number;
  rightTitle: string;
  onComplete?: (result: any) => void;
  onError?: (error: string) => void;
}

export function SimpleMintingProgress({ 
  rightId, 
  rightTitle, 
  onComplete, 
  onError 
}: SimpleMintingProgressProps) {
  const [showSuccess, setShowSuccess] = useState(false);
  const { toast } = useToast();
  const { status, isComplete } = useMintingProgress(rightId);

  useEffect(() => {
    if (isComplete && status?.results) {
      setShowSuccess(true);
      toast({
        title: "🎉 NFT Created Successfully!",
        description: "Your right is now tokenized and available on the marketplace",
      });
      if (onComplete) onComplete(status.results);
    }
  }, [isComplete, status, onComplete, toast]);

  const copyToClipboard = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    toast({
      title: "Copied!",
      description: `${label} copied to clipboard`,
    });
  };

  const getStepIcon = (stepStatus: string, isActive: boolean) => {
    if (stepStatus === "completed") {
      return <CheckCircle className="h-6 w-6 text-green-500" />;
    }
    if (isActive) {
      return <Clock className="h-6 w-6 text-blue-500 animate-spin" />;
    }
    return <div className="h-6 w-6 rounded-full border-2 border-gray-300" />;
  };

  if (!status) {
    return (
      <Card className="max-w-2xl mx-auto">
        <CardContent className="pt-6">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
            <h3 className="text-lg font-semibold mb-2">Getting Started...</h3>
            <p className="text-gray-600">Preparing to create your NFT</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (showSuccess && status.results) {
    return (
      <Card className="max-w-2xl mx-auto border-green-200">
        <CardHeader className="text-center bg-green-50">
          <div className="mx-auto mb-4 h-16 w-16 rounded-full bg-green-100 flex items-center justify-center">
            <CheckCircle className="h-8 w-8 text-green-600" />
          </div>
          <CardTitle className="text-2xl text-green-800">NFT Created Successfully! 🎉</CardTitle>
          <p className="text-green-700">
            Your "{rightTitle}" is now a verified NFT on the Ethereum blockchain
          </p>
        </CardHeader>
        
        <CardContent className="pt-6">
          <div className="space-y-4">
            {/* Transaction Details */}
            <div className="bg-gray-50 rounded-lg p-4">
              <h4 className="font-semibold mb-3">NFT Details</h4>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between items-center">
                  <span className="text-gray-600">Contract:</span>
                  <div className="flex items-center gap-2">
                    <code className="bg-white px-2 py-1 rounded text-xs">
                      {status.results.contractAddress?.slice(0, 8)}...{status.results.contractAddress?.slice(-6)}
                    </code>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => copyToClipboard(status.results.contractAddress, "Contract address")}
                    >
                      <Copy className="h-3 w-3" />
                    </Button>
                  </div>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-gray-600">Token ID:</span>
                  <code className="bg-white px-2 py-1 rounded text-xs">#{status.results.tokenId}</code>
                </div>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex flex-col sm:flex-row gap-3">
              <Button className="flex-1" onClick={() => window.location.href = "/marketplace"}>
                <ArrowRight className="h-4 w-4 mr-2" />
                View on Marketplace
              </Button>
              {status.results.explorerUrl && (
                <Button 
                  variant="outline" 
                  className="flex-1"
                  onClick={() => window.open(status.results.explorerUrl, '_blank')}
                >
                  <ExternalLink className="h-4 w-4 mr-2" />
                  View on Etherscan
                </Button>
              )}
            </div>

            {/* What's Next */}
            <div className="bg-blue-50 rounded-lg p-4 mt-6">
              <h4 className="font-semibold text-blue-800 mb-2">What's Next?</h4>
              <ul className="text-sm text-blue-700 space-y-1">
                <li>• Your NFT is now live on the marketplace</li>
                <li>• Buyers can discover and purchase your tokenized right</li>
                <li>• You'll receive notifications for any offers or sales</li>
                <li>• Manage your NFTs from your profile dashboard</li>
              </ul>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  const steps = status.steps || [];
  const currentStepIndex = status.currentStep || 0;
  const overallProgress = steps.length > 0 ? ((currentStepIndex + 1) / steps.length) * 100 : 0;

  return (
    <Card className="max-w-2xl mx-auto">
      <CardHeader className="text-center">
        <CardTitle className="text-2xl">Creating Your NFT</CardTitle>
        <p className="text-gray-600">Tokenizing "{rightTitle}" on the Ethereum blockchain</p>
        
        {/* Progress Bar */}
        <div className="w-full bg-gray-200 rounded-full h-3 mt-4">
          <div 
            className="bg-gradient-to-r from-blue-500 to-green-500 h-3 rounded-full transition-all duration-500 ease-out"
            style={{ width: `${overallProgress}%` }}
          ></div>
        </div>
        <p className="text-sm text-gray-500 mt-2">
          {Math.round(overallProgress)}% complete
        </p>
      </CardHeader>
      
      <CardContent>
        <div className="space-y-4">
          {steps.map((step: any, index: number) => {
            const isActive = index === currentStepIndex;
            const isCompleted = step.status === "completed";
            
            return (
              <div 
                key={step.id || index}
                className={`flex items-center gap-4 p-4 rounded-lg transition-all duration-300 ${
                  isActive ? "bg-blue-50 border border-blue-200" : 
                  isCompleted ? "bg-green-50 border border-green-200" : 
                  "bg-gray-50"
                }`}
              >
                {getStepIcon(step.status, isActive)}
                <div className="flex-1">
                  <h3 className={`font-medium ${
                    isCompleted ? "text-green-700" : 
                    isActive ? "text-blue-700" : 
                    "text-gray-700"
                  }`}>
                    {step.title}
                  </h3>
                  {isActive && (
                    <p className="text-sm text-blue-600 mt-1">
                      In progress...
                    </p>
                  )}
                  {isCompleted && (
                    <p className="text-sm text-green-600 mt-1">
                      ✓ Completed
                    </p>
                  )}
                </div>
              </div>
            );
          })}
        </div>

        {/* Encouraging Message */}
        <div className="mt-6 text-center bg-gradient-to-r from-blue-50 to-purple-50 rounded-lg p-4">
          <p className="text-sm text-gray-600">
            🚀 <strong>Almost there!</strong> Your NFT will be ready shortly and automatically listed on our marketplace for buyers to discover.
          </p>
        </div>
      </CardContent>
    </Card>
  );
}