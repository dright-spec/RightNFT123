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

        {/* Filters */}
        <Card className="mb-8">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Filter className="w-5 h-5" />
              Filters & Sorting
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-col sm:flex-row gap-4">
              <div className="flex-1">
                <label className="block text-sm font-medium mb-2">Type</label>
                <Select value={typeFilter} onValueChange={setTypeFilter}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Types</SelectItem>
                    <SelectItem value="copyright">📄 Copyright</SelectItem>
                    <SelectItem value="royalty">💰 Royalty</SelectItem>
                    <SelectItem value="access">🔐 Access</SelectItem>
                    <SelectItem value="ownership">🏢 Ownership</SelectItem>
                    <SelectItem value="license">📜 License</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              <div className="flex-1">
                <label className="block text-sm font-medium mb-2">Sort By</label>
                <Select value={sortBy} onValueChange={setSortBy}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="newest">Newest First</SelectItem>
                    <SelectItem value="oldest">Oldest First</SelectItem>
                    <SelectItem value="price-high">Price: High to Low</SelectItem>
                    <SelectItem value="price-low">Price: Low to High</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Market Activity Banner */}
        <div className="mb-8 bg-gradient-to-r from-green-50 to-blue-50 dark:from-green-950/20 dark:to-blue-950/20 border border-green-200 dark:border-green-800 rounded-xl p-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-green-100 dark:bg-green-900/30 rounded-full flex items-center justify-center">
                <TrendingUp className="w-6 h-6 text-green-600" />
              </div>
              <div>
                <h3 className="font-bold text-green-900 dark:text-green-100">Market is Active</h3>
                <p className="text-sm text-green-700 dark:text-green-300">
                  15 trades in the last hour • $24,680 volume today
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 bg-green-500 rounded-full animate-pulse"></div>
              <span className="text-sm font-medium text-green-700 dark:text-green-300">Live Updates</span>
            </div>
          </div>
        </div>

        {/* Main Content with Activity Feed */}
        <div className="grid lg:grid-cols-4 gap-8">
          {/* Rights Grid - Takes 3 columns */}
          <div className="lg:col-span-3">
            {/* Results */}
            {isLoading ? (
              <div className="grid md:grid-cols-2 lg:grid-cols-2 xl:grid-cols-3 gap-6">
                {Array.from({ length: 9 }).map((_, i) => (
                  <Card key={i} className="p-6">
                    <div className="animate-pulse">
                      <div className="h-4 bg-muted rounded w-3/4 mb-4"></div>
                      <div className="h-3 bg-muted rounded w-full mb-2"></div>
                      <div className="h-3 bg-muted rounded w-2/3 mb-4"></div>
                      <div className="h-8 bg-muted rounded w-1/2"></div>
                    </div>
                  </Card>
                ))}
              </div>
            ) : (
              <>
                <div className="flex justify-between items-center mb-6">
                  <p className="text-muted-foreground">
                    {sortedRights?.length || 0} rights found
                  </p>
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Zap className="w-4 h-4" />
                    <span>Updated in real-time</span>
                  </div>
                </div>
                
                {sortedRights && sortedRights.length > 0 ? (
                  <AnimatedRightGrid rights={sortedRights} variant="grid" />
                ) : (
                  <Card className="text-center py-12">
                    <CardContent>
                      <p className="text-muted-foreground">No rights found matching your criteria</p>
                    </CardContent>
                  </Card>
                )}
              </>
            )}
          </div>

          {/* Activity Feed Sidebar - Takes 1 column */}
          <div className="lg:col-span-1">
            <div className="sticky top-24">
              <ActivityFeed />
              
              {/* Market Stats */}
              <Card className="mt-6">
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
