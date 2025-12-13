import api from './api';
import { ApiResponse } from './api';

export interface JobSite {
  id: string;
  name: string;
  address: string;
  contact_info: Record<string, any>;
  vehicle_capacity: number;
  visitor_capacity: number;
  truck_capacity: number;
  is_active: boolean;
  created_at: string;
}

export interface CreateJobSiteData {
  name: string;
  address: string;
  contact_info?: Record<string, any>;
  vehicle_capacity?: number;
  visitor_capacity?: number;
  truck_capacity?: number;
}

export interface UpdateJobSiteData {
  name?: string;
  address?: string;
  contact_info?: Record<string, any>;
  vehicle_capacity?: number;
  visitor_capacity?: number;
  truck_capacity?: number;
}

export const jobSiteService = {
  /**
   * Get all job sites
   */
  async getAllJobSites(activeOnly?: boolean): Promise<JobSite[]> {
    const params = activeOnly ? { active_only: 'true' } : {};
    const response = await api.get<ApiResponse<{ jobSites: JobSite[] }>>('/job-sites', { params });
    if (response.data.success && response.data.data) {
      return response.data.data.jobSites;
    }
    throw new Error(response.data.error?.message || 'Failed to fetch job sites');
  },

  /**
   * Get job site by ID
   */
  async getJobSiteById(id: string): Promise<JobSite> {
    const response = await api.get<ApiResponse<{ jobSite: JobSite }>>(`/job-sites/${id}`);
    if (response.data.success && response.data.data) {
      return response.data.data.jobSite;
    }
    throw new Error(response.data.error?.message || 'Failed to fetch job site');
  },

  /**
   * Create new job site
   */
  async createJobSite(data: CreateJobSiteData): Promise<JobSite> {
    const response = await api.post<ApiResponse<{ jobSite: JobSite }>>('/job-sites', data);
    if (response.data.success && response.data.data) {
      return response.data.data.jobSite;
    }
    throw new Error(response.data.error?.message || 'Failed to create job site');
  },

  /**
   * Update job site
   */
  async updateJobSite(id: string, data: UpdateJobSiteData): Promise<JobSite> {
    const response = await api.put<ApiResponse<{ jobSite: JobSite }>>(`/job-sites/${id}`, data);
    if (response.data.success && response.data.data) {
      return response.data.data.jobSite;
    }
    throw new Error(response.data.error?.message || 'Failed to update job site');
  },

  /**
   * Activate job site
   */
  async activateJobSite(id: string): Promise<JobSite> {
    const response = await api.post<ApiResponse<{ jobSite: JobSite }>>(`/job-sites/${id}/activate`);
    if (response.data.success && response.data.data) {
      return response.data.data.jobSite;
    }
    throw new Error(response.data.error?.message || 'Failed to activate job site');
  },

  /**
   * Deactivate job site
   */
  async deactivateJobSite(id: string): Promise<JobSite> {
    const response = await api.post<ApiResponse<{ jobSite: JobSite }>>(`/job-sites/${id}/deactivate`);
    if (response.data.success && response.data.data) {
      return response.data.data.jobSite;
    }
    throw new Error(response.data.error?.message || 'Failed to deactivate job site');
  },

  /**
   * Delete job site
   */
  async deleteJobSite(id: string): Promise<void> {
    const response = await api.delete<ApiResponse>(`/job-sites/${id}`);
    if (!response.data.success) {
      throw new Error(response.data.error?.message || 'Failed to delete job site');
    }
  },
};



