import { useState, useEffect, useRef } from "react";
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
  const lastApiKeyRef = useRef<string | null>(null);

  useEffect(() => {
    const fetchPackages = async () => {
      setIsLoading(true);
      setError(null);
      try {
        const result = await apiClient.getPackages({
          locationCode: options.locationCode,
          type: options.type,
        });

        if (result && result.success && result.obj?.packageList) {
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
          // Clear error on success
          setError(null);
        } else {
          setPackages([]);
        }
      } catch (err: any) {
        console.error('Failed to fetch packages:', err);
        // Provide user-friendly error messages
        if (err.errorCode === 'API_KEY_REQUIRED' || err.errorCode === 'INVALID_API_KEY') {
          setError("API key required. Please create an API key in Developer to access packages.");
        } else if (err.status === 401 || err.errorCode === 'UNAUTHORIZED') {
          setError("Authentication required. Please configure your API key in Developer.");
        } else {
          setError(err.message || "Failed to fetch packages");
        }
        setPackages([]);
      } finally {
        setIsLoading(false);
      }
    };

    fetchPackages();
  }, [options.locationCode, options.type, options.searchQuery]);

  // Watch for API key changes and retry when it becomes available
  useEffect(() => {
    if (!error) return; // Only retry if we have an error

    const checkAndRetry = async () => {
      const currentApiKey = typeof window !== 'undefined' ? localStorage.getItem('api_key') : null;
      
      // If API key just became available, retry
      if (currentApiKey && currentApiKey !== lastApiKeyRef.current) {
        lastApiKeyRef.current = currentApiKey;
        
        // Small delay to ensure apiClient has picked up the key
        await new Promise(resolve => setTimeout(resolve, 200));
        
        setIsLoading(true);
        setError(null);
        try {
          const result = await apiClient.getPackages({
            locationCode: options.locationCode,
            type: options.type,
          });

          if (result && result.success && result.obj?.packageList) {
            let filteredPackages = result.obj.packageList;

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
            setError(null);
          } else {
            setPackages([]);
          }
        } catch (err: any) {
          console.error('Failed to fetch packages after API key update:', err);
          if (err.errorCode === 'API_KEY_REQUIRED' || err.errorCode === 'INVALID_API_KEY') {
            setError("API key required. Please create an API key in Developer to access packages.");
          } else {
            setError(err.message || "Failed to fetch packages");
          }
          setPackages([]);
        } finally {
          setIsLoading(false);
        }
      } else if (currentApiKey) {
        lastApiKeyRef.current = currentApiKey;
      }
    };

    // Check immediately
    checkAndRetry();

    // Also listen for custom event when API key is created
    const handleApiKeyCreated = () => {
      checkAndRetry();
    };

    window.addEventListener('apiKeyCreated', handleApiKeyCreated);
    
    // Poll for changes (only when we have an error)
    const interval = setInterval(() => {
      checkAndRetry();
    }, 1000);

    return () => {
      window.removeEventListener('apiKeyCreated', handleApiKeyCreated);
      clearInterval(interval);
    };
  }, [error, options.locationCode, options.type, options.searchQuery]);

  return { packages, isLoading, error };
}





