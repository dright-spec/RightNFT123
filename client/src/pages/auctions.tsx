import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { AuctionCard } from "@/components/auction-card";
import { RightCard } from "@/components/right-card";
import { 
  Gavel, 
  Clock, 
  TrendingUp, 
  Filter, 
  Search,
  Timer,
  DollarSign,
  Users,
  Trophy,
  Zap
} from "lucide-react";
import type { RightWithCreator } from "@shared/schema";

export default function Auctions() {
  const [searchQuery, setSearchQuery] = useState("");
  const [sortBy, setSortBy] = useState("ending-soon");
  const [priceFilter, setPriceFilter] = useState("all");
  const [activeTab, setActiveTab] = useState("live");

  // Fetch auction rights
  const { data: allRights = [], isLoading } = useQuery<RightWithCreator[]>({
    queryKey: ["/api/rights", { listingType: "auction" }],
    queryFn: () => fetch("/api/rights?listingType=auction&limit=50").then(res => res.json()),
    refetchInterval: 10000, // Refresh every 10 seconds for live updates
  });

  // Filter rights based on auction status
  const filterRightsByStatus = (rights: RightWithCreator[], status: string) => {
    const now = new Date().getTime();
    
    return rights.filter(right => {
      if (!right.auctionEndTime) return false;
      const auctionEndTime = new Date(right.auctionEndTime).getTime();
      
      switch (status) {
        case "live":
          return auctionEndTime > now; // Active auctions
        case "ending-soon":
          const hoursLeft = (auctionEndTime - now) / (1000 * 60 * 60);
          return auctionEndTime > now && hoursLeft <= 24; // Ending in 24 hours
        case "ended":
          return auctionEndTime <= now; // Ended auctions
        default:
          return true;
      }
    });
  };

  // Apply search and filters
  const filteredRights = allRights.filter(right => {
    const matchesSearch = !searchQuery || 
      right.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      right.creator.username?.toLowerCase().includes(searchQuery.toLowerCase());
    
    const matchesPrice = priceFilter === "all" || 
      (priceFilter === "low" && parseFloat(right.price || "0") < 1) ||
      (priceFilter === "medium" && parseFloat(right.price || "0") >= 1 && parseFloat(right.price || "0") < 5) ||
      (priceFilter === "high" && parseFloat(right.price || "0") >= 5);
    
    return matchesSearch && matchesPrice;
  });

  // Sort rights
  const sortedRights = [...filteredRights].sort((a, b) => {
    switch (sortBy) {
      case "ending-soon":
        const aTime = a.auctionEndTime ? new Date(a.auctionEndTime).getTime() : 0;
        const bTime = b.auctionEndTime ? new Date(b.auctionEndTime).getTime() : 0;
        return aTime - bTime;
      case "highest-bid":
        const aBid = parseFloat(a.highestBidAmount || "0");
        const bBid = parseFloat(b.highestBidAmount || "0");
        return bBid - aBid;
      case "most-bids":
        return (b.bidCount || 0) - (a.bidCount || 0);
      case "newest":
        return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
      default:
        return 0;
    }
  });

  const liveAuctions = filterRightsByStatus(sortedRights, "live");
  const endingSoonAuctions = filterRightsByStatus(sortedRights, "ending-soon");
  const endedAuctions = filterRightsByStatus(sortedRights, "ended");

  const auctionStats = {
    totalLive: liveAuctions.length,
    endingSoon: endingSoonAuctions.length,
    totalVolume: allRights.reduce((sum, right) => sum + parseFloat(right.highestBidAmount || "0"), 0),
    avgBidPrice: allRights.length > 0 ? 
      allRights.reduce((sum, right) => sum + parseFloat(right.highestBidAmount || "0"), 0) / allRights.length : 0
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="bg-gradient-to-r from-orange-500 to-amber-500 text-white">
        <div className="container mx-auto px-4 py-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold flex items-center gap-2">
                <Gavel className="h-8 w-8" />
                Digital Rights Auctions
              </h1>
              <p className="text-orange-100 mt-2">
                Bid on exclusive digital rights and intellectual property
              </p>
            </div>
            <div className="text-right">
              <div className="text-2xl font-bold">{auctionStats.totalLive}</div>
              <div className="text-orange-100">Live Auctions</div>
            </div>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-8">
        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Live Auctions</p>
                  <p className="text-2xl font-bold text-green-600">{auctionStats.totalLive}</p>
                </div>
                <Zap className="h-8 w-8 text-green-600" />
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Ending Soon</p>
                  <p className="text-2xl font-bold text-orange-600">{auctionStats.endingSoon}</p>
                </div>
                <Timer className="h-8 w-8 text-orange-600" />
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Total Volume</p>
                  <p className="text-2xl font-bold text-blue-600">{auctionStats.totalVolume.toFixed(2)} ETH</p>
                </div>
                <DollarSign className="h-8 w-8 text-blue-600" />
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Avg Bid Price</p>
                  <p className="text-2xl font-bold text-purple-600">{auctionStats.avgBidPrice.toFixed(3)} ETH</p>
                </div>
                <Trophy className="h-8 w-8 text-purple-600" />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Filters and Search */}
        <Card className="mb-8">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Filter className="h-5 w-5" />
              Filters & Search
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div className="relative">
                <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search auctions..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10"
                />
              </div>
              
              <Select value={sortBy} onValueChange={setSortBy}>
                <SelectTrigger>
                  <SelectValue placeholder="Sort by" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="ending-soon">Ending Soon</SelectItem>
                  <SelectItem value="highest-bid">Highest Bid</SelectItem>
                  <SelectItem value="most-bids">Most Bids</SelectItem>
                  <SelectItem value="newest">Newest</SelectItem>
                </SelectContent>
              </Select>
              
              <Select value={priceFilter} onValueChange={setPriceFilter}>
                <SelectTrigger>
                  <SelectValue placeholder="Price range" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Prices</SelectItem>
                  <SelectItem value="low">Under 1 ETH</SelectItem>
                  <SelectItem value="medium">1-5 ETH</SelectItem>
                  <SelectItem value="high">5+ ETH</SelectItem>
                </SelectContent>
              </Select>
              
              <Button variant="outline" onClick={() => {
                setSearchQuery("");
                setSortBy("ending-soon");
                setPriceFilter("all");
              }}>
                Clear Filters
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Auction Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="live" className="flex items-center gap-2">
              <Zap className="h-4 w-4" />
              Live Auctions ({liveAuctions.length})
            </TabsTrigger>
            <TabsTrigger value="ending-soon" className="flex items-center gap-2">
              <Clock className="h-4 w-4" />
              Ending Soon ({endingSoonAuctions.length})
            </TabsTrigger>
            <TabsTrigger value="ended" className="flex items-center gap-2">
              <Trophy className="h-4 w-4" />
              Recently Ended ({endedAuctions.length})
            </TabsTrigger>
          </TabsList>

          <TabsContent value="live" className="mt-8">
            {isLoading ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {[...Array(6)].map((_, i) => (
                  <Card key={i} className="animate-pulse">
                    <div className="h-48 bg-gray-200 dark:bg-gray-700"></div>
                    <CardContent className="p-4 space-y-3">
                      <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-3/4"></div>
                      <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-1/2"></div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            ) : liveAuctions.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {liveAuctions.map((right) => (
                  <AuctionCard key={right.id} right={right} showBidding={true} />
                ))}
              </div>
            ) : (
              <Card>
                <CardContent className="p-12 text-center">
                  <Gavel className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-lg font-medium mb-2">No Live Auctions</h3>
                  <p className="text-muted-foreground">
                    There are currently no active auctions. Check back soon!
                  </p>
                </CardContent>
              </Card>
            )}
          </TabsContent>

          <TabsContent value="ending-soon" className="mt-8">
            {endingSoonAuctions.length > 0 ? (
              <div className="space-y-4">
                <div className="bg-orange-50 dark:bg-orange-950 border border-orange-200 dark:border-orange-800 rounded-lg p-4 mb-6">
                  <div className="flex items-center gap-2 text-orange-800 dark:text-orange-200">
                    <Timer className="h-5 w-5" />
                    <span className="font-medium">Hurry! These auctions end within 24 hours</span>
                  </div>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {endingSoonAuctions.map((right) => (
                    <AuctionCard key={right.id} right={right} showBidding={true} />
                  ))}
                </div>
              </div>
            ) : (
              <Card>
                <CardContent className="p-12 text-center">
                  <Clock className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-lg font-medium mb-2">No Auctions Ending Soon</h3>
                  <p className="text-muted-foreground">
                    No auctions are ending in the next 24 hours.
                  </p>
                </CardContent>
              </Card>
            )}
          </TabsContent>

          <TabsContent value="ended" className="mt-8">
            {endedAuctions.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {endedAuctions.map((right) => (
                  <RightCard key={right.id} right={right} />
                ))}
              </div>
            ) : (
              <Card>
                <CardContent className="p-12 text-center">
                  <Trophy className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-lg font-medium mb-2">No Ended Auctions</h3>
                  <p className="text-muted-foreground">
                    No auctions have ended recently.
                  </p>
                </CardContent>
              </Card>
            )}
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}