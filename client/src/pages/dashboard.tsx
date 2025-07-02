import { useState, useEffect } from "react";
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
  Menu,
  Settings,
  Maximize2,
  Minimize2,
  X,
  Target,
  PieChart,
  Activity,
  Globe
} from "lucide-react";
import { RightCard } from "@/components/right-card";
import { VerificationBadge } from "@/components/verification-badge";
import { useSession } from "@/hooks/use-session";
import type { RightWithCreator, User } from "@shared/schema";

// Widget types and configuration
interface DashboardWidget {
  id: string;
  type: 'stats' | 'chart' | 'activity' | 'goals' | 'market';
  title: string;
  icon: any;
  iconName: string;
  size: 'small' | 'medium' | 'large';
  position: { x: number; y: number };
  visible: boolean;
  config?: any;
}

export default function Dashboard() {
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [editMode, setEditMode] = useState(false);
  const [widgets, setWidgets] = useState<DashboardWidget[]>([
    {
      id: 'earnings',
      type: 'stats',
      title: 'Total Earnings',
      icon: DollarSign,
      iconName: 'DollarSign',
      size: 'small',
      position: { x: 0, y: 0 },
      visible: true
    },
    {
      id: 'rights',
      type: 'stats', 
      title: 'My Rights',
      icon: Crown,
      iconName: 'Crown',
      size: 'small',
      position: { x: 1, y: 0 },
      visible: true
    },
    {
      id: 'views',
      type: 'stats',
      title: 'Total Views',
      icon: Eye,
      iconName: 'Eye',
      size: 'small', 
      position: { x: 2, y: 0 },
      visible: true
    },
    {
      id: 'performance',
      type: 'chart',
      title: 'Performance Overview',
      icon: BarChart3,
      iconName: 'BarChart3',
      size: 'large',
      position: { x: 0, y: 1 },
      visible: true
    },
    {
      id: 'activity',
      type: 'activity',
      title: 'Recent Activity',
      icon: Activity,
      iconName: 'Activity',
      size: 'medium',
      position: { x: 1, y: 1 },
      visible: true
    },
    {
      id: 'goals',
      type: 'goals',
      title: 'Monthly Goals',
      icon: Target,
      iconName: 'Target',
      size: 'medium',
      position: { x: 2, y: 1 },
      visible: true
    }
  ]);
  const { isAuthenticated, user } = useSession();

  // Icon mapping for restoring icons from localStorage
  const iconMap = {
    'DollarSign': DollarSign,
    'Crown': Crown,
    'Eye': Eye,
    'BarChart3': BarChart3,
    'Activity': Activity,
    'Target': Target
  };

  // Load widget configuration from localStorage
  useEffect(() => {
    const savedWidgets = localStorage.getItem('dashboard-widgets');
    if (savedWidgets) {
      try {
        const parsedWidgets = JSON.parse(savedWidgets);
        // Restore icon functions from the icon map
        const restoredWidgets = parsedWidgets.map((widget: any) => ({
          ...widget,
          icon: iconMap[widget.iconName as keyof typeof iconMap] || DollarSign
        }));
        setWidgets(restoredWidgets);
      } catch (error) {
        console.error('Failed to load widget configuration:', error);
      }
    }
  }, []);

  // Save widget configuration to localStorage
  useEffect(() => {
    localStorage.setItem('dashboard-widgets', JSON.stringify(widgets));
  }, [widgets]);

  // Widget management functions
  const toggleWidget = (widgetId: string) => {
    setWidgets(prev => 
      prev.map(widget => 
        widget.id === widgetId 
          ? { ...widget, visible: !widget.visible }
          : widget
      )
    );
  };

  const resizeWidget = (widgetId: string, newSize: 'small' | 'medium' | 'large') => {
    setWidgets(prev =>
      prev.map(widget =>
        widget.id === widgetId
          ? { ...widget, size: newSize }
          : widget
      )
    );
  };

  const resetToDefault = () => {
    const defaultWidgets: DashboardWidget[] = [
      {
        id: 'earnings',
        type: 'stats',
        title: 'Total Earnings',
        icon: DollarSign,
        iconName: 'DollarSign',
        size: 'small',
        position: { x: 0, y: 0 },
        visible: true
      },
      {
        id: 'rights',
        type: 'stats', 
        title: 'My Rights',
        icon: Crown,
        iconName: 'Crown',
        size: 'small',
        position: { x: 1, y: 0 },
        visible: true
      },
      {
        id: 'views',
        type: 'stats',
        title: 'Total Views',
        icon: Eye,
        iconName: 'Eye',
        size: 'small', 
        position: { x: 2, y: 0 },
        visible: true
      },
      {
        id: 'performance',
        type: 'chart',
        title: 'Performance Overview',
        icon: BarChart3,
        iconName: 'BarChart3',
        size: 'large',
        position: { x: 0, y: 1 },
        visible: true
      },
      {
        id: 'activity',
        type: 'activity',
        title: 'Recent Activity',
        icon: Activity,
        iconName: 'Activity',
        size: 'medium',
        position: { x: 1, y: 1 },
        visible: true
      },
      {
        id: 'goals',
        type: 'goals',
        title: 'Monthly Goals',
        icon: Target,
        iconName: 'Target',
        size: 'medium',
        position: { x: 2, y: 1 },
        visible: true
      }
    ];
    setWidgets(defaultWidgets);
  };

  const getWidgetSizeClass = (size: string) => {
    switch (size) {
      case 'small': return 'col-span-1';
      case 'medium': return 'col-span-2';
      case 'large': return 'col-span-3';
      default: return 'col-span-1';
    }
  };

  // Widget content renderer
  const renderWidgetContent = (widget: DashboardWidget) => {
    switch (widget.type) {
      case 'stats':
        return renderStatsWidget(widget);
      case 'chart':
        return renderChartWidget(widget);
      case 'activity':
        return renderActivityWidget(widget);
      case 'goals':
        return renderGoalsWidget(widget);
      default:
        return <div>Widget content</div>;
    }
  };

  const renderStatsWidget = (widget: DashboardWidget) => {
    let value = "0";
    let description = "";
    
    switch (widget.id) {
      case 'earnings':
        value = "$0.00";
        description = "Total earnings from all rights";
        break;
      case 'rights':
        value = totalRights.toString();
        description = "Rights you've created";
        break;
      case 'views':
        value = "0";
        description = "Total views across all rights";
        break;
    }

    return (
      <div className="text-center">
        <div className="text-3xl font-bold text-primary mb-2">{value}</div>
        <div className="text-sm text-muted-foreground">{description}</div>
      </div>
    );
  };

  const renderChartWidget = (widget: DashboardWidget) => (
    <div className="space-y-4">
      <div className="text-center text-muted-foreground">
        <BarChart3 className="w-12 h-12 mx-auto mb-2 opacity-50" />
        <p>Performance charts coming soon</p>
      </div>
    </div>
  );

  const renderActivityWidget = (widget: DashboardWidget) => (
    <div className="space-y-3">
      {recentActivity.length === 0 ? (
        <div className="text-center text-muted-foreground py-4">
          <Activity className="w-8 h-8 mx-auto mb-2 opacity-50" />
          <p className="text-sm">No recent activity</p>
        </div>
      ) : (
        recentActivity.slice(0, 3).filter(isValidActivity).map((activity: any, index: number) => (
          <div key={index} className="flex items-center gap-3 p-2 border rounded">
            <div className="w-8 h-8 bg-primary/10 rounded-full flex items-center justify-center">
              <CheckCircle className="w-4 h-4 text-primary" />
            </div>
            <div className="flex-1 text-sm">
              <div className="font-medium">{activity.title}</div>
              <div className="text-xs text-muted-foreground">{activity.time}</div>
            </div>
          </div>
        ))
      )}
    </div>
  );

  const renderGoalsWidget = (widget: DashboardWidget) => (
    <div className="space-y-4">
      <div className="space-y-3">
        <div>
          <div className="flex justify-between text-sm mb-1">
            <span>Rights Created</span>
            <span>{totalRights}/5</span>
          </div>
          <Progress value={(totalRights / 5) * 100} className="h-2" />
        </div>
        <div>
          <div className="flex justify-between text-sm mb-1">
            <span>Monthly Earnings</span>
            <span>$0/$100</span>
          </div>
          <Progress value={0} className="h-2" />
        </div>
        <div>
          <div className="flex justify-between text-sm mb-1">
            <span>Profile Views</span>
            <span>0/50</span>
          </div>
          <Progress value={0} className="h-2" />
        </div>
      </div>
    </div>
  );

  // Fetch user's rights only if authenticated
  const { data: userRights = [], isLoading: rightsLoading } = useQuery<RightWithCreator[]>({
    queryKey: ["/api/rights", "user", user?.id],
    queryFn: () => fetch(`/api/rights?creatorId=${user?.id}`).then(res => res.json()),
    enabled: !!user?.id,
  });

  // Get real user stats from API only if authenticated  
  const { data: userStats, isLoading: statsLoading } = useQuery({
    queryKey: ['/api/users/stats', user?.id],
    queryFn: () => fetch(`/api/users/${user?.id}/stats`).then(res => res.json()),
    enabled: !!user?.id,
    retry: false,
  });

  const { data: userActivity, isLoading: activityLoading } = useQuery({
    queryKey: ['/api/users/activity', user?.id], 
    queryFn: () => fetch(`/api/users/${user?.id}/activity`).then(res => res.json()),
    enabled: !!user?.id,
    retry: false,
  });

  // Guard: Redirect if not authenticated
  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold mb-4">Access Restricted</h2>
          <p className="text-muted-foreground mb-6">Please connect your wallet to access the dashboard.</p>
          <Link href="/">
            <Button>Return Home</Button>
          </Link>
        </div>
      </div>
    );
  }

  // Calculate dashboard metrics from real data
  const totalRights = userRights.length;
  const activeListings = userRights.filter(right => right.isListed).length;
  const totalViews = userRights.reduce((sum, right) => sum + (right.views || 0), 0);
  const totalRevenue = userStats?.totalRevenue || "0.00";

  const verifiedRights = userRights.filter(right => right.verificationStatus === "verified").length;
  const pendingRights = userRights.filter(right => right.verificationStatus === "pending").length;

  const dashboardStats = [
    {
      title: "Total Rights",
      value: totalRights.toString(),
      description: "Rights you've created",
      icon: Crown,
      change: totalRights > 0 ? "Recently created" : "Get started",
      changeType: "neutral" as const
    },
    {
      title: "Active Listings",
      value: activeListings.toString(),
      description: "Currently for sale",
      icon: Gavel,
      change: totalRights > 0 ? `${Math.round((activeListings / totalRights) * 100)}% of portfolio` : "No listings yet",
      changeType: "neutral" as const
    },
    {
      title: "Total Views",
      value: totalViews.toLocaleString(),
      description: "Across all rights",
      icon: Eye,
      change: totalViews > 0 ? "Accumulating views" : "Pending views",
      changeType: "neutral" as const
    },
    {
      title: "Revenue Generated", 
      value: statsLoading ? "..." : `${totalRevenue} ETH`,
      description: "From sales & royalties",
      icon: DollarSign,
      change: totalRevenue !== "0.00" ? "Earnings tracked" : "No revenue yet",
      changeType: "neutral" as const
    }
  ];

  // Use real activity data from API
  const recentActivity = activityLoading ? [] : (userActivity || []);
  
  // Type guard for activity data
  const isValidActivity = (activity: any): activity is {
    type: string;
    title: string;
    description: string;
    time: string;
    amount?: string;
  } => {
    return activity && typeof activity.type === 'string' && typeof activity.title === 'string';
  };

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
                {editMode ? "Customize your dashboard widgets" : "Manage your digital rights portfolio and track performance"}
              </p>
            </div>
            <div className="flex gap-2">
              <Button 
                variant={editMode ? "default" : "outline"} 
                size="sm"
                onClick={() => setEditMode(!editMode)}
              >
                <Settings className="h-4 w-4 mr-2" />
                {editMode ? "Done" : "Customize"}
              </Button>
              <Button className="gap-2" onClick={() => setShowCreateModal(true)}>
                <Plus className="h-4 w-4" />
                Create New Right
              </Button>
            </div>
          </div>

        {/* User Profile Card */}
        {user && (
          <Card className="border-2 border-blue-200 dark:border-blue-800 bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-950 dark:to-indigo-950">
            <CardContent className="p-6">
              <div className="flex items-center gap-4">
                <Avatar className="h-16 w-16">
                  <AvatarImage src={user.profileImageUrl || ""} />
                  <AvatarFallback className="text-lg">
                    {user.username?.charAt(0).toUpperCase() || "U"}
                  </AvatarFallback>
                </Avatar>
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <h2 className="text-xl font-semibold">{user.username || "Creator"}</h2>
                    <VerificationBadge status="verified" size="sm" />
                  </div>
                  <p className="text-muted-foreground">Digital Rights Creator</p>
                  <div className="flex items-center gap-4 mt-2">
                    <div className="flex items-center gap-1">
                      <Users className="h-4 w-4" />
                      <span className="text-sm">Connected</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <Heart className="h-4 w-4" />
                      <span className="text-sm">{totalRights} rights</span>
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

        {/* Personalized Widget Grid */}
        <div className="space-y-4">
          {editMode && (
            <Card className="border-dashed border-2 border-primary/50 bg-primary/5">
              <CardContent className="p-4">
                <div className="flex items-center gap-2 mb-2">
                  <Settings className="h-4 w-4 text-primary" />
                  <span className="font-medium text-primary">Widget Controls</span>
                </div>
                <div className="flex flex-wrap gap-2 justify-between">
                  <div className="flex flex-wrap gap-2">
                    {widgets.map((widget) => (
                      <Button
                        key={widget.id}
                        variant={widget.visible ? "default" : "outline"}
                        size="sm"
                        onClick={() => toggleWidget(widget.id)}
                        className="text-xs"
                      >
                        {widget.icon && <widget.icon className="h-3 w-3 mr-1" />}
                        {widget.title}
                      </Button>
                    ))}
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={resetToDefault}
                    className="text-xs"
                  >
                    Reset to Default
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}
          
          <div className="grid gap-6 grid-cols-1 md:grid-cols-2 lg:grid-cols-3">
            {widgets
              .filter(widget => widget.visible)
              .map((widget) => (
                <Card 
                  key={widget.id} 
                  className={`relative overflow-hidden ${getWidgetSizeClass(widget.size)} ${editMode ? 'border-primary/50 shadow-lg' : ''}`}
                >
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium flex items-center gap-2">
                      {widget.icon && <widget.icon className="h-4 w-4 text-primary" />}
                      {widget.title}
                    </CardTitle>
                    {editMode && (
                      <div className="flex gap-1">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => resizeWidget(widget.id, widget.size === 'small' ? 'medium' : widget.size === 'medium' ? 'large' : 'small')}
                          className="h-6 w-6 p-0"
                        >
                          {widget.size === 'small' ? <Maximize2 className="h-3 w-3" /> : <Minimize2 className="h-3 w-3" />}
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => toggleWidget(widget.id)}
                          className="h-6 w-6 p-0"
                        >
                          <X className="h-3 w-3" />
                        </Button>
                      </div>
                    )}
                  </CardHeader>
                  <CardContent>
                    {renderWidgetContent(widget)}
                  </CardContent>
                </Card>
              ))}
          </div>
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
                  {activityLoading ? (
                    <div className="text-center py-4 text-muted-foreground">Loading activity...</div>
                  ) : recentActivity.length > 0 ? (
                    recentActivity.map((activity: any, index: number) => (
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
                              {activity.amount} ETH
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
                      <span>Rights Created</span>
                      <span className="font-medium">{totalRights}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Verified Rights</span>
                      <span className="font-medium">{verifiedRights}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Pending Verification</span>
                      <span className="font-medium">{pendingRights}</span>
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
                  {recentActivity.length === 0 ? (
                    <div className="text-center py-8 text-muted-foreground">
                      No activity yet. Start creating rights to see your activity history.
                    </div>
                  ) : (
                    recentActivity.filter(isValidActivity).map((activity: any, index: number) => (
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
                    ))
                  )}
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