import { useState } from "react";
import { useMutation, useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Loader2, CheckCircle, AlertCircle, ExternalLink, Coins, Hash } from "lucide-react";
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
      return await apiRequest("/api/hedera/test-mint", "POST", formData);
    },
    onSuccess: (data: any) => {
      toast({
        title: "Test Minting Successful!",
        description: `NFT ${data.mintResult.tokenId}/${data.mintResult.serialNumber} minted on Hedera testnet`,
      });
    },
    onError: (error: any) => {
      toast({
        title: "Test Minting Failed",
        description: error?.message || "Failed to mint test NFT",
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
            <Card className="bg-green-50 border-green-200">
              <CardContent className="pt-4">
                <div className="space-y-3">
                  <div className="flex items-center gap-2">
                    <CheckCircle className="h-4 w-4 text-green-600" />
                    <h4 className="font-semibold text-green-800">Test NFT Minted Successfully!</h4>
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm">
                    <div>
                      <p className="text-muted-foreground">Token ID:</p>
                      <p className="font-mono text-xs bg-white p-2 rounded border">
                        {testMintMutation.data.mintResult.tokenId}
                      </p>
                    </div>
                    <div>
                      <p className="text-muted-foreground">Serial Number:</p>
                      <p className="font-mono text-xs bg-white p-2 rounded border">
                        #{testMintMutation.data.mintResult.serialNumber}
                      </p>
                    </div>
                  </div>
                  
                  <div>
                    <p className="text-muted-foreground text-sm">Transaction ID:</p>
                    <p className="font-mono text-xs bg-white p-2 rounded border break-all">
                      {testMintMutation.data.mintResult.transactionId}
                    </p>
                  </div>

                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => window.open(testMintMutation.data.mintResult.explorerUrl, '_blank')}
                    className="w-full"
                  >
                    <ExternalLink className="h-3 w-3 mr-1" />
                    View on HashScan Explorer
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}
        </CardContent>
      </Card>
    </div>
  );
}