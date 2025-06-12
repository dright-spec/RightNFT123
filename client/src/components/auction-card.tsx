import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { 
  Clock, 
  Users, 
  Gavel, 
  TrendingUp, 
  Eye,
  Heart,
  ExternalLink,
  Timer,
  DollarSign 
} from "lucide-react";
import { VerificationBadge } from "@/components/verification-badge";
import type { RightWithCreator, BidWithUser } from "@shared/schema";

interface AuctionCardProps {
  right: RightWithCreator;
  showBidding?: boolean;
}

export function AuctionCard({ right, showBidding = true }: AuctionCardProps) {
  const [bidAmount, setBidAmount] = useState("");
  const [showBidForm, setShowBidForm] = useState(false);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Fetch bids for this auction
  const { data: bids = [] } = useQuery<BidWithUser[]>({
    queryKey: ["/api/rights", right.id, "bids"],
    queryFn: () => fetch(`/api/rights/${right.id}/bids`).then(res => res.json()),
    enabled: right.listingType === "auction",
    refetchInterval: 5000, // Refresh every 5 seconds for real-time updates
  });

  const placeBidMutation = useMutation({
    mutationFn: async (data: { amount: string }) => {
      return apiRequest(`/api/rights/${right.id}/bids`, "POST", {
        amount: data.amount,
        bidderId: 1, // TODO: Get from auth context
        rightId: right.id
      });
    },
    onSuccess: () => {
      toast({
        title: "Bid Placed Successfully",
        description: `Your bid of ${bidAmount} ETH has been placed.`,
      });
      setBidAmount("");
      setShowBidForm(false);
      queryClient.invalidateQueries({ queryKey: ["/api/rights", right.id, "bids"] });
      queryClient.invalidateQueries({ queryKey: ["/api/rights"] });
    },
    onError: (error) => {
      toast({
        title: "Bid Failed",
        description: error instanceof Error ? error.message : "Failed to place bid",
        variant: "destructive",
      });
    },
  });

  const getTimeRemaining = () => {
    if (!right.auctionEndTime) return null;
    
    const endTime = new Date(right.auctionEndTime).getTime();
    const now = new Date().getTime();
    const timeLeft = endTime - now;
    
    if (timeLeft <= 0) return "Auction ended";
    
    const days = Math.floor(timeLeft / (1000 * 60 * 60 * 24));
    const hours = Math.floor((timeLeft % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
    const minutes = Math.floor((timeLeft % (1000 * 60 * 60)) / (1000 * 60));
    
    if (days > 0) return `${days}d ${hours}h`;
    if (hours > 0) return `${hours}h ${minutes}m`;
    return `${minutes}m`;
  };

  const isAuctionActive = () => {
    if (!right.auctionEndTime) return false;
    return new Date(right.auctionEndTime).getTime() > new Date().getTime();
  };

  const getCurrentPrice = () => {
    return right.highestBidAmount || right.minBidAmount || right.price || "0";
  };

  const getMinimumBid = () => {
    const currentPrice = parseFloat(getCurrentPrice());
    const minIncrement = currentPrice * 0.05; // 5% minimum increment
    return Math.max(currentPrice + minIncrement, parseFloat(right.minBidAmount || "0")).toFixed(4);
  };

  const handlePlaceBid = () => {
    const bidValue = parseFloat(bidAmount);
    const minimumBid = parseFloat(getMinimumBid());
    
    if (bidValue < minimumBid) {
      toast({
        title: "Invalid Bid",
        description: `Minimum bid is ${minimumBid} ETH`,
        variant: "destructive",
      });
      return;
    }
    
    placeBidMutation.mutate({ amount: bidAmount });
  };

  return (
    <Card className="overflow-hidden hover:shadow-lg transition-shadow duration-300 border-2 border-orange-200 dark:border-orange-800">
      <CardHeader className="p-0">
        <div className="relative">
          {right.contentFileUrl ? (
            <img 
              src={right.contentFileUrl} 
              alt={right.title}
              className="w-full h-48 object-cover"
            />
          ) : (
            <div className="w-full h-48 bg-gradient-to-br from-orange-100 to-amber-100 dark:from-orange-900 dark:to-amber-900 flex items-center justify-center">
              <Gavel className="h-12 w-12 text-orange-500" />
            </div>
          )}
          
          {/* Auction Status Badge */}
          <div className="absolute top-3 left-3">
            <Badge variant={isAuctionActive() ? "default" : "secondary"} className="bg-orange-600 hover:bg-orange-700">
              <Timer className="h-3 w-3 mr-1" />
              {isAuctionActive() ? "Live Auction" : "Auction Ended"}
            </Badge>
          </div>
          
          {/* Time Remaining */}
          {isAuctionActive() && (
            <div className="absolute top-3 right-3 bg-black/80 text-white px-2 py-1 rounded text-sm flex items-center gap-1">
              <Clock className="h-3 w-3" />
              {getTimeRemaining()}
            </div>
          )}
          
          {/* Verification Badge */}
          <div className="absolute bottom-3 left-3">
            <VerificationBadge status={(right.verificationStatus as "pending" | "verified" | "rejected") || "pending"} size="sm" />
          </div>
        </div>
      </CardHeader>
      
      <CardContent className="p-4 space-y-4">
        {/* Title and Creator */}
        <div>
          <h3 className="font-semibold text-lg line-clamp-2 mb-1">{right.title}</h3>
          <div className="flex items-center gap-2">
            <Avatar className="h-6 w-6">
              <AvatarImage src={right.creator.profileImageUrl || ""} />
              <AvatarFallback className="text-xs">
                {right.creator.username?.charAt(0).toUpperCase() || "C"}
              </AvatarFallback>
            </Avatar>
            <span className="text-sm text-muted-foreground">
              by {right.creator.username || "Unknown Creator"}
            </span>
          </div>
        </div>

        {/* Current Price and Bid Info */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-sm text-muted-foreground">Current Price</span>
            <div className="text-right">
              <div className="font-bold text-lg text-orange-600">
                {getCurrentPrice()} ETH
              </div>
              {right.highestBidAmount && (
                <div className="text-xs text-muted-foreground">
                  {bids.length} bid{bids.length !== 1 ? 's' : ''}
                </div>
              )}
            </div>
          </div>
          
          {right.minBidAmount && (
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">Minimum Bid</span>
              <span className="font-medium">{getMinimumBid()} ETH</span>
            </div>
          )}
        </div>

        {/* Stats */}
        <div className="flex items-center gap-4 text-sm text-muted-foreground">
          <div className="flex items-center gap-1">
            <Eye className="h-4 w-4" />
            <span>{right.views || 0}</span>
          </div>
          <div className="flex items-center gap-1">
            <Heart className="h-4 w-4" />
            <span>{right.favorites || 0}</span>
          </div>
          <div className="flex items-center gap-1">
            <Users className="h-4 w-4" />
            <span>{bids.length}</span>
          </div>
        </div>

        {/* Recent Bids */}
        {bids.length > 0 && (
          <div className="space-y-2">
            <h4 className="text-sm font-medium flex items-center gap-1">
              <TrendingUp className="h-4 w-4" />
              Recent Bids
            </h4>
            <div className="space-y-1 max-h-24 overflow-y-auto">
              {bids.slice(0, 3).map((bid, index) => (
                <div key={bid.id} className="flex items-center justify-between text-xs p-2 bg-gray-50 dark:bg-gray-800 rounded">
                  <div className="flex items-center gap-2">
                    <Avatar className="h-5 w-5">
                      <AvatarImage src={bid.bidder.profileImageUrl || ""} />
                      <AvatarFallback className="text-xs">
                        {bid.bidder.username?.charAt(0).toUpperCase() || "B"}
                      </AvatarFallback>
                    </Avatar>
                    <span>{bid.bidder.username || "Anonymous"}</span>
                    {index === 0 && <Badge variant="secondary" className="text-xs py-0">Highest</Badge>}
                  </div>
                  <span className="font-medium">{bid.amount} ETH</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Bidding Interface */}
        {showBidding && isAuctionActive() && (
          <div className="space-y-3 pt-2 border-t">
            {!showBidForm ? (
              <Button 
                onClick={() => setShowBidForm(true)}
                className="w-full bg-orange-600 hover:bg-orange-700"
              >
                <Gavel className="h-4 w-4 mr-2" />
                Place Bid
              </Button>
            ) : (
              <div className="space-y-2">
                <div className="flex gap-2">
                  <Input
                    type="number"
                    step="0.0001"
                    min={getMinimumBid()}
                    placeholder={`Min: ${getMinimumBid()} ETH`}
                    value={bidAmount}
                    onChange={(e) => setBidAmount(e.target.value)}
                    className="flex-1"
                  />
                  <Button 
                    onClick={handlePlaceBid}
                    disabled={placeBidMutation.isPending || !bidAmount}
                    className="bg-orange-600 hover:bg-orange-700"
                  >
                    {placeBidMutation.isPending ? "Bidding..." : "Bid"}
                  </Button>
                </div>
                <Button 
                  variant="outline" 
                  size="sm" 
                  onClick={() => setShowBidForm(false)}
                  className="w-full"
                >
                  Cancel
                </Button>
              </div>
            )}
          </div>
        )}

        {/* View Details Button */}
        <Button variant="outline" className="w-full" asChild>
          <a href={`/rights/${right.id}`} className="flex items-center gap-2">
            <ExternalLink className="h-4 w-4" />
            View Details
          </a>
        </Button>
      </CardContent>
    </Card>
  );
}