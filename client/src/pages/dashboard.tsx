import { useQuery } from "@tanstack/react-query";
import { useLocation } from "wouter";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Separator } from "@/components/ui/separator";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { PlusCircle, Wallet, TrendingUp, Users, BarChart3, Settings, Copy, ExternalLink } from "lucide-react";
import { useWallet } from "@/contexts/WalletContext";
import { useToast } from "@/hooks/use-toast";

interface DashboardData {
  user: {
    id: number;
    username: string;
    displayName?: string;
    walletAddress: string;
    hederaAccountId?: string;
    profileImageUrl?: string;
    bio?: string;
    totalEarnings: string;
    totalSales: number;
    isVerified: boolean;
    createdAt: string;
  };
  createdRights: any[];
  ownedRights: any[];
  stats: {
    totalCreated: number;
    totalOwned: number;
    totalEarnings: string;
    totalSales: number;
  };
}

export default function Dashboard() {
  const [, setLocation] = useLocation();
  const { account, isConnected } = useWallet();
  const { toast } = useToast();

  // Extract user ID from account or redirect if not connected
  const userId = account?.id;

  const { data: dashboardData, isLoading, error } = useQuery<{ data: DashboardData }>({
    queryKey: ['/api/users', userId, 'dashboard'],
    enabled: !!userId && isConnected,
  });

  const copyToClipboard = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    toast({
      title: "Copied!",
      description: `${label} copied to clipboard`,
    });
  };

  if (!isConnected || !account) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900 flex items-center justify-center">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <CardTitle className="flex items-center justify-center gap-2">
              <Wallet className="h-6 w-6" />
              Connect Your Wallet
            </CardTitle>
            <CardDescription>
              Please connect your wallet to access your dashboard
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button onClick={() => setLocation('/')} className="w-full">
              Connect Wallet
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600 dark:text-gray-400">Loading your dashboard...</p>
        </div>
      </div>
    );
  }

  if (error || !dashboardData?.data) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900 flex items-center justify-center">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <CardTitle className="text-red-600">Error Loading Dashboard</CardTitle>
            <CardDescription>
              Unable to load your dashboard data. Please try again.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button onClick={() => window.location.reload()} className="w-full">
              Retry
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  const { user, createdRights, ownedRights, stats } = dashboardData.data as DashboardData;

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-6">
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Dashboard</h1>
            <Button onClick={() => setLocation('/create-right')} className="flex items-center gap-2">
              <PlusCircle className="h-4 w-4" />
              Create Rights NFT
            </Button>
          </div>

          {/* User Profile Card */}
          <Card className="mb-8">
            <CardContent className="pt-6">
              <div className="flex items-start gap-6">
                <Avatar className="h-20 w-20">
                  <AvatarImage src={user.profileImageUrl} />
                  <AvatarFallback className="text-lg">
                    {user.displayName?.[0] || user.username[0] || 'U'}
                  </AvatarFallback>
                </Avatar>
                
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2">
                    <h2 className="text-2xl font-semibold text-gray-900 dark:text-white">
                      {user.displayName || user.username}
                    </h2>
                    {user.isVerified && (
                      <Badge className="bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200">
                        Verified
                      </Badge>
                    )}
                  </div>
                  
                  <div className="space-y-2 mb-4">
                    <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
                      <Wallet className="h-4 w-4" />
                      <span className="font-mono">{user.walletAddress}</span>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => copyToClipboard(user.walletAddress, 'Wallet address')}
                      >
                        <Copy className="h-3 w-3" />
                      </Button>
                    </div>
                    
                    {user.hederaAccountId && (
                      <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
                        <span>Hedera Account: {user.hederaAccountId}</span>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => copyToClipboard(user.hederaAccountId!, 'Hedera Account ID')}
                        >
                          <Copy className="h-3 w-3" />
                        </Button>
                      </div>
                    )}
                  </div>
                  
                  {user.bio && (
                    <p className="text-gray-600 dark:text-gray-400 mb-4">{user.bio}</p>
                  )}
                  
                  <div className="flex gap-4">
                    <Button variant="outline" size="sm">
                      <Settings className="h-4 w-4 mr-2" />
                      Edit Profile
                    </Button>
                    <Button variant="outline" size="sm" onClick={() => setLocation('/marketplace')}>
                      <ExternalLink className="h-4 w-4 mr-2" />
                      View Marketplace
                    </Button>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Rights Created</CardTitle>
              <PlusCircle className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.totalCreated}</div>
              <p className="text-xs text-muted-foreground">NFTs you've minted</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Rights Owned</CardTitle>
              <Wallet className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.totalOwned}</div>
              <p className="text-xs text-muted-foreground">NFTs in your wallet</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Sales</CardTitle>
              <TrendingUp className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.totalSales}</div>
              <p className="text-xs text-muted-foreground">Successful transactions</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Earnings</CardTitle>
              <BarChart3 className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{parseFloat(stats.totalEarnings).toFixed(2)} HBAR</div>
              <p className="text-xs text-muted-foreground">From sales and royalties</p>
            </CardContent>
          </Card>
        </div>

        {/* Tabs for Rights Management */}
        <Tabs defaultValue="created" className="space-y-6">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="created">Rights I Created</TabsTrigger>
            <TabsTrigger value="owned">Rights I Own</TabsTrigger>
          </TabsList>
          
          <TabsContent value="created">
            <Card>
              <CardHeader>
                <CardTitle>Your Created Rights</CardTitle>
                <CardDescription>
                  NFTs you've minted representing your intellectual property
                </CardDescription>
              </CardHeader>
              <CardContent>
                {createdRights.length === 0 ? (
                  <div className="text-center py-12">
                    <PlusCircle className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                    <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
                      No rights created yet
                    </h3>
                    <p className="text-gray-600 dark:text-gray-400 mb-4">
                      Start by creating your first rights NFT to tokenize your intellectual property
                    </p>
                    <Button onClick={() => setLocation('/create-right')}>
                      Create Your First NFT
                    </Button>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {/* Rights grid will be populated when API returns data */}
                    <p className="text-gray-600 dark:text-gray-400">
                      Rights grid coming soon...
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
          
          <TabsContent value="owned">
            <Card>
              <CardHeader>
                <CardTitle>Rights You Own</CardTitle>
                <CardDescription>
                  NFTs you've purchased or received
                </CardDescription>
              </CardHeader>
              <CardContent>
                {ownedRights.length === 0 ? (
                  <div className="text-center py-12">
                    <Wallet className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                    <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
                      No owned rights yet
                    </h3>
                    <p className="text-gray-600 dark:text-gray-400 mb-4">
                      Explore the marketplace to discover and purchase rights NFTs
                    </p>
                    <Button onClick={() => setLocation('/marketplace')}>
                      Browse Marketplace
                    </Button>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {/* Rights grid will be populated when API returns data */}
                    <p className="text-gray-600 dark:text-gray-400">
                      Owned rights grid coming soon...
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}