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
  Settings
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
                  <div className="text-center py-8">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-2"></div>
                    <p className="text-muted-foreground">Loading rights...</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {pendingRights?.map((right) => (
                      <div key={right.id} className="flex items-center justify-between p-4 border rounded">
                        <div className="flex-1">
                          <h3 className="font-semibold">{right.title}</h3>
                          <p className="text-sm text-muted-foreground">{right.description}</p>
                          <div className="flex items-center gap-2 mt-2">
                            <Badge variant="outline">{right.type}</Badge>
                            <VerificationBadge status={right.verificationStatus} />
                          </div>
                        </div>
                        <div className="flex gap-2">
                          <Dialog>
                            <DialogTrigger asChild>
                              <Button 
                                variant="outline" 
                                size="sm"
                                onClick={() => setSelectedRight(right)}
                              >
                                Review
                              </Button>
                            </DialogTrigger>
                            <DialogContent>
                              <DialogHeader>
                                <DialogTitle>Verify Right: {selectedRight?.title}</DialogTitle>
                              </DialogHeader>
                              <div className="space-y-4">
                                <div>
                                  <label className="text-sm font-medium">Verification Notes</label>
                                  <Textarea
                                    value={verificationNotes}
                                    onChange={(e) => setVerificationNotes(e.target.value)}
                                    placeholder="Add notes about the verification..."
                                  />
                                </div>
                                <div className="flex gap-2">
                                  <Button
                                    onClick={() => handleVerification("verified")}
                                    disabled={verifyRightMutation.isPending}
                                    className="bg-green-600 hover:bg-green-700"
                                  >
                                    <CheckCircle className="w-4 h-4 mr-2" />
                                    Verify
                                  </Button>
                                  <Button
                                    variant="destructive"
                                    onClick={() => handleVerification("rejected")}
                                    disabled={verifyRightMutation.isPending}
                                  >
                                    <XCircle className="w-4 h-4 mr-2" />
                                    Reject
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