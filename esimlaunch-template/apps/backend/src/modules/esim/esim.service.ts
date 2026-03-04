import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../../prisma.service';
import { EsimlaunchClient, LocationItem, PackageItem } from '@esimlaunch-template/sdk';

/**
 * EsimService wraps the esimlaunch SDK.
 * Responsibilities:
 *  - Normalize location data (type 1 = country, type 2 = region)
 *  - Normalize package data (volume MB→GB display, price provider units→USD)
 *  - Apply admin markup to prices
 *  - Check and honour mock mode
 *  - Generate flag image URLs
 */
@Injectable()
export class EsimService {
  private readonly client: EsimlaunchClient;
  private readonly logger = new Logger(EsimService.name);

  constructor(
    private config: ConfigService,
    private prisma: PrismaService,
  ) {
    this.client = new EsimlaunchClient({
      apiBase: this.config.getOrThrow<string>('ESIMLAUNCH_API_BASE'),
      apiKey: this.config.getOrThrow<string>('ESIMLAUNCH_API_KEY'),
    });
  }

  getClient(): EsimlaunchClient {
    return this.client;
  }

  // -----------------------------------------------------------------------
  // Admin settings helpers
  // -----------------------------------------------------------------------

  private async getSettings() {
    return this.prisma.adminSettings.findUnique({ where: { id: 'singleton' } });
  }

  async isMockMode(): Promise<boolean> {
    const s = await this.getSettings();
    return s?.mockMode ?? false;
  }

  async getMarkupPercent(): Promise<number> {
    const s = await this.getSettings();
    return s?.markupPercent ?? 0;
  }

  async getDefaultCurrency(): Promise<string> {
    const s = await this.getSettings();
    return s?.defaultCurrency ?? 'USD';
  }

  // -----------------------------------------------------------------------
  // Price helpers
  // -----------------------------------------------------------------------

  /**
   * Convert provider price (1/10000 USD) to USD cents with markup applied.
   */
  async providerPriceToUsdCents(providerPrice: number): Promise<number> {
    const usdCents = Math.round(providerPrice / 100); // 1/10000 * 100 = USD cents
    const markup = await this.getMarkupPercent();
    if (markup === 0) return usdCents;
    return Math.round(usdCents * (1 + markup / 100));
  }

  // -----------------------------------------------------------------------
  // Locations
  // -----------------------------------------------------------------------

  /** Return normalised location list. type 1 = country, type 2 = region. */
  async getLocations(): Promise<LocationItem[]> {
    const res = await this.client.getLocations();

    // esimlaunch /api/v1/regions returns { success, obj: RegionInfo[] }.
    // Some providers may still return { obj: { locationList: [...] } }.
    const rawObj: any = res.obj;
    let rawList: any[] = [];

    if (Array.isArray(rawObj)) {
      rawList = rawObj;
    } else if (rawObj?.locationList && Array.isArray(rawObj.locationList)) {
      rawList = rawObj.locationList;
    }

    if (!res.success || rawList.length === 0) {
      this.logger.warn('getLocations returned no data', res.errorMessage);
      return [];
    }

    const seen = new Set<string>();
    const result: LocationItem[] = [];

    for (const loc of rawList) {
      if (seen.has(loc.code)) continue;
      seen.add(loc.code);
      result.push({
        code: loc.code ?? '',
        name: loc.name ?? '',
        type: (loc.type ?? 1) as 1 | 2,
        subLocation: loc.subLocation,
      });
    }

    return result;
  }

  /** Find a location by code. */
  async getLocationByCode(code: string): Promise<LocationItem | undefined> {
    const all = await this.getLocations();
    return all.find((l) => l.code.toUpperCase() === code.toUpperCase());
  }

  /**
   * Generate a URL-friendly slug for a location.
   * e.g. "Malaysia" → "malaysia-esim", "Global (120 Countries)" → "global-120-countries-esim"
   */
  makeSlug(name: string): string {
    return (
      name
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/(^-|-$)/g, '') + '-esim'
    );
  }

  /** Find a location by slug. */
  async getLocationBySlug(slug: string): Promise<LocationItem | undefined> {
    const all = await this.getLocations();
    return all.find((l) => this.makeSlug(l.name) === slug);
  }

  // -----------------------------------------------------------------------
  // Packages / Plans
  // -----------------------------------------------------------------------

  async getPackagesByLocation(locationCode: string): Promise<PackageItem[]> {
    if (await this.isMockMode()) {
      return this.mockPackages(locationCode);
    }

    const res = await this.client.getPackagesByLocation(locationCode);
    if (!res.success || !res.obj?.packageList) {
      this.logger.warn(`getPackagesByLocation(${locationCode}) returned no data`);
      return [];
    }

    const markup = await this.getMarkupPercent();

    return res.obj.packageList.map((pkg) => ({
      ...pkg,
      // Apply markup to displayed price (keep provider units)
      price: markup > 0 ? Math.round(pkg.price * (1 + markup / 100)) : pkg.price,
    }));
  }

  async getPlanByCode(packageCode: string): Promise<PackageItem | null> {
    if (await this.isMockMode()) {
      return this.mockPackages('MOCK')[0] ?? null;
    }

    const res = await this.client.getPackagesByCode(packageCode);
    const pkg = res.obj?.packageList?.[0];
    return pkg ?? null;
  }

  // -----------------------------------------------------------------------
  // Flag URL helper
  // -----------------------------------------------------------------------

  /** Returns a flag image URL for country codes only (type 1). */
  getFlagUrl(code: string, type: 1 | 2): string | undefined {
    if (type !== 1) return undefined;
    const cc = code.split('-')[0].toLowerCase();
    return `https://flagcdn.com/w320/${cc}.png`;
  }

  // -----------------------------------------------------------------------
  // Mock data (used when mockMode is true)
  // -----------------------------------------------------------------------

  private mockPackages(locationCode: string): PackageItem[] {
    return [
      {
        packageCode: `MOCK-${locationCode}-1GB`,
        name: `${locationCode} 1GB 7 Days`,
        location: locationCode,
        volume: 1024,
        duration: 7,
        durationUnit: 'day',
        price: 50000, // $5.00 in provider units
        currencyCode: 'USD',
        supportTopUpType: 1,
      },
      {
        packageCode: `MOCK-${locationCode}-3GB`,
        name: `${locationCode} 3GB 30 Days`,
        location: locationCode,
        volume: 3072,
        duration: 30,
        durationUnit: 'day',
        price: 100000,
        currencyCode: 'USD',
        supportTopUpType: 2,
      },
    ];
  }
}
