import { useEffect, useState } from "react";
import { useLocation } from "wouter";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { MintingProgressTracker } from "@/components/minting-progress-tracker";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ArrowLeft, Home } from "lucide-react";

export default function MintingProgressPage() {
  const [location, setLocation] = useLocation();
  const searchParams = new URLSearchParams(location.split('?')[1] || '');
  const rightId = searchParams.get('rightId');
  const rightTitle = searchParams.get('title') || 'Your Right';

  if (!rightId) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
        <Card className="max-w-md mx-auto">
          <CardHeader>
            <CardTitle>Invalid Request</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="mb-4">No right ID provided for minting progress tracking.</p>
            <Button onClick={() => setLocation('/')}>
              <Home className="h-4 w-4 mr-2" />
              Go Home
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  const handleMintingComplete = (result: any) => {
    // Redirect to right detail page or marketplace after successful minting
    setTimeout(() => {
      setLocation(`/right/${rightId}`);
    }, 3000);
  };

  const handleMintingError = (error: string) => {
    console.error('Minting error:', error);
    // Stay on page to show error state
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-4">
      <div className="max-w-4xl mx-auto py-8">
        {/* Header */}
        <div className="mb-8">
          <Button 
            variant="ghost" 
            onClick={() => setLocation('/marketplace')}
            className="mb-4"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Marketplace
          </Button>
          
          <div className="text-center">
            <h1 className="text-3xl font-bold text-gray-900 mb-2">
              Creating Your NFT
            </h1>
            <p className="text-lg text-gray-600">
              We're minting your verified right as an NFT on the Hedera blockchain
            </p>
          </div>
        </div>

        {/* Progress Tracker */}
        <MintingProgressTracker
          rightId={parseInt(rightId)}
          rightTitle={decodeURIComponent(rightTitle)}
          onComplete={handleMintingComplete}
          onError={handleMintingError}
        />

        {/* Information Section */}
        <Card className="mt-8">
          <CardHeader>
            <CardTitle>What's Happening?</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <h4 className="font-semibold mb-2">Verification Complete</h4>
              <p className="text-sm text-muted-foreground">
                Your right has been verified by our team and is now being minted as an NFT.
              </p>
            </div>
            
            <div>
              <h4 className="font-semibold mb-2">Blockchain Technology</h4>
              <p className="text-sm text-muted-foreground">
                We use Hedera's energy-efficient blockchain to create your NFT with minimal environmental impact.
              </p>
            </div>
            
            <div>
              <h4 className="font-semibold mb-2">What's Next?</h4>
              <p className="text-sm text-muted-foreground">
                Once minting is complete, your NFT will be available for trading on our marketplace. 
                You'll maintain ownership and can set your own prices.
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}