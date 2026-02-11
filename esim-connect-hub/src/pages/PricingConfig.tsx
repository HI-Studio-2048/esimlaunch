import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { apiClient } from "@/lib/api";
import { useToast } from "@/hooks/use-toast";
import { ArrowLeft, Save, Calculator, DollarSign, Loader2 } from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

export default function PricingConfig() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [store, setStore] = useState<any>(null);
  
  // Pricing configuration state
  const [globalMarkupType, setGlobalMarkupType] = useState<"percentage" | "fixed">("percentage");
  const [globalMarkupValue, setGlobalMarkupValue] = useState<string>("0");
  const [countryMarkups, setCountryMarkups] = useState<Record<string, { type: "percentage" | "fixed"; value: string }>>({});
  const [packageMarkups, setPackageMarkups] = useState<Record<string, { type: "percentage" | "fixed"; value: string }>>({});

  useEffect(() => {
    const loadStore = async () => {
      try {
        const storeId = localStorage.getItem("current_store_id");
        if (!storeId) {
          toast({
            title: "Error",
            description: "No store found. Please create a store first.",
            variant: "destructive",
          });
          navigate("/onboarding");
          return;
        }

        const storeData = await apiClient.getStore(storeId);
        setStore(storeData);

        // Load existing pricing markup configuration
        if (storeData.pricingMarkup) {
          const markup = storeData.pricingMarkup as any;
          if (markup.global) {
            setGlobalMarkupType(markup.global.type || "percentage");
            setGlobalMarkupValue(String(markup.global.value || 0));
          }
          if (markup.countries) {
            setCountryMarkups(markup.countries);
          }
          if (markup.packages) {
            setPackageMarkups(markup.packages);
          }
        }
      } catch (error: any) {
        toast({
          title: "Error",
          description: error.message || "Failed to load store configuration",
          variant: "destructive",
        });
      } finally {
        setIsLoading(false);
      }
    };

    loadStore();
  }, [navigate, toast]);

  const calculatePrice = (basePrice: number, markupType: "percentage" | "fixed", markupValue: string) => {
    const value = parseFloat(markupValue) || 0;
    if (markupType === "percentage") {
      return basePrice * (1 + value / 100);
    } else {
      return basePrice + value;
    }
  };

  const handleSave = async () => {
    setIsSaving(true);
    try {
      const storeId = localStorage.getItem("current_store_id");
      if (!storeId) {
        throw new Error("No store ID found");
      }

      const pricingMarkup = {
        global: {
          type: globalMarkupType,
          value: parseFloat(globalMarkupValue) || 0,
        },
        countries: countryMarkups,
        packages: packageMarkups,
      };

      await apiClient.updateStore(storeId, {
        pricingMarkup,
      });

      toast({
        title: "Success",
        description: "Pricing configuration saved successfully.",
      });

      navigate("/store-preview");
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to save pricing configuration",
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
      <div className="container mx-auto px-4 py-8 max-w-6xl">
        <div className="mb-8">
          <Button
            variant="ghost"
            onClick={() => navigate(-1)}
            className="mb-4"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back
          </Button>
          <h1 className="text-3xl font-bold mb-2">Pricing Configuration</h1>
          <p className="text-muted-foreground">
            Configure how you want to markup eSIM package prices. You can set global, country-specific, or package-specific markups.
          </p>
        </div>

        <Tabs defaultValue="global" className="space-y-6">
          <TabsList>
            <TabsTrigger value="global">Global Markup</TabsTrigger>
            <TabsTrigger value="country">Country-Specific</TabsTrigger>
            <TabsTrigger value="package">Package-Specific</TabsTrigger>
            <TabsTrigger value="preview">Preview</TabsTrigger>
          </TabsList>

          {/* Global Markup */}
          <TabsContent value="global">
            <Card>
              <CardHeader>
                <CardTitle>Global Markup Settings</CardTitle>
                <CardDescription>
                  Apply a markup to all packages. This will be the default markup unless overridden by country or package-specific settings.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="space-y-2">
                  <Label>Markup Type</Label>
                  <Select value={globalMarkupType} onValueChange={(val: any) => setGlobalMarkupType(val)}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="percentage">Percentage (%)</SelectItem>
                      <SelectItem value="fixed">Fixed Amount ($)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label>
                    Markup Value {globalMarkupType === "percentage" ? "(%)" : "($)"}
                  </Label>
                  <Input
                    type="number"
                    value={globalMarkupValue}
                    onChange={(e) => setGlobalMarkupValue(e.target.value)}
                    placeholder={globalMarkupType === "percentage" ? "10" : "5.00"}
                    step={globalMarkupType === "percentage" ? "0.1" : "0.01"}
                  />
                </div>

                <div className="bg-muted p-4 rounded-lg">
                  <div className="flex items-center gap-2 mb-2">
                    <Calculator className="h-4 w-4" />
                    <span className="font-medium">Example Calculation</span>
                  </div>
                  <div className="space-y-1 text-sm">
                    <p>Base Price: $10.00</p>
                    <p>
                      {globalMarkupType === "percentage" ? (
                        <>Markup ({globalMarkupValue || 0}%): ${((10 * parseFloat(globalMarkupValue || "0")) / 100).toFixed(2)}</>
                      ) : (
                        <>Markup (${globalMarkupValue || "0.00"}): ${globalMarkupValue || "0.00"}</>
                      )}
                    </p>
                    <p className="font-bold text-lg">
                      Final Price: ${calculatePrice(10, globalMarkupType, globalMarkupValue).toFixed(2)}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Country-Specific Markup */}
          <TabsContent value="country">
            <Card>
              <CardHeader>
                <CardTitle>Country-Specific Markup</CardTitle>
                <CardDescription>
                  Set different markups for specific countries. These will override the global markup.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <p className="text-sm text-muted-foreground">
                    Country-specific markup configuration will be available after you select packages in your store.
                  </p>
                  <Button
                    variant="outline"
                    onClick={() => navigate("/package-selector")}
                  >
                    Select Packages First
                  </Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Package-Specific Markup */}
          <TabsContent value="package">
            <Card>
              <CardHeader>
                <CardTitle>Package-Specific Markup</CardTitle>
                <CardDescription>
                  Set different markups for specific packages. These will override both global and country markups.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <p className="text-sm text-muted-foreground">
                    Package-specific markup configuration will be available after you select packages in your store.
                  </p>
                  <Button
                    variant="outline"
                    onClick={() => navigate("/package-selector")}
                  >
                    Select Packages First
                  </Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Preview */}
          <TabsContent value="preview">
            <Card>
              <CardHeader>
                <CardTitle>Pricing Preview</CardTitle>
                <CardDescription>
                  See how your markup configuration affects package prices.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="bg-muted p-4 rounded-lg">
                    <p className="text-sm text-muted-foreground mb-2">Global Markup Applied:</p>
                    <p className="font-medium">
                      {globalMarkupType === "percentage" ? (
                        <>+{globalMarkupValue || 0}%</>
                      ) : (
                        <>+${globalMarkupValue || "0.00"}</>
                      )}
                    </p>
                  </div>
                  <p className="text-sm text-muted-foreground">
                    Preview will show actual package prices once packages are selected.
                  </p>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        {/* Save Button */}
        <div className="mt-6 flex justify-end gap-4">
          <Button variant="outline" onClick={() => navigate(-1)}>
            Cancel
          </Button>
          <Button onClick={handleSave} disabled={isSaving}>
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
      </div>
    </div>
  );
}


