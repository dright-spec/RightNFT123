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
import { Web3ModalWallet } from "@/components/web3modal-wallet";
import { ActivityFeed } from "@/components/activity-feed";
import OnboardingTooltip, { marketplaceOnboardingSteps } from "@/components/onboarding-tooltip";
import WelcomeModal from "@/components/welcome-modal";
import { useOnboarding } from "@/hooks/use-onboarding";
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
  TrendingDown,
  Star,
  BarChart3
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

  // Onboarding state
  const {
    state: onboardingState,
    startMarketplaceOnboarding,
    nextStep,
    prevStep,
    skipOnboarding,
    completeMarketplaceOnboarding,
    shouldShowWelcome,
    markWelcomeSeen
  } = useOnboarding();

  // Auto-start welcome for new users
  useEffect(() => {
    if (shouldShowWelcome()) {
      // Small delay to ensure page is loaded
      const timer = setTimeout(() => {
        markWelcomeSeen();
      }, 1000);
      return () => clearTimeout(timer);
    }
  }, [shouldShowWelcome, markWelcomeSeen]);

  const { data: allRights, isLoading, error } = useQuery<RightWithCreator[]>({
    queryKey: ["/api/rights", { 
      limit: 100, 
      isListed: true,
      search: searchQuery || undefined,
      type: typeFilter === "all" ? undefined : typeFilter 
    }],
  });

  // Advanced filtering logic based on business model
  const filteredRights = allRights?.filter(right => {
    // Investment value range filter
    const price = parseFloat(right.price || "0");
    if (price < priceRange[0] || price > priceRange[1]) return false;
    
    // Listing type filter for investment opportunities
    if (listingType !== "all") {
      if (listingType === "auction" && right.listingType !== "auction") return false;
      if (listingType === "fixed" && right.listingType !== "fixed") return false;
      if (listingType === "ending-soon" && right.listingType === "auction") {
        const endTime = new Date(right.auctionEndTime || 0);
        const now = new Date();
        const hoursLeft = (endTime.getTime() - now.getTime()) / (1000 * 60 * 60);
        if (hoursLeft > 24) return false;
      }
      if (listingType === "high-yield" && !right.paysDividends) return false;
    }
    
    return true;
  });

  // Business-focused sorting for investment decisions
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
      case "yield-potential":
        // Sort by dividend-paying rights first, then by price
        if (a.paysDividends && !b.paysDividends) return -1;
        if (!a.paysDividends && b.paysDividends) return 1;
        return parseFloat(b.price || "0") - parseFloat(a.price || "0");
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
              <h1 className="text-xl font-semibold text-foreground">Investment Marketplace</h1>
            </div>
            
            <div className="flex items-center space-x-4">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  placeholder="Search rights, creators, categories..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10 w-80"
                />
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={startMarketplaceOnboarding}
                className="flex items-center gap-2"
              >
                <span className="text-lg">🤓</span>
                Help Tour
              </Button>
              <Web3ModalWallet />
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
              Live Auctions
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

          {/* Investment-Focused Filters Bar */}
          <div className="flex items-center justify-between mb-6 p-4 bg-card rounded-lg border">
            <div className="flex items-center gap-4">
              <Button
                variant={showFilters ? "default" : "outline"}
                size="sm"
                onClick={() => setShowFilters(!showFilters)}
                className="flex items-center gap-2"
              >
                <Filter className="w-4 h-4" />
                Investment Filters
              </Button>
              
              {/* Business Model Quick Filters */}
              <div className="flex items-center gap-2">
                <Badge 
                  variant={listingType === "all" ? "default" : "secondary"}
                  className="cursor-pointer hover:bg-primary/90"
                  onClick={() => setListingType("all")}
                >
                  All Opportunities
                </Badge>
                <Badge 
                  variant={listingType === "auction" ? "default" : "secondary"}
                  className="cursor-pointer hover:bg-primary/90"
                  onClick={() => setListingType("auction")}
                >
                  <Timer className="w-3 h-3 mr-1" />
                  Auctions
                </Badge>
                <Badge 
                  variant={listingType === "fixed" ? "default" : "secondary"}
                  className="cursor-pointer hover:bg-primary/90"
                  onClick={() => setListingType("fixed")}
                >
                  <DollarSign className="w-3 h-3 mr-1" />
                  Fixed Price
                </Badge>
                <Badge 
                  variant={listingType === "high-yield" ? "default" : "secondary"}
                  className="cursor-pointer hover:bg-primary/90"
                  onClick={() => setListingType("high-yield")}
                >
                  <BarChart3 className="w-3 h-3 mr-1" />
                  High Yield
                </Badge>
                <Badge 
                  variant={listingType === "ending-soon" ? "default" : "secondary"}
                  className="cursor-pointer hover:bg-primary/90"
                  onClick={() => setListingType("ending-soon")}
                >
                  <Clock className="w-3 h-3 mr-1" />
                  Ending Soon
                </Badge>
              </div>
            </div>

            <div className="flex items-center gap-4">
              <span className="text-sm text-muted-foreground">
                {sortedRights?.length || 0} investment opportunities
              </span>
              
              <Select value={sortBy} onValueChange={setSortBy}>
                <SelectTrigger className="w-56">
                  <SelectValue placeholder="Sort by" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="newest">Recently Listed</SelectItem>
                  <SelectItem value="yield-potential">Highest Yield Potential</SelectItem>
                  <SelectItem value="price-high">Highest Value</SelectItem>
                  <SelectItem value="price-low">Best Entry Price</SelectItem>
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

          {/* Advanced Investment Filters Panel */}
          {showFilters && (
            <Card className="mb-6">
              <CardContent className="p-6">
                <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                  {/* Investment Budget Range */}
                  <div>
                    <label className="text-sm font-medium mb-3 block">Investment Budget (ETH)</label>
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
                      <p className="text-xs text-muted-foreground">
                        Set your investment range to find suitable opportunities
                      </p>
                    </div>
                  </div>

                  {/* Revenue Model */}
                  <div>
                    <label className="text-sm font-medium mb-3 block">Revenue Potential</label>
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
                      <div className="flex items-center space-x-2">
                        <Checkbox id="resale" />
                        <label htmlFor="resale" className="text-sm">Resale Rights</label>
                      </div>
                    </div>
                  </div>

                  {/* Asset Category */}
                  <div>
                    <label className="text-sm font-medium mb-3 block">Investment Category</label>
                    <Select value={typeFilter} onValueChange={setTypeFilter}>
                      <SelectTrigger>
                        <SelectValue placeholder="All Categories" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All Investment Types</SelectItem>
                        <SelectItem value="copyright">Creative Rights (Copyright)</SelectItem>
                        <SelectItem value="royalty">Revenue Streams (Royalty)</SelectItem>
                        <SelectItem value="access">Exclusive Access Rights</SelectItem>
                        <SelectItem value="ownership">Ownership Stakes</SelectItem>
                        <SelectItem value="license">Licensing Opportunities</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  {/* Risk & Quality Indicators */}
                  <div>
                    <label className="text-sm font-medium mb-3 block">Risk Profile</label>
                    <div className="space-y-2">
                      <div className="flex items-center space-x-2">
                        <Checkbox id="verified" />
                        <label htmlFor="verified" className="text-sm">Verified Assets Only</label>
                      </div>
                      <div className="flex items-center space-x-2">
                        <Checkbox id="established" />
                        <label htmlFor="established" className="text-sm">Established Creators</label>
                      </div>
                      <div className="flex items-center space-x-2">
                        <Checkbox id="liquid" />
                        <label htmlFor="liquid" className="text-sm">High Liquidity</label>
                      </div>
                      <div className="flex items-center space-x-2">
                        <Checkbox id="performing" />
                        <label htmlFor="performing" className="text-sm">Proven Performance</label>
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Tab Content */}
          <TabsContent value="explore" className="space-y-6">
            {/* Modern Investment Hero Banner */}
            <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-indigo-900 via-purple-900 to-pink-800 text-white shadow-2xl">
              <div className="absolute inset-0 bg-gradient-to-r from-black/20 to-transparent"></div>
              <div className="relative px-8 py-12">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-6">
                    <div className="w-16 h-16 bg-white/10 backdrop-blur-sm rounded-2xl flex items-center justify-center border border-white/20">
                      <TrendingUp className="w-8 h-8 text-white" />
                    </div>
                    <div>
                      <h2 className="text-3xl font-bold mb-2">Rights Investment Marketplace</h2>
                      <p className="text-lg text-white/90 max-w-2xl">
                        Transform creative assets into liquid investments with blockchain-guaranteed ownership and automated revenue distribution
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-8">
                    <div className="text-center">
                      <div className="text-4xl font-bold">{sortedRights?.length || 0}</div>
                      <div className="text-white/80">Available Rights</div>
                    </div>
                    <div className="text-center">
                      <div className="text-4xl font-bold text-emerald-300">847.3 ETH</div>
                      <div className="text-white/80">Total Volume</div>
                    </div>
                    <div className="text-center">
                      <div className="text-4xl font-bold text-green-300">+24.7%</div>
                      <div className="text-white/80">Avg. ROI</div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Market Insights Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
              <Card className="bg-gradient-to-br from-emerald-50 to-teal-50 dark:from-emerald-950/20 dark:to-teal-950/20 border-emerald-200 dark:border-emerald-800">
                <CardContent className="p-6">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 bg-emerald-100 dark:bg-emerald-900/30 rounded-xl flex items-center justify-center">
                      <TrendingUp className="w-6 h-6 text-emerald-600" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-emerald-900 dark:text-emerald-100">High Yield Assets</h3>
                      <p className="text-sm text-emerald-700 dark:text-emerald-300">Rights paying 15%+ returns</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
              
              <Card className="bg-gradient-to-br from-orange-50 to-red-50 dark:from-orange-950/20 dark:to-red-950/20 border-orange-200 dark:border-orange-800">
                <CardContent className="p-6">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 bg-orange-100 dark:bg-orange-900/30 rounded-xl flex items-center justify-center">
                      <Timer className="w-6 h-6 text-orange-600" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-orange-900 dark:text-orange-100">Ending Soon</h3>
                      <p className="text-sm text-orange-700 dark:text-orange-300">3 auctions end today</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
              
              <Card className="bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-blue-950/20 dark:to-indigo-950/20 border-blue-200 dark:border-blue-800">
                <CardContent className="p-6">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 bg-blue-100 dark:bg-blue-900/30 rounded-xl flex items-center justify-center">
                      <Star className="w-6 h-6 text-blue-600" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-blue-900 dark:text-blue-100">Featured Rights</h3>
                      <p className="text-sm text-blue-700 dark:text-blue-300">Curated top performers</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Rights Grid/List Display */}
            {isLoading ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                {Array.from({ length: 8 }).map((_, i) => (
                  <Card key={i} className="animate-pulse overflow-hidden">
                    <div className="h-48 bg-muted"></div>
                    <CardContent className="p-6">
                      <div className="h-4 bg-muted rounded w-3/4 mb-3"></div>
                      <div className="h-3 bg-muted rounded w-full mb-2"></div>
                      <div className="h-3 bg-muted rounded w-2/3 mb-4"></div>
                      <div className="flex justify-between items-center">
                        <div className="h-6 bg-muted rounded w-16"></div>
                        <div className="h-8 bg-muted rounded w-20"></div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            ) : sortedRights && sortedRights.length > 0 ? (
              <div className="space-y-6">
                <div className="flex items-center justify-between">
                  <h3 className="text-xl font-semibold">Investment Opportunities</h3>
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                    <span>Live market data</span>
                  </div>
                </div>
                <AnimatedRightGrid rights={sortedRights} variant="grid" />
              </div>
            ) : (
              <div className="text-center py-16">
                <div className="w-24 h-24 bg-gradient-to-br from-muted to-muted/50 rounded-2xl flex items-center justify-center mx-auto mb-6">
                  <Search className="w-12 h-12 text-muted-foreground" />
                </div>
                <h3 className="text-2xl font-semibold mb-3">No investment opportunities found</h3>
                <p className="text-muted-foreground mb-6 max-w-md mx-auto">
                  Try adjusting your investment criteria or explore different asset categories to find suitable opportunities.
                </p>
                <Button 
                  onClick={() => {
                    setSearchQuery("");
                    setTypeFilter("all");
                    setListingType("all");
                    setPriceRange([0, 1000]);
                  }}
                  className="bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white px-8 py-3"
                >
                  Reset Investment Filters
                </Button>
              </div>
            )}
          </TabsContent>

          {/* Live Auctions Tab */}
          <TabsContent value="auctions" className="space-y-6">
            {/* Auction Hero */}
            <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-orange-600 via-red-600 to-pink-600 text-white shadow-2xl">
              <div className="absolute inset-0 bg-gradient-to-r from-black/20 to-transparent"></div>
              <div className="relative px-8 py-12">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-6">
                    <div className="w-16 h-16 bg-white/10 backdrop-blur-sm rounded-2xl flex items-center justify-center border border-white/20">
                      <Gavel className="w-8 h-8 text-white" />
                    </div>
                    <div>
                      <h2 className="text-3xl font-bold mb-2">Live Auction Opportunities</h2>
                      <p className="text-lg text-white/90 max-w-2xl">
                        Time-sensitive bidding for premium rights with reserve prices and automatic settlement
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-8">
                    <div className="text-center">
                      <div className="text-4xl font-bold">3</div>
                      <div className="text-white/80">Active Auctions</div>
                    </div>
                    <div className="text-center">
                      <div className="text-4xl font-bold text-yellow-300">2h 15m</div>
                      <div className="text-white/80">Next Ending</div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Auction Features */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <Card className="bg-gradient-to-br from-orange-50 to-amber-50 dark:from-orange-950/20 dark:to-amber-950/20 border-orange-200 dark:border-orange-800">
                <CardContent className="p-6">
                  <div className="flex items-center gap-4 mb-4">
                    <div className="w-12 h-12 bg-orange-100 dark:bg-orange-900/30 rounded-xl flex items-center justify-center">
                      <Clock className="w-6 h-6 text-orange-600" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-orange-900 dark:text-orange-100">Time-Based Bidding</h3>
                      <p className="text-sm text-orange-700 dark:text-orange-300">Competitive auctions with countdown timers</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
              
              <Card className="bg-gradient-to-br from-purple-50 to-pink-50 dark:from-purple-950/20 dark:to-pink-950/20 border-purple-200 dark:border-purple-800">
                <CardContent className="p-6">
                  <div className="flex items-center gap-4 mb-4">
                    <div className="w-12 h-12 bg-purple-100 dark:bg-purple-900/30 rounded-xl flex items-center justify-center">
                      <DollarSign className="w-6 h-6 text-purple-600" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-purple-900 dark:text-purple-100">Reserve Prices</h3>
                      <p className="text-sm text-purple-700 dark:text-purple-300">Protected minimum values for sellers</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Coming Soon Message */}
            <Card className="border-2 border-dashed border-muted-foreground/20">
              <CardContent className="p-12 text-center">
                <div className="w-24 h-24 bg-gradient-to-br from-orange-100 to-red-100 dark:from-orange-900/20 dark:to-red-900/20 rounded-2xl flex items-center justify-center mx-auto mb-6">
                  <Gavel className="w-12 h-12 text-orange-600" />
                </div>
                <h3 className="text-2xl font-semibold mb-3">Auctions Coming Soon</h3>
                <p className="text-muted-foreground max-w-md mx-auto mb-6">
                  Live auction functionality is being finalized. Get ready to bid on premium rights with automatic settlement and reserve price protection.
                </p>
                <Badge className="bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200 px-4 py-2">
                  OpenSea-style mechanics • Reserve prices • Automatic settlement
                </Badge>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Fixed Price Tab */}
          <TabsContent value="fixed-price" className="space-y-6">
            {/* Fixed Price Hero */}
            <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-emerald-600 via-teal-600 to-cyan-600 text-white shadow-2xl">
              <div className="absolute inset-0 bg-gradient-to-r from-black/20 to-transparent"></div>
              <div className="relative px-8 py-12">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-6">
                    <div className="w-16 h-16 bg-white/10 backdrop-blur-sm rounded-2xl flex items-center justify-center border border-white/20">
                      <ShoppingCart className="w-8 h-8 text-white" />
                    </div>
                    <div>
                      <h2 className="text-3xl font-bold mb-2">Fixed Price Investments</h2>
                      <p className="text-lg text-white/90 max-w-2xl">
                        Instant ownership without bidding competition at guaranteed prices
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-8">
                    <div className="text-center">
                      <div className="text-4xl font-bold">{sortedRights?.filter(r => r.listingType === 'fixed').length || 0}</div>
                      <div className="text-white/80">Available Now</div>
                    </div>
                    <div className="text-center">
                      <div className="text-4xl font-bold text-cyan-300">0.05 ETH</div>
                      <div className="text-white/80">Starting From</div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Fixed Price Benefits */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <Card className="bg-gradient-to-br from-green-50 to-emerald-50 dark:from-green-950/20 dark:to-emerald-950/20 border-green-200 dark:border-green-800">
                <CardContent className="p-6">
                  <div className="flex items-center gap-4 mb-4">
                    <div className="w-12 h-12 bg-green-100 dark:bg-green-900/30 rounded-xl flex items-center justify-center">
                      <Zap className="w-6 h-6 text-green-600" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-green-900 dark:text-green-100">Instant Purchase</h3>
                      <p className="text-sm text-green-700 dark:text-green-300">Buy immediately without waiting</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
              
              <Card className="bg-gradient-to-br from-blue-50 to-cyan-50 dark:from-blue-950/20 dark:to-cyan-950/20 border-blue-200 dark:border-blue-800">
                <CardContent className="p-6">
                  <div className="flex items-center gap-4 mb-4">
                    <div className="w-12 h-12 bg-blue-100 dark:bg-blue-900/30 rounded-xl flex items-center justify-center">
                      <DollarSign className="w-6 h-6 text-blue-600" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-blue-900 dark:text-blue-100">Guaranteed Price</h3>
                      <p className="text-sm text-blue-700 dark:text-blue-300">No bidding wars or surprises</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
              
              <Card className="bg-gradient-to-br from-teal-50 to-cyan-50 dark:from-teal-950/20 dark:to-cyan-950/20 border-teal-200 dark:border-teal-800">
                <CardContent className="p-6">
                  <div className="flex items-center gap-4 mb-4">
                    <div className="w-12 h-12 bg-teal-100 dark:bg-teal-900/30 rounded-xl flex items-center justify-center">
                      <Star className="w-6 h-6 text-teal-600" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-teal-900 dark:text-teal-100">Quality Assets</h3>
                      <p className="text-sm text-teal-700 dark:text-teal-300">Verified and premium rights</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Fixed Price Rights Display */}
            {sortedRights && sortedRights.filter(r => r.listingType === 'fixed').length > 0 ? (
              <div className="space-y-6">
                <div className="flex items-center justify-between">
                  <h3 className="text-xl font-semibold">Available for Immediate Purchase</h3>
                  <Badge className="bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200">
                    {sortedRights.filter(r => r.listingType === 'fixed').length} rights available
                  </Badge>
                </div>
                <AnimatedRightGrid rights={sortedRights.filter(r => r.listingType === 'fixed')} variant="grid" />
              </div>
            ) : (
              <Card className="border-2 border-dashed border-muted-foreground/20">
                <CardContent className="p-12 text-center">
                  <div className="w-24 h-24 bg-gradient-to-br from-green-100 to-emerald-100 dark:from-green-900/20 dark:to-emerald-900/20 rounded-2xl flex items-center justify-center mx-auto mb-6">
                    <ShoppingCart className="w-12 h-12 text-green-600" />
                  </div>
                  <h3 className="text-2xl font-semibold mb-3">No Fixed Price Rights Available</h3>
                  <p className="text-muted-foreground max-w-md mx-auto mb-6">
                    All current rights are listed for auction. Check back soon for instant purchase opportunities or explore the auction section.
                  </p>
                  <Button className="bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 text-white">
                    Browse Auctions Instead
                  </Button>
                </CardContent>
              </Card>
            )}
          </TabsContent>

          {/* Activity Tab */}
          <TabsContent value="activity" className="space-y-6">
            {/* Activity Hero */}
            <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-violet-600 via-blue-600 to-indigo-600 text-white shadow-2xl">
              <div className="absolute inset-0 bg-gradient-to-r from-black/20 to-transparent"></div>
              <div className="relative px-8 py-12">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-6">
                    <div className="w-16 h-16 bg-white/10 backdrop-blur-sm rounded-2xl flex items-center justify-center border border-white/20">
                      <Zap className="w-8 h-8 text-white" />
                    </div>
                    <div>
                      <h2 className="text-3xl font-bold mb-2">Market Activity & Analytics</h2>
                      <p className="text-lg text-white/90 max-w-2xl">
                        Real-time trading data and investment performance metrics
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-8">
                    <div className="text-center">
                      <div className="text-4xl font-bold">24</div>
                      <div className="text-white/80">Trades Today</div>
                    </div>
                    <div className="text-center">
                      <div className="text-4xl font-bold text-green-300">47.2 ETH</div>
                      <div className="text-white/80">24h Volume</div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Market Activity Feed */}
              <div className="lg:col-span-2">
                <Card className="h-fit">
                  <CardHeader className="flex flex-row items-center justify-between">
                    <CardTitle className="flex items-center gap-2">
                      <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                      Live Market Activity
                    </CardTitle>
                    <Badge className="bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200">
                      Real-time updates
                    </Badge>
                  </CardHeader>
                  <CardContent>
                    <ActivityFeed />
                  </CardContent>
                </Card>
              </div>
              
              {/* Investment Statistics Sidebar */}
              <div className="space-y-6">
                {/* Key Metrics */}
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <BarChart3 className="w-5 h-5" />
                      Investment Metrics
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="flex justify-between items-center p-3 bg-green-50 dark:bg-green-950/20 rounded-lg">
                      <span className="text-sm font-medium">Total Market Volume</span>
                      <span className="font-bold text-green-600 text-lg">847.3 ETH</span>
                    </div>
                    <div className="flex justify-between items-center p-3 bg-emerald-50 dark:bg-emerald-950/20 rounded-lg">
                      <span className="text-sm font-medium">Average ROI</span>
                      <span className="font-bold text-emerald-600 text-lg">+24.7%</span>
                    </div>
                    <div className="flex justify-between items-center p-3 bg-slate-50 dark:bg-slate-950/20 rounded-lg">
                      <span className="text-sm font-medium">Floor Price</span>
                      <span className="font-medium text-lg">0.05 ETH</span>
                    </div>
                    <div className="flex justify-between items-center p-3 bg-blue-50 dark:bg-blue-950/20 rounded-lg">
                      <span className="text-sm font-medium">Listed Opportunities</span>
                      <span className="font-medium text-lg">{sortedRights?.length || 0}</span>
                    </div>
                    <div className="flex justify-between items-center p-3 bg-orange-50 dark:bg-orange-950/20 rounded-lg">
                      <span className="text-sm font-medium">24h Volume</span>
                      <span className="font-medium text-lg">47.2 ETH</span>
                    </div>
                  </CardContent>
                </Card>

                {/* Performance Indicators */}
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <TrendingUp className="w-5 h-5" />
                      Performance
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="space-y-2">
                      <div className="flex justify-between text-sm">
                        <span>Market Growth</span>
                        <span className="text-green-600 font-medium">+12.3%</span>
                      </div>
                      <div className="w-full bg-muted rounded-full h-2">
                        <div className="bg-green-600 h-2 rounded-full" style={{width: '73%'}}></div>
                      </div>
                    </div>
                    
                    <div className="space-y-2">
                      <div className="flex justify-between text-sm">
                        <span>Liquidity Index</span>
                        <span className="text-blue-600 font-medium">High</span>
                      </div>
                      <div className="w-full bg-muted rounded-full h-2">
                        <div className="bg-blue-600 h-2 rounded-full" style={{width: '89%'}}></div>
                      </div>
                    </div>
                    
                    <div className="space-y-2">
                      <div className="flex justify-between text-sm">
                        <span>Trading Activity</span>
                        <span className="text-purple-600 font-medium">Very Active</span>
                      </div>
                      <div className="w-full bg-muted rounded-full h-2">
                        <div className="bg-purple-600 h-2 rounded-full" style={{width: '94%'}}></div>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* Quick Actions */}
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Star className="w-5 h-5" />
                      Quick Actions
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <Button className="w-full bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 text-white">
                      View Top Performers
                    </Button>
                    <Button variant="outline" className="w-full">
                      Set Price Alerts
                    </Button>
                    <Button variant="outline" className="w-full">
                      Export Activity Report
                    </Button>
                  </CardContent>
                </Card>
              </div>
            </div>
          </TabsContent>
        </Tabs>
      </div>

      {/* Onboarding Components */}
      <WelcomeModal
        isOpen={shouldShowWelcome()}
        onClose={markWelcomeSeen}
        onStartTour={startMarketplaceOnboarding}
      />

      <OnboardingTooltip
        steps={marketplaceOnboardingSteps}
        currentStep={onboardingState.currentStep}
        onNext={nextStep}
        onPrev={prevStep}
        onSkip={skipOnboarding}
        onComplete={completeMarketplaceOnboarding}
        visible={onboardingState.isActive}
      />
    </div>
  );
}