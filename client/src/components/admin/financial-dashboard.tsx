import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { TrendingUp, DollarSign, Users, PieChart } from "lucide-react";

interface FinancialMetrics {
  dailyRevenue: Array<{ date: string; amount: number }>;
  topEarners: Array<{ userId: number; username: string; earnings: number }>;
  platformFees: number;
  totalPayouts: number;
  pendingPayouts: number;
}

interface AdminStats {
  totalRevenue: string;
  platformFees: string;
  monthlyGrowth: number;
  totalTransactions: number;
}

export function FinancialDashboard() {
  const { data: stats } = useQuery<AdminStats>({
    queryKey: ["/api/admin/stats"],
  });

  const { data: financials } = useQuery<FinancialMetrics>({
    queryKey: ["/api/admin/financials"],
  });

  const formatHBAR = (amount: number) => `${amount.toFixed(2)} ℏ`;

  return (
    <div className="space-y-6">
      {/* Financial Overview Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Revenue</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats?.totalRevenue || "0 HBAR"}</div>
            <p className="text-xs text-muted-foreground">
              +{stats?.monthlyGrowth || 0}% from last month
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Platform Fees</CardTitle>
            <PieChart className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats?.platformFees || "0 HBAR"}</div>
            <p className="text-xs text-muted-foreground">
              2.5% of total revenue
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Payouts</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {formatHBAR(financials?.totalPayouts || 0)}
            </div>
            <p className="text-xs text-muted-foreground">
              To creators and rights holders
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Transactions</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats?.totalTransactions || 0}</div>
            <p className="text-xs text-muted-foreground">
              Total platform transactions
            </p>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="revenue" className="space-y-4">
        <TabsList>
          <TabsTrigger value="revenue">Revenue Trends</TabsTrigger>
          <TabsTrigger value="earners">Top Earners</TabsTrigger>
          <TabsTrigger value="analytics">Analytics</TabsTrigger>
        </TabsList>

        <TabsContent value="revenue" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Daily Revenue (Last 30 Days)</CardTitle>
              <CardDescription>
                Revenue generated from marketplace transactions
              </CardDescription>
            </CardHeader>
            <CardContent>
              {financials?.dailyRevenue?.length ? (
                <div className="space-y-2">
                  {financials.dailyRevenue.slice(-7).map((day, index) => (
                    <div key={index} className="flex items-center justify-between p-2 rounded bg-muted/30">
                      <span className="text-sm">{day.date}</span>
                      <Badge variant="secondary">{formatHBAR(day.amount)}</Badge>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-muted-foreground">No revenue data available</p>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="earners" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Top Earning Creators</CardTitle>
              <CardDescription>
                Highest earning rights creators on the platform
              </CardDescription>
            </CardHeader>
            <CardContent>
              {financials?.topEarners?.length ? (
                <div className="space-y-2">
                  {financials.topEarners.map((earner, index) => (
                    <div key={earner.userId} className="flex items-center justify-between p-3 rounded border">
                      <div className="flex items-center gap-3">
                        <Badge variant="outline">#{index + 1}</Badge>
                        <div>
                          <p className="font-medium">{earner.username}</p>
                          <p className="text-sm text-muted-foreground">User ID: {earner.userId}</p>
                        </div>
                      </div>
                      <Badge variant="default">{formatHBAR(earner.earnings)}</Badge>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-muted-foreground">No earnings data available</p>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="analytics" className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle>Platform Metrics</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex justify-between">
                  <span>Average Transaction Value</span>
                  <Badge variant="secondary">
                    {formatHBAR((financials?.totalPayouts || 0) / Math.max(stats?.totalTransactions || 1, 1))}
                  </Badge>
                </div>
                <div className="flex justify-between">
                  <span>Platform Fee Rate</span>
                  <Badge variant="secondary">2.5%</Badge>
                </div>
                <div className="flex justify-between">
                  <span>Active Creators</span>
                  <Badge variant="secondary">{financials?.topEarners?.length || 0}</Badge>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Growth Indicators</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex justify-between">
                  <span>Monthly Growth</span>
                  <Badge variant={stats?.monthlyGrowth && stats.monthlyGrowth > 0 ? "default" : "secondary"}>
                    {stats?.monthlyGrowth || 0}%
                  </Badge>
                </div>
                <div className="flex justify-between">
                  <span>Pending Payouts</span>
                  <Badge variant="outline">{formatHBAR(financials?.pendingPayouts || 0)}</Badge>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}