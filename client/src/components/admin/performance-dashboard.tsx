import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Progress } from "@/components/ui/progress";
import { 
  Activity, 
  AlertTriangle, 
  CheckCircle, 
  Clock, 
  Users, 
  Server, 
  Zap,
  TrendingUp,
  AlertCircle,
  RefreshCw,
  Bell,
  BellOff
} from "lucide-react";

interface RealTimeMetrics {
  timestamp: string;
  activeUsers: number;
  pendingVerifications: number;
  recentTransactions: number;
  systemLoad: {
    cpuUsage: number;
    memoryUsage: number;
    responseTime: number;
  };
  hederaNetwork: {
    status: 'healthy' | 'degraded' | 'down';
    lastTransactionTime: string | null;
    pendingTransactions: number;
  };
  verification: {
    averageTime: number;
    successRate: number;
    backlogSize: number;
  };
  revenue: {
    todayTotal: number;
    hourlyRate: number;
    topPerformingCategory: string;
  };
}

interface PerformanceAlert {
  id: string;
  type: 'warning' | 'error' | 'info';
  title: string;
  message: string;
  timestamp: string;
  resolved: boolean;
}

interface PerformanceSummary {
  status: 'healthy' | 'warning' | 'critical';
  uptime: number;
  activeIssues: number;
  lastUpdated: string;
  keyMetrics: {
    activeUsers: number;
    pendingVerifications: number;
    systemLoad: number;
    hederaStatus: string;
  } | null;
}

