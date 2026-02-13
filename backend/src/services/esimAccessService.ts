import axios, { AxiosInstance } from 'axios';
import { env } from '../config/env';

export interface PackageInfo {
  packageCode: string;
  slug: string;
  name: string;
  price: number; // Price in smallest unit (price * 10000)
  currencyCode: string;
  volume: number; // Data volume in bytes
  unusedValidTime: number;
  duration: number;
  durationUnit: string;
  location: string;
  locationCode: string;
  description?: string;
  activeType?: string;
  smsStatus?: number;
  dataType?: number;
  supportTopUpType?: string;
  ipExport?: boolean;
}

export interface PackageListResponse {
  success: boolean;
  errorCode?: string;
  errorMessage?: string;
  obj?: {
    packageList: PackageInfo[];
  };
}

export interface OrderRequest {
  transactionId: string;
  amount?: number;
  packageInfoList: Array<{
    packageCode?: string;
    slug?: string;
    count: number;
    price?: number;
    periodNum?: number; // For daily plans (1-365)
  }>;
}

export interface OrderResponse {
  success: boolean;
  errorCode?: string;
  errorMessage?: string;
  obj?: {
    orderNo: string;
  };
}

export interface ProfileInfo {
  esimTranNo: string;
  orderNo: string;
  imsi?: string;
  iccid?: string;
  msisdn?: string;
  smsStatus: number;
  dataType: number;
  qrCodeUrl?: string;
  smdpStatus: string;
  esimStatus: string;
  eid?: string;
  activeType?: string;
  expiredTime?: string;
  totalVolume: number;
  totalDuration: number;
  durationUnit: string;
  orderUsage: number;
  packageList?: Array<{
    packageCode: string;
    duration: number;
    volume: number;
    locationCode: string;
  }>;
}

export interface QueryProfilesResponse {
  success: boolean;
  errorCode?: string;
  errorMessage?: string;
  obj?: {
    esimList: ProfileInfo[];
    pager?: {
      pageSize: number;
      pageNum: number;
      total: number;
    };
  };
}

export interface BalanceResponse {
  success: boolean;
  errorCode?: string;
  errorMessage?: string;
  obj?: {
    balance: number; // Balance in smallest unit (balance * 10000 = USD)
  };
}

export interface TopUpRequest {
  esimTranNo?: string;
  iccid?: string;
  packageCode: string;
  transactionId: string;
  amount?: number;
}

export interface TopUpResponse {
  success: boolean;
  errorCode?: string;
  errorMessage?: string;
  obj?: {
    transactionId: string;
    iccid: string;
    expiredTime: string;
    totalVolume: number;
    totalDuration: number;
    orderUsage: number;
  };
}

export interface UsageInfo {
  esimTranNo: string;
  dataUsage: number; // Bytes used
  totalData: number; // Total bytes in plan
  lastUpdateTime: string;
}

export interface UsageResponse {
  success: boolean;
  errorCode?: string;
  errorMessage?: string;
  obj?: UsageInfo[];
}

export interface RegionInfo {
  code: string;
  name: string;
  type: number; // 1 for single-country, 2 for multi-country
  subLocationList?: Array<{
    code: string;
    name: string;
  }>;
}

export interface RegionsResponse {
  success: boolean;
  errorCode?: string;
  errorMessage?: string;
  obj?: RegionInfo[];
}

class ESIMAccessService {
  private client: AxiosInstance;

  constructor() {
    this.client = axios.create({
      baseURL: env.esimAccessApiUrl,
      headers: {
        'RT-AccessCode': env.esimAccessAccessCode,
        'Content-Type': 'application/json',
      },
      timeout: 30000, // 30 seconds
    });

    // Add request interceptor for logging
    this.client.interceptors.request.use(
      (config) => {
        console.log(`[eSIM Access] ${config.method?.toUpperCase()} ${config.url}`);
        return config;
      },
      (error) => {
        console.error('[eSIM Access] Request error:', error);
        return Promise.reject(error);
      }
    );

    // Add response interceptor for error handling
    this.client.interceptors.response.use(
      (response) => response,
      (error) => {
        console.error('[eSIM Access] Response error:', error.response?.data || error.message);
        return Promise.reject(error);
      }
    );
  }

  /**
   * Get all data packages
   * @param locationCode Optional Alpha-2 ISO country code or !RG (Regional) or !GL (Global)
   * @param type BASE (default) or TOPUP
   * @param packageCode Used with TOPUP to view top up packages
   * @param slug Slug alias of packageCode
   * @param iccid Include iccid with TOPUP to see available top ups
   */
  async getPackages(params?: {
    locationCode?: string;
    type?: 'BASE' | 'TOPUP';
    packageCode?: string;
    slug?: string;
    iccid?: string;
  }): Promise<PackageListResponse> {
    const response = await this.client.post<PackageListResponse>(
      '/api/v1/open/package/list',
      params || {}
    );
    return response.data;
  }

