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

export function HederaTestPanel() {
  const [testForm, setTestForm] = useState({
    name: "Test Rights NFT",
    symbol: "TRNFT",
    description: "Test NFT for demonstrating Hedera integration"
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
              rows={3}
            />
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

          {testMintMutation.data && (
            <Card className="bg-gradient-to-br from-green-50 to-blue-50 border-green-200 shadow-lg">
              <CardContent className="pt-6">
                <div className="space-y-4">
                  <div className="flex items-center justify-center gap-2 mb-4">
                    <CheckCircle className="h-6 w-6 text-green-600" />
                    <h4 className="text-xl font-bold text-green-800">🎉 Live NFT Successfully Created!</h4>
                  </div>
                  
                  {/* NFT Visual Card */}
                  <div className="bg-white rounded-xl border-2 border-dashed border-gray-200 p-8 text-center relative overflow-hidden">
                    {/* Background pattern */}
                    <div className="absolute inset-0 opacity-5">
                      <div className="grid grid-cols-6 gap-2 h-full">
                        {[...Array(36)].map((_, i) => (
                          <div key={i} className="bg-gradient-to-br from-purple-500 to-blue-500 rounded"></div>
                        ))}
                      </div>
                    </div>
                    
                    {/* Main content */}
                    <div className="relative z-10">
                      <div className="w-20 h-20 bg-gradient-to-br from-purple-500 to-blue-500 rounded-2xl mx-auto mb-6 flex items-center justify-center shadow-lg transform rotate-3 hover:rotate-0 transition-transform duration-300">
                        <Hash className="w-10 h-10 text-white" />
                      </div>
                      <h3 className="font-bold text-xl text-gray-800 mb-2">
                        {(testMintMutation.data as any)?.tokenInfo?.name}
                      </h3>
                      <div className="text-sm text-gray-600 mb-2 font-medium">
                        Test NFT Rights
                      </div>
                      <div className="text-sm text-gray-500 mb-4">
                        Symbol: {(testMintMutation.data as any)?.tokenInfo?.symbol}
                      </div>
                      <div className="inline-flex items-center gap-2 bg-blue-100 text-blue-800 px-4 py-2 rounded-full text-sm font-medium shadow-sm">
                        <span className="w-2 h-2 bg-blue-500 rounded-full animate-pulse"></span>
                        Live on Hedera Testnet
                      </div>
                    </div>
                  </div>

                  {/* NFT Details Grid */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    <div className="bg-white p-3 rounded-lg border">
                      <p className="text-xs font-medium text-gray-500 mb-1">TOKEN ID</p>
                      <div className="flex items-center justify-between">
                        <p className="font-mono text-sm font-bold text-gray-800">
                          {(testMintMutation.data as any)?.mintResult?.tokenId}
                        </p>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => navigator.clipboard.writeText((testMintMutation.data as any)?.mintResult?.tokenId)}
                          className="h-6 w-6 p-0"
                        >
                          <Hash className="h-3 w-3" />
                        </Button>
                      </div>
                    </div>
                    <div className="bg-white p-3 rounded-lg border">
                      <p className="text-xs font-medium text-gray-500 mb-1">SERIAL NUMBER</p>
                      <p className="font-mono text-sm font-bold text-gray-800">
                        #{(testMintMutation.data as any)?.mintResult?.serialNumber}
                      </p>
                    </div>
                  </div>

                  {/* Full NFT ID Display */}
                  <div className="bg-gradient-to-r from-blue-600 to-purple-600 p-4 rounded-lg text-white text-center">
                    <p className="text-xs font-medium opacity-90 mb-1">COMPLETE NFT IDENTIFIER</p>
                    <div className="flex items-center justify-center gap-2">
                      <p className="font-mono text-lg font-bold">
                        {(testMintMutation.data as any)?.mintResult?.tokenId}/{(testMintMutation.data as any)?.mintResult?.serialNumber}
                      </p>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => navigator.clipboard.writeText(`${(testMintMutation.data as any)?.mintResult?.tokenId}/${(testMintMutation.data as any)?.mintResult?.serialNumber}`)}
                        className="h-6 w-6 p-0 text-white hover:bg-white/20"
                      >
                        <Hash className="h-3 w-3" />
                      </Button>
                    </div>
                  </div>

                  {/* Transaction Details */}
                  <div className="bg-gray-50 p-3 rounded-lg">
                    <p className="text-xs font-medium text-gray-500 mb-2">TRANSACTION HASH</p>
                    <p className="font-mono text-xs text-gray-700 break-all leading-relaxed">
                      {(testMintMutation.data as any)?.mintResult?.transactionId}
                    </p>
                  </div>

                  {/* Action Buttons */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pt-2">
                    <Button
                      variant="outline"
                      onClick={() => {
                        const explorerUrl = (testMintMutation.data as any)?.mintResult?.explorerUrl;
                        console.log('Opening explorer URL:', explorerUrl);
                        window.open(explorerUrl, '_blank');
                      }}
                      className="flex-1"
                    >
                      <ExternalLink className="h-4 w-4 mr-2" />
                      View on HashScan
                    </Button>
                    <Button
                      onClick={() => navigator.clipboard.writeText(JSON.stringify((testMintMutation.data as any)?.mintResult, null, 2))}
                      className="flex-1 bg-blue-600 hover:bg-blue-700 text-white"
                    >
                      <Hash className="h-4 w-4 mr-2" />
                      Copy NFT Data
                    </Button>
                  </div>

                  {/* Success Message */}
                  <div className="text-center text-sm text-green-700 bg-green-100 p-3 rounded-lg border border-green-200">
                    <strong>✓ Success!</strong> This is a real NFT minted on Hedera testnet blockchain. 
                    <br />You can now trade, transfer, or showcase this digital asset.
                  </div>
                </div>
              </CardContent>
            </Card>
          )}
        </CardContent>
      </Card>
    </div>
  );
}