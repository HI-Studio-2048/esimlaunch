import { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { apiClient } from "@/lib/api";
import {
  Search,
  RefreshCw,
  ChevronLeft,
  ChevronRight,
  ShoppingBag,
  X,
  Calendar,
  QrCode,
  Copy,
  Check,
  RotateCcw,
  Mail,
  DollarSign,
  Trash2,
} from "lucide-react";
import { cn } from "@/lib/utils";

interface Order {
  id?: string;
  orderId?: string | null;
  paymentIntentId?: string | null;
  orderNo?: string;
  transactionId?: string;
  totalAmount?: number;
  currency?: string;
  status?: string;
  source?: "store" | "advanced";
  customerEmail?: string | null;
  customerName?: string | null;
  createdAt?: string;
  esimCount?: number;
  profiles?: Array<{
    iccid?: string;
    esimTranNo?: string;
    status?: string;
    lpa?: string;
    qrCodeUrl?: string;
  }>;
}

const PAGE_SIZE = 10;

export default function OrderHistory() {
  const navigate = useNavigate();
  const { toast } = useToast();

  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(false);
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);

  // Filters
  const [orderNoFilter, setOrderNoFilter] = useState("");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");

  // Detail modal
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [copiedField, setCopiedField] = useState<string | null>(null);
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  const fetchOrders = useCallback(
    async (pageNum: number = 1) => {
      setLoading(true);
      try {
        const res = await apiClient.getOrders(pageNum, PAGE_SIZE);
        const list = res?.orders || (Array.isArray(res) ? res : []);
        const tot = res?.pagination?.total ?? res?.total ?? list.length;
        setOrders(list);
        setTotal(tot);
        setPage(pageNum);
      } catch (err: any) {
        toast({
          title: "Error",
          description: err?.message || "Failed to load orders.",
          variant: "destructive",
        });
      } finally {
        setLoading(false);
      }
    },
    []
  );

  useEffect(() => {
    fetchOrders(1);
  }, []);

  const handleSearch = () => fetchOrders(1);

  const handleReset = () => {
    setOrderNoFilter("");
    setStartDate("");
    setEndDate("");
    setTimeout(() => fetchOrders(1), 0);
  };

  const copyToClipboard = (text: string, field: string) => {
    navigator.clipboard.writeText(text).then(() => {
      setCopiedField(field);
      setTimeout(() => setCopiedField(null), 2000);
    });
  };

  const runAction = async (
    action: string,
    fn: () => Promise<void>
  ) => {
    setActionLoading(action);
    try {
      await fn();
      toast({ title: "Success", description: "Action completed." });
      setSelectedOrder(null);
      fetchOrders(page);
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

  const handleRetry = () => {
    const o = selectedOrder!;
    const orderId = o.source === "store" ? o.orderId : o.id;
    if (!orderId) return;
    runAction("retry", () => apiClient.retryOrder(orderId));
  };
  const handleSync = () => {
    const o = selectedOrder!;
    const orderId = o.source === "store" ? o.orderId : o.id;
    if (!orderId) return;
    runAction("sync", () => apiClient.syncOrder(orderId));
  };
  const handleRefund = () => {
    const o = selectedOrder!;
    if (o.source !== "store" || !o.id) return;
    runAction("refund", () => apiClient.refundCustomerOrder(o.id!));
  };
  const handleResend = () => {
    const o = selectedOrder!;
    if (o.source !== "store" || !o.id) return;
    runAction("resend", () => apiClient.resendCustomerOrderEmail(o.id!));
  };
  const handleDelete = () => {
    const o = selectedOrder!;
    const orderId = o.source === "store" ? o.orderId : o.id;
    if (!orderId) return;
    if (!["PENDING", "FAILED"].includes((o.status || "").toUpperCase())) return;
    runAction("delete", () => apiClient.deleteOrder(orderId));
  };

  const getStatusBadge = (status?: string) => {
    if (!status) return { label: "Unknown", cls: "bg-gray-100 text-gray-700" };
    const s = status.toUpperCase();
    if (["COMPLETED", "SUCCESS"].includes(s)) return { label: "Completed", cls: "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400" };
    if (["PENDING", "PROCESSING"].includes(s)) return { label: "Processing", cls: "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400" };
    if (["FAILED", "CANCELLED", "CANCELED"].includes(s)) return { label: s.charAt(0) + s.slice(1).toLowerCase(), cls: "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400" };
    return { label: s, cls: "bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300" };
  };

  // Client-side filter by order no and date
  const filteredOrders = orders.filter((o) => {
    const oNo = (o.orderNo || o.transactionId || "").toLowerCase();
    if (orderNoFilter && !oNo.includes(orderNoFilter.toLowerCase())) return false;
    if (startDate && o.createdAt && new Date(o.createdAt) < new Date(startDate)) return false;
    if (endDate && o.createdAt && new Date(o.createdAt) > new Date(endDate + "T23:59:59")) return false;
    return true;
  });

  const totalPages = Math.ceil(total / PAGE_SIZE);

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="bg-card border-b border-border sticky top-16 md:top-20 z-40">
        <div className="container-custom py-4">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <h1 className="font-display text-2xl font-bold">My Order</h1>
              <p className="text-sm text-muted-foreground">View all your eSIM orders</p>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={() => fetchOrders(page)}
              disabled={loading}
              className="gap-2 w-fit"
            >
              <RefreshCw className={cn("w-4 h-4", loading && "animate-spin")} />
              Refresh
            </Button>
          </div>
        </div>
      </div>

      <div className="container-custom py-6">
        {/* Filters */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-card rounded-2xl p-4 border mb-4"
        >
          <div className="flex flex-wrap gap-3 items-end">
            <div className="flex flex-col gap-1">
              <label className="text-xs text-muted-foreground">Order No (Batch Id)</label>
              <Input
                placeholder="Please enter"
                value={orderNoFilter}
                onChange={(e) => setOrderNoFilter(e.target.value)}
                className="h-9 text-sm w-52"
              />
            </div>
            <div className="flex flex-col gap-1">
              <label className="text-xs text-muted-foreground">Purchase Date</label>
              <div className="flex items-center gap-2">
                <div className="relative">
                  <Calendar className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground pointer-events-none" />
                  <Input
                    type="date"
                    value={startDate}
                    onChange={(e) => setStartDate(e.target.value)}
                    className="h-9 text-sm pl-8 w-40"
                  />
                </div>
                <span className="text-sm text-muted-foreground">To</span>
                <Input
                  type="date"
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                  className="h-9 text-sm w-40"
                />
              </div>
            </div>
            <Button onClick={handleSearch} disabled={loading} className="h-9 gap-2">
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
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.05 }}
          className="bg-card rounded-2xl border overflow-hidden"
        >
          {loading && orders.length === 0 ? (
            <div className="p-8 space-y-3">
              {Array.from({ length: 5 }).map((_, i) => (
                <div key={i} className="h-14 bg-muted rounded-lg animate-pulse" />
              ))}
            </div>
          ) : filteredOrders.length === 0 ? (
            <div className="text-center py-16 text-muted-foreground">
              <ShoppingBag className="w-12 h-12 mx-auto mb-4 opacity-50" />
              <p className="font-medium mb-2">No orders found</p>
              <p className="text-sm mb-4">Place your first eSIM order to see it here.</p>
              <Button
                variant="gradient"
                size="sm"
                onClick={() => navigate("/dashboard/create-order")}
              >
                Create Order
              </Button>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full min-w-[700px]">
                <thead>
                  <tr className="border-b border-border bg-muted/30">
                    <th className="text-left py-3 px-4 text-xs font-medium text-muted-foreground uppercase tracking-wider">
                      Order No (Batch Id)
                    </th>
                    <th className="text-left py-3 px-4 text-xs font-medium text-muted-foreground uppercase tracking-wider">
                      Customer
                    </th>
                    <th className="text-left py-3 px-4 text-xs font-medium text-muted-foreground uppercase tracking-wider">
                      No. of eSIMs
                    </th>
                    <th className="text-left py-3 px-4 text-xs font-medium text-muted-foreground uppercase tracking-wider">
                      Create time
                    </th>
                    <th className="text-left py-3 px-4 text-xs font-medium text-muted-foreground uppercase tracking-wider">
                      Amount
                    </th>
                    <th className="text-left py-3 px-4 text-xs font-medium text-muted-foreground uppercase tracking-wider">
                      Status
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {filteredOrders.map((order, index) => {
                    const key = order.id || order.orderNo || order.transactionId || String(index);
                    const statusBadge = getStatusBadge(order.status);
                    const esimCount = order.esimCount || order.profiles?.length || 1;

                    return (
                      <motion.tr
                        key={key}
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ delay: index * 0.02 }}
                        className="border-b border-border/50 hover:bg-muted/20 transition-colors cursor-pointer"
                        onClick={() => setSelectedOrder(order)}
                      >
                        <td className="py-3 px-4">
                          <button
                            className="font-mono text-sm text-primary hover:underline"
                            onClick={(e) => { e.stopPropagation(); setSelectedOrder(order); }}
                          >
                            {order.orderNo || order.transactionId || "—"}
                          </button>
                        </td>
                        <td className="py-3 px-4 text-sm text-muted-foreground max-w-[140px] truncate" title={order.customerEmail || ""}>
                          {order.customerEmail || "—"}
                        </td>
                        <td className="py-3 px-4 text-sm">{esimCount}</td>
                        <td className="py-3 px-4 text-sm text-muted-foreground whitespace-nowrap">
                          {order.createdAt
                            ? new Date(order.createdAt).toLocaleString("en-US", {
                                year: "numeric", month: "2-digit", day: "2-digit",
                                hour: "2-digit", minute: "2-digit", second: "2-digit",
                              })
                            : "—"}
                        </td>
                        <td className="py-3 px-4 text-sm font-medium">
                          {order.totalAmount != null
                            ? `$${Number(order.totalAmount).toFixed(2)}`
                            : "—"}
                        </td>
                        <td className="py-3 px-4">
                          <span className={cn("px-2 py-0.5 rounded-full text-xs font-medium", statusBadge.cls)}>
                            {statusBadge.label}
                          </span>
                        </td>
                      </motion.tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}

          {/* Pagination */}
          {total > 0 && (
            <div className="flex items-center justify-between p-4 border-t border-border">
              <p className="text-sm text-muted-foreground">Total {total}</p>
              <div className="flex items-center gap-1">
                <Button variant="outline" size="sm" className="h-8 w-8 p-0"
                  disabled={page <= 1 || loading} onClick={() => fetchOrders(page - 1)}>
                  <ChevronLeft className="w-3.5 h-3.5" />
                </Button>
                {Array.from({ length: Math.min(totalPages, 7) }, (_, i) => i + 1).map((p) => (
                  <Button
                    key={p}
                    variant={p === page ? "gradient" : "outline"}
                    size="sm"
                    className="h-8 w-8 p-0 text-xs"
                    onClick={() => fetchOrders(p)}
                    disabled={loading}
                  >
                    {p}
                  </Button>
                ))}
                {totalPages > 7 && <span className="text-xs text-muted-foreground px-1">...</span>}
                <Button variant="outline" size="sm" className="h-8 w-8 p-0"
                  disabled={page >= totalPages || loading} onClick={() => fetchOrders(page + 1)}>
                  <ChevronRight className="w-3.5 h-3.5" />
                </Button>
                <span className="text-xs text-muted-foreground ml-2">Go to</span>
                <Input
                  type="number" min={1} max={totalPages}
                  className="h-8 w-14 text-xs ml-1"
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      const v = parseInt((e.target as HTMLInputElement).value);
                      if (v >= 1 && v <= totalPages) fetchOrders(v);
                    }
                  }}
                />
              </div>
            </div>
          )}
        </motion.div>
      </div>

      {/* Order Detail Modal */}
      <AnimatePresence>
        {selectedOrder && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 px-4"
            onClick={() => setSelectedOrder(null)}
          >
            <motion.div
              initial={{ scale: 0.95, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.95, y: 20 }}
              className="bg-card w-full max-w-2xl rounded-2xl shadow-2xl border overflow-hidden max-h-[85vh] overflow-y-auto"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="sticky top-0 bg-card border-b border-border px-6 py-4 flex items-center justify-between z-10">
                <div>
                  <h2 className="font-semibold text-lg">Order Details</h2>
                  <p className="text-xs font-mono text-muted-foreground mt-0.5">
                    {selectedOrder.orderNo || selectedOrder.transactionId}
                  </p>
                </div>
                <Button variant="ghost" size="icon" onClick={() => setSelectedOrder(null)}>
                  <X className="w-4 h-4" />
                </Button>
              </div>

              <div className="p-6">
                {/* Summary */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
                  <div className="bg-muted/30 rounded-xl p-3">
                    <p className="text-xs text-muted-foreground mb-1">Status</p>
                    <span className={cn("px-2 py-0.5 rounded-full text-xs font-medium", getStatusBadge(selectedOrder.status).cls)}>
                      {getStatusBadge(selectedOrder.status).label}
                    </span>
                  </div>
                  <div className="bg-muted/30 rounded-xl p-3">
                    <p className="text-xs text-muted-foreground mb-1">Amount</p>
                    <p className="text-sm font-bold">
                      {selectedOrder.totalAmount != null ? `$${Number(selectedOrder.totalAmount).toFixed(2)}` : "—"}
                    </p>
                  </div>
                  <div className="bg-muted/30 rounded-xl p-3">
                    <p className="text-xs text-muted-foreground mb-1">No. of eSIMs</p>
                    <p className="text-sm font-bold">
                      {selectedOrder.esimCount || selectedOrder.profiles?.length || 1}
                    </p>
                  </div>
                  <div className="bg-muted/30 rounded-xl p-3">
                    <p className="text-xs text-muted-foreground mb-1">Create time</p>
                    <p className="text-xs font-medium">
                      {selectedOrder.createdAt
                        ? new Date(selectedOrder.createdAt).toLocaleString()
                        : "—"}
                    </p>
                  </div>
                  {selectedOrder.customerEmail && (
                    <div className="bg-muted/30 rounded-xl p-3 col-span-2">
                      <p className="text-xs text-muted-foreground mb-1">Customer</p>
                      <p className="text-sm font-medium">{selectedOrder.customerEmail}</p>
                      {selectedOrder.customerName && <p className="text-xs text-muted-foreground">{selectedOrder.customerName}</p>}
                    </div>
                  )}
                </div>

                {/* Order actions */}
                <div className="flex flex-wrap gap-2 mb-6">
                  {selectedOrder.source === "store" && selectedOrder.orderId && (
                    <>
                      {!["COMPLETED", "CANCELLED", "FAILED"].includes((selectedOrder.status || "").toUpperCase()) && (
                        <>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={handleRetry}
                            disabled={!!actionLoading}
                            className="gap-2"
                          >
                            {actionLoading === "retry" ? <RefreshCw className="w-4 h-4 animate-spin" /> : <RotateCcw className="w-4 h-4" />}
                            Retry
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={handleSync}
                            disabled={!!actionLoading}
                            className="gap-2"
                          >
                            {actionLoading === "sync" ? <RefreshCw className="w-4 h-4 animate-spin" /> : <RefreshCw className="w-4 h-4" />}
                            Sync
                          </Button>
                        </>
                      )}
                      {["COMPLETED"].includes((selectedOrder.status || "").toUpperCase()) && (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={handleResend}
                          disabled={!!actionLoading}
                          className="gap-2"
                        >
                          {actionLoading === "resend" ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Mail className="w-4 h-4" />}
                          Resend email
                        </Button>
                      )}
                      {!["CANCELLED", "FAILED"].includes((selectedOrder.status || "").toUpperCase()) &&
                        selectedOrder.paymentIntentId &&
                        !String(selectedOrder.paymentIntentId).startsWith("template_") && (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={handleRefund}
                          disabled={!!actionLoading}
                          className="gap-2 text-destructive hover:text-destructive"
                        >
                          {actionLoading === "refund" ? <RefreshCw className="w-4 h-4 animate-spin" /> : <DollarSign className="w-4 h-4" />}
                          Refund
                        </Button>
                      )}
                    </>
                  )}
                  {selectedOrder.source === "advanced" && selectedOrder.id && !["COMPLETED"].includes((selectedOrder.status || "").toUpperCase()) && (
                    <>
                      <Button variant="outline" size="sm" onClick={handleRetry} disabled={!!actionLoading} className="gap-2">
                        {actionLoading === "retry" ? <RefreshCw className="w-4 h-4 animate-spin" /> : <RotateCcw className="w-4 h-4" />}
                        Retry
                      </Button>
                      <Button variant="outline" size="sm" onClick={handleSync} disabled={!!actionLoading} className="gap-2">
                        {actionLoading === "sync" ? <RefreshCw className="w-4 h-4 animate-spin" /> : <RefreshCw className="w-4 h-4" />}
                        Sync
                      </Button>
                    </>
                  )}
                  {["PENDING", "FAILED"].includes((selectedOrder.status || "").toUpperCase()) && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={handleDelete}
                      disabled={!!actionLoading}
                      className="gap-2 text-destructive hover:text-destructive"
                    >
                      {actionLoading === "delete" ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Trash2 className="w-4 h-4" />}
                      Delete
                    </Button>
                  )}
                </div>

                {/* eSIM Profiles in this order */}
                {selectedOrder.profiles && selectedOrder.profiles.length > 0 ? (
                  <div>
                    <h3 className="font-medium text-sm mb-3">eSIM Profiles ({selectedOrder.profiles.length})</h3>
                    <div className="space-y-3">
                      {selectedOrder.profiles.map((p, i) => (
                        <div key={i} className="border border-border rounded-xl p-4">
                          <div className="grid grid-cols-2 gap-3 mb-3">
                            <div>
                              <p className="text-xs text-muted-foreground">ICCID</p>
                              <div className="flex items-center gap-1">
                                <p className="text-xs font-mono">{p.iccid || "—"}</p>
                                {p.iccid && (
                                  <button
                                    onClick={() => copyToClipboard(p.iccid!, `iccid-${i}`)}
                                    className="p-0.5 rounded hover:bg-muted"
                                  >
                                    {copiedField === `iccid-${i}` ? (
                                      <Check className="w-3 h-3 text-green-500" />
                                    ) : (
                                      <Copy className="w-3 h-3 text-muted-foreground" />
                                    )}
                                  </button>
                                )}
                              </div>
                            </div>
                            <div>
                              <p className="text-xs text-muted-foreground">eSIM Tran No</p>
                              <p className="text-xs font-mono">{p.esimTranNo || "—"}</p>
                            </div>
                          </div>

                          {/* QR Code if available */}
                          {p.qrCodeUrl ? (
                            <div className="mt-3">
                              <p className="text-xs text-muted-foreground mb-2">QR Code</p>
                              <div className="flex gap-4 items-start">
                                <img
                                  src={p.qrCodeUrl}
                                  alt="eSIM QR Code"
                                  className="w-24 h-24 border rounded-lg bg-white p-1"
                                />
                                <div className="flex-1 space-y-1">
                                  {p.lpa && (
                                    <>
                                      <p className="text-xs text-muted-foreground">Activation Code</p>
                                      <div className="flex items-center gap-1">
                                        <p className="text-xs font-mono break-all">{p.lpa}</p>
                                        <button
                                          onClick={() => copyToClipboard(p.lpa!, `lpa-${i}`)}
                                          className="p-0.5 rounded hover:bg-muted shrink-0"
                                        >
                                          {copiedField === `lpa-${i}` ? (
                                            <Check className="w-3 h-3 text-green-500" />
                                          ) : (
                                            <Copy className="w-3 h-3 text-muted-foreground" />
                                          )}
                                        </button>
                                      </div>
                                    </>
                                  )}
                                </div>
                              </div>
                            </div>
                          ) : (
                            <div className="flex items-center gap-2 mt-2 text-xs text-muted-foreground">
                              <QrCode className="w-4 h-4 opacity-40" />
                              <span>QR code not available yet</span>
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                ) : (
                  <div className="text-center py-6 text-muted-foreground">
                    <QrCode className="w-10 h-10 mx-auto mb-3 opacity-40" />
                    <p className="text-sm">eSIM profile details not available for this order.</p>
                    <Button
                      variant="outline"
                      size="sm"
                      className="mt-3"
                      onClick={() => { setSelectedOrder(null); navigate("/dashboard/profiles"); }}
                    >
                      View in My eSIM
                    </Button>
                  </div>
                )}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}


