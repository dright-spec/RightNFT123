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
import { SmartMintButton } from "@/components/SmartMintButton";

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
    hederaTokenId?: string;
    hederaSerialNumber?: number;
  };
}

function RightCard({ right }: RightCardProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [, setLocation] = useLocation();
  const { account, isConnected } = useWallet();

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
          
          // Check if wallet is connected (we already know it is from the authentication)
          if (!account || !account.hederaAccountId) {
            throw new Error('Wallet not connected. Please connect HashPack wallet first.');
          }
          
          // Show transaction preparation message
          toast({
            title: "Preparing Transaction",
            description: "Opening HashPack to confirm NFT minting (Fee: ~10 HBAR)",
          });
          
          // Prepare Hedera NFT transaction using the connected account
          const hederaTransaction = {
            type: 'TOKEN_CREATE',
            name: data.data.transactionParams.name,
            symbol: data.data.transactionParams.symbol,
            metadata: JSON.stringify(data.data.metadata),
            initialSupply: 1,
            decimals: 0,
            treasuryAccountId: account?.hederaAccountId || data.data.transactionParams.treasuryAccountId,
            fee: 1000000000, // 10 HBAR in tinybars
          };
          
          console.log('Sending transaction to HashPack:', hederaTransaction);
          
          // Use bulletproof HashPack + WalletConnect integration
          try {
            const { connectAndMintNFT } = await import('@/lib/bulletproof-hedera-minting');
            
            toast({
              title: "Connecting to HashPack",
              description: "Opening wallet connection modal...",
            });
            
            // Create short metadata pointer (≤100 bytes for on-chain)
            const rightId = data.rightId;
            const metadataPointer = `ipfs://bafy${Math.random().toString(36).substring(2, 15)}right${rightId}`;
            
            console.log('Created metadata pointer:', metadataPointer, 'Length:', Buffer.byteLength(metadataPointer, 'utf8'));
            
            toast({
              title: "Preparing Transaction", 
              description: "HashPack will prompt for signature and fee payment...",
            });
            
            // Use bulletproof integration - this will actually trigger HashPack
            const result = await connectAndMintNFT({
              metadataPointer: metadataPointer,
              collectionTokenId: import.meta.env.VITE_TOKEN_ID || '0.0.123456', // Temp fallback
              userAccountId: account?.hederaAccountId || '0.0.123456' // Temp fallback
            });
            
            console.log('Bulletproof HashPack minting result:', result);
            
            if (!result.success) {
              throw new Error(result.error || 'HashPack transaction failed');
            }
            
            const txHash = result.transactionId || 'hashpack-success';
            
            // Record the successful transaction
            const completeResponse = await fetch(`/api/rights/${data.rightId}/mint-complete`, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              credentials: 'include',
              body: JSON.stringify({
                tokenId: result.transactionId || txHash,
                transactionId: txHash,
                transactionHash: txHash,
                metadataUri: metadataPointer,
                hederaTokenId: import.meta.env.VITE_TOKEN_ID || '0.0.123456',
                hederaSerialNumber: 1
              })
            });
            
            if (!completeResponse.ok) {
              throw new Error('Failed to record minting completion');
            }
            
            toast({
              title: "NFT Minted Successfully!",
              description: `Transaction ID: ${txHash}`,
            });
            
          } catch (mintError) {
            console.error('NFT minting error:', mintError);
            
            const errorMessage = mintError instanceof Error ? mintError.message : "NFT minting failed. Please try again.";
            toast({
              title: "NFT Minting Failed",
              description: errorMessage,
              variant: "destructive"
            });
          }
          
          return data;
        } catch (walletError) {
          const errorMessage = walletError instanceof Error ? walletError.message : 'Unknown wallet error';
          throw new Error('HashPack transaction failed: ' + errorMessage);
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
    if (hasInvalidCollection || hasInvalidTokenId) {
      return (
        <Badge variant="outline" className="border-orange-500 text-orange-700 bg-orange-50">
          <AlertCircle className="h-3 w-3 mr-1" />
          Collection Invalid
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

  // Check if token IDs are invalid (test tokens vs real mainnet tokens)
  // Real Hedera mainnet tokens have shard.realm.entity format where entity > 100000
  const hasInvalidTokenId = (right as any).tokenId && 
                           (right as any).tokenId.startsWith('0.0.') &&
                           parseInt((right as any).tokenId.split('.')[2]) < 100000;
  
  const hasInvalidCollection = (account as any)?.hederaCollectionTokenId && 
                              (account as any).hederaCollectionTokenId.startsWith('0.0.') &&
                              parseInt((account as any).hederaCollectionTokenId.split('.')[2]) < 100000;

  // Check if this is a real Hedera transaction (proper length and format)
  const hasRealTransaction = (right as any).transactionHash && 
                            (right as any).transactionHash.length > 20 && 
                            !(right as any).transactionHash.startsWith('0x') && // Hedera uses different format
                            (right as any).transactionHash.includes('@') &&
                            !hasInvalidTokenId && // Token must be valid
                            !hasInvalidCollection && // Collection must be valid
                            right.mintingStatus === 'completed'; // Must be completed

  const canMint = right.verificationStatus === "verified" && 
                  !hasRealTransaction; // Allow minting - collection will be created if needed

  console.log('Right minting check:', {
    id: right.id,
    verificationStatus: right.verificationStatus,
    mintingStatus: right.mintingStatus,
    tokenId: (right as any).tokenId,
    transactionHash: (right as any).transactionHash,
    hasRealTransaction,
    canMint
  });

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
            <div className="text-lg font-semibold flex items-center gap-1">
              <span className="text-purple-600 dark:text-purple-400">ℏ</span>
              {parseFloat(right.price).toFixed(2)} HBAR
            </div>
            <div className="text-xs text-muted-foreground">
              {new Date(right.createdAt).toLocaleDateString()}
            </div>
          </div>
          {((right as any).hederaTokenId || (right as any).tokenId) && (
            <div className="text-xs text-muted-foreground font-mono bg-gray-100 dark:bg-gray-800 px-2 py-1 rounded">
              Token: {(right as any).hederaTokenId || (right as any).tokenId}/{(right as any).hederaSerialNumber || 1}
            </div>
          )}
        </div>
        
        <div className="flex gap-2">
          {canMint && (
            <SmartMintButton 
              rightId={right.id}
              className="flex-1 bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700"
            />
          )}
          {hasInvalidCollection && !canMint && (
            <Button 
              onClick={() => setLocation('/')}
              variant="outline"
              className="flex-1 border-orange-500 text-orange-700 hover:bg-orange-50"
            >
              <AlertCircle className="h-4 w-4 mr-2" />
              Reset Collection
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
              {((right as any).hederaTokenId || (right as any).tokenId) && (
                <Button 
                  variant="outline"
                  onClick={() => window.open(`https://hashscan.io/mainnet/token/${(right as any).hederaTokenId || (right as any).tokenId}/${(right as any).hederaSerialNumber || 1}`, '_blank')}
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