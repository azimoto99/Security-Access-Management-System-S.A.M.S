import axios, { type AxiosInstance, type AxiosError } from 'axios';

// Auto-detect API URL if not set in environment
// Note: Vite env vars are embedded at build time, but we can use runtime detection as fallback
const getApiBaseUrl = (): string => {
  // Use environment variable if set (embedded at build time)
  const envApiUrl = import.meta.env.VITE_API_BASE_URL;
  if (envApiUrl) {
    return envApiUrl;
  }
  
  // Runtime detection for production
  if (typeof window !== 'undefined') {
    const host = window.location.hostname;
    
    // If on Render frontend, use known backend URL
    if (host.includes('onrender.com')) {
      return 'https://security-access-management-system-s-a-m-s.onrender.com/api';
    }
    
    // For custom domains (like fixer.gg), use known backend URL
    // You should set VITE_API_BASE_URL in Render for production
    if (host === 'fixer.gg' || host.includes('fixer.gg')) {
      return 'https://security-access-management-system-s-a-m-s.onrender.com/api';
    }
  }
  
  // Development default
  return 'http://localhost:3001/api';
};

const API_BASE_URL = getApiBaseUrl();

export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  error?: {
    code: string;
    message: string;
    details?: Record<string, any>;
  };
}

class ApiService {
  private client: AxiosInstance;

  constructor() {
    this.client = axios.create({
      baseURL: API_BASE_URL,
      headers: {
        'Content-Type': 'application/json',
      },
    });

    // Request interceptor to add auth token
    this.client.interceptors.request.use(
      (config) => {
        const token = localStorage.getItem('accessToken');
        if (token) {
          config.headers.Authorization = `Bearer ${token}`;
        }
        return config;
      },
      (error) => {
        return Promise.reject(error);
      }
    );

    // Response interceptor to handle token refresh
    this.client.interceptors.response.use(
      (response) => response,
      async (error: AxiosError<ApiResponse>) => {
        const originalRequest = error.config as any;

        // If token expired, try to refresh
        if (error.response?.status === 401 && !originalRequest._retry) {
          originalRequest._retry = true;

          try {
            const refreshToken = localStorage.getItem('refreshToken');
            if (refreshToken) {
              const response = await axios.post<ApiResponse<{ accessToken: string }>>(
                `${API_BASE_URL}/auth/refresh`,
                { refreshToken }
              );

              if (response.data.success && response.data.data?.accessToken) {
                localStorage.setItem('accessToken', response.data.data.accessToken);
                originalRequest.headers.Authorization = `Bearer ${response.data.data.accessToken}`;
                return this.client(originalRequest);
              }
            }
          } catch (refreshError) {
            // Refresh failed, clear tokens and redirect to login
            localStorage.removeItem('accessToken');
            localStorage.removeItem('refreshToken');
            localStorage.removeItem('user');
            window.location.href = '/login';
            return Promise.reject(refreshError);
          }
        }

        return Promise.reject(error);
      }
    );
  }

  get instance(): AxiosInstance {
    return this.client;
  }
}

export const apiService = new ApiService();
export default apiService.instance;



