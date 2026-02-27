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

export default function CreateOrder() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { toast } = useToast();

  const prefillSlug = searchParams.get("slug") || "";

  const [slug, setSlug] = useState(prefillSlug);
  const [quantity, setQuantity] = useState(1);
  const [packageInfo, setPackageInfo] = useState<any>(null);
  const [lookingUp, setLookingUp] = useState(false);
  const [balance, setBalance] = useState<number | null>(null);
  const [ordering, setOrdering] = useState(false);
  const [orderResult, setOrderResult] = useState<OrderResult | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchBalance();
    if (prefillSlug) {
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
  const hasEnoughBalance =
    balance == null || totalCost == null || balance >= totalCost;

  const handleOrder = async () => {
    if (!slug.trim()) {
      toast({
        title: "Missing package",
        description: "Enter a package slug to continue.",
        variant: "destructive",
      });
      return;
    }

    setOrdering(true);
    setError(null);
    try {
      const txId = `TX-${Date.now()}-${Math.random().toString(36).slice(2, 8).toUpperCase()}`;
      const payload: Parameters<typeof apiClient.createOrder>[0] = {
        transactionId: txId,
        amount: totalCost != null ? Math.round(totalCost * 10000) : undefined,
        packageInfoList: [
          {
            slug: slug.trim(),
            count: quantity,
            price:
              pricePerUnit != null ? Math.round(pricePerUnit * 10000) : undefined,
          },
        ],
      };

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
    return (
      <div className="min-h-screen bg-background">
        <div className="container-custom py-8 max-w-2xl">
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
              {quantity} eSIM{quantity > 1 ? "s" : ""} ordered for package{" "}
              <span className="font-mono">{slug}</span>
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

      <div className="container-custom py-8 max-w-2xl">
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
          {/* Package Slug */}
          <div className="space-y-2">
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
            <p className="text-xs text-muted-foreground">
              Browse packages in the{" "}
              <button
                className="text-primary underline"
                onClick={() => navigate("/dashboard/packages")}
              >
                Package Browser
              </button>
            </p>
          </div>

          {/* Package Info */}
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
                      {packageInfo.dataAmount
                        ? `${packageInfo.dataAmount} ${packageInfo.dataUnit || "MB"}`
                        : "—"}
                    </p>
                    <p className="text-xs text-muted-foreground">Data</p>
                  </div>
                  <div>
                    <p className="font-semibold">
                      {packageInfo.duration
                        ? `${packageInfo.duration} ${packageInfo.durationUnit || "days"}`
                        : "—"}
                    </p>
                    <p className="text-xs text-muted-foreground">Validity</p>
                  </div>
                  <div>
                    <p className="font-semibold gradient-text">
                      {pricePerUnit != null
                        ? `$${pricePerUnit.toFixed(4)}`
                        : "—"}
                    </p>
                    <p className="text-xs text-muted-foreground">Per eSIM</p>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Error */}
          {error && (
            <div className="flex items-center gap-2 text-sm text-destructive p-3 rounded-lg bg-destructive/10">
              <AlertCircle className="w-4 h-4 flex-shrink-0" />
              {error}
            </div>
          )}

          {/* Quantity */}
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

          {/* Order Summary */}
          {totalCost != null && (
            <div className="p-4 rounded-xl bg-muted/50 border space-y-2">
              <h3 className="font-semibold text-sm">Order Summary</h3>
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">
                  {quantity} × ${pricePerUnit?.toFixed(4)}
                </span>
                <span className="font-medium">${totalCost.toFixed(4)}</span>
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
                    ${(balance - totalCost).toFixed(4)}
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
            disabled={ordering || !slug.trim() || !hasEnoughBalance}
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


