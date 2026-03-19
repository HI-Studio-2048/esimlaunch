import { Controller, Get } from '@nestjs/common';
import { EsimService } from './esim.service';

/**
 * GET /api/countries
 * Returns list of countries (type 1 locations) for device-check and other use cases.
 */
@Controller('countries')
export class CountriesController {
  constructor(private readonly esimService: EsimService) {}

  @Get()
  async getCountries() {
    const locations = await this.esimService.getLocations();
    const countries = locations
      .filter((loc) => loc.type === 1)
      .map((loc) => ({
        code: loc.code,
        name: loc.name,
      }));
    return { locationList: countries };
  }
}
