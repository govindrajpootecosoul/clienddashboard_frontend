import axios, { AxiosError, InternalAxiosRequestConfig } from 'axios';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000/api';

// Log API URL in development (only once)
if (typeof window !== 'undefined' && process.env.NODE_ENV === 'development') {
  console.log('API URL:', API_URL);
}

export const api = axios.create({
  baseURL: API_URL,
  withCredentials: true,
  timeout: 10000, // 10 second timeout
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor to add auth token
api.interceptors.request.use(
  (config: InternalAxiosRequestConfig) => {
    const token = typeof window !== 'undefined' ? localStorage.getItem('accessToken') : null;
    if (token && config.headers) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor to handle token refresh
let isRefreshing = false;
let failedQueue: Array<{
  resolve: (value?: string | null) => void;
  reject: (reason?: unknown) => void;
}> = [];

const processQueue = (error: AxiosError | null, token: string | null = null) => {
  failedQueue.forEach((prom) => {
    if (error) {
      prom.reject(error);
    } else {
      prom.resolve(token);
    }
  });
  failedQueue = [];
};

api.interceptors.response.use(
  (response) => response,
  async (error: AxiosError<unknown>) => {
    const originalRequest = error.config as InternalAxiosRequestConfig & { _retry?: boolean };

    // Handle network errors (no response from server)
    if (!error.response) {
      let errorMessage = 'Network error: Unable to connect to server.';
      
      if (error.code === 'ECONNABORTED') {
        errorMessage = 'Request timeout: Server took too long to respond.';
      } else if (error.code === 'ERR_NETWORK' || error.message.includes('Network Error')) {
        errorMessage = `Network error: Unable to connect to ${API_URL}. Please ensure the backend server is running on port 4000.`;
      } else if (error.code === 'ECONNREFUSED') {
        errorMessage = 'Connection refused: Backend server is not running or not accessible.';
      }
      
      // Create a new error with the improved message
      const networkError = new Error(errorMessage);
      (networkError as any).code = error.code;
      (networkError as any).config = error.config;
      return Promise.reject(networkError);
    }

    // Don't try to refresh token for login/signup endpoints
    const isAuthEndpoint = originalRequest.url?.includes('/user/login') || 
                          originalRequest.url?.includes('/user/signup') ||
                          originalRequest.url?.includes('/auth/refresh');

    if (error.response?.status === 401 && !originalRequest._retry && !isAuthEndpoint) {
      if (isRefreshing) {
        return new Promise((resolve, reject) => {
          failedQueue.push({ resolve, reject });
        })
          .then((token) => {
            if (originalRequest.headers && token) {
              originalRequest.headers.Authorization = `Bearer ${token}`;
            }
            return api(originalRequest);
          })
          .catch((err) => {
            return Promise.reject(err);
          });
      }

      originalRequest._retry = true;
      isRefreshing = true;

      try {
        const refreshToken = typeof window !== 'undefined' ? localStorage.getItem('refreshToken') : null;
        if (!refreshToken) {
          // Only redirect if there's no refresh token at all
          // This means user was never properly logged in or manually cleared tokens
          throw new Error('No refresh token');
        }

        const response = await axios.post<{ data: { accessToken: string } }>(`${API_URL}/auth/refresh`, {
          refreshToken,
        });

        const { accessToken } = response.data.data;
        if (typeof window !== 'undefined') {
          localStorage.setItem('accessToken', accessToken);
        }

        processQueue(null, accessToken);
        if (originalRequest.headers) {
          originalRequest.headers.Authorization = `Bearer ${accessToken}`;
        }

        return api(originalRequest);
      } catch (refreshError: any) {
        processQueue(refreshError as AxiosError, null);
        
        // Only clear tokens if refresh token is truly expired/invalid (401/403)
        // Don't auto-redirect to login - let user manually logout when they want
        if (refreshError?.response?.status === 401 || refreshError?.response?.status === 403) {
          if (typeof window !== 'undefined') {
            // Clear tokens but don't redirect - user stays on current page
            // They can manually logout via logout button when ready
            localStorage.removeItem('accessToken');
            localStorage.removeItem('refreshToken');
            console.warn('Session expired - tokens cleared. User can manually logout when ready.');
            // Don't redirect - respect user's choice to logout manually
          }
        }
        
        return Promise.reject(refreshError);
      } finally {
        isRefreshing = false;
      }
    }

    // Handle API errors with response
    if (error.response?.data) {
      const errorData = error.response.data as any;
      const errorMessage = errorData.message || errorData.error || 'Something went wrong';
      const apiError = new Error(errorMessage);
      (apiError as any).response = error.response;
      (apiError as any).status = error.response.status;
      return Promise.reject(apiError);
    }

    return Promise.reject(error);
  }
);

export default api;

