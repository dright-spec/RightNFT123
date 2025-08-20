import { useQuery } from "@tanstack/react-query";
import { useLocation } from "wouter";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Separator } from "@/components/ui/separator";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { PlusCircle, Wallet, TrendingUp, Users, BarChart3, Settings, Copy, ExternalLink, CheckCircle, Clock, AlertCircle, Coins, Zap } from "lucide-react";
import { useWallet } from "@/contexts/WalletContext";
import { useToast } from "@/hooks/use-toast";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";

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

interface RightCardProps {
  right: {
    id: number;
    title: string;
    type: string;
    verificationStatus: string;
    mintingStatus: string;
    price: string;
    currency: string;
    symbol: string;
    description: string;
    imageUrl?: string;
    createdAt: string;
  };
}

function RightCard({ right }: RightCardProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [, setLocation] = useLocation();

  const mintNFTMutation = useMutation({
    mutationFn: async (rightId: number) => {
      const response = await fetch(`/api/rights/${rightId}/mint`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include'
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to start minting');
      }
      
      const data = await response.json();
      
      // If the minting requires HashPack transaction, handle it here
      if (data.data?.transactionParams) {
        try {
          // Import HashPack wallet integration
          const { HashPackWallet } = await import('@/lib/hashpack-wallet');
          const hashPack = new HashPackWallet();
          
          // Check if HashPack is available
          if (!hashPack.isExtensionAvailable()) {
            throw new Error('HashPack wallet extension not found. Please install HashPack.');
          }
          
          // Show transaction preparation message
          toast({
            title: "Preparing Transaction",
            description: "Opening HashPack to confirm NFT minting (Fee: ~10 HBAR)",
          });
          
          // Prepare Hedera NFT transaction
          const hederaTransaction = {
            type: 'TOKEN_CREATE',
            name: data.data.transactionParams.name,
            symbol: data.data.transactionParams.symbol,
            metadata: JSON.stringify(data.data.metadata),
            initialSupply: 1,
            decimals: 0,
            treasuryAccountId: data.data.transactionParams.treasuryAccountId,
            fee: 1000000000, // 10 HBAR in tinybars
          };
          
          console.log('Sending transaction to HashPack:', hederaTransaction);
          
          // Actually call HashPack to create and execute the transaction
          try {
            const { HederaTransactionService } = await import('@/lib/hedera-transaction');
            
            // Create the Hedera NFT transaction
            const nftTransaction = await HederaTransactionService.createNFTTransaction({
              name: hederaTransaction.name,
              symbol: hederaTransaction.symbol,
              metadata: hederaTransaction.metadata,
              treasuryAccountId: hederaTransaction.treasuryAccountId,
              adminKeys: [hederaTransaction.treasuryAccountId]
            });
            
            // Execute with HashPack
            const result = await HederaTransactionService.executeWithHashPack(nftTransaction);
            
            // Record the successful transaction
            const completeResponse = await fetch(`/api/rights/${data.rightId}/mint-complete`, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              credentials: 'include',
              body: JSON.stringify({
                tokenId: result.tokenId,
                transactionId: result.transactionId,
                transactionHash: result.transactionHash
              })
            });
            
            if (!completeResponse.ok) {
              throw new Error('Failed to record minting completion');
            }
            
            toast({
              title: "NFT Minted Successfully!",
              description: `Token ID: ${result.tokenId}`,
            });
            
          } catch (hashPackError) {
            console.error('HashPack execution error:', hashPackError);
            
            // Show the transaction modal for user to approve manually
            toast({
              title: "HashPack Required",
              description: "Please open HashPack and confirm the NFT creation transaction (10 HBAR fee)",
            });
          }
          
          return data;
        } catch (walletError) {
          throw new Error('HashPack transaction failed: ' + walletError.message);
        }
      }
      
      return data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: [`/api/users`] });
      if (data.data?.transactionParams) {
        toast({
          title: "Transaction Ready!",
          description: "HashPack wallet will open to confirm the NFT minting transaction (Fee: ~10 HBAR)",
        });
      } else {
        toast({
          title: "Minting Started!",
          description: "Your NFT minting process has begun.",
        });
      }
    },
    onError: (error: any) => {
      console.error('Full minting error:', error);
      toast({
        title: "Minting Failed",
        description: error.message || "Unable to start NFT minting. Please try again.",
        variant: "destructive",
      });
    },
  });

  const getStatusBadge = () => {
    if (right.verificationStatus === "pending") {
      return (
        <Badge variant="outline" className="border-yellow-500 text-yellow-700 bg-yellow-50">
          <Clock className="h-3 w-3 mr-1" />
          Under Review
        </Badge>
      );
    }
    if (canMint) {
      return (
        <Badge className="bg-green-500 hover:bg-green-600">
          <CheckCircle className="h-3 w-3 mr-1" />
          Ready to Mint
        </Badge>
      );
    }
    if (right.mintingStatus === "in_progress") {
      return (
        <Badge variant="outline" className="border-blue-500 text-blue-700 bg-blue-50">
          <Zap className="h-3 w-3 mr-1" />
          Minting...
        </Badge>
      );
    }
    if (hasRealTransaction) {
      return (
        <Badge className="bg-purple-500 hover:bg-purple-600">
          <Coins className="h-3 w-3 mr-1" />
          NFT Minted
        </Badge>
      );
    }
    if (right.verificationStatus === "rejected") {
      return (
        <Badge variant="destructive">
          <AlertCircle className="h-3 w-3 mr-1" />
          Rejected
        </Badge>
      );
    }
    return null;
  };

  // Check if this is a real Hedera transaction (proper length and format)
  const hasRealTransaction = right.transactionHash && 
                            right.transactionHash.length > 20 && 
                            !right.transactionHash.startsWith('0x') && // Hedera uses different format
                            right.transactionHash.includes('@');

  const canMint = right.verificationStatus === "verified" && 
                  (right.mintingStatus === "not_started" || right.mintingStatus === "completed") && 
                  !hasRealTransaction;

  return (
    <Card className="overflow-hidden hover:shadow-lg transition-shadow duration-300">
      <div className="aspect-video bg-gradient-to-br from-purple-100 to-blue-100 dark:from-purple-900/20 dark:to-blue-900/20 flex items-center justify-center">
        {right.imageUrl ? (
          <img src={right.imageUrl} alt={right.title} className="w-full h-full object-cover" />
        ) : (
          <div className="text-4xl">{right.symbol}</div>
        )}
      </div>
      <CardContent className="p-4">
        <div className="flex items-start justify-between mb-3">
          <div className="flex-1">
            <h3 className="font-semibold text-lg mb-1 truncate">{right.title}</h3>
            <p className="text-sm text-muted-foreground capitalize">{right.type} Rights</p>
          </div>
          <div className="ml-2">{getStatusBadge()}</div>
        </div>
        
        <p className="text-sm text-muted-foreground mb-4 line-clamp-2">
          {right.description}
        </p>
        
        <div className="space-y-2 mb-4">
          <div className="flex items-center justify-between">
            <div className="text-lg font-semibold">
              {parseFloat(right.price).toFixed(2)} {right.currency}
            </div>
            <div className="text-xs text-muted-foreground">
              {new Date(right.createdAt).toLocaleDateString()}
            </div>
          </div>
          {right.hederaTokenId && (
            <div className="text-xs text-muted-foreground font-mono bg-gray-100 dark:bg-gray-800 px-2 py-1 rounded">
              Token: {right.hederaTokenId}/{right.hederaSerialNumber || 1}
            </div>
          )}
        </div>
        
        <div className="flex gap-2">
          {canMint && (
            <Button 
              onClick={() => mintNFTMutation.mutate(right.id)}
              disabled={mintNFTMutation.isPending}
              className="flex-1 bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700"
            >
              {mintNFTMutation.isPending ? (
                <>
                  <Clock className="h-4 w-4 mr-2 animate-spin" />
                  Minting...
                </>
              ) : (
                <>
                  <Zap className="h-4 w-4 mr-2" />
                  Mint NFT
                </>
              )}
            </Button>
          )}
          {hasRealTransaction && (
            <div className="flex gap-2 flex-1">
              <Button 
                onClick={() => setLocation(`/rights/${right.id}`)}
                className="flex-1"
              >
                <ExternalLink className="h-4 w-4 mr-2" />
                View NFT
              </Button>
              {right.hederaTokenId && (
                <Button 
                  variant="outline"
                  onClick={() => window.open(`https://hashscan.io/mainnet/token/${right.hederaTokenId}/${right.hederaSerialNumber || 1}`, '_blank')}
                  className="flex-1"
                >
                  <ExternalLink className="h-4 w-4 mr-2" />
                  Hedera Explorer
                </Button>
              )}
            </div>
          )}
          {right.verificationStatus === "pending" && (
            <Button variant="outline" className="flex-1" disabled>
              <Clock className="h-4 w-4 mr-2" />
              Awaiting Approval
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

export default function Dashboard() {
  const [, setLocation] = useLocation();
  const { account, isConnected } = useWallet();
  const { toast } = useToast();

  // Extract user ID from account or redirect if not connected
  const userId = account?.id;

  // Debug logging
  console.log('Dashboard render:', { account, isConnected, userId });

  const { data: dashboardData, isLoading, error } = useQuery<{ data: DashboardData }>({
    queryKey: [`/api/users/${userId}/dashboard`],
    enabled: !!userId,
    queryFn: async () => {
      const response = await fetch(`/api/users/${userId}/dashboard`);
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      return response.json();
    },
  });

  const copyToClipboard = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    toast({
      title: "Copied!",
      description: `${label} copied to clipboard`,
    });
  };

  // Show loading state only briefly while checking for account
  if (!account && isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600 dark:text-gray-400">Loading dashboard...</p>
        </div>
      </div>
    );
  }

  // If no account after loading, redirect to connect
  if (!account && !isLoading) {
    setTimeout(() => setLocation('/'), 100);
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

  // Show loading only for dashboard data, not for the whole page
  if (isLoading && account) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600 dark:text-gray-400">Loading dashboard data...</p>
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
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {createdRights.map((right: any) => (
                      <RightCard key={right.id} right={right} />
                    ))}
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
                  All your rights - ready to mint, completed NFTs, and purchased rights
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
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {ownedRights.map((right: any) => (
                      <RightCard key={right.id} right={right} />
                    ))}
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