/**
 * Static mapping of country code to network operators.
 * Provider API typically does not expose operators; use "Best available network" as fallback.
 */
export const OPERATORS_BY_COUNTRY: Record<string, string[]> = {
  US: ['Verizon', 'T-Mobile', 'AT&T'],
  GB: ['EE', 'Vodafone', 'O2', 'Three'],
  FR: ['Orange', 'SFR', 'Bouygues', 'Free'],
  DE: ['T-Mobile', 'Vodafone', 'O2', 'Telekom'],
  JP: ['NTT Docomo', 'au', 'Softbank'],
  AU: ['Telstra', 'Optus', 'Vodafone'],
  ES: ['Movistar', 'Vodafone', 'Orange'],
  IT: ['TIM', 'Vodafone', 'Wind Tre', 'Iliad'],
  TH: ['AIS', 'True', 'dtac'],
  SG: ['Singtel', 'StarHub', 'M1'],
  KR: ['KT', 'SK Telecom', 'LG U+'],
  MX: ['Telcel', 'Movistar', 'AT&T'],
  CA: ['Rogers', 'Bell', 'Telus'],
  BR: ['Vivo', 'Claro', 'TIM', 'Oi'],
  IN: ['Jio', 'Airtel', 'Vodafone Idea'],
};

export function getOperators(locationCode: string): string[] {
  const code = locationCode.split('-')[0].toUpperCase();
  return OPERATORS_BY_COUNTRY[code] ?? [];
}

export function getOperatorsDisplay(locationCode: string): string {
  const ops = getOperators(locationCode);
  return ops.length > 0 ? ops.join(', ') : 'Best available network';
}
