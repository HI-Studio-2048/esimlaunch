// ---------------------------------------------------------------------------
// Shared response envelope used across all SDK methods.
// success is a boolean (true = OK, false = error from provider).
// ---------------------------------------------------------------------------
export interface BaseResponse<T = unknown> {
  success: boolean;
  errorCode?: string | null;
  errorMessage?: string | null;
  obj?: T;
}

// ---------------------------------------------------------------------------
// Locations / regions
// type 1 = single country, type 2 = multi-country region (e.g. "Global")
// subLocation is only present on type-2 entries and lists the member countries.
// ---------------------------------------------------------------------------
export interface SubLocationItem {
  code: string; // ISO country code e.g. "MY"
  name: string; // e.g. "Malaysia"
  type: 1;
}

export interface LocationItem {
  code: string;      // e.g. "MY" for Malaysia, "GLO" for Global
  name: string;      // Human-readable name
  type: 1 | 2;       // 1 = country, 2 = region
  subLocation?: SubLocationItem[];
}

export interface LocationListResponse {
  locationList: LocationItem[];
}

// ---------------------------------------------------------------------------
// Packages / plans
// volume  – data allowance in MB (divide by 1024 for GB)
// price   – provider price in 1/10000 USD (divide by 10000 for USD float)
// duration + durationUnit describe the plan validity
// ---------------------------------------------------------------------------
export interface PackageItem {
  packageCode: string; // Unique provider plan ID
  slug?: string;       // URL-friendly plan identifier
  name: string;
  location: string;    // Location code the plan covers
  locationCode?: string;
  volume: number;      // MB
  duration: number;
  durationUnit: 'day' | 'month';
  price: number;       // Provider units (1/10000 USD)
  currencyCode: string;
  supportTopUpType?: number; // 1 = non-reloadable, 2 = reloadable
}

export interface PackageListResponse {
  packageList: PackageItem[];
}

// ---------------------------------------------------------------------------
// eSIM order
// ---------------------------------------------------------------------------
export interface PackageInfo {
  packageCode?: string;
  slug?: string;
  count: number;
  price?: number;      // Provider units
  periodNum?: number;  // Days, for unlimited/day-pass plans
}

export interface OrderRequest {
  transactionId: string; // Unique per order, ≤50 chars
  packageInfoList: PackageInfo[];
  amount?: number;       // Total in provider units
}

export interface OrderResponse {
  orderNo: string;
}

// ---------------------------------------------------------------------------
// eSIM query (profile status after order)
// ---------------------------------------------------------------------------
export interface EsimProfile {
  esimTranNo: string;
  iccid?: string;
  qrCodeUrl?: string;
  ac?: string;            // Activation code
  smdpStatus?: string;
  esimStatus: string;     // e.g. PENDING, IN_USE, EXPIRED
  totalVolume?: number;   // bytes
  orderUsage?: number;    // bytes used
  expiredTime?: string;   // ISO timestamp
}

export interface EsimQueryResponse {
  esimList: EsimProfile[];
}

// ---------------------------------------------------------------------------
// Top-up
// ---------------------------------------------------------------------------
export interface TopUpRequest {
  esimTranNo?: string;
  iccid?: string;
  packageCode: string;
  transactionId: string;
  amount?: number;
}

// ---------------------------------------------------------------------------
// Usage
// ---------------------------------------------------------------------------
export interface UsageInfo {
  esimTranNo: string;
  iccid?: string;
  orderUsage?: number;   // bytes used
  totalVolume?: number;  // bytes total
  expiredTime?: string;
}

// ---------------------------------------------------------------------------
// Webhook event raw payload stored for processing
// ---------------------------------------------------------------------------
export interface WebhookEventPayload {
  event: string;
  data: unknown;
  receivedAt: string;
}
