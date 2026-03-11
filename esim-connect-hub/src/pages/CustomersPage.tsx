import { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { apiClient } from "@/lib/api";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Users,
  Search,
  Mail,
  ChevronRight,
  ShoppingBag,
  ChevronLeft,
  Loader2,
} from "lucide-react";
import { cn } from "@/lib/utils";

const PAGE_SIZE = 20;

export default function CustomersPage() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [customers, setCustomers] = useState<any[]>([]);
  const [pagination, setPagination] = useState({ page: 1, limit: PAGE_SIZE, total: 0, totalPages: 0 });
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState("");
  const [selectedEmail, setSelectedEmail] = useState<string | null>(null);
  const [detail, setDetail] = useState<any | null>(null);
  const [detailLoading, setDetailLoading] = useState(false);

  const loadCustomers = useCallback(
    async (page = 1) => {
      setLoading(true);
      try {
        const res = await apiClient.getCustomers({ page, limit: PAGE_SIZE, search: search || undefined });
        setCustomers((res as any)?.customers ?? []);
        setPagination((res as any)?.pagination ?? { page: 1, limit: PAGE_SIZE, total: 0, totalPages: 0 });
      } catch (err: any) {
        toast({
          title: "Error",
          description: err?.message || "Failed to load customers.",
          variant: "destructive",
        });
      } finally {
        setLoading(false);
      }
    },
    [search, toast]
  );

  useEffect(() => {
    loadCustomers(1);
  }, [loadCustomers]);

  const loadDetail = async (email: string) => {
    setSelectedEmail(email);
    setDetailLoading(true);
    setDetail(null);
    try {
      const res = await apiClient.getCustomerDetail(email);
      setDetail(res);
    } catch (err: any) {
      toast({
        title: "Error",
        description: err?.message || "Failed to load customer.",
        variant: "destructive",
      });
    } finally {
      setDetailLoading(false);
    }
  };

  const handleSearch = () => loadCustomers(1);

  return (
    <div className="min-h-screen bg-background">
      <div className="bg-card border-b border-border sticky top-16 md:top-20 z-40">
        <div className="container-custom py-4">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <h1 className="font-display text-2xl font-bold">Customers</h1>
              <p className="text-sm text-muted-foreground">
                Store customers who have placed orders
              </p>
            </div>
            <div className="flex gap-2">
              <Input
                placeholder="Search by email or name..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleSearch()}
                className="w-64"
              />
              <Button onClick={handleSearch} disabled={loading}>
                <Search className="w-4 h-4" />
              </Button>
            </div>
          </div>
        </div>
      </div>

      <div className="container-custom py-6 flex gap-6">
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="flex-1 bg-card rounded-2xl border overflow-hidden"
        >
          {loading && customers.length === 0 ? (
            <div className="p-8 flex flex-col items-center gap-4">
              <Loader2 className="w-10 h-10 animate-spin text-primary" />
              <p className="text-sm text-muted-foreground">Loading customers...</p>
            </div>
          ) : customers.length === 0 ? (
            <div className="text-center py-16 text-muted-foreground">
              <Users className="w-12 h-12 mx-auto mb-4 opacity-50" />
              <p className="font-medium mb-2">No customers yet</p>
              <p className="text-sm">Customers will appear here once they place orders in your store.</p>
            </div>
          ) : (
            <>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-border bg-muted/30">
                      <th className="text-left py-3 px-4 text-xs font-medium text-muted-foreground uppercase">Customer</th>
                      <th className="text-left py-3 px-4 text-xs font-medium text-muted-foreground uppercase">Orders</th>
                      <th className="text-left py-3 px-4 text-xs font-medium text-muted-foreground uppercase">First order</th>
                      <th className="w-10" />
                    </tr>
                  </thead>
                  <tbody>
                    {customers.map((c, i) => (
                      <tr
                        key={c.email}
                        className={cn(
                          "border-b border-border/50 hover:bg-muted/20 cursor-pointer transition-colors",
                          selectedEmail === c.email && "bg-primary/5"
                        )}
                        onClick={() => loadDetail(c.email)}
                      >
                        <td className="py-3 px-4">
                          <div className="flex items-center gap-2">
                            <Mail className="w-4 h-4 text-muted-foreground" />
                            <div>
                              <p className="font-medium text-sm">{c.email}</p>
                              {c.name && <p className="text-xs text-muted-foreground">{c.name}</p>}
                            </div>
                          </div>
                        </td>
                        <td className="py-3 px-4 text-sm">{c.orderCount}</td>
                        <td className="py-3 px-4 text-sm text-muted-foreground">
                          {c.firstOrderAt
                            ? new Date(c.firstOrderAt).toLocaleDateString()
                            : "—"}
                        </td>
                        <td className="py-3 px-4">
                          <ChevronRight className="w-4 h-4 text-muted-foreground" />
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              {pagination.totalPages > 1 && (
                <div className="flex items-center justify-between p-4 border-t border-border">
                  <p className="text-sm text-muted-foreground">
                    Page {pagination.page} of {pagination.totalPages} ({pagination.total} customers)
                  </p>
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      disabled={pagination.page <= 1 || loading}
                      onClick={() => loadCustomers(pagination.page - 1)}
                    >
                      <ChevronLeft className="w-4 h-4" />
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      disabled={pagination.page >= pagination.totalPages || loading}
                      onClick={() => loadCustomers(pagination.page + 1)}
                    >
                      <ChevronRight className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              )}
            </>
          )}
        </motion.div>

        {selectedEmail && (
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            className="w-full md:w-96 lg:w-[420px] shrink-0"
          >
            <div className="bg-card rounded-2xl border p-6 sticky top-24">
              <h3 className="font-semibold mb-4">Customer detail</h3>
              {detailLoading ? (
                <div className="flex justify-center py-8">
                  <Loader2 className="w-8 h-8 animate-spin text-primary" />
                </div>
              ) : detail ? (
                <div className="space-y-4">
                  <div>
                    <p className="text-xs text-muted-foreground mb-1">Email</p>
                    <p className="font-medium">{detail.email}</p>
                  </div>
                  {detail.name && (
                    <div>
                      <p className="text-xs text-muted-foreground mb-1">Name</p>
                      <p className="font-medium">{detail.name}</p>
                    </div>
                  )}
                  <div>
                    <p className="text-xs text-muted-foreground mb-1">Total orders</p>
                    <p className="font-medium">{detail.totalOrders}</p>
                  </div>
                  {detail.orders?.length > 0 && (
                    <div>
                      <p className="text-xs text-muted-foreground mb-2">Recent orders</p>
                      <div className="space-y-2 max-h-48 overflow-y-auto">
                        {detail.orders.slice(0, 5).map((o: any) => (
                          <div
                            key={o.id}
                            className="text-sm p-2 rounded-lg bg-muted/50 flex justify-between items-center"
                          >
                            <span className="truncate">{o.storeName || o.id}</span>
                            <span className="text-muted-foreground shrink-0 ml-2">
                              ${(o.totalAmount || 0).toFixed(2)}
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                  {detail.profiles?.length > 0 && (
                    <div>
                      <p className="text-xs text-muted-foreground mb-2">eSIM profiles</p>
                      <div className="space-y-2 max-h-32 overflow-y-auto">
                        {detail.profiles.slice(0, 3).map((p: any) => (
                          <div key={p.id} className="text-xs p-2 rounded bg-muted/50 font-mono truncate">
                            {p.iccid || p.esimTranNo || p.id}
                          </div>
                        ))}
                        {detail.profiles.length > 3 && (
                          <p className="text-xs text-muted-foreground">+{detail.profiles.length - 3} more</p>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              ) : (
                <p className="text-sm text-muted-foreground">Select a customer</p>
              )}
            </div>
          </motion.div>
        )}
      </div>
    </div>
  );
}
