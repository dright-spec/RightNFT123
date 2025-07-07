import { useQuery } from "@tanstack/react-query";
import { Link, useParams } from "wouter";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { WalletButton } from "@/components/wallet-button";
import { useToast } from "@/hooks/use-toast";
import { HederaNFTCard } from "@/components/hedera-nft-card";
import { AutoNFTMinter } from "@/components/auto-nft-minter";
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
        {/* Auto NFT Minter - handles automatic minting when right is verified */}
        <AutoNFTMinter rightId={right.id} />
        
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

            {/* Legal Documents */}
            {right.legalDocumentUrl && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <FileText className="w-5 h-5" />
                    Legal Documentation
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center justify-between p-4 border border-border rounded-lg">
                    <div className="flex items-center space-x-3">
                      <div className="w-10 h-10 bg-red-100 rounded-lg flex items-center justify-center">
                        <FileText className="w-5 h-5 text-red-600" />
                      </div>
                      <div>
                        <p className="font-medium">Legal Agreement</p>
                        <p className="text-sm text-muted-foreground">PDF Document</p>
                      </div>
                    </div>
                    <Button variant="outline" size="sm" asChild>
                      <a href={right.legalDocumentUrl} target="_blank" rel="noopener noreferrer">
                        <ExternalLink className="w-4 h-4 mr-2" />
                        View
                      </a>
                    </Button>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Hedera NFT Information */}
            <HederaNFTCard right={right} />

            {/* Technical Details */}
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
                      Token ID
                    </label>
                    <p className="font-mono text-sm">{right.tokenId}</p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-muted-foreground mb-1">
                      Created
                    </label>
                    <p className="text-sm">{new Date(right.createdAt!).toLocaleDateString()}</p>
                  </div>
                </div>
                
                {right.metadataUrl && (
                  <div>
                    <label className="block text-sm font-medium text-muted-foreground mb-1">
                      Metadata URI
                    </label>
                    <div className="flex items-center space-x-2">
                      <p className="font-mono text-sm break-all flex-1">{right.metadataUrl}</p>
                      <Button variant="outline" size="sm" asChild>
                        <a href={right.metadataUrl} target="_blank" rel="noopener noreferrer">
                          <ExternalLink className="w-4 h-4" />
                        </a>
                      </Button>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
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
