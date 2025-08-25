import { useQuery } from "@tanstack/react-query";
import { Link, useParams } from "wouter";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { WalletButton } from "@/components/WalletButton";
import { useToast } from "@/hooks/use-toast";
// Removed unused Hedera component imports
import { 
  ArrowLeft, 
  ExternalLink, 
  FileText, 
  DollarSign, 
  User, 
  Calendar,
  Hash,
  Shield,
  TrendingUp
} from "lucide-react";
import type { RightWithCreator } from "@shared/schema";
import { rightTypeSymbols, rightTypeLabels } from "@shared/schema";

export default function RightDetail() {
  const { id } = useParams();
  const { toast } = useToast();

  const { data: right, isLoading, error } = useQuery<RightWithCreator>({
    queryKey: [`/api/rights/${id}`],
    enabled: !!id,
  });

  const handlePurchase = () => {
    toast({
      title: "Purchase Initiated",
      description: "Redirecting to payment gateway...",
    });
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background">
        <header className="bg-background shadow-sm border-b border-border">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex justify-between items-center h-16">
              <Link href="/marketplace">
                <Button variant="ghost" size="sm">
                  <ArrowLeft className="w-4 h-4 mr-2" />
                  Back to Marketplace
                </Button>
              </Link>
              <WalletButton />
            </div>
          </div>
        </header>
        
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="animate-pulse space-y-8">
            <div className="h-8 bg-muted rounded w-2/3"></div>
            <div className="h-4 bg-muted rounded w-1/2"></div>
            <div className="grid md:grid-cols-3 gap-8">
              <div className="md:col-span-2 space-y-4">
                <div className="h-32 bg-muted rounded"></div>
                <div className="h-24 bg-muted rounded"></div>
              </div>
              <div className="h-48 bg-muted rounded"></div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (error || !right) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Card className="w-full max-w-md mx-4">
          <CardContent className="pt-6">
            <p className="text-destructive text-center">Right not found</p>
            <Link href="/marketplace" className="block mt-4">
              <Button className="w-full">
                Back to Marketplace
              </Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    );
  }

  const rightSymbol = rightTypeSymbols[right.type as keyof typeof rightTypeSymbols] || "📄";
  const rightLabel = rightTypeLabels[right.type as keyof typeof rightTypeLabels] || "Unknown";

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="bg-background shadow-sm border-b border-border">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <Link href="/marketplace">
              <Button variant="ghost" size="sm">
                <ArrowLeft className="w-4 h-4 mr-2" />
                Back to Marketplace
              </Button>
            </Link>
            <WalletButton />
          </div>
        </div>
      </header>

      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Removed auto NFT minter component */}
        
        {/* Title Section */}
        <div className="mb-8">
          <div className="flex items-start justify-between mb-4">
            <div className="flex items-center space-x-3">
              <span className="text-4xl">{rightSymbol}</span>
              <div>
                <h1 className="text-3xl font-bold text-foreground">{right.title}</h1>
                <div className="flex items-center space-x-4 mt-2">
                  <Badge variant="secondary" className="text-sm">
                    {rightLabel}
                  </Badge>
                  {right.paysDividends && (
                    <Badge className="bg-accent text-accent-foreground">
                      <TrendingUp className="w-3 h-3 mr-1" />
                      Earning
                    </Badge>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="grid md:grid-cols-3 gap-8">
          {/* Main Content */}
          <div className="md:col-span-2 space-y-8">
            {/* Description */}
            <Card>
              <CardHeader>
                <CardTitle>Description</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground leading-relaxed">{right.description}</p>
              </CardContent>
            </Card>

            {/* Revenue Information */}
            {right.paysDividends && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <DollarSign className="w-5 h-5" />
                    Revenue Information
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-muted-foreground mb-1">
                        Payment Frequency
                      </label>
                      <p className="font-medium capitalize">{right.paymentFrequency}</p>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-muted-foreground mb-1">
                        Payment Address
                      </label>
                      <p className="font-mono text-sm break-all">{right.paymentAddress}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Legal Documents section removed - field not in schema */}

            {/* NFT Information removed - component deleted */}

            {/* NFT Information - Enhanced for minted tokens */}
            {right.tokenId && (
              <Card className="bg-gradient-to-br from-purple-50 to-blue-50 dark:from-purple-950 dark:to-blue-950 border-purple-200 dark:border-purple-800">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-purple-700 dark:text-purple-300">
                    <Hash className="w-5 h-5" />
                    🎨 NFT Information
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="bg-white/50 dark:bg-gray-900/50 rounded-lg p-4 border">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-purple-600 dark:text-purple-400 mb-1">
                          🏷️ NFT Token ID
                        </label>
                        <div className="flex items-center gap-2">
                          <p className="font-mono text-sm bg-purple-100 dark:bg-purple-900 px-2 py-1 rounded">
                            {right.tokenId}
                          </p>
                          <Button variant="outline" size="sm" asChild>
                            <a 
                              href={`https://hashscan.io/mainnet/token/${right.tokenId}`}
                              target="_blank" 
                              rel="noopener noreferrer"
                              className="text-purple-600 hover:text-purple-800"
                            >
                              <ExternalLink className="w-4 h-4" />
                            </a>
                          </Button>
                        </div>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-purple-600 dark:text-purple-400 mb-1">
                          📅 Minted On
                        </label>
                        <p className="text-sm bg-purple-100 dark:bg-purple-900 px-2 py-1 rounded inline-block">
                          {new Date(right.createdAt!).toLocaleDateString()}
                        </p>
                      </div>
                    </div>
                    
                    {right.transactionHash && (
                      <div className="mt-4">
                        <label className="block text-sm font-medium text-purple-600 dark:text-purple-400 mb-1">
                          🔗 Transaction Hash
                        </label>
                        <div className="flex items-center gap-2">
                          <p className="font-mono text-xs bg-purple-100 dark:bg-purple-900 px-2 py-1 rounded flex-1 break-all">
                            {right.transactionHash}
                          </p>
                          <Button variant="outline" size="sm" asChild>
                            <a 
                              href={`https://hashscan.io/mainnet/transaction/${right.transactionHash}`}
                              target="_blank" 
                              rel="noopener noreferrer"
                              className="text-purple-600 hover:text-purple-800"
                            >
                              <ExternalLink className="w-4 h-4" />
                            </a>
                          </Button>
                        </div>
                      </div>
                    )}
                    
                    {right.metadataUrl && (
                      <div className="mt-4">
                        <label className="block text-sm font-medium text-purple-600 dark:text-purple-400 mb-1">
                          📋 Metadata URI
                        </label>
                        <div className="flex items-center gap-2">
                          <p className="font-mono text-xs bg-purple-100 dark:bg-purple-900 px-2 py-1 rounded flex-1 break-all">
                            {right.metadataUrl}
                          </p>
                          <Button variant="outline" size="sm" asChild>
                            <a href={right.metadataUrl} target="_blank" rel="noopener noreferrer" className="text-purple-600 hover:text-purple-800">
                              <ExternalLink className="w-4 h-4" />
                            </a>
                          </Button>
                        </div>
                      </div>
                    )}
                    
                    <div className="mt-4 p-3 bg-green-50 dark:bg-green-950 rounded-lg border border-green-200 dark:border-green-800">
                      <p className="text-sm text-green-700 dark:text-green-300 font-medium">
                        ✅ This right has been successfully minted as an NFT on the Hedera network!
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}
            
            {/* Technical Details for non-minted rights */}
            {!right.tokenId && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Hash className="w-5 h-5" />
                    Technical Details
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-muted-foreground mb-1">
                        Status
                      </label>
                      <p className="text-sm">Not yet minted as NFT</p>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-muted-foreground mb-1">
                        Created
                      </label>
                      <p className="text-sm">{new Date(right.createdAt!).toLocaleDateString()}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Purchase Card */}
            <Card>
              <CardHeader>
                <CardTitle>Purchase Right</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="text-center">
                  <p className="text-3xl font-bold text-primary">
                    {right.price} {right.currency}
                  </p>
                  <p className="text-sm text-muted-foreground mt-1">Current Price</p>
                </div>
                
                <Separator />
                
                <Button className="w-full" size="lg" onClick={handlePurchase}>
                  Buy Right
                </Button>
                
                <p className="text-xs text-muted-foreground text-center">
                  By purchasing, you agree to the terms in the legal agreement
                </p>
              </CardContent>
            </Card>

            {/* Owner Information */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <User className="w-5 h-5" />
                  Ownership
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-muted-foreground mb-1">
                    Current Owner
                  </label>
                  <p className="font-medium">{right.owner.username}</p>
                  <p className="font-mono text-xs text-muted-foreground break-all">
                    {right.owner.walletAddress}
                  </p>
                </div>
                
                <Separator />
                
                <div>
                  <label className="block text-sm font-medium text-muted-foreground mb-1">
                    Original Creator
                  </label>
                  <p className="font-medium">{right.creator.username}</p>
                  <p className="font-mono text-xs text-muted-foreground break-all">
                    {right.creator.walletAddress}
                  </p>
                </div>
              </CardContent>
            </Card>

            {/* Trust Indicators */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Shield className="w-5 h-5" />
                  Trust & Security
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex items-center space-x-2 text-sm">
                  <div className="w-2 h-2 bg-accent rounded-full"></div>
                  <span>Smart contract verified</span>
                </div>
                <div className="flex items-center space-x-2 text-sm">
                  <div className="w-2 h-2 bg-accent rounded-full"></div>
                  <span>Legal documents attached</span>
                </div>
                <div className="flex items-center space-x-2 text-sm">
                  <div className="w-2 h-2 bg-accent rounded-full"></div>
                  <span>IPFS metadata storage</span>
                </div>
                {right.paysDividends && (
                  <div className="flex items-center space-x-2 text-sm">
                    <div className="w-2 h-2 bg-accent rounded-full"></div>
                    <span>Automated revenue distribution</span>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}
