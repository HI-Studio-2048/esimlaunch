import { useState, useEffect, useMemo } from "react";
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
import { usePackages } from "@/hooks/usePackages";
import { getCountryName } from "@/lib/countries";
import { ArrowLeft, Save, Calculator, DollarSign, Loader2, Wifi } from "lucide-react";
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
  const [dataSizeMarkups, setDataSizeMarkups] = useState<Record<string, { type: "percentage" | "fixed"; value: string }>>({});

  // Check if packages are selected
  const hasSelectedPackages = store?.selectedPackages && Array.isArray(store.selectedPackages) && store.selectedPackages.length > 0;

  // Fetch package details to get data sizes and countries
  const { packages: allPackages } = usePackages({});
  
  // Get selected package details
  const selectedPackageDetails = useMemo(() => {
    if (!hasSelectedPackages || !allPackages) return [];
    return allPackages.filter(pkg => store.selectedPackages.includes(pkg.slug));
  }, [hasSelectedPackages, allPackages, store?.selectedPackages]);

  // Group packages by country
  const packagesByCountry = useMemo(() => {
    const grouped: Record<string, typeof selectedPackageDetails> = {};
    selectedPackageDetails.forEach(pkg => {
      if (!grouped[pkg.locationCode]) {
        grouped[pkg.locationCode] = [];
      }
      grouped[pkg.locationCode].push(pkg);
    });
    return grouped;
  }, [selectedPackageDetails]);

  // Group packages by data size (in GB)
  const packagesByDataSize = useMemo(() => {
    const grouped: Record<string, typeof selectedPackageDetails> = {};
    selectedPackageDetails.forEach(pkg => {
      const dataGB = (pkg.volume / (1024 * 1024 * 1024)).toFixed(1);
      if (!grouped[dataGB]) {
        grouped[dataGB] = [];
      }
      grouped[dataGB].push(pkg);
    });
    return grouped;
  }, [selectedPackageDetails]);

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
          if (markup.dataSizes) {
            setDataSizeMarkups(markup.dataSizes);
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
        dataSizes: dataSizeMarkups,
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
            <TabsTrigger value="dataSize">Data Size-Specific</TabsTrigger>
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
                {!hasSelectedPackages ? (
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
                ) : (
                  <div className="space-y-4">
                    <p className="text-sm text-muted-foreground mb-4">
                      Configure markups for countries where you have selected packages. Country-specific markups will override the global markup.
                    </p>
                    <div className="space-y-3">
                      {Object.entries(packagesByCountry).map(([countryCode, countryPackages]) => (
                        <div key={countryCode} className="flex items-center justify-between p-3 border rounded-lg">
                          <div className="flex-1">
                            <p className="font-medium text-sm">{getCountryName(countryCode)}</p>
                            <p className="text-xs text-muted-foreground">
                              {countryPackages.length} package{countryPackages.length !== 1 ? 's' : ''}
                            </p>
                          </div>
                          <div className="flex items-center gap-3">
                            <Select
                              value={countryMarkups[countryCode]?.type || "percentage"}
                              onValueChange={(val: "percentage" | "fixed") => {
                                setCountryMarkups(prev => ({
                                  ...prev,
                                  [countryCode]: {
                                    ...prev[countryCode],
                                    type: val,
                                    value: prev[countryCode]?.value || "0",
                                  },
                                }));
                              }}
                            >
                              <SelectTrigger className="w-32">
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="percentage">Percentage</SelectItem>
                                <SelectItem value="fixed">Fixed</SelectItem>
                              </SelectContent>
                            </Select>
                            <Input
                              type="number"
                              value={countryMarkups[countryCode]?.value || "0"}
                              onChange={(e) => {
                                setCountryMarkups(prev => ({
                                  ...prev,
                                  [countryCode]: {
                                    ...prev[countryCode],
                                    type: prev[countryCode]?.type || "percentage",
                                    value: e.target.value,
                                  },
                                }));
                              }}
                              placeholder={countryMarkups[countryCode]?.type === "fixed" ? "5.00" : "10"}
                              step={countryMarkups[countryCode]?.type === "fixed" ? "0.01" : "0.1"}
                              className="w-24"
                            />
                            <span className="text-sm text-muted-foreground w-8">
                              {countryMarkups[countryCode]?.type === "fixed" ? "$" : "%"}
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Data Size-Specific Markup */}
          <TabsContent value="dataSize">
            <Card>
              <CardHeader>
                <CardTitle>Data Size-Specific Markup</CardTitle>
                <CardDescription>
                  Set different markups based on data size (e.g., 1GB, 3GB, 5GB). These will override global and country markups.
                </CardDescription>
              </CardHeader>
              <CardContent>
                {!hasSelectedPackages ? (
                  <div className="space-y-4">
                    <p className="text-sm text-muted-foreground">
                      Data size-specific markup configuration will be available after you select packages in your store.
                    </p>
                    <Button
                      variant="outline"
                      onClick={() => navigate("/package-selector")}
                    >
                      Select Packages First
                    </Button>
                  </div>
                ) : (
                  <div className="space-y-4">
                    <p className="text-sm text-muted-foreground mb-4">
                      Configure markups for different data sizes. Data size-specific markups override global and country markups, but can be overridden by package-specific markups.
                    </p>
                    <div className="space-y-3">
                      {Object.entries(packagesByDataSize)
                        .sort(([sizeA], [sizeB]) => parseFloat(sizeA) - parseFloat(sizeB))
                        .map(([dataSizeGB, sizePackages]) => (
                        <div key={dataSizeGB} className="flex items-center justify-between p-3 border rounded-lg">
                          <div className="flex items-center gap-3 flex-1">
                            <Wifi className="h-4 w-4 text-muted-foreground" />
                            <div>
                              <p className="font-medium text-sm">{dataSizeGB} GB</p>
                              <p className="text-xs text-muted-foreground">
                                {sizePackages.length} package{sizePackages.length !== 1 ? 's' : ''}
                              </p>
                            </div>
                          </div>
                          <div className="flex items-center gap-3">
                            <Select
                              value={dataSizeMarkups[dataSizeGB]?.type || "percentage"}
                              onValueChange={(val: "percentage" | "fixed") => {
                                setDataSizeMarkups(prev => ({
                                  ...prev,
                                  [dataSizeGB]: {
                                    ...prev[dataSizeGB],
                                    type: val,
                                    value: prev[dataSizeGB]?.value || "0",
                                  },
                                }));
                              }}
                            >
                              <SelectTrigger className="w-32">
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="percentage">Percentage</SelectItem>
                                <SelectItem value="fixed">Fixed</SelectItem>
                              </SelectContent>
                            </Select>
                            <Input
                              type="number"
                              value={dataSizeMarkups[dataSizeGB]?.value || "0"}
                              onChange={(e) => {
                                setDataSizeMarkups(prev => ({
                                  ...prev,
                                  [dataSizeGB]: {
                                    ...prev[dataSizeGB],
                                    type: prev[dataSizeGB]?.type || "percentage",
                                    value: e.target.value,
                                  },
                                }));
                              }}
                              placeholder={dataSizeMarkups[dataSizeGB]?.type === "fixed" ? "5.00" : "10"}
                              step={dataSizeMarkups[dataSizeGB]?.type === "fixed" ? "0.01" : "0.1"}
                              className="w-24"
                            />
                            <span className="text-sm text-muted-foreground w-8">
                              {dataSizeMarkups[dataSizeGB]?.type === "fixed" ? "$" : "%"}
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
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
                {!hasSelectedPackages ? (
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
                ) : (
                  <div className="space-y-4">
                    <p className="text-sm text-muted-foreground mb-4">
                      Configure individual markups for each selected package. Package-specific markups override both global and country markups.
                    </p>
                    <div className="space-y-3">
                      {store.selectedPackages.map((packageSlug: string) => (
                        <div key={packageSlug} className="flex items-center justify-between p-3 border rounded-lg">
                          <div className="flex-1">
                            <p className="font-medium text-sm">{packageSlug}</p>
                            <p className="text-xs text-muted-foreground">Package slug</p>
                          </div>
                          <div className="flex items-center gap-3">
                            <Select
                              value={packageMarkups[packageSlug]?.type || "percentage"}
                              onValueChange={(val: "percentage" | "fixed") => {
                                setPackageMarkups(prev => ({
                                  ...prev,
                                  [packageSlug]: {
                                    ...prev[packageSlug],
                                    type: val,
                                    value: prev[packageSlug]?.value || "0",
                                  },
                                }));
                              }}
                            >
                              <SelectTrigger className="w-32">
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="percentage">Percentage</SelectItem>
                                <SelectItem value="fixed">Fixed</SelectItem>
                              </SelectContent>
                            </Select>
                            <Input
                              type="number"
                              value={packageMarkups[packageSlug]?.value || "0"}
                              onChange={(e) => {
                                setPackageMarkups(prev => ({
                                  ...prev,
                                  [packageSlug]: {
                                    ...prev[packageSlug],
                                    type: prev[packageSlug]?.type || "percentage",
                                    value: e.target.value,
                                  },
                                }));
                              }}
                              placeholder={packageMarkups[packageSlug]?.type === "fixed" ? "5.00" : "10"}
                              step={packageMarkups[packageSlug]?.type === "fixed" ? "0.01" : "0.1"}
                              className="w-24"
                            />
                            <span className="text-sm text-muted-foreground w-8">
                              {packageMarkups[packageSlug]?.type === "fixed" ? "$" : "%"}
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
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