  /**
   * Order eSIM profiles (single or batch)
   */
  async orderProfiles(orderRequest: OrderRequest): Promise<OrderResponse> {
    const response = await this.client.post<OrderResponse>(
      '/api/v1/open/esim/order',
      orderRequest
    );
    return response.data;
  }

  /**
   * Query eSIM profiles
   * @param orderNo Query by order number (returns batch)
   * @param iccid Query by ICCID (returns single)
   * @param esimTranNo Query by eSIM transaction number (returns single, recommended)
   * @param startTime Start time range (ISO UTC)
   * @param endTime End time range (ISO UTC)
   * @param pager Pagination parameters
   */
  async queryProfiles(params?: {
    orderNo?: string;
    iccid?: string;
    esimTranNo?: string;
    startTime?: string;
    endTime?: string;
    pager?: {
      pageSize: number;
      pageNum: number;
    };
  }): Promise<QueryProfilesResponse> {
    const response = await this.client.post<QueryProfilesResponse>(
      '/api/v1/open/esim/query',
      params || {}
    );
    return response.data;
  }

  /**
   * Cancel an unused eSIM profile (refundable)
   */
  async cancelProfile(esimTranNo: string): Promise<{ success: boolean; errorCode?: string; errorMessage?: string }> {
    const response = await this.client.post(
      '/api/v1/open/esim/cancel',
      { esimTranNo }
    );
    return response.data;
  }

  /**
   * Suspend an eSIM profile
   */
  async suspendProfile(esimTranNo: string): Promise<{ success: boolean; errorCode?: string; errorMessage?: string }> {
    const response = await this.client.post(
      '/api/v1/open/esim/suspend',
      { esimTranNo }
    );
    return response.data;
  }

  /**
   * Unsuspend an eSIM profile
   */
  async unsuspendProfile(esimTranNo: string): Promise<{ success: boolean; errorCode?: string; errorMessage?: string }> {
    const response = await this.client.post(
      '/api/v1/open/esim/unsuspend',
      { esimTranNo }
    );
    return response.data;
  }

  /**
   * Revoke an eSIM profile (non-refundable)
   */
  async revokeProfile(esimTranNo: string): Promise<{ success: boolean; errorCode?: string; errorMessage?: string }> {
    const response = await this.client.post(
      '/api/v1/open/esim/revoke',
      { esimTranNo }
    );
    return response.data;
  }

  /**
   * Top up an existing eSIM profile
   */
  async topUpProfile(topUpRequest: TopUpRequest): Promise<TopUpResponse> {
    const response = await this.client.post<TopUpResponse>(
      '/api/v1/open/esim/topup',
      topUpRequest
    );
    return response.data;
  }

  /**
   * Check account balance
   */
  async checkBalance(): Promise<BalanceResponse> {
    const response = await this.client.post<BalanceResponse>(
      '/api/v1/open/balance/query',
      {}
    );
    return response.data;
  }

  /**
   * Check data usage for up to 10 eSIMs
   */
  async checkUsage(esimTranNoList: string[]): Promise<UsageResponse> {
    if (esimTranNoList.length > 10) {
      throw new Error('Maximum 10 eSIMs can be queried at once');
    }
    const response = await this.client.post<UsageResponse>(
      '/api/v1/open/esim/usage/query',
      { esimTranNoList }
    );
    return response.data;
  }

  /**
   * Get supported regions/countries
   */
  async getRegions(): Promise<RegionsResponse> {
    const response = await this.client.post<RegionsResponse>(
      '/api/v1/open/location/list',
      {}
    );
    return response.data;
  }

  /**
   * Send SMS to an eSIM
   */
  async sendSms(esimTranNo: string, message: string): Promise<{ success: boolean; errorCode?: string; errorMessage?: string }> {
    if (message.length > 500) {
      throw new Error('SMS message cannot exceed 500 characters');
    }
    const response = await this.client.post(
      '/api/v1/open/esim/sendSms',
      { esimTranNo, message }
    );
    return response.data;
  }

  /**
   * Set webhook URL (for eSIM Access to send webhooks to us)
   */
  async setWebhook(webhookUrl: string): Promise<{ success: boolean; errorCode?: string; errorMessage?: string }> {
    const response = await this.client.post(
      '/api/v1/open/webhook/save',
      { webhook: webhookUrl }
    );
    return response.data;
  }

  /**
   * Query current webhook configuration
   */
  async getWebhook(): Promise<{ success: boolean; errorCode?: string; errorMessage?: string; obj?: { webhook: string } }> {
    const response = await this.client.post(
      '/api/v1/open/webhook/query',
      {}
    );
    return response.data;
  }
}

export const esimAccessService = new ESIMAccessService();







