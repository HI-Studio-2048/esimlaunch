import { useState, useEffect, useContext } from 'react';
import { apiClient } from '@/lib/api';
import { PublicStoreInvalidationContext } from '@/contexts/PublicStoreInvalidationContext';

export interface PublicStoreBranding {
  businessName: string;
  primaryColor: string;
  secondaryColor: string;
  accentColor: string;
  logoUrl: string | null;
}

export interface PublicStorePackage {
  packageCode: string;
  slug: string;
  name: string;
  data: string;
  validity: string;
  price: number;
  currency: string;
  location: string;
  locationCode: string;
  activeType?: string;
  dataType?: number;
}

export type TemplateKey = 'default' | 'minimal' | 'bold' | 'travel';

export interface FAQ {
  question: string;
  answer: string;
}

export interface TemplateSettings {
  heroStyle?: 'gradient' | 'minimal' | 'image' | 'split';
  showTestimonials?: boolean;
  showFeatures?: boolean;
  showEsimInfo?: boolean;
  heroHeadline?: string;
  heroSubheadline?: string;
  // Contact page content
  contactEmail?: string;
  contactPhone?: string;
  contactAddress?: string;
  contactHours?: string;
  // About page content
  aboutTagline?: string;
  aboutMission?: string;
  // FAQ content
  faqs?: FAQ[];
  // Legal pages
  legalCompanyName?: string;
  legalLastUpdated?: string;
}

export interface PublicStoreData {
  storeId?: string;
  subdomain?: string | null;
  branding: PublicStoreBranding;
  packages: PublicStorePackage[];
  currency: string;
  templateKey?: TemplateKey;
  templateSettings?: TemplateSettings;
}

interface UsePublicStoreResult {
  data: PublicStoreData | null;
  isLoading: boolean;
  error: string | null;
}

const cache = new Map<string, { data: PublicStoreData; ts: number }>();
const CACHE_TTL = 5 * 60 * 1000; // 5 minutes

/** Call after updating store (e.g. template) so demo store shows changes without hard refresh. */
export function invalidatePublicStoreCache(storeId?: string): void {
  if (storeId) {
    cache.delete(storeId);
  } else {
    cache.clear();
  }
}

export function usePublicStore(storeId: string | null | undefined): UsePublicStoreResult {
  const invalidation = useContext(PublicStoreInvalidationContext);
  const invalidateKey = invalidation?.invalidateKey ?? 0;
  const [data, setData] = useState<PublicStoreData | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!storeId) {
      setData(null);
      setIsLoading(false);
      return;
    }

    const cached = cache.get(storeId);
    if (cached && Date.now() - cached.ts < CACHE_TTL) {
      setData(cached.data);
      setError(null);
      return;
    }

    setIsLoading(true);
    setError(null);

    apiClient.getPublicStore(storeId)
      .then(result => {
        cache.set(storeId, { data: result, ts: Date.now() });
        setData(result);
      })
      .catch(err => {
        console.error('Failed to load public store:', err);
        setError(err?.message || 'Failed to load store data');
      })
      .finally(() => setIsLoading(false));
  }, [storeId, invalidateKey]);

  return { data, isLoading, error };
}
