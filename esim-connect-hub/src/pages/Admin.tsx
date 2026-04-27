import { useEffect, useState, useCallback, Fragment } from "react";
import { useNavigate, Link } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { apiClient } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Shield,
  Store,
  Mail,
  User,
  Calendar,
  Loader2,
  Users,
  Activity,
  CreditCard,
  MessageSquare,
  TrendingUp,
  ExternalLink,
  RefreshCw,
  Search,
  ChevronRight,
  AlertCircle,
} from "lucide-react";

const ADMIN_EMAIL = "admin@esimlaunch.com";

const STATUS_OPTIONS = [
  { value: "all", label: "All statuses" },
  { value: "pending_review", label: "Pending review" },
  { value: "in_progress", label: "In progress" },
  { value: "completed", label: "Completed" },
  { value: "rejected", label: "Rejected" },
];

const STATUS_COLORS: Record<string, string> = {
  pending_review: "bg-yellow-100 text-yellow-800 border-yellow-200",
  in_progress: "bg-blue-100 text-blue-800 border-blue-200",
  completed: "bg-green-100 text-green-800 border-green-200",
  rejected: "bg-red-100 text-red-800 border-red-200",
};

function formatDate(dateStr: string) {
  return new Date(dateStr).toLocaleDateString(undefined, {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

function KpiCard({
  icon: Icon,
  label,
  value,
  sub,
  color = "text-primary",
}: {
  icon: React.ElementType;
  label: string;
  value: number | string;
  sub?: string;
  color?: string;
}) {
  return (
    <div className="bg-card border rounded-xl p-5 flex items-start gap-4 shadow-sm">
      <div className={`w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0`}>
        <Icon className={`w-5 h-5 ${color}`} />
      </div>
      <div className="min-w-0">
        <p className="text-sm text-muted-foreground">{label}</p>
        <p className="text-2xl font-bold">{value}</p>
        {sub && <p className="text-xs text-muted-foreground mt-0.5">{sub}</p>}
      </div>
    </div>
  );
}

export default function Admin() {
  const { user, isAuthenticated, isLoading: authLoading } = useAuth();
  const navigate = useNavigate();

  const isAdmin =
    user?.role === "ADMIN" ||
    user?.email?.toLowerCase() === ADMIN_EMAIL.toLowerCase();

  // Summary
  const [summary, setSummary] = useState<any>(null);
  const [summaryLoading, setSummaryLoading] = useState(true);

  // Store requests
  const [stores, setStores] = useState<any[]>([]);
  const [storesLoading, setStoresLoading] = useState(true);
  const [storesError, setStoresError] = useState<string | null>(null);
  const [statusFilter, setStatusFilter] = useState("all");
  const [emailFilter, setEmailFilter] = useState("");
  const [emailInput, setEmailInput] = useState("");
  const [updatingStore, setUpdatingStore] = useState<string | null>(null);

  // Subscriptions
  const [subscriptions, setSubscriptions] = useState<any[]>([]);
  const [subsLoading, setSubsLoading] = useState(true);

  // Active tab
  const [activeTab, setActiveTab] = useState<"overview" | "stores" | "merchants" | "subscriptions" | "affiliates">("overview");

  // Affiliates
  const [affiliates, setAffiliates] = useState<any[]>([]);
  const [affiliatesLoading, setAffiliatesLoading] = useState(false);
  const [affiliateSort, setAffiliateSort] = useState<"clicks" | "clicks30" | "signups" | "conversion" | "earnings">("clicks");
  const [affiliateSearch, setAffiliateSearch] = useState("");
  const [affiliateSearchInput, setAffiliateSearchInput] = useState("");
  const [expandedAffiliateId, setExpandedAffiliateId] = useState<string | null>(null);
  const [affiliateReferrals, setAffiliateReferrals] = useState<Record<string, any[] | "loading">>({});

  const toggleAffiliateRow = async (id: string) => {
    if (expandedAffiliateId === id) {
      setExpandedAffiliateId(null);
      return;
    }
    setExpandedAffiliateId(id);
    if (!affiliateReferrals[id]) {
      setAffiliateReferrals((p) => ({ ...p, [id]: "loading" }));
      try {
        const data = await apiClient.getAdminAffiliateReferrals(id);
        setAffiliateReferrals((p) => ({ ...p, [id]: data ?? [] }));
      } catch {
        setAffiliateReferrals((p) => ({ ...p, [id]: [] }));
      }
    }
  };

  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      navigate("/login", { replace: true });
    } else if (!authLoading && isAuthenticated && !isAdmin) {
      navigate("/dashboard", { replace: true });
    }
  }, [authLoading, isAuthenticated, isAdmin, navigate]);

  const fetchSummary = useCallback(async () => {
    if (!isAdmin) return;
    try {
      setSummaryLoading(true);
      const res = await apiClient.getAdminSummary();
      setSummary(res ?? null);
    } catch (_) {
      setSummary(null);
    } finally {
      setSummaryLoading(false);
    }
  }, [isAdmin]);

  const fetchStores = useCallback(async () => {
    if (!isAdmin) return;
    try {
      setStoresLoading(true);
      setStoresError(null);
      const res = await apiClient.getAdminStoreRequests({
        status: statusFilter === "all" ? undefined : statusFilter,
        email: emailFilter || undefined,
        limit: 100,
      });
      setStores(res ?? []);
    } catch (e: any) {
      setStoresError(e?.message || "Failed to load store requests");
      setStores([]);
    } finally {
      setStoresLoading(false);
    }
  }, [isAdmin, statusFilter, emailFilter]);

  const fetchSubscriptions = useCallback(async () => {
    if (!isAdmin) return;
    try {
      setSubsLoading(true);
      const res = await apiClient.getAdminSubscriptions({ limit: 100 });
      setSubscriptions(res ?? []);
    } catch (_) {
      setSubscriptions([]);
    } finally {
      setSubsLoading(false);
    }
  }, [isAdmin]);

  const fetchAffiliates = useCallback(async () => {
    if (!isAdmin) return;
    try {
      setAffiliatesLoading(true);
      const res = await apiClient.getAdminAffiliates({
        sort: affiliateSort,
        search: affiliateSearch || undefined,
        limit: 200,
      });
      setAffiliates(res ?? []);
    } catch (_) {
      setAffiliates([]);
    } finally {
      setAffiliatesLoading(false);
    }
  }, [isAdmin, affiliateSort, affiliateSearch]);

  useEffect(() => { fetchSummary(); }, [fetchSummary]);
  useEffect(() => { fetchStores(); }, [fetchStores]);
  useEffect(() => { fetchSubscriptions(); }, [fetchSubscriptions]);
  useEffect(() => { fetchAffiliates(); }, [fetchAffiliates]);

  const handleStatusChange = async (storeId: string, newStatus: string) => {
    setUpdatingStore(storeId);
    try {
      await apiClient.updateAdminStoreRequest(storeId, { adminStatus: newStatus });
      setStores((prev) =>
        prev.map((s) => (s.id === storeId ? { ...s, adminStatus: newStatus } : s))
      );
    } catch (_) {
      // silent
    } finally {
      setUpdatingStore(null);
    }
  };

  const handleEmailSearch = () => {
    setEmailFilter(emailInput.trim());
  };

  if (authLoading || (!user && isAuthenticated)) {
    return (
      <div className="flex items-center justify-center min-h-[50vh]">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!isAdmin) return null;

  const kpis = summary?.kpis;
  const today = summary?.today;

  const tabs = [
    { id: "overview", label: "Overview" },
    { id: "stores", label: "Store requests" },
    { id: "merchants", label: "Merchants" },
    { id: "subscriptions", label: "Subscriptions" },
    { id: "affiliates", label: "Affiliates" },
  ] as const;

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center">
            <Shield className="w-6 h-6 text-primary" />
          </div>
          <div>
            <h1 className="text-2xl font-bold">Admin Dashboard</h1>
            <p className="text-muted-foreground text-sm">
              Platform management for {ADMIN_EMAIL}
            </p>
          </div>
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={() => { fetchSummary(); fetchStores(); fetchSubscriptions(); fetchAffiliates(); }}
        >
          <RefreshCw className="w-4 h-4 mr-2" />
          Refresh
        </Button>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 border-b">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`px-4 py-2.5 text-sm font-medium border-b-2 transition-colors -mb-px ${
              activeTab === tab.id
                ? "border-primary text-primary"
                : "border-transparent text-muted-foreground hover:text-foreground"
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* ── Overview tab ── */}
      {activeTab === "overview" && (
        <div className="space-y-6">
          {summaryLoading ? (
            <div className="flex items-center justify-center py-16">
              <Loader2 className="w-8 h-8 animate-spin text-primary" />
            </div>
          ) : kpis ? (
            <>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <KpiCard icon={Users} label="Total merchants" value={kpis.totalMerchants} sub={`${kpis.activeMerchants} active`} />
                <KpiCard icon={Store} label="Total stores" value={kpis.totalStores} sub={`+${kpis.newStoresLast7} last 7 days`} />
                <KpiCard icon={CreditCard} label="Active subscriptions" value={kpis.activeSubscriptions} />
                <KpiCard icon={MessageSquare} label="Open tickets" value={kpis.openTickets} color={kpis.openTickets > 0 ? "text-orange-500" : "text-primary"} />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <KpiCard icon={TrendingUp} label="New merchants (7d)" value={kpis.newMerchantsLast7} sub={`${kpis.newMerchantsLast30} in last 30 days`} />
                <KpiCard icon={Activity} label="New merchants (30d)" value={kpis.newMerchantsLast30} />
              </div>

              {/* Today's activity */}
              {(today?.newMerchants > 0 || today?.newStores > 0) && (
                <div className="bg-card border rounded-xl p-5 shadow-sm space-y-4">
                  <h2 className="font-semibold flex items-center gap-2">
                    <Activity className="w-4 h-4 text-primary" />
                    Today's activity
                  </h2>
                  {today.newMerchants > 0 && (
                    <div>
                      <p className="text-sm font-medium mb-2 text-muted-foreground">
                        New merchants ({today.newMerchants})
                      </p>
                      <div className="space-y-2">
                        {today.merchants.map((m: any) => (
                          <div key={m.id} className="flex items-center justify-between text-sm p-2 rounded-lg bg-muted/50">
                            <div className="flex items-center gap-2">
                              <Mail className="w-3.5 h-3.5 text-muted-foreground" />
                              <a href={`mailto:${m.email}`} className="text-primary hover:underline">{m.email}</a>
                              {m.name && <span className="text-muted-foreground">({m.name})</span>}
                            </div>
                            <Link
                              to={`/admin/merchants/${m.id}`}
                              className="text-muted-foreground hover:text-primary flex items-center gap-1"
                            >
                              View <ChevronRight className="w-3.5 h-3.5" />
                            </Link>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                  {today.newStores > 0 && (
                    <div>
                      <p className="text-sm font-medium mb-2 text-muted-foreground">
                        New stores ({today.newStores})
                      </p>
                      <div className="space-y-2">
                        {today.stores.map((s: any) => (
                          <div key={s.id} className="flex items-center justify-between text-sm p-2 rounded-lg bg-muted/50">
                            <div>
                              <span className="font-medium">{s.businessName}</span>
                              <span className="text-muted-foreground ml-2 text-xs">{s.merchant?.email}</span>
                            </div>
                            <Link
                              to={`/admin/stores/${s.id}`}
                              className="text-muted-foreground hover:text-primary flex items-center gap-1"
                            >
                              View <ChevronRight className="w-3.5 h-3.5" />
                            </Link>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}

              {today?.newMerchants === 0 && today?.newStores === 0 && (
                <div className="bg-card border rounded-xl p-5 shadow-sm">
                  <p className="text-sm text-muted-foreground text-center py-4">No new activity today.</p>
                </div>
              )}
            </>
          ) : (
            <div className="flex items-center gap-2 text-destructive text-sm">
              <AlertCircle className="w-4 h-4" />
              Failed to load summary data.
            </div>
          )}
        </div>
      )}

      {/* ── Store requests tab ── */}
      {activeTab === "stores" && (
        <div className="space-y-4">
          {/* Filters */}
          <div className="flex flex-wrap gap-3 items-end">
            <div className="flex gap-2 flex-1 min-w-60">
              <Input
                placeholder="Filter by merchant email..."
                value={emailInput}
                onChange={(e) => setEmailInput(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleEmailSearch()}
                className="max-w-xs"
              />
              <Button variant="outline" size="sm" onClick={handleEmailSearch}>
                <Search className="w-4 h-4" />
              </Button>
              {emailFilter && (
                <Button variant="ghost" size="sm" onClick={() => { setEmailFilter(""); setEmailInput(""); }}>
                  Clear
                </Button>
              )}
            </div>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-48">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {STATUS_OPTIONS.map((o) => (
                  <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="bg-card rounded-xl border shadow-sm overflow-hidden">
            <div className="px-6 py-4 border-b flex items-center justify-between">
              <div>
                <h2 className="font-semibold flex items-center gap-2">
                  <Store className="w-5 h-5" />
                  Store requests
                  {stores.length > 0 && (
                    <Badge variant="secondary" className="text-xs">{stores.length}</Badge>
                  )}
                </h2>
                <p className="text-sm text-muted-foreground mt-1">
                  All eSIM store submissions. Manage status and add notes.
                </p>
              </div>
            </div>
            <div className="p-4">
              {storesLoading ? (
                <div className="flex items-center justify-center py-12">
                  <Loader2 className="w-8 h-8 animate-spin text-primary" />
                </div>
              ) : storesError ? (
                <p className="text-destructive text-sm">{storesError}</p>
              ) : stores.length === 0 ? (
                <p className="text-muted-foreground text-sm text-center py-8">No store requests found.</p>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b text-left text-muted-foreground">
                        <th className="pb-3 pr-4 font-medium">Business / Store</th>
                        <th className="pb-3 pr-4 font-medium">Merchant</th>
                        <th className="pb-3 pr-4 font-medium">Subdomain</th>
                        <th className="pb-3 pr-4 font-medium">Status</th>
                        <th className="pb-3 font-medium">Created</th>
                      </tr>
                    </thead>
                    <tbody>
                      {stores.map((s) => (
                        <tr key={s.id} className="border-b last:border-0 hover:bg-muted/30 transition-colors">
                          <td className="py-3 pr-4">
                            <Link to={`/admin/stores/${s.id}`} className="hover:underline">
                              <div className="font-medium">{s.businessName}</div>
                              <div className="text-muted-foreground text-xs">{s.name}</div>
                            </Link>
                          </td>
                          <td className="py-3 pr-4">
                            <Link to={`/admin/merchants/${s.merchant.id}`} className="hover:underline">
                              <div className="flex items-center gap-1">
                                <Mail className="w-3.5 h-3.5 text-muted-foreground" />
                                <span className="text-primary">{s.merchant.email}</span>
                              </div>
                              {s.merchant.name && (
                                <div className="flex items-center gap-1 mt-0.5 text-muted-foreground text-xs">
                                  <User className="w-3 h-3" />
                                  {s.merchant.name}
                                </div>
                              )}
                            </Link>
                          </td>
                          <td className="py-3 pr-4 font-mono text-muted-foreground text-xs">
                            {s.subdomain ? (
                              <a
                                href={`https://${s.subdomain}.esimlaunch.com`}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="flex items-center gap-1 hover:text-primary"
                              >
                                {s.subdomain}
                                <ExternalLink className="w-3 h-3" />
                              </a>
                            ) : "—"}
                          </td>
                          <td className="py-3 pr-4">
                            <Select
                              value={s.adminStatus || "pending_review"}
                              onValueChange={(v) => handleStatusChange(s.id, v)}
                              disabled={updatingStore === s.id}
                            >
                              <SelectTrigger className="w-36 h-7 text-xs">
                                {updatingStore === s.id ? (
                                  <Loader2 className="w-3 h-3 animate-spin" />
                                ) : (
                                  <SelectValue />
                                )}
                              </SelectTrigger>
                              <SelectContent>
                                {STATUS_OPTIONS.filter((o) => o.value !== "all").map((o) => (
                                  <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          </td>
                          <td className="py-3 text-muted-foreground text-xs">
                            <div className="flex items-center gap-1">
                              <Calendar className="w-3.5 h-3.5" />
                              {formatDate(s.createdAt)}
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ── Merchants tab ── */}
      {activeTab === "merchants" && (
        <div className="bg-card rounded-xl border shadow-sm overflow-hidden">
          <div className="px-6 py-4 border-b flex items-center justify-between">
            <h2 className="font-semibold flex items-center gap-2">
              <Users className="w-5 h-5" />
              Merchants
            </h2>
            <Link to="/admin/merchants">
              <Button variant="outline" size="sm">
                View all <ChevronRight className="w-4 h-4 ml-1" />
              </Button>
            </Link>
          </div>
          <div className="p-4 text-sm text-muted-foreground text-center py-8">
            <Link to="/admin/merchants" className="text-primary hover:underline flex items-center justify-center gap-1">
              Open full merchant directory <ChevronRight className="w-4 h-4" />
            </Link>
          </div>
        </div>
      )}

      {/* ── Subscriptions tab ── */}
      {activeTab === "subscriptions" && (
        <div className="bg-card rounded-xl border shadow-sm overflow-hidden">
          <div className="px-6 py-4 border-b">
            <h2 className="font-semibold flex items-center gap-2">
              <CreditCard className="w-5 h-5" />
              Subscriptions
              {subscriptions.length > 0 && (
                <Badge variant="secondary" className="text-xs">{subscriptions.length}</Badge>
              )}
            </h2>
          </div>
          <div className="p-4">
            {subsLoading ? (
              <div className="flex items-center justify-center py-12">
                <Loader2 className="w-8 h-8 animate-spin text-primary" />
              </div>
            ) : subscriptions.length === 0 ? (
              <p className="text-muted-foreground text-sm text-center py-8">No subscriptions found.</p>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b text-left text-muted-foreground">
                      <th className="pb-3 pr-4 font-medium">Merchant</th>
                      <th className="pb-3 pr-4 font-medium">Plan</th>
                      <th className="pb-3 pr-4 font-medium">Billing</th>
                      <th className="pb-3 pr-4 font-medium">Status</th>
                      <th className="pb-3 font-medium">Renews</th>
                    </tr>
                  </thead>
                  <tbody>
                    {subscriptions.map((sub: any) => (
                      <tr key={sub.id} className="border-b last:border-0 hover:bg-muted/30">
                        <td className="py-3 pr-4">
                          <Link to={`/admin/merchants/${sub.merchantId}`} className="hover:underline">
                            <div className="text-primary">{sub.merchant?.email}</div>
                            {sub.merchant?.name && (
                              <div className="text-xs text-muted-foreground">{sub.merchant.name}</div>
                            )}
                          </Link>
                        </td>
                        <td className="py-3 pr-4 capitalize font-medium">{sub.plan}</td>
                        <td className="py-3 pr-4 capitalize text-muted-foreground">{sub.billingPeriod}</td>
                        <td className="py-3 pr-4">
                          <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium border ${
                            sub.status === "active"
                              ? "bg-green-100 text-green-800 border-green-200"
                              : sub.status === "past_due"
                              ? "bg-red-100 text-red-800 border-red-200"
                              : sub.status === "trialing"
                              ? "bg-blue-100 text-blue-800 border-blue-200"
                              : "bg-gray-100 text-gray-800 border-gray-200"
                          }`}>
                            {sub.status}
                          </span>
                          {sub.cancelAtPeriodEnd && (
                            <span className="ml-1 text-xs text-orange-600">cancels</span>
                          )}
                        </td>
                        <td className="py-3 text-muted-foreground text-xs">
                          {formatDate(sub.currentPeriodEnd)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ── Affiliates tab ── */}
      {activeTab === "affiliates" && (
        <div className="space-y-4">
          <div className="flex flex-wrap gap-3 items-end">
            <div className="flex gap-2 flex-1 min-w-60">
              <Input
                placeholder="Search by email, name, handle, or code..."
                value={affiliateSearchInput}
                onChange={(e) => setAffiliateSearchInput(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && setAffiliateSearch(affiliateSearchInput.trim())}
                className="max-w-sm"
              />
              <Button variant="outline" size="sm" onClick={() => setAffiliateSearch(affiliateSearchInput.trim())}>
                <Search className="w-4 h-4" />
              </Button>
            </div>
            <Select value={affiliateSort} onValueChange={(v) => setAffiliateSort(v as any)}>
              <SelectTrigger className="w-52">
                <SelectValue placeholder="Sort by" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="clicks">Sort: Clicks (all time)</SelectItem>
                <SelectItem value="clicks30">Sort: Clicks (30d)</SelectItem>
                <SelectItem value="signups">Sort: Signups</SelectItem>
                <SelectItem value="conversion">Sort: Conversion %</SelectItem>
                <SelectItem value="earnings">Sort: Earnings</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {affiliatesLoading ? (
            <div className="flex items-center justify-center py-16">
              <Loader2 className="w-8 h-8 animate-spin text-primary" />
            </div>
          ) : affiliates.length === 0 ? (
            <div className="bg-card border rounded-xl p-8 text-center text-sm text-muted-foreground">
              No affiliates yet.
            </div>
          ) : (
            <div className="bg-card border rounded-xl overflow-hidden shadow-sm">
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead className="bg-muted/50 text-xs uppercase text-muted-foreground">
                    <tr>
                      <th className="text-left px-4 py-2.5 font-medium">Affiliate</th>
                      <th className="text-left px-4 py-2.5 font-medium">Code</th>
                      <th className="text-left px-4 py-2.5 font-medium">Tier</th>
                      <th className="text-right px-4 py-2.5 font-medium">Clicks</th>
                      <th className="text-right px-4 py-2.5 font-medium">30d</th>
                      <th className="text-right px-4 py-2.5 font-medium">Signups</th>
                      <th className="text-right px-4 py-2.5 font-medium">Conv. %</th>
                      <th className="text-right px-4 py-2.5 font-medium">Earnings</th>
                      <th className="px-4 py-2.5"></th>
                    </tr>
                  </thead>
                  <tbody className="divide-y">
                    {affiliates.map((a) => {
                      const isExpanded = expandedAffiliateId === a.id;
                      const refs = affiliateReferrals[a.id];
                      return (
                        <Fragment key={a.id}>
                          <tr
                            className="hover:bg-muted/30 cursor-pointer"
                            onClick={() => toggleAffiliateRow(a.id)}
                          >
                            <td className="px-4 py-2.5">
                              <div className="flex items-center gap-1.5">
                                <ChevronRight
                                  className={`w-3.5 h-3.5 text-muted-foreground transition-transform ${isExpanded ? "rotate-90" : ""}`}
                                />
                                <div>
                                  <div className="font-medium">{a.handle ?? a.name ?? a.email}</div>
                                  <div className="text-xs text-muted-foreground">{a.email}</div>
                                </div>
                              </div>
                            </td>
                            <td className="px-4 py-2.5 font-mono text-xs">{a.referralCode}</td>
                            <td className="px-4 py-2.5">
                              <Badge variant="outline" className="capitalize">{a.tier}</Badge>
                            </td>
                            <td className="px-4 py-2.5 text-right tabular-nums">{a.clicksAllTime}</td>
                            <td className="px-4 py-2.5 text-right tabular-nums text-muted-foreground">{a.clicks30d}</td>
                            <td className="px-4 py-2.5 text-right tabular-nums">{a.referredMerchants}</td>
                            <td className="px-4 py-2.5 text-right tabular-nums">{a.conversionRate.toFixed(2)}%</td>
                            <td className="px-4 py-2.5 text-right tabular-nums">${a.totalEarnings.toFixed(2)}</td>
                            <td className="px-4 py-2.5" onClick={(e) => e.stopPropagation()}>
                              <Link
                                to={`/admin/merchants/${a.id}`}
                                className="text-muted-foreground hover:text-primary flex items-center gap-1 text-xs"
                              >
                                View <ChevronRight className="w-3.5 h-3.5" />
                              </Link>
                            </td>
                          </tr>
                          {isExpanded && (
                            <tr className="bg-muted/20">
                              <td colSpan={9} className="px-4 py-3">
                                {refs === "loading" ? (
                                  <div className="flex items-center justify-center py-4">
                                    <Loader2 className="w-4 h-4 animate-spin text-muted-foreground" />
                                  </div>
                                ) : !refs || refs.length === 0 ? (
                                  <p className="text-xs text-muted-foreground py-2">No signups from this affiliate yet.</p>
                                ) : (
                                  <div className="space-y-1.5">
                                    <p className="text-xs font-medium text-muted-foreground uppercase mb-2">
                                      Signed up via {a.handle ?? a.email} ({refs.length})
                                    </p>
                                    {refs.map((r: any) => (
                                      <div key={r.id} className="flex items-center justify-between text-sm bg-background border rounded-lg px-3 py-2">
                                        <div className="flex items-center gap-3">
                                          <div>
                                            <div className="font-medium">{r.name || r.email}</div>
                                            <div className="text-xs text-muted-foreground">{r.email}</div>
                                          </div>
                                          {r.active ? (
                                            <Badge className="bg-green-600 hover:bg-green-600 text-xs">Active</Badge>
                                          ) : (
                                            <Badge variant="secondary" className="text-xs">Signed up</Badge>
                                          )}
                                        </div>
                                        <div className="flex items-center gap-3">
                                          <span className="text-xs text-muted-foreground">
                                            {new Date(r.signedUpAt).toLocaleDateString()}
                                          </span>
                                          <Link
                                            to={`/admin/merchants/${r.id}`}
                                            className="text-muted-foreground hover:text-primary text-xs flex items-center gap-1"
                                          >
                                            View <ChevronRight className="w-3 h-3" />
                                          </Link>
                                        </div>
                                      </div>
                                    ))}
                                  </div>
                                )}
                              </td>
                            </tr>
                          )}
                        </Fragment>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
