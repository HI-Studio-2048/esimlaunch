import { useState, useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { useToast } from "@/hooks/use-toast";
import { apiClient } from "@/lib/api";
import { Elements, CardElement, useStripe, useElements } from "@stripe/react-stripe-js";
import { getStripe } from "@/lib/stripe";
import { PLANS } from "@/lib/plans";
import { useAuth } from "@/contexts/AuthContext";
import { ProtectedRoute } from "@/components/ProtectedRoute";
import { Check, CreditCard, Code2, Loader2, ArrowRight } from "lucide-react";
import { cn } from "@/lib/utils";

type PlanId = "starter" | "growth" | "scale" | "test" | "api_only";

export default function Subscribe() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { toast } = useToast();
  const { isAuthenticated, isLoading: authLoading } = useAuth();

  const planParam = searchParams.get("plan") as PlanId | null;
  const initialPlan =
    planParam && ["starter", "growth", "scale", "test", "api_only"].includes(planParam)
      ? planParam
      : "test";

  const [plan, setPlan] = useState<PlanId>(initialPlan);
  const [billingPeriod, setBillingPeriod] = useState<"monthly" | "yearly">("monthly");
  const [paymentMethodId, setPaymentMethodId] = useState<string | undefined>();
  const [billingEmail, setBillingEmail] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (planParam && ["starter", "growth", "scale", "test", "api_only"].includes(planParam)) {
      setPlan(planParam as PlanId);
    }
  }, [planParam]);

  const isApiOnly = plan === "api_only";
  const paidPlans = PLANS;
  const samplePlan = paidPlans[0];
  const savingsPercent = Math.round(
    ((samplePlan.monthlyPrice * 12 - samplePlan.yearlyPrice) / (samplePlan.monthlyPrice * 12)) * 100
  );

  const handleApiOnlySubmit = async () => {
    setIsLoading(true);
    try {
      await apiClient.createSubscription({
        plan: "api_only",
        billingPeriod: "monthly", // ignored for api_only
      });
      toast({
        title: "API Access Activated",
        description: "You now have full API access. Head to Developer to create your API key.",
      });
      navigate("/settings/billing", { replace: true });
    } catch (err: any) {
      toast({
        title: "Error",
        description: err?.message || "Failed to activate API access.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handlePaidPlanSubmit = async (paymentMethodId: string) => {
    if (plan === "api_only") return;
    setIsLoading(true);
    try {
      await apiClient.createSubscription({
        plan: plan as "starter" | "growth" | "scale" | "test",
        billingPeriod,
        paymentMethodId,
      });
      toast({
        title: "Subscription Started",
        description: "Your 7-day free trial has begun. You won't be charged until it ends.",
      });
      navigate("/settings/billing", { replace: true });
    } catch (err: any) {
      toast({
        title: "Error",
        description: err?.message || "Failed to start subscription.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!isAuthenticated) {
    return (
      <ProtectedRoute>
        <div />
      </ProtectedRoute>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-primary/5 pt-24 pb-12">
      <div className="container-custom max-w-3xl">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="glass rounded-2xl p-8"
        >
          <div className="flex items-center gap-3 mb-6">
            <div className="w-10 h-10 rounded-xl gradient-bg flex items-center justify-center">
              <CreditCard className="w-5 h-5 text-primary-foreground" />
            </div>
            <div>
              <h1 className="text-2xl font-bold">Choose your plan</h1>
              <p className="text-muted-foreground text-sm">
                Add or change your subscription. All paid plans include a 7-day free trial.
              </p>
            </div>
          </div>

          {isApiOnly ? (
            /* API Only flow - no Stripe */
            <div className="space-y-6">
              <div className="rounded-xl border-2 border-primary/30 bg-primary/5 p-6">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center">
                    <Code2 className="w-6 h-6 text-primary" />
                  </div>
                  <div>
                    <h2 className="text-xl font-bold">API Only</h2>
                    <p className="text-muted-foreground text-sm">
                      REST API access for developers. No storefront, no dashboard. Just integrate and build.
                    </p>
                  </div>
                </div>
                <div className="mt-6 flex items-center justify-between">
                  <span className="text-3xl font-bold">$0</span>
                  <span className="text-muted-foreground">/month</span>
                </div>
                <ul className="mt-4 space-y-2 text-sm text-muted-foreground">
                  <li className="flex items-center gap-2">
                    <Check className="w-4 h-4 text-primary" /> Full REST API
                  </li>
                  <li className="flex items-center gap-2">
                    <Check className="w-4 h-4 text-primary" /> Webhooks
                  </li>
                  <li className="flex items-center gap-2">
                    <Check className="w-4 h-4 text-primary" /> API keys & docs
                  </li>
                </ul>
              </div>
              <div className="flex gap-3">
                <Button
                  variant="outline"
                  onClick={() => {
                    setPlan("growth");
                  }}
                >
                  View paid plans
                </Button>
                <Button
                  variant="gradient"
                  onClick={handleApiOnlySubmit}
                  disabled={isLoading}
                  className="gap-2"
                >
                  {isLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
                  Get API Access
                  <ArrowRight className="w-4 h-4" />
                </Button>
              </div>
            </div>
          ) : (
            /* Paid plans - Stripe */
            <Elements stripe={getStripe()}>
              <PaidPlanForm
                plan={plan}
                setPlan={setPlan}
                billingPeriod={billingPeriod}
                setBillingPeriod={setBillingPeriod}
                paymentMethodId={paymentMethodId}
                setPaymentMethodId={setPaymentMethodId}
                billingEmail={billingEmail}
                setBillingEmail={setBillingEmail}
                savingsPercent={savingsPercent}
                paidPlans={paidPlans}
                isLoading={isLoading}
                setIsLoading={setIsLoading}
                onSubmit={handlePaidPlanSubmit}
              />
            </Elements>
          )}
        </motion.div>
      </div>
    </div>
  );
}

interface PaidPlanFormProps {
  plan: PlanId;
  setPlan: (p: PlanId) => void;
  billingPeriod: "monthly" | "yearly";
  setBillingPeriod: (p: "monthly" | "yearly") => void;
  paymentMethodId: string | undefined;
  setPaymentMethodId: (id: string | undefined) => void;
  billingEmail: string;
  setBillingEmail: (e: string) => void;
  savingsPercent: number;
  paidPlans: typeof PLANS;
  isLoading: boolean;
  setIsLoading: (v: boolean) => void;
  onSubmit: (paymentMethodId: string) => Promise<void>;
}

function PaidPlanForm({
  plan,
  setPlan,
  billingPeriod,
  setBillingPeriod,
  paymentMethodId,
  setPaymentMethodId,
  billingEmail,
  setBillingEmail,
  savingsPercent,
  paidPlans,
  isLoading,
  setIsLoading,
  onSubmit,
}: PaidPlanFormProps) {
  const stripe = useStripe();
  const elements = useElements();
  const { toast } = useToast();

  const handleSaveCard = async () => {
    if (!stripe || !elements) return;
    setIsLoading(true);
    try {
      const siData = await apiClient.createSetupIntent();
      const { setupIntent, error } = await stripe.confirmCardSetup(siData.clientSecret, {
        payment_method: { card: elements.getElement(CardElement)! },
      });
      if (error) {
        toast({ title: "Card error", description: error.message, variant: "destructive" });
      } else if (setupIntent?.payment_method) {
        setPaymentMethodId(setupIntent.payment_method as string);
        toast({ title: "Card saved", description: "Your payment method has been saved." });
      }
    } catch (err: any) {
      toast({ title: "Error", description: err?.message || "Failed to save card", variant: "destructive" });
    } finally {
      setIsLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!paymentMethodId) {
      toast({ title: "Card required", description: "Please save your card first.", variant: "destructive" });
      return;
    }
    await onSubmit(paymentMethodId);
  };

  const isYearly = billingPeriod === "yearly";

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 text-primary text-xs font-semibold">
        7-day free trial · No charges until it ends
      </div>

      <div className="flex items-center justify-center gap-4">
        <span className={cn("text-sm font-medium", !isYearly && "text-foreground", isYearly && "text-muted-foreground")}>
          Monthly
        </span>
        <Switch
          checked={isYearly}
          onCheckedChange={(checked) => setBillingPeriod(checked ? "yearly" : "monthly")}
        />
        <span className={cn("text-sm font-medium", isYearly && "text-foreground", !isYearly && "text-muted-foreground")}>
          Yearly
          <span className="ml-2 px-2 py-0.5 text-xs rounded-full gradient-bg text-primary-foreground">
            Save {savingsPercent}%
          </span>
        </span>
      </div>

      <RadioGroup value={plan} onValueChange={(v) => setPlan(v as PlanId)}>
        <div className="grid md:grid-cols-3 gap-4">
          {paidPlans.map((p) => (
            <Label
              key={p.id}
              htmlFor={`plan-${p.id}`}
              className={cn(
                "flex flex-col rounded-xl border-2 p-4 cursor-pointer transition-all select-none",
                plan === p.id ? "border-primary bg-primary/5" : "border-border hover:border-primary/50"
              )}
            >
              <div className="flex items-start gap-3">
                <RadioGroupItem value={p.id} id={`plan-${p.id}`} className="mt-1" />
                <div className="flex-1 min-w-0">
                  <span className="text-base font-semibold block">
                    {p.name}
                  </span>
                  <p className="text-2xl font-bold gradient-text mt-1">
                    ${isYearly ? Math.round(p.yearlyPrice / 12) : p.monthlyPrice}
                    <span className="text-sm text-muted-foreground font-normal">/mo</span>
                  </p>
                  {isYearly && (
                    <p className="text-sm text-muted-foreground mt-0.5">
                      Billed annually (${p.yearlyPrice}/year)
                    </p>
                  )}
                  <ul className="mt-2 space-y-1">
                    {p.features.slice(0, 3).map((f) => (
                      <li key={f} className="text-sm text-muted-foreground flex items-center gap-1">
                        <Check className="w-3 h-3 text-primary" /> {f}
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            </Label>
          ))}
        </div>
      </RadioGroup>

      <div className="space-y-4">
        <h3 className="font-semibold">Payment Details</h3>
        <div className="space-y-2">
          <Label htmlFor="billingEmail">Billing Email</Label>
          <Input
            id="billingEmail"
            type="email"
            placeholder="billing@company.com"
            value={billingEmail}
            onChange={(e) => setBillingEmail(e.target.value)}
          />
        </div>
        {paymentMethodId ? (
          <div className="flex items-center gap-2 p-3 bg-green-50 dark:bg-green-950/20 border border-green-200 dark:border-green-800 rounded-lg text-green-700 dark:text-green-400 text-sm">
            <Check className="h-4 w-4" />
            Payment method saved. You can proceed.
          </div>
        ) : (
          <div className="space-y-3">
            <div className="border border-border rounded-lg p-3 bg-background">
              <CardElement options={{ style: { base: { fontSize: "16px", color: "#374151" } } }} />
            </div>
            <Button type="button" variant="outline" size="sm" onClick={handleSaveCard} disabled={isLoading}>
              {isLoading ? "Saving..." : "Save Card"}
            </Button>
          </div>
        )}
      </div>

      <div className="flex items-center gap-2 text-sm text-muted-foreground">
        <CreditCard className="w-4 h-4" />
        Secured by Stripe. Your payment information is encrypted.
      </div>

      <Button type="submit" variant="gradient" className="w-full gap-2" disabled={!paymentMethodId || isLoading}>
        {isLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
        Start Free Trial
        <ArrowRight className="w-4 h-4" />
      </Button>
    </form>
  );
}
