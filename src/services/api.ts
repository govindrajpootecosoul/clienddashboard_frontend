import api from '@/lib/api';
import type {
  User,
  Client,
  AdsConfig,
  MarketPlace,
  AnalyticsOverview,
  ApiResponse,
  PaginatedResponse,
} from '@/types';

// Auth APIs
export const authApi = {
  login: async (
    email: string,
    password: string
  ): Promise<ApiResponse<{ user: User; tokens: { accessToken: string; refreshToken: string } }>> => {
    const response = await api.post('/user/login', { email, password });
    return response.data;
  },

  signup: async (data: {
    name: string;
    email: string;
    password: string;
    phone?: string;
    role?: string;
    clientId?: string;
    databaseName?: string;
  }): Promise<ApiResponse<{ user: User; tokens: { accessToken: string; refreshToken: string } }>> => {
    try {
      const response = await api.post('/user/signup', data);
      return response.data;
    } catch (error: any) {
      // Re-throw with response data for better error handling
      if (error.response?.data) {
        const apiError = new Error(error.response.data.message || 'Failed to create user');
        (apiError as any).response = error.response;
        throw apiError;
      }
      throw error;
    }
  },

  refreshToken: async (refreshToken: string): Promise<ApiResponse<{ accessToken: string }>> => {
    const response = await api.post('/auth/refresh', { refreshToken });
    return response.data;
  },

  getMe: async (): Promise<ApiResponse<User>> => {
    const response = await api.get('/user/me');
    return response.data;
  },
};

// User APIs
export const userApi = {
  list: async (params?: { page?: number; limit?: number; search?: string; role?: string; status?: string; clientId?: string }): Promise<ApiResponse<PaginatedResponse<User>>> => {
    const response = await api.get('/user', { params });
    return response.data;
  },

  getById: async (id: string): Promise<ApiResponse<User>> => {
    const response = await api.get(`/user/${id}`);
    return response.data;
  },

  update: async (id: string, data: Partial<User>): Promise<ApiResponse<User>> => {
    const response = await api.patch(`/user/${id}`, data);
    return response.data;
  },

  delete: async (id: string): Promise<ApiResponse<void>> => {
    const response = await api.delete(`/user/${id}`);
    return response.data;
  },
};

// Client APIs
export const clientApi = {
  list: async (params?: { page?: number; limit?: number; search?: string; account_status?: string }): Promise<ApiResponse<PaginatedResponse<Client>>> => {
    const response = await api.get('/clients', { params });
    return response.data;
  },

  getById: async (clientId: string): Promise<ApiResponse<Client>> => {
    const response = await api.get(`/clients/${clientId}`);
    return response.data;
  },

  create: async (data: Partial<Client>): Promise<ApiResponse<Client>> => {
    const response = await api.post('/clients', data);
    return response.data;
  },

  update: async (clientId: string, data: Partial<Client>): Promise<ApiResponse<Client>> => {
    const response = await api.patch(`/clients/${clientId}`, data);
    return response.data;
  },
};

// Ads Config APIs
export const adsConfigApi = {
  list: async (clientId: string, params?: { page?: number; limit?: number }): Promise<ApiResponse<AdsConfig[]>> => {
    const response = await api.get(`/clients/${clientId}/ads-config`, { params });
    return response.data;
  },

  upsert: async (clientId: string, data: Partial<AdsConfig>): Promise<ApiResponse<AdsConfig>> => {
    const response = await api.post(`/clients/${clientId}/ads-config`, data);
    return response.data;
  },

  update: async (id: string, data: Partial<AdsConfig>): Promise<ApiResponse<AdsConfig>> => {
    const response = await api.patch(`/ads-config/${id}`, data);
    return response.data;
  },
};

// Market Place APIs
export const marketPlaceApi = {
  get: async (clientId: string): Promise<ApiResponse<MarketPlace>> => {
    const response = await api.get(`/clients/${clientId}/market-places`);
    return response.data;
  },

  upsert: async (clientId: string, data: Partial<MarketPlace>): Promise<ApiResponse<MarketPlace>> => {
    const response = await api.post(`/clients/${clientId}/market-places`, data);
    return response.data;
  },
};

// Analytics APIs
export const analyticsApi = {
  getOverview: async (): Promise<ApiResponse<AnalyticsOverview>> => {
    const response = await api.get('/analytics/overview');
    return response.data;
  },
};

// Search API
export const searchApi = {
  global: async (query: string): Promise<ApiResponse<any>> => {
    const response = await api.get('/search', { params: { q: query } });
    return response.data;
  },
};

