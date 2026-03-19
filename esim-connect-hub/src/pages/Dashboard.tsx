import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { useNavigate } from "react-router-dom";
import { 
  BarChart3, Users, Package, CreditCard, Globe, TrendingUp,
  ArrowUp, ArrowDown, MoreHorizontal, Settings,
  ChevronDown, Filter, Download,
  MessageSquare, Handshake, DollarSign, Calculator,
  ShoppingCart, Cpu, Wallet, Store, XCircle, CheckCircle2, RefreshCw,
  Code2, History, CreditCard as PayCard, Megaphone, ArrowRight,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { SectionHeader } from "@/components/shared/SectionHeader";
import { AnimatedCounter } from "@/components/shared/AnimatedCounter";
import { SetupChecklist, SetupStep } from "@/components/shared/SetupChecklist";
import { LiveGlobeView } from "@/components/shared/LiveGlobeView";
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

// Simple sparkline chart component
function SparkLine({ data, color = "#6366f1" }: { data: number[]; color?: string }) {
  if (!data || data.length < 2) return null;
  const max = Math.max(...data);
  const min = Math.min(...data);
  const range = max - min || 1;
  const w = 200;
  const h = 50;
  const points = data.map((v, i) => {
    const x = (i / (data.length - 1)) * w;
    const y = h - ((v - min) / range) * h;
    return `${x},${y}`;
  }).join(" ");
  return (
    <svg viewBox={`0 0 ${w} ${h}`} className="w-full h-12" preserveAspectRatio="none">
      <polyline fill="none" stroke={color} strokeWidth="2" points={points} />
      <polygon
        fill={color}
        fillOpacity="0.1"
        points={`0,${h} ${points} ${w},${h}`}
      />
    </svg>
  );
}

export default function Dashboard() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { user, isAuthenticated } = useAuth();
  const [stats, setStats] = useState({
    revenue: { total: 0, change: null as number | null },
    orders: { total: 0, completed: 0, pending: 0, change: null as number | null, cancelled: 0, base: 0, topup: 0 },
    apiKeys: { active: 0 },
    balance: 0,
  });
  const [orders, setOrders] = useState<any[]>([]);
  const [stores, setStores] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [setupSteps, setSetupSteps] = useState<SetupStep[]>([]);
  const [chartRange, setChartRange] = useState<7 | 15 | 30>(7);
  const [purchaseData, setPurchaseData] = useState<number[]>([]);
  const [activeEsimData, setActiveEsimData] = useState<number[]>([]);

  useEffect(() => {
    loadDashboardData();
  }, []);

  const loadDashboardData = async () => {
    try {
      setLoading(true);
      const [statsData, ordersData, storesData, prefsData] = await Promise.all([
        apiClient.getDashboardStats().catch(() => null),
        apiClient.getOrders(1, 5).catch(() => null),
        apiClient.listStores().catch(() => null),
        apiClient.getMerchantPreferences().catch(() => null),
      ]);

      if (statsData) {
        setStats(statsData);
      }
      if (ordersData) {
        setOrders(ordersData.orders || []);
      }
      if (storesData) {
        setStores(storesData);
        // Ensure current_store_id belongs to this merchant (fixes wrong store after account switch)
        const storeIds = storesData.map((s: any) => s.id);
        const currentStoreId = typeof window !== 'undefined' ? localStorage.getItem('current_store_id') : null;
        if (currentStoreId && !storeIds.includes(currentStoreId)) {
          localStorage.removeItem('current_store_id');
          localStorage.removeItem('esimlaunch_store_config');
        }
        if ((!currentStoreId || !storeIds.includes(currentStoreId)) && storesData.length > 0) {
          localStorage.setItem('current_store_id', storesData[0].id);
        }
      }

      // Update onboarding in DB (no localStorage)
      const progressUpdates: Record<string, boolean> = {
        ...(prefsData?.onboarding_progress ?? {}),
        account: isAuthenticated,
      };
      if (storesData && storesData.length > 0) {
        progressUpdates.store = true;
        progressUpdates.domain = storesData.some((s: any) => s.domain || s.subdomain);
      }
      if (ordersData?.orders?.length) progressUpdates.firstSale = true;
      if (statsData?.apiKeys?.active && statsData.apiKeys.active > 0) progressUpdates.apiKey = true;

      const stepDates: Record<string, string> = { ...(prefsData?.step_completion_dates ?? {}) };
      if (isAuthenticated && !stepDates.account) stepDates.account = new Date().toISOString();
      if (statsData?.apiKeys?.active && statsData.apiKeys.active > 0 && !stepDates.apiKey)
        stepDates.apiKey = new Date().toISOString();

      if (isAuthenticated) {
        await apiClient.patchMerchantPreferences({
          onboarding_progress: progressUpdates,
          step_completion_dates: stepDates,
        }).catch(() => {});
      }

      buildSetupSteps(storesData, ordersData?.orders || [], statsData, prefsData ?? undefined);
    } catch (error) {
      console.error('Failed to load dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadChartData = async (range: 7 | 15 | 30) => {
    if (user?.serviceType !== 'ADVANCED') {
      setPurchaseData([]);
      setActiveEsimData([]);
      return;
    }
    try {
      const analytics = await apiClient.getAnalytics(range);
      const daily = analytics?.daily || analytics?.data?.daily || [];
      const ordersSeries = daily.map((d: any) => Number(d.orders) || 0);
      const packagesSeries = daily.map((d: any) => Number(d.packages) || 0);
      setPurchaseData(ordersSeries);
      setActiveEsimData(packagesSeries);
    } catch (error) {
      console.error('Failed to load dashboard analytics:', error);
      setPurchaseData([]);
      setActiveEsimData([]);
    }
  };

  useEffect(() => {
    if (user?.serviceType === 'ADVANCED') {
      loadChartData(chartRange);
    }
  }, [user?.serviceType, chartRange]);

  const buildSetupSteps = (
    storesData: any[] | null,
    ordersData: any[],
    statsData?: any,
    prefs?: { onboarding_progress?: Record<string, boolean>; step_completion_dates?: Record<string, string> }
  ) => {
    const progress = prefs?.onboarding_progress ?? getOnboardingProgress();
    const getStepDate = (step: string) => prefs?.step_completion_dates?.[step] ?? getStepCompletionDate(step as any);
    const hasStore = storesData && storesData.length > 0;
    const hasDomain = storesData && storesData.some((s: any) => s.domain || s.subdomain);
    const hasFirstSale = ordersData.length > 0;
    const userPlan = typeof window !== 'undefined' ? localStorage.getItem('user_plan') : null;
    const isScalePlan = userPlan === 'scale' || userPlan === 'enterprise';
    const isAdvanced = user?.serviceType === 'ADVANCED';

    let steps: SetupStep[];

    if (isAdvanced) {
      // ADVANCED checklist: API key + first order
      // Use statsData if provided (fresh from API), otherwise fall back to component state
      const hasApiKey = (statsData?.apiKeys?.active || stats.apiKeys?.active || 0) > 0;
      steps = [
        {
          id: 'account',
          title: 'Create Account',
          description: 'Sign up for your eSIMLaunch account',
          completed: progress.account || isAuthenticated,
          completedDate: getStepDate('account') || (isAuthenticated ? new Date().toISOString() : undefined),
          link: '/signup',
        },
        {
          id: 'apiKey',
          title: 'Create an API Key',
          description: 'Generate your first API key in Developer',
          completed: hasApiKey || !!progress.subscription,
          completedDate: getStepDate('apiKey') || (hasApiKey ? new Date().toISOString() : undefined),
          link: '/dashboard/developer',
        },
        {
          id: 'firstOrder',
          title: 'Place First Order',
          description: 'Create your first eSIM order via the API or dashboard',
          completed: hasFirstSale,
          completedDate: hasFirstSale ? new Date().toISOString() : undefined,
          link: '/dashboard/create-order',
          optional: true,
        },
      ];
    } else {
      // EASY checklist: store + domain + first sale
      steps = [
        {
          id: 'account',
          title: 'Create Account',
          description: 'Sign up for your esimlaunch.com account',
          completed: progress.account || isAuthenticated,
          completedDate: getStepDate('account') || (isAuthenticated ? new Date().toISOString() : undefined),
          link: '/signup',
        },
        {
          id: 'subscription',
          title: 'Choose Subscription',
          description: 'Select a plan that fits your business',
          completed: progress.subscription,
          completedDate: getStepDate('subscription') ?? undefined,
          link: '/pricing',
        },
        {
          id: 'store',
          title: 'Store Build Request',
          description: 'Contact our team — your store is built for you',
          completed: progress.store || hasStore,
          completedDate: getStepDate('store') || (hasStore ? new Date().toISOString() : undefined),
          link: '/onboarding',
        },
        // Only show domain step for Scale plan
        ...(isScalePlan ? [{
          id: 'domain',
          title: 'Configure Domain',
          description: 'Set up your custom domain',
          completed: progress.domain || hasDomain,
          completedDate: getStepDate('domain') || (hasDomain ? new Date().toISOString() : undefined),
          link: '/settings#domain',
          optional: true,
        }] : []),
        {
          id: 'firstSale',
          title: 'Make First Sale',
          description: 'Complete your first eSIM transaction via your live store',
          completed: progress.firstSale || hasFirstSale,
          completedDate: getStepDate('firstSale') || (hasFirstSale ? new Date().toISOString() : undefined),
          link: '/demo-store',
          optional: true,
        },
      ];
    }

    setSetupSteps(steps);
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

  const isAdvancedUser = user?.serviceType === 'ADVANCED';

  const displayStats = isAdvancedUser ? [
    {
      title: "Total Orders",
      value: stats.orders.total,
      change: stats.orders.change ?? null,
      icon: Package,
      color: "primary",
      sub: stats.orders.cancelled ? `${stats.orders.cancelled} Cancelled` : undefined,
      subCls: "text-red-500",
    },
    {
      title: "Activated Orders",
      value: stats.orders.completed,
      change: null,
      icon: CheckCircle2,
      color: "accent",
      sub: undefined,
    },
    {
      title: "Base Orders",
      value: stats.orders.base || 0,
      change: null,
      icon: ShoppingCart,
      color: "primary",
      sub: undefined,
    },
    {
      title: "Top-up Orders",
      value: stats.orders.topup || 0,
      change: null,
      icon: TrendingUp,
      color: "accent",
      sub: undefined,
    },
  ] : [
    { 
      title: "Total Revenue", 
      value: stats.revenue.total, 
      prefix: "$", 
      change: stats.revenue.change ?? null, 
      icon: CreditCard,
      color: "primary",
      sub: undefined,
    },
    { 
      title: "Total Orders", 
      value: stats.orders.total, 
      change: stats.orders.change ?? null, 
      icon: Package,
      color: "primary",
      sub: undefined,
    },
    { 
      title: "Completed Orders", 
      value: stats.orders.completed, 
      change: null,
      icon: TrendingUp,
      color: "accent",
      sub: undefined,
    },
    { 
      title: "Account Balance", 
      value: stats.balance, 
      prefix: "$", 
      change: null, 
      icon: Globe,
      color: "accent",
      sub: undefined,
    },
  ] as Array<{ title: string; value: number; prefix?: string; change: number | null; icon: any; color: string; sub?: string; subCls?: string }>;

  return (
    <div className="min-h-screen bg-background">
      {/* Dashboard Header */}
      <div className="bg-card border-b border-border sticky top-16 md:top-20 z-40">
        <div className="container-custom py-4">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <h1 className="font-display text-2xl font-bold">Dashboard</h1>
              <p className="text-sm text-muted-foreground">Welcome back! Here's what's happening.</p>
            </div>
            <div className="flex items-center gap-3">
              <Button variant="ghost" size="icon" onClick={() => navigate("/settings")}>
                <Settings className="w-5 h-5" />
              </Button>
            </div>
          </div>
        </div>
      </div>

      <div className="container-custom py-8 relative z-10">
        {/* Balance top-up indicator (visible for Easy + Advanced) */}
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-6 rounded-2xl border border-border bg-card/80 backdrop-blur-sm px-5 py-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3"
        >
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
              <Wallet className="w-5 h-5 text-primary" />
            </div>
            <div>
              <p className="text-sm font-semibold">Account balance</p>
              {loading ? (
                <p className="text-xs text-muted-foreground">Loading...</p>
              ) : (
                <>
                  <p className="text-2xl font-bold gradient-text tabular-nums">
                    ${(stats.balance ?? 0).toFixed(2)}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    Available for orders and top‑ups
                  </p>
                </>
              )}
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Button
              size="sm"
              variant="gradient"
              className="gap-1.5"
              onClick={() => navigate("/dashboard/balance")}
            >
              Top up balance
              <ArrowRight className="w-3 h-3" />
            </Button>
            <Button
              size="sm"
              variant="outline"
              className="hidden sm:inline-flex"
              onClick={() => navigate("/settings/billing")}
            >
              Billing settings
            </Button>
          </div>
        </motion.div>

        {/* Announcements (Advanced Way only) */}
        {isAdvancedUser && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-6 bg-card rounded-2xl border border-border overflow-hidden"
          >
            <div className="px-5 py-3 border-b border-border flex items-center gap-2">
              <Megaphone className="w-4 h-4 text-primary" />
              <h2 className="font-semibold text-sm">Updates</h2>
            </div>
            <div className="divide-y divide-border">
              {[
                { date: "2025-01-15", title: "New eSIM Plans Available", body: "We've added 50+ new regional and global eSIM plans. Browse them in the Package Browser." },
                { date: "2025-01-10", title: "API Rate Limits Updated", body: "Default API rate limits have been increased to 1,000 requests/minute for all plans." },
              ].map((announcement, i) => (
                <div key={i} className="px-5 py-3 hover:bg-muted/20 transition-colors">
                  <div className="flex items-start gap-3">
                    <div className="w-2 h-2 rounded-full bg-primary mt-1.5 shrink-0" />
                    <div>
                      <div className="flex items-center gap-2 mb-0.5">
                        <p className="text-sm font-medium">{announcement.title}</p>
                        <span className="text-xs text-muted-foreground">{announcement.date}</span>
                      </div>
                      <p className="text-xs text-muted-foreground">{announcement.body}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </motion.div>
        )}



        {/* Setup Checklist */}
        {setupSteps.length > 0 && (
          <SetupChecklist steps={setupSteps} />
        )}

        {/* Notice Banner */}
        {isAdvancedUser ? (
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
            <Button
              size="sm"
              className="bg-background text-foreground hover:bg-background/90 hidden md:flex"
              onClick={() => navigate("/dashboard/analytics")}
            >
              View Analytics
            </Button>
          </motion.div>
        ) : (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-6 rounded-xl border border-primary/30 bg-primary/5 overflow-hidden"
          >
            <div className="px-4 py-3 flex flex-col sm:flex-row sm:items-center gap-3">
              <div className="flex items-center gap-3 min-w-0">
                <div className="w-9 h-9 rounded-lg gradient-bg flex items-center justify-center shrink-0">
                  <Store className="w-4 h-4 text-primary-foreground" />
                </div>
                <div className="min-w-0">
                  <div className="font-semibold text-sm">Your store is being built by our team</div>
                  <div className="text-xs text-muted-foreground">
                    Live at <span className="font-medium text-foreground">{stores?.[0]?.subdomain || user?.name?.toLowerCase().replace(/\s+/g, '').replace(/[^a-z0-9-]/g, '') || "yourstore"}.esimlaunch.com</span> — we'll reach out to confirm.
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-2 shrink-0 flex-wrap">
                <Button
                  size="sm"
                  variant="default"
                  className="h-7 text-xs gap-1.5 px-2.5"
                  onClick={() => window.open("mailto:support@esimlaunch.com?subject=Store Build Enquiry", "_blank")}
                >
                  <MessageSquare className="w-3.5 h-3.5" />
                  Contact
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  className="h-7 text-xs gap-1.5 px-2.5"
                  onClick={() => navigate("/demo-store")}
                >
                  <Store className="w-3.5 h-3.5" />
                  Demo Store
                </Button>
              </div>
            </div>
            <div className="border-t border-primary/20 bg-primary/5 px-4 py-2 text-[11px] text-muted-foreground flex flex-wrap gap-x-3 gap-y-1">
              <span className="flex items-center gap-1"><CheckCircle2 className="w-3 h-3 text-primary shrink-0" /> Packages &amp; pricing ready</span>
              <span className="flex items-center gap-1"><CheckCircle2 className="w-3 h-3 text-primary shrink-0" /> Design &amp; deployment by us</span>
              <span className="flex items-center gap-1"><CheckCircle2 className="w-3 h-3 text-primary shrink-0" /> No technical setup</span>
            </div>
          </motion.div>
        )}

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
                    {(stat as any).prefix}
                    <AnimatedCounter value={stat.value} />
                  </>
                )}
              </div>
              <div className="text-sm text-muted-foreground">{stat.title}</div>
              {(stat as any).sub && (
                <div className={cn("text-xs mt-1", (stat as any).subCls || "text-muted-foreground")}>
                  {(stat as any).sub}
                </div>
              )}
            </motion.div>
          ))}
        </div>

        {/* Quick Actions Section */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="mb-8"
        >
          <div className="mb-4">
            <h2 className="text-xl font-semibold mb-2">Quick Actions</h2>
            <p className="text-sm text-muted-foreground">
              {user?.serviceType === 'ADVANCED' ? 'API tools and eSIM management' : 'Access key features and settings'}
            </p>
          </div>

          {/* EASY Way Quick Actions */}
          {user?.serviceType !== 'ADVANCED' && (
            <div className="grid sm:grid-cols-2 lg:grid-cols-5 gap-4">
              {[
                { label: 'Billing', desc: 'Subscription, plan, and invoices', icon: CreditCard, path: '/settings/billing' },
                { label: 'Payment', desc: 'Payment methods and billing details', icon: PayCard, path: '/dashboard/payment-settings' },
                { label: 'Balance', desc: 'View balance and add funds', icon: Wallet, path: '/dashboard/balance' },
                { label: 'Analytics', desc: 'View detailed analytics and reports', icon: BarChart3, path: '/dashboard/analytics' },
                { label: 'Support', desc: 'Manage customer support tickets', icon: MessageSquare, path: '/dashboard/support' },
                { label: 'My eSIM', desc: 'Manage active eSIM profiles', icon: Cpu, path: '/dashboard/profiles' },
                { label: 'Affiliates', desc: 'Manage affiliate and referral programs', icon: Handshake, path: '/dashboard/affiliates' },
                { label: 'Packages', desc: 'Select and manage eSIM packages', icon: Package, path: '/package-selector' },
                { label: 'Pricing', desc: 'Configure pricing and markups', icon: DollarSign, path: '/pricing-config' },
                { label: 'Demo Store', desc: 'Preview what your store looks like', icon: Store, path: '/demo-store' },
              ].map(({ label, desc, icon: Icon, path }) => (
                <motion.button
                  key={label}
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => navigate(path)}
                  className="bg-card rounded-2xl p-6 shadow-card hover:shadow-card-hover transition-all duration-300 text-left border border-border hover:border-primary/50"
                >
                  <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center mb-4">
                    <Icon className="w-6 h-6 text-primary" />
                  </div>
                  <h3 className="font-semibold mb-1">{label}</h3>
                  <p className="text-sm text-muted-foreground">{desc}</p>
                </motion.button>
              ))}
            </div>
          )}

          {/* ADVANCED Way Quick Actions */}
          {user?.serviceType === 'ADVANCED' && (
            <div className="grid sm:grid-cols-2 lg:grid-cols-5 gap-4">
              {[
                { label: 'eSIM Plans', desc: 'Browse all available packages', icon: Package, path: '/dashboard/packages' },
                { label: 'My eSIM', desc: 'Manage active eSIM profiles', icon: Cpu, path: '/dashboard/profiles' },
                { label: 'My Order', desc: 'View all your eSIM orders', icon: History, path: '/dashboard/orders' },
                { label: 'Billing', desc: 'View balance and add funds', icon: Wallet, path: '/dashboard/balance' },
                { label: 'Payment', desc: 'Payment methods and billing details', icon: PayCard, path: '/dashboard/payment-settings' },
                { label: 'Developer', desc: 'API keys, webhooks, and docs', icon: Code2, path: '/dashboard/developer' },
                { label: 'Create Order', desc: 'Place a new eSIM order', icon: ShoppingCart, path: '/dashboard/create-order' },
                { label: 'Analytics', desc: 'View usage and revenue reports', icon: BarChart3, path: '/dashboard/analytics' },
                { label: 'Support', desc: 'Manage support tickets', icon: MessageSquare, path: '/dashboard/support' },
                { label: 'Affiliates', desc: 'Manage affiliate programs', icon: Handshake, path: '/dashboard/affiliates' },
              ].map(({ label, desc, icon: Icon, path }) => (
                <motion.button
                  key={label}
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => navigate(path)}
                  className="bg-card rounded-2xl p-5 shadow-card hover:shadow-card-hover transition-all duration-300 text-left border border-border hover:border-primary/50"
                >
                  <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center mb-3">
                    <Icon className="w-5 h-5 text-primary" />
                  </div>
                  <h3 className="font-semibold text-sm mb-1">{label}</h3>
                  <p className="text-xs text-muted-foreground">{desc}</p>
                </motion.button>
              ))}
            </div>
          )}
        </motion.div>

{/* Charts (Advanced Way only) */}
        {isAdvancedUser && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.35 }}
            className="grid md:grid-cols-2 gap-6 mb-8"
          >
            {/* Purchase Overview */}
            <div className="bg-card rounded-2xl p-5 shadow-card border">
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-semibold text-sm">Purchase Overview</h3>
                <div className="flex gap-1">
                  {([7, 15, 30] as const).map((r) => (
                    <button
                      key={r}
                      onClick={() => setChartRange(r)}
                      className={cn(
                        "px-2.5 py-1 rounded-lg text-xs font-medium transition-colors",
                        chartRange === r ? "bg-primary text-primary-foreground" : "hover:bg-muted text-muted-foreground"
                      )}
                    >
                      Last {r}
                    </button>
                  ))}
                </div>
              </div>
              <p className="text-xs text-muted-foreground mb-1">eSIMs purchased</p>
              <p className="text-2xl font-bold mb-2">{purchaseData.reduce((a, b) => a + Math.round(b), 0)}</p>
              <SparkLine data={purchaseData} color="#6366f1" />
              <div className="flex justify-between text-xs text-muted-foreground mt-1">
                <span>{chartRange}d ago</span>
                <span>Today</span>
              </div>
            </div>

            {/* Active eSIM Overview */}
            <div className="bg-card rounded-2xl p-5 shadow-card border">
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-semibold text-sm">Active eSIM Overview</h3>
                <div className="flex gap-1">
                  {([7, 15, 30] as const).map((r) => (
                    <button
                      key={r}
                      onClick={() => setChartRange(r)}
                      className={cn(
                        "px-2.5 py-1 rounded-lg text-xs font-medium transition-colors",
                        chartRange === r ? "bg-primary text-primary-foreground" : "hover:bg-muted text-muted-foreground"
                      )}
                    >
                      Last {r}
                    </button>
                  ))}
                </div>
              </div>
              <p className="text-xs text-muted-foreground mb-1">eSIMs activated</p>
              <p className="text-2xl font-bold mb-2">{activeEsimData.reduce((a, b) => a + Math.round(b), 0)}</p>
              <SparkLine data={activeEsimData} color="#10b981" />
              <div className="flex justify-between text-xs text-muted-foreground mt-1">
                <span>{chartRange}d ago</span>
                <span>Today</span>
              </div>
            </div>
          </motion.div>
        )}

        {/* Network Globe — collapsed by default, below stats/actions */}
        <div className="mb-8">
          <LiveGlobeView />
        </div>

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
            <Button variant="outline" size="sm" onClick={() => navigate(isAdvancedUser ? "/dashboard/orders" : "/dashboard/analytics")}>
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
