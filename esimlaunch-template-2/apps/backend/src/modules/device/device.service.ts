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

/** Device models for autocomplete - common eSIM-capable devices */
const DEVICE_MODELS = [
  'iPhone 15 Pro Max',
  'iPhone 15 Pro',
  'iPhone 15',
  'iPhone 14 Pro Max',
  'iPhone 14 Pro',
  'iPhone 14',
  'iPhone 13 Pro Max',
  'iPhone 13 Pro',
  'iPhone 13',
  'iPhone 12 Pro Max',
  'iPhone 12 Pro',
  'iPhone 12',
  'iPhone XS',
  'iPhone XR',
  'iPhone 11',
  'Samsung Galaxy S24 Ultra',
  'Samsung Galaxy S24',
  'Samsung Galaxy S23 Ultra',
  'Samsung Galaxy S23',
  'Samsung Galaxy S22',
  'Samsung Galaxy S21',
  'Samsung Galaxy S20',
  'Samsung Galaxy Z Fold 5',
  'Samsung Galaxy Z Flip 5',
  'Google Pixel 8 Pro',
  'Google Pixel 8',
  'Google Pixel 7',
  'Google Pixel 6',
  'Google Pixel Fold',
  'iPad Pro',
  'iPad Air',
  'iPad mini',
];

export interface DeviceCheckResult {
  model: string;
  brand: string;
  supported: boolean;
  notes: string[];
  regionalNotes: Record<string, string>;
}

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

  /** Search device models by query string */
  searchModels(q: string): string[] {
    if (!q || q.length < 2) return [];
    const lower = q.toLowerCase();
    return DEVICE_MODELS.filter((m) => m.toLowerCase().includes(lower)).slice(0, 15);
  }

  /** Check compatibility by model name (and optional country) */
  checkByModel(model: string, _country?: string): DeviceCheckResult {
    const modelLower = model.toLowerCase().trim();
    let supported = false;
    const notes: string[] = [];
    const regionalNotes: Record<string, string> = {};

    for (const { pattern } of COMPATIBLE_PATTERNS) {
      if (pattern.test(modelLower)) {
        supported = true;
        break;
      }
    }

    if (!supported) {
      notes.push('This device may not support eSIM. Please verify with your carrier or manufacturer.');
    } else {
      notes.push('Your device supports eSIM. You can purchase and install an eSIM plan.');
    }

    const brand = model.split(' ')[0] ?? 'Unknown';
    return {
      model,
      brand,
      supported,
      notes,
      regionalNotes,
    };
  }
}
