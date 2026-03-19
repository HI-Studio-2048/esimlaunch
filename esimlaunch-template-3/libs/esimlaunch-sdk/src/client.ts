import axios, { AxiosInstance, AxiosRequestConfig } from 'axios';
import {
  BaseResponse,
  LocationListResponse,
  PackageListResponse,
  OrderRequest,
  OrderResponse,
  EsimQueryResponse,
  TopUpRequest,
  UsageInfo,
} from './types';

export interface EsimlaunchClientConfig {
  apiBase: string; // e.g. https://api.esimlaunch.com
  apiKey: string;
}

/**
 * Low-level HTTP client for the esimlaunch REST API.
 * All requests use Bearer token auth.
 * All responses are normalised to BaseResponse<T>.
 */
export class EsimlaunchClient {
  private http: AxiosInstance;

  constructor(config: EsimlaunchClientConfig) {
    this.http = axios.create({
      baseURL: config.apiBase.replace(/\/$/, ''),
      timeout: 30_000,
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${config.apiKey}`,
      },
    });
  }

  // -------------------------------------------------------------------------
  // Generic request helpers
  // -------------------------------------------------------------------------

  private wrap<T>(data: unknown): BaseResponse<T> {
    if (data && typeof data === 'object' && 'success' in data) {
      const d = data as Record<string, unknown>;
      return {
        success: d.success === true || d.success === 'true',
        errorCode: (d.errorCode as string) ?? null,
        errorMessage: (d.errorMessage as string) ?? null,
        obj: (d.obj ?? d.data) as T | undefined,
      };
    }
    return { success: true, obj: data as T };
  }

  private async get<T>(path: string, params?: Record<string, unknown>): Promise<BaseResponse<T>> {
    try {
      const res = await this.http.get<unknown>(path, { params });
      return this.wrap<T>(res.data);
    } catch (err: unknown) {
      return this.toError<T>(err);
    }
  }

  private async post<T>(path: string, body?: unknown): Promise<BaseResponse<T>> {
    try {
      const res = await this.http.post<unknown>(path, body);
      return this.wrap<T>(res.data);
    } catch (err: unknown) {
      return this.toError<T>(err);
    }
  }

  private toError<T>(err: unknown): BaseResponse<T> {
    const axiosErr = err as { response?: { status?: number; data?: { errorCode?: string; errorMessage?: string } }; message?: string };
    const body = axiosErr.response?.data;
    return {
      success: false,
      errorCode: body?.errorCode ?? String(axiosErr.response?.status ?? 'UNKNOWN'),
      errorMessage: body?.errorMessage ?? axiosErr.message ?? 'Unknown error',
    };
  }

  // -------------------------------------------------------------------------
  // Locations
  //
  // For esimlaunch merchant API we call:
  //   GET /api/v1/regions
  // which returns { success, obj: RegionInfo[] }.
  // EsimService is responsible for normalising this into LocationListResponse.
  // -------------------------------------------------------------------------
  getLocations(): Promise<BaseResponse<LocationListResponse | any>> {
    return this.get<LocationListResponse | any>('/api/v1/regions');
  }

  // -------------------------------------------------------------------------
  // Packages
  // -------------------------------------------------------------------------
  getPackagesByLocation(locationCode: string): Promise<BaseResponse<PackageListResponse>> {
    // Merchant API surface: GET /api/v1/packages
    return this.get<PackageListResponse>('/api/v1/packages', {
      locationCode,
      type: 'BASE',
    });
  }

  getPackagesByCode(packageCode: string): Promise<BaseResponse<PackageListResponse>> {
    return this.get<PackageListResponse>('/api/v1/packages', {
      packageCode,
      type: 'BASE',
    });
  }

  getTopupPackages(params: {
    iccid?: string;
    locationCode?: string;
  }): Promise<BaseResponse<PackageListResponse>> {
    return this.get<PackageListResponse>('/api/v1/packages', {
      ...params,
      type: 'TOPUP',
    });
  }

  // -------------------------------------------------------------------------
  // Orders
  // -------------------------------------------------------------------------
  createOrder(body: OrderRequest): Promise<BaseResponse<OrderResponse>> {
    return this.post<OrderResponse>('/api/v1/open/esim/order', body);
  }

  queryOrder(orderNo: string, pageNum = 1, pageSize = 20): Promise<BaseResponse<EsimQueryResponse>> {
    return this.post<EsimQueryResponse>('/api/v1/open/esim/query', {
      orderNo,
      pager: { pageNum, pageSize },
    });
  }

  // -------------------------------------------------------------------------
  // Top-up
  // -------------------------------------------------------------------------
  topupEsim(body: TopUpRequest): Promise<BaseResponse<{ orderNo: string }>> {
    return this.post<{ orderNo: string }>('/api/v1/open/esim/topup', body);
  }

  // -------------------------------------------------------------------------
  // Profile actions
  // -------------------------------------------------------------------------
  cancelEsim(esimTranNo: string): Promise<BaseResponse<unknown>> {
    return this.post('/api/v1/open/esim/cancel', { esimTranNo });
  }

  suspendEsim(iccid: string): Promise<BaseResponse<unknown>> {
    return this.post('/api/v1/open/esim/suspend', { iccid });
  }

  unsuspendEsim(esimTranNo: string): Promise<BaseResponse<unknown>> {
    return this.post('/api/v1/open/esim/unsuspend', { esimTranNo });
  }

  revokeEsim(esimTranNo: string): Promise<BaseResponse<unknown>> {
    return this.post('/api/v1/open/esim/revoke', { esimTranNo });
  }

  // -------------------------------------------------------------------------
  // Usage
  // -------------------------------------------------------------------------
  queryUsage(esimTranNoList: string[]): Promise<BaseResponse<{ usageList: UsageInfo[] }>> {
    return this.post<{ usageList: UsageInfo[] }>('/api/v1/open/esim/usage/query', {
      esimTranNoList,
    });
  }
}
