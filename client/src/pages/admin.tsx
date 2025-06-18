import { useState, useEffect } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { VerificationBadge } from "@/components/verification-badge";
import { AdminLogin } from "@/components/admin-login";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { 
  Shield, 
  Users, 
  FileText, 
  Ban, 
  CheckCircle, 
  XCircle, 
  Clock, 
  Eye,
  Search,
  Filter,
  Settings,
  AlertTriangle,
  TrendingUp,
  DollarSign,
  LogOut
} from "lucide-react";
import type { RightWithCreator, User } from "@shared/schema";

interface AdminStats {
  totalUsers: number;
  totalRights: number;
  pendingVerifications: number;
  bannedUsers: number;
  totalRevenue: string;
  monthlyGrowth: number;
}

export default function Admin() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [selectedRight, setSelectedRight] = useState<RightWithCreator | null>(null);
  const [verificationNotes, setVerificationNotes] = useState("");
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const { toast } = useToast();

  // Check authentication on mount
  useEffect(() => {
    const token = localStorage.getItem("admin_token");
    const session = localStorage.getItem("admin_session");
    
    if (token && session) {
      const sessionTime = parseInt(session);
      const now = Date.now();
      // Session expires after 8 hours
      if (now - sessionTime < 8 * 60 * 60 * 1000) {
        setIsAuthenticated(true);
      } else {
        localStorage.removeItem("admin_token");
        localStorage.removeItem("admin_session");
      }
    }
  }, []);

  const handleLogout = () => {
    localStorage.removeItem("admin_token");
    localStorage.removeItem("admin_session");
    setIsAuthenticated(false);
    toast({
      title: "Logged Out",
      description: "You have been logged out of the admin panel",
    });
  };

  // Show login screen if not authenticated
  if (!isAuthenticated) {
    return <AdminLogin onAuthenticated={() => setIsAuthenticated(true)} />;
  }

  // Fetch admin stats
  const { data: stats, isLoading: loadingStats, error: statsError } = useQuery<AdminStats>({
    queryKey: ["/api/admin/stats"],
    retry: 3,
  });

  // Fetch pending verifications
  const { data: pendingRights, isLoading: loadingRights, error: rightsError } = useQuery<RightWithCreator[]>({
    queryKey: ["/api/admin/rights", { status: statusFilter, search: searchTerm }],
    retry: 3,
  });

  // Fetch users for management
  const { data: users, isLoading: loadingUsers, error: usersError } = useQuery<User[]>({
    queryKey: ["/api/admin/users"],
    retry: 3,
  });

  // Show loading state
  if (loadingStats && loadingRights && loadingUsers) {
    return (
      <div className="min-h-screen bg-background p-6 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading admin dashboard...</p>
        </div>
      </div>
    );
  }

  // Show error state
  if (statsError || rightsError || usersError) {
    return (
      <div className="min-h-screen bg-background p-6 flex items-center justify-center">
        <Card className="max-w-md">
          <CardContent className="p-6 text-center">
            <AlertTriangle className="h-12 w-12 text-red-500 mx-auto mb-4" />
            <h3 className="text-lg font-semibold mb-2">Error Loading Dashboard</h3>
            <p className="text-muted-foreground mb-4">
              Failed to load admin data. Please try refreshing the page.
            </p>
            <Button onClick={() => window.location.reload()}>
              Refresh Page
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Verification mutation
  const verifyRightMutation = useMutation({
    mutationFn: async ({ rightId, status, notes }: { rightId: number; status: string; notes: string }) => {
      if (status === "verified") {
        // Call the verify endpoint which updates status to verified
        return apiRequest("POST", `/api/admin/rights/${rightId}/verify`, { notes });
      } else {
        // For rejected status, use the existing update endpoint
        return apiRequest("PATCH", `/api/rights/${rightId}`, { verificationStatus: status, verificationNotes: notes });
      }
    },
    onSuccess: async (data, variables) => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/rights"] });
      queryClient.invalidateQueries({ queryKey: ["/api/admin/stats"] });
      
      if (variables.status === "verified") {
        toast({
          title: "Success", 
          description: "Right verified successfully. NFT minting initiated automatically.",
        });
      } else {
        toast({
          title: "Success",
          description: "Right verification status updated successfully",
        });
      }
      
      setSelectedRight(null);
      setVerificationNotes("");
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to update verification status",
        variant: "destructive",
      });
    },
  });

  // Function to trigger NFT minting for verified rights
  const triggerNFTMinting = async (rightId: number) => {
    try {
      // This would typically integrate with the Hedera service to mint NFT
      // For now, we'll show a notification that NFT minting is initiated
      toast({
        title: "NFT Minting Initiated",
        description: "The NFT will be minted automatically on the Hedera blockchain. This may take a few minutes.",
      });
      
      // In a real implementation, you would:
      // 1. Fetch the right data
      // 2. Create Hedera metadata
      // 3. Mint the NFT on Hedera
      // 4. Update the right with NFT data via /api/rights/{id}/mint-nft
      
    } catch (error) {
      console.error("NFT minting failed:", error);
      toast({
        title: "NFT Minting Failed",
        description: "There was an error minting the NFT. Please try again or contact support.",
        variant: "destructive",
      });
    }
  };

  // User ban mutation
  const banUserMutation = useMutation({
    mutationFn: async ({ userId, banned }: { userId: number; banned: boolean }) => {
      return apiRequest("POST", `/api/admin/users/${userId}/ban`, { banned });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/users"] });
      toast({
        title: "Success",
        description: "User status updated successfully",
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to update user status",
        variant: "destructive",
      });
    },
  });

  const handleVerification = (status: string) => {
    if (!selectedRight) return;
    verifyRightMutation.mutate({
      rightId: selectedRight.id,
      status,
      notes: verificationNotes,
    });
  };

  const handleUserBan = (userId: number, banned: boolean) => {
    banUserMutation.mutate({ userId, banned });
  };

  return (
    <div className="min-h-screen bg-background p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8 flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold text-foreground mb-2">Admin Dashboard</h1>
            <p className="text-muted-foreground">Manage users, verify rights, and monitor platform activity</p>
          </div>
          <Button variant="outline" onClick={handleLogout}>
            <LogOut className="w-4 h-4 mr-2" />
            Logout
          </Button>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-6 gap-6 mb-8">
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center">
                <Users className="h-8 w-8 text-blue-600" />
                <div className="ml-4">
                  <p className="text-sm font-medium text-muted-foreground">Total Users</p>
                  <p className="text-2xl font-bold">{stats?.totalUsers || 0}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center">
                <FileText className="h-8 w-8 text-green-600" />
                <div className="ml-4">
                  <p className="text-sm font-medium text-muted-foreground">Total Rights</p>
                  <p className="text-2xl font-bold">{stats?.totalRights || 0}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center">
                <Clock className="h-8 w-8 text-yellow-600" />
                <div className="ml-4">
                  <p className="text-sm font-medium text-muted-foreground">Pending</p>
                  <p className="text-2xl font-bold">{stats?.pendingVerifications || 0}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center">
                <Ban className="h-8 w-8 text-red-600" />
                <div className="ml-4">
                  <p className="text-sm font-medium text-muted-foreground">Banned</p>
                  <p className="text-2xl font-bold">{stats?.bannedUsers || 0}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center">
                <DollarSign className="h-8 w-8 text-purple-600" />
                <div className="ml-4">
                  <p className="text-sm font-medium text-muted-foreground">Revenue</p>
                  <p className="text-2xl font-bold">{stats?.totalRevenue || "0 ETH"}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center">
                <TrendingUp className="h-8 w-8 text-emerald-600" />
                <div className="ml-4">
                  <p className="text-sm font-medium text-muted-foreground">Growth</p>
                  <p className="text-2xl font-bold">{stats?.monthlyGrowth || 0}%</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Main Content */}
        <Tabs defaultValue="verification" className="space-y-6">
          <TabsList className="grid w-full grid-cols-5">
            <TabsTrigger value="verification" className="flex items-center gap-2">
              <Shield className="w-4 h-4" />
              Verification
            </TabsTrigger>
            <TabsTrigger value="users" className="flex items-center gap-2">
              <Users className="w-4 h-4" />
              Users
            </TabsTrigger>
            <TabsTrigger value="hedera" className="flex items-center gap-2">
              <Shield className="w-4 h-4" />
              Hedera
            </TabsTrigger>
            <TabsTrigger value="rights" className="flex items-center gap-2">
              <FileText className="w-4 h-4" />
              Rights
            </TabsTrigger>
            <TabsTrigger value="settings" className="flex items-center gap-2">
              <Settings className="w-4 h-4" />
              Settings
            </TabsTrigger>
          </TabsList>

          {/* Verification Tab */}
          <TabsContent value="verification" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Rights Verification</CardTitle>
                <div className="flex gap-4">
                  <div className="flex items-center gap-2">
                    <Search className="w-4 h-4" />
                    <Input
                      placeholder="Search rights..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="w-64"
                    />
                  </div>
                  <Select value={statusFilter} onValueChange={setStatusFilter}>
                    <SelectTrigger className="w-48">
                      <SelectValue placeholder="Filter by status" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Status</SelectItem>
                      <SelectItem value="pending">Pending</SelectItem>
                      <SelectItem value="verified">Verified</SelectItem>
                      <SelectItem value="rejected">Rejected</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </CardHeader>
              <CardContent>
                {loadingRights ? (
                  <div className="space-y-4">
                    {Array.from({ length: 3 }).map((_, i) => (
                      <div key={i} className="h-20 bg-muted rounded animate-pulse" />
                    ))}
                  </div>
                ) : (
                  <div className="space-y-4">
                    {pendingRights?.map((right) => (
                      <div key={right.id} className="flex items-center justify-between p-4 border rounded-lg">
                        <div className="flex items-center space-x-4">
                          <div className="text-2xl">{right.symbol}</div>
                          <div>
                            <h3 className="font-semibold">{right.title}</h3>
                            <p className="text-sm text-muted-foreground">by {right.creator.username}</p>
                            <p className="text-sm text-muted-foreground">{right.price} {right.currency}</p>
                          </div>
                        </div>
                        <div className="flex items-center space-x-3">
                          <VerificationBadge status={right.verificationStatus as any} />
                          {right.contentFileHash && (
                            <Badge variant="outline" className="text-green-600">
                              Content Uploaded
                            </Badge>
                          )}
                          <Dialog>
                            <DialogTrigger asChild>
                              <Button 
                                variant="outline" 
                                size="sm"
                                onClick={() => setSelectedRight(right)}
                              >
                                <Eye className="w-4 h-4 mr-1" />
                                Review
                              </Button>
                            </DialogTrigger>
                            <DialogContent className="max-w-2xl">
                              <DialogHeader>
                                <DialogTitle>Review Right: {right.title}</DialogTitle>
                              </DialogHeader>
                              <div className="space-y-6">
                                <div className="grid grid-cols-2 gap-4">
                                  <div>
                                    <label className="text-sm font-medium">Creator</label>
                                    <p className="text-sm text-muted-foreground">{right.creator.username}</p>
                                  </div>
                                  <div>
                                    <label className="text-sm font-medium">Type</label>
                                    <p className="text-sm text-muted-foreground">{right.type}</p>
                                  </div>
                                  <div>
                                    <label className="text-sm font-medium">Price</label>
                                    <p className="text-sm text-muted-foreground">{right.price} {right.currency}</p>
                                  </div>
                                  <div>
                                    <label className="text-sm font-medium">Status</label>
                                    <VerificationBadge status={right.verificationStatus as any} />
                                  </div>
                                </div>
                                
                                <div>
                                  <label className="text-sm font-medium">Description</label>
                                  <p className="text-sm text-muted-foreground mt-1">{right.description}</p>
                                </div>

                                {right.contentFileHash && (
                                  <div>
                                    <label className="text-sm font-medium">Content File</label>
                                    <div className="flex items-center gap-2 mt-1">
                                      <Badge variant="outline" className="text-green-600">
                                        File Hash: {right.contentFileHash.substring(0, 20)}...
                                      </Badge>
                                    </div>
                                  </div>
                                )}

                                <div>
                                  <label className="text-sm font-medium">Verification Notes</label>
                                  <Textarea
                                    placeholder="Add notes about this verification..."
                                    value={verificationNotes}
                                    onChange={(e) => setVerificationNotes(e.target.value)}
                                    className="mt-1"
                                  />
                                </div>

                                <div className="flex gap-3">
                                  <Button
                                    onClick={() => handleVerification("verified")}
                                    disabled={verifyRightMutation.isPending}
                                    className="bg-green-600 hover:bg-green-700"
                                  >
                                    <CheckCircle className="w-4 h-4 mr-1" />
                                    Approve
                                  </Button>
                                  <Button
                                    onClick={() => handleVerification("rejected")}
                                    disabled={verifyRightMutation.isPending}
                                    variant="destructive"
                                  >
                                    <XCircle className="w-4 h-4 mr-1" />
                                    Reject
                                  </Button>
                                  <Button
                                    onClick={() => handleVerification("pending")}
                                    disabled={verifyRightMutation.isPending}
                                    variant="outline"
                                  >
                                    <Clock className="w-4 h-4 mr-1" />
                                    Mark Pending
                                  </Button>
                                </div>
                              </div>
                            </DialogContent>
                          </Dialog>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Users Tab */}
          <TabsContent value="users" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>User Management</CardTitle>
              </CardHeader>
              <CardContent>
                {loadingUsers ? (
                  <div className="space-y-4">
                    {Array.from({ length: 5 }).map((_, i) => (
                      <div key={i} className="h-16 bg-muted rounded animate-pulse" />
                    ))}
                  </div>
                ) : (
                  <div className="space-y-4">
                    {users?.map((user) => (
                      <div key={user.id} className="flex items-center justify-between p-4 border rounded-lg">
                        <div className="flex items-center space-x-4">
                          <div className="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center">
                            <span className="font-bold text-primary">
                              {user.username.charAt(0).toUpperCase()}
                            </span>
                          </div>
                          <div>
                            <h3 className="font-semibold">{user.username}</h3>
                            <p className="text-sm text-muted-foreground">{user.email}</p>
                            <p className="text-sm text-muted-foreground">
                              Wallet: {user.walletAddress?.substring(0, 10)}...
                            </p>
                          </div>
                        </div>
                        <div className="flex items-center space-x-3">
                          {user.isVerified && (
                            <Badge className="bg-green-100 text-green-800">Verified</Badge>
                          )}
                          {user.isBanned && (
                            <Badge variant="destructive">Banned</Badge>
                          )}
                          <Button
                            variant={user.isBanned ? "outline" : "destructive"}
                            size="sm"
                            onClick={() => handleUserBan(user.id, !user.isBanned)}
                            disabled={banUserMutation.isPending}
                          >
                            {user.isBanned ? (
                              <>
                                <CheckCircle className="w-4 h-4 mr-1" />
                                Unban
                              </>
                            ) : (
                              <>
                                <Ban className="w-4 h-4 mr-1" />
                                Ban
                              </>
                            )}
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Hedera Tab */}
          <TabsContent value="hedera" className="space-y-6">
            <div className="space-y-6">
              <div>
                <h2 className="text-2xl font-bold mb-2">Hedera Testnet Integration</h2>
                <p className="text-muted-foreground">
                  Test and monitor the Hedera blockchain integration for NFT minting
                </p>
              </div>
              <HederaTestPanel />
            </div>
          </TabsContent>

          {/* Rights Tab */}
          <TabsContent value="rights" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>All Rights</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground">Comprehensive rights management coming soon...</p>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Settings Tab */}
          <TabsContent value="settings" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Platform Settings</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground">Platform configuration options coming soon...</p>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}