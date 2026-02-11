import { useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { Elements } from "@stripe/react-stripe-js";
import { getStripe } from "@/lib/stripe";
import { apiClient } from "@/lib/api";
import { useToast } from "@/hooks/use-toast";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ArrowLeft, Loader2, CheckCircle2 } from "lucide-react";
import { PaymentElement, useStripe, useElements } from "@stripe/react-stripe-js";

interface CheckoutFormProps {
  paymentIntentClientSecret: string;
  amount: number;
  onSuccess: (paymentIntentId: string) => void;
}

const CheckoutForm = ({ paymentIntentClientSecret, amount, onSuccess }: CheckoutFormProps) => {
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
        await apiClient.confirmPayment(paymentIntent.id);
        onSuccess(paymentIntent.id);
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
      <PaymentElement />
      {error && (
        <div className="text-sm text-destructive bg-destructive/10 p-3 rounded-md">
          {error}
        </div>
      )}
      <Button
        type="submit"
        disabled={!stripe || isProcessing}
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

export default function Checkout() {
  const navigate = useNavigate();
  const location = useLocation();
  const { toast } = useToast();
  const [paymentIntentClientSecret, setPaymentIntentClientSecret] = useState<string | null>(null);
  const [amount, setAmount] = useState<number>(0);
  const [orderInfo, setOrderInfo] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [paymentSuccess, setPaymentSuccess] = useState(false);

  useEffect(() => {
    const state = location.state as any;
    if (!state || !state.amount) {
      toast({
        title: "Error",
        description: "No order information provided.",
        variant: "destructive",
      });
      navigate(-1);
      return;
    }

    const orderAmount = Math.round(state.amount * 100); // Convert to cents
    setAmount(orderAmount);
    setOrderInfo(state);

    const createPaymentIntent = async () => {
      try {
        const result = await apiClient.createPaymentIntent({
          amount: orderAmount,
          currency: "usd",
          metadata: state.metadata || {},
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
    toast({
      title: "Payment Successful!",
      description: "Your order is being processed.",
    });
    
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
                Your order is being processed.
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
          <Card>
            <CardHeader>
              <CardTitle>Order Summary</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {orderInfo && (
                <>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Amount</span>
                    <span className="font-medium">${(orderInfo.amount || amount / 100).toFixed(2)}</span>
                  </div>
                  <div className="border-t pt-4">
                    <div className="flex justify-between text-lg font-bold">
                      <span>Total</span>
                      <span>${(amount / 100).toFixed(2)}</span>
                    </div>
                  </div>
                </>
              )}
            </CardContent>
          </Card>

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
                }}
              >
                <CheckoutForm
                  paymentIntentClientSecret={paymentIntentClientSecret}
                  amount={amount}
                  onSuccess={handlePaymentSuccess}
                />
              </Elements>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}


