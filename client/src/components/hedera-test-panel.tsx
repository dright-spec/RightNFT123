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

export function HederaTestPanel() {
  const [testForm, setTestForm] = useState({
    name: "YouTube Video Rights Test",
    symbol: "YTNFT",
    description: "Test NFT for YouTube video rights demonstration",
    youtubeUrl: "https://www.youtube.com/watch?v=dQw4w9WgXcQ" // Example YouTube URL
  });
  const { toast } = useToast();

  // Get Hedera network status
  const { data: hederaStatus, isLoading: statusLoading } = useQuery({
    queryKey: ["/api/hedera/status"],
    retry: false
  });

  // Test minting mutation
  const testMintMutation = useMutation({
    mutationFn: async (formData: typeof testForm) => {
      return await apiRequest("POST", "/api/hedera/test-mint", formData);
    },
    onSuccess: (data: any) => {
      toast({
        title: "Live NFT Minting Successful!",
        description: `NFT ${data.mintResult?.tokenId}/${data.mintResult?.serialNumber} minted on Hedera testnet`,
      });
    },
    onError: (error: any) => {
      console.error("Test mint error:", error);
      toast({
        title: "Test Minting Failed",
        description: error?.message || "Failed to mint test NFT on Hedera",
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
    if ((hederaStatus as any)?.status === "connected") return <CheckCircle className="h-4 w-4 text-green-600" />;
    return <AlertCircle className="h-4 w-4 text-red-600" />;
  };

  const getStatusColor = () => {
    if ((hederaStatus as any)?.status === "connected") return "bg-green-50 border-green-200";
    return "bg-red-50 border-red-200";
  };

  return (
    <div className="space-y-6">
      {/* Network Status */}
      <Card className={getStatusColor()}>
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-lg">
            {getStatusIcon()}
            Hedera Network Status
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {statusLoading ? (
            <div className="flex items-center gap-2">
              <Loader2 className="h-4 w-4 animate-spin" />
              <span>Checking Hedera connection...</span>
            </div>
          ) : (hederaStatus as any)?.status === "connected" ? (
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">Network:</span>
                <Badge variant="outline" className="capitalize bg-green-100 text-green-700">
                  {(hederaStatus as any).network}
                </Badge>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">Account ID:</span>
                <Badge variant="outline" className="font-mono text-xs">
                  {(hederaStatus as any).accountId}
                </Badge>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">Balance:</span>
                <span className="text-sm font-mono">{(hederaStatus as any).balance}</span>
              </div>
            </div>
          ) : (
            <div className="text-red-600">
              <p className="font-medium">Connection Failed</p>
              <p className="text-sm">{(hederaStatus as any)?.message || "Unable to connect to Hedera network"}</p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Test Minting */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Coins className="h-5 w-5" />
            Test NFT Minting
          </CardTitle>
          <p className="text-sm text-muted-foreground">
            Mint a test NFT on Hedera testnet to verify the platform functionality
          </p>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="test-name">NFT Name</Label>
              <Input
                id="test-name"
                value={testForm.name}
                onChange={(e) => setTestForm(prev => ({ ...prev, name: e.target.value }))}
                placeholder="Enter NFT name"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="test-symbol">Symbol</Label>
              <Input
                id="test-symbol"
                value={testForm.symbol}
                onChange={(e) => setTestForm(prev => ({ ...prev, symbol: e.target.value.toUpperCase() }))}
                placeholder="Enter symbol"
                maxLength={10}
              />
            </div>
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="test-description">Description</Label>
            <Textarea
              id="test-description"
              value={testForm.description}
              onChange={(e) => setTestForm(prev => ({ ...prev, description: e.target.value }))}
              placeholder="Enter NFT description"
              rows={2}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="test-youtube">YouTube URL (Optional - for video preview)</Label>
            <Input
              id="test-youtube"
              value={testForm.youtubeUrl}
              onChange={(e) => setTestForm(prev => ({ ...prev, youtubeUrl: e.target.value }))}
              placeholder="https://www.youtube.com/watch?v=..."
            />
            {testForm.youtubeUrl && extractYouTubeId(testForm.youtubeUrl) && (
              <div className="text-xs text-green-600">
                ✓ Valid YouTube URL detected - video will be embedded in NFT preview
              </div>
            )}
          </div>

          <Button
            onClick={handleTestMint}
            disabled={testMintMutation.isPending || !(hederaStatus as any)?.status || (hederaStatus as any).status !== "connected"}
            className="w-full"
          >
            {testMintMutation.isPending ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Minting on Hedera Testnet...
              </>
            ) : (
              <>
                <Coins className="h-4 w-4 mr-2" />
                Mint Test NFT
              </>
            )}
          </Button>

          {/* Enhanced NFT Display with Full Visualization */}
          {testMintMutation.data && (
            <div className="mt-6">
              <div className="mb-4 text-center">
                <h3 className="text-lg font-bold text-green-800 mb-2">🎉 Live NFT Successfully Minted!</h3>
                <p className="text-sm text-gray-600">Your test NFT is now live on Hedera testnet blockchain</p>
              </div>
              
              <NFTViewer 
                nftData={{
                  tokenId: (testMintMutation.data as any)?.mintResult?.tokenId || '',
                  serialNumber: (testMintMutation.data as any)?.mintResult?.serialNumber || 1,
                  transactionId: (testMintMutation.data as any)?.mintResult?.transactionId || '',
                  explorerUrl: (testMintMutation.data as any)?.mintResult?.explorerUrl || '',
                  name: (testMintMutation.data as any)?.tokenInfo?.name || testForm.name,
                  symbol: (testMintMutation.data as any)?.tokenInfo?.symbol || testForm.symbol,
                  metadata: (testMintMutation.data as any)?.mintResult?.metadataUri || {},
                  rightType: testForm.youtubeUrl && extractYouTubeId(testForm.youtubeUrl) ? 'YouTube Video' : 'Test Rights',
                  contentSource: testForm.youtubeUrl || undefined,
                  youtubeVideoId: extractYouTubeId(testForm.youtubeUrl || '') || undefined
                }}
                className="border-green-200 bg-gradient-to-br from-green-50 to-blue-50"
              />
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}