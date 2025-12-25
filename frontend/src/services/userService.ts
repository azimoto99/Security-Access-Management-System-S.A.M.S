import api from './api';

export interface User {
  id: string;
  username: string;
  role: 'guard' | 'admin' | 'employee' | 'client';
  job_site_access: string[];
  employee_id?: string;
  onboarding_status?: 'pending' | 'in_progress' | 'completed';
  created_at: string;
  is_active: boolean;
}

export interface CreateUserData {
  username: string;
  password: string;
  role: 'guard' | 'admin' | 'employee' | 'client';
  job_site_access?: string[];
  employee_id?: string;
}

export interface UpdateUserData {
  username?: string;
  role?: 'guard' | 'admin' | 'employee' | 'client';
  job_site_access?: string[];
  employee_id?: string;
  onboarding_status?: 'pending' | 'in_progress' | 'completed' | null;
}

export interface ResetPasswordResponse {
  temporary_password: string;
}

export const userService = {
  /**
   * Get all users
   */
  getAllUsers: async (): Promise<User[]> => {
    const response = await api.get<{ success: boolean; data: { users: User[] } }>('/users');
    return response.data.data.users;
  },

  /**
   * Get user by ID
   */
  getUserById: async (id: string): Promise<User> => {
    const response = await api.get<{ success: boolean; data: { user: User } }>(`/users/${id}`);
    return response.data.data.user;
  },

  /**
   * Create new user
   */
  createUser: async (data: CreateUserData): Promise<User> => {
    const response = await api.post<{ success: boolean; data: { user: User } }>('/users', data);
    return response.data.data.user;
  },

  /**
   * Update user
   */
  updateUser: async (id: string, data: UpdateUserData): Promise<User> => {
    const response = await api.put<{ success: boolean; data: { user: User } }>(`/users/${id}`, data);
    return response.data.data.user;
  },

  /**
   * Activate user
   */
  activateUser: async (id: string): Promise<User> => {
    const response = await api.post<{ success: boolean; data: { user: User } }>(`/users/${id}/activate`);
    return response.data.data.user;
  },

  /**
   * Deactivate user
   */
  deactivateUser: async (id: string): Promise<User> => {
    const response = await api.post<{ success: boolean; data: { user: User } }>(`/users/${id}/deactivate`);
    return response.data.data.user;
  },

  /**
   * Change user password (set specific password)
   */
  changeUserPassword: async (id: string, password: string): Promise<void> => {
    await api.post<{ success: boolean; message: string }>(`/users/${id}/change-password`, { password });
  },

  /**
   * Reset user password (generate temporary password)
   */
  resetUserPassword: async (id: string): Promise<ResetPasswordResponse> => {
    const response = await api.post<{ success: boolean; data: ResetPasswordResponse }>(`/users/${id}/reset-password`);
    return response.data.data;
  },
};






