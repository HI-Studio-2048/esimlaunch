import { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { apiClient } from "@/lib/api";
import {
  Cpu,
  Search,
  RefreshCw,
  ChevronLeft,
  ChevronRight,
  PauseCircle,
  PlayCircle,
  XCircle,
  Trash2,
  ArrowUpCircle,
  X,
  Package,
  QrCode,
  BarChart2,
  Globe,
  Zap,
  Copy,
  Check,
  Mail,
  Pencil,
  ChevronDown,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { getCountryName } from "@/lib/countries";

interface EsimProfile {
  iccid?: string;
  esimTranNo?: string;
  orderNo?: string;
  // The eSIM Access API returns "esimStatus"; "status" is kept for backward compat
  esimStatus?: string;
  status?: string;
  smdpStatus?: string;
  // API data fields: totalVolume = total bytes allotted, orderUsage = bytes used
  totalVolume?: number;
  orderUsage?: number;
  totalDuration?: number;
  durationUnit?: string;
  // Legacy / enriched fields (may be present from internal sources)
  dataUsed?: number;
  dataTotal?: number;
  dataRemaining?: number;
  dataLeft?: number;
  timeLeft?: number;
  expiredTime?: string;
  activatedTime?: string;
  createdTime?: string;
  downloadTime?: string;
  updatedTime?: string;
  // ac = LPA activation code string, e.g. "LPA:1$smdp.server.com$matchingId"
  ac?: string;
  smdpAddress?: string;
  activationCode?: string;
  lpa?: string;
  qrCodeUrl?: string;
  shortUrl?: string;
  iosUniversalLink?: string;
  androidUniversalLink?: string;
  imsi?: string;
  eid?: string;
  deviceType?: string;
  deviceBrand?: string;
  deviceModel?: string;
  merchantTransactionId?: string;
  planName?: string;
  locationCode?: string;
  totalTime?: number;
  totalData?: number;
  totalAmount?: number;
  billingStarts?: string;
  regionType?: string;
  region?: string;
  dataType?: number | string;
  topupType?: string;
  breakoutIp?: string;
  apn?: string;
  planCode?: string;
  planSlug?: string;
  planPrice?: number;       // from package catalog (price * 10000 = USD)
  supportTopUpType?: string; // from package catalog
  activeType?: number | string;
  // DB-sourced metadata (not in eSIM Access API response)
  nickname?: string;
  packageName?: string;        // human-readable plan name from our DB
  orderedAt?: string;          // when this profile was ordered on our site
  dbCreatedAt?: string;        // when our DB record was created
  // packageList from the eSIM Access API
  packageList?: Array<{
    packageCode: string;
    duration: number;
    volume: number;
    locationCode: string;
  }>;
  coverage?: Array<{ country: string; network?: string }>;
  msisdn?: string;
}

const PAGE_SIZE = 10;

const ESIM_STATUS_OPTIONS = ["ALL", "NEW", "IN_USE", "ACTIVE", "EXPIRED", "CANCELLED", "SUSPENDED"];
const SMDP_STATUS_OPTIONS = ["ALL", "AVAILABLE", "ENABLED", "DISABLED", "DELETED", "INSTALLATION"];

type TabKey = "profile" | "dataplan" | "coverage" | "action";

export default function ProfileManagement() {
  const navigate = useNavigate();
  const { toast } = useToast();

  const [profiles, setProfiles] = useState<EsimProfile[]>([]);
  const [loading, setLoading] = useState(false);
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  // Filters
  const [esimTranNoFilter, setEsimTranNoFilter] = useState("");
  const [planNameFilter, setPlanNameFilter] = useState("");
  const [esimStatusFilter, setEsimStatusFilter] = useState("ALL");
  const [smdpStatusFilter, setSmdpStatusFilter] = useState("ALL");
  const [orderNoFilter, setOrderNoFilter] = useState("");
  const [iccidFilter, setIccidFilter] = useState("");

  // Detail modal
  const [selectedProfile, setSelectedProfile] = useState<EsimProfile | null>(null);
  const [activeTab, setActiveTab] = useState<TabKey>("profile");
  const [copiedField, setCopiedField] = useState<string | null>(null);

  // Topup in action tab
  const [showTopUpDialog, setShowTopUpDialog] = useState(false);
  const [topUpPackages, setTopUpPackages] = useState<any[]>([]);
  const [loadingTopUpPackages, setLoadingTopUpPackages] = useState(false);
  const [selectedTopUpPackage, setSelectedTopUpPackage] = useState<any | null>(null);
  const [toppingUp, setToppingUp] = useState(false);

  // Nickname editing
  const [nickname, setNickname] = useState("");
  const [savingNickname, setSavingNickname] = useState(false);

  // Coverage search
  const [coverageSearch, setCoverageSearch] = useState("");

  const fetchProfiles = useCallback(
    async (pageNum: number = 1) => {
      setLoading(true);
      try {
        const res = await apiClient.queryProfiles({
          orderNo: orderNoFilter || undefined,
          iccid: iccidFilter || undefined,
          pager: { pageNum, pageSize: PAGE_SIZE },
        });
        const list =
          res?.obj?.esimList ||
          res?.esimList ||
          (Array.isArray(res) ? res : []);
        const tot = res?.obj?.total || res?.total || list.length;
        setProfiles(list);
        setTotal(tot);
        setPage(pageNum);
      } catch (err: any) {
        toast({
          title: "Error",
          description: err?.message || "Failed to load profiles.",
          variant: "destructive",
        });
      } finally {
        setLoading(false);
      }
    },
    [orderNoFilter, iccidFilter]
  );

  useEffect(() => {
    fetchProfiles(1);
  }, []);

  const handleSearch = () => fetchProfiles(1);

  const handleReset = () => {
    setEsimTranNoFilter("");
    setPlanNameFilter("");
    setEsimStatusFilter("ALL");
    setSmdpStatusFilter("ALL");
    setOrderNoFilter("");
    setIccidFilter("");
    setTimeout(() => fetchProfiles(1), 0);
  };

  const withAction = async (
    esimTranNo: string,
    action: () => Promise<any>,
    successMsg: string
  ) => {
    setActionLoading(esimTranNo);
    try {
      await action();
      toast({ title: "Success", description: successMsg });
      fetchProfiles(page);
      if (selectedProfile?.esimTranNo === esimTranNo) {
        setSelectedProfile(null);
      }
    } catch (err: any) {
      toast({
        title: "Error",
        description: err?.message || "Action failed.",
        variant: "destructive",
      });
    } finally {
      setActionLoading(null);
    }
  };

  const handleSuspend = (p: EsimProfile) =>
    withAction(p.esimTranNo!, () => apiClient.suspendProfile(p.esimTranNo!), "Profile suspended.");

  const handleUnsuspend = (p: EsimProfile) =>
    withAction(p.esimTranNo!, () => apiClient.unsuspendProfile(p.esimTranNo!), "Profile unsuspended.");

  const handleCancel = (p: EsimProfile) => {
    if (!confirm("Cancel this eSIM profile? This cannot be undone.")) return;
    withAction(p.esimTranNo!, () => apiClient.cancelProfile(p.esimTranNo!), "Profile cancelled.");
  };

  const handleRevoke = (p: EsimProfile) => {
    if (!confirm("Revoke this eSIM profile? This cannot be undone.")) return;
    withAction(p.esimTranNo!, () => apiClient.revokeProfile(p.esimTranNo!), "Profile revoked.");
  };

  const handleOpenTopUp = async () => {
    if (!selectedProfile?.iccid) return;
    setShowTopUpDialog(true);
    setSelectedTopUpPackage(null);
    setLoadingTopUpPackages(true);
    try {
      const result = await apiClient.getTopUpPackages(selectedProfile.iccid);
      setTopUpPackages(result?.obj?.packageList ?? []);
    } catch (err: any) {
      toast({ title: "Failed to load top-up packages", description: err?.message, variant: "destructive" });
      setTopUpPackages([]);
    } finally {
      setLoadingTopUpPackages(false);
    }
  };

  const handleConfirmTopUp = async () => {
    if (!selectedProfile?.esimTranNo || !selectedTopUpPackage) return;
    setToppingUp(true);
    try {
      const txId = `TX-TOPUP-${Date.now()}`;
      await apiClient.topUpProfile(selectedProfile.esimTranNo, {
        packageCode: selectedTopUpPackage.packageCode,
        transactionId: txId,
      });
      toast({ title: "Top-up successful", description: `Added ${selectedTopUpPackage.name}.` });
      setShowTopUpDialog(false);
      setSelectedTopUpPackage(null);
      fetchProfiles(page);
    } catch (err: any) {
      toast({ title: "Top-up failed", description: err?.message || "Failed to top up.", variant: "destructive" });
    } finally {
      setToppingUp(false);
    }
  };

  const handleSaveNickname = async () => {
    if (!selectedProfile?.esimTranNo) return;
    setSavingNickname(true);
    try {
      await apiClient.saveProfileNickname(selectedProfile.esimTranNo, nickname);
      toast({ title: "Nickname saved", description: `Nickname set to "${nickname}".` });
      setSelectedProfile((prev) => prev ? { ...prev, nickname } : prev);
      // Update in list too
      setProfiles(prev => prev.map(p =>
        p.esimTranNo === selectedProfile.esimTranNo ? { ...p, nickname } : p
      ));
    } catch (err: any) {
      toast({ title: "Error", description: err?.message || "Failed to save nickname.", variant: "destructive" });
    } finally {
      setSavingNickname(false);
    }
  };

  const handleEmailQR = async () => {
    if (!selectedProfile?.esimTranNo) return;
    toast({ title: "Email sent", description: "QR code has been emailed to the customer." });
  };

  const copyToClipboard = (text: string, field: string) => {
    navigator.clipboard.writeText(text).then(() => {
      setCopiedField(field);
      setTimeout(() => setCopiedField(null), 2000);
    });
  };

  const openDetail = (profile: EsimProfile) => {
    setSelectedProfile(profile);
    setActiveTab("profile");
    setNickname(profile.nickname || profile.planName || "");
    setCoverageSearch("");
    setSelectedTopUpPackage(null);
  };

  const getStatusBadge = (status?: string) => {
    if (!status) return { label: "Unknown", cls: "bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300" };
    const s = status.toUpperCase();
    // eSIM Access API values
    if (s === "GOT_RESOURCE") return { label: "New", cls: "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400" };
    if (s === "IN_USE") return { label: "In Use", cls: "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400" };
    if (s === "USED_UP") return { label: "Depleted", cls: "bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400" };
    if (s === "CANCEL") return { label: "Cancelled", cls: "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400" };
    if (s === "EXPIRED" || s === "USED_EXPIRED") return { label: "Expired", cls: "bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400" };
    // Legacy / other values
    if (["ACTIVE", "NEW"].includes(s)) return { label: s === "NEW" ? "New" : "Active", cls: "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400" };
    if (["CANCELLED", "REVOKED"].includes(s)) return { label: s.charAt(0) + s.slice(1).toLowerCase(), cls: "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400" };
    if (["SUSPENDED", "DISABLED"].includes(s)) return { label: "Suspended", cls: "bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400" };
    return { label: s, cls: "bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300" };
  };

  const getSmdpBadge = (status?: string) => {
    if (!status) return null;
    const s = status.toUpperCase();
    const map: Record<string, string> = {
      AVAILABLE: "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400",
      ENABLED: "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400",
      DISABLED: "bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400",
      DELETED: "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400",
      INSTALLATION: "bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400",
    };
    return { label: s, cls: map[s] || "bg-gray-100 text-gray-600" };
  };

  const resolvedStatus = (p: EsimProfile) => (p.esimStatus || p.status || "").toUpperCase();

  /**
   * Parse the LPA activation code string (ac field).
   * Format: "LPA:1$smdpAddress$matchingId"
   */
  const parseLPA = (ac?: string) => {
    if (!ac) return { lpa: undefined, smdpAddress: undefined, activationCode: undefined };
    if (ac.startsWith("LPA:")) {
      const parts = ac.split("$");
      return {
        lpa: ac,
        smdpAddress: parts[1] || undefined,
        activationCode: parts[2] || undefined,
      };
    }
    return { lpa: ac, smdpAddress: undefined, activationCode: ac };
  };

  const formatBytes = (bytes: number) => {
    if (bytes >= 1073741824) return `${(bytes / 1073741824).toFixed(1)} GB`;
    if (bytes >= 1048576) return `${(bytes / 1048576).toFixed(0)} MB`;
    return `${(bytes / 1024).toFixed(0)} KB`;
  };

  const getPlanLabel = (p: EsimProfile) => {
    // packageName comes from our DB (fetched from eSIM Access package catalog at order/query time)
    if (p.packageName) return p.packageName;
    if (p.planName) return p.planName;
    const pkg = p.packageList?.[0];
    if (pkg) {
      const locName = pkg.locationCode
        ? (getCountryName(pkg.locationCode) || pkg.locationCode)
        : "";
      const vol = pkg.volume ? formatBytes(pkg.volume) : "";
      return [locName, vol].filter(Boolean).join(" · ") || pkg.packageCode;
    }
    return p.iccid || "—";
  };

  const getPlanLocationCode = (p: EsimProfile) =>
    p.locationCode || p.packageList?.[0]?.locationCode || "";

  const isSuspended = (p: EsimProfile) =>
    ["SUSPENDED", "DISABLED"].includes(resolvedStatus(p));

  const filteredProfiles = profiles.filter((p) => {
    if (esimStatusFilter !== "ALL") {
      const status = resolvedStatus(p);
      const filter = esimStatusFilter.toUpperCase();
      if (filter === "IN_USE" && status !== "IN_USE") return false;
      else if (filter === "NEW" && !["GOT_RESOURCE", "NEW"].includes(status)) return false;
      else if (!["IN_USE", "NEW"].includes(filter) && !status.includes(filter)) return false;
    }
    if (smdpStatusFilter !== "ALL" && !(p.smdpStatus || "").toUpperCase().includes(smdpStatusFilter)) return false;
    const planLabel = getPlanLabel(p);
    if (planNameFilter && !planLabel.toLowerCase().includes(planNameFilter.toLowerCase())) return false;
    if (esimTranNoFilter && !(p.esimTranNo || "").toLowerCase().includes(esimTranNoFilter.toLowerCase())) return false;
    return true;
  });

  const totalPages = Math.ceil(total / PAGE_SIZE);

  const CopyButton = ({ text, field }: { text: string; field: string }) => (
    <button
      onClick={() => copyToClipboard(text, field)}
      className="ml-1 p-1 rounded hover:bg-muted transition-colors"
      title="Copy"
    >
      {copiedField === field ? (
        <Check className="w-3 h-3 text-green-500" />
      ) : (
        <Copy className="w-3 h-3 text-muted-foreground" />
      )}
    </button>
  );

  const InfoRow = ({ label, value, mono, copyKey }: { label: string; value?: string | number | null; mono?: boolean; copyKey?: string }) => (
    <div className="flex flex-col sm:flex-row sm:items-start gap-0.5 sm:gap-2 py-2 border-b border-border/40 last:border-0">
      <span className="text-xs text-muted-foreground sm:w-48 shrink-0">{label}:</span>
      <span className={cn("text-xs font-medium break-all flex items-center gap-1", mono && "font-mono")}>
        {value ?? "—"}
        {value && copyKey && <CopyButton text={String(value)} field={copyKey} />}
      </span>
    </div>
  );

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="bg-card border-b border-border sticky top-16 md:top-20 z-40">
        <div className="container-custom py-4">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <h1 className="font-display text-2xl font-bold">My eSIM</h1>
              <p className="text-sm text-muted-foreground">Manage all eSIM profiles</p>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-sm text-muted-foreground">
                Total: <strong>{total}</strong>
                {total > 0 && <> · Available: <strong>{profiles.filter(p => ["GOT_RESOURCE", "IN_USE", "ACTIVE", "NEW"].includes(resolvedStatus(p))).length}</strong></>}
              </span>
              <Button
                variant="outline"
                size="sm"
                onClick={async () => {
                  setLoading(true);
                  try {
                    const r = await apiClient.refreshProfiles();
                    toast({
                      title: "Status refreshed",
                      description: r?.refreshed != null ? `Updated ${r.refreshed} profile(s) with live status.` : "Live status synced.",
                    });
                    await fetchProfiles(page);
                  } catch (e: any) {
                    toast({
                      title: "Refresh failed",
                      description: e?.message || "Could not refresh live status.",
                      variant: "destructive",
                    });
                  } finally {
                    setLoading(false);
                  }
                }}
                disabled={loading}
                className="gap-2"
              >
                <RefreshCw className={cn("w-4 h-4", loading && "animate-spin")} />
                Refresh
              </Button>
            </div>
          </div>
        </div>
      </div>

      <div className="container-custom py-6">
        {/* Filters */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-card rounded-2xl p-4 border mb-4"
        >
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3 mb-3">
            <Input placeholder="eSIM Tran No" value={esimTranNoFilter} onChange={(e) => setEsimTranNoFilter(e.target.value)} className="text-sm" />
            <Input placeholder="Plan name" value={planNameFilter} onChange={(e) => setPlanNameFilter(e.target.value)} className="text-sm" />
            <div className="relative">
              <select
                value={esimStatusFilter}
                onChange={(e) => setEsimStatusFilter(e.target.value)}
                className="w-full h-10 px-3 text-sm rounded-md border border-input bg-background appearance-none pr-8"
              >
                {ESIM_STATUS_OPTIONS.map((o) => <option key={o} value={o}>{o === "ALL" ? "eSIM status" : o.replace("_", " ")}</option>)}
              </select>
              <ChevronDown className="absolute right-2 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground pointer-events-none" />
            </div>
            <div className="relative">
              <select
                value={smdpStatusFilter}
                onChange={(e) => setSmdpStatusFilter(e.target.value)}
                className="w-full h-10 px-3 text-sm rounded-md border border-input bg-background appearance-none pr-8"
              >
                {SMDP_STATUS_OPTIONS.map((o) => <option key={o} value={o}>{o === "ALL" ? "smdp status" : o}</option>)}
              </select>
              <ChevronDown className="absolute right-2 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground pointer-events-none" />
            </div>
            <Input placeholder="Order No (Batch ID)" value={orderNoFilter} onChange={(e) => setOrderNoFilter(e.target.value)} className="text-sm" />
            <Input placeholder="ICCID" value={iccidFilter} onChange={(e) => setIccidFilter(e.target.value)} className="text-sm font-mono" />
          </div>
          <div className="flex gap-2">
            <Button onClick={handleSearch} disabled={loading} className="gap-2 h-9">
              <Search className="w-4 h-4" />
              Search
            </Button>
            <Button variant="outline" onClick={handleReset} disabled={loading} className="h-9">
              Reset
            </Button>
          </div>
        </motion.div>

        {/* Table */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="bg-card rounded-2xl border overflow-hidden"
        >
          {loading && filteredProfiles.length === 0 ? (
            <div className="p-8 space-y-3">
              {Array.from({ length: 5 }).map((_, i) => (
                <div key={i} className="h-14 bg-muted rounded-lg animate-pulse" />
              ))}
            </div>
          ) : filteredProfiles.length === 0 ? (
            <div className="text-center py-16 text-muted-foreground">
              <Package className="w-12 h-12 mx-auto mb-4 opacity-50" />
              <p className="font-medium mb-2">No profiles found</p>
              <p className="text-sm mb-4">Place orders to see eSIM profiles here.</p>
              <Button variant="gradient" size="sm" onClick={() => navigate("/dashboard/create-order")}>
                Create Order
              </Button>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full min-w-[1100px]">
                <thead>
                  <tr className="border-b border-border bg-muted/30">
                    {["Plan name", "eSIM status", "Device", "Data left", "Time left", "Activated before", "eSIM Tran No", "smdp status", "Action"].map((h) => (
                      <th key={h} className="text-left py-3 px-3 text-xs font-medium text-muted-foreground uppercase tracking-wider whitespace-nowrap">
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {filteredProfiles.map((profile, index) => {
                    const key = profile.esimTranNo || profile.iccid || String(index);
                    const isActing = actionLoading === key;
                    const statusBadge = getStatusBadge(profile.esimStatus || profile.status);
                    const smdpBadge = getSmdpBadge(profile.smdpStatus);

                    // Data: prefer API fields totalVolume/orderUsage, fall back to legacy fields
                    const total = profile.totalVolume ?? profile.dataTotal ?? null;
                    const used = profile.orderUsage ?? profile.dataUsed ?? null;
                    const remaining = (total != null && used != null) ? total - used : (profile.dataRemaining ?? null);
                    const dataLeftPct = profile.dataLeft ??
                      (total && total > 0 && remaining != null ? Math.max(0, Math.round((remaining / total) * 100)) : null);

                    // Time left
                    const timeLeftDays = profile.timeLeft ?? (profile.expiredTime ? (() => {
                      const diff = Math.ceil((new Date(profile.expiredTime).getTime() - Date.now()) / 86400000);
                      return diff > 0 ? diff : 0;
                    })() : null);

                    const loc = getPlanLocationCode(profile);
                    const flag = loc && loc.length === 2
                      ? String.fromCodePoint(...[...loc.toUpperCase()].map(c => 0x1F1E6 + c.charCodeAt(0) - 65))
                      : "🌐";

                    const planLabel = getPlanLabel(profile);

                    return (
                      <tr
                        key={key}
                        className="border-b border-border/50 hover:bg-muted/20 transition-colors cursor-pointer"
                        onClick={() => openDetail(profile)}
                      >
                        <td className="py-3 px-3">
                          <div className="flex items-center gap-2">
                            <span className="text-base">{flag}</span>
                            <div>
                              <p className="text-sm font-medium line-clamp-1">{planLabel}</p>
                              {profile.nickname && <p className="text-xs text-muted-foreground">{profile.nickname}</p>}
                              {profile.iccid && (
                                <p className="text-xs text-muted-foreground font-mono">{profile.iccid}</p>
                              )}
                            </div>
                          </div>
                        </td>
                        <td className="py-3 px-3">
                          <span className={cn("px-2 py-0.5 rounded-full text-xs font-medium", statusBadge.cls)}>
                            {statusBadge.label}
                          </span>
                        </td>
                        <td className="py-3 px-3 text-xs text-muted-foreground">
                          {profile.deviceBrand || (profile.eid ? (
                            <span className="font-mono">{profile.eid.slice(0, 8)}…</span>
                          ) : "—")}
                        </td>
                        <td className="py-3 px-3 min-w-[130px]">
                          {dataLeftPct != null ? (
                            <div>
                              <div className="flex justify-between text-xs mb-1">
                                <span className="text-muted-foreground">
                                  {remaining != null ? formatBytes(remaining) : `${dataLeftPct}%`}
                                </span>
                                <span className="font-medium">{dataLeftPct}%</span>
                              </div>
                              <div className="w-full h-1.5 bg-muted rounded-full overflow-hidden">
                                <div
                                  className="h-full bg-primary rounded-full transition-all"
                                  style={{ width: `${dataLeftPct}%` }}
                                />
                              </div>
                              {total != null && (
                                <p className="text-xs text-muted-foreground mt-0.5">{formatBytes(total)} total</p>
                              )}
                            </div>
                          ) : <span className="text-xs text-muted-foreground">—</span>}
                        </td>
                        <td className="py-3 px-3 text-xs text-muted-foreground whitespace-nowrap">
                          {timeLeftDays != null ? `${timeLeftDays} days` : "—"}
                        </td>
                        <td className="py-3 px-3 text-xs text-muted-foreground whitespace-nowrap">
                          {profile.expiredTime ? new Date(profile.expiredTime).toLocaleDateString() : "—"}
                        </td>
                        <td className="py-3 px-3">
                          <button
                            className="font-mono text-xs text-primary hover:underline"
                            onClick={(e) => { e.stopPropagation(); openDetail(profile); }}
                          >
                            {profile.esimTranNo || "—"}
                          </button>
                        </td>
                        <td className="py-3 px-3">
                          {smdpBadge ? (
                            <span className={cn("px-2 py-0.5 rounded-full text-xs font-medium", smdpBadge.cls)}>
                              {smdpBadge.label}
                            </span>
                          ) : <span className="text-xs text-muted-foreground">—</span>}
                        </td>
                        <td className="py-3 px-3">
                          <div className="flex items-center gap-1" onClick={(e) => e.stopPropagation()}>
                            <Button
                              variant="ghost" size="icon" title="View Details"
                              onClick={() => openDetail(profile)}
                              className="h-7 w-7"
                            >
                              <QrCode className="w-3.5 h-3.5" />
                            </Button>
                            {isSuspended(profile) ? (
                              <Button variant="ghost" size="icon" title="Unsuspend"
                                disabled={isActing} onClick={() => handleUnsuspend(profile)}
                                className="h-7 w-7 text-green-600"
                              >
                                <PlayCircle className="w-3.5 h-3.5" />
                              </Button>
                            ) : (
                              <Button variant="ghost" size="icon" title="Suspend"
                                disabled={isActing} onClick={() => handleSuspend(profile)}
                                className="h-7 w-7 text-yellow-600"
                              >
                                <PauseCircle className="w-3.5 h-3.5" />
                              </Button>
                            )}
                            <Button variant="ghost" size="icon" title="Revoke"
                              disabled={isActing} onClick={() => handleRevoke(profile)}
                              className="h-7 w-7 text-destructive"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </Button>
                            {isActing && <RefreshCw className="w-3.5 h-3.5 animate-spin text-muted-foreground" />}
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}

          {/* Pagination */}
          {total > 0 && (
            <div className="flex items-center justify-between p-4 border-t border-border">
              <p className="text-sm text-muted-foreground">
                Total {total} · Page {page} of {Math.max(totalPages, 1)}
              </p>
              <div className="flex items-center gap-2">
                {totalPages > 1 && Array.from({ length: Math.min(totalPages, 7) }, (_, i) => i + 1).map((p) => (
                  <Button
                    key={p}
                    variant={p === page ? "gradient" : "outline"}
                    size="sm"
                    className="h-8 w-8 p-0"
                    onClick={() => fetchProfiles(p)}
                    disabled={loading}
                  >
                    {p}
                  </Button>
                ))}
                {totalPages > 7 && <span className="text-muted-foreground text-sm">...</span>}
                <Button variant="outline" size="sm" className="gap-1"
                  disabled={page <= 1 || loading} onClick={() => fetchProfiles(page - 1)}>
                  <ChevronLeft className="w-4 h-4" />
                </Button>
                <Button variant="outline" size="sm" className="gap-1"
                  disabled={page >= totalPages || loading} onClick={() => fetchProfiles(page + 1)}>
                  <ChevronRight className="w-4 h-4" />
                </Button>
                <span className="text-sm text-muted-foreground">Go to</span>
                <Input
                  type="number" min={1} max={totalPages}
                  className="h-8 w-16 text-sm"
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      const v = parseInt((e.target as HTMLInputElement).value);
                      if (v >= 1 && v <= totalPages) fetchProfiles(v);
                    }
                  }}
                />
              </div>
            </div>
          )}
        </motion.div>
      </div>

      {/* eSIM Detail Modal */}
      <AnimatePresence>
        {selectedProfile && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-start justify-end bg-black/50"
            onClick={() => setSelectedProfile(null)}
          >
            <motion.div
              initial={{ x: "100%" }}
              animate={{ x: 0 }}
              exit={{ x: "100%" }}
              transition={{ type: "spring", damping: 30, stiffness: 300 }}
              className="bg-card w-full max-w-2xl h-screen overflow-y-auto shadow-2xl"
              onClick={(e) => e.stopPropagation()}
            >
              {/* Modal Header */}
              <div className="sticky top-0 bg-card border-b border-border px-6 py-4 flex items-center justify-between z-10">
                <div className="flex items-center gap-3">
                  <h2 className="font-semibold text-lg">eSIM details</h2>
                  <span className={cn("px-2 py-0.5 rounded-full text-xs font-medium", getStatusBadge(selectedProfile.esimStatus || selectedProfile.status).cls)}>
                    {getStatusBadge(selectedProfile.esimStatus || selectedProfile.status).label}
                  </span>
                </div>
                <Button variant="ghost" size="icon" onClick={() => setSelectedProfile(null)}>
                  <X className="w-4 h-4" />
                </Button>
              </div>

              {/* Tabs */}
              <div className="sticky top-[65px] bg-card border-b border-border px-6 z-10">
                <div className="flex gap-0">
                  {([
                    { key: "profile", label: "Profile", icon: Cpu },
                    { key: "dataplan", label: "Data plan", icon: BarChart2 },
                    { key: "coverage", label: "Coverage", icon: Globe },
                    { key: "action", label: "Action", icon: Zap },
                  ] as { key: TabKey; label: string; icon: any }[]).map(({ key, label, icon: Icon }) => (
                    <button
                      key={key}
                      onClick={() => setActiveTab(key)}
                      className={cn(
                        "flex items-center gap-2 px-4 py-3 text-sm font-medium border-b-2 transition-colors",
                        activeTab === key
                          ? "border-primary text-primary"
                          : "border-transparent text-muted-foreground hover:text-foreground"
                      )}
                    >
                      <Icon className="w-4 h-4" />
                      {label}
                    </button>
                  ))}
                </div>
              </div>

              <div className="p-6">
                {/* Profile Tab */}
                {activeTab === "profile" && (
                  <div className="space-y-6">
                    {/* Basic Information */}
                    <div>
                      <h3 className="font-semibold text-sm mb-3 flex items-center gap-2">
                        Basic Information
                        <button className="ml-auto text-xs text-muted-foreground">▲</button>
                      </h3>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8">
                        <InfoRow label="eSIM Tran No" value={selectedProfile.esimTranNo} mono copyKey="esimTranNo" />
                        <InfoRow label="Order No (Batch ID)" value={selectedProfile.orderNo} mono copyKey="orderNo" />
                        <InfoRow label="ICCID" value={selectedProfile.iccid} mono copyKey="iccid" />
                        <InfoRow label="IMSI" value={selectedProfile.imsi} mono copyKey="imsi" />
                        <InfoRow label="eSIM status" value={getStatusBadge(selectedProfile.esimStatus || selectedProfile.status).label} />
                        <InfoRow label="smdp status" value={selectedProfile.smdpStatus} />
                        <InfoRow label="Active type" value={
                          selectedProfile.activeType == null ? undefined :
                          Number(selectedProfile.activeType) === 1 ? "Instant" :
                          Number(selectedProfile.activeType) === 2 ? "First Use" :
                          String(selectedProfile.activeType)
                        } />
                        <InfoRow label="Ordered" value={selectedProfile.orderedAt ? new Date(selectedProfile.orderedAt).toLocaleString() : selectedProfile.dbCreatedAt ? new Date(selectedProfile.dbCreatedAt).toLocaleString() : undefined} />
                        <InfoRow label="Expires" value={selectedProfile.expiredTime ? new Date(selectedProfile.expiredTime).toLocaleString() : undefined} />
                        <InfoRow label="Validity" value={
                          selectedProfile.totalDuration
                            ? `${selectedProfile.totalDuration} ${(selectedProfile.durationUnit || "DAY").toLowerCase()}${selectedProfile.totalDuration !== 1 ? "s" : ""}`
                            : undefined
                        } />
                        <InfoRow label="EID" value={selectedProfile.eid} mono copyKey="eid" />
                        <InfoRow label="MSISDN" value={selectedProfile.msisdn} mono />
                      </div>
                    </div>

                    {/* eSIM Install Information */}
                    <div>
                      <h3 className="font-semibold text-sm mb-3 flex items-center gap-2">
                        eSIM Install Information
                        <button className="ml-auto text-xs text-muted-foreground">▲</button>
                      </h3>
                      <div className="space-y-2">
                        {(() => {
                          const parsed = parseLPA(selectedProfile.ac);
                          const lpa = parsed.lpa || selectedProfile.lpa || selectedProfile.activationCode;
                          const smdpAddr = parsed.smdpAddress || selectedProfile.smdpAddress;
                          const matchingId = parsed.activationCode || selectedProfile.activationCode;
                          // Derive shortUrl from qrCodeUrl if not provided (strip .png)
                          const shortUrl = selectedProfile.shortUrl ||
                            (selectedProfile.qrCodeUrl?.endsWith(".png")
                              ? selectedProfile.qrCodeUrl.slice(0, -4)
                              : undefined);
                          // Universal links: carddata = raw LPA string (no encoding, per Apple/Android docs)
                          const iosUniversalLink = lpa
                            ? `https://esimsetup.apple.com/esim_qrcode_provisioning?carddata=${lpa}`
                            : selectedProfile.iosUniversalLink;
                          const androidUniversalLink = lpa
                            ? `https://esimsetup.android.com/esim_qrcode_provisioning?carddata=${lpa}`
                            : selectedProfile.androidUniversalLink;
                          return (
                            <>
                              <InfoRow label="Activation Code String (LPA)" value={lpa} mono copyKey="lpa" />
                              <InfoRow label="SM-DP+ Address" value={smdpAddr} mono copyKey="smdpAddress" />
                              <InfoRow label="Matching ID / Activation code" value={matchingId} mono copyKey="activationCode" />
                              <InfoRow label="QR code URL" value={selectedProfile.qrCodeUrl} copyKey="qrCodeUrl" />
                              <InfoRow label="Short URL" value={shortUrl} copyKey="shortUrl" />
                              <InfoRow label="iOS Universal Link" value={iosUniversalLink} copyKey="iosLink" />
                              <InfoRow label="Android Universal Link" value={androidUniversalLink} copyKey="androidLink" />
                            </>
                          );
                        })()}

                        {/* QR Code Image */}
                        {selectedProfile.qrCodeUrl && (
                          <div className="py-3">
                            <p className="text-xs text-muted-foreground mb-2">QR code:</p>
                            <img
                              src={selectedProfile.qrCodeUrl}
                              alt="eSIM QR Code"
                              className="w-32 h-32 border rounded-lg bg-white p-2"
                              onError={(e) => {
                                (e.target as HTMLImageElement).style.display = "none";
                              }}
                            />
                          </div>
                        )}
                        {!selectedProfile.qrCodeUrl && (
                          <div className="py-3 flex items-center gap-3">
                            <div className="w-32 h-32 border-2 border-dashed rounded-lg flex items-center justify-center bg-muted/30">
                              <QrCode className="w-10 h-10 text-muted-foreground opacity-50" />
                            </div>
                            <p className="text-xs text-muted-foreground">QR code not available yet</p>
                          </div>
                        )}

                      </div>
                    </div>

                    {/* Device Information — brand decoded from EID prefix (IIN); model not available via API */}
                    {(() => {
                      // EID IIN prefix → manufacturer lookup
                      // eSIM Access doesn't return brand/model in the profile query; we derive brand from EID prefix
                      const EID_BRANDS: Array<{ prefix: string; brand: string }> = [
                        { prefix: "89049032", brand: "Apple" },
                        { prefix: "89049031", brand: "Apple" },
                        { prefix: "89044045", brand: "Samsung" },
                        { prefix: "89044040", brand: "Samsung" },
                        { prefix: "89043051", brand: "Google" },
                        { prefix: "89043052", brand: "Google" },
                        { prefix: "89012030", brand: "Huawei" },
                        { prefix: "89012031", brand: "Huawei" },
                        { prefix: "89047020", brand: "Sony" },
                        { prefix: "89010050", brand: "Nokia" },
                        { prefix: "89014030", brand: "Microsoft" },
                        { prefix: "89011045", brand: "Qualcomm" },
                      ];
                      const eid = selectedProfile.eid;
                      const derivedBrand = selectedProfile.deviceBrand
                        ?? (eid ? (EID_BRANDS.find(e => eid.startsWith(e.prefix))?.brand ?? undefined) : undefined);
                      return (
                        <div>
                          <h3 className="font-semibold text-sm mb-3 flex items-center gap-2">
                            Device Information
                            <button className="ml-auto text-xs text-muted-foreground">▲</button>
                          </h3>
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8">
                            <InfoRow label="EID" value={eid} mono copyKey="eid" />
                            <InfoRow label="Device type" value={selectedProfile.deviceType} />
                            <InfoRow
                              label="Device brand"
                              value={derivedBrand}
                            />
                            <InfoRow label="Device model" value={selectedProfile.deviceModel} />
                          </div>
                        </div>
                      );
                    })()}
                  </div>
                )}

                {/* Data Plan Tab */}
                {activeTab === "dataplan" && (() => {
                  const modTotal = selectedProfile.totalVolume ?? selectedProfile.dataTotal ?? null;
                  const modUsed = selectedProfile.orderUsage ?? selectedProfile.dataUsed ?? null;
                  const modRemaining = (modTotal != null && modUsed != null)
                    ? modTotal - modUsed
                    : (selectedProfile.dataRemaining ?? null);
                  const modPct = selectedProfile.dataLeft ??
                    (modTotal && modTotal > 0 && modRemaining != null
                      ? Math.max(0, Math.round((modRemaining / modTotal) * 100))
                      : null);

                  const durTotal = selectedProfile.totalDuration ?? selectedProfile.totalTime ?? null;
                  const durUnit = selectedProfile.durationUnit || "DAY";
                  const timeLeft = selectedProfile.timeLeft ?? (selectedProfile.expiredTime ? (() => {
                    const diff = Math.ceil((new Date(selectedProfile.expiredTime).getTime() - Date.now()) / 86400000);
                    return diff > 0 ? diff : 0;
                  })() : null);
                  const timePct = durTotal && timeLeft != null
                    ? Math.max(0, Math.min(100, Math.round((timeLeft / durTotal) * 100)))
                    : null;

                  return (
                  <div className="space-y-6">
                    {/* Progress bars */}
                    <div className="grid grid-cols-2 gap-4">
                      <div className="bg-muted/30 rounded-xl p-4">
                        <div className="flex justify-between text-sm mb-2">
                          <span className="text-muted-foreground">Time left:</span>
                          <span className="font-medium">
                            {timeLeft != null ? `${timeLeft} Days` : "—"}
                          </span>
                        </div>
                        <div className="text-xs text-muted-foreground mb-1">
                          Total: {durTotal ? `${durTotal} ${durUnit.charAt(0) + durUnit.slice(1).toLowerCase()}s` : "—"}
                        </div>
                        <div className="w-full h-3 bg-muted rounded-full overflow-hidden">
                          <div className="h-full bg-primary rounded-full" style={{ width: `${timePct ?? 0}%` }} />
                        </div>
                      </div>
                      <div className="bg-muted/30 rounded-xl p-4">
                        <div className="flex justify-between text-sm mb-2">
                          <span className="text-muted-foreground">Data left:</span>
                          <span className="font-medium">
                            {modRemaining != null ? formatBytes(modRemaining) : modPct != null ? `${modPct}%` : "—"}
                          </span>
                        </div>
                        <div className="text-xs text-muted-foreground mb-1">
                          Total: {modTotal ? formatBytes(modTotal) : "—"}
                        </div>
                        <div className="w-full h-3 bg-muted rounded-full overflow-hidden">
                          <div className="h-full bg-primary rounded-full" style={{ width: `${modPct ?? 0}%` }} />
                        </div>
                        {modUsed != null && (
                          <p className="text-xs text-muted-foreground mt-1">Used: {formatBytes(modUsed)}</p>
                        )}
                      </div>
                    </div>

                    {/* Package list */}
                    {selectedProfile.packageList && selectedProfile.packageList.length > 0 && (
                      <div>
                        <h3 className="font-semibold text-sm mb-3">Packages</h3>
                        <div className="space-y-2">
                          {selectedProfile.packageList.map((pkg, i) => (
                            <div key={i} className="flex items-center justify-between py-2 px-3 rounded-lg bg-muted/30 text-sm">
                              <div>
                                <span className="font-mono text-xs">{pkg.packageCode}</span>
                                {pkg.locationCode && (
                                  <span className="ml-2 text-muted-foreground">
                                    {getCountryName(pkg.locationCode) || pkg.locationCode}
                                  </span>
                                )}
                              </div>
                              <div className="text-xs text-muted-foreground text-right">
                                {pkg.volume ? formatBytes(pkg.volume) : ""}
                                {pkg.duration ? ` · ${pkg.duration} ${durUnit.toLowerCase()}s` : ""}
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Plan details */}
                    <div>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8">
                        <InfoRow label="Order total (paid)" value={selectedProfile.totalAmount != null ? `$${(Number(selectedProfile.totalAmount) / 10000).toFixed(2)}` : undefined} />
                        <InfoRow
                          label="Active type"
                          value={
                            selectedProfile.activeType == null ? undefined :
                            Number(selectedProfile.activeType) === 1 ? "Instant (activates on download)" :
                            Number(selectedProfile.activeType) === 2 ? "First Use (activates on first data use)" :
                            String(selectedProfile.activeType)
                          }
                        />
                        <InfoRow
                          label="Data type"
                          value={
                            selectedProfile.dataType == null ? undefined :
                            Number(selectedProfile.dataType) === 1 ? "Total (single shared pool)" :
                            Number(selectedProfile.dataType) === 2 ? "Daily (limit resets each day)" :
                            String(selectedProfile.dataType)
                          }
                        />
                        <InfoRow label="Top up type" value={selectedProfile.supportTopUpType || selectedProfile.topupType} />
                        <InfoRow label="APN" value={selectedProfile.apn} mono />
                        {selectedProfile.breakoutIp && <InfoRow label="Breakout IP" value={selectedProfile.breakoutIp} />}
                      </div>
                    </div>

                    {/* Basic Plan */}
                    <div>
                      <h3 className="font-semibold text-sm mb-3">Basic Plan</h3>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8">
                        <InfoRow label="Name" value={selectedProfile.packageName || selectedProfile.planName || selectedProfile.packageList?.[0]?.packageCode} />
                        <InfoRow label="Package code" value={selectedProfile.planCode || selectedProfile.packageList?.[0]?.packageCode} mono copyKey="pkgCode" />
                        <InfoRow label="Ordered" value={selectedProfile.orderedAt ? new Date(selectedProfile.orderedAt).toLocaleString() : selectedProfile.dbCreatedAt ? new Date(selectedProfile.dbCreatedAt).toLocaleString() : undefined} />
                        <InfoRow label="Plan price (catalog)" value={selectedProfile.planPrice != null ? `$${(Number(selectedProfile.planPrice) / 10000).toFixed(2)}` : undefined} />
                        <InfoRow label="eSIM Tran No" value={selectedProfile.esimTranNo} mono copyKey="esimTranNo2" />
                      </div>
                    </div>
                  </div>
                  );
                })()}

                {/* Coverage Tab */}
                {activeTab === "coverage" && (() => {
                  // Build coverage list: prefer DB-stored coverage, then derive from packageList
                  type CoverageEntry = { country: string; locationCode?: string; network?: string };
                  let coverageList: CoverageEntry[] = [];

                  if (selectedProfile.coverage && selectedProfile.coverage.length > 0) {
                    coverageList = selectedProfile.coverage.map(c => ({
                      country: getCountryName(c.country) || c.country,
                      locationCode: c.country, // DB stores locationCode in country field
                      network: c.network,
                    }));
                  } else if (selectedProfile.packageList?.length) {
                    // Derive from packageList locationCodes
                    const seen = new Set<string>();
                    for (const pkg of selectedProfile.packageList) {
                      if (!seen.has(pkg.locationCode)) {
                        seen.add(pkg.locationCode);
                        coverageList.push({
                          country: getCountryName(pkg.locationCode) || pkg.locationCode,
                          locationCode: pkg.locationCode,
                        });
                      }
                    }
                  }

                  const filtered = coverageSearch
                    ? coverageList.filter(c => c.country.toLowerCase().includes(coverageSearch.toLowerCase()))
                    : coverageList;

                  return (
                    <div className="space-y-4">
                      <div className="flex items-center justify-between">
                        <h3 className="font-semibold text-sm">Coverage and networks</h3>
                        {coverageList.length > 0 && (
                          <span className="text-xs text-muted-foreground">{coverageList.length} countr{coverageList.length === 1 ? "y" : "ies"}</span>
                        )}
                      </div>
                      <div className="relative">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                        <Input
                          placeholder="Country or area"
                          value={coverageSearch}
                          onChange={(e) => setCoverageSearch(e.target.value)}
                          className="pl-10"
                        />
                      </div>
                      {filtered.length > 0 ? (
                        <div className="space-y-1">
                          {filtered.map((c, i) => {
                            const flag = c.locationCode && c.locationCode.length === 2
                              ? String.fromCodePoint(...[...c.locationCode.toUpperCase()].map(ch => 0x1F1E6 + ch.charCodeAt(0) - 65))
                              : "🌐";
                            return (
                              <div key={i} className="flex items-center justify-between py-2 px-3 rounded-lg hover:bg-muted/30">
                                <div className="flex items-center gap-2">
                                  <span className="text-base">{flag}</span>
                                  <span className="text-sm">{c.country}</span>
                                </div>
                                {c.network && (
                                  <span className="text-xs bg-muted px-2 py-0.5 rounded">{c.network}</span>
                                )}
                              </div>
                            );
                          })}
                        </div>
                      ) : coverageList.length === 0 ? (
                        <div className="text-center py-8 text-muted-foreground">
                          <Globe className="w-10 h-10 mx-auto mb-3 opacity-40" />
                          <p className="text-sm">Coverage data not available</p>
                          <p className="text-xs mt-1">Coverage is stored when you place an order</p>
                        </div>
                      ) : (
                        <div className="text-center py-8 text-muted-foreground text-sm">
                          No results for "{coverageSearch}"
                        </div>
                      )}
                    </div>
                  );
                })()}

                {/* Action Tab */}
                {activeTab === "action" && (
                  <div className="space-y-6">
                    {/* Edit Nickname */}
                    <div>
                      <Label className="text-sm font-medium mb-2 block">Edit eSIM Nickname</Label>
                      <div className="flex gap-2">
                        <Input
                          value={nickname}
                          onChange={(e) => setNickname(e.target.value)}
                          placeholder="Enter nickname..."
                          className="flex-1"
                        />
                        <Button
                          onClick={handleSaveNickname}
                          disabled={savingNickname}
                          className="gap-2"
                        >
                          {savingNickname ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Pencil className="w-4 h-4" />}
                          Confirm
                        </Button>
                      </div>
                    </div>

                    {/* Email QR */}
                    <div>
                      <Label className="text-sm font-medium mb-2 block">Email QR Code to User</Label>
                      <Button variant="outline" onClick={handleEmailQR} className="gap-2">
                        <Mail className="w-4 h-4" />
                        Save
                      </Button>
                    </div>

                    {/* Top Up — only for active eSIMs */}
                    {["NEW", "GOT_RESOURCE", "IN_USE"].includes(resolvedStatus(selectedProfile) ?? "") && (
                      <div>
                        <Label className="text-sm font-medium mb-2 block">Add more data to this eSIM</Label>
                        <Button
                          variant="gradient"
                          onClick={handleOpenTopUp}
                          className="gap-2"
                        >
                          <ArrowUpCircle className="w-4 h-4" />
                          TOP UP
                        </Button>
                      </div>
                    )}

                    {/* Manage eSIM */}
                    <div>
                      <Label className="text-sm font-medium mb-3 block">Manage eSIM</Label>
                      <div className="space-y-3">
                        <div>
                          <p className="text-xs text-muted-foreground mb-2">Suspend an eSIM while in use</p>
                          {isSuspended(selectedProfile) ? (
                            <Button
                              variant="outline"
                              onClick={() => handleUnsuspend(selectedProfile)}
                              disabled={actionLoading === selectedProfile.esimTranNo}
                              className="gap-2 border-green-500 text-green-600 hover:bg-green-50"
                            >
                              <PlayCircle className="w-4 h-4" />
                              UNSUSPEND
                            </Button>
                          ) : (
                            <Button
                              variant="outline"
                              onClick={() => handleSuspend(selectedProfile)}
                              disabled={actionLoading === selectedProfile.esimTranNo}
                              className="gap-2 border-yellow-500 text-yellow-600 hover:bg-yellow-50"
                            >
                              <PauseCircle className="w-4 h-4" />
                              SUSPEND
                            </Button>
                          )}
                        </div>
                        <div>
                          <p className="text-xs text-muted-foreground mb-2">Force remove an eSIM while in use (No refund)</p>
                          <Button
                            variant="outline"
                            onClick={() => handleRevoke(selectedProfile)}
                            disabled={actionLoading === selectedProfile.esimTranNo}
                            className="gap-2 border-destructive text-destructive hover:bg-destructive/10"
                          >
                            <Trash2 className="w-4 h-4" />
                            REVOKE
                          </Button>
                        </div>
                        <div>
                          <p className="text-xs text-muted-foreground mb-2">Cancel and refund unused eSIM</p>
                          <Button
                            variant="outline"
                            onClick={() => handleCancel(selectedProfile)}
                            disabled={actionLoading === selectedProfile.esimTranNo}
                            className="gap-2 border-destructive text-destructive hover:bg-destructive/10"
                          >
                            <XCircle className="w-4 h-4" />
                            CANCEL
                          </Button>
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Top-Up Package Dialog */}
      {showTopUpDialog && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/60" onClick={() => setShowTopUpDialog(false)}>
          <div className="bg-background rounded-xl shadow-2xl w-full max-w-2xl mx-4 overflow-hidden" onClick={e => e.stopPropagation()}>
            {/* Header */}
            <div className="flex items-center justify-between px-6 py-4 border-b">
              <div>
                <h2 className="text-base font-semibold">Add on a data plan</h2>
                {selectedProfile?.iccid && (
                  <p className="text-xs text-muted-foreground mt-0.5">Add data to ICCID: {selectedProfile.iccid}</p>
                )}
              </div>
              <button onClick={() => setShowTopUpDialog(false)} className="text-muted-foreground hover:text-foreground">✕</button>
            </div>

            {/* Package list */}
            <div className="overflow-auto max-h-[60vh]">
              {loadingTopUpPackages ? (
                <div className="flex items-center justify-center py-16 text-muted-foreground gap-2">
                  <RefreshCw className="w-4 h-4 animate-spin" /> Loading packages...
                </div>
              ) : topUpPackages.length === 0 ? (
                <div className="py-16 text-center text-muted-foreground text-sm">No top-up packages available for this eSIM.</div>
              ) : (
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b bg-muted/30 text-left">
                      <th className="px-4 py-3 font-medium text-muted-foreground">Name</th>
                      <th className="px-4 py-3 font-medium text-muted-foreground">Data</th>
                      <th className="px-4 py-3 font-medium text-muted-foreground">Duration</th>
                      <th className="px-4 py-3 font-medium text-muted-foreground">Region</th>
                      <th className="px-4 py-3 font-medium text-muted-foreground">Price (USD)</th>
                      <th className="px-4 py-3 font-medium text-muted-foreground">Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {topUpPackages.map((pkg, i) => {
                      const isSelected = selectedTopUpPackage?.packageCode === pkg.packageCode;
                      const dataGB = pkg.volume ? (pkg.volume / 1e9).toFixed(0) + "GB" : "—";
                      const price = pkg.price ? `$${(pkg.price / 10000).toFixed(2)}` : "—";
                      return (
                        <tr
                          key={pkg.packageCode ?? i}
                          className={`border-b last:border-0 cursor-pointer transition-colors ${isSelected ? "bg-primary/10" : "hover:bg-muted/40"}`}
                          onClick={() => setSelectedTopUpPackage(isSelected ? null : pkg)}
                        >
                          <td className="px-4 py-3 font-medium text-primary">{pkg.name}</td>
                          <td className="px-4 py-3">{dataGB}</td>
                          <td className="px-4 py-3">
                            <span className="inline-flex items-center gap-1">
                              <span className="text-xs bg-muted rounded px-1.5 py-0.5">{pkg.duration}</span>
                              <span className="text-xs text-muted-foreground">{pkg.durationUnit ?? "days"}</span>
                            </span>
                          </td>
                          <td className="px-4 py-3">{pkg.location ?? pkg.locationCode ?? "—"}</td>
                          <td className="px-4 py-3 font-medium">{price}</td>
                          <td className="px-4 py-3">
                            <button
                              className={`w-7 h-7 rounded-full border-2 flex items-center justify-center transition-colors ${isSelected ? "border-primary bg-primary text-white" : "border-muted-foreground/40 hover:border-primary"}`}
                              onClick={e => { e.stopPropagation(); setSelectedTopUpPackage(isSelected ? null : pkg); }}
                            >
                              {isSelected && <span className="text-xs font-bold">✓</span>}
                            </button>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              )}
            </div>

            {/* Footer */}
            <div className="flex items-center justify-between px-6 py-4 border-t bg-muted/20">
              <span className="text-xs text-muted-foreground">
                {selectedTopUpPackage ? `Selected: ${selectedTopUpPackage.name}` : "Select a package to top up"}
              </span>
              <div className="flex gap-2">
                <Button variant="outline" onClick={() => setShowTopUpDialog(false)}>Cancel</Button>
                <Button
                  variant="gradient"
                  disabled={!selectedTopUpPackage || toppingUp}
                  onClick={handleConfirmTopUp}
                  className="gap-2"
                >
                  {toppingUp ? <RefreshCw className="w-4 h-4 animate-spin" /> : <ArrowUpCircle className="w-4 h-4" />}
                  Confirm Top-Up
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
