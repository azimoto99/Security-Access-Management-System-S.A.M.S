import api from './api';
import type { ApiResponse } from './api';

export interface User {
  id: string;
  username: string;
  role: 'guard' | 'admin' | 'employee' | 'client';
  job_site_access?: string[];
  employee_id?: string;
  onboarding_status?: 'pending' | 'in_progress' | 'completed';
  created_at?: string;
  is_active?: boolean;
}

export interface LoginCredentials {
  username: string;
  password: string;
}

export interface LoginResponse {
  user: User;
  accessToken: string;
  refreshToken: string;
}

export interface RefreshResponse {
  accessToken: string;
}

export const authService = {
  /**
   * Login user
   */
  async login(credentials: LoginCredentials): Promise<LoginResponse> {
    const response = await api.post<ApiResponse<LoginResponse>>('/auth/login', credentials);
    if (response.data.success && response.data.data) {
      // Store tokens and user info
      localStorage.setItem('accessToken', response.data.data.accessToken);
      localStorage.setItem('refreshToken', response.data.data.refreshToken);
      localStorage.setItem('user', JSON.stringify(response.data.data.user));
      return response.data.data;
    }
    throw new Error(response.data.error?.message || 'Login failed');
  },

  /**
   * Logout user
   */
  async logout(): Promise<void> {
    try {
      await api.post('/auth/logout');
    } catch (error) {
      // Continue with logout even if API call fails
      console.error('Logout API call failed:', error);
    } finally {
      // Clear local storage
      localStorage.removeItem('accessToken');
      localStorage.removeItem('refreshToken');
      localStorage.removeItem('user');
    }
  },

  /**
   * Refresh access token
   */
  async refreshToken(): Promise<string> {
    const refreshToken = localStorage.getItem('refreshToken');
    if (!refreshToken) {
      throw new Error('No refresh token available');
    }

    const response = await api.post<ApiResponse<RefreshResponse>>('/auth/refresh', {
      refreshToken,
    });

    if (response.data.success && response.data.data?.accessToken) {
      localStorage.setItem('accessToken', response.data.data.accessToken);
      return response.data.data.accessToken;
    }

    throw new Error(response.data.error?.message || 'Token refresh failed');
  },

  /**
   * Get current user
   */
  async getCurrentUser(): Promise<User> {
    const response = await api.get<ApiResponse<{ user: User }>>('/auth/me');
    if (response.data.success && response.data.data?.user) {
      localStorage.setItem('user', JSON.stringify(response.data.data.user));
      return response.data.data.user;
    }
    throw new Error(response.data.error?.message || 'Failed to get current user');
  },

  /**
   * Request password reset
   */
  async requestPasswordReset(username: string): Promise<void> {
    const response = await api.post<ApiResponse>('/auth/request-password-reset', { username });
    if (!response.data.success) {
      throw new Error(response.data.error?.message || 'Password reset request failed');
    }
  },

  /**
   * Reset password with token
   */
  async resetPassword(token: string, newPassword: string): Promise<void> {
    const response = await api.post<ApiResponse>('/auth/reset-password', { token, newPassword });
    if (!response.data.success) {
      throw new Error(response.data.error?.message || 'Password reset failed');
    }
  },

  /**
   * Change own password (self-service)
   */
  async changeOwnPassword(newPassword: string): Promise<void> {
    const response = await api.post<ApiResponse<{ message: string }>>('/auth/change-password', { newPassword });
    if (!response.data.success) {
      throw new Error(response.data.error?.message || 'Failed to change password');
    }
  },

  /**
   * Get stored user from localStorage
   */
  getStoredUser(): User | null {
    const userStr = localStorage.getItem('user');
    if (userStr) {
      try {
        return JSON.parse(userStr);
      } catch {
        return null;
      }
    }
    return null;
  },

  /**
   * Check if user is authenticated
   */
  isAuthenticated(): boolean {
    return !!localStorage.getItem('accessToken');
  },
};



