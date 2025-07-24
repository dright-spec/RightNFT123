import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Progress } from "@/components/ui/progress";
import { useToast } from "@/hooks/use-toast";
import { useWalletUser } from "@/hooks/use-wallet-user";
import { Coins, TrendingUp, Clock, DollarSign, Users, Target, ChevronRight } from "lucide-react";
import type { Right, StakeWithDetails } from "@shared/schema";

interface StakeFormData {
  rightId: number;
  terms: string;
  duration: string;
}

export default function StakingPage() {
  const { user, isLoading: userLoading } = useWalletUser();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [selectedTab, setSelectedTab] = useState("overview");
  const [stakeFormData, setStakeFormData] = useState<StakeFormData>({
    rightId: 0,
    terms: "",
    duration: "",
  });

  // Fixed platform settings
  const REVENUE_SHARE_PERCENTAGE = 75; // 75% to user
  const MANAGEMENT_FEE = 15; // 15% platform fee

  // Fetch available rights for staking
  const { data: availableRights = [], isLoading: rightsLoading } = useQuery<Right[]>({
    queryKey: ["/api/stakes/available-rights"],
    enabled: !!user,
  });

  // Fetch user's stakes
  const { data: userStakes = [], isLoading: stakesLoading } = useQuery<StakeWithDetails[]>({
    queryKey: ["/api/stakes/user"],
    enabled: !!user,
  });

  // Create stake mutation
  const createStakeMutation = useMutation({
    mutationFn: async (data: StakeFormData) => {
      const response = await fetch("/api/stakes", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          rightId: data.rightId,
          revenueSharePercentage: REVENUE_SHARE_PERCENTAGE,
          managementFee: MANAGEMENT_FEE,
          terms: data.terms,
          duration: data.duration ? parseInt(data.duration) : null,
        }),
      });
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Failed to create stake");
      }
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Stake Created",
        description: "Your right has been successfully staked for revenue sharing.",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/stakes/available-rights"] });
      queryClient.invalidateQueries({ queryKey: ["/api/stakes/user"] });
      setStakeFormData({
        rightId: 0,
        terms: "",
        duration: "",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Staking Failed",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const formatCurrency = (amount: string) => {
    return `${parseFloat(amount).toFixed(4)} ETH`;
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "active": return "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200";
      case "completed": return "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200";
      case "cancelled": return "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200";
      default: return "bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200";
    }
  };

  if (userLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-50 via-blue-50 to-indigo-100 dark:from-gray-900 dark:via-blue-900 dark:to-indigo-900 p-6">
        <div className="max-w-6xl mx-auto">
          <div className="animate-pulse space-y-6">
            <div className="h-8 bg-gray-200 dark:bg-gray-700 rounded w-64"></div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {[...Array(3)].map((_, i) => (
                <div key={i} className="h-32 bg-gray-200 dark:bg-gray-700 rounded"></div>
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-50 via-blue-50 to-indigo-100 dark:from-gray-900 dark:via-blue-900 dark:to-indigo-900 flex items-center justify-center p-6">
        <Card className="max-w-md w-full">
          <CardHeader className="text-center">
            <CardTitle className="flex items-center justify-center gap-2">
              <Coins className="h-6 w-6 text-purple-600" />
              Connect Wallet
            </CardTitle>
          </CardHeader>
          <CardContent className="text-center space-y-4">
            <p className="text-gray-600 dark:text-gray-400">
              Connect your wallet to access the staking platform and start earning passive revenue from verified rights.
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-blue-50 to-indigo-100 dark:from-gray-900 dark:via-blue-900 dark:to-indigo-900 p-6">
      <div className="max-w-6xl mx-auto space-y-8">
        {/* Header */}
        <div className="text-center space-y-4">
          <h1 className="text-4xl font-bold bg-gradient-to-r from-purple-600 to-blue-600 bg-clip-text text-transparent">
            Rights Staking Platform
          </h1>
          <p className="text-xl text-gray-600 dark:text-gray-400 max-w-3xl mx-auto">
            Stake your verified rights and let our expert team maximize revenue generation while you earn passive income.
          </p>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <Card className="bg-gradient-to-br from-green-500 to-emerald-600 text-white">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-green-100 text-sm">Total Staked</p>
                  <p className="text-2xl font-bold">{userStakes.length}</p>
                </div>
                <Target className="h-8 w-8 text-green-200" />
              </div>
            </CardContent>
          </Card>
          
          <Card className="bg-gradient-to-br from-blue-500 to-cyan-600 text-white">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-blue-100 text-sm">Total Earnings</p>
                  <p className="text-2xl font-bold">
                    {formatCurrency(
                      userStakes.reduce((sum: number, stake: StakeWithDetails) => sum + parseFloat(stake.stakerEarnings || "0"), 0).toString()
                    )}
                  </p>
                </div>
                <DollarSign className="h-8 w-8 text-blue-200" />
              </div>
            </CardContent>
          </Card>
          
          <Card className="bg-gradient-to-br from-purple-500 to-violet-600 text-white">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-purple-100 text-sm">Active Stakes</p>
                  <p className="text-2xl font-bold">
                    {userStakes.filter((stake: StakeWithDetails) => stake.status === "active").length}
                  </p>
                </div>
                <TrendingUp className="h-8 w-8 text-purple-200" />
              </div>
            </CardContent>
          </Card>
          
          <Card className="bg-gradient-to-br from-orange-500 to-red-600 text-white">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-orange-100 text-sm">Your Rights to Stake</p>
                  <p className="text-2xl font-bold">{availableRights.length}</p>
                </div>
                <Users className="h-8 w-8 text-orange-200" />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Main Content */}
        <Tabs value={selectedTab} onValueChange={setSelectedTab} className="space-y-6">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="stake">Create Stake</TabsTrigger>
            <TabsTrigger value="my-stakes">My Stakes</TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Coins className="h-5 w-5 text-purple-600" />
                    How Staking Works
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-3">
                    <div className="flex items-start gap-3">
                      <div className="w-6 h-6 rounded-full bg-purple-100 dark:bg-purple-900 flex items-center justify-center text-sm font-bold text-purple-600 dark:text-purple-300">
                        1
                      </div>
                      <div>
                        <h4 className="font-semibold">Stake Verified Rights</h4>
                        <p className="text-sm text-gray-600 dark:text-gray-400">
                          Choose from your own verified rights to stake with our platform team.
                        </p>
                      </div>
                    </div>
                    <div className="flex items-start gap-3">
                      <div className="w-6 h-6 rounded-full bg-purple-100 dark:bg-purple-900 flex items-center justify-center text-sm font-bold text-purple-600 dark:text-purple-300">
                        2
                      </div>
                      <div>
                        <h4 className="font-semibold">Professional Rights Management</h4>
                        <p className="text-sm text-gray-600 dark:text-gray-400">
                          Our team becomes your dedicated rights manager, handling all revenue generation without selling your rights.
                        </p>
                      </div>
                    </div>
                    <div className="flex items-start gap-3">
                      <div className="w-6 h-6 rounded-full bg-purple-100 dark:bg-purple-900 flex items-center justify-center text-sm font-bold text-purple-600 dark:text-purple-300">
                        3
                      </div>
                      <div>
                        <h4 className="font-semibold">Earn Passive Income</h4>
                        <p className="text-sm text-gray-600 dark:text-gray-400">
                          Receive your percentage of generated revenue automatically.
                        </p>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <TrendingUp className="h-5 w-5 text-green-600" />
                    Revenue Sharing
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-3">
                    <div className="flex justify-between items-center p-3 bg-green-50 dark:bg-green-900/20 rounded-lg">
                      <span className="font-medium">Your Share</span>
                      <span className="text-green-600 font-bold">70-80%</span>
                    </div>
                    <div className="flex justify-between items-center p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                      <span className="font-medium">Management Fee</span>
                      <span className="text-blue-600 font-bold">15-20%</span>
                    </div>
                    <div className="flex justify-between items-center p-3 bg-purple-50 dark:bg-purple-900/20 rounded-lg">
                      <span className="font-medium">Platform Fee</span>
                      <span className="text-purple-600 font-bold">5-10%</span>
                    </div>
                  </div>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    Revenue sharing percentages are customizable based on your agreement terms.
                  </p>
                </CardContent>
              </Card>
            </div>

            {/* Detailed Management Explanation */}
            <Card className="border-l-4 border-l-blue-500">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Users className="h-5 w-5 text-blue-600" />
                  How We Manage Your Rights
                </CardTitle>
                <p className="text-gray-600 dark:text-gray-400 mt-2">
                  When you stake your rights, our team takes full management responsibility to maximize profitability while you retain ownership
                </p>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  <div className="space-y-4">
                    <div className="bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20 border border-blue-200 dark:border-blue-700 rounded-lg p-4">
                      <h4 className="font-semibold text-blue-800 dark:text-blue-200 mb-3 flex items-center gap-2">
                        🎵 Music Rights Management
                      </h4>
                      <div className="space-y-2 text-sm text-gray-700 dark:text-gray-300">
                        <div className="flex items-start gap-2">
                          <div className="w-1.5 h-1.5 bg-blue-500 rounded-full mt-2 flex-shrink-0"></div>
                          <p><strong>Collect streaming royalties</strong> from Spotify, Apple Music, YouTube, and all major platforms</p>
                        </div>
                        <div className="flex items-start gap-2">
                          <div className="w-1.5 h-1.5 bg-blue-500 rounded-full mt-2 flex-shrink-0"></div>
                          <p><strong>Pursue sync licensing</strong> opportunities for films, commercials, TV shows, and video games</p>
                        </div>
                        <div className="flex items-start gap-2">
                          <div className="w-1.5 h-1.5 bg-blue-500 rounded-full mt-2 flex-shrink-0"></div>
                          <p><strong>Negotiate performance royalties</strong> from radio stations, live venues, and public performances</p>
                        </div>
                        <div className="flex items-start gap-2">
                          <div className="w-1.5 h-1.5 bg-blue-500 rounded-full mt-2 flex-shrink-0"></div>
                          <p><strong>Consolidate all revenue streams</strong> into regular payments to you</p>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="space-y-4">
                    <div className="bg-gradient-to-r from-purple-50 to-pink-50 dark:from-purple-900/20 dark:to-pink-900/20 border border-purple-200 dark:border-purple-700 rounded-lg p-4">
                      <h4 className="font-semibold text-purple-800 dark:text-purple-200 mb-3 flex items-center gap-2">
                        📚 Other Rights Management
                      </h4>
                      <div className="space-y-3 text-sm text-gray-700 dark:text-gray-300">
                        <div>
                          <p className="font-medium text-purple-700 dark:text-purple-300">Patents & IP:</p>
                          <p>License to manufacturers, negotiate royalty rates, handle enforcement and compliance</p>
                        </div>
                        <div>
                          <p className="font-medium text-purple-700 dark:text-purple-300">Software & Tech:</p>
                          <p>Enterprise licensing, API partnerships, usage-based revenue models</p>
                        </div>
                        <div>
                          <p className="font-medium text-purple-700 dark:text-purple-300">Creative Works:</p>
                          <p>Gallery partnerships, print licensing, merchandising opportunities</p>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="bg-gradient-to-r from-green-50 to-emerald-50 dark:from-green-900/20 dark:to-emerald-900/20 border border-green-200 dark:border-green-700 rounded-lg p-6">
                  <h4 className="font-semibold text-green-800 dark:text-green-200 mb-4 flex items-center gap-2">
                    <Target className="h-5 w-5" />
                    Our Management Approach
                  </h4>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="text-center">
                      <div className="w-12 h-12 bg-green-200 dark:bg-green-800 rounded-full flex items-center justify-center mx-auto mb-3">
                        <Users className="h-6 w-6 text-green-700 dark:text-green-200" />
                      </div>
                      <h5 className="font-semibold mb-2">Dedicated Team</h5>
                      <p className="text-sm text-gray-600 dark:text-gray-400">
                        Experienced professionals handle your rights as if they were our own
                      </p>
                    </div>
                    <div className="text-center">
                      <div className="w-12 h-12 bg-blue-200 dark:bg-blue-800 rounded-full flex items-center justify-center mx-auto mb-3">
                        <TrendingUp className="h-6 w-6 text-blue-700 dark:text-blue-200" />
                      </div>
                      <h5 className="font-semibold mb-2">Revenue Maximization</h5>
                      <p className="text-sm text-gray-600 dark:text-gray-400">
                        We actively seek and negotiate the best possible deals for your rights
                      </p>
                    </div>
                    <div className="text-center">
                      <div className="w-12 h-12 bg-purple-200 dark:bg-purple-800 rounded-full flex items-center justify-center mx-auto mb-3">
                        <Clock className="h-6 w-6 text-purple-700 dark:text-purple-200" />
                      </div>
                      <h5 className="font-semibold mb-2">Full Service</h5>
                      <p className="text-sm text-gray-600 dark:text-gray-400">
                        Complete administrative handling - contracts, collections, distributions
                      </p>
                    </div>
                  </div>
                </div>

                <div className="bg-gradient-to-r from-yellow-50 to-orange-50 dark:from-yellow-900/20 dark:to-orange-900/20 border border-yellow-200 dark:border-yellow-700 rounded-lg p-4">
                  <h4 className="font-semibold text-yellow-800 dark:text-yellow-200 mb-3 flex items-center gap-2">
                    <ChevronRight className="h-5 w-5" />
                    The Easy Way to Professional Management
                  </h4>
                  <p className="text-sm text-gray-700 dark:text-gray-300 mb-3">
                    Instead of spending your time researching licensing opportunities, negotiating contracts, and chasing payments, 
                    you simply stake your rights and let our professional team handle everything. It's essentially giving us the 
                    responsibility to manage your rights in the best way possible while you focus on creating new content.
                  </p>
                  <div className="flex items-center justify-center bg-green-100 dark:bg-green-900/30 rounded-lg p-3">
                    <p className="text-green-800 dark:text-green-200 font-medium text-center">
                      You keep ownership • We maximize revenue • You earn 75% passively
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="stake" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Create New Stake</CardTitle>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  Stake your verified rights for professional revenue management and passive income generation.
                </p>
              </CardHeader>
              <CardContent>
                <form
                  onSubmit={(e) => {
                    e.preventDefault();
                    if (stakeFormData.rightId) {
                      createStakeMutation.mutate(stakeFormData);
                    }
                  }}
                  className="space-y-6"
                >
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-2">
                      <Label htmlFor="rightId">Select Your Right to Stake</Label>
                      <Select
                        value={stakeFormData.rightId.toString()}
                        onValueChange={(value) =>
                          setStakeFormData(prev => ({ ...prev, rightId: parseInt(value) }))
                        }
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Choose one of your verified rights" />
                        </SelectTrigger>
                        <SelectContent>
                          {(availableRights as Right[]).map((right: Right) => (
                            <SelectItem key={right.id} value={right.id.toString()}>
                              {right.title} - {right.type}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="duration">Duration (Months)</Label>
                      <Input
                        id="duration"
                        type="number"
                        min="1"
                        max="60"
                        value={stakeFormData.duration}
                        onChange={(e) =>
                          setStakeFormData(prev => ({ ...prev, duration: e.target.value }))
                        }
                        placeholder="Leave empty for indefinite"
                      />
                    </div>
                  </div>

                  {/* Fixed Platform Terms Display */}
                  <div className="bg-gradient-to-r from-purple-50 to-blue-50 dark:from-purple-900/20 dark:to-blue-900/20 border border-purple-200 dark:border-purple-700 rounded-lg p-4">
                    <h4 className="font-semibold text-purple-800 dark:text-purple-200 mb-3">Platform Terms</h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                      <div className="flex justify-between">
                        <span className="text-gray-600 dark:text-gray-400">Your Revenue Share:</span>
                        <span className="font-semibold text-purple-700 dark:text-purple-300">{REVENUE_SHARE_PERCENTAGE}%</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600 dark:text-gray-400">Platform Management Fee:</span>
                        <span className="font-semibold text-purple-700 dark:text-purple-300">{MANAGEMENT_FEE}%</span>
                      </div>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="terms">Special Terms & Conditions</Label>
                    <Textarea
                      id="terms"
                      value={stakeFormData.terms}
                      onChange={(e) =>
                        setStakeFormData(prev => ({ ...prev, terms: e.target.value }))
                      }
                      placeholder="Any specific terms or requirements for your stake..."
                      className="min-h-[100px]"
                    />
                  </div>

                  <Button
                    type="submit"
                    disabled={!stakeFormData.rightId || createStakeMutation.isPending}
                    className="w-full bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700"
                  >
                    {createStakeMutation.isPending ? "Creating Stake..." : "Create Stake"}
                  </Button>
                </form>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="my-stakes" className="space-y-6">
            <div className="grid gap-6">
              {stakesLoading ? (
                <div className="space-y-4">
                  {[...Array(3)].map((_, i) => (
                    <div key={i} className="h-32 bg-gray-200 dark:bg-gray-700 rounded animate-pulse"></div>
                  ))}
                </div>
              ) : userStakes.length === 0 ? (
                <Card>
                  <CardContent className="text-center py-12">
                    <Coins className="h-16 w-16 text-gray-400 mx-auto mb-4" />
                    <h3 className="text-xl font-semibold mb-2">No Stakes Yet</h3>
                    <p className="text-gray-600 dark:text-gray-400 mb-4">
                      Start staking your verified rights to earn passive income.
                    </p>
                    <Button
                      onClick={() => setSelectedTab("stake")}
                      className="bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700"
                    >
                      Create Your First Stake
                    </Button>
                  </CardContent>
                </Card>
              ) : (
                userStakes.map((stake: StakeWithDetails) => (
                  <Card key={stake.id}>
                    <CardHeader>
                      <div className="flex items-center justify-between">
                        <CardTitle className="text-lg">{stake.right.title}</CardTitle>
                        <Badge className={getStatusColor(stake.status)}>
                          {stake.status.charAt(0).toUpperCase() + stake.status.slice(1)}
                        </Badge>
                      </div>
                      <p className="text-sm text-gray-600 dark:text-gray-400">
                        {stake.right.type} • Started {stake.startDate ? new Date(stake.startDate).toLocaleDateString() : 'Pending'}
                      </p>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                        <div>
                          <p className="text-sm text-gray-600 dark:text-gray-400">Revenue Share</p>
                          <p className="font-semibold">{stake.revenueSharePercentage}%</p>
                        </div>
                        <div>
                          <p className="text-sm text-gray-600 dark:text-gray-400">Total Revenue</p>
                          <p className="font-semibold">{formatCurrency(stake.totalRevenue)}</p>
                        </div>
                        <div>
                          <p className="text-sm text-gray-600 dark:text-gray-400">Your Earnings</p>
                          <p className="font-semibold text-green-600">{formatCurrency(stake.stakerEarnings)}</p>
                        </div>
                        <div>
                          <p className="text-sm text-gray-600 dark:text-gray-400">Management Fee</p>
                          <p className="font-semibold">{stake.managementFee}%</p>
                        </div>
                      </div>

                      {stake.revenueDistributions && stake.revenueDistributions.length > 0 && (
                        <div className="space-y-2">
                          <h4 className="font-semibold text-sm">Recent Revenue Distributions</h4>
                          <div className="space-y-1">
                            {stake.revenueDistributions.slice(0, 3).map((distribution) => (
                              <div key={distribution.id} className="flex justify-between items-center text-sm">
                                <span className="text-gray-600 dark:text-gray-400">
                                  {distribution.distributionType} • {distribution.processedAt ? new Date(distribution.processedAt).toLocaleDateString() : 'Pending'}
                                </span>
                                <span className="font-medium">
                                  {formatCurrency(distribution.amount || "0")}
                                </span>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

                      {stake.duration && (
                        <div className="space-y-2">
                          <div className="flex justify-between items-center text-sm">
                            <span>Duration Progress</span>
                            <span>{stake.duration} months</span>
                          </div>
                          <Progress
                            value={
                              stake.endDate
                                ? Math.min(
                                    100,
                                    ((Date.now() - new Date(stake.startDate || Date.now()).getTime()) /
                                      (new Date(stake.endDate).getTime() - new Date(stake.startDate || Date.now()).getTime())) * 100
                                  )
                                : 0
                            }
                            className="h-2"
                          />
                        </div>
                      )}
                    </CardContent>
                  </Card>
                ))
              )}
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}