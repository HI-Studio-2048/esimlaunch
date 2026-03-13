import { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Elements } from "@stripe/react-stripe-js";
import { PaymentElement, useStripe, useElements } from "@stripe/react-stripe-js";
import { getStripe } from "@/lib/stripe";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { apiClient } from "@/lib/api";
import {
  Wallet,
  Plus,
  RefreshCw,
  ChevronLeft,
  ChevronRight,
  AlertCircle,
  CheckCircle2,
  X,
  ChevronDown,
  History,
  FileText,
  Calendar,
  Loader2,
  ArrowLeft,
} from "lucide-react";
import { cn } from "@/lib/utils";

interface TopupPaymentFormProps {
  clientSecret: string;
  paymentIntentId: string;
  amountUsd: string;
  onSuccess: () => void;
  onBack: () => void;
  onError: (message: string | null) => void;
}

function TopupPaymentForm({ clientSecret, paymentIntentId, amountUsd, onSuccess, onBack, onError }: TopupPaymentFormProps) {
  const stripe = useStripe();
  const elements = useElements();
  const [isProcessing, setIsProcessing] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!stripe || !elements) return;

    setIsProcessing(true);
    onError(null);

    try {
      const { error: submitError } = await elements.submit();
      if (submitError) {
        onError(submitError.message || "Please complete the payment form.");
        setIsProcessing(false);
        return;
      }

      const { error: confirmError, paymentIntent } = await stripe.confirmPayment({
        elements,
        clientSecret,
        confirmParams: {
          return_url: `${window.location.origin}/dashboard/balance`,
        },
        redirect: "if_required",
      });

      if (confirmError) {
        onError(confirmError.message || "Payment failed");
        setIsProcessing(false);
        return;
      }

      if (paymentIntent?.status === "succeeded") {
        await apiClient.confirmTopup(paymentIntentId);
        onSuccess();
      } else {
        onError("Payment was not completed. Please try again.");
      }
    } catch (err: any) {
      onError(err?.message || "Payment failed. Please try again.");
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      <div className="rounded-lg border border-border p-4 bg-muted/30">
        <PaymentElement />
      </div>
      <div className="flex gap-2">
        <Button type="button" variant="outline" onClick={onBack} disabled={isProcessing} className="gap-2">
          <ArrowLeft className="w-4 h-4" />
          Back
        </Button>
        <Button type="submit" variant="gradient" disabled={!stripe || isProcessing} className="flex-1 gap-2">
          {isProcessing ? (
            <><Loader2 className="w-4 h-4 animate-spin" /> Processing...</>
          ) : (
            <>Pay ${parseFloat(amountUsd || "0").toFixed(2)}</>
          )}
        </Button>
      </div>
    </form>
  );
}

interface BalanceTransaction {
  id: string;
  amount: number;
  type: "ORDER" | "TOPUP" | "REFUND";
  description: string | null;
  createdAt: string;
  balance?: number; // running balance after transaction
  activity?: string; // e.g. "Base Plan Purchase"
  remark?: string;
}

const PAGE_SIZE = 10;

const ACTIVITY_OPTIONS = [
  "All",
  "Base Plan Purchase",
  "Top-up Plan Purchase",
  "Base Plan Refund",
  "Online Top-up balance",
];

type ActiveTab = "transactions" | "statements";

