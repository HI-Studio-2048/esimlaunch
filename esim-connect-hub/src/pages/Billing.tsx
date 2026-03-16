import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { apiClient } from "@/lib/api";
import { 
  CreditCard, Calendar, Download, Loader2, 
  CheckCircle2, AlertCircle, ArrowUp, ArrowDown
} from "lucide-react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

const plans: Record<string, { name: string; price: number; features: string[] }> = {
  test: { name: 'Test', price: 1, features: ['Same as Starter, for testing'] },
  starter: { name: 'Starter', price: 29, features: ['Basic features'] },
  growth: { name: 'Growth', price: 79, features: ['All Starter features', 'Custom domain', 'Advanced analytics'] },
  scale: { name: 'Scale', price: 299, features: ['All Growth features', 'Priority support', 'White-label options'] },
  api_only: { name: 'API Only', price: 0, features: ['REST API', 'Webhooks', 'API keys'] },
};

export default function Billing() {
  const { toast } = useToast();
  const [subscription, setSubscription] = useState<any>(null);
  const [invoices, setInvoices] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isUpdating, setIsUpdating] = useState(false);

  useEffect(() => {
    loadBillingData();
  }, []);

  const loadBillingData = async () => {
    setIsLoading(true);
    try {
      // Load subscription (apiClient returns unwrapped data; may include invoices)
      try {
        const subResult = await apiClient.request<any>('/api/subscriptions/me');
        if (subResult && typeof subResult === 'object') {
          setSubscription(subResult);
          if (Array.isArray(subResult.invoices)) setInvoices(subResult.invoices);
        } else {
          setSubscription(null);
        }
      } catch (error: any) {
        console.log('Subscription endpoint not available:', error.message);
        setSubscription(null);
      }

      // Load invoices if not already set from subscription response
      try {
        const invResult = await apiClient.request<any>('/api/subscriptions/invoices');
        setInvoices(Array.isArray(invResult) ? invResult : []);
      } catch (error: any) {
        setInvoices([]);
      }
    } catch (error: any) {
      console.error('Failed to load billing data:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleUpgrade = async (newPlan: string) => {
    setIsUpdating(true);
    try {
      const result = await apiClient.request<any>('/api/subscriptions/me', {
        method: 'PUT',
        body: JSON.stringify({
          plan: newPlan,
          billingPeriod: subscription?.billingPeriod || 'monthly',
        }),
      });

      if (result && typeof result === 'object') {
        toast({
          title: "Subscription Updated",
          description: `Your subscription has been updated to ${plans[newPlan as keyof typeof plans]?.name}.`,
        });
        loadBillingData();
      } else {
        throw new Error('Failed to update subscription');
      }
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to update subscription",
        variant: "destructive",
      });
    } finally {
      setIsUpdating(false);
    }
  };

  const handleCancel = async (cancelImmediately: boolean = false) => {
    if (!confirm(`Are you sure you want to ${cancelImmediately ? 'cancel immediately' : 'cancel at period end'}?`)) {
      return;
    }

    setIsUpdating(true);
    try {
      const result = await apiClient.request<any>(`/api/subscriptions/me?cancelImmediately=${cancelImmediately}`, {
        method: 'DELETE',
      });

      if (result != null) {
        toast({
          title: "Subscription Canceled",
          description: cancelImmediately
            ? "Your subscription has been canceled immediately."
            : "Your subscription will be canceled at the end of the billing period.",
        });
        loadBillingData();
      } else {
        throw new Error('Failed to cancel subscription');
      }
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to cancel subscription",
        variant: "destructive",
      });
    } finally {
      setIsUpdating(false);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  const currentPlan = subscription?.plan || 'starter';
  const planInfo = plans[currentPlan as keyof typeof plans];

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-8 max-w-6xl">
        <h1 className="text-3xl font-bold mb-8">Billing & Subscription</h1>

        {/* Current Plan */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle>Current Plan</CardTitle>
            <CardDescription>
              Manage your subscription and billing information
            </CardDescription>
          </CardHeader>
          <CardContent>
            {subscription ? (
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <div className="flex items-center gap-3 mb-2">
                      <h3 className="text-xl font-bold">{planInfo?.name} Plan</h3>
                      <Badge 
                        variant={subscription.status === 'active' || subscription.status === 'trialing' ? 'default' : 'secondary'}
                      >
                        {subscription.status === 'trialing' ? 'Free trial' : subscription.status}
                      </Badge>
                    </div>
                    <p className="text-muted-foreground">
                      ${planInfo?.price}/month
                      {subscription.status === 'trialing' && subscription.currentPeriodEnd && (
                        <span className="block text-xs mt-1">
                          Trial ends {new Date(subscription.currentPeriodEnd).toLocaleDateString()}
                        </span>
                      )}
                    </p>
                  </div>
                  {(subscription.status === 'active' || subscription.status === 'trialing') && (
                    <Button
                      variant="outline"
                      onClick={() => handleCancel(false)}
                      disabled={isUpdating}
                    >
                      Cancel Subscription
                    </Button>
                  )}
                </div>

                <div className="grid md:grid-cols-2 gap-4 text-sm">
                  <div>
                    <p className="text-muted-foreground">Current Period</p>
                    <p className="font-medium">
                      {new Date(subscription.currentPeriodStart).toLocaleDateString()} - {' '}
                      {new Date(subscription.currentPeriodEnd).toLocaleDateString()}
                    </p>
                  </div>
                  {subscription.cancelAtPeriodEnd && (
                    <div className="bg-yellow-50 dark:bg-yellow-900/20 p-3 rounded-lg">
                      <div className="flex items-center gap-2">
                        <AlertCircle className="h-4 w-4 text-yellow-600" />
                        <p className="text-sm text-yellow-900 dark:text-yellow-100">
                          Subscription will cancel on {new Date(subscription.currentPeriodEnd).toLocaleDateString()}
                        </p>
                      </div>
                    </div>
                  )}
                </div>

                {/* Upgrade Options */}
                {currentPlan === 'api_only' && (
                  <div className="border-t pt-4">
                    <p className="text-sm font-medium mb-3">Upgrade to a paid plan</p>
                    <Button variant="outline" asChild>
                      <Link to="/subscribe">View Plans</Link>
                    </Button>
                  </div>
                )}
                {currentPlan !== 'scale' && currentPlan !== 'api_only' && (
                  <div className="border-t pt-4">
                    <p className="text-sm font-medium mb-3">Upgrade Plan</p>
                    <div className="flex gap-2 flex-wrap">
                      {currentPlan === 'test' && (
                        <>
                          <Button
                            variant="outline"
                            onClick={() => handleUpgrade('starter')}
                            disabled={isUpdating}
                          >
                            <ArrowUp className="h-4 w-4 mr-2" />
                            Upgrade to Starter
                          </Button>
                          <Button
                            variant="outline"
                            onClick={() => handleUpgrade('growth')}
                            disabled={isUpdating}
                          >
                            <ArrowUp className="h-4 w-4 mr-2" />
                            Upgrade to Growth
                          </Button>
                          <Button
                            variant="outline"
                            onClick={() => handleUpgrade('scale')}
                            disabled={isUpdating}
                          >
                            <ArrowUp className="h-4 w-4 mr-2" />
                            Upgrade to Scale
                          </Button>
                        </>
                      )}
                      {currentPlan === 'starter' && (
                        <>
                          <Button
                            variant="outline"
                            onClick={() => handleUpgrade('growth')}
                            disabled={isUpdating}
                          >
                            <ArrowUp className="h-4 w-4 mr-2" />
                            Upgrade to Growth
                          </Button>
                          <Button
                            variant="outline"
                            onClick={() => handleUpgrade('scale')}
                            disabled={isUpdating}
                          >
                            <ArrowUp className="h-4 w-4 mr-2" />
                            Upgrade to Scale
                          </Button>
                        </>
                      )}
                      {currentPlan === 'growth' && (
                        <Button
                          variant="outline"
                          onClick={() => handleUpgrade('scale')}
                          disabled={isUpdating}
                        >
                          <ArrowUp className="h-4 w-4 mr-2" />
                          Upgrade to Scale
                        </Button>
                      )}
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <div className="text-center py-8">
                <p className="text-muted-foreground mb-4">No active subscription</p>
                <Button asChild>
                  <Link to="/pricing">View Plans</Link>
                </Button>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Invoice History */}
        <Card>
          <CardHeader>
            <CardTitle>Invoice History</CardTitle>
            <CardDescription>
              Download and view your past invoices
            </CardDescription>
          </CardHeader>
          <CardContent>
            {invoices.length === 0 ? (
              <div className="text-center py-8">
                <p className="text-muted-foreground">No invoices yet</p>
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Date</TableHead>
                    <TableHead>Amount</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Plan</TableHead>
                    <TableHead></TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {invoices.map((invoice) => (
                    <TableRow key={invoice.id}>
                      <TableCell>
                        {new Date(invoice.createdAt).toLocaleDateString()}
                      </TableCell>
                      <TableCell>
                        ${invoice.amount?.toFixed(2) || '0.00'} {invoice.currency?.toUpperCase()}
                      </TableCell>
                      <TableCell>
                        <Badge
                          variant={
                            invoice.status === 'paid' ? 'default' : 
                            invoice.status === 'open' ? 'secondary' : 'destructive'
                          }
                        >
                          {invoice.status}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        {subscription?.plan || 'N/A'}
                      </TableCell>
                      <TableCell>
                        {invoice.hostedInvoiceUrl && (
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => window.open(invoice.hostedInvoiceUrl, '_blank')}
                          >
                            <Download className="h-4 w-4 mr-2" />
                            View
                          </Button>
                        )}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}





