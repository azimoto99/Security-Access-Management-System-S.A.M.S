import api from './api';
import { ApiResponse } from './api';

export interface OccupancyCounts {
  vehicles: number;
  visitors: number;
  trucks: number;
  total: number;
}

export interface JobSiteOccupancy {
  job_site_id: string;
  job_site_name: string;
  counts: OccupancyCounts;
  capacity: {
    vehicles: number;
    visitors: number;
    trucks: number;
  };
  warnings: {
    vehicles: boolean;
    visitors: boolean;
    trucks: boolean;
  };
}

export const occupancyService = {
  /**
   * Get occupancy for all job sites
   */
  async getAllOccupancy(): Promise<JobSiteOccupancy[]> {
    const response = await api.get<ApiResponse<{ occupancies: JobSiteOccupancy[] }>>('/occupancy');
    if (response.data.success && response.data.data) {
      return response.data.data.occupancies;
    }
    throw new Error(response.data.error?.message || 'Failed to fetch occupancy');
  },

  /**
   * Get occupancy for a specific job site
   */
  async getJobSiteOccupancy(jobSiteId: string): Promise<JobSiteOccupancy> {
    const response = await api.get<ApiResponse<{ occupancy: JobSiteOccupancy }>>(
      `/occupancy/${jobSiteId}`
    );
    if (response.data.success && response.data.data) {
      return response.data.data.occupancy;
    }
    throw new Error(response.data.error?.message || 'Failed to fetch occupancy');
  },

  /**
   * Get detailed breakdown for a job site
   */
  async getJobSiteBreakdown(jobSiteId: string): Promise<any[]> {
    const response = await api.get<ApiResponse<{ breakdown: any[] }>>(
      `/occupancy/${jobSiteId}/breakdown`
    );
    if (response.data.success && response.data.data) {
      return response.data.data.breakdown;
    }
    throw new Error(response.data.error?.message || 'Failed to fetch breakdown');
  },
};



