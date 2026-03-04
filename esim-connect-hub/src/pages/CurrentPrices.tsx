import { useState, useEffect, useMemo, useCallback } from "react";
import { Link } from "react-router-dom";
import {
  Database,
  Search,
  RefreshCw,
  Share2,
  Download,
  ChevronDown,
  ChevronUp,
  Zap,
  Infinity,
  Check,
  Minus,
  Smile,
  Meh,
  Frown,
  MapPin,
  Crosshair,
  HelpCircle,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { parseEsimPricesCsv, inferSize, type EsimPriceRow } from "@/lib/parseEsimPrices";
import { cn } from "@/lib/utils";
import { format } from "date-fns";

const PAGE_SIZE = 100;
function getFlagEmoji(code: string): string {
  const c = code.split("-")[0].toUpperCase();
  if (!c || c.length !== 2) return "🌐";
  try {
    return String.fromCodePoint(
      ...[...c].map((ch) => 0x1f1e6 + ch.charCodeAt(0) - 65)
    );
  } catch {
    return "🌐";
  }
}

function Flag({ code }: { code: string }) {
  const c = code.split("-")[0].toLowerCase();
  if (!c || c.length !== 2) {
    return <span className="text-sm align-middle">🌐</span>;
  }
  return (
    <>
      <img
        src={`https://flagcdn.com/w20/${c}.png`}
        alt=""
        className="inline-block w-5 h-3.5 object-cover rounded-sm align-middle shrink-0"
        loading="lazy"
        onError={(e) => {
          e.currentTarget.style.display = "none";
          const fallback = e.currentTarget.nextElementSibling;
          if (fallback) (fallback as HTMLElement).style.display = "inline";
        }}
      />
      <span className="text-sm align-middle hidden" aria-hidden>
        {getFlagEmoji(code)}
      </span>
    </>
  );
}

function TypeIcon({ type }: { type: string }) {
  const isRegional = type.toLowerCase().includes("regional");
  const label = type || "—";
    return (
    <Tooltip>
      <TooltipTrigger asChild>
        <div
          className={cn(
            "w-6 h-6 rounded-full flex items-center justify-center shrink-0 cursor-help",
            isRegional ? "bg-violet-100 text-violet-600" : "bg-sky-100 text-sky-600"
          )}
        >
          {isRegional ? (
            <MapPin className="w-3 h-3" />
          ) : (
            <Crosshair className="w-3 h-3" />
          )}
        </div>
      </TooltipTrigger>
      <TooltipContent className="bg-gray-800 text-white border-0">
        <p>{label}</p>
      </TooltipContent>
    </Tooltip>
  );
}

function PlanIcon({ plan }: { plan: string }) {
  const isUnlimited = plan.toLowerCase().includes("unlimited") || plan.toLowerCase().includes("fup");
  const label = isUnlimited ? "Unlimited FUP" : "Full Speed";
  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <div
          className={cn(
            "w-6 h-6 rounded-full flex items-center justify-center shrink-0 cursor-help",
            isUnlimited ? "bg-orange-100 text-orange-600" : "bg-emerald-100 text-emerald-600"
          )}
        >
          {isUnlimited ? (
            <Infinity className="w-3 h-3" />
          ) : (
            <Zap className="w-3 h-3" />
          )}
        </div>
      </TooltipTrigger>
      <TooltipContent className="bg-gray-800 text-white border-0">
        <p>{label}</p>
      </TooltipContent>
    </Tooltip>
  );
}

function DaysPill({ days }: { days: number }) {
  const color =
    days === 1
      ? "bg-red-100 text-red-700"
      : days === 7
        ? "bg-amber-100 text-amber-700"
        : days === 15
          ? "bg-green-100 text-green-700"
          : "bg-emerald-100 text-emerald-700";
  return (
    <span className={cn("inline-flex items-center px-2 py-0.5 rounded-md text-xs font-medium", color)}>
      {days}
    </span>
  );
}

