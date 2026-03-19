/**
 * Demo data for preview deployments.
 * Only used when NEXT_PUBLIC_DEMO_MODE=true.
 * Does NOT affect production template builds.
 */

export const DEMO_STORE_CONFIG = {
  branding: {
    businessName: 'eSIM Store',
    primaryColor: '#6366f1',
    secondaryColor: '#8b5cf6',
    accentColor: '#22c55e',
    logoUrl: null,
  },
  currency: 'USD',
  supportedCurrencies: ['USD', 'EUR', 'GBP', 'AUD', 'CAD'],
  templateSettings: {},
  isActive: true,
};

export const DEMO_LOCATIONS = [
  { code: 'JP', name: 'Japan', type: 1, slug: 'japan-esim', flagUrl: 'https://flagcdn.com/w80/jp.png' },
  { code: 'FR', name: 'France', type: 1, slug: 'france-esim', flagUrl: 'https://flagcdn.com/w80/fr.png' },
  { code: 'TH', name: 'Thailand', type: 1, slug: 'thailand-esim', flagUrl: 'https://flagcdn.com/w80/th.png' },
  { code: 'GB', name: 'United Kingdom', type: 1, slug: 'united-kingdom-esim', flagUrl: 'https://flagcdn.com/w80/gb.png' },
  { code: 'US', name: 'United States', type: 1, slug: 'united-states-esim', flagUrl: 'https://flagcdn.com/w80/us.png' },
  { code: 'AU', name: 'Australia', type: 1, slug: 'australia-esim', flagUrl: 'https://flagcdn.com/w80/au.png' },
  { code: 'DE', name: 'Germany', type: 1, slug: 'germany-esim', flagUrl: 'https://flagcdn.com/w80/de.png' },
  { code: 'IT', name: 'Italy', type: 1, slug: 'italy-esim', flagUrl: 'https://flagcdn.com/w80/it.png' },
  { code: 'ES', name: 'Spain', type: 1, slug: 'spain-esim', flagUrl: 'https://flagcdn.com/w80/es.png' },
  { code: 'KR', name: 'South Korea', type: 1, slug: 'south-korea-esim', flagUrl: 'https://flagcdn.com/w80/kr.png' },
  { code: 'SG', name: 'Singapore', type: 1, slug: 'singapore-esim', flagUrl: 'https://flagcdn.com/w80/sg.png' },
  { code: 'AE', name: 'United Arab Emirates', type: 1, slug: 'united-arab-emirates-esim', flagUrl: 'https://flagcdn.com/w80/ae.png' },
  { code: 'TR', name: 'Turkey', type: 1, slug: 'turkey-esim', flagUrl: 'https://flagcdn.com/w80/tr.png' },
  { code: 'MX', name: 'Mexico', type: 1, slug: 'mexico-esim', flagUrl: 'https://flagcdn.com/w80/mx.png' },
  { code: 'BR', name: 'Brazil', type: 1, slug: 'brazil-esim', flagUrl: 'https://flagcdn.com/w80/br.png' },
  { code: 'IN', name: 'India', type: 1, slug: 'india-esim', flagUrl: 'https://flagcdn.com/w80/in.png' },
  { code: 'ID', name: 'Indonesia', type: 1, slug: 'indonesia-esim', flagUrl: 'https://flagcdn.com/w80/id.png' },
  { code: 'EG', name: 'Egypt', type: 1, slug: 'egypt-esim', flagUrl: 'https://flagcdn.com/w80/eg.png' },
  { code: 'ZA', name: 'South Africa', type: 1, slug: 'south-africa-esim', flagUrl: 'https://flagcdn.com/w80/za.png' },
  { code: 'NZ', name: 'New Zealand', type: 1, slug: 'new-zealand-esim', flagUrl: 'https://flagcdn.com/w80/nz.png' },
  { code: 'PT', name: 'Portugal', type: 1, slug: 'portugal-esim', flagUrl: 'https://flagcdn.com/w80/pt.png' },
  { code: 'GR', name: 'Greece', type: 1, slug: 'greece-esim', flagUrl: 'https://flagcdn.com/w80/gr.png' },
  { code: 'PH', name: 'Philippines', type: 1, slug: 'philippines-esim', flagUrl: 'https://flagcdn.com/w80/ph.png' },
  { code: 'VN', name: 'Vietnam', type: 1, slug: 'vietnam-esim', flagUrl: 'https://flagcdn.com/w80/vn.png' },
];

