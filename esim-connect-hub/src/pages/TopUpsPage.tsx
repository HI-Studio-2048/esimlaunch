import { useState, useEffect, useCallback } from "react";
import { motion } from "framer-motion";
import { apiClient } from "@/lib/api";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import {
  RefreshCw,
  ChevronLeft,
  ChevronRight,
  Mail,
  Smartphone,
  Loader2,
  Package,
} from "lucide-react";

const PAGE_SIZE = 20;

export default function TopUpsPage() {
  const { toast } = useToast();
  const [topups, setTopups] = useState<any[]>([]);
  const [pagination, setPagination] = useState({ page: 1, limit: PAGE_SIZE, total: 0, totalPages: 0 });
  const [loading, setLoading] = useState(false);

  const loadTopups = useCallback(
    async (page = 1) => {
      setLoading(true);
      try {
        const res = await apiClient.getTopups({ page, limit: PAGE_SIZE });
        setTopups((res as any)?.topups ?? []);
        setPagination((res as any)?.pagination ?? { page: 1, limit: PAGE_SIZE, total: 0, totalPages: 0 });
      } catch (err: any) {
        toast({
          title: "Error",
          description: err?.message || "Failed to load top-ups.",
          variant: "destructive",
        });
      } finally {
        setLoading(false);
      }
    },
    [toast]
  );

  useEffect(() => {
    loadTopups(1);
  }, [loadTopups]);

  const getStatusBadge = (status: string) => {
    const s = (status || "").toLowerCase();
    if (s === "completed") return { label: "Completed", cls: "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400" };
    if (s === "pending") return { label: "Pending", cls: "bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400" };
    if (s === "failed") return { label: "Failed", cls: "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400" };
    return { label: status || "Unknown", cls: "bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300" };
  };

  return (
    <div className="min-h-screen bg-background">
      <div className="bg-card border-b border-border sticky top-16 md:top-20 z-40">
        <div className="container-custom py-4">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <h1 className="font-display text-2xl font-bold">Top-ups</h1>
              <p className="text-sm text-muted-foreground">
                Customer eSIM data top-ups (additional data purchased for existing eSIMs)
              </p>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={() => loadTopups(pagination.page)}
              disabled={loading}
              className="gap-2 w-fit"
            >
              <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin" : ""}`} />
              Refresh
            </Button>
          </div>
        </div>
      </div>

      <div className="container-custom py-6">
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-card rounded-2xl border overflow-hidden"
        >
          {loading && topups.length === 0 ? (
            <div className="p-8 flex flex-col items-center gap-4">
              <Loader2 className="w-10 h-10 animate-spin text-primary" />
              <p className="text-sm text-muted-foreground">Loading top-ups...</p>
            </div>
          ) : topups.length === 0 ? (
            <div className="text-center py-16 text-muted-foreground">
              <Package className="w-12 h-12 mx-auto mb-4 opacity-50" />
              <p className="font-medium mb-2">No top-ups yet</p>
              <p className="text-sm max-w-md mx-auto">
                Top-ups appear here when customers purchase additional data for their eSIMs. Ensure your store is configured to report top-ups to the dashboard.
              </p>
            </div>
          ) : (
            <>
              <div className="overflow-x-auto">
                <table className="w-full min-w-[600px]">
                  <thead>
                    <tr className="border-b border-border bg-muted/30">
                      <th className="text-left py-3 px-4 text-xs font-medium text-muted-foreground uppercase">Customer</th>
                      <th className="text-left py-3 px-4 text-xs font-medium text-muted-foreground uppercase">eSIM</th>
                      <th className="text-left py-3 px-4 text-xs font-medium text-muted-foreground uppercase">Amount</th>
                      <th className="text-left py-3 px-4 text-xs font-medium text-muted-foreground uppercase">Status</th>
                      <th className="text-left py-3 px-4 text-xs font-medium text-muted-foreground uppercase">Date</th>
                    </tr>
                  </thead>
                  <tbody>
                    {topups.map((t) => {
                      const statusBadge = getStatusBadge(t.status);
                      return (
                        <tr key={t.id} className="border-b border-border/50 hover:bg-muted/20 transition-colors">
                          <td className="py-3 px-4">
                            <div className="flex items-center gap-2">
                              <Mail className="w-4 h-4 text-muted-foreground shrink-0" />
                              <div>
                                <p className="text-sm font-medium">{t.customerEmail}</p>
                                {t.customerName && <p className="text-xs text-muted-foreground">{t.customerName}</p>}
                              </div>
                            </div>
                          </td>
                          <td className="py-3 px-4">
                            <div className="flex items-center gap-2">
                              <Smartphone className="w-4 h-4 text-muted-foreground shrink-0" />
                              <div className="font-mono text-sm truncate max-w-[140px]" title={t.iccid || t.esimTranNo}>
                                {t.iccid || t.esimTranNo || "—"}
                              </div>
                            </div>
                          </td>
                          <td className="py-3 px-4 text-sm font-medium">
                            ${((t.amountCents || 0) / 100).toFixed(2)}
                          </td>
                          <td className="py-3 px-4">
                            <span className={`inline-flex px-2 py-0.5 rounded-full text-xs font-medium ${statusBadge.cls}`}>
                              {statusBadge.label}
                            </span>
                          </td>
                          <td className="py-3 px-4 text-sm text-muted-foreground whitespace-nowrap">
                            {t.createdAt ? new Date(t.createdAt).toLocaleString() : "—"}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
              {pagination.totalPages > 1 && (
                <div className="flex items-center justify-between p-4 border-t border-border">
                  <p className="text-sm text-muted-foreground">
                    Page {pagination.page} of {pagination.totalPages} ({pagination.total} top-ups)
                  </p>
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      disabled={pagination.page <= 1 || loading}
                      onClick={() => loadTopups(pagination.page - 1)}
                    >
                      <ChevronLeft className="w-4 h-4" />
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      disabled={pagination.page >= pagination.totalPages || loading}
                      onClick={() => loadTopups(pagination.page + 1)}
                    >
                      <ChevronRight className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              )}
            </>
          )}
        </motion.div>
      </div>
    </div>
  );
}
