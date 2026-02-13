import { useState, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { usePackages } from "@/hooks/usePackages";
import { PackageCard } from "@/components/shared/PackageCard";
import { apiClient } from "@/lib/api";
import { useToast } from "@/hooks/use-toast";
import { 
  Search, Filter, Globe, CheckCircle2, Loader2, 
  ArrowLeft, ArrowRight, Package as PackageIcon
} from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

export default function PackageSelector() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [selectedPackages, setSelectedPackages] = useState<Set<string>>(new Set());
  const [searchQuery, setSearchQuery] = useState("");
  const [locationFilter, setLocationFilter] = useState<string>("");
  const [typeFilter, setTypeFilter] = useState<'BASE' | 'TOPUP' | ''>('BASE');
  const [isSaving, setIsSaving] = useState(false);

  // Get unique locations for filter
  const { packages: allPackages, isLoading } = usePackages({
    type: typeFilter || undefined,
  });

  const locations = useMemo(() => {
    const locationSet = new Set(allPackages.map(pkg => pkg.locationCode));
    return Array.from(locationSet).sort();
  }, [allPackages]);

  // Filter packages based on search and location
  const { packages, isLoading: isLoadingFiltered } = usePackages({
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

  // Group packages by location
  const packagesByLocation = useMemo(() => {
    const grouped: Record<string, typeof packages> = {};
    packages.forEach(pkg => {
      if (!grouped[pkg.locationCode]) {
        grouped[pkg.locationCode] = [];
      }
      grouped[pkg.locationCode].push(pkg);
    });
    return grouped;
  }, [packages]);

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-8 max-w-7xl">
        {/* Header */}
        <div className="mb-8">
          <Button
            variant="ghost"
            onClick={() => navigate(-1)}
            className="mb-4"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back
          </Button>
          <h1 className="text-3xl font-bold mb-2">Select Packages for Your Store</h1>
          <p className="text-muted-foreground">
            Choose which eSIM packages you want to sell in your store. You can filter by location and search for specific packages.
          </p>
        </div>

        {/* Filters */}
        <Card className="mb-6">
          <CardContent className="pt-6">
            <div className="grid md:grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label>Search Packages</Label>
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Search by name, location..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-9"
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label>Filter by Location</Label>
                <Select value={locationFilter} onValueChange={setLocationFilter}>
                  <SelectTrigger>
                    <SelectValue placeholder="All locations" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="">All locations</SelectItem>
                    {locations.map(loc => (
                      <SelectItem key={loc} value={loc}>{loc}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Package Type</Label>
                <Select value={typeFilter} onValueChange={(val) => setTypeFilter(val as any)}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="BASE">Base Plans</SelectItem>
                    <SelectItem value="TOPUP">Top-Up Plans</SelectItem>
                    <SelectItem value="">All Types</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Selection Summary */}
        {selectedPackages.size > 0 && (
          <Card className="mb-6 bg-primary/5 border-primary/20">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="h-5 w-5 text-primary" />
                  <span className="font-medium">
                    {selectedPackages.size} package{selectedPackages.size !== 1 ? 's' : ''} selected
                  </span>
                </div>
                <Button onClick={handleSave} disabled={isSaving}>
                  {isSaving ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Saving...
                    </>
                  ) : (
                    <>
                      Save Selection
                      <ArrowRight className="h-4 w-4 ml-2" />
                    </>
                  )}
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

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
                Try adjusting your filters or search query.
              </p>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-6">
            {Object.entries(packagesByLocation).map(([locationCode, locationPackages]) => (
              <div key={locationCode}>
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <Globe className="h-5 w-5 text-muted-foreground" />
                    <h2 className="text-xl font-bold">{locationPackages[0]?.location || locationCode}</h2>
                    <Badge variant="secondary">{locationPackages.length} packages</Badge>
                  </div>
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleSelectAllByLocation(locationCode)}
                    >
                      Select All
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleDeselectAllByLocation(locationCode)}
                    >
                      Deselect All
                    </Button>
                  </div>
                </div>
                <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {locationPackages.map((pkg) => (
                    <PackageCard
                      key={pkg.slug}
                      package={pkg}
                      isSelected={selectedPackages.has(pkg.slug)}
                      onSelect={() => handleTogglePackage(pkg.slug)}
                    />
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Save Button (sticky at bottom) */}
        {selectedPackages.size > 0 && (
          <div className="fixed bottom-0 left-0 right-0 bg-background border-t p-4 shadow-lg">
            <div className="container mx-auto max-w-7xl flex items-center justify-between">
              <span className="text-sm text-muted-foreground">
                {selectedPackages.size} package{selectedPackages.size !== 1 ? 's' : ''} selected
              </span>
              <Button onClick={handleSave} disabled={isSaving} size="lg">
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
  );
}