function makePlans(countryCode: string) {
  const base = countryCode.charCodeAt(0) + countryCode.charCodeAt(1);
  return [
    { packageCode: `${countryCode}-1GB-7D`, name: '1 GB', slug: `${countryCode.toLowerCase()}-1gb-7d`, volume: 1073741824, duration: 7, durationUnit: 'day', price: 4.50 + (base % 3), location: countryCode, locationCode: countryCode, supportTopUpType: 1, activeType: 'static' },
    { packageCode: `${countryCode}-3GB-15D`, name: '3 GB', slug: `${countryCode.toLowerCase()}-3gb-15d`, volume: 3221225472, duration: 15, durationUnit: 'day', price: 9.00 + (base % 4), location: countryCode, locationCode: countryCode, supportTopUpType: 2, activeType: 'static' },
    { packageCode: `${countryCode}-5GB-30D`, name: '5 GB', slug: `${countryCode.toLowerCase()}-5gb-30d`, volume: 5368709120, duration: 30, durationUnit: 'day', price: 15.00 + (base % 5), location: countryCode, locationCode: countryCode, supportTopUpType: 2, activeType: 'static' },
    { packageCode: `${countryCode}-10GB-30D`, name: '10 GB', slug: `${countryCode.toLowerCase()}-10gb-30d`, volume: 10737418240, duration: 30, durationUnit: 'day', price: 22.00 + (base % 6), location: countryCode, locationCode: countryCode, supportTopUpType: 2, activeType: 'static' },
    { packageCode: `${countryCode}-20GB-30D`, name: '20 GB', slug: `${countryCode.toLowerCase()}-20gb-30d`, volume: 21474836480, duration: 30, durationUnit: 'day', price: 35.00 + (base % 8), location: countryCode, locationCode: countryCode, supportTopUpType: 2, activeType: 'static' },
  ];
}

/** Resolve demo data for a given API path. Returns null if not handled. */
export function getDemoResponse(path: string): unknown | null {
  if (path === '/esim/store-config') {
    return DEMO_STORE_CONFIG;
  }

  if (path === '/esim/locations') {
    return DEMO_LOCATIONS;
  }

  // /esim/slug/:slug → return location
  const slugMatch = path.match(/^\/esim\/slug\/(.+)$/);
  if (slugMatch) {
    const slug = slugMatch[1];
    const loc = DEMO_LOCATIONS.find((l) => l.slug === slug);
    return loc ?? null;
  }

  // /esim/packages/:code → return plans
  const pkgMatch = path.match(/^\/esim\/packages\/(.+)$/);
  if (pkgMatch) {
    return makePlans(pkgMatch[1].toUpperCase());
  }

  // /esim/package/:code → single package
  const singlePkgMatch = path.match(/^\/esim\/package\/(.+)$/);
  if (singlePkgMatch) {
    const code = singlePkgMatch[1];
    for (const loc of DEMO_LOCATIONS) {
      const plans = makePlans(loc.code);
      const found = plans.find((p) => p.packageCode === code);
      if (found) return found;
    }
    return null;
  }

  // /esim/country-summaries → price summaries
  if (path.startsWith('/esim/country-summaries')) {
    const summaries: Record<string, { lowestPriceUSD: number; planCount: number }> = {};
    for (const loc of DEMO_LOCATIONS) {
      const plans = makePlans(loc.code);
      summaries[loc.code] = {
        lowestPriceUSD: Math.min(...plans.map((p) => p.price)),
        planCount: plans.length,
      };
    }
    return summaries;
  }

  return null;
}
