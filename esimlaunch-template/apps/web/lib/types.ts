// Shared frontend types — mirrors the backend/SDK shapes.

export interface Location {
  code: string;
  name: string;
  type: 1 | 2; // 1 = country, 2 = region
  slug: string;
  flagUrl?: string;
  subLocation?: { code: string; name: string; type: 1 }[];
}

export interface Plan {
  packageCode: string;
  slug?: string;
  name: string;
  location: string;
  volume: number;   // MB
  duration: number;
  durationUnit: 'day' | 'month';
  price: number;    // Provider units (1/10000 USD)
  currencyCode: string;
  supportTopUpType?: number; // 1 = non-reloadable, 2 = reloadable
}

export interface Order {
  id: string;
  planId: string;
  planName?: string;
  amountCents: number;
  currency: string;
  displayCurrency?: string;
  displayAmountCents?: number;
  status: string;
  paymentMethod: string;
  esimProfile?: EsimProfile;
  createdAt: string;
}

export interface EsimProfile {
  id: string;
  iccid?: string;
  qrCodeUrl?: string;
  ac?: string;
  esimStatus: string;
  totalVolume?: string; // serialised BigInt → string
  orderUsage?: string;
  expiredTime?: string;
  order?: {
    planId: string;
    planName?: string;
    amountCents: number;
    displayCurrency?: string;
  };
}

// Provider price → USD display helper
export function formatPrice(providerPrice: number, currency = 'USD'): string {
  const usd = providerPrice / 10000;
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency,
    minimumFractionDigits: 2,
  }).format(usd);
}

/**
 * Volume → human-readable (e.g. "1 GB", "3 GB", "500 MB").
 * Handles MB (e.g. 1024), KB (e.g. 3145728 KB = 3 GB), or bytes from different providers.
 */
export function formatVolume(volume: number): string {
  let mb = volume;
  if (volume >= 1_000_000_000) {
    // Very large: assume bytes (e.g. 3221225472 bytes = 3 GB)
    mb = volume / (1024 * 1024);
  } else if (volume >= 1_000_000) {
    // Large: assume KB (e.g. 3145728 KB = 3072 MB = 3 GB)
    mb = volume / 1024;
  }
  if (mb >= 1024) return `${(mb / 1024).toFixed(0)} GB`;
  if (mb >= 1) return `${Math.round(mb)} MB`;
  return `${volume} MB`;
}