export function PerformanceDashboard() {
  const [autoRefresh, setAutoRefresh] = useState(true);
  const [refreshInterval, setRefreshInterval] = useState(30000); // 30 seconds

  const { data: metrics, refetch: refetchMetrics } = useQuery<RealTimeMetrics>({
    queryKey: ["/api/admin/performance/metrics"],
    refetchInterval: autoRefresh ? refreshInterval : false,
  });

  const { data: alerts, refetch: refetchAlerts } = useQuery<PerformanceAlert[]>({
    queryKey: ["/api/admin/performance/alerts"],
    refetchInterval: autoRefresh ? refreshInterval : false,
  });

  const { data: summary } = useQuery<PerformanceSummary>({
    queryKey: ["/api/admin/performance/summary"],
    refetchInterval: autoRefresh ? refreshInterval : false,
  });

  const { data: history } = useQuery<RealTimeMetrics[]>({
    queryKey: ["/api/admin/performance/history", { hours: 6 }],
    refetchInterval: autoRefresh ? 60000 : false, // 1 minute for history
  });

  const unresolvedAlerts = alerts?.filter(alert => !alert.resolved) || [];

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'healthy': return 'text-green-600';
      case 'warning': return 'text-yellow-600';
      case 'critical': return 'text-red-600';
      case 'degraded': return 'text-orange-600';
      default: return 'text-gray-600';
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'healthy': return <Badge variant="default" className="bg-green-100 text-green-800">Healthy</Badge>;
      case 'warning': return <Badge variant="secondary" className="bg-yellow-100 text-yellow-800">Warning</Badge>;
      case 'critical': return <Badge variant="destructive">Critical</Badge>;
      case 'degraded': return <Badge variant="outline" className="border-orange-500 text-orange-600">Degraded</Badge>;
      default: return <Badge variant="outline">Unknown</Badge>;
    }
  };

  const formatUptime = (hours: number) => {
    if (hours < 24) return `${hours.toFixed(1)}h`;
    const days = Math.floor(hours / 24);
    const remainingHours = Math.floor(hours % 24);
    return `${days}d ${remainingHours}h`;
  };

  return (
    <div className="space-y-6">
      {/* Header with Auto-refresh Controls */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Performance Dashboard</h2>
          <p className="text-muted-foreground">Real-time monitoring and system health</p>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setAutoRefresh(!autoRefresh)}
          >
            {autoRefresh ? <Bell className="w-4 h-4 mr-2" /> : <BellOff className="w-4 h-4 mr-2" />}
            Auto-refresh {autoRefresh ? 'On' : 'Off'}
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => {
              refetchMetrics();
              refetchAlerts();
            }}
          >
            <RefreshCw className="w-4 h-4 mr-2" />
            Refresh Now
          </Button>
        </div>
      </div>

      {/* System Status Overview */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">System Status</CardTitle>
            <Server className={`h-4 w-4 ${getStatusColor(summary?.status || 'unknown')}`} />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold mb-1">
              {getStatusBadge(summary?.status || 'unknown')}
            </div>
            <p className="text-xs text-muted-foreground">
              Uptime: {summary ? formatUptime(summary.uptime) : 'Unknown'}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Users</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{metrics?.activeUsers || 0}</div>
            <p className="text-xs text-muted-foreground">
              Last hour activity
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Pending Verifications</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{metrics?.pendingVerifications || 0}</div>
            <p className="text-xs text-muted-foreground">
              Avg time: {metrics?.verification.averageTime.toFixed(1) || 0}h
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Alerts</CardTitle>
            <AlertTriangle className={`h-4 w-4 ${unresolvedAlerts.length > 0 ? 'text-red-500' : 'text-muted-foreground'}`} />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{unresolvedAlerts.length}</div>
            <p className="text-xs text-muted-foreground">
              {unresolvedAlerts.length === 0 ? 'All systems normal' : 'Requires attention'}
            </p>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="metrics" className="space-y-4">
        <TabsList>
          <TabsTrigger value="metrics">System Metrics</TabsTrigger>
          <TabsTrigger value="hedera">Hedera Network</TabsTrigger>
          <TabsTrigger value="alerts">Alerts</TabsTrigger>
          <TabsTrigger value="performance">Performance</TabsTrigger>
        </TabsList>

        <TabsContent value="metrics" className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle>System Resources</CardTitle>
                <CardDescription>Current system load and utilization</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <div className="flex justify-between text-sm mb-1">
                    <span>Memory Usage</span>
                    <span>{metrics?.systemLoad.memoryUsage || 0}%</span>
                  </div>
                  <Progress value={metrics?.systemLoad.memoryUsage || 0} />
                </div>
                <div>
                  <div className="flex justify-between text-sm mb-1">
                    <span>CPU Usage</span>
                    <span>{metrics?.systemLoad.cpuUsage || 0}ms</span>
                  </div>
                  <Progress value={Math.min((metrics?.systemLoad.cpuUsage || 0) / 100 * 100, 100)} />
                </div>
                <div className="pt-2 border-t">
                  <div className="flex justify-between text-sm">
                    <span>Response Time</span>
                    <Badge variant="outline">{metrics?.systemLoad.responseTime || 0}ms</Badge>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Verification Metrics</CardTitle>
                <CardDescription>Rights verification performance</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex justify-between items-center">
                  <span className="text-sm">Success Rate</span>
                  <Badge variant="default">{metrics?.verification.successRate || 0}%</Badge>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm">Average Time</span>
                  <Badge variant="outline">{metrics?.verification.averageTime.toFixed(1) || 0}h</Badge>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm">Backlog Size</span>
                  <Badge variant={metrics?.verification.backlogSize || 0 > 20 ? "destructive" : "secondary"}>
                    {metrics?.verification.backlogSize || 0}
                  </Badge>
                </div>
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Recent Activity</CardTitle>
              <CardDescription>Transactions and user activity in the last hour</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid gap-4 md:grid-cols-3">
                <div className="text-center p-4 bg-muted/30 rounded">
                  <div className="text-2xl font-bold">{metrics?.recentTransactions || 0}</div>
                  <p className="text-sm text-muted-foreground">Recent Transactions</p>
                </div>
                <div className="text-center p-4 bg-muted/30 rounded">
                  <div className="text-2xl font-bold">{metrics?.revenue.todayTotal.toFixed(2) || 0} ETH</div>
                  <p className="text-sm text-muted-foreground">Today's Revenue</p>
                </div>
                <div className="text-center p-4 bg-muted/30 rounded">
                  <div className="text-2xl font-bold">{metrics?.revenue.hourlyRate.toFixed(2) || 0} ETH</div>
                  <p className="text-sm text-muted-foreground">Hourly Rate</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="hedera" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Hedera Network Status</CardTitle>
              <CardDescription>Blockchain connectivity and transaction monitoring</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-3">
                  <div className="flex justify-between items-center">
                    <span>Network Status</span>
                    {getStatusBadge(metrics?.hederaNetwork.status || 'unknown')}
                  </div>
                  <div className="flex justify-between items-center">
                    <span>Pending Transactions</span>
                    <Badge variant="outline">{metrics?.hederaNetwork.pendingTransactions || 0}</Badge>
                  </div>
                  <div className="flex justify-between items-center">
                    <span>Last Transaction</span>
                    <Badge variant="secondary">
                      {metrics?.hederaNetwork.lastTransactionTime 
                        ? new Date(metrics.hederaNetwork.lastTransactionTime).toLocaleString()
                        : 'Unknown'
                      }
                    </Badge>
                  </div>
                </div>
                <div className="space-y-3">
                  <div className="p-4 bg-muted/30 rounded">
                    <p className="text-sm font-medium mb-2">Network Health</p>
                    <div className="flex items-center gap-2">
                      {metrics?.hederaNetwork.status === 'healthy' ? (
                        <CheckCircle className="w-4 h-4 text-green-600" />
                      ) : (
                        <AlertCircle className="w-4 h-4 text-yellow-600" />
                      )}
                      <span className="text-sm">
                        {metrics?.hederaNetwork.status === 'healthy' 
                          ? 'All systems operational' 
                          : 'Monitoring for issues'
                        }
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="alerts" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>System Alerts</CardTitle>
              <CardDescription>
                Current alerts and warnings requiring attention
              </CardDescription>
            </CardHeader>
            <CardContent>
              {unresolvedAlerts.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <CheckCircle className="w-8 h-8 mx-auto mb-2 text-green-600" />
                  <p>No active alerts - all systems running normally</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {unresolvedAlerts.map((alert) => (
                    <div key={alert.id} className="flex items-start gap-3 p-3 border rounded">
                      {alert.type === 'error' ? (
                        <AlertCircle className="w-5 h-5 text-red-500 mt-0.5" />
                      ) : (
                        <AlertTriangle className="w-5 h-5 text-yellow-500 mt-0.5" />
                      )}
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <h4 className="font-medium">{alert.title}</h4>
                          <Badge variant={alert.type === 'error' ? 'destructive' : 'secondary'}>
                            {alert.type}
                          </Badge>
                        </div>
                        <p className="text-sm text-muted-foreground">{alert.message}</p>
                        <p className="text-xs text-muted-foreground mt-1">
                          {new Date(alert.timestamp).toLocaleString()}
                        </p>
                      </div>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          // Resolve alert API call would go here
                          console.log('Resolving alert:', alert.id);
                        }}
                      >
                        Resolve
                      </Button>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="performance" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Performance Trends</CardTitle>
              <CardDescription>Historical performance data over the last 6 hours</CardDescription>
            </CardHeader>
            <CardContent>
              {history && history.length > 0 ? (
                <div className="space-y-4">
                  <div className="grid gap-4 md:grid-cols-2">
                    <div>
                      <h4 className="font-medium mb-2">Active Users Trend</h4>
                      <div className="space-y-1">
                        {history.slice(-10).map((point, index) => (
                          <div key={index} className="flex justify-between text-sm">
                            <span>{new Date(point.timestamp).toLocaleTimeString()}</span>
                            <Badge variant="outline">{point.activeUsers}</Badge>
                          </div>
                        ))}
                      </div>
                    </div>
                    <div>
                      <h4 className="font-medium mb-2">Memory Usage Trend</h4>
                      <div className="space-y-1">
                        {history.slice(-10).map((point, index) => (
                          <div key={index} className="flex justify-between text-sm">
                            <span>{new Date(point.timestamp).toLocaleTimeString()}</span>
                            <Badge variant={point.systemLoad.memoryUsage > 80 ? "destructive" : "outline"}>
                              {point.systemLoad.memoryUsage}%
                            </Badge>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              ) : (
                <p className="text-muted-foreground">No historical data available</p>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Last Updated Footer */}
      <div className="text-center text-xs text-muted-foreground">
        Last updated: {metrics ? new Date(metrics.timestamp).toLocaleString() : 'Never'}
        {autoRefresh && ` • Auto-refresh every ${refreshInterval / 1000}s`}
      </div>
    </div>
  );
}