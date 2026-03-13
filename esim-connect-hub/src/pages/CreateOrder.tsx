import { useState, useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { apiClient } from "@/lib/api";
import {
  ShoppingCart,
  Package,
  Wallet,
  AlertCircle,
  CheckCircle2,
  ArrowLeft,
  Plus,
  Minus,
  RefreshCw,
  QrCode,
} from "lucide-react";
import { cn } from "@/lib/utils";

interface OrderResult {
  orderNo: string;
  profiles?: Array<{
    iccid?: string;
    esimTranNo?: string;
    lpa?: string;
    qrCodeUrl?: string;
    activationCode?: string;
  }>;
}

interface CartItem {
  slug: string;
  name: string;
  price: number;
  qty: number;
}

/** Format volume (bytes) from API to human-readable data string */
function formatData(volume?: number): string {
  if (!volume) return "—";
  if (volume >= 1_000_000_000) return `${(volume / 1_000_000_000).toFixed(0)} GB`;
  if (volume >= 1_000_000) return `${(volume / 1_000_000).toFixed(0)} MB`;
  return `${volume} B`;
}

export default function CreateOrder() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { toast } = useToast();

  const prefillSlug = searchParams.get("slug") || "";
  const fromCart = searchParams.get("cart") === "1";

  const [slug, setSlug] = useState(prefillSlug);
  const [quantity, setQuantity] = useState(1);
  const [packageInfo, setPackageInfo] = useState<any>(null);
  const [lookingUp, setLookingUp] = useState(false);
  const [balance, setBalance] = useState<number | null>(null);
  const [ordering, setOrdering] = useState(false);
  const [orderResult, setOrderResult] = useState<OrderResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [cartItems, setCartItems] = useState<CartItem[] | null>(null);

  useEffect(() => {
    fetchBalance();
    if (fromCart) {
      try {
        if (typeof window === "undefined") return;
        const raw = localStorage.getItem("esim_cart");
        if (raw) {
          const parsed = JSON.parse(raw);
          if (Array.isArray(parsed)) {
            const normalized: CartItem[] = parsed
              .map((item: any) => {
                const pkg = item?.pkg || {};
                const id = pkg.slug || pkg.packageCode || pkg.name || "";
                const qty = typeof item.qty === "number" && item.qty > 0 ? item.qty : 0;
                if (!id || qty <= 0) return null;
                return {
                  slug: id,
                  name: pkg.name || id,
                  price: typeof pkg.price === "number" ? pkg.price : 0,
                  qty,
                } as CartItem;
              })
              .filter(Boolean) as CartItem[];
            if (normalized.length > 0) {
              setCartItems(normalized);
            }
          }
        }
      } catch {
        // ignore cart load errors
      }
    } else if (prefillSlug) {
      lookupPackage(prefillSlug);
    }
  }, []);

  const fetchBalance = async () => {
    try {
      const res = await apiClient.getBalance();
      setBalance(res?.balance ?? null);
    } catch {
      // Balance fetch failure is non-blocking
    }
  };

  const lookupPackage = async (slugValue: string) => {
    if (!slugValue.trim()) return;
    setLookingUp(true);
    setPackageInfo(null);
    setError(null);
    try {
      const res = await apiClient.getPackages({ slug: slugValue.trim() });
      const list =
        res?.obj?.packageList ||
        res?.packageList ||
        (Array.isArray(res) ? res : []);
      if (list.length > 0) {
        setPackageInfo(list[0]);
      } else {
        setError("Package not found. Please check the slug and try again.");
      }
    } catch (err: any) {
      setError(err?.message || "Failed to look up package.");
    } finally {
      setLookingUp(false);
    }
  };

  const pricePerUnit =
    packageInfo?.price != null ? packageInfo.price / 10000 : null;
  const totalCost = pricePerUnit != null ? pricePerUnit * quantity : null;
  const cartTotal =
    fromCart && cartItems
      ? cartItems.reduce(
          (sum, item) => sum + (item.price / 10000) * item.qty,
          0
        )
      : null;
  const effectiveTotal = fromCart ? cartTotal : totalCost;
  const hasEnoughBalance =
    balance == null || effectiveTotal == null || balance >= effectiveTotal;

  const handleOrder = async () => {
    if (fromCart) {
      if (!cartItems || cartItems.length === 0) {
        toast({
          title: "Cart is empty",
          description: "Add at least one eSIM plan before checking out.",
          variant: "destructive",
        });
        return;
      }
    } else {
      if (!slug.trim()) {
        toast({
          title: "Missing package",
          description: "Enter a package slug to continue.",
          variant: "destructive",
        });
        return;
      }
    }

    setOrdering(true);
    setError(null);
    try {
      const txId = `TX-${Date.now()}-${Math.random().toString(36).slice(2, 8).toUpperCase()}`;
      let payload: Parameters<typeof apiClient.createOrder>[0];

      // Let backend resolve amount from provider catalog (raw prices). Frontend prices are marked-up
      // and would cause "Package price error" if sent to eSIM provider.
      if (fromCart) {
        // Re-read cart from localStorage at order time to avoid sending stale/removed items
        // (e.g. user removed items in another tab or navigated back and forth)
        let itemsToOrder: CartItem[] = [];
        try {
          const raw = typeof window !== "undefined" ? localStorage.getItem("esim_cart") : null;
          if (raw) {
            const parsed = JSON.parse(raw);
            if (Array.isArray(parsed)) {
              itemsToOrder = parsed
                .map((item: any) => {
                  const pkg = item?.pkg || {};
                  const id = pkg.slug || pkg.packageCode || pkg.name || "";
                  const qty = typeof item.qty === "number" && item.qty > 0 ? item.qty : 0;
                  if (!id || qty <= 0) return null;
                  return { slug: id, name: pkg.name || id, price: typeof pkg.price === "number" ? pkg.price : 0, qty } as CartItem;
                })
                .filter(Boolean) as CartItem[];
            }
          }
        } catch {
          itemsToOrder = cartItems || [];
        }
        if (itemsToOrder.length === 0) {
          toast({ title: "Cart is empty", description: "Add at least one eSIM plan before checking out.", variant: "destructive" });
          setOrdering(false);
          return;
        }
        payload = {
          transactionId: txId,
          packageInfoList: itemsToOrder.map((item) => ({ slug: item.slug, count: item.qty })),
        };
      } else {
        payload = {
          transactionId: txId,
          packageInfoList: [
            { slug: slug.trim(), count: quantity },
          ],
        };
      }

      const result = await apiClient.createOrder(payload);

      // Fetch profiles for the new order
      let profiles: OrderResult["profiles"] = [];
      if (result?.orderNo) {
        try {
          const orderDetail = await apiClient.getOrder(result.orderNo);
          profiles =
            orderDetail?.obj?.esimList ||
            orderDetail?.esimList ||
            orderDetail?.profiles ||
            [];
        } catch {
          // profiles remain empty if not available
        }
      }

      setOrderResult({ orderNo: result.orderNo, profiles });
      if (fromCart && typeof window !== "undefined") {
        localStorage.removeItem("esim_cart");
      }
      toast({
        title: "Order placed!",
        description: `Order ${result.orderNo} created successfully.`,
      });
      fetchBalance();
    } catch (err: any) {
      const msg = err?.message || "Failed to create order.";
      setError(msg);
      toast({ title: "Order failed", description: msg, variant: "destructive" });
    } finally {
      setOrdering(false);
    }
  };

  if (orderResult) {
    const totalCartQty =
      fromCart && cartItems
        ? cartItems.reduce((sum, item) => sum + item.qty, 0)
        : quantity;
    return (
      <div className="min-h-screen bg-background">
        <div className="container-custom py-8 max-w-3xl">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-card rounded-2xl p-8 border text-center"
          >
            <CheckCircle2 className="w-16 h-16 mx-auto mb-4 text-green-500" />
            <h2 className="text-2xl font-bold mb-2">Order Placed!</h2>
            <p className="text-muted-foreground mb-2">
              Order Number:{" "}
              <span className="font-mono font-semibold text-foreground">
                {orderResult.orderNo}
              </span>
            </p>
            <p className="text-sm text-muted-foreground mb-6">
              {totalCartQty} eSIM{totalCartQty > 1 ? "s" : ""} ordered
              {!fromCart && (
                <>
                  {" "}
                  for package <span className="font-mono">{slug}</span>
                </>
              )}
            </p>

            {orderResult.profiles && orderResult.profiles.length > 0 && (
              <div className="text-left space-y-4 mb-6">
                <h3 className="font-semibold">eSIM Profiles</h3>
                {orderResult.profiles.map((profile, i) => (
                  <div key={i} className="p-4 rounded-xl border bg-muted/30 space-y-2">
                    {profile.iccid && (
                      <p className="text-sm">
                        <span className="text-muted-foreground">ICCID:</span>{" "}
                        <span className="font-mono">{profile.iccid}</span>
                      </p>
                    )}
                    {profile.lpa && (
                      <p className="text-sm break-all">
                        <span className="text-muted-foreground">LPA:</span>{" "}
                        <span className="font-mono text-xs">{profile.lpa}</span>
                      </p>
                    )}
                    {profile.qrCodeUrl && (
                      <div className="flex items-center gap-2">
                        <QrCode className="w-4 h-4 text-muted-foreground" />
                        <a
                          href={profile.qrCodeUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-sm text-primary underline"
                        >
                          View QR Code
                        </a>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}

            <div className="flex gap-3 justify-center">
              <Button
                variant="outline"
                onClick={() => {
                  setOrderResult(null);
                  setSlug(prefillSlug);
                  setQuantity(1);
                  setPackageInfo(null);
                  if (prefillSlug) lookupPackage(prefillSlug);
                }}
              >
                New Order
              </Button>
              <Button
                variant="gradient"
                onClick={() => navigate("/dashboard/profiles")}
              >
                View Profiles
              </Button>
            </div>
          </motion.div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="bg-card border-b border-border sticky top-16 md:top-20 z-40">
        <div className="container-custom py-4">
          <div className="flex items-center gap-4">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => navigate("/dashboard/packages")}
            >
              <ArrowLeft className="w-5 h-5" />
            </Button>
            <div>
              <h1 className="font-display text-2xl font-bold">Create Order</h1>
              <p className="text-sm text-muted-foreground">
                Place a new eSIM order via the API
              </p>
            </div>
          </div>
        </div>
      </div>

      <div className="container-custom py-8 max-w-3xl">
        {/* Balance Banner */}
        {balance !== null && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-6 p-4 rounded-2xl bg-card border flex items-center justify-between"
          >
            <div className="flex items-center gap-3">
              <Wallet className="w-5 h-5 text-primary" />
              <div>
                <p className="text-sm font-medium">Account Balance</p>
                <p className="text-lg font-bold gradient-text">
                  ${balance.toFixed(2)}
                </p>
              </div>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={() => navigate("/dashboard/balance")}
            >
              Add Funds
            </Button>
          </motion.div>
        )}

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-card rounded-2xl p-6 border space-y-6"
        >
          {/* Package Slug (single package mode) */}
          {!fromCart && (
            <div className="space-y-3">
              <Label htmlFor="slug">Package Slug</Label>
              <div className="flex gap-2">
                <Input
                  id="slug"
                  placeholder="e.g. esim-us-1gb-7days"
                  value={slug}
                  onChange={(e) => {
                    setSlug(e.target.value);
                    setPackageInfo(null);
                    setError(null);
                  }}
                  className="flex-1 font-mono text-sm"
                />
                <Button
                  variant="outline"
                  onClick={() => lookupPackage(slug)}
                  disabled={lookingUp || !slug.trim()}
                  className="gap-2"
                >
                  {lookingUp ? (
                    <RefreshCw className="w-4 h-4 animate-spin" />
                  ) : (
                    <Package className="w-4 h-4" />
                  )}
                  Lookup
                </Button>
              </div>
              <div className="mt-1 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 rounded-xl border border-primary/30 bg-primary/5 px-3 py-2">
                <div className="flex items-center gap-2">
                  <Package className="w-4 h-4 text-primary" />
                  <div className="text-xs">
                    <p className="font-semibold text-foreground">Don&apos;t know the slug?</p>
                    <p className="text-muted-foreground">Search and copy it from the Package Browser.</p>
                  </div>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  className="border-primary text-primary hover:bg-primary/10 whitespace-nowrap"
                  onClick={() => navigate("/dashboard/packages")}
                >
                  Open Package Browser
                </Button>
              </div>
            </div>
          )}

          {/* Cart summary (multi-plan checkout) */}
          {fromCart && cartItems && cartItems.length > 0 && (
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <Label>Cart summary</Label>
                <span className="text-xs text-muted-foreground">
                  {cartItems.reduce((sum, item) => sum + item.qty, 0)} eSIMs ·{" "}
                  <span className="font-semibold">
                    ${cartTotal?.toFixed(2) ?? "0.00"}
                  </span>
                </span>
              </div>
              <div className="rounded-xl border bg-muted/30 overflow-hidden">
                <table className="w-full text-sm">
                  <thead className="bg-muted/60 text-xs text-muted-foreground">
                    <tr>
                      <th className="text-left px-4 py-2">Plan</th>
                      <th className="text-right px-4 py-2">Qty</th>
                      <th className="text-right px-4 py-2">Price / eSIM</th>
                      <th className="text-right px-4 py-2">Line total</th>
                    </tr>
                  </thead>
                  <tbody>
                    {cartItems.map((item) => {
                      const unit = item.price / 10000;
                      const line = unit * item.qty;
                      return (
                        <tr key={item.slug} className="border-t border-border/60">
                          <td className="px-4 py-2">
                            <div className="flex flex-col">
                              <span className="font-medium">{item.name}</span>
                              <span className="text-[11px] text-muted-foreground font-mono">
                                {item.slug}
                              </span>
                            </div>
                          </td>
                          <td className="px-4 py-2 text-right">{item.qty}</td>
                          <td className="px-4 py-2 text-right">
                            ${unit.toFixed(2)}
                          </td>
                          <td className="px-4 py-2 text-right font-medium">
                            ${line.toFixed(2)}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* Package Info (single package mode) */}
          {!fromCart && (
            <AnimatePresence>
              {packageInfo && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: "auto" }}
                  exit={{ opacity: 0, height: 0 }}
                  className="p-4 rounded-xl bg-primary/5 border border-primary/20 space-y-2"
                >
                  <div className="flex items-center gap-2 mb-1">
                    <CheckCircle2 className="w-4 h-4 text-green-500" />
                    <p className="text-sm font-medium">
                      {packageInfo.name || slug}
                    </p>
                  </div>
                  <div className="grid grid-cols-3 gap-3 text-center text-sm">
                    <div>
                      <p className="font-semibold">
                        {formatData(packageInfo.volume)}
                      </p>
                      <p className="text-xs text-muted-foreground">Data</p>
                    </div>
                    <div>
                      <p className="font-semibold">
                        {packageInfo.duration
                          ? `${packageInfo.duration} ${
                              packageInfo.durationUnit || "days"
                            }`
                          : "—"}
                      </p>
                      <p className="text-xs text-muted-foreground">Validity</p>
                    </div>
                    <div>
                      <p className="font-semibold gradient-text">
                        {pricePerUnit != null
                          ? `$${pricePerUnit.toFixed(2)}`
                          : "—"}
                      </p>
                      <p className="text-xs text-muted-foreground">Per eSIM</p>
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          )}
          {/* Error */}
          {error && (
            <div className="flex items-center gap-2 text-sm text-destructive p-3 rounded-lg bg-destructive/10">
              <AlertCircle className="w-4 h-4 flex-shrink-0" />
              {error}
            </div>
          )}

          {/* Quantity (single package mode) */}
          {!fromCart && (
            <div className="space-y-2">
              <Label>Quantity</Label>
              <div className="flex items-center gap-3">
                <Button
                  variant="outline"
                  size="icon"
                  onClick={() => setQuantity(Math.max(1, quantity - 1))}
                  disabled={quantity <= 1}
                >
                  <Minus className="w-4 h-4" />
                </Button>
                <span className="text-2xl font-bold w-12 text-center">
                  {quantity}
                </span>
                <Button
                  variant="outline"
                  size="icon"
                  onClick={() => setQuantity(quantity + 1)}
                >
                  <Plus className="w-4 h-4" />
                </Button>
                <span className="text-sm text-muted-foreground ml-2">
                  eSIM{quantity > 1 ? "s" : ""}
                </span>
              </div>
            </div>
          )}

          {/* Order Summary */}
          {!fromCart && totalCost != null && (
            <div className="p-4 rounded-xl bg-muted/50 border space-y-2">
              <h3 className="font-semibold text-sm">Order Summary</h3>
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">
                  {quantity} × ${pricePerUnit?.toFixed(2)}
                </span>
                <span className="font-medium">${totalCost.toFixed(2)}</span>
              </div>
              {balance !== null && (
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Balance after order</span>
                  <span
                    className={cn(
                      "font-medium",
                      hasEnoughBalance ? "text-green-600" : "text-destructive"
                    )}
                  >
                    ${(balance - totalCost).toFixed(2)}
                  </span>
                </div>
              )}
              {!hasEnoughBalance && (
                <p className="text-xs text-destructive flex items-center gap-1">
                  <AlertCircle className="w-3 h-3" />
                  Insufficient balance.{" "}
                  <button
                    className="underline"
                    onClick={() => navigate("/dashboard/balance")}
                  >
                    Add funds
                  </button>
                </p>
              )}
            </div>
          )}

          {fromCart && cartTotal != null && cartItems && cartItems.length > 0 && (
            <div className="p-4 rounded-xl bg-muted/50 border space-y-2">
              <h3 className="font-semibold text-sm">Order Summary</h3>
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">
                  {cartItems.reduce((sum, item) => sum + item.qty, 0)} eSIMs
                </span>
                <span className="font-medium">${cartTotal.toFixed(2)}</span>
              </div>
              {balance !== null && (
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Balance after order</span>
                  <span
                    className={cn(
                      "font-medium",
                      hasEnoughBalance ? "text-green-600" : "text-destructive"
                    )}
                  >
                    ${(balance - cartTotal).toFixed(2)}
                  </span>
                </div>
              )}
              {!hasEnoughBalance && (
                <p className="text-xs text-destructive flex items-center gap-1">
                  <AlertCircle className="w-3 h-3" />
                  Insufficient balance.{" "}
                  <button
                    className="underline"
                    onClick={() => navigate("/dashboard/balance")}
                  >
                    Add funds
                  </button>
                </p>
              )}
            </div>
          )}

          {/* Submit */}
          <Button
            variant="gradient"
            onClick={handleOrder}
            disabled={
              ordering ||
              !hasEnoughBalance ||
              (!fromCart && !slug.trim()) ||
              (fromCart && (!cartItems || cartItems.length === 0))
            }
            className="w-full gap-2"
          >
            {ordering ? (
              <RefreshCw className="w-4 h-4 animate-spin" />
            ) : (
              <ShoppingCart className="w-4 h-4" />
            )}
            {ordering ? "Placing Order..." : "Place Order"}
          </Button>
        </motion.div>
      </div>
    </div>
  );
}


