import { Controller, Get, Param, Query, Req, ForbiddenException } from '@nestjs/common';
import { EsimService } from './esim.service';
import { StoreConfigService } from './store-config.service';

@Controller('esim')
export class EsimController {
  constructor(
    private readonly esimService: EsimService,
    private readonly storeConfig: StoreConfigService,
  ) {}

  /**
   * GET /api/esim/store-config
   * Public endpoint for frontend: returns branding, currency, supportedCurrencies, templateSettings.
   * When not linked, returns minimal defaults.
   */
  @Get('store-config')
  async getStoreConfig() {
    const config = await this.storeConfig.getConfig();
    if (!config) {
      return {
        branding: { businessName: 'eSIM Store' },
        currency: 'USD',
        supportedCurrencies: ['USD', 'EUR', 'GBP', 'AUD', 'CAD', 'CHF', 'JPY'],
        templateSettings: undefined,
      };
    }
    return {
      branding: config.branding,
      currency: config.currency,
      supportedCurrencies: config.supportedCurrencies,
      templateSettings: config.templateSettings,
      isActive: config.isActive !== false,
    };
  }

  /**
   * GET /api/esim/store-config-status
   * Debug endpoint: shows whether store config is linked and fetch status.
   * Protected by ADMIN_RETRY_SECRET header.
   */
  @Get('store-config-status')
  async getStoreConfigStatus(@Req() req: any) {
    const adminSecret = process.env.ADMIN_RETRY_SECRET;
    const provided = req.headers['x-admin-secret'];
    if (!adminSecret || !provided || provided !== adminSecret) {
      throw new ForbiddenException('Not authorized');
    }
    const isLinked = this.storeConfig.isLinked();
    if (!isLinked) {
      return {
        isLinked: false,
        message: 'STORE_ID or STORE_SUBDOMAIN not set; using esimlaunch API directly',
      };
    }
    const config = await this.storeConfig.getConfig();
    return {
      isLinked: true,
      fetchSuccess: !!config,
      storeId: config?.storeId,
      locationsCount: config?.locations?.length ?? 0,
      packagesCount: config?.packagesTemplate?.length ?? 0,
      currency: config?.currency,
    };
  }

  /**
   * GET /api/esim/locations
   * Returns all countries and regions.
   * type 1 = single country, type 2 = multi-country region.
   */
  @Get('locations')
  async getLocations() {
    const locations = await this.esimService.getLocations();
    return locations.map((loc) => ({
      ...loc,
      slug: this.esimService.makeSlug(loc.name),
      flagUrl: this.esimService.getFlagUrl(loc.code, loc.type),
    }));
  }

  /**
   * GET /api/esim/packages/:locationCode
   * Returns plans for a specific country or region code.
   */
  @Get('packages/:locationCode')
  async getPackages(@Param('locationCode') locationCode: string) {
    return this.esimService.getPackagesByLocation(locationCode);
  }

  /**
   * GET /api/esim/plans/:packageCode
   * Returns a single plan's details (used by checkout and emails).
   */
  @Get('plans/:packageCode')
  async getPlan(@Param('packageCode') packageCode: string) {
    const plan = await this.esimService.getPlanByCode(packageCode);
    if (!plan) return { notFound: true };
    return plan;
  }

  /**
   * GET /api/esim/slug/:slug
   * Resolve a URL slug to a location (used by the frontend country pages).
   */
  @Get('slug/:slug')
  async getLocationBySlug(@Param('slug') slug: string) {
    const loc = await this.esimService.getLocationBySlug(slug);
    if (!loc) return null;
    return {
      ...loc,
      slug,
      flagUrl: this.esimService.getFlagUrl(loc.code, loc.type),
    };
  }

  /**
   * GET /api/esim/summary?codes=US,UK,FR,JP,AU
   * Returns min price per country for Popular Plans section.
   */
  @Get('summary')
  async getCountrySummaries(@Query('codes') codes: string) {
    const codeList = codes ? codes.split(',').map((c) => c.trim()).filter(Boolean) : [];
    if (codeList.length === 0) return [];
    return this.esimService.getCountrySummaries(codeList);
  }
}
