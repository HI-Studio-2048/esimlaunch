import { Controller, Get, Param, Query } from '@nestjs/common';
import { EsimService } from './esim.service';

@Controller('esim')
export class EsimController {
  constructor(private readonly esimService: EsimService) {}

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
}
