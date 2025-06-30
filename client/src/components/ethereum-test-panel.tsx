import { useState } from "react";
import { useMutation, useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Loader2, CheckCircle, AlertCircle, ExternalLink, Coins, Hash, Copy } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { NFTViewer } from "@/components/nft-viewer";

export function EthereumTestPanel() {
  const [testForm, setTestForm] = useState({
    name: "YouTube Video Rights Test",
    symbol: "YTNFT",
    description: "Test NFT for YouTube video rights demonstration",
    youtubeUrl: "https://www.youtube.com/watch?v=dQw4w9WgXcQ" // Example YouTube URL
  });
  const { toast } = useToast();

  // Get Ethereum network status
  const { data: ethereumStatus, isLoading: statusLoading } = useQuery({
    queryKey: ["/api/ethereum/status"],
    retry: false
  });

  // Test minting mutation
  const testMintMutation = useMutation({
    mutationFn: async (formData: typeof testForm) => {
      return await apiRequest("POST", "/api/ethereum/test-mint", formData);
    },
    onSuccess: (data: any) => {
      toast({
        title: "Live NFT Minting Successful!",
        description: `NFT ${data.mintResult?.contractAddress}/${data.mintResult?.tokenId} minted on Ethereum`,
      });
    },
    onError: (error: any) => {
      console.error("Test mint error:", error);
      toast({
        title: "Test Minting Failed",
        description: error?.message || "Failed to mint test NFT on Ethereum",
        variant: "destructive"
      });
    }
  });

  // Extract YouTube video ID from URL
  const extractYouTubeId = (url: string) => {
    const match = url.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/)([a-zA-Z0-9_-]+)/);
    return match ? match[1] : null;
  };

  const handleTestMint = () => {
    testMintMutation.mutate(testForm);
  };

  const getStatusIcon = () => {
    if (statusLoading) return <Loader2 className="h-4 w-4 animate-spin" />;
    if ((ethereumStatus as any)?.status === "connected") return <CheckCircle className="h-4 w-4 text-green-600" />;
    return <AlertCircle className="h-4 w-4 text-red-600" />;
  };

  const getStatusColor = () => {
    if ((ethereumStatus as any)?.status === "connected") return "bg-green-50 border-green-200";
    return "bg-red-50 border-red-200";
  };

  return (
    <div className="space-y-6">
      {/* Network Status Card */}
      <Card className={`border-2 ${getStatusColor()}`}>
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2">
            {getStatusIcon()}
            Ethereum Network Status
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <p className="text-sm font-medium text-muted-foreground">Network</p>
              <Badge variant="outline">
                {(ethereumStatus as any)?.network || "Mainnet"}
              </Badge>
            </div>
            <div>
              <p className="text-sm font-medium text-muted-foreground">Status</p>
              <Badge variant={(ethereumStatus as any)?.status === "connected" ? "default" : "destructive"}>
                {(ethereumStatus as any)?.status || "Disconnected"}
              </Badge>
            </div>
          </div>
          
          {(ethereumStatus as any)?.contractAddress && (
            <div>
              <p className="text-sm font-medium text-muted-foreground mb-1">Smart Contract</p>
              <div className="flex items-center gap-2">
                <code className="bg-muted px-2 py-1 rounded text-xs font-mono">
                  {(ethereumStatus as any).contractAddress}
                </code>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => navigator.clipboard.writeText((ethereumStatus as any).contractAddress)}
                >
                  <Copy className="h-3 w-3" />
                </Button>
              </div>
            </div>
          )}

          {(ethereumStatus as any)?.balance !== undefined && (
            <div>
              <p className="text-sm font-medium text-muted-foreground">Balance</p>
              <div className="flex items-center gap-2">
                <Coins className="h-4 w-4 text-blue-600" />
                <span className="text-sm font-mono">
                  {parseFloat((ethereumStatus as any).balance).toFixed(4)} ETH
                </span>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Test Minting Card */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Hash className="h-5 w-5 text-purple-600" />
            Live NFT Minting Test
          </CardTitle>
          <p className="text-sm text-muted-foreground">
            Test the complete NFT minting workflow on Ethereum mainnet with real transactions
          </p>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <div>
              <Label htmlFor="test-name">NFT Name</Label>
              <Input
                id="test-name"
                value={testForm.name}
                onChange={(e) => setTestForm({ ...testForm, name: e.target.value })}
                placeholder="Enter NFT name"
              />
            </div>
            <div>
              <Label htmlFor="test-symbol">Symbol</Label>
              <Input
                id="test-symbol"
                value={testForm.symbol}
                onChange={(e) => setTestForm({ ...testForm, symbol: e.target.value })}
                placeholder="Enter symbol (e.g., YTNFT)"
              />
            </div>
          </div>

          <div>
            <Label htmlFor="test-youtube">YouTube URL</Label>
            <Input
              id="test-youtube"
              value={testForm.youtubeUrl}
              onChange={(e) => setTestForm({ ...testForm, youtubeUrl: e.target.value })}
              placeholder="https://www.youtube.com/watch?v=..."
            />
            {extractYouTubeId(testForm.youtubeUrl) && (
              <p className="text-xs text-muted-foreground mt-1">
                Video ID: {extractYouTubeId(testForm.youtubeUrl)}
              </p>
            )}
          </div>

          <div>
            <Label htmlFor="test-description">Description</Label>
            <Textarea
              id="test-description"
              value={testForm.description}
              onChange={(e) => setTestForm({ ...testForm, description: e.target.value })}
              placeholder="Describe this NFT..."
              rows={3}
            />
          </div>

          <div className="flex gap-3 pt-2">
            <Button 
              onClick={handleTestMint}
              disabled={testMintMutation.isPending || !extractYouTubeId(testForm.youtubeUrl)}
              className="flex-1"
            >
              {testMintMutation.isPending ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Minting on Ethereum...
                </>
              ) : (
                <>
                  <Coins className="h-4 w-4 mr-2" />
                  Test Live Mint (Real ETH)
                </>
              )}
            </Button>
          </div>

          {testMintMutation.data && (
            <Card className="bg-green-50 border-green-200">
              <CardContent className="p-4">
                <div className="flex items-center gap-2 mb-2">
                  <CheckCircle className="h-4 w-4 text-green-600" />
                  <span className="font-medium text-green-800">Minting Success!</span>
                </div>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Contract:</span>
                    <code className="font-mono">{testMintMutation.data.mintResult?.contractAddress}</code>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Token ID:</span>
                    <code className="font-mono">{testMintMutation.data.mintResult?.tokenId}</code>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Transaction:</span>
                    <a 
                      href={testMintMutation.data.mintResult?.explorerUrl}
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="text-blue-600 hover:underline flex items-center gap-1"
                    >
                      View on Etherscan <ExternalLink className="h-3 w-3" />
                    </a>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          <div className="text-xs text-muted-foreground bg-yellow-50 p-3 rounded border-yellow-200 border">
            <strong>⚠️ Real Network Warning:</strong> This test uses the live Ethereum mainnet. 
            Real ETH will be spent for gas fees (~$10-50). Only use for genuine testing purposes.
          </div>
        </CardContent>
      </Card>

      {/* Recent Test Results */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Recent Test Results</CardTitle>
          <p className="text-sm text-muted-foreground">
            Recent NFT minting tests and their results
          </p>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8 text-muted-foreground">
            <Hash className="h-8 w-8 mx-auto mb-2 opacity-50" />
            <p>No recent test results</p>
            <p className="text-xs">Run a test mint to see results here</p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}