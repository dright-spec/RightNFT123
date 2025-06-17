import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Slider } from "@/components/ui/slider";
import { Checkbox } from "@/components/ui/checkbox";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { AnimatedRightGrid } from "@/components/animated-right-card";
import { WalletButton } from "@/components/wallet-button";
import { ActivityFeed } from "@/components/activity-feed";
import { 
  ArrowLeft, 
  Filter, 
  TrendingUp, 
  Zap, 
  Search, 
  Grid3X3, 
  List, 
  Clock,
  DollarSign,
  Eye,
  Heart,
  Share2,
  MoreHorizontal,
  Timer,
  Gavel,
  ShoppingCart,
  TrendingDown
} from "lucide-react";
import type { RightWithCreator } from "@shared/schema";

export default function Marketplace() {
  const [typeFilter, setTypeFilter] = useState<string>("all");
  const [sortBy, setSortBy] = useState<string>("newest");
  const [priceRange, setPriceRange] = useState<number[]>([0, 1000]);
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [listingType, setListingType] = useState<string>("all");
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");
  const [showFilters, setShowFilters] = useState<boolean>(false);
  const [activeTab, setActiveTab] = useState<string>("explore");

  const { data: allRights, isLoading, error } = useQuery<RightWithCreator[]>({
    queryKey: ["/api/rights", { 
      limit: 100, 
      isListed: true,
      search: searchQuery || undefined,
      type: typeFilter === "all" ? undefined : typeFilter 
    }],
  });

  // Advanced filtering logic
  const filteredRights = allRights?.filter(right => {
    // Price range filter
    const price = parseFloat(right.price || "0");
    if (price < priceRange[0] || price > priceRange[1]) return false;
    
    // Listing type filter
    if (listingType !== "all") {
      if (listingType === "auction" && right.listingType !== "auction") return false;
      if (listingType === "fixed" && right.listingType !== "fixed") return false;
      if (listingType === "ending-soon" && right.listingType === "auction") {
        const endTime = new Date(right.auctionEndTime || 0);
        const now = new Date();
        const hoursLeft = (endTime.getTime() - now.getTime()) / (1000 * 60 * 60);
        if (hoursLeft > 24) return false;
      }
    }
    
    return true;
  });

  // Advanced sorting logic
  const sortedRights = filteredRights?.sort((a, b) => {
    switch (sortBy) {
      case "price-high":
        return parseFloat(b.price || "0") - parseFloat(a.price || "0");
      case "price-low":
        return parseFloat(a.price || "0") - parseFloat(b.price || "0");
      case "ending-soon":
        if (a.listingType === "auction" && b.listingType === "auction") {
          const aEnd = new Date(a.auctionEndTime || 0).getTime();
          const bEnd = new Date(b.auctionEndTime || 0).getTime();
          return aEnd - bEnd;
        }
        return 0;
      case "most-viewed":
        return (b.views || 0) - (a.views || 0);
      case "most-favorited":
        return (b.favorites || 0) - (a.favorites || 0);
      case "oldest":
        return new Date(a.createdAt!).getTime() - new Date(b.createdAt!).getTime();
      default: // newest
        return new Date(b.createdAt!).getTime() - new Date(a.createdAt!).getTime();
    }
  });

  if (error) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Card className="w-full max-w-md mx-4">
          <CardContent className="pt-6">
            <p className="text-destructive text-center">Failed to load marketplace data</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="bg-background shadow-sm border-b border-border sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center space-x-4">
              <Link href="/">
                <Button variant="ghost" size="sm">
                  <ArrowLeft className="w-4 h-4 mr-2" />
                  Back to Home
                </Button>
              </Link>
              <h1 className="text-xl font-semibold text-foreground">Marketplace</h1>
            </div>
            
            <div className="flex items-center space-x-4">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  placeholder="Search items, creators, collections..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10 w-80"
                />
              </div>
              <WalletButton />
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* OpenSea-style Tabs */}
        <Tabs defaultValue="explore" className="w-full">
          <TabsList className="grid w-full grid-cols-4 mb-8">
            <TabsTrigger value="explore" className="flex items-center gap-2">
              <TrendingUp className="w-4 h-4" />
              Explore
            </TabsTrigger>
            <TabsTrigger value="auctions" className="flex items-center gap-2">
              <Gavel className="w-4 h-4" />
              Auctions
            </TabsTrigger>
            <TabsTrigger value="fixed-price" className="flex items-center gap-2">
              <ShoppingCart className="w-4 h-4" />
              Buy Now
            </TabsTrigger>
            <TabsTrigger value="activity" className="flex items-center gap-2">
              <Zap className="w-4 h-4" />
              Activity
            </TabsTrigger>
          </TabsList>

          {/* Filters Bar */}
          <div className="flex items-center justify-between mb-6 p-4 bg-card rounded-lg border">
            <div className="flex items-center gap-4">
              <Button
                variant={showFilters ? "default" : "outline"}
                size="sm"
                onClick={() => setShowFilters(!showFilters)}
                className="flex items-center gap-2"
              >
                <Filter className="w-4 h-4" />
                Filters
              </Button>
              
              {/* Quick Filters based on business model */}
              <div className="flex items-center gap-2">
                <Badge 
                  variant={listingType === "all" ? "default" : "secondary"}
                  className="cursor-pointer"
                  onClick={() => setListingType("all")}
                >
                  All Items
                </Badge>
                <Badge 
                  variant={listingType === "auction" ? "default" : "secondary"}
                  className="cursor-pointer"
                  onClick={() => setListingType("auction")}
                >
                  <Timer className="w-3 h-3 mr-1" />
                  Auctions
                </Badge>
                <Badge 
                  variant={listingType === "fixed" ? "default" : "secondary"}
                  className="cursor-pointer"
                  onClick={() => setListingType("fixed")}
                >
                  <DollarSign className="w-3 h-3 mr-1" />
                  Buy Now
                </Badge>
                <Badge 
                  variant={listingType === "ending-soon" ? "default" : "secondary"}
                  className="cursor-pointer"
                  onClick={() => setListingType("ending-soon")}
                >
                  <Clock className="w-3 h-3 mr-1" />
                  Ending Soon
                </Badge>
              </div>
            </div>

            <div className="flex items-center gap-4">
              <span className="text-sm text-muted-foreground">
                {sortedRights?.length || 0} items
              </span>
              
              <Select value={sortBy} onValueChange={setSortBy}>
                <SelectTrigger className="w-48">
                  <SelectValue placeholder="Sort by" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="newest">Recently Listed</SelectItem>
                  <SelectItem value="oldest">Oldest</SelectItem>
                  <SelectItem value="price-high">Highest Value</SelectItem>
                  <SelectItem value="price-low">Best Deals</SelectItem>
                  <SelectItem value="ending-soon">Auction Ending Soon</SelectItem>
                  <SelectItem value="most-viewed">Most Popular</SelectItem>
                  <SelectItem value="most-favorited">Most Favorited</SelectItem>
                </SelectContent>
              </Select>

              <div className="flex items-center border rounded-lg">
                <Button
                  variant={viewMode === "grid" ? "default" : "ghost"}
                  size="sm"
                  onClick={() => setViewMode("grid")}
                  className="rounded-r-none"
                >
                  <Grid3X3 className="w-4 h-4" />
                </Button>
                <Button
                  variant={viewMode === "list" ? "default" : "ghost"}
                  size="sm"
                  onClick={() => setViewMode("list")}
                  className="rounded-l-none"
                >
                  <List className="w-4 h-4" />
                </Button>
              </div>
            </div>
          </div>

          {/* Advanced Filters Panel - Business Model Focused */}
          {showFilters && (
            <Card className="mb-6">
              <CardContent className="p-6">
                <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                  {/* Investment Value Range */}
                  <div>
                    <label className="text-sm font-medium mb-3 block">Investment Range (ETH)</label>
                    <div className="space-y-3">
                      <Slider
                        value={priceRange}
                        onValueChange={setPriceRange}
                        max={1000}
                        step={10}
                        className="w-full"
                      />
                      <div className="flex justify-between text-sm text-muted-foreground">
                        <span>{priceRange[0]} ETH</span>
                        <span>{priceRange[1]} ETH</span>
                      </div>
                    </div>
                  </div>

                  {/* Revenue Potential */}
                  <div>
                    <label className="text-sm font-medium mb-3 block">Revenue Model</label>
                    <div className="space-y-2">
                      <div className="flex items-center space-x-2">
                        <Checkbox id="dividends" />
                        <label htmlFor="dividends" className="text-sm">Pays Dividends</label>
                      </div>
                      <div className="flex items-center space-x-2">
                        <Checkbox id="royalties" />
                        <label htmlFor="royalties" className="text-sm">Ongoing Royalties</label>
                      </div>
                      <div className="flex items-center space-x-2">
                        <Checkbox id="appreciation" />
                        <label htmlFor="appreciation" className="text-sm">Value Appreciation</label>
                      </div>
                    </div>
                  </div>

                  {/* Asset Type & Quality */}
                  <div>
                    <label className="text-sm font-medium mb-3 block">Asset Category</label>
                    <Select value={typeFilter} onValueChange={setTypeFilter}>
                      <SelectTrigger>
                        <SelectValue placeholder="All Categories" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All Categories</SelectItem>
                        <SelectItem value="copyright">Copyright (Creative Works)</SelectItem>
                        <SelectItem value="royalty">Royalty Streams</SelectItem>
                        <SelectItem value="access">Exclusive Access Rights</SelectItem>
                        <SelectItem value="ownership">Ownership Stakes</SelectItem>
                        <SelectItem value="license">Licensing Rights</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  {/* Risk & Verification */}
                  <div>
                    <label className="text-sm font-medium mb-3 block">Risk Level</label>
                    <div className="space-y-2">
                      <div className="flex items-center space-x-2">
                        <Checkbox id="verified" />
                        <label htmlFor="verified" className="text-sm">Verified Only</label>
                      </div>
                      <div className="flex items-center space-x-2">
                        <Checkbox id="established" />
                        <label htmlFor="established" className="text-sm">Established Creators</label>
                      </div>
                      <div className="flex items-center space-x-2">
                        <Checkbox id="liquid" />
                        <label htmlFor="liquid" className="text-sm">High Liquidity</label>
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Tab Content */}
          <TabsContent value="explore" className="space-y-4">
            {/* Investment Opportunity Banner */}
            <Card className="mb-6 bg-gradient-to-r from-blue-50 to-purple-50 dark:from-blue-950/20 dark:to-purple-950/20 border-blue-200 dark:border-blue-800">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 bg-blue-100 dark:bg-blue-900/30 rounded-full flex items-center justify-center">
                      <TrendingUp className="w-6 h-6 text-blue-600" />
                    </div>
                    <div>
                      <h3 className="font-bold text-blue-900 dark:text-blue-100">Investment Marketplace</h3>
                      <p className="text-blue-700 dark:text-blue-300">Turn creative assets into liquid investments with guaranteed ownership rights</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-4 text-right">
                    <div>
                      <div className="text-2xl font-bold text-blue-900 dark:text-blue-100">{sortedRights?.length || 0}</div>
                      <div className="text-sm text-blue-700 dark:text-blue-300">Available Rights</div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Rights Grid/List Display */}
            {isLoading ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {Array.from({ length: 6 }).map((_, i) => (
                  <Card key={i} className="animate-pulse">
                    <CardContent className="p-6">
                      <div className="h-4 bg-muted rounded w-3/4 mb-4"></div>
                      <div className="h-3 bg-muted rounded w-full mb-2"></div>
                      <div className="h-3 bg-muted rounded w-2/3"></div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            ) : sortedRights && sortedRights.length > 0 ? (
              <AnimatedRightGrid rights={sortedRights} variant="grid" />
            ) : (
              <Card className="text-center py-12">
                <CardContent>
                  <div className="w-16 h-16 bg-muted rounded-full flex items-center justify-center mx-auto mb-4">
                    <Search className="w-8 h-8 text-muted-foreground" />
                  </div>
                  <h3 className="text-lg font-medium mb-2">No rights found</h3>
                  <p className="text-muted-foreground mb-4">
                    Try adjusting your filters or search terms
                  </p>
                  <Button variant="outline" onClick={() => {
                    setSearchQuery("");
                    setTypeFilter("all");
                    setListingType("all");
                    setPriceRange([0, 1000]);
                  }}>
                    Clear Filters
                  </Button>
                </CardContent>
              </Card>
            )}
          </TabsContent>

          {/* Auctions Tab */}
          <TabsContent value="auctions" className="space-y-4">
            <Card>
              <CardContent className="p-6">
                <div className="text-center py-8">
                  <Gavel className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                  <h3 className="text-lg font-medium mb-2">Live Auctions</h3>
                  <p className="text-muted-foreground">
                    Active auctions with time-sensitive bidding opportunities
                  </p>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Fixed Price Tab */}
          <TabsContent value="fixed-price" className="space-y-4">
            <Card>
              <CardContent className="p-6">
                <div className="text-center py-8">
                  <ShoppingCart className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                  <h3 className="text-lg font-medium mb-2">Buy Now</h3>
                  <p className="text-muted-foreground">
                    Fixed price listings available for immediate purchase
                  </p>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Activity Tab */}
          <TabsContent value="activity" className="space-y-4">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              <div className="lg:col-span-2">
                <Card>
                  <CardHeader>
                    <CardTitle>Recent Activity</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <ActivityFeed />
                  </CardContent>
                </Card>
              </div>
              <div>
                <Card>
                  <CardHeader>
                    <CardTitle>Market Stats</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Total Volume</span>
                      <span className="font-medium">847.3 ETH</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Floor Price</span>
                      <span className="font-medium">0.05 ETH</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Listed</span>
                      <span className="font-medium">{sortedRights?.length || 0}</span>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
                <CardContent className="p-6">
                  <h3 className="font-semibold mb-4">Market Stats</h3>
                  <div className="space-y-4">
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-muted-foreground">24h Volume</span>
                      <span className="font-semibold text-green-600">$24,680</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-muted-foreground">Active Listings</span>
                      <span className="font-semibold">{sortedRights?.length || 0}</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-muted-foreground">Avg. Price</span>
                      <span className="font-semibold">2.4 ETH</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-muted-foreground">Market Cap</span>
                      <span className="font-semibold">$2.1M</span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