function PricePerGbFace({ value }: { value: number | null }) {
  if (value == null) return <span className="text-gray-400">—</span>;
  const isGood = value < 2;
  const isBad = value > 5;
  const label = isGood ? "Good value ($/GB < 2)" : isBad ? "Higher cost ($/GB > 5)" : "Fair value ($/GB 2–5)";
  const Icon = isGood ? Smile : isBad ? Frown : Meh;
  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <div className="flex items-center justify-center cursor-help">
          <Icon className={cn("w-5 h-5", isGood ? "text-emerald-500" : isBad ? "text-gray-400" : "text-amber-500")} />
        </div>
      </TooltipTrigger>
      <TooltipContent className="bg-gray-800 text-white border-0">
        <p>{label}</p>
      </TooltipContent>
    </Tooltip>
  );
}

const COUNTRY_COLORS = [
  "bg-red-500",
  "bg-emerald-500",
  "bg-blue-500",
  "bg-amber-500",
  "bg-violet-500",
  "bg-cyan-500",
  "bg-rose-500",
  "bg-teal-500",
];

export default function CurrentPrices() {
  const [data, setData] = useState<EsimPriceRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [sortBy, setSortBy] = useState<"location" | "planName" | "price" | "gb" | "days">("location");
  const [sortAsc, setSortAsc] = useState(true);
  const [page, setPage] = useState(0);
  const [filterType, setFilterType] = useState("All Types");
  const [filterSms, setFilterSms] = useState("All");
  const [lastUpdated, setLastUpdated] = useState<Date>(new Date());

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch("/esim-prices-2026-03-04.csv");
      const text = await res.text();
      const rows = parseEsimPricesCsv(text);
      setData(rows);
      setLastUpdated(new Date());
    } catch (err) {
      console.error("Failed to load prices:", err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const uniqueTypes = useMemo(() => {
    const s = new Set<string>();
    data.forEach((r) => r.type && s.add(r.type));
    return Array.from(s).sort();
  }, [data]);

  const filtered = useMemo(() => {
    let result = [...data];

    if (search.trim()) {
      const q = search.toLowerCase();
      result = result.filter(
        (r) =>
          r.planName.toLowerCase().includes(q) ||
          r.location.toLowerCase().includes(q) ||
          r.slug.toLowerCase().includes(q) ||
          r.code.toLowerCase().includes(q) ||
          r.planId.toLowerCase().includes(q)
      );
    }

    if (filterType !== "All Types" && filterType) {
      result = result.filter((r) => r.type === filterType);
    }

    if (filterSms === "Yes") result = result.filter((r) => r.sms === "Yes");
    if (filterSms === "No") result = result.filter((r) => r.sms !== "Yes");

    if (sortBy === "location") {
      result.sort((a, b) =>
        sortAsc
          ? a.location.localeCompare(b.location)
          : b.location.localeCompare(a.location)
      );
    } else if (sortBy === "planName") {
      result.sort((a, b) =>
        sortAsc
          ? a.planName.localeCompare(b.planName)
          : b.planName.localeCompare(a.planName)
      );
    } else if (sortBy === "price") {
      result.sort((a, b) => (sortAsc ? a.price - b.price : b.price - a.price));
    } else if (sortBy === "gb") {
      result.sort((a, b) => {
        const ga = parseFloat(a.gbs) || 0;
        const gb = parseFloat(b.gbs) || 0;
        return sortAsc ? ga - gb : gb - ga;
      });
    } else if (sortBy === "days") {
      result.sort((a, b) => (sortAsc ? a.days - b.days : b.days - a.days));
    }

    return result;
  }, [data, search, filterType, filterSms, sortBy, sortAsc]);

  const totalPlans = filtered.length;
  const paginated = useMemo(() => {
    const start = page * PAGE_SIZE;
    return filtered.slice(start, start + PAGE_SIZE);
  }, [filtered, page]);

  const countryColorMap = useMemo(() => {
    const seen = new Map<string, number>();
    let idx = 0;
    return (loc: string) => {
      if (!seen.has(loc)) seen.set(loc, idx++ % COUNTRY_COLORS.length);
      return COUNTRY_COLORS[seen.get(loc)!];
    };
  }, []);

  const exportCsv = () => {
    const headers = [
      "Type",
      "Plan",
      "Location",
      "Plan Name",
      "Price",
      "GBs",
      "Days",
      "$/GB",
      "Size",
      "SMS",
      "Top",
      "IP",
      "Code",
      "Slug",
      "PlanId",
    ];
    const lines = [headers.join(",")];
    filtered.forEach((r) => {
      lines.push(
        [
          r.type,
          r.plan,
          r.location,
          `"${r.planName}"`,
          r.price.toFixed(2),
          r.gbs,
          r.days,
          r.pricePerGb?.toFixed(2) ?? "",
          r.size || inferSize(r.gbs),
          r.sms,
          r.top,
          r.ip,
          r.code,
          r.slug,
          r.planId,
        ].join(",")
      );
    });
    const blob = new Blob([lines.join("\n")], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `esim-prices-${format(new Date(), "yyyy-MM-dd")}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const share = async () => {
    try {
      await navigator.share?.({
        title: "eSIMAccess Current Prices",
        text: `View ${totalPlans} eSIM plans with wholesale pricing`,
        url: window.location.href,
      });
    } catch (err) {
      if ((err as Error).name !== "AbortError") {
        navigator.clipboard?.writeText(window.location.href);
      }
    }
  };

  const currencySymbol = "$";

  return (
    <div className="min-h-screen bg-white text-gray-900">
      <div className="border-b border-gray-200 bg-gray-50">
        <div className="container-custom py-6">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
            <div className="flex flex-col gap-2">
              <div className="flex items-center gap-2">
                <Database className="w-6 h-6 text-primary" />
                <div>
                  <h1 className="text-2xl font-bold text-gray-900">Current Prices</h1>
                  <p className="text-sm text-gray-600">
                    View all eSIMAccess data plans with current pricing.
                  </p>
                </div>
              </div>
              <div className="flex gap-4 text-sm">
                <Link to="/roi-calculator" className="text-primary hover:underline">
                  Back to ROI Calculator
                </Link>
                <Link to="/" className="text-gray-600 hover:text-gray-900 hover:underline">
                  Home
                </Link>
              </div>
            </div>
            <div className="flex flex-wrap items-center gap-3">
              <span className="text-sm text-gray-600 font-medium px-3 py-2 bg-gray-100 rounded-md">
                USD ($)
              </span>
              <span className="text-xs text-gray-600 whitespace-nowrap">
                Next price check in 6h 5m (00:00 UTC)
              </span>
              <Button variant="outline" size="icon" onClick={loadData} disabled={loading}>
                <RefreshCw className={cn("w-4 h-4", loading && "animate-spin")} />
              </Button>
              <Button variant="outline" size="sm" onClick={share}>
                <Share2 className="w-4 h-4" />
                Share
              </Button>
              <Button variant="outline" size="sm" onClick={exportCsv}>
                <Download className="w-4 h-4" />
                Export
              </Button>
            </div>
          </div>
        </div>
      </div>

      <div className="w-full px-3 sm:px-4 lg:px-6 py-6">
        <div className="mb-4">
          <h2 className="text-lg font-semibold text-gray-900">All Data Plans</h2>
          <p className="text-sm text-gray-600 mt-1">
            {loading ? "Loading…" : `${totalPlans.toLocaleString()} plans available`} • Last updated:{" "}
            {format(lastUpdated, "dd/MM/yyyy, HH:mm:ss")}
          </p>
        </div>

        <div className="flex flex-wrap gap-2 mb-4">
          <div className="relative flex-1 min-w-[200px] max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
            <Input
              placeholder="Search by name, slug, location, or country code..."
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                setPage(0);
              }}
              className="pl-9 bg-white border-gray-300 text-gray-900 placeholder:text-gray-500"
            />
          </div>
          <Select
            value={sortBy}
            onValueChange={(v) => setSortBy(v as typeof sortBy)}
          >
            <SelectTrigger className="w-[140px] bg-white border-gray-300 text-gray-900">
              <SelectValue placeholder="Sort" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="location">Location A-Z</SelectItem>
              <SelectItem value="planName">Plan Name A-Z</SelectItem>
              <SelectItem value="price">Price</SelectItem>
              <SelectItem value="gb">Data (GB)</SelectItem>
              <SelectItem value="days">Days</SelectItem>
            </SelectContent>
          </Select>
          <Button
            variant="outline"
            size="icon"
            onClick={() => setSortAsc((a) => !a)}
            title={sortAsc ? "Ascending" : "Descending"}
          >
            {sortAsc ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
          </Button>
          <Input
            placeholder="Add by slug/code..."
            className="w-[180px] bg-white border-gray-300 text-gray-900 placeholder:text-gray-500"
          />
          <Select value={filterType} onValueChange={setFilterType}>
            <SelectTrigger className="w-[140px] bg-white border-gray-300 text-gray-900">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="All Types">All Types</SelectItem>
              {uniqueTypes.map((t) => (
                <SelectItem key={t} value={t}>
                  {t}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select value={filterSms} onValueChange={setFilterSms}>
            <SelectTrigger className="w-[120px] bg-white border-gray-300 text-gray-900">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="All">All SMS</SelectItem>
              <SelectItem value="Yes">SMS Yes</SelectItem>
              <SelectItem value="No">SMS No</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="mb-4 text-right text-sm text-gray-600">
          Showing {paginated.length} of {totalPlans.toLocaleString()} plans
        </div>

        <div className="w-full min-w-0 rounded-lg border border-gray-200 bg-white overflow-x-auto text-xs">
          <Table className="table-fixed w-full">
            <TableHeader>
              <TableRow>
                <TableHead className="w-4 px-1.5 py-1.5"></TableHead>
                <TableHead className="w-8 px-1.5 py-1.5">
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <span className="cursor-help">Type</span>
                    </TooltipTrigger>
                    <TooltipContent className="bg-gray-800 text-white border-0">
                      <p>Coverage: Single Country or Regional</p>
                    </TooltipContent>
                  </Tooltip>
                </TableHead>
                <TableHead className="w-8 px-1.5 py-1.5">
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <span className="cursor-help">Plan</span>
                    </TooltipTrigger>
                    <TooltipContent className="bg-gray-800 text-white border-0">
                      <p>Full Speed or Unlimited FUP (Fair Usage Policy)</p>
                    </TooltipContent>
                  </Tooltip>
                </TableHead>
                <TableHead
                  className="cursor-pointer hover:text-foreground w-20 px-1.5 py-1.5"
                  onClick={() => {
                    setSortBy("location");
                    setSortAsc((a) => !a);
                  }}
                >
                  Location {sortBy === "location" && (sortAsc ? "↑" : "↓")}
                </TableHead>
                <TableHead className="px-1.5 py-1.5" style={{ width: "14%" }}>Plan Name</TableHead>
                <TableHead className="w-20 px-1.5 py-1.5">USD</TableHead>
                <TableHead className="w-14 px-1.5 py-1.5">GBs</TableHead>
                <TableHead className="w-10 px-1.5 py-1.5">Days</TableHead>
                <TableHead className="w-8 px-1.5 py-1.5">
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <span className="cursor-help">$/GB</span>
                    </TooltipTrigger>
                    <TooltipContent className="bg-gray-800 text-white border-0">
                      <p>Cost efficiency: $/GB rating</p>
                    </TooltipContent>
                  </Tooltip>
                </TableHead>
                <TableHead className="w-8 px-1.5 py-1.5">Size</TableHead>
                <TableHead className="w-8 px-1.5 py-1.5">
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <span className="cursor-help">SMS</span>
                    </TooltipTrigger>
                    <TooltipContent className="bg-gray-800 text-white border-0">
                      <p>SMS capability included</p>
                    </TooltipContent>
                  </Tooltip>
                </TableHead>
                <TableHead className="w-8 px-1.5 py-1.5">
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <span className="cursor-help">Top</span>
                    </TooltipTrigger>
                    <TooltipContent className="bg-gray-800 text-white border-0">
                      <p>Top-up / data reload available</p>
                    </TooltipContent>
                  </Tooltip>
                </TableHead>
                <TableHead className="w-8 px-1.5 py-1.5">
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <span className="cursor-help inline-flex items-center gap-0.5">
                        Act
                        <HelpCircle className="w-3.5 h-3.5 text-gray-400" />
                      </span>
                    </TooltipTrigger>
                    <TooltipContent className="bg-gray-800 text-white border-0 max-w-[240px]">
                      <p className="font-medium">Pre-activation validity and activation type</p>
                      <p className="text-gray-300 text-xs mt-1">6 months pre-activation validity. Starts on first network connection.</p>
                    </TooltipContent>
                  </Tooltip>
                </TableHead>
                <TableHead className="w-12 px-1.5 py-1.5">IP</TableHead>
                <TableHead className="w-10 px-1.5 py-1.5">Code</TableHead>
                <TableHead className="px-1.5 py-1.5" style={{ width: "10%" }}>Slug</TableHead>
                <TableHead className="px-1.5 py-1.5" style={{ width: "9%" }}>PlanId</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell colSpan={18} className="text-center py-12 text-gray-500">
                    Loading prices…
                  </TableCell>
                </TableRow>
              ) : paginated.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={18} className="text-center py-12 text-gray-500">
                    No plans match your filters.
                  </TableCell>
                </TableRow>
              ) : (
                paginated.map((row) => (
                  <TableRow key={row.planId} className="group">
                    <TableCell className="p-0 w-4 align-middle">
                      <div
                        className={cn(
                          "w-0.5 min-h-[2.5rem] shrink-0",
                          countryColorMap(row.location)
                        )}
                      />
                    </TableCell>
                    <TableCell className="px-1.5 py-1.5">
                      <TypeIcon type={row.type} />
                    </TableCell>
                    <TableCell className="px-1.5 py-1.5">
                      <PlanIcon plan={row.plan} />
                    </TableCell>
                    <TableCell className="px-1.5 py-1.5 min-w-0">
                      <span className="inline-flex items-center gap-1.5">
                        <Flag code={row.code} />
                        {row.location}
                      </span>
                    </TableCell>
                    <TableCell className="px-1.5 py-1.5">
                      <span className="font-medium block truncate" title={row.planName}>
                        {row.planName}
                      </span>
                    </TableCell>
                    <TableCell className="px-1.5 py-1.5 whitespace-nowrap">
                      <span className="font-medium">
                        {currencySymbol}
                        {row.price.toFixed(2)}
                      </span>
                    </TableCell>
                    <TableCell className="px-1.5 py-1.5">{row.gbs}</TableCell>
                    <TableCell className="px-1.5 py-1.5">
                      <DaysPill days={row.days} />
                    </TableCell>
                    <TableCell className="px-1.5 py-1.5">
                      <PricePerGbFace value={row.pricePerGb} />
                    </TableCell>
                    <TableCell className="px-1.5 py-1.5">
                      <span className="inline-flex items-center justify-center w-8 h-6 rounded border border-border text-xs font-medium">
                        {row.size || inferSize(row.gbs)}
                      </span>
                    </TableCell>
                    <TableCell className="px-1.5 py-1.5">
                      {row.sms === "Yes" ? (
                        <Check className="w-5 h-5 text-emerald-500" />
                      ) : (
                        <Minus className="w-5 h-5 text-gray-400" />
                      )}
                    </TableCell>
                    <TableCell className="px-1.5 py-1.5">
                      {row.top === "Yes" ? (
                        <Check className="w-5 h-5 text-emerald-500" />
                      ) : (
                        <Minus className="w-5 h-5 text-gray-400" />
                      )}
                    </TableCell>
                    <TableCell className="px-1.5 py-1.5 text-gray-600">
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <span className="cursor-help inline-flex items-center gap-1">
                            6
                            <HelpCircle className="w-3 h-3 text-gray-400" />
                          </span>
                        </TooltipTrigger>
                        <TooltipContent className="bg-gray-800 text-white border-0">
                          <p>6 months pre-activation validity</p>
                          <p className="text-gray-300 text-xs mt-0.5">Starts on first network connection</p>
                        </TooltipContent>
                      </Tooltip>
                    </TableCell>
                    <TableCell className="px-1.5 py-1.5 text-gray-600">{row.ip || "—"}</TableCell>
                    <TableCell className="px-1.5 py-1.5 font-mono">{row.code}</TableCell>
                    <TableCell className="px-1.5 py-1.5 font-mono">
                      <span className="block truncate" title={row.slug}>{row.slug}</span>
                    </TableCell>
                    <TableCell className="px-1.5 py-1.5 font-mono">{row.planId}</TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>

        {totalPlans > PAGE_SIZE && (
          <div className="flex items-center justify-between mt-4">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setPage((p) => Math.max(0, p - 1))}
              disabled={page === 0}
            >
              Previous
            </Button>
            <span className="text-sm text-gray-600">
              Page {page + 1} of {Math.ceil(totalPlans / PAGE_SIZE)}
            </span>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setPage((p) => Math.min(Math.ceil(totalPlans / PAGE_SIZE) - 1, p + 1))}
              disabled={page >= Math.ceil(totalPlans / PAGE_SIZE) - 1}
            >
              Next
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}