export default function Balance() {
  const { toast } = useToast();

  const [balance, setBalance] = useState<number | null>(null);
  const [balanceLoading, setBalanceLoading] = useState(true);
  const [transactions, setTransactions] = useState<BalanceTransaction[]>([]);
  const [txLoading, setTxLoading] = useState(false);
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [activeTab, setActiveTab] = useState<ActiveTab>("transactions");

  // Filters
  const [txIdFilter, setTxIdFilter] = useState("");
  const [txTypeFilter, setTxTypeFilter] = useState("ALL");
  const [activityFilter, setActivityFilter] = useState("All");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");

  // Top-up modal
  const [showTopup, setShowTopup] = useState(false);
  const [topupAmount, setTopupAmount] = useState("");
  const [topupStep, setTopupStep] = useState<"amount" | "payment" | "processing" | "done">("amount");
  const [topupError, setTopupError] = useState<string | null>(null);
  const [topupClientSecret, setTopupClientSecret] = useState<string | null>(null);
  const [topupIntentId, setTopupIntentId] = useState<string | null>(null);

  const fetchBalance = useCallback(async () => {
    setBalanceLoading(true);
    try {
      const res = await apiClient.getBalance();
      setBalance(res?.balance ?? 0);
    } catch (err: any) {
      toast({ title: "Error", description: err?.message || "Failed to load balance.", variant: "destructive" });
    } finally {
      setBalanceLoading(false);
    }
  }, []);

  const fetchTransactions = useCallback(async (pageNum: number = 1) => {
    setTxLoading(true);
    try {
      const res = await apiClient.getBalanceTransactions(pageNum, PAGE_SIZE);
      setTransactions(res?.transactions || []);
      setTotal(res?.total || 0);
      setPage(pageNum);
    } catch (err: any) {
      console.warn("Balance transactions unavailable:", err?.message);
    } finally {
      setTxLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchBalance();
    fetchTransactions(1);
  }, []);

  const presets = [50, 100, 250, 500, 750, 1000];

  const handleTopupAmountSubmit = async () => {
    const amountUsd = parseFloat(topupAmount);
    if (!topupAmount || isNaN(amountUsd) || amountUsd < 1) {
      setTopupError("Please enter a valid amount (minimum $1.00).");
      return;
    }
    setTopupError(null);
    setTopupStep("processing");
    try {
      const amountCents = Math.round(amountUsd * 100);
      const intentRes = await apiClient.topupBalance(amountCents);
      if (!intentRes?.id || !intentRes?.clientSecret) throw new Error("Failed to create payment intent.");
      setTopupClientSecret(intentRes.clientSecret);
      setTopupIntentId(intentRes.id);
      setTopupStep("payment");
    } catch (err: any) {
      setTopupStep("amount");
      setTopupError(err?.message || "Top-up failed. Please try again.");
      toast({ title: "Top-up failed", description: err?.message || "Top-up failed.", variant: "destructive" });
    }
  };

  const handleTopupPaymentSuccess = () => {
    const amountUsd = parseFloat(topupAmount);
    setTopupStep("done");
    toast({ title: "Balance topped up!", description: `$${amountUsd.toFixed(2)} has been added to your account.` });
    fetchBalance();
    fetchTransactions(1);
  };

  const handleTopupPaymentBack = () => {
    setTopupStep("amount");
    setTopupClientSecret(null);
    setTopupIntentId(null);
    setTopupError(null);
  };

  const closeTopup = () => {
    setShowTopup(false);
    setTopupAmount("");
    setTopupStep("amount");
    setTopupError(null);
    setTopupClientSecret(null);
    setTopupIntentId(null);
  };

  // Client-side filtering
  const filteredTransactions = transactions.filter((tx) => {
    if (txIdFilter && !tx.id.toLowerCase().includes(txIdFilter.toLowerCase())) return false;
    if (txTypeFilter === "INCOMING" && tx.type !== "TOPUP" && tx.type !== "REFUND") return false;
    if (txTypeFilter === "OUTGOING" && tx.type !== "ORDER") return false;
    if (activityFilter !== "All") {
      const act = tx.activity || (tx.type === "ORDER" ? "Base Plan Purchase" : tx.type === "TOPUP" ? "Online Top-up balance" : "Base Plan Refund");
      if (!act.toLowerCase().includes(activityFilter.toLowerCase())) return false;
    }
    if (startDate && new Date(tx.createdAt) < new Date(startDate)) return false;
    if (endDate && new Date(tx.createdAt) > new Date(endDate + "T23:59:59")) return false;
    return true;
  });

  const totalPages = Math.ceil(total / PAGE_SIZE);

  const getAmountDisplay = (tx: BalanceTransaction) => {
    const cents = Math.abs(tx.amount);
    const usd = cents / 100; // amounts from API are in cents (USD)
    const isIncoming = tx.type === "TOPUP" || tx.type === "REFUND";
    return {
      text: `${isIncoming ? "+" : "-"}$${usd.toFixed(2)}`,
      cls: isIncoming ? "text-green-600 dark:text-green-400" : "text-red-600 dark:text-red-400",
      typeCls: isIncoming ? "text-green-600" : "text-red-600",
      typeLabel: isIncoming ? "Incoming" : "Outgoing",
    };
  };

  const getActivity = (tx: BalanceTransaction) =>
    tx.activity ||
    (tx.type === "ORDER" ? "Base Plan Purchase" :
     tx.type === "TOPUP" ? "Online Top-up balance" :
     "Base Plan Refund");

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="bg-card border-b border-border sticky top-16 md:top-20 z-40">
        <div className="container-custom py-4">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <h1 className="font-display text-2xl font-bold">Billing</h1>
              <p className="text-sm text-muted-foreground">Manage your balance and transactions</p>
            </div>
            <div className="flex gap-2">
              <Button
                variant="outline" size="sm"
                onClick={() => { fetchBalance(); fetchTransactions(1); }}
                disabled={balanceLoading || txLoading}
                className="gap-2"
              >
                <RefreshCw className={cn("w-4 h-4", (balanceLoading || txLoading) && "animate-spin")} />
                Refresh
              </Button>
              <Button variant="gradient" size="sm" onClick={() => setShowTopup(true)} className="gap-2">
                <Plus className="w-4 h-4" />
                Top up
              </Button>
            </div>
          </div>
        </div>
      </div>

      <div className="container-custom py-6">
        {/* Balance Row */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-card rounded-2xl p-5 border mb-4 flex flex-col md:flex-row md:items-center justify-between gap-4"
        >
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl gradient-bg flex items-center justify-center shrink-0">
              <Wallet className="w-6 h-6 text-primary-foreground" />
            </div>
            <div>
              {balanceLoading ? (
                <div className="h-9 w-32 bg-muted rounded animate-pulse" />
              ) : (
                <p className="text-3xl font-bold gradient-text">${(balance ?? 0).toFixed(2)}</p>
              )}
              <p className="text-xs text-muted-foreground mt-0.5">Balance</p>
            </div>
            <Button variant="gradient" size="sm" onClick={() => setShowTopup(true)} className="gap-2 ml-2">
              <Plus className="w-3.5 h-3.5" />
              Top up
            </Button>
          </div>
          <div className="flex items-center gap-4 text-sm text-muted-foreground">
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-gray-400" />
              <span>Disabled</span>
              <button className="text-primary text-xs hover:underline">Edit Setting</button>
              <span className="text-xs">Auto Recharge</span>
            </div>
            <button className="flex items-center gap-1 text-primary text-xs hover:underline">
              <History className="w-3.5 h-3.5" />
              View Payment history
            </button>
          </div>
        </motion.div>

        {/* Filters */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.05 }}
          className="bg-card rounded-2xl p-4 border mb-4"
        >
          <div className="flex flex-wrap gap-3 items-end">
            <div className="flex flex-col gap-1">
              <label className="text-xs text-muted-foreground">Transaction ID</label>
              <Input
                placeholder="Transaction ID"
                value={txIdFilter}
                onChange={(e) => setTxIdFilter(e.target.value)}
                className="h-9 text-sm w-44"
              />
            </div>
            <div className="flex flex-col gap-1">
              <label className="text-xs text-muted-foreground">Transaction Type</label>
              <div className="relative">
                <select
                  value={txTypeFilter}
                  onChange={(e) => setTxTypeFilter(e.target.value)}
                  className="h-9 px-3 text-sm rounded-md border border-input bg-background appearance-none pr-8 w-36"
                >
                  <option value="ALL">All Types</option>
                  <option value="INCOMING">Incoming</option>
                  <option value="OUTGOING">Outgoing</option>
                </select>
                <ChevronDown className="absolute right-2 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground pointer-events-none" />
              </div>
            </div>
            <div className="flex flex-col gap-1">
              <label className="text-xs text-muted-foreground">Activities</label>
              <div className="relative">
                <select
                  value={activityFilter}
                  onChange={(e) => setActivityFilter(e.target.value)}
                  className="h-9 px-3 text-sm rounded-md border border-input bg-background appearance-none pr-8 w-48"
                >
                  {ACTIVITY_OPTIONS.map((a) => <option key={a} value={a}>{a}</option>)}
                </select>
                <ChevronDown className="absolute right-2 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground pointer-events-none" />
              </div>
            </div>
            <div className="flex flex-col gap-1">
              <label className="text-xs text-muted-foreground">Date</label>
              <div className="flex items-center gap-1">
                <div className="relative">
                  <Calendar className="absolute left-2 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground pointer-events-none" />
                  <Input
                    type="date"
                    value={startDate}
                    onChange={(e) => setStartDate(e.target.value)}
                    className="h-9 text-sm pl-7 w-36"
                  />
                </div>
                <span className="text-xs text-muted-foreground">to</span>
                <Input
                  type="date"
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                  className="h-9 text-sm w-36"
                />
              </div>
            </div>
            <Button
              onClick={() => fetchTransactions(1)}
              disabled={txLoading}
              className="h-9 gap-2"
            >
              Search
            </Button>
            <Button
              variant="outline"
              onClick={() => {
                setTxIdFilter(""); setTxTypeFilter("ALL");
                setActivityFilter("All"); setStartDate(""); setEndDate("");
                fetchTransactions(1);
              }}
              disabled={txLoading}
              className="h-9"
            >
              Reset
            </Button>
          </div>
        </motion.div>

        {/* Tabs + Table */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="bg-card rounded-2xl border overflow-hidden"
        >
          {/* Tab Bar */}
          <div className="flex items-center justify-between border-b border-border px-4">
            <div className="flex">
              {([
                { key: "transactions" as ActiveTab, label: "Transactions", icon: History },
                { key: "statements" as ActiveTab, label: "Statements", icon: FileText },
              ]).map(({ key, label, icon: Icon }) => (
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
                  + {label}
                </button>
              ))}
            </div>
          </div>

          {activeTab === "transactions" ? (
            <>
              {txLoading && filteredTransactions.length === 0 ? (
                <div className="p-6 space-y-3">
                  {Array.from({ length: 5 }).map((_, i) => (
                    <div key={i} className="h-14 bg-muted rounded animate-pulse" />
                  ))}
                </div>
              ) : filteredTransactions.length === 0 ? (
                <div className="text-center py-16 text-muted-foreground">
                  <Wallet className="w-12 h-12 mx-auto mb-4 opacity-50" />
                  <p className="font-medium mb-2">No transactions yet</p>
                  <p className="text-sm">Add funds or place orders to see transactions here.</p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full min-w-[900px]">
                    <thead>
                      <tr className="bg-muted/30 border-b border-border">
                        {["Transaction Id", "Amount", "Transaction Type", "Balance", "Time", "Activities", "Remark"].map((h) => (
                          <th key={h} className="text-left py-3 px-4 text-xs font-medium text-muted-foreground uppercase tracking-wider whitespace-nowrap">
                            {h}
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {filteredTransactions.map((tx, index) => {
                        const amt = getAmountDisplay(tx);
                        const activity = getActivity(tx);

                        return (
                          <motion.tr
                            key={tx.id}
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            transition={{ delay: index * 0.02 }}
                            className="border-b border-border/50 hover:bg-muted/20 transition-colors"
                          >
                            <td className="py-3 px-4">
                              <span className="font-mono text-xs text-primary">{tx.id}</span>
                            </td>
                            <td className="py-3 px-4">
                              <span className={cn("text-sm font-semibold", amt.cls)}>
                                {amt.text}
                              </span>
                            </td>
                            <td className="py-3 px-4">
                              <span className={cn("text-sm font-medium", amt.typeCls)}>
                                {amt.typeLabel}
                              </span>
                            </td>
                            <td className="py-3 px-4 text-sm text-muted-foreground">
                              {tx.balance != null ? `$${tx.balance.toFixed(2)}` : "—"}
                            </td>
                            <td className="py-3 px-4 text-sm text-muted-foreground whitespace-nowrap">
                              {new Date(tx.createdAt).toLocaleString("en-US", {
                                year: "numeric", month: "2-digit", day: "2-digit",
                                hour: "2-digit", minute: "2-digit",
                              })}
                            </td>
                            <td className="py-3 px-4 text-sm text-muted-foreground">{activity}</td>
                            <td className="py-3 px-4 text-sm text-muted-foreground">{tx.remark || tx.description || "—"}</td>
                          </motion.tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              )}
            </>
          ) : (
            <div className="text-center py-16 text-muted-foreground">
              <FileText className="w-12 h-12 mx-auto mb-4 opacity-50" />
              <p className="font-medium mb-2">No statements available</p>
              <p className="text-sm">Monthly statements will appear here once generated.</p>
            </div>
          )}

          {/* Pagination */}
          {total > 0 && activeTab === "transactions" && (
            <div className="flex items-center justify-between p-4 border-t border-border">
              <p className="text-sm text-muted-foreground">Total {total}</p>
              <div className="flex items-center gap-1">
                <Button variant="outline" size="sm" className="h-8 w-8 p-0"
                  disabled={page <= 1 || txLoading} onClick={() => fetchTransactions(page - 1)}>
                  <ChevronLeft className="w-3.5 h-3.5" />
                </Button>
                {Array.from({ length: Math.min(totalPages, 7) }, (_, i) => i + 1).map((p) => (
                  <Button
                    key={p}
                    variant={p === page ? "gradient" : "outline"}
                    size="sm"
                    className="h-8 w-8 p-0 text-xs"
                    onClick={() => fetchTransactions(p)}
                    disabled={txLoading}
                  >
                    {p}
                  </Button>
                ))}
                {totalPages > 7 && <span className="text-xs text-muted-foreground px-1">...</span>}
                <Button variant="outline" size="sm" className="h-8 w-8 p-0"
                  disabled={page >= totalPages || txLoading} onClick={() => fetchTransactions(page + 1)}>
                  <ChevronRight className="w-3.5 h-3.5" />
                </Button>
                <span className="text-xs text-muted-foreground ml-2">Go to</span>
                <Input
                  type="number" min={1} max={totalPages}
                  className="h-8 w-14 text-xs ml-1"
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      const v = parseInt((e.target as HTMLInputElement).value);
                      if (v >= 1 && v <= totalPages) fetchTransactions(v);
                    }
                  }}
                />
              </div>
            </div>
          )}
        </motion.div>
      </div>

      {/* Add Funds Modal */}
      <AnimatePresence>
        {showTopup && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 overflow-y-auto"
            onClick={closeTopup}
          >
            <motion.div
              initial={{ scale: 0.9, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.9, y: 20 }}
              className="bg-card rounded-2xl p-6 border w-full max-w-md mx-auto my-auto shadow-xl max-h-[calc(100vh-2rem)] overflow-y-auto"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-center justify-between mb-6">
                <h3 className="font-semibold text-lg">Top up Balance</h3>
                <Button variant="ghost" size="icon" onClick={closeTopup}>
                  <X className="w-4 h-4" />
                </Button>
              </div>

              {topupStep === "done" ? (
                <div className="text-center py-4">
                  <CheckCircle2 className="w-16 h-16 mx-auto mb-4 text-green-500" />
                  <p className="text-xl font-bold mb-2">${parseFloat(topupAmount).toFixed(2)} Added!</p>
                  <p className="text-sm text-muted-foreground mb-6">Your balance has been updated.</p>
                  <Button variant="gradient" onClick={closeTopup} className="w-full">Done</Button>
                </div>
              ) : topupStep === "payment" && topupClientSecret && topupIntentId ? (
                <div className="space-y-5">
                  <p className="text-sm text-muted-foreground">
                    Pay ${parseFloat(topupAmount).toFixed(2)} to add to your balance.
                  </p>
                  <Elements
                    stripe={getStripe()}
                    options={{
                      clientSecret: topupClientSecret,
                      appearance: { theme: "stripe" },
                    }}
                  >
                    <TopupPaymentForm
                      clientSecret={topupClientSecret}
                      paymentIntentId={topupIntentId}
                      amountUsd={topupAmount}
                      onSuccess={handleTopupPaymentSuccess}
                      onBack={handleTopupPaymentBack}
                      onError={setTopupError}
                    />
                  </Elements>
                  {topupError && (
                    <div className="flex items-center gap-2 text-sm text-destructive p-3 rounded-lg bg-destructive/10">
                      <AlertCircle className="w-4 h-4 shrink-0" />
                      {topupError}
                    </div>
                  )}
                </div>
              ) : (
                <div className="space-y-5">
                  <div>
                    <Label className="mb-2 block">Quick Select</Label>
                    <div className="grid grid-cols-3 gap-2">
                      {presets.map((p) => (
                        <Button
                          key={p}
                          variant={topupAmount === String(p) ? "gradient" : "outline"}
                          size="sm"
                          onClick={() => setTopupAmount(String(p))}
                          disabled={topupStep === "processing"}
                        >
                          ${p}
                        </Button>
                      ))}
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="topupAmount">Custom Amount (USD)</Label>
                    <div className="relative">
                      <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground font-medium">$</span>
                      <Input
                        id="topupAmount"
                        type="number" min="1" step="0.01" placeholder="0.00"
                        value={topupAmount}
                        onChange={(e) => { setTopupAmount(e.target.value); setTopupError(null); }}
                        disabled={topupStep === "processing"}
                        className="pl-7"
                      />
                    </div>
                  </div>

                  {topupError && (
                    <div className="flex items-center gap-2 text-sm text-destructive p-3 rounded-lg bg-destructive/10">
                      <AlertCircle className="w-4 h-4 shrink-0" />
                      {topupError}
                    </div>
                  )}

                  <Button
                    variant="gradient"
                    onClick={handleTopupAmountSubmit}
                    disabled={topupStep === "processing" || !topupAmount}
                    className="w-full gap-2"
                  >
                    {topupStep === "processing" ? (
                      <><RefreshCw className="w-4 h-4 animate-spin" /> Processing...</>
                    ) : (
                      <><Plus className="w-4 h-4" /> Add ${parseFloat(topupAmount || "0").toFixed(2)}</>
                    )}
                  </Button>
                </div>
              )}
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
