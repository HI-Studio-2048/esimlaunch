import { useState, useEffect } from "react";
import { useParams } from "react-router-dom";
import { motion } from "framer-motion";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { Loader2, CheckCircle2 } from "lucide-react";
import { CurrencySelector } from "@/components/shared/CurrencySelector";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import { apiClient } from "@/lib/api";

export default function CurrencySettings() {
  const { storeId } = useParams<{ storeId: string }>();
  const { toast } = useToast();
  const [currencies, setCurrencies] = useState<any[]>([]);
  const [defaultCurrency, setDefaultCurrency] = useState('USD');
  const [supportedCurrencies, setSupportedCurrencies] = useState<string[]>(['USD']);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    if (storeId) {
      loadSettings();
    }
    loadCurrencies();
  }, [storeId]);

  const loadCurrencies = async () => {
    try {
      const result = await apiClient.getAvailableCurrencies();
      setCurrencies(result);
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to load currencies",
        variant: "destructive",
      });
    }
  };

  const loadSettings = async () => {
    if (!storeId) return;
    setIsLoading(true);
    try {
      const settings = await apiClient.getStoreCurrency(storeId);
      setDefaultCurrency(settings.default);
      setSupportedCurrencies(settings.supported);
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to load currency settings",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleToggleCurrency = (currencyCode: string) => {
    if (supportedCurrencies.includes(currencyCode)) {
      // Don't allow removing the default currency
      if (currencyCode === defaultCurrency) {
        toast({
          title: "Error",
          description: "Cannot remove the default currency. Please set a different default first.",
          variant: "destructive",
        });
        return;
      }
      setSupportedCurrencies(supportedCurrencies.filter(c => c !== currencyCode));
    } else {
      setSupportedCurrencies([...supportedCurrencies, currencyCode]);
    }
  };

  const handleSave = async () => {
    if (!storeId) return;
    if (supportedCurrencies.length === 0) {
      toast({
        title: "Error",
        description: "At least one currency must be supported",
        variant: "destructive",
      });
      return;
    }

    setIsSaving(true);
    try {
      await apiClient.updateStoreCurrency(storeId, defaultCurrency, supportedCurrencies);
      toast({
        title: "Success",
        description: "Currency settings updated successfully",
      });
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to update currency settings",
        variant: "destructive",
      });
    } finally {
      setIsSaving(false);
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
        >
          <Card>
            <CardHeader>
              <CardTitle>Currency Settings</CardTitle>
              <CardDescription>
                Configure which currencies your store accepts and set the default currency
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Default Currency */}
              <div className="space-y-2">
                <Label>Default Currency</Label>
                <CurrencySelector
                  value={defaultCurrency}
                  onChange={(currency) => {
                    setDefaultCurrency(currency);
                    // Ensure default is in supported list
                    if (!supportedCurrencies.includes(currency)) {
                      setSupportedCurrencies([...supportedCurrencies, currency]);
                    }
                  }}
                />
                <p className="text-sm text-muted-foreground">
                  This is the currency used by default for your store. Prices will be displayed in this currency unless the customer selects a different one.
                </p>
              </div>

              {/* Supported Currencies */}
              <div className="space-y-2">
                <Label>Supported Currencies</Label>
                <p className="text-sm text-muted-foreground mb-4">
                  Select which currencies customers can use to view prices. At least one currency must be selected.
                </p>
                <div className="grid md:grid-cols-2 gap-3 border rounded-lg p-4">
                  {currencies.map((currency) => (
                    <div
                      key={currency.code}
                      className="flex items-center space-x-2 p-2 rounded hover:bg-muted"
                    >
                      <Checkbox
                        id={`currency-${currency.code}`}
                        checked={supportedCurrencies.includes(currency.code)}
                        onCheckedChange={() => handleToggleCurrency(currency.code)}
                        disabled={currency.code === defaultCurrency}
                      />
                      <Label
                        htmlFor={`currency-${currency.code}`}
                        className="flex-1 cursor-pointer flex items-center gap-2"
                      >
                        <span className="font-medium">{currency.symbol}</span>
                        <span>{currency.code}</span>
                        <span className="text-muted-foreground text-sm">- {currency.name}</span>
                        {currency.code === defaultCurrency && (
                          <Badge variant="outline" className="ml-auto">Default</Badge>
                        )}
                      </Label>
                    </div>
                  ))}
                </div>
              </div>

              <Button
                onClick={handleSave}
                disabled={isSaving || supportedCurrencies.length === 0}
                className="w-full"
              >
                {isSaving ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Saving...
                  </>
                ) : (
                  <>
                    <CheckCircle2 className="h-4 w-4 mr-2" />
                    Save Settings
                  </>
                )}
              </Button>
            </CardContent>
          </Card>
        </motion.div>
      </div>
    </div>
  );
}

