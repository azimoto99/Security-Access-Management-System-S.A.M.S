import api from './api';

export interface EmergencyMode {
  id: string;
  job_site_id?: string;
  activated_by: string;
  activated_at: string;
  deactivated_by?: string;
  deactivated_at?: string;
  reason?: string;
  actions_taken: any[];
  summary_report?: string;
  is_active: boolean;
  activated_by_username?: string;
  deactivated_by_username?: string;
  job_site_name?: string;
}

export interface CreateEmergencyModeData {
  job_site_id?: string;
  reason?: string;
}

export interface BulkExitData {
  emergency_mode_id: string;
  job_site_id: string;
  entry_ids?: string[];
}

export const emergencyService = {
  /**
   * Get active emergency modes
   */
  getActiveEmergencyModes: async (): Promise<EmergencyMode[]> => {
    const response = await api.get<{ success: boolean; data: { emergency_modes: EmergencyMode[] } }>('/emergency/active');
    return response.data.data.emergency_modes;
  },

  /**
   * Activate emergency mode
   */
  activateEmergencyMode: async (data: CreateEmergencyModeData): Promise<EmergencyMode> => {
    const response = await api.post<{ success: boolean; data: { emergency_mode: EmergencyMode } }>('/emergency/activate', data);
    return response.data.data.emergency_mode;
  },

  /**
   * Deactivate emergency mode
   */
  deactivateEmergencyMode: async (id: string, summaryReport?: string): Promise<EmergencyMode> => {
    const response = await api.post<{ success: boolean; data: { emergency_mode: EmergencyMode } }>(
      `/emergency/${id}/deactivate`,
      { summary_report: summaryReport }
    );
    return response.data.data.emergency_mode;
  },

  /**
   * Process bulk exit
   */
  processBulkExit: async (data: BulkExitData): Promise<{ exited_count: number; entries: any[] }> => {
    const response = await api.post<{ success: boolean; data: { exited_count: number; entries: any[] } }>(
      '/emergency/bulk-exit',
      data
    );
    return response.data.data;
  },

  /**
   * Get emergency occupancy
   */
  getEmergencyOccupancy: async (jobSiteId?: string): Promise<any> => {
    const params = jobSiteId ? { job_site_id: jobSiteId } : {};
    const response = await api.get<{ success: boolean; data: any }>('/emergency/occupancy', { params });
    return response.data.data;
  },

  /**
   * Get emergency mode history
   */
  getEmergencyModeHistory: async (limit?: number, offset?: number): Promise<{ emergency_modes: EmergencyMode[]; total: number }> => {
    const params: any = {};
    if (limit) params.limit = limit;
    if (offset) params.offset = offset;
    const response = await api.get<{ success: boolean; data: { emergency_modes: EmergencyMode[]; total: number } }>(
      '/emergency/history',
      { params }
    );
    return response.data.data;
  },
};
















