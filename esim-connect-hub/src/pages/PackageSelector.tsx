import { useState, useMemo, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { usePackages } from "@/hooks/usePackages";
import { PackageCard } from "@/components/shared/PackageCard";
import { apiClient } from "@/lib/api";
import { useToast } from "@/hooks/use-toast";
import { getCountryName } from "@/lib/countries";
import { 
  Search, Globe, Loader2, 
  ArrowLeft, ArrowRight, Package as PackageIcon,
  CheckSquare, Square
} from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

export default function PackageSelector() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [selectedPackages, setSelectedPackages] = useState<Set<string>>(new Set());
  const [searchQuery, setSearchQuery] = useState("");
  const [locationFilter, setLocationFilter] = useState<string>("");
  const [typeFilter, setTypeFilter] = useState<'BASE' | 'TOPUP' | ''>('BASE');
  const [isSaving, setIsSaving] = useState(false);
  const [isLoadingStore, setIsLoadingStore] = useState(true);

  // Load existing selected packages from store
  useEffect(() => {
    const loadStorePackages = async () => {
      try {
        const storeId = localStorage.getItem("current_store_id");
        if (!storeId) {
          setIsLoadingStore(false);
          return;
        }

        const store = await apiClient.getStore(storeId);
        if (store?.selectedPackages && Array.isArray(store.selectedPackages)) {
          // Initialize selectedPackages with existing selections
          setSelectedPackages(new Set(store.selectedPackages));
        }
      } catch (error: any) {
        console.error("Failed to load store packages:", error);
        // Don't show error toast - user might be creating a new store
      } finally {
        setIsLoadingStore(false);
      }
    };

    loadStorePackages();
  }, []);

  // Get unique locations for filter
  const { packages: allPackages, isLoading } = usePackages({
    type: typeFilter || undefined,
  });

  const locations = useMemo(() => {
    const locationSet = new Set(allPackages.map(pkg => pkg.locationCode));
    return Array.from(locationSet).sort((a, b) => {
      const nameA = getCountryName(a);
      const nameB = getCountryName(b);
      return nameA.localeCompare(nameB);
    });
  }, [allPackages]);

  // Filter packages based on search and location
  const { packages, isLoading: isLoadingFiltered, error } = usePackages({
    locationCode: locationFilter || undefined,
    type: typeFilter || undefined,
    searchQuery: searchQuery || undefined,
  });

  const handleTogglePackage = (packageSlug: string) => {
    setSelectedPackages(prev => {
      const newSet = new Set(prev);
      if (newSet.has(packageSlug)) {
        newSet.delete(packageSlug);
      } else {
        newSet.add(packageSlug);
      }
      return newSet;
    });
  };

  const handleSelectAll = () => {
    setSelectedPackages(new Set(packages.map(pkg => pkg.slug)));
  };

  const handleDeselectAll = () => {
    setSelectedPackages(new Set());
  };

  const handleSelectAllByLocation = (locationCode: string) => {
    const packagesInLocation = packages.filter(pkg => pkg.locationCode === locationCode);
    setSelectedPackages(prev => {
      const newSet = new Set(prev);
      packagesInLocation.forEach(pkg => newSet.add(pkg.slug));
      return newSet;
    });
  };

  const handleDeselectAllByLocation = (locationCode: string) => {
    const packagesInLocation = packages.filter(pkg => pkg.locationCode === locationCode);
    setSelectedPackages(prev => {
      const newSet = new Set(prev);
      packagesInLocation.forEach(pkg => newSet.delete(pkg.slug));
      return newSet;
    });
  };

  const handleSave = async () => {
    if (selectedPackages.size === 0) {
      toast({
        title: "No packages selected",
        description: "Please select at least one package to continue.",
        variant: "destructive",
      });
      return;
    }

    setIsSaving(true);
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

      // Update store with selected packages
      await apiClient.updateStore(storeId, {
        selectedPackages: Array.from(selectedPackages),
      });

      toast({
        title: "Success",
        description: `${selectedPackages.size} package(s) selected and saved.`,
      });

      navigate("/store-preview");
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to save package selection",
        variant: "destructive",
      });
    } finally {
      setIsSaving(false);
    }
  };

  // Group packages by location and sort alphabetically by country name
  const packagesByLocation = useMemo(() => {
    const grouped: Record<string, typeof packages> = {};
    packages.forEach(pkg => {
      if (!grouped[pkg.locationCode]) {
        grouped[pkg.locationCode] = [];
      }
      grouped[pkg.locationCode].push(pkg);
    });
    
    // Sort locations alphabetically by country name
    const sortedEntries = Object.entries(grouped).sort(([codeA], [codeB]) => {
      const nameA = getCountryName(codeA);
      const nameB = getCountryName(codeB);
      return nameA.localeCompare(nameB);
    });
    
    return Object.fromEntries(sortedEntries);
  }, [packages]);

  return (
    <TooltipProvider>
      <div className="min-h-screen bg-background">
        <div className="container mx-auto px-4 py-6 max-w-7xl pb-24">
          {/* Header */}
          <div className="mb-6">
            <div className="flex items-center justify-between mb-4">
              <Button
                variant="ghost"
                onClick={() => navigate(-1)}
                size="sm"
              >
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back
              </Button>
              {selectedPackages.size > 0 && (
                <Badge variant="secondary" className="text-sm px-3 py-1">
                  {selectedPackages.size} selected
                </Badge>
              )}
            </div>
            <div className="flex items-center justify-between mb-4">
              <div>
                <h1 className="text-3xl font-bold mb-1">Select Packages</h1>
                <p className="text-sm text-muted-foreground">
                  Choose which eSIM packages you want to sell in your store
                </p>
              </div>
              {packages.length > 0 && (
                <div className="flex gap-2">
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={handleSelectAll}
                      >
                        <CheckSquare className="h-4 w-4 mr-2" />
                        Select All
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent>Select all packages</TooltipContent>
                  </Tooltip>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={handleDeselectAll}
                      >
                        <Square className="h-4 w-4 mr-2" />
                        Deselect All
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent>Deselect all packages</TooltipContent>
                  </Tooltip>
                </div>
              )}
            </div>

            {/* Compact Filter Bar */}
            <div className="flex flex-wrap items-center gap-3 py-3 border-b">
              <div className="relative flex-1 min-w-[200px]">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search packages..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-9 h-9"
                />
              </div>
              <Tooltip>
                <TooltipTrigger asChild>
                  <div className="min-w-[180px]">
                    <Select 
                      value={locationFilter || undefined} 
                      onValueChange={(val) => setLocationFilter(val === "all" ? "" : val)}
                    >
                      <SelectTrigger className="h-9">
                        <Globe className="h-4 w-4 mr-2 text-muted-foreground" />
                        <SelectValue placeholder="All locations" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All locations</SelectItem>
                        {locations.map(loc => (
                          <SelectItem key={loc} value={loc}>
                            {getCountryName(loc)} ({loc})
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </TooltipTrigger>
                <TooltipContent>Filter by location</TooltipContent>
              </Tooltip>
              <Tooltip>
                <TooltipTrigger asChild>
                  <div className="min-w-[140px]">
                    <Select 
                      value={typeFilter || undefined} 
                      onValueChange={(val) => setTypeFilter(val === "all" ? "" : val as any)}
                    >
                      <SelectTrigger className="h-9">
                        <PackageIcon className="h-4 w-4 mr-2 text-muted-foreground" />
                        <SelectValue placeholder="All Types" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="BASE">Base Plans</SelectItem>
                        <SelectItem value="TOPUP">Top-Up Plans</SelectItem>
                        <SelectItem value="all">All Types</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </TooltipTrigger>
                <TooltipContent>Filter by package type</TooltipContent>
              </Tooltip>
            </div>
          </div>


          {/* Packages List */}
          {isLoading || isLoadingFiltered ? (
            <div className="text-center py-12">
              <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4" />
              <p className="text-muted-foreground">Loading packages...</p>
            </div>
          ) : packages.length === 0 ? (
            <Card>
              <CardContent className="pt-6 text-center py-12">
                <PackageIcon className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <p className="text-muted-foreground">No packages found</p>
                <p className="text-sm text-muted-foreground mt-2">
                  {error ? error : "Try adjusting your filters or search query."}
                </p>
                {error && error.includes("API key") && (
                  <Button 
                    variant="outline" 
                    className="mt-4"
                    onClick={() => navigate("/settings")}
                  >
                    Go to Settings
                  </Button>
                )}
              </CardContent>
            </Card>
          ) : (
            <Accordion type="multiple" className="space-y-2" defaultValue={Object.keys(packagesByLocation).slice(0, 3)}>
              {Object.entries(packagesByLocation).map(([locationCode, locationPackages]) => {
                const selectedInLocation = locationPackages.filter(pkg => selectedPackages.has(pkg.slug)).length;
                return (
                  <AccordionItem key={locationCode} value={locationCode} className="border rounded-lg bg-card">
                    <div className="flex items-center justify-between px-4 py-3">
                      <AccordionTrigger className="hover:no-underline flex-1">
                        <div className="flex items-center gap-3">
                          <Globe className="h-4 w-4 text-muted-foreground shrink-0" />
                          <h2 className="text-lg font-semibold">{getCountryName(locationCode)}</h2>
                          <Badge variant="secondary" className="text-xs">
                            {locationPackages.length} {locationPackages.length === 1 ? 'package' : 'packages'}
                          </Badge>
                          {selectedInLocation > 0 && (
                            <Badge variant="default" className="text-xs">
                              {selectedInLocation} selected
                            </Badge>
                          )}
                        </div>
                      </AccordionTrigger>
                      <div className="flex gap-2 ml-4">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleSelectAllByLocation(locationCode)}
                          className="h-7 text-xs"
                        >
                          Select All
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleDeselectAllByLocation(locationCode)}
                          className="h-7 text-xs"
                        >
                          Deselect All
                        </Button>
                      </div>
                    </div>
                    <AccordionContent className="pt-2 pb-4 px-4">
                      <div className="grid md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3">
                        {locationPackages.map((pkg) => (
                          <PackageCard
                            key={pkg.slug}
                            package={pkg}
                            isSelected={selectedPackages.has(pkg.slug)}
                            onSelect={() => handleTogglePackage(pkg.slug)}
                          />
                        ))}
                      </div>
                    </AccordionContent>
                  </AccordionItem>
                );
              })}
            </Accordion>
          )}

          {/* Save Button (sticky at bottom) */}
          {selectedPackages.size > 0 && (
            <div className="fixed bottom-0 left-0 right-0 bg-background/95 backdrop-blur-md border-t p-4 shadow-2xl z-50">
              <div className="container mx-auto max-w-7xl flex items-center justify-between px-4">
                <div className="flex items-center gap-3">
                  <Badge variant="default" className="text-sm px-3 py-1">
                    {selectedPackages.size} package{selectedPackages.size !== 1 ? 's' : ''} selected
                  </Badge>
                </div>
                <Button onClick={handleSave} disabled={isSaving} size="lg" className="shadow-lg">
                  {isSaving ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Saving...
                    </>
                  ) : (
                    <>
                      Save & Continue
                      <ArrowRight className="h-4 w-4 ml-2" />
                    </>
                  )}
                </Button>
              </div>
            </div>
          )}
        </div>
      </div>
    </TooltipProvider>
  );
}





