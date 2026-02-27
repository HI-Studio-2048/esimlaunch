import { useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { Elements } from "@stripe/react-stripe-js";
import { getStripe } from "@/lib/stripe";
import { useDemoStore } from "@/contexts/DemoStoreContext";
import { useCustomerAuth } from "@/contexts/CustomerAuthContext";
import { apiClient } from "@/lib/api";
import { useToast } from "@/hooks/use-toast";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ArrowLeft, Loader2, CheckCircle2 } from "lucide-react";
import { PaymentElement, useStripe, useElements } from "@stripe/react-stripe-js";

interface CheckoutFormProps {
  paymentIntentClientSecret: string;
  amount: number;
  onSuccess: (paymentIntentId: string) => void;
}

interface CheckoutFormInternalProps extends CheckoutFormProps {
  customerEmail: string;
  setCustomerEmail: (email: string) => void;
  packageInfo: any;
}

const CheckoutForm = ({ paymentIntentClientSecret, amount, onSuccess, customerEmail, setCustomerEmail, packageInfo }: CheckoutFormInternalProps) => {
  const stripe = useStripe();
  const elements = useElements();
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { toast } = useToast();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!stripe || !elements) {
      return;
    }

    setIsProcessing(true);
    setError(null);

    try {
      const { error: submitError } = await elements.submit();
      if (submitError) {
        setError(submitError.message || "An error occurred");
        setIsProcessing(false);
        return;
      }

      const { error: confirmError, paymentIntent } = await stripe.confirmPayment({
        elements,
        clientSecret: paymentIntentClientSecret,
        confirmParams: {
          return_url: `${window.location.origin}/order-tracking`,
        },
        redirect: "if_required",
      });

      if (confirmError) {
        setError(confirmError.message || "Payment failed");
        setIsProcessing(false);
      } else if (paymentIntent && paymentIntent.status === "succeeded") {
        // Use customer email from form state
        const email = customerEmail || paymentIntent.receipt_email || '';

        try {
          // Confirm payment on backend with customer info
          await apiClient.confirmPayment(paymentIntent.id, {
            customerEmail: email,
            customerName: customer?.name || packageInfo?.customerName,
            customerId: customer?.id, // Link to customer account if logged in
            storeId: localStorage.getItem("current_store_id") || undefined,
            packageInfoList: [{
              slug: packageInfo?.slug || packageInfo?.id?.toString(),
              count: 1,
              price: Math.round(packageInfo.price * 100),
            }],
          });
          onSuccess(paymentIntent.id);
        } catch (err: any) {
          const message =
            err?.errorCode === "INSUFFICIENT_BALANCE"
              ? "This store is temporarily unavailable because the merchant balance is too low to fulfill orders. Please try again later."
              : err?.message || "Payment succeeded, but we could not create your eSIM order. Please contact support.";
          setError(message);
          setIsProcessing(false);
        }
      } else {
        setIsProcessing(false);
      }
    } catch (err: any) {
      setError(err.message || "An error occurred during payment");
      setIsProcessing(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="space-y-2">
        <Label htmlFor="email">Email Address</Label>
        <Input
          id="email"
          name="email"
          type="email"
          value={customerEmail}
          onChange={(e) => setCustomerEmail(e.target.value)}
          placeholder="your@email.com"
          required
        />
        <p className="text-xs text-muted-foreground">
          We'll send your eSIM QR code to this email
        </p>
      </div>
      <PaymentElement />
      {error && (
        <div className="text-sm text-destructive bg-destructive/10 p-3 rounded-md">
          {error}
        </div>
      )}
      <Button
        type="submit"
        disabled={!stripe || isProcessing || !customerEmail}
        className="w-full"
        size="lg"
      >
        {isProcessing ? (
          <>
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            Processing...
          </>
        ) : (
          `Pay $${(amount / 100).toFixed(2)}`
        )}
      </Button>
    </form>
  );
};

