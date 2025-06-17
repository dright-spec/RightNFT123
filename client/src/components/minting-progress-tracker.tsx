import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { CheckCircle, Clock, AlertCircle, ExternalLink, Copy } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useMintingProgress } from "@/hooks/useMintingProgress";

interface MintingStep {
  id: string;
  title: string;
  description: string;
  status: "pending" | "processing" | "completed" | "error";
  timestamp?: string;
  transactionHash?: string;
  estimatedTime?: string;
}

interface MintingProgressProps {
  rightId: number;
  rightTitle: string;
  onComplete?: (result: any) => void;
  onError?: (error: string) => void;
}

export function MintingProgressTracker({ rightId, rightTitle, onComplete, onError }: MintingProgressProps) {
  const [mintingStatus, setMintingStatus] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);
  const { toast } = useToast();

  // Use custom hook for minting progress
  const { status, isLoading, isComplete, error: progressError } = useMintingProgress(rightId);

  useEffect(() => {
    if (status) {
      setMintingStatus(status);
      
      if (status.status === "completed") {
        toast({
          title: "NFT Minted Successfully!",
          description: `${rightTitle} is now available as an NFT on the marketplace`,
        });
        if (onComplete) onComplete(status.results);
      }
    }
  }, [status, rightTitle, onComplete, toast]);

  useEffect(() => {
    if (progressError) {
      setError(progressError);
      toast({
        title: "Minting Failed",
        description: progressError,
        variant: "destructive"
      });
      if (onError) onError(progressError);
    }
  }, [progressError, onError, toast]);

  // If no status data yet, show initial loading state
  if (!mintingStatus && !error) {
    return (
      <Card className="max-w-2xl mx-auto">
        <CardContent className="pt-6">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
            <p>Initializing NFT minting...</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  const steps = mintingStatus?.steps || [];
  const overallProgress = mintingStatus ? (mintingStatus.currentStep / Math.max(steps.length - 1, 1)) * 100 : 0;

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast({
      title: "Copied",
      description: "Copied to clipboard",
    });
  };

  const getStepIcon = (status: string) => {
    switch (status) {
      case "completed":
        return <CheckCircle className="h-5 w-5 text-green-600" />;
      case "processing":
        return <Clock className="h-5 w-5 text-blue-600 animate-spin" />;
      case "error":
        return <AlertCircle className="h-5 w-5 text-red-600" />;
      default:
        return <div className="h-5 w-5 rounded-full border-2 border-gray-300" />;
    }
  };

  const getStepBadge = (status: string) => {
    switch (status) {
      case "completed":
        return <Badge variant="default" className="bg-green-100 text-green-800">Completed</Badge>;
      case "processing":
        return <Badge variant="default" className="bg-blue-100 text-blue-800">Processing</Badge>;
      case "error":
        return <Badge variant="destructive">Error</Badge>;
      default:
        return <Badge variant="secondary">Pending</Badge>;
    }
  };

  return (
    <Card className="max-w-2xl mx-auto">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <CheckCircle className="h-6 w-6 text-blue-600" />
          NFT Minting Progress
        </CardTitle>
        <p className="text-sm text-muted-foreground">
          Creating NFT for: {rightTitle}
        </p>
      </CardHeader>
      
      <CardContent className="space-y-6">
        {/* Overall Progress */}
        <div className="space-y-2">
          <div className="flex justify-between text-sm">
            <span>Overall Progress</span>
            <span>{Math.round(overallProgress)}%</span>
          </div>
          <Progress value={overallProgress} className="h-2" />
        </div>

        {/* Step-by-step Progress */}
        <div className="space-y-4">
          {steps.map((step: any, index: number) => (
            <div key={step.id} className="flex items-start gap-4 p-4 rounded-lg border bg-muted/30">
              <div className="flex-shrink-0 mt-1">
                {getStepIcon(step.status)}
              </div>
              
              <div className="flex-1 space-y-2">
                <div className="flex items-center justify-between">
                  <h4 className="font-medium">{step.title}</h4>
                  {getStepBadge(step.status)}
                </div>
                
                <p className="text-sm text-muted-foreground">
                  {step.description}
                </p>
                
                {step.status === "processing" && step.estimatedTime && (
                  <p className="text-xs text-blue-600">
                    Estimated time: {step.estimatedTime}
                  </p>
                )}
                
                {step.transactionHash && (
                  <div className="flex items-center gap-2 mt-2">
                    <code className="text-xs bg-gray-100 px-2 py-1 rounded">
                      {step.transactionHash}
                    </code>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => copyToClipboard(step.transactionHash!)}
                    >
                      <Copy className="h-3 w-3" />
                    </Button>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>

        {/* Success Result */}
        {mintingStatus?.status === "completed" && mintingStatus.results && (
          <Card className="bg-green-50 border-green-200">
            <CardContent className="pt-6">
              <div className="space-y-3">
                <div className="flex items-center gap-2">
                  <CheckCircle className="h-5 w-5 text-green-600" />
                  <h3 className="font-semibold text-green-800">NFT Minted Successfully!</h3>
                </div>
                
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <p className="text-gray-600">Token ID:</p>
                    <p className="font-mono">{mintingStatus.results.tokenId}</p>
                  </div>
                  <div>
                    <p className="text-gray-600">Serial Number:</p>
                    <p className="font-mono">#{mintingStatus.results.serialNumber}</p>
                  </div>
                </div>
                
                <div className="flex gap-2">
                  <Button 
                    variant="outline" 
                    size="sm"
                    onClick={() => copyToClipboard(mintingStatus.results.transactionId)}
                  >
                    <Copy className="h-3 w-3 mr-1" />
                    Copy Transaction ID
                  </Button>
                  <Button 
                    variant="outline" 
                    size="sm"
                    onClick={() => window.open(`https://hashscan.io/testnet/transaction/${mintingStatus.results.transactionId}`, '_blank')}
                  >
                    <ExternalLink className="h-3 w-3 mr-1" />
                    View on Explorer
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Error State */}
        {error && (
          <Card className="bg-red-50 border-red-200">
            <CardContent className="pt-6">
              <div className="flex items-start gap-2">
                <AlertCircle className="h-5 w-5 text-red-600 mt-0.5" />
                <div>
                  <h3 className="font-semibold text-red-800">Minting Failed</h3>
                  <p className="text-sm text-red-700 mt-1">{error}</p>
                  <Button 
                    variant="outline" 
                    size="sm" 
                    className="mt-3"
                    onClick={() => window.location.reload()}
                  >
                    Try Again
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        )}
      </CardContent>
    </Card>
  );
}