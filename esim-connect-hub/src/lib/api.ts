/**
 * API Client for eSIM Launch Backend
 * Provides typed functions for all API endpoints
 */

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000';

interface ApiResponse<T> {
  success: boolean;
  data?: T;
  errorCode?: string;
  errorMessage?: string;
}

class ApiError extends Error {
  constructor(
    public errorCode: string,
    message: string,
    public status?: number
  ) {
    super(message);
    this.name = 'ApiError';
  }
}

class ApiClient {
  private baseURL: string;
  private apiKey: string | null = null;
  private jwtToken: string | null = null;

  constructor(baseURL: string = API_BASE_URL) {
    this.baseURL = baseURL;
    
    // Load tokens from localStorage
    if (typeof window !== 'undefined') {
      this.apiKey = localStorage.getItem('api_key');
      this.jwtToken = localStorage.getItem('jwt_token');
    }
  }

  setApiKey(key: string | null) {
    this.apiKey = key;
    if (typeof window !== 'undefined') {
      if (key) {
        localStorage.setItem('api_key', key);
      } else {
        localStorage.removeItem('api_key');
      }
    }
  }

  setJwtToken(token: string | null) {
    this.jwtToken = token;
    if (typeof window !== 'undefined') {
      if (token) {
        localStorage.setItem('jwt_token', token);
      } else {
        localStorage.removeItem('jwt_token');
      }
    }
  }

  private async request<T>(
    endpoint: string,
    options: RequestInit = {},
    retryCount = 0
  ): Promise<T> {
    const url = `${this.baseURL}${endpoint}`;
    
    const headers: HeadersInit = {
      'Content-Type': 'application/json',
      ...options.headers,
    };

    // Add authentication header
    if (this.apiKey) {
      headers['Authorization'] = `Bearer ${this.apiKey}`;
    } else if (this.jwtToken) {
      headers['Authorization'] = `Bearer ${this.jwtToken}`;
    }

    const response = await fetch(url, {
      ...options,
      headers,
    });

    const data: ApiResponse<T> = await response.json();

    // Handle 401 Unauthorized - try to refresh token
    if (response.status === 401 && !this.apiKey && this.jwtToken && retryCount === 0) {
      try {
        await this.refreshToken();
        // Retry the original request with new token
        return this.request<T>(endpoint, options, retryCount + 1);
      } catch (refreshError) {
        // Refresh failed, clear token and throw
        this.setJwtToken(null);
        throw new ApiError(
          'UNAUTHORIZED',
          'Session expired. Please log in again.',
          response.status
        );
      }
    }

    if (!response.ok || !data.success) {
      throw new ApiError(
        data.errorCode || 'UNKNOWN_ERROR',
        data.errorMessage || 'An error occurred',
        response.status
      );
    }

    return data.data as T;
  }

  // Authentication endpoints
  async register(email: string, password: string, name?: string, serviceType?: 'EASY' | 'ADVANCED') {
    return this.request<{ merchant: any; token: string }>('/api/auth/register', {
      method: 'POST',
      body: JSON.stringify({ email, password, name, serviceType }),
    });
  }

