export type UserRole = 'super_admin' | 'admin' | 'manager' | 'analyst';
export type UserStatus = 'ACTIVE' | 'INACTIVE';
export type AccountStatus = 'ACTIVE' | 'INACTIVE';
export type AdsConfigType = 'seller' | 'vendor';

export interface User {
  _id: string;
  name: string;
  email: string;
  phone?: string;
  role: UserRole;
  clientId?: string | null;
  databaseName?: string | null;
  status: UserStatus;
  lastLoginAt?: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface Client {
  _id: string;
  client_name: string;
  client_business_name?: string;
  client_address?: string;
  gstin_number?: string;
  business_email?: string;
  business_phone?: string;
  storage_container_name?: string;
  business_logo?: string;
  account_status: AccountStatus;
  client_id: string;
  uid: string;
  createdByUserId: string;
  updatedByUserId?: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface AdsConfig {
  _id: string;
  clientId: string;
  account_id: string;
  api_end_point: string;
  client_id: string;
  client_secret_id: string;
  refresh_token: string;
  refresh_token_updated_at?: string;
  return_url: string;
  market_place_id: string;
  region: string;
  type: AdsConfigType;
  enable: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface RegionConfig {
  api_endpoint: string;
  market_place: string;
  enable: boolean;
  country_code: string;
  country_name: string;
  refresh_token: string;
  lastUpdatedAt?: string;
}

export interface MarketPlace {
  _id: string;
  clientId: string;
  market_place_name: string;
  market_app_id: string;
  market_client_secret: string;
  regionConfigs: RegionConfig[];
  createdAt: string;
  updatedAt: string;
}

export interface AnalyticsOverview {
  totalClients: number;
  totalUsers: number;
  activeClients: number;
  activeUsers: number;
  totalAdsConfigs: number;
  totalMarketPlaces: number;
}

export interface ApiResponse<T = any> {
  success: boolean;
  message?: string;
  data?: T;
  error?: string;
}

export interface PaginatedResponse<T> {
  data: T[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

