import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { apiClient } from "@/lib/api";
import { useToast } from "@/hooks/use-toast";
import { Save, TestTube, Loader2, Webhook, CheckCircle2, XCircle, Clock } from "lucide-react";
import { Checkbox } from "@/components/ui/checkbox";

const WEBHOOK_EVENTS = [
  { value: 'ORDER_STATUS', label: 'Order Status', description: 'Order status changes (pending, processing, completed, failed)' },
  { value: 'ESIM_STATUS', label: 'eSIM Status', description: 'eSIM profile status updates' },
  { value: 'DATA_USAGE', label: 'Data Usage', description: 'Data usage updates for eSIM profiles' },
  { value: 'VALIDITY_USAGE', label: 'Validity Usage', description: 'Validity period usage updates' },
  { value: 'BALANCE_LOW', label: 'Balance Low', description: 'Merchant balance is running low' },
  { value: 'SMDP_EVENT', label: 'SM-DP+ Event', description: 'SM-DP+ server events' },
];

export default function WebhookSettings() {
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [isTesting, setIsTesting] = useState(false);
  
  const [webhookUrl, setWebhookUrl] = useState("");
  const [webhookSecret, setWebhookSecret] = useState("");
  const [selectedEvents, setSelectedEvents] = useState<Set<string>>(new Set());
  const [isActive, setIsActive] = useState(true);
  const [lastTestResult, setLastTestResult] = useState<{ success: boolean; message: string; timestamp?: Date } | null>(null);

  useEffect(() => {
    loadWebhookConfig();
  }, []);

  const loadWebhookConfig = async () => {
    setIsLoading(true);
    try {
      const result = await apiClient.getWebhook();

      if (result.success && result.data) {
        setWebhookUrl(result.data.url || "");
        setWebhookSecret(result.data.secret || "");
        setSelectedEvents(new Set(result.data.events || []));
        setIsActive(result.data.isActive !== false);
      }
    } catch (error: any) {
      console.error('Failed to load webhook config:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleToggleEvent = (eventValue: string) => {
    setSelectedEvents(prev => {
      const newSet = new Set(prev);
      if (newSet.has(eventValue)) {
        newSet.delete(eventValue);
      } else {
        newSet.add(eventValue);
      }
      return newSet;
    });
  };

  const handleSelectAll = () => {
    setSelectedEvents(new Set(WEBHOOK_EVENTS.map(e => e.value)));
  };

  const handleDeselectAll = () => {
    setSelectedEvents(new Set());
  };

  const handleSave = async () => {
    if (!webhookUrl.trim()) {
      toast({
        title: "Error",
        description: "Webhook URL is required",
        variant: "destructive",
      });
      return;
    }

    if (selectedEvents.size === 0) {
      toast({
        title: "Error",
        description: "Please select at least one event type",
        variant: "destructive",
      });
      return;
    }

    setIsSaving(true);
    try {
      await apiClient.configureWebhook(
        webhookUrl,
        Array.from(selectedEvents),
        webhookSecret || undefined
      );

      toast({
        title: "Success",
        description: "Webhook configuration saved successfully.",
      });
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to save webhook configuration",
        variant: "destructive",
      });
    } finally {
      setIsSaving(false);
    }
  };

  const handleTest = async () => {
    if (!webhookUrl.trim()) {
      toast({
        title: "Error",
        description: "Please enter a webhook URL first",
        variant: "destructive",
      });
      return;
    }

    setIsTesting(true);
    setLastTestResult(null);

    try {
      // Use API client to test webhook
      const result = await apiClient.testWebhook(webhookUrl, webhookSecret || undefined);

      if (result.success) {
        setLastTestResult({
          success: true,
          message: "Test webhook sent successfully",
          timestamp: new Date(),
        });
        toast({
          title: "Test Successful",
          description: "Test webhook was sent to your URL. Check your server logs.",
        });
      } else {
        throw new Error(result.errorMessage || "Test webhook failed");
      }
    } catch (error: any) {
      setLastTestResult({
        success: false,
        message: error.message || "Failed to send test webhook",
        timestamp: new Date(),
      });
      toast({
        title: "Test Failed",
        description: error.message || "Failed to send test webhook",
        variant: "destructive",
      });
    } finally {
      setIsTesting(false);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-8 max-w-4xl">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
          <h1 className="text-3xl font-bold mb-2">Webhook Configuration</h1>
          <p className="text-muted-foreground">
            Configure webhooks to receive real-time notifications about order status, eSIM events, and more.
          </p>
        </motion.div>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Webhook className="h-5 w-5" />
              Webhook Settings
            </CardTitle>
            <CardDescription>
              Set up your webhook endpoint to receive notifications from eSIM Launch
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Webhook URL */}
            <div className="space-y-2">
              <Label htmlFor="webhook-url">Webhook URL *</Label>
              <Input
                id="webhook-url"
                type="url"
                placeholder="https://your-server.com/webhooks/esim"
                value={webhookUrl}
                onChange={(e) => setWebhookUrl(e.target.value)}
              />
              <p className="text-xs text-muted-foreground">
                The URL where webhook events will be sent. Must be HTTPS in production.
              </p>
            </div>

            {/* Webhook Secret */}
            <div className="space-y-2">
              <Label htmlFor="webhook-secret">Webhook Secret (Optional)</Label>
              <Input
                id="webhook-secret"
                type="password"
                placeholder="Enter secret for webhook verification"
                value={webhookSecret}
                onChange={(e) => setWebhookSecret(e.target.value)}
              />
              <p className="text-xs text-muted-foreground">
                Optional secret key for verifying webhook authenticity. Will be sent in X-Webhook-Signature header.
              </p>
            </div>

            {/* Active Toggle */}
            <div className="flex items-center justify-between">
              <div>
                <Label htmlFor="webhook-active">Webhook Active</Label>
                <p className="text-xs text-muted-foreground">
                  Enable or disable webhook delivery
                </p>
              </div>
              <Switch
                id="webhook-active"
                checked={isActive}
                onCheckedChange={setIsActive}
              />
            </div>

            {/* Event Types */}
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <Label>Event Types *</Label>
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleSelectAll}
                  >
                    Select All
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleDeselectAll}
                  >
                    Deselect All
                  </Button>
                </div>
              </div>
              <div className="space-y-3">
                {WEBHOOK_EVENTS.map((event) => (
                  <div
                    key={event.value}
                    className="flex items-start space-x-3 p-3 border rounded-lg hover:bg-muted/50 transition-colors"
                  >
                    <Checkbox
                      id={`event-${event.value}`}
                      checked={selectedEvents.has(event.value)}
                      onCheckedChange={() => handleToggleEvent(event.value)}
                      className="mt-1"
                    />
                    <div className="flex-1">
                      <Label
                        htmlFor={`event-${event.value}`}
                        className="font-medium cursor-pointer"
                      >
                        {event.label}
                      </Label>
                      <p className="text-xs text-muted-foreground mt-1">
                        {event.description}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Test Result */}
            {lastTestResult && (
              <div className={`p-4 rounded-lg border ${
                lastTestResult.success
                  ? 'bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800'
                  : 'bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800'
              }`}>
                <div className="flex items-center gap-2">
                  {lastTestResult.success ? (
                    <CheckCircle2 className="h-5 w-5 text-green-600" />
                  ) : (
                    <XCircle className="h-5 w-5 text-red-600" />
                  )}
                  <div className="flex-1">
                    <p className={`font-medium ${
                      lastTestResult.success ? 'text-green-900 dark:text-green-100' : 'text-red-900 dark:text-red-100'
                    }`}>
                      {lastTestResult.success ? 'Test Successful' : 'Test Failed'}
                    </p>
                    <p className={`text-sm ${
                      lastTestResult.success ? 'text-green-700 dark:text-green-300' : 'text-red-700 dark:text-red-300'
                    }`}>
                      {lastTestResult.message}
                    </p>
                    {lastTestResult.timestamp && (
                      <p className="text-xs text-muted-foreground mt-1">
                        {lastTestResult.timestamp.toLocaleString()}
                      </p>
                    )}
                  </div>
                </div>
              </div>
            )}

            {/* Actions */}
            <div className="flex gap-4 pt-4 border-t">
              <Button
                variant="outline"
                onClick={handleTest}
                disabled={isTesting || !webhookUrl.trim()}
              >
                {isTesting ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Testing...
                  </>
                ) : (
                  <>
                    <TestTube className="h-4 w-4 mr-2" />
                    Test Webhook
                  </>
                )}
              </Button>
              <Button
                onClick={handleSave}
                disabled={isSaving || !webhookUrl.trim() || selectedEvents.size === 0}
                className="ml-auto"
              >
                {isSaving ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Saving...
                  </>
                ) : (
                  <>
                    <Save className="h-4 w-4 mr-2" />
                    Save Configuration
                  </>
                )}
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Documentation */}
        <Card className="mt-6">
          <CardHeader>
            <CardTitle>Webhook Documentation</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <h3 className="font-semibold mb-2">Webhook Payload Format</h3>
              <pre className="bg-muted p-4 rounded-lg text-sm overflow-x-auto">
{`{
  "event": "order.status",
  "timestamp": "2024-01-01T00:00:00Z",
  "data": {
    "orderNo": "ORDER123",
    "orderStatus": "COMPLETED",
    ...
  }
}`}
              </pre>
            </div>
            <div>
              <h3 className="font-semibold mb-2">Verification</h3>
              <p className="text-sm text-muted-foreground">
                If you set a webhook secret, verify requests using the X-Webhook-Signature header.
                The signature is an HMAC-SHA256 hash of the request body using your secret.
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