  async login(email: string, password: string) {
    const result = await this.request<{ merchant: any; token: string }>('/api/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    });
    this.setJwtToken(result.token);
    return result;
  }

  async getCurrentMerchant() {
    return this.request<any>('/api/auth/me');
  }

  async forgotPassword(email: string) {
    return this.request<{ message: string }>('/api/auth/forgot-password', {
      method: 'POST',
      body: JSON.stringify({ email }),
    });
  }

  async verifyResetToken(token: string) {
    return this.request<{ valid: boolean }>(`/api/auth/verify-reset-token/${token}`);
  }

  async resetPassword(token: string, password: string) {
    return this.request<{ message: string }>('/api/auth/reset-password', {
      method: 'POST',
      body: JSON.stringify({ token, password }),
    });
  }

  async refreshToken() {
    const result = await this.request<{ token: string; merchant: any }>('/api/auth/refresh', {
      method: 'POST',
    });
    this.setJwtToken(result.token);
    return result;
  }

  async updateProfile(name?: string, email?: string) {
    return this.request<any>('/api/auth/profile', {
      method: 'PUT',
      body: JSON.stringify({ name, email }),
    });
  }

  async changePassword(currentPassword: string, newPassword: string) {
    return this.request<{ message: string }>('/api/auth/change-password', {
      method: 'PUT',
      body: JSON.stringify({ currentPassword, newPassword }),
    });
  }

  async deleteAccount() {
    return this.request<{ message: string }>('/api/auth/account', {
      method: 'DELETE',
    });
  }

  async clerkSync(clerkUserId: string) {
    return this.request<{ merchant: any; token: string }>('/api/auth/clerk-sync', {
      method: 'POST',
      body: JSON.stringify({ clerkUserId }),
    });
  }

  async verifyEmail(token: string) {
    return this.request<{ message: string }>(`/api/auth/verify-email/${token}`, {
      method: 'POST',
    });
  }

  async resendVerificationEmail() {
    return this.request<{ message: string }>('/api/auth/resend-verification', {
      method: 'POST',
    });
  }

  async setup2FA() {
    return this.request<{ secret: string; qrCodeUrl: string; manualEntryKey: string }>('/api/auth/2fa/setup', {
      method: 'POST',
    });
  }

  async verify2FASetup(token: string) {
    return this.request<{ message: string }>('/api/auth/2fa/verify', {
      method: 'POST',
      body: JSON.stringify({ token }),
    });
  }

  async disable2FA() {
    return this.request<{ message: string }>('/api/auth/2fa/disable', {
      method: 'POST',
    });
  }

  async get2FAStatus() {
    return this.request<{ enabled: boolean }>('/api/auth/2fa/status');
  }

  async verify2FALogin(token: string) {
    return this.request<{ message: string }>('/api/auth/2fa/login', {
      method: 'POST',
      body: JSON.stringify({ token }),
    });
  }

  async getSessions() {
    return this.request<Array<{
      id: string;
      ipAddress: string | null;
      userAgent: string | null;
      expiresAt: string;
      createdAt: string;
      lastUsedAt: string;
    }>>('/api/auth/sessions');
  }

  async deleteSession(sessionId: string) {
    return this.request<{ message: string }>(`/api/auth/sessions/${sessionId}`, {
      method: 'DELETE',
    });
  }

  async deleteAllSessions() {
    return this.request<{ message: string }>('/api/auth/sessions', {
      method: 'DELETE',
    });
  }

  // API Key management
  async createApiKey(name?: string, rateLimit?: number, expiresInDays?: number) {
    return this.request<{
      id: string;
      key: string;
      keyPrefix: string;
      name: string | null;
      rateLimit: number;
      isActive: boolean;
      createdAt: string;
      expiresAt: string | null;
    }>('/api/api-keys', {
      method: 'POST',
      body: JSON.stringify({ name, rateLimit, expiresInDays }),
    });
  }

  async listApiKeys() {
    return this.request<Array<{
      id: string;
      keyPrefix: string;
      name: string | null;
      rateLimit: number;
      isActive: boolean;
      lastUsedAt: string | null;
      createdAt: string;
      expiresAt: string | null;
    }>>('/api/api-keys');
  }

  async revokeApiKey(keyId: string) {
    return this.request<void>(`/api/api-keys/${keyId}`, {
      method: 'DELETE',
    });
  }

  // eSIM API endpoints
  async getPackages(params?: {
    locationCode?: string;
    type?: 'BASE' | 'TOPUP';
    packageCode?: string;
    slug?: string;
    iccid?: string;
  }) {
    const queryParams = new URLSearchParams();
    if (params) {
      Object.entries(params).forEach(([key, value]) => {
        if (value !== undefined) {
          queryParams.append(key, value);
        }
      });
    }
    const query = queryParams.toString();
    return this.request<any>(`/api/v1/packages${query ? `?${query}` : ''}`);
  }

  async createOrder(data: {
    transactionId: string;
    amount?: number;
    packageInfoList: Array<{
      packageCode?: string;
      slug?: string;
      count: number;
      price?: number;
      periodNum?: number;
    }>;
  }) {
    return this.request<{ orderNo: string }>('/api/v1/orders', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async getOrder(orderNo: string) {
    return this.request<any>(`/api/v1/orders/${orderNo}`);
  }

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
  }) {
    const queryParams = new URLSearchParams();
    if (params) {
      Object.entries(params).forEach(([key, value]) => {
        if (value !== undefined) {
          if (key === 'pager') {
            queryParams.append('pager[pageSize]', (value as any).pageSize);
            queryParams.append('pager[pageNum]', (value as any).pageNum);
          } else {
            queryParams.append(key, String(value));
          }
        }
      });
    }
    const query = queryParams.toString();
    return this.request<any>(`/api/v1/profiles${query ? `?${query}` : ''}`);
  }

  async cancelProfile(esimTranNo: string) {
    return this.request<void>(`/api/v1/profiles/${esimTranNo}/cancel`, {
      method: 'POST',
    });
  }

  async suspendProfile(esimTranNo: string) {
    return this.request<void>(`/api/v1/profiles/${esimTranNo}/suspend`, {
      method: 'POST',
    });
  }

  async unsuspendProfile(esimTranNo: string) {
    return this.request<void>(`/api/v1/profiles/${esimTranNo}/unsuspend`, {
      method: 'POST',
    });
  }

  async revokeProfile(esimTranNo: string) {
    return this.request<void>(`/api/v1/profiles/${esimTranNo}/revoke`, {
      method: 'POST',
    });
  }

  async topUpProfile(esimTranNo: string, data: {
    packageCode: string;
    transactionId: string;
    amount?: number;
  }) {
    return this.request<any>(`/api/v1/profiles/${esimTranNo}/topup`, {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async checkUsage(esimTranNo: string) {
    return this.request<any>(`/api/v1/profiles/${esimTranNo}/usage`);
  }

  async checkUsageBatch(esimTranNoList: string[]) {
    return this.request<any>('/api/v1/profiles/usage', {
      method: 'POST',
      body: JSON.stringify({ esimTranNoList }),
    });
  }

  async getBalance() {
    return this.request<{ balance: number }>('/api/v1/balance');
  }

  async getRegions() {
    return this.request<any>('/api/v1/regions');
  }

  async sendSms(esimTranNo: string, message: string) {
    return this.request<void>(`/api/v1/profiles/${esimTranNo}/sms`, {
      method: 'POST',
      body: JSON.stringify({ message }),
    });
  }

  async configureWebhook(url: string, events?: string[], secret?: string) {
    return this.request<any>('/api/v1/webhooks', {
      method: 'POST',
      body: JSON.stringify({ url, events, secret }),
    });
  }

  async getWebhook() {
    return this.request<any>('/api/v1/webhooks');
  }

  // Dashboard endpoints
  async getDashboardStats() {
    return this.request<{
      orders: { total: number; completed: number; pending: number; change?: number | null };
      revenue: { total: number; change?: number | null };
      apiKeys: { active: number };
      balance: number;
    }>('/api/dashboard/stats');
  }

  async getOrders(page?: number, pageSize?: number, status?: string) {
    const params = new URLSearchParams();
    if (page) params.append('page', String(page));
    if (pageSize) params.append('pageSize', String(pageSize));
    if (status) params.append('status', status);
    const query = params.toString();
    return this.request<any>(`/api/dashboard/orders${query ? `?${query}` : ''}`);
  }

  async getAnalytics(days?: number) {
    const params = new URLSearchParams();
    if (days) params.append('days', String(days));
    const query = params.toString();
    return this.request<any>(`/api/dashboard/analytics${query ? `?${query}` : ''}`);
  }

  // Store endpoints (Easy Way)
  async createStore(data: {
    name: string;
    domain?: string;
    subdomain?: string;
    businessName: string;
    primaryColor?: string;
    secondaryColor?: string;
    accentColor?: string;
    logoUrl?: string;
    selectedPackages?: string[];
    pricingMarkup?: Record<string, any>;
  }) {
    return this.request<any>('/api/stores', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async listStores() {
    return this.request<any[]>('/api/stores');
  }

  async getStore(storeId: string) {
    return this.request<any>(`/api/stores/${storeId}`);
  }

  async updateStore(storeId: string, data: Partial<{
    name: string;
    domain: string;
    subdomain: string;
    businessName: string;
    primaryColor: string;
    secondaryColor: string;
    accentColor: string;
    logoUrl: string;
    selectedPackages: string[];
    pricingMarkup: Record<string, any>;
  }>) {
    return this.request<any>(`/api/stores/${storeId}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  }

  async deleteStore(storeId: string) {
    return this.request<void>(`/api/stores/${storeId}`, {
      method: 'DELETE',
    });
  }

  // Domain verification endpoints (mock implementations if backend doesn't support)
  async verifyDomain(domain: string) {
    // Mock implementation - replace with actual API call when backend supports it
    // For now, simulate a verification check
    return new Promise<{ verified: boolean; sslActive: boolean }>((resolve) => {
      setTimeout(() => {
        // Mock: assume domain is verified if it's a valid format
        const isValid = /^([a-z0-9]+(-[a-z0-9]+)*\.)+[a-z]{2,}$/i.test(domain);
        resolve({
          verified: isValid,
          sslActive: isValid,
        });
      }, 1500);
    });
  }

  async getDomainStatus(storeId: string) {
    // Mock implementation - replace with actual API call when backend supports it
    try {
      const store = await this.getStore(storeId);
      if (store.domain) {
        return {
          domain: store.domain,
          verified: true, // Mock: assume verified if domain exists
          sslActive: true,
          subdomain: store.subdomain || null,
        };
      }
      return null;
    } catch (error) {
      return null;
    }
  }
}

export const apiClient = new ApiClient();
export { ApiError };

