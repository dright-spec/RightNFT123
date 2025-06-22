import { useState } from "react";
import { Link } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Progress } from "@/components/ui/progress";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { CreateRightModal } from "@/components/create-right-modal";
import { WalletButton } from "@/components/wallet-button";
import { 
  TrendingUp, 
  DollarSign, 
  Users, 
  Eye, 
  Plus, 
  BarChart3, 
  Clock, 
  CheckCircle, 
  AlertCircle,
  Gavel,
  Heart,
  Download,
  ExternalLink,
  Crown,
  Zap,
  Menu
} from "lucide-react";
import { RightCard } from "@/components/right-card";
import { VerificationBadge } from "@/components/verification-badge";
import type { RightWithCreator, User } from "@shared/schema";

export default function Dashboard() {
  const [showCreateModal, setShowCreateModal] = useState(false);

  // Fetch user's rights
  const { data: userRights = [], isLoading: rightsLoading } = useQuery<RightWithCreator[]>({
    queryKey: ["/api/rights", "user"],
    queryFn: () => fetch("/api/rights?creatorId=1").then(res => res.json()),
  });

  // Fetch user profile
  const { data: userProfile } = useQuery<User>({
    queryKey: ["/api/users", "profile"],
    queryFn: () => fetch("/api/users/1").then(res => res.json()),
  });

  // Calculate dashboard metrics
  const totalRights = userRights.length;
  const activeListings = userRights.filter(right => right.isListed).length;
  const totalViews = userRights.reduce((sum, right) => sum + (right.views || 0), 0);
  const totalRevenue = userRights.reduce((sum, right) => {
    const price = parseFloat(right.price || "0");
    return sum + (right.isListed ? 0 : price); // Sold items contribute to revenue
  }, 0);

  const verifiedRights = userRights.filter(right => right.verificationStatus === "verified").length;
  const pendingRights = userRights.filter(right => right.verificationStatus === "pending").length;

  const dashboardStats = [
    {
      title: "Total Rights",
      value: totalRights.toString(),
      description: "Rights you've created",
      icon: Crown,
      change: "+2 this month",
      changeType: "positive" as const
    },
    {
      title: "Active Listings",
      value: activeListings.toString(),
      description: "Currently for sale",
      icon: Gavel,
      change: `${Math.round((activeListings / totalRights) * 100)}% of portfolio`,
      changeType: "neutral" as const
    },
    {
      title: "Total Views",
      value: totalViews.toLocaleString(),
      description: "Across all rights",
      icon: Eye,
      change: "+12% this week",
      changeType: "positive" as const
    },
    {
      title: "Revenue Generated",
      value: `${totalRevenue.toFixed(2)} ETH`,
      description: "From sales & royalties",
      icon: DollarSign,
      change: "+8.2% this month",
      changeType: "positive" as const
    }
  ];

  const recentActivity = [
    { type: "sale", title: "Copyright sold", description: "Midnight Dreams streaming rights", time: "2 hours ago", amount: "0.5 ETH" },
    { type: "listing", title: "New listing created", description: "Patent License: AI Algorithm", time: "1 day ago", amount: "2.0 ETH" },
    { type: "verification", title: "Right verified", description: "YouTube video ownership confirmed", time: "3 days ago", amount: null },
    { type: "bid", title: "New bid received", description: "Royalty share in indie film", time: "1 week ago", amount: "1.2 ETH" }
  ];

  return (
    <div className="min-h-screen bg-background">
      {/* Header Navigation */}
      <header className="bg-background shadow-sm border-b border-border sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center">
              <Link href="/" className="flex-shrink-0">
                <h1 className="text-xl font-bold text-primary">
                  D<span className="text-accent">right</span>
                </h1>
              </Link>
            </div>
            
            <nav className="hidden md:flex space-x-8">
              <Link href="/" className="text-muted-foreground hover:text-primary transition-colors font-medium">
                Home
              </Link>
              <Link href="/marketplace" className="text-muted-foreground hover:text-primary transition-colors font-medium">
                Marketplace
              </Link>
              <Link href="/marketplace" className="text-muted-foreground hover:text-primary transition-colors font-medium">
                Live Auctions
              </Link>
              <Link href="/dashboard" className="text-primary border-b-2 border-primary font-medium">
                Dashboard
              </Link>
              <Link href="/docs" className="text-muted-foreground hover:text-primary transition-colors font-medium">
                Docs
              </Link>
              <Link href="/about" className="text-muted-foreground hover:text-primary transition-colors font-medium">
                About
              </Link>
            </nav>

            <div className="flex items-center space-x-4">
              <WalletButton />
            </div>
          </div>
        </div>
      </header>

      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800">
        <div className="container mx-auto p-6 space-y-8">
          {/* Header Section */}
          <div className="flex items-center justify-between">
            <div className="space-y-2">
              <h1 className="text-3xl font-bold tracking-tight">Dashboard</h1>
              <p className="text-muted-foreground">
                Manage your digital rights portfolio and track performance
              </p>
            </div>
            <Button className="gap-2" onClick={() => setShowCreateModal(true)}>
              <Plus className="h-4 w-4" />
              Create New Right
            </Button>
          </div>

        {/* User Profile Card */}
        {userProfile && (
          <Card className="border-2 border-blue-200 dark:border-blue-800 bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-950 dark:to-indigo-950">
            <CardContent className="p-6">
              <div className="flex items-center gap-4">
                <Avatar className="h-16 w-16">
                  <AvatarImage src={userProfile.profileImageUrl || ""} />
                  <AvatarFallback className="text-lg">
                    {userProfile.username?.charAt(0).toUpperCase() || "U"}
                  </AvatarFallback>
                </Avatar>
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <h2 className="text-xl font-semibold">{userProfile.username || "Creator"}</h2>
                    <VerificationBadge status="verified" size="sm" />
                  </div>
                  <p className="text-muted-foreground">Digital Rights Creator</p>
                  <div className="flex items-center gap-4 mt-2">
                    <div className="flex items-center gap-1">
                      <Users className="h-4 w-4" />
                      <span className="text-sm">0 followers</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <Heart className="h-4 w-4" />
                      <span className="text-sm">0 favorites</span>
                    </div>
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-2xl font-bold text-blue-600 dark:text-blue-400">
                    {totalRights}
                  </div>
                  <div className="text-sm text-muted-foreground">Rights Created</div>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Stats Grid */}
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
          {dashboardStats.map((stat) => (
            <Card key={stat.title} className="relative overflow-hidden">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">{stat.title}</CardTitle>
                <stat.icon className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stat.value}</div>
                <p className="text-xs text-muted-foreground mb-2">{stat.description}</p>
                <div className={`text-xs flex items-center gap-1 ${
                  stat.changeType === 'positive' ? 'text-green-600' : 'text-gray-600'
                }`}>
                  {stat.changeType === 'positive' && <TrendingUp className="h-3 w-3" />}
                  {stat.change}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Main Content Tabs */}
        <Tabs defaultValue="overview" className="space-y-6">
          <TabsList className="grid w-full grid-cols-5">
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="rights">My Rights</TabsTrigger>
            <TabsTrigger value="listings">Active Sales</TabsTrigger>
            <TabsTrigger value="analytics">Analytics</TabsTrigger>
            <TabsTrigger value="activity">Activity</TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="space-y-6">
            <div className="grid gap-6 lg:grid-cols-2">
              {/* Verification Status */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <CheckCircle className="h-5 w-5" />
                    Verification Status
                  </CardTitle>
                  <CardDescription>
                    Track the verification progress of your rights
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="text-sm">Verified Rights</span>
                    <Badge variant="secondary">{verifiedRights}/{totalRights}</Badge>
                  </div>
                  <Progress value={(verifiedRights / totalRights) * 100} className="h-2" />
                  
                  {pendingRights > 0 && (
                    <div className="flex items-center gap-2 p-3 bg-yellow-50 dark:bg-yellow-950 rounded-lg">
                      <AlertCircle className="h-4 w-4 text-yellow-600" />
                      <span className="text-sm">{pendingRights} rights pending verification</span>
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Quick Actions */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Zap className="h-5 w-5" />
                    Quick Actions
                  </CardTitle>
                  <CardDescription>
                    Common tasks and shortcuts
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-3">
                  <Button variant="outline" className="w-full justify-start gap-2">
                    <Plus className="h-4 w-4" />
                    Create New Right
                  </Button>
                  <Button variant="outline" className="w-full justify-start gap-2">
                    <BarChart3 className="h-4 w-4" />
                    View Analytics
                  </Button>
                  <Button variant="outline" className="w-full justify-start gap-2">
                    <Download className="h-4 w-4" />
                    Export Portfolio
                  </Button>
                  <Button variant="outline" className="w-full justify-start gap-2">
                    <ExternalLink className="h-4 w-4" />
                    Share Profile
                  </Button>
                </CardContent>
              </Card>
            </div>

            {/* Recent Activity */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Clock className="h-5 w-5" />
                  Recent Activity
                </CardTitle>
                <CardDescription>
                  Your latest transactions and updates
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {recentActivity.map((activity, index) => (
                    <div key={index} className="flex items-center gap-4 p-3 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors">
                      <div className={`p-2 rounded-full ${
                        activity.type === 'sale' ? 'bg-green-100 text-green-600 dark:bg-green-900 dark:text-green-400' :
                        activity.type === 'listing' ? 'bg-blue-100 text-blue-600 dark:bg-blue-900 dark:text-blue-400' :
                        activity.type === 'verification' ? 'bg-purple-100 text-purple-600 dark:bg-purple-900 dark:text-purple-400' :
                        'bg-orange-100 text-orange-600 dark:bg-orange-900 dark:text-orange-400'
                      }`}>
                        {activity.type === 'sale' && <DollarSign className="h-4 w-4" />}
                        {activity.type === 'listing' && <Gavel className="h-4 w-4" />}
                        {activity.type === 'verification' && <CheckCircle className="h-4 w-4" />}
                        {activity.type === 'bid' && <TrendingUp className="h-4 w-4" />}
                      </div>
                      <div className="flex-1">
                        <div className="font-medium">
                          {activity.type === 'sale' ? 'Right Sold' :
                           activity.type === 'bid' ? 'Bid Received' :
                           activity.type === 'mint' ? 'NFT Minted' : 'Transaction'}
                        </div>
                        <div className="text-sm text-muted-foreground">
                          {activity.rightTitle || `Transaction #${activity.id}`}
                        </div>
                      </div>
                      <div className="text-right">
                        {activity.amount && (
                          <div className="font-medium text-green-600 dark:text-green-400">
                            {activity.amount} HBAR
                          </div>
                        )}
                        <div className="text-xs text-muted-foreground">
                          {new Date(activity.date).toLocaleDateString()}
                        </div>
                      </div>
                    </div>
                    ))
                  ) : (
                    <div className="text-center py-8 text-muted-foreground">
                      <Clock className="w-12 h-12 mx-auto mb-3 opacity-50" />
                      <p>No recent activity yet</p>
                      <p className="text-sm">Start by creating your first right!</p>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="rights" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>My Rights Portfolio</CardTitle>
                <CardDescription>
                  All the digital rights you've created and own
                </CardDescription>
              </CardHeader>
              <CardContent>
                {rightsLoading ? (
                  <div className="text-center py-8">Loading your rights...</div>
                ) : userRights.length > 0 ? (
                  <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                    {userRights.map((right) => (
                      <RightCard key={right.id} right={right} />
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-12">
                    <Crown className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                    <h3 className="text-lg font-medium mb-2">No rights created yet</h3>
                    <p className="text-muted-foreground mb-4">
                      Start building your portfolio by creating your first digital right
                    </p>
                    <Button onClick={() => setShowCreateModal(true)}>
                      <Plus className="h-4 w-4 mr-2" />
                      Create Your First Right
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="listings" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Active Listings</CardTitle>
                <CardDescription>
                  Rights currently available for sale or auction
                </CardDescription>
              </CardHeader>
              <CardContent>
                {userRights.filter(right => right.isListed).length > 0 ? (
                  <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                    {userRights.filter(right => right.isListed).map((right) => (
                      <RightCard key={right.id} right={right} />
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-12">
                    <Gavel className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                    <h3 className="text-lg font-medium mb-2">No active listings</h3>
                    <p className="text-muted-foreground mb-4">
                      List your rights for sale to start earning revenue
                    </p>
                    <Button variant="outline">Browse Your Rights</Button>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="analytics" className="space-y-6">
            <div className="grid gap-6 lg:grid-cols-2">
              <Card>
                <CardHeader>
                  <CardTitle>Performance Overview</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="flex justify-between">
                      <span>Total Views</span>
                      <span className="font-medium">{totalViews.toLocaleString()}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Conversion Rate</span>
                      <span className="font-medium">2.3%</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Average Sale Price</span>
                      <span className="font-medium">1.2 ETH</span>
                    </div>
                  </div>
                </CardContent>
              </Card>
              
              <Card>
                <CardHeader>
                  <CardTitle>Revenue Trends</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-center py-8 text-muted-foreground">
                    Chart visualization would go here
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="activity" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Activity History</CardTitle>
                <CardDescription>
                  Complete history of your transactions and interactions
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {recentActivity.map((activity, index) => (
                    <div key={index} className="flex items-center gap-4 p-4 border rounded-lg">
                      <div className={`p-2 rounded-full ${
                        activity.type === 'sale' ? 'bg-green-100 text-green-600' :
                        activity.type === 'listing' ? 'bg-blue-100 text-blue-600' :
                        activity.type === 'verification' ? 'bg-purple-100 text-purple-600' :
                        'bg-orange-100 text-orange-600'
                      }`}>
                        {activity.type === 'sale' && <DollarSign className="h-4 w-4" />}
                        {activity.type === 'listing' && <Gavel className="h-4 w-4" />}
                        {activity.type === 'verification' && <CheckCircle className="h-4 w-4" />}
                        {activity.type === 'bid' && <TrendingUp className="h-4 w-4" />}
                      </div>
                      <div className="flex-1">
                        <div className="font-medium">{activity.title}</div>
                        <div className="text-sm text-muted-foreground">{activity.description}</div>
                        <div className="text-xs text-muted-foreground mt-1">{activity.time}</div>
                      </div>
                      {activity.amount && (
                        <div className="font-medium text-green-600">{activity.amount}</div>
                      )}
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

          {/* Create Right Modal */}
          <CreateRightModal 
            open={showCreateModal} 
            onOpenChange={setShowCreateModal} 
          />
        </div>
      </div>
    </div>
  );
}