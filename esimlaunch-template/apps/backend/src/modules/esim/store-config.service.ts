import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { LocationItem, PackageItem } from '@esimlaunch-template/sdk';

/** Store config from main backend (esim-connect-hub). Used when STORE_ID or STORE_SUBDOMAIN is set. */
export interface StoreConfig {
  storeId: string;
  branding: {
    businessName?: string;
    primaryColor?: string;
    secondaryColor?: string;
    accentColor?: string;
    logoUrl?: string | null;
  };
  packages: Array<{
    packageCode: string;
    slug?: string;
    name: string;
    data: string;
    validity: string;
    price: number;
    currency: string;
    location: string;
    locationCode: string;
    activeType?: string;
    dataType?: string;
  }>;
  packagesTemplate: PackageItem[];
  locations: Array<{ code: string; name: string; type: number; slug: string }>;
  currency: string;
  templateKey?: string;
  templateSettings?: Record<string, unknown>;
}

@Injectable()
export class StoreConfigService {
  private readonly logger = new Logger(StoreConfigService.name);
  private cached: { config: StoreConfig; expiresAt: number } | null = null;
  private readonly cacheTtlMs = 5 * 60 * 1000; // 5 minutes

  constructor(private config: ConfigService) {}

  /** True if this deployment is linked to a store (will use main backend for packages/locations). */
  isLinked(): boolean {
    return !!(this.config.get<string>('STORE_ID') || this.config.get<string>('STORE_SUBDOMAIN'));
  }

  /** Fetch and cache store config from main backend. */
  async getConfig(): Promise<StoreConfig | null> {
    const storeId = this.config.get<string>('STORE_ID');
    const subdomain = this.config.get<string>('STORE_SUBDOMAIN');
    const baseUrl = this.config.get<string>('ESIMLAUNCH_HUB_API_URL');

    if (!storeId && !subdomain) return null;
    if (!baseUrl) {
      this.logger.warn('ESIMLAUNCH_HUB_API_URL not set; cannot fetch store config');
      return null;
    }

    const now = Date.now();
    if (this.cached && this.cached.expiresAt > now) {
      return this.cached.config;
    }

    const url = subdomain
      ? `${baseUrl.replace(/\/$/, '')}/api/stores/by-subdomain/${subdomain}`
      : `${baseUrl.replace(/\/$/, '')}/api/stores/${storeId}/public`;

    this.logger.log(`Fetching store config from ${url}`);

    try {
      const res = await fetch(url);
      if (!res.ok) {
        const body = await res.text();
        this.logger.warn(
          `Store config fetch failed: ${res.status} ${res.statusText}. ` +
            (body?.slice(0, 200) || ''),
        );
        if (this.cached) return this.cached.config; // stale fallback
        return null;
      }
      const json = (await res.json()) as { success?: boolean; data?: unknown };
      if (!json.success || !json.data) {
        this.logger.warn('Store config response missing success/data');
        if (this.cached) return this.cached.config;
        return null;
      }

      const data = json.data as Record<string, unknown>;
      const config: StoreConfig = {
        storeId: String(data.storeId ?? ''),
        branding: (data.branding as StoreConfig['branding']) ?? {},
        packages: (data.packages as StoreConfig['packages']) ?? [],
        packagesTemplate: (data.packagesTemplate as PackageItem[]) ?? [],
        locations: (data.locations as StoreConfig['locations']) ?? [],
        currency: String(data.currency ?? 'USD'),
        templateKey: data.templateKey as string | undefined,
        templateSettings: data.templateSettings as Record<string, unknown> | undefined,
      };

      this.cached = { config, expiresAt: now + this.cacheTtlMs };
      this.logger.log(
        `Store config loaded: ${config.locations.length} locations, ${config.packagesTemplate.length} packages`,
      );
      return config;
    } catch (err) {
      this.logger.error('Failed to fetch store config', err);
      if (this.cached) return this.cached.config;
      return null;
    }
  }

  /** Get locations in LocationItem format. */
  async getLocations(): Promise<LocationItem[]> {
    const config = await this.getConfig();
    if (!config) return [];

    return config.locations.map((loc) => ({
      code: loc.code,
      name: loc.name,
      type: (loc.type ?? 1) as 1 | 2,
    }));
  }

  /** Get packages for a location (filter packagesTemplate by locationCode). */
  async getPackagesByLocation(locationCode: string): Promise<PackageItem[]> {
    const config = await this.getConfig();
    if (!config) return [];

    return config.packagesTemplate.filter(
      (p) =>
        (p.locationCode || p.location || '').toUpperCase() === locationCode.toUpperCase()
    );
  }

  /** Get a single package by packageCode. */
  async getPackageByCode(packageCode: string): Promise<PackageItem | null> {
    const config = await this.getConfig();
    if (!config) return null;

    const pkg = config.packagesTemplate.find(
      (p) => p.packageCode === packageCode || p.slug === packageCode
    );
    return pkg ?? null;
  }

  /** Invalidate cache (e.g. for testing or forced refresh). */
  invalidateCache(): void {
    this.cached = null;
  }
}
