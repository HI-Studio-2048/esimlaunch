import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { Loader2, TrendingUp, TrendingDown, DollarSign, Package, Users, ShoppingCart } from "lucide-react";
import { apiClient } from "@/lib/api";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

export default function Analytics() {
  const { toast } = useToast();
  const [summary, setSummary] = useState<any>(null);
  const [revenueData, setRevenueData] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [timeRange, setTimeRange] = useState<'7d' | '30d' | '90d'>('30d');

  useEffect(() => {
    loadAnalytics();
  }, [timeRange]);

  const loadAnalytics = async () => {
    setIsLoading(true);
    try {
      const [summaryData, revenue] = await Promise.all([
        apiClient.getDashboardSummary(),
        apiClient.getRevenueAnalytics({
          groupBy: timeRange === '7d' ? 'day' : timeRange === '30d' ? 'day' : 'week',
        }),
      ]);

      setSummary(summaryData);
      setRevenueData(revenue);
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to load analytics",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-8 max-w-7xl">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold mb-2">Analytics</h1>
            <p className="text-muted-foreground">
              Track your store performance and revenue
            </p>
          </div>
          <Select value={timeRange} onValueChange={(value: any) => setTimeRange(value)}>
            <SelectTrigger className="w-[180px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="7d">Last 7 days</SelectItem>
              <SelectItem value="30d">Last 30 days</SelectItem>
              <SelectItem value="90d">Last 90 days</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Summary Cards */}
        {summary && (
          <div className="grid md:grid-cols-4 gap-6 mb-8">
            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">Revenue (30d)</p>
                    <p className="text-2xl font-bold">${summary.revenue.last30Days.toFixed(2)}</p>
                    <div className="flex items-center gap-1 mt-1">
                      {summary.revenue.growth > 0 ? (
                        <TrendingUp className="h-4 w-4 text-green-500" />
                      ) : (
                        <TrendingDown className="h-4 w-4 text-red-500" />
                      )}
                      <span className={`text-sm ${summary.revenue.growth > 0 ? 'text-green-500' : 'text-red-500'}`}>
                        {summary.revenue.growth > 0 ? '+' : ''}{summary.revenue.growth.toFixed(1)}%
                      </span>
                    </div>
                  </div>
                  <DollarSign className="h-8 w-8 text-muted-foreground" />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">Orders (30d)</p>
                    <p className="text-2xl font-bold">{summary.orders.last30Days}</p>
                    <p className="text-sm text-muted-foreground mt-1">
                      {summary.orders.last7Days} in last 7 days
                    </p>
                  </div>
                  <ShoppingCart className="h-8 w-8 text-muted-foreground" />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">Total Customers</p>
                    <p className="text-2xl font-bold">{summary.customers.totalCustomers}</p>
                    <p className="text-sm text-muted-foreground mt-1">
                      {summary.customers.repeatCustomers} repeat
                    </p>
                  </div>
                  <Users className="h-8 w-8 text-muted-foreground" />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">Avg Order Value</p>
                    <p className="text-2xl font-bold">
                      ${summary.revenue.last30Days > 0 && summary.orders.last30Days > 0
                        ? (summary.revenue.last30Days / summary.orders.last30Days).toFixed(2)
                        : '0.00'}
                    </p>
                  </div>
                  <Package className="h-8 w-8 text-muted-foreground" />
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Revenue Chart */}
        {revenueData && (
          <Card>
            <CardHeader>
              <CardTitle>Revenue Over Time</CardTitle>
              <CardDescription>
                Track your revenue trends
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {revenueData.revenueByPeriod.length === 0 ? (
                  <p className="text-center text-muted-foreground py-8">No revenue data available</p>
                ) : (
                  <div className="space-y-2">
                    {revenueData.revenueByPeriod.map((item: any) => (
                      <div key={item.period} className="flex items-center justify-between p-3 border rounded-lg">
                        <div>
                          <p className="font-medium">{new Date(item.period).toLocaleDateString()}</p>
                          <p className="text-sm text-muted-foreground">{item.orders} orders</p>
                        </div>
                        <p className="text-lg font-bold">${item.revenue.toFixed(2)}</p>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}


