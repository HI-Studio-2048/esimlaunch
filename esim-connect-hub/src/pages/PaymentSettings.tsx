import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { apiClient } from "@/lib/api";
import {
  CreditCard,
  Trash2,
  Pencil,
  Check,
  X,
  Tag,
  RefreshCw,
  Ticket,
  ChevronDown,
  Plus,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Elements, CardElement, useStripe, useElements } from "@stripe/react-stripe-js";
import { getStripe } from "@/lib/stripe";

interface SavedCard {
  id: string;
  brand: string;
  last4: string;
  expMonth: number;
  expYear: number;
  isDefault: boolean;
}

interface BillingDetails {
  companyName: string;
  vatNumber: string;
  billingCountry: string;
  billingAddress: string;
  contactPerson: string;
  telephone: string;
  billingEmail: string;
}

const CARD_BRAND_COLORS: Record<string, string> = {
  visa: "bg-blue-700",
  mastercard: "bg-orange-600",
  amex: "bg-green-700",
  discover: "bg-orange-400",
};

const CARD_BRAND_LABELS: Record<string, string> = {
  visa: "VISA",
  mastercard: "MC",
  amex: "AMEX",
  discover: "DISC",
};

const COUNTRIES = [
  "United States", "United Kingdom", "Canada", "Australia", "Germany",
  "France", "Japan", "Singapore", "Malaysia", "UAE",
];

