import { Injectable } from '@nestjs/common';

/**
 * Static eSIM compatibility info. No DB.
 * Used by the device check modal on the frontend.
 */
const COMPATIBLE_PATTERNS = [
  { pattern: /iphone\s+(1[2-9]|[2-9]\d)/i, name: 'iPhone 12+' },
  { pattern: /iphone\s+x[sr]/i, name: 'iPhone XS / XR' },
  { pattern: /iphone\s+1[1-9]/i, name: 'iPhone 11+' },
  { pattern: /pixel\s+[3-9]/i, name: 'Pixel 3+' },
  { pattern: /pixel\s+\d+/i, name: 'Google Pixel' },
  { pattern: /samsung\s+galaxy\s+s(2[0-9]|[3-9]\d)/i, name: 'Samsung Galaxy S20+' },
  { pattern: /samsung\s+galaxy\s+z/i, name: 'Samsung Galaxy Z (Fold/Flip)' },
  { pattern: /huawei\s+p\d+\s*pro/i, name: 'Huawei P series' },
  { pattern: /oneplus\s+[6-9]|oneplus\s+\d{2}/i, name: 'OnePlus 6+' },
  { pattern: /motorola\s+razr/i, name: 'Motorola Razr' },
  { pattern: /oppo\s+find\s+x/i, name: 'OPPO Find X' },
  { pattern: /xiaomi\s+mi\s+\d+/i, name: 'Xiaomi Mi' },
  { pattern: /ipad/i, name: 'iPad' },
];

const STATIC_DEVICE_LIST = [
  'iPhone XS, XR, 11, 12, 13, 14, 15, 16 and later',
  'Google Pixel 3 and later',
  'Samsung Galaxy S20, S21, S22, S23, S24 and later',
  'Samsung Galaxy Z Fold, Z Flip series',
  'Google Pixel Fold',
  'iPad (cellular models)',
  'Other eSIM-capable devices',
];

@Injectable()
export class DeviceService {
  checkCompatibility(userAgent?: string): { compatible: boolean; devices?: string[] } {
    const ua = userAgent ?? '';
    let compatible = false;
    for (const { pattern } of COMPATIBLE_PATTERNS) {
      if (pattern.test(ua)) {
        compatible = true;
        break;
      }
    }
    return {
      compatible,
      devices: STATIC_DEVICE_LIST,
    };
  }
}
