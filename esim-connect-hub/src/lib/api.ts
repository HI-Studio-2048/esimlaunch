/**
 * API Client for eSIM Launch Backend
 * Provides typed functions for all API endpoints
 */

// Prefer VITE_API_BASE_URL; support VITE_API_URL for backward compatibility (e.g. deployment docs)
export const API_BASE_URL =
  import.meta.env.VITE_API_BASE_URL ||
  import.meta.env.VITE_API_URL ||
  'http://localhost:3000';

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
    // ALWAYS reload API key and JWT token from localStorage before each request
    // This ensures we always have the latest values, even if they were set after component mount
    let storedApiKey: string | null = null;
    let storedJwtToken: string | null = null;
    
    if (typeof window !== 'undefined') {
      storedApiKey = localStorage.getItem('api_key');
      storedJwtToken = localStorage.getItem('jwt_token');
      // Update instance variables
      this.apiKey = storedApiKey;
      this.jwtToken = storedJwtToken;
    }

    const url = `${this.baseURL}${endpoint}`;
    
    const headers: HeadersInit = {
      'Content-Type': 'application/json',
      ...options.headers,
    };

    // Check if this is an eSIM Access API endpoint
    const isESIMAccessAPI = endpoint.startsWith('/api/v1/');
    
    // Add authentication: session cookie (credentials: 'include') is always sent.
    // For eSIM Access API: backend accepts session (Prisma DB) or Bearer (JWT/API key).
    // Send Bearer when we have one; do not require localStorage — logged-in users use session.
    if (storedJwtToken) {
      headers['Authorization'] = `Bearer ${storedJwtToken}`;
    } else if (storedApiKey) {
      headers['Authorization'] = `Bearer ${storedApiKey}`;
    }
    // If neither: request still goes with credentials: 'include' so session cookie can auth (Prisma DB)

    const response = await fetch(url, {
      ...options,
      headers,
      credentials: 'include', // Send session cookie (DB-backed auth, works on any device)
    });

    const text = await response.text();
    const contentType = response.headers.get('content-type');
    if (!contentType || !contentType.includes('application/json')) {
      throw new ApiError(
        'INVALID_RESPONSE',
        response.ok
          ? `Expected JSON but got ${contentType || 'unknown'}.`
          : `Request failed (${response.status}). ${text.trimStart().startsWith('<') ? 'Server returned an error page.' : text.substring(0, 120)}`,
        response.status
      );
    }

    let data: ApiResponse<T>;
    try {
      data = JSON.parse(text) as ApiResponse<T>;
    } catch {
      throw new ApiError(
        'INVALID_RESPONSE',
        text.trimStart().startsWith('<')
          ? `Server returned an error page instead of JSON (${response.status}). Check that the API is running and the URL is correct.`
          : `Invalid JSON in response.`,
        response.status
      );
    }

    // Handle 401 Unauthorized - try to refresh token (only for non-API-key endpoints)
    if (response.status === 401 && !isESIMAccessAPI && !storedApiKey && storedJwtToken && retryCount === 0) {
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
      // Better error for eSIM Access API 401: may be session or API key
      if (response.status === 401 && isESIMAccessAPI) {
        const msg = (data as any).errorMessage || '';
        throw new ApiError(
          data.errorCode || 'UNAUTHORIZED',
          msg.includes('Log in') || msg.includes('Authorization')
            ? msg
            : 'Please log in or provide an API key in Developer to use eSIM Access API.',
          response.status
        );
      }
      throw new ApiError(
        data.errorCode || 'UNKNOWN_ERROR',
        data.errorMessage || 'An error occurred',
        response.status
      );
    }

    // For eSIM Access API endpoints, the response structure is different
    // They return { success, obj, ... } directly, not wrapped in { success, data }
    if (isESIMAccessAPI) {
      // eSIM Access API returns the response object directly
      return data as T;
    }

    // Regular API endpoints wrap data in { success, data }
    // Some endpoints return { success, message } without a data field
    // In that case, return the entire response object (minus success if needed)
    if ((data as any).data !== undefined) {
      return (data as any).data as T;
    }
    // If no data field, return the response object itself (excluding success)
    const { success, ...rest } = data as any;
    return rest as T;
  }

  // Authentication endpoints
  async register(email: string, password: string, name?: string, serviceType?: 'EASY' | 'ADVANCED', referralCode?: string) {
    return this.request<{ merchant: any; token: string }>('/api/auth/register', {
      method: 'POST',
      body: JSON.stringify({ email, password, name, serviceType, referralCode }),
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

  /** Preferences stored in DB (no localStorage). */
  async getMerchantPreferences() {
    return this.request<{
      onboarding_progress: Record<string, boolean>;
      step_completion_dates: Record<string, string>;
      last_selected_store_id: string | null;
      preferred_currency: string | null;
    }>('/api/merchant/preferences');
  }

  async patchMerchantPreferences(updates: {
    onboarding_progress?: Record<string, boolean>;
    step_completion_dates?: Record<string, string>;
    last_selected_store_id?: string | null;
    preferred_currency?: string;
  }) {
    return this.request<{
      onboarding_progress: Record<string, boolean>;
      step_completion_dates: Record<string, string>;
      last_selected_store_id: string | null;
      preferred_currency: string | null;
    }>('/api/merchant/preferences', {
      method: 'PATCH',
      body: JSON.stringify(updates),
    });
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

  /** Logout: clear DB session and cookie (no localStorage). */
  async logout() {
    return this.request<{ message: string }>('/api/auth/logout', { method: 'POST' });
  }

  async updateProfile(nameOrData?: string | Record<string, any>, email?: string, extra?: Record<string, any>) {
    const body = typeof nameOrData === 'object' ? nameOrData : { name: nameOrData, email, ...extra };
    return this.request<any>('/api/auth/profile', {
      method: 'PUT',
      body: JSON.stringify(body),
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
    try {
      const result = await this.request<{ merchant: any; token: string }>('/api/auth/clerk-sync', {
        method: 'POST',
        body: JSON.stringify({ clerkUserId }),
      });
      // Store token immediately after sync
      if (result.token) {
        this.setJwtToken(result.token);
      }
      return result;
    } catch (error: any) {
      console.error('clerkSync API error:', {
        error,
        message: error?.message,
        errorCode: error?.errorCode,
        status: error?.status,
        clerkUserId
      });
      throw error;
    }
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

  async getTopUpPackages(iccid: string) {
    return this.getPackages({ type: 'TOPUP', iccid });
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

  async saveProfileNickname(esimTranNo: string, nickname: string) {
    return this.request<{ nickname: string }>(`/api/v1/profiles/${esimTranNo}/nickname`, {
      method: 'PUT',
      body: JSON.stringify({ nickname }),
    });
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

  async testWebhook(url: string, secret?: string) {
    return this.request<{ success: boolean; message?: string; statusCode?: number }>('/api/v1/webhooks/test', {
      method: 'POST',
      body: JSON.stringify({ url, secret }),
    });
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
    templateKey?: 'default' | 'minimal' | 'bold' | 'travel';
    templateSettings?: Record<string, unknown>;
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
    templateKey: 'default' | 'minimal' | 'bold' | 'travel';
    templateSettings: Record<string, unknown>;
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

  // Domain verification endpoints
  async verifyDomain(storeId: string, domain: string, method: 'dns' | 'cname' = 'dns') {
    return this.request<{
      domain: string;
      verificationToken: string;
      instructions: {
        txtRecord: { type: string; name: string; value: string };
        cnameRecord: { type: string; name: string; value: string };
      };
      method: string;
    }>(`/api/stores/${storeId}/verify-domain`, {
      method: 'POST',
      body: JSON.stringify({ domain, method }),
    });
  }

  async getDomainStatus(storeId: string) {
    return this.request<{
      domain: string | null;
      verified: boolean;
      method: string | null;
      error?: string;
      instructions?: {
        txtRecord: { type: string; name: string; value: string };
        cnameRecord: { type: string; name: string; value: string };
      } | null;
    }>(`/api/stores/${storeId}/domain-status`);
  }

  async verifyDNS(storeId: string, method: 'dns' | 'cname' = 'dns') {
    return this.request<{
      verified: boolean;
      method: string | null;
      error?: string;
    }>(`/api/stores/${storeId}/verify-dns`, {
      method: 'POST',
      body: JSON.stringify({ method }),
    });
  }

  // Payment endpoints
  async createPaymentIntent(data: {
    amount: number;
    currency?: string;
    metadata?: Record<string, string>;
    storeId?: string;
  }) {
    return this.request<{
      clientSecret: string;
      id: string;
      amount: number;
      currency: string;
      status: string;
    }>('/api/payments/create-intent', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async confirmPayment(
    paymentIntentId: string, 
    data?: {
      metadata?: Record<string, string>;
      customerEmail?: string;
      customerName?: string;
      customerId?: string; // Link to customer account
      storeId?: string;
      packageInfoList?: Array<{
        packageCode?: string;
        slug?: string;
        count: number;
        price?: number;
      }>;
    }
  ) {
    return this.request<{
      id: string;
      status: string;
      amount: number;
      currency: string;
      customerOrderId?: string;
    }>('/api/payments/confirm', {
      method: 'POST',
      body: JSON.stringify({ 
        paymentIntentId, 
        ...data 
      }),
    });
  }

  async createSubscription(data: {
    plan: 'starter' | 'growth' | 'scale';
    billingPeriod?: 'monthly' | 'yearly';
    paymentMethodId?: string;
  }) {
    return this.request<{
      id: string;
      plan: string;
      status: string;
      currentPeriodStart: string;
      currentPeriodEnd: string;
      trialEnd: string | null;
    }>('/api/subscriptions', {
      method: 'POST',
      body: JSON.stringify({
        plan: data.plan,
        billingPeriod: data.billingPeriod || 'monthly',
        paymentMethodId: data.paymentMethodId,
      }),
    });
  }

  async topupBalance(amountCents: number, currency?: string) {
    return this.request<{
      clientSecret: string;
      id: string;
      amount: number;
      currency: string;
    }>('/api/payments/topup-balance', {
      method: 'POST',
      body: JSON.stringify({ amount: amountCents, currency: currency || 'usd' }),
    });
  }

  async confirmTopup(paymentIntentId: string) {
    return this.request<{ id: string; status: string; amount: number }>(
      '/api/payments/confirm-topup',
      {
        method: 'POST',
        body: JSON.stringify({ paymentIntentId }),
      }
    );
  }

  async getBalanceTransactions(page?: number, pageSize?: number) {
    const params = new URLSearchParams();
    if (page) params.append('page', String(page));
    if (pageSize) params.append('pageSize', String(pageSize));
    const query = params.toString();
    return this.request<{
      transactions: Array<{
        id: string;
        amount: number;
        type: string;
        description: string | null;
        createdAt: string;
      }>;
      total: number;
      page: number;
      pageSize: number;
    }>(`/api/balance/transactions${query ? `?${query}` : ''}`);
  }

  async refundPayment(paymentIntentId: string, amount?: number) {
    return this.request<{
      id: string;
      amount: number;
      status: string;
      paymentIntentId: string;
    }>('/api/payments/refund', {
      method: 'POST',
      body: JSON.stringify({ paymentIntentId, amount }),
    });
  }

  // Customer order endpoints
  async getCustomerOrder(orderId: string) {
    return this.request<any>(`/api/customer-orders/${orderId}`);
  }

  async getCustomerOrdersByEmail(email: string) {
    return this.request<any[]>(`/api/customer-orders?email=${encodeURIComponent(email)}`);
  }

  async getCustomerOrderByPaymentIntent(paymentIntentId: string) {
    return this.request<any>(`/api/customer-orders/payment-intent/${paymentIntentId}`);
  }

  async resendESIMEmail(orderId: string) {
    return this.request<{ message: string }>(`/api/customer-orders/${orderId}/resend-email`, {
      method: 'POST',
    });
  }

  // Currency endpoints
  async getAvailableCurrencies() {
    return this.request<Array<{ code: string; symbol: string; name: string }>>('/api/currency/list');
  }

  async convertCurrency(amount: number, from: string, to: string, storeId?: string) {
    return this.request<{
      originalAmount: number;
      originalCurrency: string;
      convertedAmount: number;
      targetCurrency: string;
      exchangeRate: number;
    }>('/api/currency/convert', {
      method: 'POST',
      body: JSON.stringify({ amount, from, to, storeId }),
    });
  }

  async getStoreCurrency(storeId: string) {
    return this.request<{
      default: string;
      supported: string[];
    }>(`/api/currency/store/${storeId}`);
  }

  async updateStoreCurrency(storeId: string, defaultCurrency: string, supportedCurrencies: string[]) {
    return this.request(`/api/currency/store/${storeId}`, {
      method: 'PUT',
      body: JSON.stringify({ defaultCurrency, supportedCurrencies }),
    });
  }

  // Analytics endpoints
  async getRevenueAnalytics(filters?: {
    storeId?: string;
    startDate?: string;
    endDate?: string;
    groupBy?: 'day' | 'week' | 'month';
  }) {
    const params = new URLSearchParams();
    if (filters?.storeId) params.append('storeId', filters.storeId);
    if (filters?.startDate) params.append('startDate', filters.startDate);
    if (filters?.endDate) params.append('endDate', filters.endDate);
    if (filters?.groupBy) params.append('groupBy', filters.groupBy);
    
    return this.request<{
      totalRevenue: number;
      totalOrders: number;
      revenueByPeriod: Array<{ period: string; revenue: number; orders: number }>;
    }>(`/api/analytics/revenue?${params.toString()}`);
  }

  async getOrderAnalytics(filters?: {
    storeId?: string;
    startDate?: string;
    endDate?: string;
    groupBy?: 'day' | 'week' | 'month';
  }) {
    const params = new URLSearchParams();
    if (filters?.storeId) params.append('storeId', filters.storeId);
    if (filters?.startDate) params.append('startDate', filters.startDate);
    if (filters?.endDate) params.append('endDate', filters.endDate);
    if (filters?.groupBy) params.append('groupBy', filters.groupBy);
    
    return this.request<{
      byStatus: Array<{ status: string; count: number }>;
      overTime: Array<Record<string, any>>;
    }>(`/api/analytics/orders?${params.toString()}`);
  }

  async getDashboardSummary(storeId?: string) {
    const params = new URLSearchParams();
    if (storeId) params.append('storeId', storeId);
    
    return this.request<{
      revenue: { last30Days: number; last7Days: number; growth: number };
      orders: { last30Days: number; last7Days: number };
      customers: { totalCustomers: number; repeatCustomers: number; newCustomers: number };
    }>(`/api/analytics/summary?${params.toString()}`);
  }

  // Affiliate endpoints
  async getAffiliateCode() {
    return this.request<{ affiliateCode: string }>('/api/affiliates/code');
  }

  async getReferralCode() {
    return this.request<{ referralCode: string }>('/api/affiliates/referral-code');
  }

  async getAffiliateStats() {
    return this.request<{
      totalEarnings: number;
      pendingCommissions: number;
      paidCommissions: number;
      referredMerchants: number;
    }>('/api/affiliates/stats');
  }

  async getAffiliateCommissions(params?: {
    status?: string;
    startDate?: string;
    endDate?: string;
  }) {
    const queryParams = new URLSearchParams();
    if (params?.status) queryParams.append('status', params.status);
    if (params?.startDate) queryParams.append('startDate', params.startDate);
    if (params?.endDate) queryParams.append('endDate', params.endDate);
    const query = queryParams.toString();
    return this.request<Array<{
      id: string;
      amount: number;
      currency: string;
      commissionRate: number;
      status: string;
      createdAt: string;
      referredMerchant?: any;
    }>>(`/api/affiliates/commissions${query ? `?${query}` : ''}`);
  }

  async trackReferral(referralCode: string) {
    return this.request<{ message: string }>('/api/affiliates/track-referral', {
      method: 'POST',
      body: JSON.stringify({ referralCode }),
    });
  }

  async requestAffiliatePayout() {
    return this.request<{ message: string }>('/api/affiliates/payout-request', {
      method: 'POST',
    });
  }

  async getPublicStore(storeId: string) {
    return this.request<{
      branding: {
        businessName: string;
        primaryColor: string;
        secondaryColor: string;
        accentColor: string;
        logoUrl: string | null;
      };
      packages: Array<{
        packageCode: string;
        slug: string;
        name: string;
        data: string;
        validity: string;
        price: number;
        currency: string;
        location: string;
        locationCode: string;
        activeType?: string;
        dataType?: number;
      }>;
      currency: string;
    }>(`/api/stores/${storeId}/public`);
  }

  async getStoreBySubdomain(subdomain: string) {
    return this.request<{
      storeId: string;
      branding: {
        businessName: string;
        primaryColor: string;
        secondaryColor: string;
        accentColor: string;
        logoUrl: string | null;
      };
      packages: Array<{
        packageCode: string;
        slug: string;
        name: string;
        data: string;
        validity: string;
        price: number;
        currency: string;
        location: string;
        locationCode: string;
        activeType?: string;
        dataType?: number;
      }>;
      currency: string;
      templateKey?: string;
      templateSettings?: Record<string, unknown>;
    }>(`/api/stores/by-subdomain/${subdomain}`);
  }

  async createSetupIntent() {
    return this.request<{ clientSecret: string; setupIntentId: string }>('/api/payments/setup-intent', {
      method: 'POST',
    });
  }

  async applyCoupon(couponCode: string) {
    return this.request<{ message: string }>('/api/subscriptions/apply-coupon', {
      method: 'POST',
      body: JSON.stringify({ couponCode }),
    });
  }

  async sendTestEmail(email: string) {
    return this.request<{ message: string }>('/api/auth/test-email', {
      method: 'POST',
      body: JSON.stringify({ email }),
    });
  }

  // Support ticket endpoints
  async getSupportTickets(params?: {
    status?: string;
    priority?: string;
    category?: string;
  }) {
    const queryParams = new URLSearchParams();
    if (params?.status) queryParams.append('status', params.status);
    if (params?.priority) queryParams.append('priority', params.priority);
    if (params?.category) queryParams.append('category', params.category);
    const query = queryParams.toString();
    return this.request<Array<{
      id: string;
      ticketNumber: string;
      subject: string;
      customerName?: string;
      customerEmail: string;
      status: string;
      priority: string;
      category?: string;
      createdAt: string;
    }>>(`/api/support/tickets${query ? `?${query}` : ''}`);
  }

  async getSupportTicket(ticketId: string) {
    return this.request<any>(`/api/support/tickets/${ticketId}`);
  }

  async getSupportStats() {
    return this.request<{
      total: number;
      open: number;
      inProgress: number;
      resolved: number;
      closed: number;
    }>('/api/support/stats');
  }

  async createSupportTicket(data: {
    subject: string;
    message: string;
    category?: string;
    priority?: string;
    customerEmail?: string;
    customerName?: string;
  }) {
    return this.request<{
      id: string;
      ticketNumber: string;
    }>('/api/support/tickets', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async addTicketMessage(ticketId: string, message: string) {
    return this.request<{ id: string }>(`/api/support/tickets/${ticketId}/messages`, {
      method: 'POST',
      body: JSON.stringify({ message }),
    });
  }

  async updateTicketStatus(ticketId: string, status: string) {
    return this.request<{ message: string }>(`/api/support/tickets/${ticketId}/status`, {
      method: 'PUT',
      body: JSON.stringify({ status }),
    });
  }

  async updateTicketPriority(ticketId: string, priority: string) {
    return this.request<{ message: string }>(`/api/support/tickets/${ticketId}/priority`, {
      method: 'PUT',
      body: JSON.stringify({ priority }),
    });
  }
}

export const apiClient = new ApiClient();

// Export currency service for direct use
export const currencyService = {
  getAvailableCurrencies: () => apiClient.getAvailableCurrencies(),
  convertCurrency: (amount: number, from: string, to: string, storeId?: string) =>
    apiClient.convertCurrency(amount, from, to, storeId),
  getStoreCurrency: (storeId: string) => apiClient.getStoreCurrency(storeId),
  updateStoreCurrency: (storeId: string, defaultCurrency: string, supportedCurrencies: string[]) =>
    apiClient.updateStoreCurrency(storeId, defaultCurrency, supportedCurrencies),
};

// Extend apiClient with additional methods
(apiClient as any).getStoreSEO = function(storeId: string) {
  return this.request(`/api/seo/store/${storeId}`);
};

(apiClient as any).updateStoreSEO = function(storeId: string, config: any) {
  return this.request(`/api/seo/store/${storeId}`, {
    method: 'PUT',
    body: JSON.stringify(config),
  });
};

(apiClient as any).getEmailTemplates = function() {
  return this.request('/api/email-templates');
};

(apiClient as any).getEmailTemplate = function(templateId: string) {
  return this.request(`/api/email-templates/${templateId}`);
};

(apiClient as any).updateEmailTemplate = function(templateId: string, updates: any) {
  return this.request(`/api/email-templates/${templateId}`, {
    method: 'PUT',
    body: JSON.stringify(updates),
  });
};

(apiClient as any).previewEmailTemplate = function(templateId: string, sampleVariables: Record<string, string>) {
  return this.request(`/api/email-templates/${templateId}/preview`, {
    method: 'POST',
    body: JSON.stringify({ sampleVariables }),
  });
};

// Additional methods for Developer, PaymentSettings pages
(apiClient as any).getApiKeys = function() {
  return this.listApiKeys();
};

(apiClient as any).getWebhooks = function() {
  return this.getWebhook();
};

(apiClient as any).createWebhook = function(url: string, events: string[]) {
  return this.configureWebhook(url, events);
};

// Backend has no PUT /webhooks; POST /webhooks upserts by merchant, so update = configure
(apiClient as any).updateWebhook = function(_id: string, url: string, events: string[]) {
  return this.configureWebhook(url, events);
};

(apiClient as any).getMerchantProfile = function() {
  return this.request('/api/auth/me');
};

(apiClient as any).updateMerchantProfile = function(updates: any) {
  return this.request('/api/auth/profile', {
    method: 'PUT',
    body: JSON.stringify(updates),
  });
};

(apiClient as any).getPaymentMethods = function() {
  // Return empty on any failure so UI doesn't break; errors are not surfaced to caller
  return this.request('/api/payments/methods').catch(() => ({ paymentMethods: [] }));
};

(apiClient as any).deletePaymentMethod = function(methodId: string) {
  return this.request(`/api/payments/methods/${methodId}`, { method: 'DELETE' });
};

export { ApiError };

