import { useState, useEffect, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { apiClient } from "@/lib/api";
import {
  Search,
  Package,
  Globe,
  Clock,
  Wifi,
  RefreshCw,
  Download,
  ShoppingCart,
  X,
  ChevronLeft,
  ChevronRight,
  ChevronDown,
  ArrowUpDown,
  Check,
  Copy,
} from "lucide-react";
import { cn } from "@/lib/utils";

interface EsimPackage {
  packageCode?: string;
  slug?: string;
  name?: string;
  locationCode?: string;
  location?: string;
  type?: string;
  price?: number;
  currencyCode?: string;
  // API returns volume in bytes
  volume?: number;
  duration?: number;
  durationUnit?: string;
  speed?: string;
  // API integer fields
  dataType?: number;    // 1=Data in Total, 2=Daily
  activeType?: number;  // 1=Immediate, 2=First connection
  supportTopUpType?: number | string; // 0=none, 1=same area, 2=other area
  unusedValidTime?: number; // validity in days after expiry
  ipExport?: string | boolean; // breakout IP country or boolean
  coverage?: Array<{ country: string; network?: string }>;
}

interface CartItem {
  pkg: EsimPackage;
  qty: number;
}

const PAGE_SIZE = 10;

const getFlag = (locationCode?: string) => {
  if (!locationCode || locationCode.length !== 2) return "🌐";
  try {
    return String.fromCodePoint(...[...locationCode.toUpperCase()].map(c => 0x1F1E6 + c.charCodeAt(0) - 65));
  } catch {
    return "🌐";
  }
};

// volume is bytes from eSIM Access API
const formatData = (pkg: EsimPackage) => {
  const bytes = pkg.volume;
  if (!bytes) return "—";
  if (bytes >= 1_000_000_000) return `${(bytes / 1_000_000_000).toFixed(0)} GB`;
  if (bytes >= 1_000_000) return `${(bytes / 1_000_000).toFixed(0)} MB`;
  return `${bytes} B`;
};

const formatPrice = (price?: number) => {
  if (price == null) return "—";
  return `$${(price / 10000).toFixed(2)}`;
};

const formatPerGB = (pkg: EsimPackage) => {
  if (!pkg.price || !pkg.volume) return "—";
  const gb = pkg.volume / 1_000_000_000;
  if (gb <= 0) return "—";
  return `$${((pkg.price / 10000) / gb).toFixed(2)}`;
};

const formatTopUpType = (v?: number | string) => {
  const n = Number(v);
  if (v == null || v === "") return "—";
  if (n === 0) return "None";
  if (n === 1) return "Data Reloadable for same area within validity";
  if (n === 2) return "Data Reloadable for other area";
  return String(v);
};

const formatDataType = (v?: number) => {
  if (v == null) return "Data in Total";
  if (v === 1) return "Data in Total";
  if (v === 2) return "Daily";
  return String(v);
};

const formatActiveType = (v?: number) => {
  if (v == null) return "First connection";
  if (v === 1) return "Immediate activation";
  if (v === 2) return "First connection";
  return String(v);
};

const formatIpExport = (v?: string | boolean) => {
  if (v == null || v === false || v === "") return "—";
  if (v === true) return "Yes";
  return String(v);
};

export default function PackageBrowser() {
  const navigate = useNavigate();
  const { toast } = useToast();

  const [packages, setPackages] = useState<EsimPackage[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [balance, setBalance] = useState<number | null>(null);

  // Filters
  const [regionFilter, setRegionFilter] = useState("");
  const [nameFilter, setNameFilter] = useState("");
  const [durationFilter, setDurationFilter] = useState("");
  const [dataTypeFilter, setDataTypeFilter] = useState("ALL");
  const [typeFilter, setTypeFilter] = useState<"ALL" | "BASE" | "TOPUP">("ALL");
  const [page, setPage] = useState(1);

  // Sort
  const [sortKey, setSortKey] = useState<string>("name");
  const [sortDir, setSortDir] = useState<"asc" | "desc">("asc");

  // Plan detail modal
  const [selectedPlan, setSelectedPlan] = useState<EsimPackage | null>(null);
  const [coverageSearch, setCoverageSearch] = useState("");
  const [copiedSlug, setCopiedSlug] = useState(false);

  // Cart
  const [cart, setCart] = useState<CartItem[]>([]);
  const [showCart, setShowCart] = useState(false);

  useEffect(() => {
    fetchPackages();
    fetchBalance();
  }, [typeFilter]);

  const fetchPackages = async () => {
    // Top-up packages are per-ICCID; eSIM Access API requires iccid for type=TOPUP and errors without it.
    // Show an info state instead of calling the API.
    if (typeFilter === "TOPUP") {
      setLoading(false);
      setError(null);
      setPackages([]);
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const result = await apiClient.getPackages(
        typeFilter !== "ALL" ? { type: typeFilter } : undefined
      );
      const list =
        result?.obj?.packageList ||
        result?.packageList ||
        (Array.isArray(result) ? result : []);
      setPackages(list);
    } catch (err: any) {
      const msg = err?.message || "Failed to load packages.";
      setError(msg);
      toast({ title: "Error", description: msg, variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  const fetchBalance = async () => {
    try {
      const res = await apiClient.getBalance();
      setBalance(res?.balance ?? null);
    } catch {
      // non-blocking
    }
  };

  const filteredPackages = useMemo(() => {
    let list = packages.filter((pkg) => {
      const name = (pkg.name || pkg.slug || pkg.packageCode || "").toLowerCase();
      const loc = (pkg.locationCode || pkg.location || "").toLowerCase();
      if (regionFilter && !loc.includes(regionFilter.toLowerCase())) return false;
      if (nameFilter && !name.includes(nameFilter.toLowerCase())) return false;
      if (durationFilter && String(pkg.duration || "") !== durationFilter) return false;
      return true;
    });

    list = [...list].sort((a, b) => {
      let av: any, bv: any;
      switch (sortKey) {
        case "name": av = a.name || ""; bv = b.name || ""; break;
        case "price": av = a.price || 0; bv = b.price || 0; break;
        case "data": av = a.volume || 0; bv = b.volume || 0; break;
        case "duration": av = a.duration || 0; bv = b.duration || 0; break;
        case "region": av = a.location || a.locationCode || ""; bv = b.location || b.locationCode || ""; break;
        default: av = ""; bv = "";
      }
      if (av < bv) return sortDir === "asc" ? -1 : 1;
      if (av > bv) return sortDir === "asc" ? 1 : -1;
      return 0;
    });

    return list;
  }, [packages, regionFilter, nameFilter, durationFilter, sortKey, sortDir]);

  const paginatedPackages = useMemo(() => {
    const start = (page - 1) * PAGE_SIZE;
    return filteredPackages.slice(start, start + PAGE_SIZE);
  }, [filteredPackages, page]);

  const totalPages = Math.ceil(filteredPackages.length / PAGE_SIZE);

  const handleSort = (key: string) => {
    if (sortKey === key) {
      setSortDir(sortDir === "asc" ? "desc" : "asc");
    } else {
      setSortKey(key);
      setSortDir("asc");
    }
  };

  const cartTotal = cart.reduce((sum, item) => sum + ((item.pkg.price || 0) / 10000) * item.qty, 0);
  const cartCount = cart.reduce((sum, item) => sum + item.qty, 0);

  const addToCart = (pkg: EsimPackage) => {
    setCart((prev) => {
      const id = pkg.slug || pkg.packageCode || pkg.name || "";
      const existing = prev.find((c) => (c.pkg.slug || c.pkg.packageCode) === id);
      if (existing) return prev.map((c) => (c.pkg.slug || c.pkg.packageCode) === id ? { ...c, qty: c.qty + 1 } : c);
      return [...prev, { pkg, qty: 1 }];
    });
    toast({ title: "Added to cart", description: pkg.name || pkg.slug || "Package added." });
  };

  const removeFromCart = (id: string) => {
    setCart((prev) => prev.filter((c) => (c.pkg.slug || c.pkg.packageCode) !== id));
  };

  const handleCheckout = () => {
    if (cart.length === 0) return;
    const first = cart[0];
    const slug = first.pkg.slug || first.pkg.packageCode || "";
    navigate(`/dashboard/create-order?slug=${encodeURIComponent(slug)}&qty=${first.qty}`);
  };

  const exportCSV = () => {
    const headers = ["Name", "Slug", "Location", "Type", "Price (USD)", "Data", "Duration", "Per GB", "Speed", "Sug. Retail"];
    const rows = filteredPackages.map((p) => [
      p.name || "",
      p.slug || p.packageCode || "",
      p.location || p.locationCode || "",
      p.type || "",
      formatPrice(p.price),
      formatData(p),
      p.duration ? `${p.duration} ${p.durationUnit || "DAY"}` : "",
      formatPerGB(p),
      p.speed || "",
      formatPrice(p.suggestedRetailPrice),
    ]);
    const csv = [headers, ...rows].map((r) => r.map((v) => `"${v}"`).join(",")).join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "esim-plans.csv";
    a.click();
    URL.revokeObjectURL(url);
  };

  const SortIcon = ({ col }: { col: string }) => (
    <ArrowUpDown className={cn("w-3 h-3 ml-1 inline", sortKey === col ? "text-primary" : "text-muted-foreground")} />
  );

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="bg-card border-b border-border sticky top-16 md:top-20 z-40">
        <div className="container-custom py-3">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
            <div>
              <h1 className="font-display text-xl font-bold">eSIM Plans</h1>
              <p className="text-xs text-muted-foreground">Browse all available packages</p>
            </div>
            <div className="flex items-center gap-3 flex-wrap">
              {balance != null && (
                <div className="flex items-center gap-2 bg-muted/50 rounded-lg px-3 py-1.5">
                  <span className="text-xs text-muted-foreground">Credits left:</span>
                  <span className="text-sm font-bold text-primary">${balance.toFixed(2)}</span>
                </div>
              )}
              {cartCount > 0 && (
                <>
                  <div className="text-sm text-muted-foreground">
                    Plan: <strong>{cartCount}</strong> · Total: <strong className="text-primary">${cartTotal.toFixed(2)}</strong>
                  </div>
                  <Button variant="gradient" size="sm" onClick={handleCheckout} className="gap-2">
                    <ShoppingCart className="w-4 h-4" />
                    Check out
                  </Button>
                </>
              )}
              <Button variant="outline" size="sm" onClick={exportCSV} className="gap-2">
                <Download className="w-4 h-4" />
                CSV
              </Button>
              <Button variant="outline" size="sm" onClick={fetchPackages} disabled={loading} className="gap-2">
                <RefreshCw className={cn("w-4 h-4", loading && "animate-spin")} />
              </Button>
            </div>
          </div>
        </div>
      </div>

      <div className="container-custom py-4">
        {/* Filters */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-card rounded-xl p-3 border mb-4"
        >
          <div className="flex flex-wrap gap-2 items-end">
            <div className="flex flex-col gap-1">
              <label className="text-xs text-muted-foreground">Region</label>
              <div className="relative">
                <Input
                  placeholder="Region"
                  value={regionFilter}
                  onChange={(e) => { setRegionFilter(e.target.value); setPage(1); }}
                  className="h-8 text-sm w-32"
                />
                <ChevronDown className="absolute right-2 top-1/2 -translate-y-1/2 w-3 h-3 text-muted-foreground pointer-events-none" />
              </div>
            </div>
            <div className="flex flex-col gap-1">
              <label className="text-xs text-muted-foreground">Name</label>
              <Input
                placeholder="Name"
                value={nameFilter}
                onChange={(e) => { setNameFilter(e.target.value); setPage(1); }}
                className="h-8 text-sm w-36"
              />
            </div>
            <div className="flex flex-col gap-1">
              <label className="text-xs text-muted-foreground">Duration (days)</label>
              <Input
                placeholder="Duration"
                value={durationFilter}
                onChange={(e) => { setDurationFilter(e.target.value); setPage(1); }}
                className="h-8 text-sm w-28"
              />
            </div>
            <div className="flex flex-col gap-1">
              <label className="text-xs text-muted-foreground">Data type</label>
              <div className="relative">
                <select
                  value={dataTypeFilter}
                  onChange={(e) => setDataTypeFilter(e.target.value)}
                  className="h-8 px-3 text-sm rounded-md border border-input bg-background appearance-none pr-7 w-36"
                >
                  <option value="ALL">All types</option>
                  <option value="DATA_IN_TOTAL">Data in Total</option>
                  <option value="DAILY">Daily</option>
                </select>
                <ChevronDown className="absolute right-2 top-1/2 -translate-y-1/2 w-3 h-3 text-muted-foreground pointer-events-none" />
              </div>
            </div>
            <div className="flex flex-col gap-1">
              <label className="text-xs text-muted-foreground">Type</label>
              <div className="flex gap-1">
                {(["ALL", "BASE", "TOPUP"] as const).map((t) => (
                  <Button
                    key={t}
                    variant={typeFilter === t ? "gradient" : "outline"}
                    size="sm"
                    onClick={() => { setTypeFilter(t); setPage(1); }}
                    className="h-8 px-3 text-xs"
                  >
                    {t}
                  </Button>
                ))}
              </div>
            </div>
            <Button
              size="sm"
              onClick={() => { fetchPackages(); setPage(1); }}
              disabled={loading}
              className="h-8 gap-1.5 mt-4"
            >
              <Search className="w-3.5 h-3.5" />
              Search
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                setRegionFilter(""); setNameFilter(""); setDurationFilter("");
                setDataTypeFilter("ALL"); setTypeFilter("ALL"); setPage(1);
              }}
              className="h-8 mt-4"
            >
              Reset
            </Button>
            {!loading && (
              <span className="text-xs text-muted-foreground mt-4 ml-auto">
                Total {filteredPackages.length}
              </span>
            )}
          </div>
        </motion.div>

        {/* Error */}
        {error && !loading && (
          <div className="text-center py-12">
            <Wifi className="w-12 h-12 mx-auto mb-4 text-destructive opacity-50" />
            <p className="text-muted-foreground mb-4">{error}</p>
            <Button variant="outline" onClick={() => navigate("/dashboard/developer")}>Configure API Key</Button>
          </div>
        )}

        {/* Top-up info: packages are per-ICCID, shown in My eSIM → Action → TOP UP */}
        {!error && typeFilter === "TOPUP" && !loading && (
          <div className="text-center py-12 rounded-2xl border bg-muted/30">
            <Package className="w-12 h-12 mx-auto mb-4 text-primary opacity-70" />
            <p className="font-medium text-foreground mb-1">Top-up packages are per eSIM</p>
            <p className="text-sm text-muted-foreground mb-4 max-w-md mx-auto">
              To see and add top-up plans, open <strong>My eSIM</strong>, select an eSIM, then use the <strong>Action</strong> tab → <strong>TOP UP</strong>.
            </p>
            <Button variant="default" onClick={() => navigate("/dashboard/profiles")}>
              Go to My eSIM
            </Button>
          </div>
        )}

        {/* Table */}
        {!error && (typeFilter !== "TOPUP" || loading) && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.05 }}
            className="bg-card rounded-2xl border overflow-hidden"
          >
            {loading ? (
              <div className="p-6 space-y-2">
                {Array.from({ length: 10 }).map((_, i) => (
                  <div key={i} className="h-12 bg-muted rounded animate-pulse" />
                ))}
              </div>
            ) : paginatedPackages.length === 0 ? (
              <div className="text-center py-16 text-muted-foreground">
                <Package className="w-12 h-12 mx-auto mb-4 opacity-50" />
                <p className="font-medium">No packages found</p>
                <p className="text-sm mt-1">Try adjusting your filters or check your API key in Developer.</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full min-w-[1000px]">
                  <thead>
                    <tr className="border-b border-border bg-muted/30">
                      <th className="text-left py-2.5 px-3 text-xs font-medium text-muted-foreground">
                        <button onClick={() => handleSort("name")} className="flex items-center hover:text-foreground">
                          Name <SortIcon col="name" />
                        </button>
                      </th>
                      <th className="text-left py-2.5 px-3 text-xs font-medium text-muted-foreground">
                        <button onClick={() => handleSort("price")} className="flex items-center hover:text-foreground">
                          Price <SortIcon col="price" />
                        </button>
                      </th>
                      <th className="text-left py-2.5 px-3 text-xs font-medium text-muted-foreground">
                        <button onClick={() => handleSort("data")} className="flex items-center hover:text-foreground">
                          Data <SortIcon col="data" />
                        </button>
                      </th>
                      <th className="text-left py-2.5 px-3 text-xs font-medium text-muted-foreground">
                        <button onClick={() => handleSort("duration")} className="flex items-center hover:text-foreground">
                          Duration <SortIcon col="duration" />
                        </button>
                      </th>
                      <th className="text-left py-2.5 px-3 text-xs font-medium text-muted-foreground">Per GB</th>
                      <th className="text-left py-2.5 px-3 text-xs font-medium text-muted-foreground">Sug.Retail</th>
                      <th className="text-left py-2.5 px-3 text-xs font-medium text-muted-foreground">Speed</th>
                      <th className="text-left py-2.5 px-3 text-xs font-medium text-muted-foreground">
                        <button onClick={() => handleSort("region")} className="flex items-center hover:text-foreground">
                          Region <SortIcon col="region" />
                        </button>
                      </th>
                      <th className="text-right py-2.5 px-3 text-xs font-medium text-muted-foreground">Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {paginatedPackages.map((pkg, index) => {
                      const id = pkg.slug || pkg.packageCode || String(index);
                      const loc = pkg.location || pkg.locationCode || "Global";
                      const flag = getFlag(pkg.locationCode);
                      const inCart = cart.some((c) => (c.pkg.slug || c.pkg.packageCode) === id);

                      return (
                        <tr
                          key={id}
                          className="border-b border-border/50 hover:bg-muted/20 transition-colors cursor-pointer"
                          onClick={() => { setSelectedPlan(pkg); setCoverageSearch(""); }}
                        >
                          <td className="py-2.5 px-3">
                            <div className="flex items-center gap-2">
                              <span className="text-base">{flag}</span>
                              <span className="text-sm font-medium line-clamp-1">{pkg.name || id}</span>
                            </div>
                          </td>
                          <td className="py-2.5 px-3">
                            <span className="text-sm font-semibold">{formatPrice(pkg.price)}</span>
                          </td>
                          <td className="py-2.5 px-3">
                            <div className="flex items-center gap-1">
                              <span className="text-sm">{formatData(pkg)}</span>
                            </div>
                          </td>
                          <td className="py-2.5 px-3">
                            <div className="flex items-center gap-1 text-sm text-muted-foreground">
                              <Clock className="w-3.5 h-3.5" />
                              {pkg.duration ? `${pkg.duration} ${pkg.durationUnit || "DAY"}${pkg.duration !== 1 ? "s" : ""}` : "—"}
                            </div>
                          </td>
                          <td className="py-2.5 px-3 text-sm text-muted-foreground">{formatPerGB(pkg)}</td>
                          <td className="py-2.5 px-3 text-sm text-muted-foreground">{formatPrice(pkg.price != null ? pkg.price * 2 : undefined)}</td>
                          <td className="py-2.5 px-3 text-xs text-muted-foreground">{pkg.speed || "3G/4G/5G"}</td>
                          <td className="py-2.5 px-3 text-sm text-muted-foreground">{loc}</td>
                          <td className="py-2.5 px-3">
                            <div className="flex items-center justify-end gap-1" onClick={(e) => e.stopPropagation()}>
                              <Button
                                variant={inCart ? "outline" : "gradient"}
                                size="sm"
                                onClick={() => addToCart(pkg)}
                                className="h-7 px-2 text-xs gap-1"
                              >
                                {inCart ? <Check className="w-3 h-3" /> : <ShoppingCart className="w-3 h-3" />}
                                {inCart ? "Added" : "Add"}
                              </Button>
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
            {filteredPackages.length > 0 && (
              <div className="flex items-center justify-between p-4 border-t border-border">
                <span className="text-sm text-muted-foreground">Total {filteredPackages.length}</span>
                <div className="flex items-center gap-1">
                  <Button variant="outline" size="sm" className="h-7 w-7 p-0"
                    disabled={page <= 1} onClick={() => setPage(page - 1)}>
                    <ChevronLeft className="w-3.5 h-3.5" />
                  </Button>
                  {Array.from({ length: Math.min(totalPages, 7) }, (_, i) => i + 1).map((p) => (
                    <Button
                      key={p}
                      variant={p === page ? "gradient" : "outline"}
                      size="sm"
                      className="h-7 w-7 p-0 text-xs"
                      onClick={() => setPage(p)}
                    >
                      {p}
                    </Button>
                  ))}
                  {totalPages > 7 && <span className="text-muted-foreground text-xs px-1">...</span>}
                  <Button variant="outline" size="sm" className="h-7 w-7 p-0"
                    disabled={page >= totalPages} onClick={() => setPage(page + 1)}>
                    <ChevronRight className="w-3.5 h-3.5" />
                  </Button>
                  <span className="text-xs text-muted-foreground ml-2">{PAGE_SIZE}/page</span>
                  <span className="text-xs text-muted-foreground ml-2">Go to</span>
                  <Input
                    type="number" min={1} max={totalPages}
                    className="h-7 w-14 text-xs ml-1"
                    onKeyDown={(e) => {
                      if (e.key === "Enter") {
                        const v = parseInt((e.target as HTMLInputElement).value);
                        if (v >= 1 && v <= totalPages) setPage(v);
                      }
                    }}
                  />
                </div>
              </div>
            )}
          </motion.div>
        )}
      </div>

      {/* Plan Detail Modal */}
      <AnimatePresence>
        {selectedPlan && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-start justify-center bg-black/50 pt-20 px-4"
            onClick={() => setSelectedPlan(null)}
          >
            <motion.div
              initial={{ scale: 0.95, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.95, y: 20 }}
              className="bg-card w-full max-w-2xl rounded-2xl shadow-2xl border overflow-hidden max-h-[80vh] overflow-y-auto"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="sticky top-0 bg-card border-b border-border px-6 py-4 flex items-center justify-between z-10">
                <h2 className="font-semibold text-lg">Plan Details</h2>
                <Button variant="ghost" size="icon" onClick={() => setSelectedPlan(null)}>
                  <X className="w-4 h-4" />
                </Button>
              </div>

              <div className="p-6">
                {/* Main details grid */}
                <div className="grid grid-cols-2 gap-x-8 gap-y-3 mb-6">
                  {[
                    { label: "Name", value: selectedPlan.name },
                    { label: "Code", value: selectedPlan.packageCode, mono: true },
                    { label: "Slug", value: selectedPlan.slug, mono: true, copyKey: "slug" },
                    { label: "Data", value: formatData(selectedPlan) },
                    { label: "Data type", value: formatDataType(selectedPlan.dataType) },
                    { label: "Duration", value: selectedPlan.duration ? `${selectedPlan.duration} Days` : "—" },
                    { label: "Price", value: formatPrice(selectedPlan.price) },
                    { label: "Billing starts", value: formatActiveType(selectedPlan.activeType) },
                    { label: "Region type", value: "Single" },
                    { label: "Region", value: selectedPlan.location || selectedPlan.locationCode },
                    { label: "Top up type", value: formatTopUpType(selectedPlan.supportTopUpType) },
                    { label: "Breakout IP", value: formatIpExport(selectedPlan.ipExport) },
                    { label: "Validity", value: selectedPlan.unusedValidTime ? `${selectedPlan.unusedValidTime} Days` : "—" },
                  ].map(({ label, value, mono, copyKey }) => (
                    <div key={label} className="flex flex-col gap-0.5">
                      <span className="text-xs text-muted-foreground">{label}:</span>
                      <span className={cn("text-sm font-medium flex items-center gap-1", mono && "font-mono text-xs")}>
                        {value || "—"}
                        {value && copyKey && (
                          <button
                            onClick={() => {
                              navigator.clipboard.writeText(String(value));
                              setCopiedSlug(true);
                              setTimeout(() => setCopiedSlug(false), 2000);
                            }}
                            className="p-0.5 rounded hover:bg-muted"
                          >
                            {copiedSlug ? <Check className="w-3 h-3 text-green-500" /> : <Copy className="w-3 h-3 text-muted-foreground" />}
                          </button>
                        )}
                      </span>
                    </div>
                  ))}
                </div>

                {/* Coverage */}
                <div className="border-t border-border pt-4">
                  <h3 className="font-medium text-sm mb-3">Coverage and networks</h3>
                  <div className="relative mb-3">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground" />
                    <Input
                      placeholder="Country or area"
                      value={coverageSearch}
                      onChange={(e) => setCoverageSearch(e.target.value)}
                      className="pl-9 h-8 text-sm"
                    />
                  </div>
                  {selectedPlan.coverage && selectedPlan.coverage.length > 0 ? (
                    <div className="space-y-1 max-h-40 overflow-y-auto">
                      {selectedPlan.coverage
                        .filter((c) => !coverageSearch || c.country.toLowerCase().includes(coverageSearch.toLowerCase()))
                        .map((c, i) => (
                          <div key={i} className="flex items-center justify-between py-1.5 px-2 rounded hover:bg-muted/30">
                            <div className="flex items-center gap-2">
                              <span className="text-base">{getFlag(c.country.slice(0, 2))}</span>
                              <span className="text-sm">{c.country}</span>
                            </div>
                            {c.network && <span className="text-xs bg-muted px-1.5 py-0.5 rounded">{c.network}</span>}
                          </div>
                        ))
                      }
                    </div>
                  ) : (
                    <div className="flex items-center gap-2 py-2">
                      <Globe className="w-4 h-4 text-muted-foreground" />
                      <span className="text-sm">{selectedPlan.location || selectedPlan.locationCode || "Global"}</span>
                    </div>
                  )}
                </div>

                {/* Add to cart */}
                <div className="mt-6 flex gap-2 justify-end">
                  <Button variant="outline" onClick={() => setSelectedPlan(null)}>Close</Button>
                  <Button variant="gradient" onClick={() => { addToCart(selectedPlan); setSelectedPlan(null); }} className="gap-2">
                    <ShoppingCart className="w-4 h-4" />
                    Add to cart
                  </Button>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
