import { useState, useEffect } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { VerificationBadge } from "@/components/verification-badge";
import { AdminLogin } from "@/components/admin-login";
import { PerformanceDashboard } from "@/components/admin/performance-dashboard";
import { NFTViewer } from "@/components/nft-viewer";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { HederaTestPanel } from "@/components/hedera-test-panel";
import { 
  Users, 
  FileText, 
  Clock, 
  Ban, 
  AlertTriangle, 
  CheckCircle, 
  XCircle, 
  Search,
  LogOut,
  Shield,
  Settings,
  Video,
  Music
} from "lucide-react";

import type { User, Right, RightWithCreator } from "@shared/schema";

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

  // All hooks called before any conditional returns
  const { data: stats, isLoading: loadingStats, error: statsError } = useQuery<AdminStats>({
    queryKey: ["/api/admin/stats"],
    retry: 3,
    enabled: isAuthenticated,
  });

  const { data: pendingRights, isLoading: loadingRights, error: rightsError } = useQuery<RightWithCreator[]>({
    queryKey: ["/api/admin/rights", { status: statusFilter, search: searchTerm }],
    retry: 3,
    enabled: isAuthenticated,
  });

  const { data: users, isLoading: loadingUsers, error: usersError } = useQuery<User[]>({
    queryKey: ["/api/admin/users"],
    retry: 3,
    enabled: isAuthenticated,
  });

  const verifyRightMutation = useMutation({
    mutationFn: async ({ rightId, status, notes }: { rightId: number; status: string; notes: string }) => {
      if (status === "verified") {
        return apiRequest("POST", `/api/admin/rights/${rightId}/verify`, { notes });
      } else {
        return apiRequest("POST", `/api/admin/rights/${rightId}/verify`, { status, notes });
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/rights"] });
      setSelectedRight(null);
      setVerificationNotes("");
      toast({
        title: "Success",
        description: "Right verification updated successfully",
      });
    },
    onError: (error) => {
      console.error("Verification failed:", error);
      toast({
        title: "Error",
        description: "Failed to update verification status",
        variant: "destructive",
      });
    }
  });

  const banUserMutation = useMutation({
    mutationFn: async ({ userId, banned }: { userId: number; banned: boolean }) => {
      console.log(`Updating user ${userId} ban status to:`, banned);
      return apiRequest("POST", `/api/admin/users/${userId}/ban`, { banned });
    },
    onSuccess: (data, variables) => {
      console.log('Ban mutation success:', data);
      queryClient.invalidateQueries({ queryKey: ["/api/admin/users"] });
      queryClient.invalidateQueries({ queryKey: ["/api/admin/stats"] });
      toast({
        title: "User Status Updated",
        description: `User has been ${variables.banned ? 'banned' : 'unbanned'} successfully`,
      });
    },
    onError: (error) => {
      console.error('Ban mutation error:', error);
      toast({
        title: "Error",
        description: "Failed to update user status. Please try again.",
        variant: "destructive",
      });
    },
  });

  // Check authentication on mount
  useEffect(() => {
    const token = localStorage.getItem("admin_token");
    const session = localStorage.getItem("admin_session");
    
    if (token && session) {
      const sessionTime = parseInt(session);
      const now = Date.now();
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

  // Show login screen if not authenticated
  if (!isAuthenticated) {
    return <AdminLogin onAuthenticated={() => setIsAuthenticated(true)} />;
  }

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
                <div className="h-8 w-8 bg-primary/20 rounded-full flex items-center justify-center">
                  <span className="text-primary font-bold">ℏ</span>
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-muted-foreground">Revenue</p>
                  <p className="text-2xl font-bold">{stats?.totalRevenue || "0 HBAR"}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center">
                <div className="h-8 w-8 bg-green-500/20 rounded-full flex items-center justify-center">
                  <span className="text-green-500 font-bold">%</span>
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-muted-foreground">Growth</p>
                  <p className="text-2xl font-bold">{stats?.monthlyGrowth || 0}%</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        <Tabs defaultValue="overview" className="space-y-6">
          <TabsList className="grid w-full grid-cols-5">
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="verification">Verification</TabsTrigger>
            <TabsTrigger value="users">Users</TabsTrigger>
            <TabsTrigger value="performance">Performance</TabsTrigger>
            <TabsTrigger value="hedera">Hedera</TabsTrigger>
          </TabsList>

          {/* Overview Tab */}
          <TabsContent value="overview" className="space-y-6">
            <div className="grid gap-6 md:grid-cols-2">
              <Card>
                <CardHeader>
                  <CardTitle>Recent Activity</CardTitle>
                  <CardDescription>Latest platform activity and metrics</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="flex justify-between">
                      <span className="text-sm text-muted-foreground">New Rights Today</span>
                      <Badge variant="outline">3</Badge>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm text-muted-foreground">Verifications Completed</span>
                      <Badge variant="outline">12</Badge>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm text-muted-foreground">Active Users</span>
                      <Badge variant="outline">47</Badge>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>System Health</CardTitle>
                  <CardDescription>Platform status and performance</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-muted-foreground">Database</span>
                      <Badge className="bg-green-100 text-green-800">Healthy</Badge>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-muted-foreground">Hedera Network</span>
                      <Badge className="bg-green-100 text-green-800">Connected</Badge>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-muted-foreground">API Response</span>
                      <Badge variant="outline">Fast</Badge>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* Verification Tab */}
          <TabsContent value="verification" className="space-y-6">
            <Card>
              <CardHeader className="bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-t-lg">
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="flex items-center gap-3 text-xl">
                      <div className="p-2 bg-white/20 rounded-lg">
                        <Shield className="w-6 h-6" />
                      </div>
                      Rights Verification Center
                    </CardTitle>
                    <CardDescription className="text-blue-100 mt-2">
                      Streamlined review and approval for NFT minting on Hedera blockchain
                    </CardDescription>
                  </div>
                  <div className="text-right">
                    <div className="text-2xl font-bold">{pendingRights?.filter(r => r.verificationStatus === 'pending').length || 0}</div>
                    <div className="text-sm text-blue-100">Pending Review</div>
                  </div>
                </div>
                
                <div className="flex gap-4 mt-6 bg-white/10 p-4 rounded-lg backdrop-blur-sm">
                  <div className="flex items-center gap-2 flex-1">
                    <Search className="w-4 h-4 text-white/80" />
                    <Input
                      placeholder="Search rights by title, creator, or content..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="bg-white/20 border-white/30 text-white placeholder:text-white/60 focus:bg-white/30"
                    />
                  </div>
                  <Select value={statusFilter} onValueChange={setStatusFilter}>
                    <SelectTrigger className="w-52 bg-white/20 border-white/30 text-white">
                      <SelectValue placeholder="Filter by status" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Status</SelectItem>
                      <SelectItem value="pending">⏳ Pending Review</SelectItem>
                      <SelectItem value="verified">✅ Verified & Minted</SelectItem>
                      <SelectItem value="rejected">❌ Rejected</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </CardHeader>
              <CardContent>
                {loadingRights ? (
                  <div className="text-center py-12">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
                    <p className="text-muted-foreground">Loading rights for review...</p>
                  </div>
                ) : pendingRights?.length === 0 ? (
                  <div className="text-center py-16">
                    <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
                      <CheckCircle className="w-10 h-10 text-green-600" />
                    </div>
                    <h3 className="text-xl font-semibold mb-3 text-gray-900">All Caught Up!</h3>
                    <p className="text-gray-600 mb-6 max-w-md mx-auto">
                      Excellent work! No rights are currently pending verification. 
                      New submissions will appear here automatically.
                    </p>
                    <div className="flex items-center justify-center gap-2 text-sm text-gray-500">
                      <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                      Monitoring for new submissions...
                    </div>
                  </div>
                ) : (
                  <div className="grid gap-4">
                    {pendingRights?.map((right) => (
                      <Card key={right.id} className="group hover:shadow-md transition-shadow border-l-4 border-l-blue-400 bg-gradient-to-r from-blue-50/50 to-transparent">
                        <CardContent className="p-0">
                          <div className="grid grid-cols-1 lg:grid-cols-4 gap-0">
                            {/* Main Content - 2 columns */}
                            <div className="lg:col-span-2 p-6">
                              <div className="space-y-4">
                                <div className="flex items-start justify-between">
                                  <div className="flex-1">
                                    <div className="flex items-center gap-3 mb-2">
                                      <h3 className="text-lg font-bold text-gray-900">{right.title}</h3>
                                      <VerificationBadge status={right.verificationStatus} />
                                    </div>
                                    <p className="text-gray-600 text-sm leading-relaxed line-clamp-2">
                                      {right.description}
                                    </p>
                                  </div>
                                </div>
                                
                                <div className="flex items-center gap-3 flex-wrap">
                                  <Badge variant="outline" className="font-medium bg-white">
                                    {right.type}
                                  </Badge>
                                  {right.price && (
                                    <Badge variant="secondary" className="bg-green-100 text-green-800">
                                      {right.price} {right.currency || 'HBAR'}
                                    </Badge>
                                  )}
                                  {right.contentSource && (
                                    <Badge variant="outline" className="text-xs">
                                      {right.contentSource.replace('_', ' ')}
                                    </Badge>
                                  )}
                                  {right.contentFileUrl && (
                                    <a 
                                      href={right.contentFileUrl} 
                                      target="_blank" 
                                      rel="noopener noreferrer"
                                      className="text-xs text-blue-600 hover:text-blue-800 flex items-center gap-1 font-medium"
                                    >
                                      <FileText className="w-3 h-3" />
                                      View Submitted Document
                                    </a>
                                  )}
                                  {right.ownershipDocumentUrl && (
                                    <a 
                                      href={right.ownershipDocumentUrl} 
                                      target="_blank" 
                                      rel="noopener noreferrer"
                                      className="text-xs text-green-600 hover:text-green-800 flex items-center gap-1 font-medium"
                                    >
                                      <FileText className="w-3 h-3" />
                                      Ownership Proof
                                    </a>
                                  )}
                                  <div className="text-xs text-gray-500">
                                    {new Date(right.createdAt).toLocaleDateString()}
                                  </div>
                                </div>

                                {right.contentSource && (
                                  <div className="bg-white p-3 rounded-lg border border-gray-200">
                                    <div className="text-xs font-medium text-gray-500 mb-1">Content Source</div>
                                    <div className="text-sm text-gray-800">{right.contentSource}</div>
                                  </div>
                                )}
                              </div>
                            </div>

                            {/* Creator Info - 1 column */}
                            <div className="p-6 bg-gray-50/50 border-l border-gray-200">
                              <div className="space-y-3">
                                <div className="text-xs font-medium text-gray-500 uppercase tracking-wide">Creator</div>
                                <div className="flex items-center gap-3">
                                  <div className="w-8 h-8 rounded-full bg-blue-600 flex items-center justify-center text-white font-bold text-sm">
                                    {right.creator?.username.charAt(0).toUpperCase()}
                                  </div>
                                  <div>
                                    <div className="font-medium text-sm">{right.creator?.username}</div>
                                    <div className="text-xs text-gray-500">{right.creator?.email}</div>
                                  </div>
                                </div>
                                {right.creator?.walletAddress && (
                                  <div>
                                    <div className="text-xs font-medium text-gray-500 mb-1">Wallet</div>
                                    <div className="font-mono text-xs bg-white p-2 rounded border text-gray-700 break-all">
                                      {right.creator.walletAddress.substring(0, 20)}...
                                    </div>
                                  </div>
                                )}
                              </div>
                            </div>

                            {/* Quick Actions - 1 column */}
                            <div className="p-6 bg-white border-l border-gray-200">
                              <div className="space-y-3">
                                <div className="text-xs font-medium text-gray-500 uppercase tracking-wide">Quick Actions</div>
                                
                                {/* Quick Approve/Reject Buttons */}
                                <div className="space-y-2">
                                  <Button
                                    onClick={() => {
                                      console.log(`Quick approving right ${right.id}`);
                                      verifyRightMutation.mutate({
                                        rightId: right.id,
                                        status: "verified",
                                        notes: "Quick approval - content verified"
                                      });
                                    }}
                                    disabled={verifyRightMutation.isPending || right.verificationStatus === 'verified'}
                                    className={`w-full h-9 text-sm ${
                                      right.verificationStatus === 'verified' 
                                        ? 'bg-green-100 text-green-600 cursor-not-allowed' 
                                        : 'bg-green-600 hover:bg-green-700 text-white'
                                    }`}
                                  >
                                    {right.verificationStatus === 'verified' ? (
                                      <>
                                        <CheckCircle className="w-3 h-3 mr-2" />
                                        Approved ✓
                                      </>
                                    ) : verifyRightMutation.isPending ? (
                                      <div className="animate-spin rounded-full h-3 w-3 border-b-2 border-white mr-2"></div>
                                    ) : (
                                      <>
                                        <CheckCircle className="w-3 h-3 mr-2" />
                                        Quick Approve
                                      </>
                                    )}
                                  </Button>
                                  
                                  <Button
                                    onClick={() => {
                                      console.log(`Quick rejecting right ${right.id}`);
                                      verifyRightMutation.mutate({
                                        rightId: right.id,
                                        status: "rejected",
                                        notes: "Content does not meet verification requirements"
                                      });
                                    }}
                                    disabled={verifyRightMutation.isPending || right.verificationStatus === 'rejected'}
                                    variant="outline"
                                    className={`w-full h-9 text-sm ${
                                      right.verificationStatus === 'rejected'
                                        ? 'border-red-200 text-red-400 cursor-not-allowed bg-red-50'
                                        : 'border-red-200 text-red-600 hover:bg-red-50'
                                    }`}
                                  >
                                    {right.verificationStatus === 'rejected' ? (
                                      <>
                                        <XCircle className="w-3 h-3 mr-2" />
                                        Rejected ✗
                                      </>
                                    ) : (
                                      <>
                                        <XCircle className="w-3 h-3 mr-2" />
                                        Quick Reject
                                      </>
                                    )}
                                  </Button>
                                </div>

                                <div className="border-t pt-3">
                                  <Dialog>
                                    <DialogTrigger asChild>
                                      <Button 
                                        variant="outline"
                                        size="sm"
                                        onClick={() => setSelectedRight(right)}
                                        className="w-full h-9 text-sm"
                                      >
                                        <Shield className="w-3 h-3 mr-2" />
                                        Detailed Review
                                      </Button>
                                    </DialogTrigger>
                                    <DialogContent className="max-w-5xl max-h-[90vh] overflow-y-auto">
                                      <DialogHeader>
                                        <DialogTitle className="flex items-center gap-2 text-xl">
                                          <Shield className="w-6 h-6" />
                                          Rights Verification Review: {selectedRight?.title}
                                        </DialogTitle>
                                      </DialogHeader>
                                      
                                      <div className="space-y-8">
                                        {/* Comprehensive Right Information */}
                                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                                          {/* Left Column - Basic Details */}
                                          <div className="space-y-4">
                                            <Card className="border-blue-200 bg-blue-50">
                                              <CardHeader className="pb-3">
                                                <CardTitle className="text-sm text-blue-800">Basic Information</CardTitle>
                                              </CardHeader>
                                              <CardContent className="space-y-3">
                                                <div className="grid grid-cols-2 gap-3 text-sm">
                                                  <div>
                                                    <div className="font-medium text-gray-600">Right Type</div>
                                                    <Badge variant="outline" className="mt-1">{selectedRight?.type}</Badge>
                                                  </div>
                                                  <div>
                                                    <div className="font-medium text-gray-600">Pricing</div>
                                                    <div className="text-gray-800">{selectedRight?.price || 'Free'} {selectedRight?.currency || 'HBAR'}</div>
                                                  </div>
                                                  <div>
                                                    <div className="font-medium text-gray-600">Current Status</div>
                                                    <VerificationBadge status={selectedRight?.verificationStatus} className="mt-1" />
                                                  </div>
                                                  <div>
                                                    <div className="font-medium text-gray-600">Submitted</div>
                                                    <div className="text-gray-800">{selectedRight && new Date(selectedRight.createdAt).toLocaleDateString()}</div>
                                                  </div>
                                                </div>
                                              </CardContent>
                                            </Card>

                                            {/* Content Description */}
                                            <Card className="border-green-200 bg-green-50">
                                              <CardHeader className="pb-3">
                                                <CardTitle className="text-sm text-green-800">Content Description</CardTitle>
                                              </CardHeader>
                                              <CardContent>
                                                <p className="text-sm leading-relaxed text-gray-700">
                                                  {selectedRight?.description || 'No description provided'}
                                                </p>
                                              </CardContent>
                                            </Card>

                                            {/* Content Source */}
                                            {selectedRight?.contentSource && (
                                              <Card className="border-purple-200 bg-purple-50">
                                                <CardHeader className="pb-3">
                                                  <CardTitle className="text-sm text-purple-800">Content Source</CardTitle>
                                                </CardHeader>
                                                <CardContent>
                                                  <div className="text-sm">
                                                    <div className="font-medium text-gray-600 mb-1">Source Type</div>
                                                    <div className="text-gray-800 bg-white p-2 rounded border">
                                                      {selectedRight.contentSource}
                                                    </div>
                                                  </div>
                                                </CardContent>
                                              </Card>
                                            )}
                                          </div>

                                          {/* Right Column - Creator & Ownership Info */}
                                          <div className="space-y-4">
                                            <Card className="border-amber-200 bg-amber-50">
                                              <CardHeader className="pb-3">
                                                <CardTitle className="text-sm text-amber-800">Creator Information</CardTitle>
                                              </CardHeader>
                                              <CardContent className="space-y-3">
                                                <div className="flex items-center gap-3">
                                                  <div className="w-10 h-10 rounded-full bg-amber-200 flex items-center justify-center">
                                                    <span className="font-bold text-amber-800">
                                                      {selectedRight?.creator?.username.charAt(0).toUpperCase()}
                                                    </span>
                                                  </div>
                                                  <div>
                                                    <div className="font-medium text-gray-800">{selectedRight?.creator?.username}</div>
                                                    <div className="text-sm text-gray-600">{selectedRight?.creator?.email}</div>
                                                  </div>
                                                </div>
                                                {selectedRight?.creator?.walletAddress && (
                                                  <div>
                                                    <div className="font-medium text-gray-600 text-xs mb-1">Wallet Address</div>
                                                    <div className="font-mono text-xs bg-white p-2 rounded border break-all">
                                                      {selectedRight.creator.walletAddress}
                                                    </div>
                                                  </div>
                                                )}
                                              </CardContent>
                                            </Card>

                                            {/* Verification History */}
                                            <Card className="border-gray-200 bg-gray-50">
                                              <CardHeader className="pb-3">
                                                <CardTitle className="text-sm text-gray-800">Verification History</CardTitle>
                                              </CardHeader>
                                              <CardContent>
                                                <div className="space-y-2 text-sm">
                                                  <div className="flex justify-between">
                                                    <span className="text-gray-600">Initial Status:</span>
                                                    <span className="text-gray-800">Pending Review</span>
                                                  </div>
                                                  {selectedRight?.verificationNotes && (
                                                    <div>
                                                      <div className="text-gray-600 mb-1">Previous Notes:</div>
                                                      <div className="bg-white p-2 rounded border text-gray-700 text-xs">
                                                        {selectedRight.verificationNotes}
                                                      </div>
                                                    </div>
                                                  )}
                                                </div>
                                              </CardContent>
                                            </Card>

                                            {/* Additional Metadata */}
                                            {selectedRight?.metadata && Object.keys(selectedRight.metadata).length > 0 && (
                                              <Card className="border-indigo-200 bg-indigo-50">
                                                <CardHeader className="pb-3">
                                                  <CardTitle className="text-sm text-indigo-800">Additional Metadata</CardTitle>
                                                </CardHeader>
                                                <CardContent>
                                                  <pre className="text-xs bg-white p-2 rounded border overflow-auto text-gray-700">
                                                    {JSON.stringify(selectedRight.metadata, null, 2)}
                                                  </pre>
                                                </CardContent>
                                              </Card>
                                            )}
                                          </div>
                                        </div>

                                        {/* File Attachments Section */}
                                        <Card className="border-2 border-dashed border-gray-300">
                                          <CardHeader>
                                            <CardTitle className="flex items-center gap-2">
                                              <FileText className="w-5 h-5" />
                                              Supporting Documents & Files
                                            </CardTitle>
                                          </CardHeader>
                                          <CardContent>
                                            {/* Simulated file display - in real implementation, this would show actual uploaded files */}
                                            <div className="space-y-3">
                                              <div className="text-sm text-gray-600 mb-3">
                                                Review all supporting documentation before making a verification decision:
                                              </div>
                                              
                                              {/* Example files based on content source */}
                                              {selectedRight?.contentSource === 'YouTube Video' ? (
                                                <div className="space-y-2">
                                                  <div className="flex items-center gap-3 p-3 bg-red-50 border border-red-200 rounded">
                                                    <Video className="w-5 h-5 text-red-600" />
                                                    <div className="flex-1">
                                                      <div className="font-medium text-sm">YouTube Video Link</div>
                                                      <div className="text-xs text-gray-600">Video ownership verification required</div>
                                                    </div>
                                                    <Button variant="outline" size="sm">View Video</Button>
                                                  </div>
                                                  <div className="flex items-center gap-3 p-3 bg-green-50 border border-green-200 rounded">
                                                    <FileText className="w-5 h-5 text-green-600" />
                                                    <div className="flex-1">
                                                      <div className="font-medium text-sm">Channel Ownership Proof</div>
                                                      <div className="text-xs text-gray-600">Screenshot or verification code</div>
                                                    </div>
                                                    <Button variant="outline" size="sm">Review Proof</Button>
                                                  </div>
                                                </div>
                                              ) : selectedRight?.contentSource === 'Music Track' ? (
                                                <div className="space-y-2">
                                                  <div className="flex items-center gap-3 p-3 bg-purple-50 border border-purple-200 rounded">
                                                    <Music className="w-5 h-5 text-purple-600" />
                                                    <div className="flex-1">
                                                      <div className="font-medium text-sm">Audio File</div>
                                                      <div className="text-xs text-gray-600">Original music track for verification</div>
                                                    </div>
                                                    <Button variant="outline" size="sm">Play Audio</Button>
                                                  </div>
                                                  <div className="flex items-center gap-3 p-3 bg-blue-50 border border-blue-200 rounded">
                                                    <FileText className="w-5 h-5 text-blue-600" />
                                                    <div className="flex-1">
                                                      <div className="font-medium text-sm">Copyright Documentation</div>
                                                      <div className="text-xs text-gray-600">Proof of authorship and ownership</div>
                                                    </div>
                                                    <Button variant="outline" size="sm">View Docs</Button>
                                                  </div>
                                                </div>
                                              ) : (
                                                <div className="text-center py-6 text-gray-500">
                                                  <FileText className="w-12 h-12 mx-auto mb-2 text-gray-300" />
                                                  <div className="text-sm">No supporting files uploaded</div>
                                                  <div className="text-xs">Manual verification required</div>
                                                </div>
                                              )}
                                            </div>
                                          </CardContent>
                                        </Card>

                                        {/* Verification Decision Section */}
                                        <Card className="border-2 border-yellow-300 bg-yellow-50">
                                          <CardHeader>
                                            <CardTitle className="flex items-center gap-2 text-yellow-800">
                                              <Settings className="w-5 h-5" />
                                              Verification Decision
                                            </CardTitle>
                                          </CardHeader>
                                          <CardContent className="space-y-4">
                                            {/* Verification Notes */}
                                            <div className="space-y-2">
                                              <label className="text-sm font-medium">Detailed Verification Notes</label>
                                              <Textarea
                                                value={verificationNotes}
                                                onChange={(e) => setVerificationNotes(e.target.value)}
                                                placeholder="Document your verification decision with detailed notes explaining:&#10;• What evidence was reviewed&#10;• Why the decision was made&#10;• Any concerns or recommendations&#10;• Next steps if applicable"
                                                rows={6}
                                                className="resize-none"
                                              />
                                            </div>

                                            {/* Verification Checklist */}
                                            <div className="bg-white p-4 rounded border">
                                              <div className="text-sm font-medium mb-3">Verification Checklist</div>
                                              <div className="space-y-2 text-sm">
                                                <div className="flex items-center gap-2">
                                                  <input type="checkbox" className="rounded" />
                                                  <span>Creator identity and ownership verified</span>
                                                </div>
                                                <div className="flex items-center gap-2">
                                                  <input type="checkbox" className="rounded" />
                                                  <span>Content authenticity confirmed</span>
                                                </div>
                                                <div className="flex items-center gap-2">
                                                  <input type="checkbox" className="rounded" />
                                                  <span>Supporting documentation reviewed</span>
                                                </div>
                                                <div className="flex items-center gap-2">
                                                  <input type="checkbox" className="rounded" />
                                                  <span>No copyright conflicts detected</span>
                                                </div>
                                                <div className="flex items-center gap-2">
                                                  <input type="checkbox" className="rounded" />
                                                  <span>Pricing and terms are reasonable</span>
                                                </div>
                                              </div>
                                            </div>

                                            {/* Warning Banner */}
                                            <div className="bg-red-50 border border-red-200 p-4 rounded-lg">
                                              <div className="flex items-start gap-3">
                                                <AlertTriangle className="w-5 h-5 text-red-600 mt-0.5 flex-shrink-0" />
                                                <div className="text-sm">
                                                  <div className="font-medium text-red-800 mb-1">Critical Decision Point</div>
                                                  <div className="text-red-700 leading-relaxed">
                                                    <strong>APPROVAL</strong> will immediately trigger NFT minting on Hedera blockchain and make this right tradeable. 
                                                    This action is <strong>irreversible</strong>. Ensure all verification steps are complete before proceeding.
                                                  </div>
                                                </div>
                                              </div>
                                            </div>

                                            {/* Action Buttons */}
                                            <div className="flex gap-3 pt-4">
                                              <Button
                                                onClick={() => handleVerification("verified")}
                                                disabled={verifyRightMutation.isPending}
                                                className="bg-green-600 hover:bg-green-700 flex-1 h-12"
                                              >
                                                {verifyRightMutation.isPending ? (
                                                  <>
                                                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                                                    Minting Live NFT on Hedera...
                                                  </>
                                                ) : (
                                                  <>
                                                    <CheckCircle className="w-5 h-5 mr-2" />
                                                    APPROVE RIGHT
                                                  </>
                                                )}
                                              </Button>
                                              <Button
                                                variant="destructive"
                                                onClick={() => handleVerification("rejected")}
                                                disabled={verifyRightMutation.isPending}
                                                className="flex-1 h-12"
                                              >
                                                <XCircle className="w-5 h-5 mr-2" />
                                                REJECT RIGHT
                                              </Button>
                                            </div>
                                          </CardContent>
                                        </Card>
                                      </div>
                                    </DialogContent>
                                  </Dialog>
                                </div>
                              </div>
                            </div>
                          </div>

                            {/* NFT Preview for verified rights */}
                            {right.verificationStatus === 'verified' && right.hederaTokenId && (
                              <div className="px-6 pb-6 border-t bg-green-50/30">
                                <div className="pt-4">
                                  <div className="text-xs font-medium text-green-700 mb-3 uppercase tracking-wide">✓ Verified & Minted NFT</div>
                                  <NFTViewer 
                                    nftData={{
                                      tokenId: right.hederaTokenId,
                                      serialNumber: right.hederaSerialNumber || 1,
                                      transactionId: right.hederaTransactionId || '',
                                      explorerUrl: `https://hashscan.io/testnet/transaction/${right.hederaTransactionId}`,
                                      name: right.title,
                                      symbol: 'DRIGHT',
                                      metadata: right.metadata || {},
                                      rightType: right.type,
                                      contentSource: right.contentSource
                                    }}
                                    className="border-green-200"
                                  />
                                </div>
                              </div>
                            )}
                        </CardContent>
                      </Card>
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
                <CardDescription>Manage platform users and permissions</CardDescription>
              </CardHeader>
              <CardContent>
                {loadingUsers ? (
                  <div className="text-center py-8">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-2"></div>
                    <p className="text-muted-foreground">Loading users...</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {users?.map((user) => (
                      <div key={user.id} className="flex items-center justify-between p-4 border rounded">
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

          {/* Performance Tab */}
          <TabsContent value="performance" className="space-y-6">
            <PerformanceDashboard />
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
        </Tabs>
      </div>
    </div>
  );
}