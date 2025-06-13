import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { RightCard } from "@/components/right-card";
import { WalletButton } from "@/components/wallet-button";
import { ActivityFeed } from "@/components/activity-feed";
import { ArrowLeft, Filter, TrendingUp, Zap } from "lucide-react";
import type { RightWithCreator } from "@shared/schema";

export default function Marketplace() {
  const [typeFilter, setTypeFilter] = useState<string>("all");
  const [sortBy, setSortBy] = useState<string>("newest");

  const { data: rights, isLoading, error } = useQuery<RightWithCreator[]>({
    queryKey: ["/api/rights", { 
      limit: 50, 
      isListed: true,
      type: typeFilter === "all" ? undefined : typeFilter 
    }],
  });

  const sortedRights = rights?.sort((a, b) => {
    switch (sortBy) {
      case "price-high":
        return parseFloat(b.price || "0") - parseFloat(a.price || "0");
      case "price-low":
        return parseFloat(a.price || "0") - parseFloat(b.price || "0");
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
    <div className="min-h-screen bg-background animate-fade-in">
      {/* Header */}
      <header className="bg-background shadow-sm border-b border-border sticky top-0 z-40 animate-slide-in-down">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center space-x-4 animate-slide-in-left">
              <Link href="/">
                <Button variant="ghost" size="sm" className="transition-all duration-300 hover:scale-105 hover:shadow-lg group">
                  <ArrowLeft className="w-4 h-4 mr-2 transition-transform duration-200 group-hover:-translate-x-1" />
                  Back
                </Button>
              </Link>
              <h1 className="text-xl font-bold text-primary transition-all duration-300 hover:scale-105">
                D<span className="text-accent">right</span>
              </h1>
            </div>
            
            <div className="animate-slide-in-right">
              <WalletButton />
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Page Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-foreground mb-2">Rights Marketplace</h1>
          <p className="text-muted-foreground">
            Browse and purchase tokenized rights - from music and media to patents and real estate
          </p>
          
          {/* Legal Disclaimer */}
          <div className="mt-4 p-3 bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-800 rounded-lg">
            <p className="text-sm text-amber-800 dark:text-amber-200">
              <strong>Legal Notice:</strong> This platform facilitates legal ownership transfer, not securities trading.
            </p>
          </div>
        </div>

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
                  <div className="grid md:grid-cols-2 lg:grid-cols-2 xl:grid-cols-3 gap-6">
                    {sortedRights.map((right, index) => (
                      <div 
                        key={right.id} 
                        className="animate-fade-in-up"
                        style={{ animationDelay: `${index * 100}ms` }}
                      >
                        <RightCard right={right} />
                      </div>
                    ))}
                  </div>
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