export default function DemoStoreCheckout() {
  const { config } = useDemoStore();
  const { customer } = useCustomerAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const { toast } = useToast();
  const [paymentIntentClientSecret, setPaymentIntentClientSecret] = useState<string | null>(null);
  const [amount, setAmount] = useState<number>(0);
  const [packageInfo, setPackageInfo] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [paymentSuccess, setPaymentSuccess] = useState(false);
  const [orderId, setOrderId] = useState<string | null>(null);
  const [customerEmail, setCustomerEmail] = useState<string>(customer?.email || "");

  useEffect(() => {
    // Get package info from location state
    const state = location.state as any;
    if (!state || !state.package) {
      toast({
        title: "Error",
        description: "No package selected. Please select a package first.",
        variant: "destructive",
      });
      navigate(-1);
      return;
    }

    const pkg = state.package;
    setPackageInfo(pkg);
    const packageAmount = Math.round(pkg.price * 100); // Convert to cents
    setAmount(packageAmount);

    // Create payment intent
    const createPaymentIntent = async () => {
      try {
        const storeId = localStorage.getItem("current_store_id");
        const result = await apiClient.createPaymentIntent({
          amount: packageAmount,
          currency: "usd",
          metadata: {
            packageId: pkg.id?.toString() || "",
            packageData: pkg.data || "",
            packageValidity: pkg.validity || "",
          },
          storeId: storeId || undefined,
        });

        setPaymentIntentClientSecret(result.clientSecret);
      } catch (error: any) {
        toast({
          title: "Error",
          description: error.message || "Failed to initialize payment",
          variant: "destructive",
        });
        navigate(-1);
      } finally {
        setIsLoading(false);
      }
    };

    createPaymentIntent();
  }, [location, navigate, toast]);

  const handlePaymentSuccess = async (paymentIntentId: string) => {
    setPaymentSuccess(true);
    // Here we would create the order, but that will be handled in Batch 1.3
    // For now, just show success
    toast({
      title: "Payment Successful!",
      description: "Your order is being processed. You will receive an email shortly.",
    });
    
    // Redirect to order tracking after a delay
    setTimeout(() => {
      navigate("/order-tracking", { 
        state: { paymentIntentId } 
      });
    }, 2000);
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4" />
          <p className="text-muted-foreground">Initializing payment...</p>
        </div>
      </div>
    );
  }

  if (paymentSuccess) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <Card className="max-w-md w-full">
          <CardContent className="pt-6">
            <div className="text-center space-y-4">
              <CheckCircle2 className="h-16 w-16 text-green-500 mx-auto" />
              <h2 className="text-2xl font-bold">Payment Successful!</h2>
              <p className="text-muted-foreground">
                Your order is being processed. You will receive an email with your eSIM QR code shortly.
              </p>
              <Button onClick={() => navigate("/order-tracking")} className="w-full">
                View Order
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!paymentIntentClientSecret) {
    return null;
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-8 max-w-4xl">
        <Button
          variant="ghost"
          onClick={() => navigate(-1)}
          className="mb-6"
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back
        </Button>

        <div className="grid md:grid-cols-2 gap-8">
          {/* Order Summary */}
          <Card>
            <CardHeader>
              <CardTitle>Order Summary</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {packageInfo && (
                <>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Package</span>
                    <span className="font-medium">{packageInfo.data}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Validity</span>
                    <span className="font-medium">{packageInfo.validity}</span>
                  </div>
                  <div className="border-t pt-4">
                    <div className="flex justify-between text-lg font-bold">
                      <span>Total</span>
                      <span style={{ color: config.primaryColor }}>
                        ${packageInfo.price.toFixed(2)}
                      </span>
                    </div>
                  </div>
                </>
              )}
            </CardContent>
          </Card>

          {/* Payment Form */}
          <Card>
            <CardHeader>
              <CardTitle>Payment Details</CardTitle>
              <CardDescription>
                Enter your payment information to complete the purchase
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Elements
                stripe={getStripe()}
                options={{
                  clientSecret: paymentIntentClientSecret,
                  appearance: {
                    theme: "stripe",
                    variables: {
                      colorPrimary: config.primaryColor,
                    },
                  },
                }}
              >
                <CheckoutForm
                  paymentIntentClientSecret={paymentIntentClientSecret}
                  amount={amount}
                  onSuccess={handlePaymentSuccess}
                  customerEmail={customerEmail}
                  setCustomerEmail={setCustomerEmail}
                  packageInfo={packageInfo}
                />
              </Elements>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}