export default function PaymentSettings() {
  const { toast } = useToast();

  const [cards, setCards] = useState<SavedCard[]>([]);
  const [cardsLoading, setCardsLoading] = useState(true);
  const [deletingCard, setDeletingCard] = useState<string | null>(null);

  const [billingDetails, setBillingDetails] = useState<BillingDetails>({
    companyName: "",
    vatNumber: "",
    billingCountry: "",
    billingAddress: "",
    contactPerson: "",
    telephone: "",
    billingEmail: "",
  });
  const [billingLoading, setBillingLoading] = useState(true);
  const [isEditingBilling, setIsEditingBilling] = useState(false);
  const [savingBilling, setSavingBilling] = useState(false);
  const [billingDraft, setBillingDraft] = useState<BillingDetails>(billingDetails);

  const [showCoupon, setShowCoupon] = useState(false);
  const [couponCode, setCouponCode] = useState("");
  const [redeemingCoupon, setRedeemingCoupon] = useState(false);

  useEffect(() => {
    // Load saved cards
    setCardsLoading(true);
    apiClient.getPaymentMethods()
      .then((res: any) => {
        const methods = res?.paymentMethods || [];
        setCards(methods.map((m: any) => ({
          id: m.id,
          brand: m.card?.brand || "unknown",
          last4: m.card?.last4 || "????",
          expMonth: m.card?.expMonth || m.card?.exp_month || 1,
          expYear: m.card?.expYear || m.card?.exp_year || 2025,
          isDefault: m.isDefault || false,
        })));
      })
      .catch(() => {
        // If not available, show empty state
        setCards([]);
      })
      .finally(() => setCardsLoading(false));

    // Load billing details
    setBillingLoading(true);
    apiClient.getMerchantProfile()
      .then((res: any) => {
        const merchant = res?.merchant || res || {};
        const details: BillingDetails = {
          companyName: merchant.businessName || merchant.name || "",
          vatNumber: merchant.vatNumber || "",
          billingCountry: merchant.country || "",
          billingAddress: merchant.address || "",
          contactPerson: merchant.contactPerson || merchant.name || "",
          telephone: merchant.phone || "",
          billingEmail: merchant.email || "",
        };
        setBillingDetails(details);
        setBillingDraft(details);
      })
      .catch(() => {})
      .finally(() => setBillingLoading(false));
  }, []);

  const handleDeleteCard = async (cardId: string) => {
    if (!confirm("Remove this payment method?")) return;
    setDeletingCard(cardId);
    try {
      await apiClient.deletePaymentMethod(cardId);
      setCards((prev) => prev.filter((c) => c.id !== cardId));
      toast({ title: "Card removed", description: "Payment method removed." });
    } catch (err: any) {
      toast({ title: "Error", description: err?.message || "Failed to remove card.", variant: "destructive" });
    } finally {
      setDeletingCard(null);
    }
  };

  const handleSaveBilling = async () => {
    setSavingBilling(true);
    try {
      await apiClient.updateMerchantProfile({
        businessName: billingDraft.companyName,
        vatNumber: billingDraft.vatNumber,
        country: billingDraft.billingCountry,
        address: billingDraft.billingAddress,
        contactPerson: billingDraft.contactPerson,
        phone: billingDraft.telephone,
        email: billingDraft.billingEmail,
      });
      setBillingDetails(billingDraft);
      setIsEditingBilling(false);
      toast({ title: "Saved", description: "Billing details updated." });
    } catch (err: any) {
      toast({ title: "Error", description: err?.message || "Failed to save billing details.", variant: "destructive" });
    } finally {
      setSavingBilling(false);
    }
  };

  const handleRedeemCoupon = async () => {
    if (!couponCode.trim()) return;
    setRedeemingCoupon(true);
    try {
      await apiClient.applyCoupon(couponCode.trim());
      toast({ title: "Coupon redeemed!", description: `Coupon ${couponCode.toUpperCase()} applied to your subscription.` });
      setCouponCode("");
      setShowCoupon(false);
    } catch (err: any) {
      toast({ title: "Invalid coupon", description: err?.message || "Coupon code not found.", variant: "destructive" });
    } finally {
      setRedeemingCoupon(false);
    }
  };

  const [showAddCard, setShowAddCard] = useState(false);

  const handleCardAdded = () => {
    setShowAddCard(false);
    // Reload cards
    setCardsLoading(true);
    apiClient.getPaymentMethods()
      .then((res: any) => {
        const methods = res?.paymentMethods || [];
        setCards(methods.map((m: any) => ({
          id: m.id,
          brand: m.card?.brand || "unknown",
          last4: m.card?.last4 || "????",
          expMonth: m.card?.expMonth || m.card?.exp_month || 1,
          expYear: m.card?.expYear || m.card?.exp_year || 2025,
          isDefault: m.isDefault || false,
        })));
      })
      .catch(() => setCards([]))
      .finally(() => setCardsLoading(false));
  };

  const AddCardForm = ({ onSuccess, onCancel }: { onSuccess: () => void; onCancel: () => void }) => {
    const stripe = useStripe();
    const elements = useElements();
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [cardError, setCardError] = useState<string | null>(null);

    const handleSubmit = async (e: React.FormEvent) => {
      e.preventDefault();
      if (!stripe || !elements) return;
      setIsSubmitting(true);
      setCardError(null);
      try {
        const siData = await apiClient.createSetupIntent();
        const clientSecret = siData.clientSecret;
        const cardElement = elements.getElement(CardElement);
        if (!cardElement) throw new Error("Card element not found");
        const { error, setupIntent } = await stripe.confirmCardSetup(clientSecret, {
          payment_method: { card: cardElement },
        });
        if (error) {
          setCardError(error.message || "Card setup failed");
        } else if (setupIntent?.status === 'succeeded') {
          toast({ title: "Card added", description: "Your new payment method has been saved." });
          onSuccess();
        }
      } catch (err: any) {
        setCardError(err?.message || "Failed to save card");
      } finally {
        setIsSubmitting(false);
      }
    };

    return (
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="p-3 border rounded-lg bg-background">
          <CardElement options={{ style: { base: { fontSize: '16px', color: '#424770' } } }} />
        </div>
        {cardError && <p className="text-sm text-destructive">{cardError}</p>}
        <div className="flex gap-2 justify-end">
          <Button type="button" variant="outline" size="sm" onClick={onCancel} disabled={isSubmitting}>Cancel</Button>
          <Button type="submit" size="sm" disabled={isSubmitting || !stripe}>
            {isSubmitting ? <RefreshCw className="w-4 h-4 animate-spin mr-2" /> : null}
            Save Card
          </Button>
        </div>
      </form>
    );
  };

  const BillingField = ({ label, value, field, type = "text" }: { label: string; value: string; field: keyof BillingDetails; type?: string }) => (
    <div>
      <Label className="text-xs text-muted-foreground mb-1.5 block">{label}</Label>
      {isEditingBilling ? (
        field === "billingCountry" ? (
          <div className="relative">
            <select
              value={billingDraft[field]}
              onChange={(e) => setBillingDraft({ ...billingDraft, [field]: e.target.value })}
              className="w-full h-9 px-3 text-sm rounded-md border border-input bg-background appearance-none pr-8"
            >
              <option value="">Select country</option>
              {COUNTRIES.map((c) => <option key={c} value={c}>{c}</option>)}
            </select>
            <ChevronDown className="absolute right-2 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground pointer-events-none" />
          </div>
        ) : (
          <Input
            type={type}
            value={billingDraft[field]}
            onChange={(e) => setBillingDraft({ ...billingDraft, [field]: e.target.value })}
            className="h-9 text-sm"
          />
        )
      ) : (
        <p className="text-sm font-medium py-1 min-h-[36px] flex items-center">
          {value || <span className="text-muted-foreground">Not set</span>}
        </p>
      )}
    </div>
  );

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="bg-card border-b border-border sticky top-16 md:top-20 z-40">
        <div className="container-custom py-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="font-display text-2xl font-bold">Payment Settings</h1>
              <p className="text-sm text-muted-foreground">Manage your payment methods and billing info</p>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowCoupon(true)}
              className="gap-2"
            >
              <Tag className="w-4 h-4" />
              Redeem Coupon
            </Button>
          </div>
        </div>
      </div>

      <div className="container-custom py-6 max-w-3xl">
        {/* Saved Payment Card */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-card rounded-2xl p-5 border mb-5"
        >
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-semibold text-base">Saved Payment Card</h2>
            {!showAddCard && (
              <Button size="sm" variant="outline" className="gap-2" onClick={() => setShowAddCard(true)}>
                <Plus className="w-3.5 h-3.5" />
                Add Card
              </Button>
            )}
          </div>
          {showAddCard && (
            <div className="mb-4">
              <Elements stripe={getStripe()}>
                <AddCardForm onSuccess={handleCardAdded} onCancel={() => setShowAddCard(false)} />
              </Elements>
            </div>
          )}
          {cardsLoading ? (
            <div className="h-16 bg-muted rounded-xl animate-pulse" />
          ) : cards.length === 0 && !showAddCard ? (
            <div className="text-center py-8 text-muted-foreground">
              <CreditCard className="w-12 h-12 mx-auto mb-3 opacity-40" />
              <p className="text-sm font-medium mb-1">No saved cards</p>
              <p className="text-xs">Click "Add Card" to add a payment method.</p>
            </div>
          ) : (
            <div className="space-y-3">
              {cards.map((card) => (
                <div key={card.id} className="flex items-center justify-between bg-muted/30 rounded-xl px-4 py-3">
                  <div className="flex items-center gap-4">
                    {/* Card brand badge */}
                    <div className={cn(
                      "w-12 h-8 rounded-md flex items-center justify-center text-white text-xs font-bold",
                      CARD_BRAND_COLORS[card.brand] || "bg-gray-600"
                    )}>
                      {CARD_BRAND_LABELS[card.brand] || card.brand.toUpperCase().slice(0, 4)}
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-medium font-mono tracking-wider">
                          •••• •••• •••• {card.last4}
                        </span>
                        {card.isDefault && (
                          <span className="px-1.5 py-0.5 bg-primary/10 text-primary text-xs rounded-md">
                            Default
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-muted-foreground">
                        Expires {String(card.expMonth).padStart(2, "0")}/{card.expYear}
                      </p>
                    </div>
                  </div>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => handleDeleteCard(card.id)}
                    disabled={deletingCard === card.id}
                    className="text-destructive hover:text-destructive hover:bg-destructive/10"
                  >
                    {deletingCard === card.id ? (
                      <RefreshCw className="w-4 h-4 animate-spin" />
                    ) : (
                      <Trash2 className="w-4 h-4" />
                    )}
                  </Button>
                </div>
              ))}
            </div>
          )}
        </motion.div>

        {/* Billing Details */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.05 }}
          className="bg-card rounded-2xl p-5 border"
        >
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-semibold text-base">Billing Details</h2>
            <div className="flex gap-2">
              {isEditingBilling ? (
                <>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      setIsEditingBilling(false);
                      setBillingDraft(billingDetails);
                    }}
                    className="gap-2 h-8"
                  >
                    <X className="w-3.5 h-3.5" />
                    Cancel
                  </Button>
                  <Button
                    size="sm"
                    onClick={handleSaveBilling}
                    disabled={savingBilling}
                    className="gap-2 h-8"
                  >
                    {savingBilling ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Check className="w-3.5 h-3.5" />}
                    Save
                  </Button>
                </>
              ) : (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setIsEditingBilling(true)}
                  className="gap-2 h-8"
                >
                  <Pencil className="w-3.5 h-3.5" />
                  Edit
                </Button>
              )}
            </div>
          </div>

          {billingLoading ? (
            <div className="space-y-4">
              {Array.from({ length: 4 }).map((_, i) => (
                <div key={i} className="h-10 bg-muted rounded animate-pulse" />
              ))}
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <BillingField label="Company name" value={billingDetails.companyName} field="companyName" />
              <BillingField label="VAT number" value={billingDetails.vatNumber} field="vatNumber" />
              <BillingField label="Billing country" value={billingDetails.billingCountry} field="billingCountry" />
              <BillingField label="Billing address" value={billingDetails.billingAddress} field="billingAddress" />
              <BillingField label="Contact Person" value={billingDetails.contactPerson} field="contactPerson" />
              <BillingField label="Tel" value={billingDetails.telephone} field="telephone" type="tel" />
              <div className="md:col-span-2">
                <BillingField label="Billing contact email" value={billingDetails.billingEmail} field="billingEmail" type="email" />
              </div>
            </div>
          )}
        </motion.div>
      </div>

      {/* Redeem Coupon Modal */}
      {showCoupon && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 px-4">
          <motion.div
            initial={{ scale: 0.9 }}
            animate={{ scale: 1 }}
            className="bg-card rounded-2xl p-6 border w-full max-w-sm shadow-xl"
          >
            <div className="flex items-center justify-between mb-5">
              <h3 className="font-semibold text-lg flex items-center gap-2">
                <Ticket className="w-5 h-5 text-primary" />
                Redeem Coupon
              </h3>
              <Button variant="ghost" size="icon" onClick={() => setShowCoupon(false)}>
                <X className="w-4 h-4" />
              </Button>
            </div>
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="couponCode">Coupon Code</Label>
                <Input
                  id="couponCode"
                  placeholder="Enter coupon code..."
                  value={couponCode}
                  onChange={(e) => setCouponCode(e.target.value.toUpperCase())}
                  className="font-mono uppercase"
                />
              </div>
              <Button
                variant="gradient"
                onClick={handleRedeemCoupon}
                disabled={redeemingCoupon || !couponCode.trim()}
                className="w-full gap-2"
              >
                {redeemingCoupon ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Tag className="w-4 h-4" />}
                Redeem
              </Button>
            </div>
          </motion.div>
        </div>
      )}
    </div>
  );
}


