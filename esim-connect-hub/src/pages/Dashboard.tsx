import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { 
  BarChart3, Users, Package, CreditCard, Globe, TrendingUp,
  ArrowUp, ArrowDown, MoreHorizontal, Search, Bell, Settings,
  ChevronDown, Filter, Download, Key, Plus, Trash2
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { SectionHeader } from "@/components/shared/SectionHeader";
import { AnimatedCounter } from "@/components/shared/AnimatedCounter";
import { SetupChecklist, SetupStep } from "@/components/shared/SetupChecklist";
import { cn } from "@/lib/utils";
import { apiClient, ApiError } from "@/lib/api";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/contexts/AuthContext";
import { 
  getOnboardingProgress, 
  updateOnboardingProgress,
  getStepCompletionDate,
  markStepCompleted,
  resetOnboardingProgress
} from "@/lib/onboardingProgress";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export default function Dashboard() {
  const { toast } = useToast();
  const { user, isAuthenticated } = useAuth();
  const [stats, setStats] = useState({
    revenue: { total: 0, change: null as number | null },
    orders: { total: 0, completed: 0, pending: 0, change: null as number | null },
    apiKeys: { active: 0 },
    balance: 0,
  });
  const [orders, setOrders] = useState<any[]>([]);
  const [apiKeys, setApiKeys] = useState<any[]>([]);
  const [stores, setStores] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showApiKeyDialog, setShowApiKeyDialog] = useState(false);
  const [newApiKeyName, setNewApiKeyName] = useState("");
  const [newApiKey, setNewApiKey] = useState<string | null>(null);
  const [setupSteps, setSetupSteps] = useState<SetupStep[]>([]);

  useEffect(() => {
    loadDashboardData();
  }, []);

  const loadDashboardData = async () => {
    try {
      setLoading(true);
      const [statsData, ordersData, apiKeysData, storesData] = await Promise.all([
        apiClient.getDashboardStats().catch(() => null),
        apiClient.getOrders(1, 5).catch(() => null),
        apiClient.listApiKeys().catch(() => null),
        apiClient.listStores().catch(() => null),
      ]);

      if (statsData) {
        setStats(statsData);
      }
      if (ordersData) {
        setOrders(ordersData.orders || []);
      }
      if (apiKeysData) {
        setApiKeys(apiKeysData);
      }
      if (storesData) {
        setStores(storesData);
      }

      // Update onboarding progress based on actual data
      const progressUpdates: any = {
        account: isAuthenticated,
      };
      
      if (storesData && storesData.length > 0) {
        progressUpdates.store = true;
        progressUpdates.domain = storesData.some((s: any) => s.domain || s.subdomain);
      }
      
      if (ordersData && ordersData.orders && ordersData.orders.length > 0) {
        progressUpdates.firstSale = true;
      }
      
      updateOnboardingProgress(progressUpdates);
      
      // Mark account as completed if authenticated and not already marked
      if (isAuthenticated) {
        const currentProgress = getOnboardingProgress();
        if (!currentProgress.account) {
          markStepCompleted('account', new Date().toISOString());
        }
      }

      // Build setup steps
      buildSetupSteps(storesData, ordersData?.orders || []);
    } catch (error) {
      console.error('Failed to load dashboard data:', error);
      // Use demo data as fallback
    } finally {
      setLoading(false);
    }
  };

  const buildSetupSteps = (storesData: any[] | null, ordersData: any[]) => {
    const progress = getOnboardingProgress();
    const hasStore = storesData && storesData.length > 0;
    const hasDomain = storesData && storesData.some((s: any) => s.domain || s.subdomain);
    const hasFirstSale = ordersData.length > 0;
    
    // Get user's plan from localStorage (set during onboarding)
    const userPlan = typeof window !== 'undefined' ? localStorage.getItem('user_plan') : null;
    const isScalePlan = userPlan === 'scale' || userPlan === 'enterprise';

    const steps: SetupStep[] = [
      {
        id: 'account',
        title: 'Create Account',
        description: 'Sign up for your esimlaunch.com account',
        completed: progress.account || isAuthenticated,
        completedDate: getStepCompletionDate('account') || (isAuthenticated ? new Date().toISOString() : undefined),
        link: '/signup',
      },
      {
        id: 'subscription',
        title: 'Choose Subscription',
        description: 'Select a plan that fits your business',
        completed: progress.subscription,
        completedDate: getStepCompletionDate('subscription'),
        link: '/pricing',
      },
      {
        id: 'store',
        title: 'Create Your Store',
        description: 'Deploy your eSIM selling platform',
        completed: progress.store || hasStore,
        completedDate: getStepCompletionDate('store') || (hasStore ? new Date().toISOString() : undefined),
        link: '/onboarding',
      },
      // Only show domain step for Scale plan
      ...(isScalePlan ? [{
        id: 'domain',
        title: 'Configure Domain',
        description: 'Set up your custom domain',
        completed: progress.domain || hasDomain,
        completedDate: getStepCompletionDate('domain') || (hasDomain ? new Date().toISOString() : undefined),
        link: '/settings#domain',
        optional: true,
      }] : []),
      {
        id: 'firstSale',
        title: 'Make First Sale',
        description: 'Complete your first eSIM transaction',
        completed: progress.firstSale || hasFirstSale,
        completedDate: getStepCompletionDate('firstSale') || (hasFirstSale ? new Date().toISOString() : undefined),
        link: '/store-preview',
        optional: true,
      },
    ];

    setSetupSteps(steps);
  };

  const handleCreateApiKey = async () => {
    try {
      const result = await apiClient.createApiKey(newApiKeyName || undefined);
      setNewApiKey(result.key);
      setApiKeys([result, ...apiKeys]);
      setNewApiKeyName("");
      toast({
        title: "API Key Created",
        description: "Your new API key has been generated. Copy it now - you won't be able to see it again!",
      });
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to create API key",
        variant: "destructive",
      });
    }
  };

  const handleRevokeApiKey = async (keyId: string) => {
    try {
      await apiClient.revokeApiKey(keyId);
      setApiKeys(apiKeys.filter(key => key.id !== keyId));
      toast({
        title: "API Key Revoked",
        description: "The API key has been successfully revoked",
      });
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to revoke API key",
        variant: "destructive",
      });
    }
  };

  const copyApiKey = (key: string) => {
    navigator.clipboard.writeText(key);
    toast({
      title: "Copied!",
      description: "API key copied to clipboard",
    });
  };

  const handleResetOnboarding = () => {
    if (confirm("Are you sure you want to reset onboarding progress? This will allow you to go through the setup process again.")) {
      resetOnboardingProgress();
      // Also clear the saved plan
      localStorage.removeItem('user_plan');
      toast({
        title: "Onboarding Reset",
        description: "Onboarding progress has been cleared. You can now start over.",
      });
      // Reload to reflect changes
      setTimeout(() => window.location.reload(), 1000);
    }
  };

  const displayStats = [
    { 
      title: "Total Revenue", 
      value: stats.revenue.total, 
      prefix: "$", 
      change: stats.revenue.change ?? null, 
      icon: CreditCard,
      color: "primary"
    },
    { 
      title: "Total Orders", 
      value: stats.orders.total, 
      change: stats.orders.change ?? null, 
      icon: Package,
      color: "primary"
    },
    { 
      title: "Completed Orders", 
      value: stats.orders.completed, 
      change: null, // Only show change if API provides it
      icon: TrendingUp,
      color: "accent"
    },
    { 
      title: "Account Balance", 
      value: stats.balance, 
      prefix: "$", 
      change: null, 
      icon: Globe,
      color: "accent"
    },
  ];

  return (
    <div className="min-h-screen bg-background pt-16 md:pt-20">
      {/* Dashboard Header */}
      <div className="bg-card border-b border-border sticky top-16 md:top-20 z-40">
        <div className="container-custom py-4">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <h1 className="font-display text-2xl font-bold">Dashboard</h1>
              <p className="text-sm text-muted-foreground">Welcome back! Here's what's happening.</p>
            </div>
            <div className="flex items-center gap-3">
              <div className="relative hidden md:block">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <input
                  type="text"
                  placeholder="Search..."
                  className="pl-10 pr-4 py-2 rounded-xl bg-muted border-none text-sm w-64 focus:outline-none focus:ring-2 focus:ring-primary"
                />
              </div>
              <Button variant="ghost" size="icon" className="relative">
                <Bell className="w-5 h-5" />
                <span className="absolute top-1 right-1 w-2 h-2 rounded-full gradient-bg" />
              </Button>
              <Button variant="ghost" size="icon">
                <Settings className="w-5 h-5" />
              </Button>
            </div>
          </div>
        </div>
      </div>

      <div className="container-custom py-8 relative z-10">
        {/* Setup Checklist */}
        {setupSteps.length > 0 && (
          <SetupChecklist steps={setupSteps} />
        )}

        {/* Notice Banner */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8 p-4 rounded-2xl gradient-bg flex items-center justify-between"
        >
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-background/20 flex items-center justify-center">
              <TrendingUp className="w-5 h-5 text-primary-foreground" />
            </div>
            <div className="text-primary-foreground">
              <div className="font-medium">Live Dashboard</div>
              <div className="text-sm opacity-80">Real-time data from your eSIM Launch account</div>
            </div>
          </div>
          <Button size="sm" className="bg-background text-foreground hover:bg-background/90 hidden md:flex">
            View Analytics
          </Button>
        </motion.div>

        {/* Developer/Reset Section - Only show if onboarding is completed */}
        {getOnboardingProgress().store && (
          <div className="mb-4 p-3 rounded-lg bg-muted/50 border border-border flex items-center justify-between">
            <div className="text-sm text-muted-foreground">
              <strong>Developer Mode:</strong> Reset onboarding to start over
            </div>
            <Button 
              variant="outline" 
              size="sm"
              onClick={handleResetOnboarding}
            >
              Reset Onboarding
            </Button>
          </div>
        )}

        {/* Stats Grid */}
        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          {displayStats.map((stat, index) => (
            <motion.div
              key={stat.title}
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
              className="bg-card rounded-2xl p-6 shadow-card hover:shadow-card-hover transition-all duration-300"
            >
              <div className="flex items-start justify-between mb-4">
                <div className={cn(
                  "w-12 h-12 rounded-xl flex items-center justify-center",
                  stat.color === "primary" ? "bg-primary/10" : "bg-accent/10"
                )}>
                  <stat.icon className={cn(
                    "w-6 h-6",
                    stat.color === "primary" ? "text-primary" : "text-accent"
                  )} />
                </div>
                {stat.change !== null && stat.change !== undefined && stat.change !== 0 && (
                  <div className={cn(
                    "flex items-center gap-1 text-sm font-medium px-2 py-1 rounded-lg",
                    stat.change > 0 
                      ? "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400"
                      : "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400"
                  )}>
                    {stat.change > 0 ? (
                      <ArrowUp className="w-3 h-3" />
                    ) : (
                      <ArrowDown className="w-3 h-3" />
                    )}
                    {Math.abs(stat.change)}%
                  </div>
                )}
              </div>
              <div className="font-display text-3xl font-bold mb-1">
                {loading ? (
                  <div className="h-8 w-24 bg-muted rounded animate-pulse" />
                ) : (
                  <>
                    {stat.prefix}
                    <AnimatedCounter value={stat.value} />
                  </>
                )}
              </div>
              <div className="text-sm text-muted-foreground">{stat.title}</div>
            </motion.div>
          ))}
        </div>

        {/* API Keys Section */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="bg-card rounded-2xl p-6 shadow-card mb-8"
        >
          <div className="flex items-center justify-between mb-6">
            <div>
              <h3 className="font-semibold text-lg">API Keys</h3>
              <p className="text-sm text-muted-foreground">Manage your API keys for programmatic access</p>
            </div>
            <Dialog open={showApiKeyDialog} onOpenChange={setShowApiKeyDialog}>
              <DialogTrigger asChild>
                <Button variant="gradient" size="sm">
                  <Plus className="w-4 h-4 mr-2" />
                  Create API Key
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Create New API Key</DialogTitle>
                  <DialogDescription>
                    Give your API key a name to help you identify it later.
                  </DialogDescription>
                </DialogHeader>
                <div className="space-y-4">
                  <div>
                    <Label htmlFor="key-name">Key Name (Optional)</Label>
                    <Input
                      id="key-name"
                      value={newApiKeyName}
                      onChange={(e) => setNewApiKeyName(e.target.value)}
                      placeholder="e.g., Production API Key"
                    />
                  </div>
                  {newApiKey && (
                    <div className="p-4 bg-muted rounded-lg">
                      <p className="text-sm font-medium mb-2">Your API Key (copy this now):</p>
                      <div className="flex items-center gap-2">
                        <code className="flex-1 p-2 bg-background rounded text-sm font-mono">
                          {newApiKey}
                        </code>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => copyApiKey(newApiKey)}
                        >
                          Copy
                        </Button>
                      </div>
                      <p className="text-xs text-muted-foreground mt-2">
                        This key will not be shown again. Make sure to save it securely.
                      </p>
                    </div>
                  )}
                  <div className="flex justify-end gap-2">
                    <Button
                      variant="outline"
                      onClick={() => {
                        setShowApiKeyDialog(false);
                        setNewApiKey(null);
                        setNewApiKeyName("");
                      }}
                    >
                      {newApiKey ? "Close" : "Cancel"}
                    </Button>
                    {!newApiKey && (
                      <Button onClick={handleCreateApiKey}>
                        Create Key
                      </Button>
                    )}
                  </div>
                </div>
              </DialogContent>
            </Dialog>
          </div>

          {loading ? (
            <div className="space-y-3">
              {[1, 2].map((i) => (
                <div key={i} className="h-16 bg-muted rounded-lg animate-pulse" />
              ))}
            </div>
          ) : apiKeys.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <Key className="w-12 h-12 mx-auto mb-4 opacity-50" />
              <p>No API keys yet. Create your first one to get started.</p>
            </div>
          ) : (
            <div className="space-y-3">
              {apiKeys.map((key) => (
                <div
                  key={key.id}
                  className="flex items-center justify-between p-4 bg-muted rounded-lg"
                >
                  <div className="flex-1">
                    <div className="flex items-center gap-3">
                      <Key className="w-5 h-5 text-muted-foreground" />
                      <div>
                        <div className="font-medium">
                          {key.name || "Unnamed Key"}
                        </div>
                        <div className="text-sm text-muted-foreground font-mono">
                          {key.keyPrefix}...
                        </div>
                      </div>
                    </div>
                    <div className="text-xs text-muted-foreground mt-2">
                      Created {new Date(key.createdAt).toLocaleDateString()} • 
                      Rate limit: {key.rateLimit}/min
                      {key.lastUsedAt && ` • Last used: ${new Date(key.lastUsedAt).toLocaleDateString()}`}
                    </div>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleRevokeApiKey(key.id)}
                    className="text-destructive hover:text-destructive"
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              ))}
            </div>
          )}
        </motion.div>

        {/* Recent Orders */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="bg-card rounded-2xl p-6 shadow-card"
        >
          <div className="flex items-center justify-between mb-6">
            <div>
              <h3 className="font-semibold text-lg">Recent Orders</h3>
              <p className="text-sm text-muted-foreground">Latest orders from your store</p>
            </div>
            <Button variant="outline" size="sm">
              View All
              <ChevronDown className="w-4 h-4 ml-2" />
            </Button>
          </div>

          {loading ? (
            <div className="space-y-3">
              {[1, 2, 3].map((i) => (
                <div key={i} className="h-16 bg-muted rounded-lg animate-pulse" />
              ))}
            </div>
          ) : orders.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <Package className="w-12 h-12 mx-auto mb-4 opacity-50" />
              <p>No orders yet. Start selling to see orders here.</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full min-w-[600px]">
                <thead>
                  <tr className="border-b border-border">
                    <th className="text-left py-3 px-4 text-sm font-medium text-muted-foreground">Transaction ID</th>
                    <th className="text-left py-3 px-4 text-sm font-medium text-muted-foreground">Order No</th>
                    <th className="text-left py-3 px-4 text-sm font-medium text-muted-foreground">Status</th>
                    <th className="text-left py-3 px-4 text-sm font-medium text-muted-foreground">Amount</th>
                    <th className="text-left py-3 px-4 text-sm font-medium text-muted-foreground">Date</th>
                  </tr>
                </thead>
                <tbody>
                  {orders.map((order, index) => (
                    <motion.tr
                      key={order.id}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.5 + index * 0.05 }}
                      className="border-b border-border/50 hover:bg-muted/30 transition-colors"
                    >
                      <td className="py-4 px-4 text-sm font-medium">{order.transactionId}</td>
                      <td className="py-4 px-4 text-sm">{order.esimAccessOrderNo || "—"}</td>
                      <td className="py-4 px-4">
                        <span className={cn(
                          "px-2.5 py-1 rounded-full text-xs font-medium",
                          order.status === "COMPLETED" 
                            ? "bg-green-100 text-green-700" 
                            : order.status === "PENDING"
                            ? "bg-yellow-100 text-yellow-700"
                            : "bg-gray-100 text-gray-700"
                        )}>
                          {order.status}
                        </span>
                      </td>
                      <td className="py-4 px-4 text-sm font-medium">
                        {order.totalAmount ? `$${order.totalAmount.toFixed(2)}` : "—"}
                      </td>
                      <td className="py-4 px-4 text-sm text-muted-foreground">
                        {new Date(order.createdAt).toLocaleDateString()}
                      </td>
                    </motion.tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </motion.div>
      </div>
    </div>
  );
}
