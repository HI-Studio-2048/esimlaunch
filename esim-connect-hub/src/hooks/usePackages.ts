import { useState, useEffect } from "react";
import { apiClient } from "@/lib/api";

export interface Package {
  packageCode: string;
  slug: string;
  name: string;
  price: number;
  currencyCode: string;
  volume: number;
  unusedValidTime: number;
  duration: number;
  durationUnit: string;
  location: string;
  locationCode: string;
  description?: string;
}

export interface UsePackagesOptions {
  locationCode?: string;
  type?: 'BASE' | 'TOPUP';
  searchQuery?: string;
}

export function usePackages(options: UsePackagesOptions = {}) {
  const [packages, setPackages] = useState<Package[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchPackages = async () => {
      setIsLoading(true);
      setError(null);
      try {
        const result = await apiClient.getPackages({
          locationCode: options.locationCode,
          type: options.type,
        });

        if (result.success && result.obj?.packageList) {
          let filteredPackages = result.obj.packageList;

          // Apply search filter if provided
          if (options.searchQuery) {
            const query = options.searchQuery.toLowerCase();
            filteredPackages = filteredPackages.filter((pkg: Package) =>
              pkg.name?.toLowerCase().includes(query) ||
              pkg.location?.toLowerCase().includes(query) ||
              pkg.locationCode?.toLowerCase().includes(query) ||
              pkg.description?.toLowerCase().includes(query)
            );
          }

          setPackages(filteredPackages);
        } else {
          setPackages([]);
        }
      } catch (err: any) {
        setError(err.message || "Failed to fetch packages");
        setPackages([]);
      } finally {
        setIsLoading(false);
      }
    };

    fetchPackages();
  }, [options.locationCode, options.type, options.searchQuery]);

  return { packages, isLoading, error };
}




