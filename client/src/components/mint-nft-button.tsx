import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Rocket, Clock, Shield, Coins } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/query-client";
import { useLocation } from "wouter";

interface MintNFTButtonProps {
  rightId: number;
  rightTitle: string;
  verificationStatus: string;
  isVerified: boolean;
  isAlreadyMinted: boolean;
}

export function MintNFTButton({ 
  rightId, 
  rightTitle, 
  verificationStatus, 
  isVerified, 
  isAlreadyMinted 
}: MintNFTButtonProps) {
  const [showMintModal, setShowMintModal] = useState(false);
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [, setLocation] = useLocation();

  const mintMutation = useMutation({
    mutationFn: async () => {
      return apiRequest("POST", `/api/rights/${rightId}/mint`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/rights/${rightId}`] });
      queryClient.invalidateQueries({ queryKey: ["/api/rights"] });
      toast({
        title: "🚀 NFT Minting Started!",
        description: "Redirecting to track your NFT creation progress...",
      });
      // Redirect to minting progress page
      setLocation(`/minting-progress/${rightId}/${encodeURIComponent(rightTitle)}`);
    },
    onError: (error: any) => {
      console.error("Minting failed:", error);
      toast({
        title: "Minting Failed",
        description: error?.message || "Failed to start NFT minting. Please try again.",
        variant: "destructive",
      });
    },
  });

  const handleMint = () => {
    setShowMintModal(false);
    mintMutation.mutate();
  };

  if (isAlreadyMinted) {
    return (
      <Badge variant="secondary" className="bg-green-100 text-green-800">
        ✓ NFT Already Created
      </Badge>
    );
  }

  if (!isVerified) {
    return (
      <Badge variant="secondary" className="bg-yellow-100 text-yellow-800">
        <Clock className="h-3 w-3 mr-1" />
        Pending Verification
      </Badge>
    );
  }

  return (
    <>
      <Button
        onClick={() => setShowMintModal(true)}
        className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white font-semibold"
        size="lg"
      >
        <Rocket className="h-4 w-4 mr-2" />
        Create NFT Now
      </Button>

      {showMintModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <Card className="max-w-lg w-full">
            <CardHeader className="text-center">
              <div className="mx-auto mb-4 h-16 w-16 rounded-full bg-gradient-to-r from-blue-100 to-purple-100 flex items-center justify-center">
                <Rocket className="h-8 w-8 text-blue-600" />
              </div>
              <CardTitle className="text-2xl">Ready to Create Your NFT?</CardTitle>
              <p className="text-gray-600">
                Transform "{rightTitle}" into a tradeable digital asset on the Ethereum blockchain
              </p>
            </CardHeader>
            
            <CardContent className="space-y-6">
              {/* Benefits */}
              <div className="grid grid-cols-2 gap-4">
                <div className="text-center p-3 bg-blue-50 rounded-lg">
                  <Shield className="h-6 w-6 text-blue-600 mx-auto mb-2" />
                  <h4 className="font-semibold text-sm">Secure</h4>
                  <p className="text-xs text-gray-600">Blockchain verified ownership</p>
                </div>
                <div className="text-center p-3 bg-green-50 rounded-lg">
                  <Coins className="h-6 w-6 text-green-600 mx-auto mb-2" />
                  <h4 className="font-semibold text-sm">Tradeable</h4>
                  <p className="text-xs text-gray-600">Instantly available on marketplace</p>
                </div>
              </div>

              {/* What Happens Next */}
              <div className="bg-gray-50 rounded-lg p-4">
                <h4 className="font-semibold mb-2">What happens next:</h4>
                <ul className="text-sm text-gray-600 space-y-1">
                  <li>• NFT creation takes about 30-60 seconds</li>
                  <li>• Comprehensive metadata includes all right details</li>
                  <li>• Automatically listed on our marketplace</li>
                  <li>• You'll receive a blockchain certificate</li>
                </ul>
              </div>

              {/* Action Buttons */}
              <div className="flex gap-3">
                <Button
                  variant="outline"
                  onClick={() => setShowMintModal(false)}
                  className="flex-1"
                  disabled={mintMutation.isPending}
                >
                  Cancel
                </Button>
                <Button
                  onClick={handleMint}
                  disabled={mintMutation.isPending}
                  className="flex-1 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700"
                >
                  {mintMutation.isPending ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                      Creating...
                    </>
                  ) : (
                    <>
                      <Rocket className="h-4 w-4 mr-2" />
                      Create NFT
                    </>
                  )}
                </Button>
              </div>

              {/* Trust Indicators */}
              <div className="text-center text-xs text-gray-500">
                <p>✓ No upfront costs • ✓ Secure blockchain recording • ✓ Instant marketplace listing</p>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </>
  );
}