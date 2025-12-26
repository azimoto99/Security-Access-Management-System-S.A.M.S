import api from './api';
import type { ApiResponse } from './api';
import type { CustomField, CreateCustomFieldData, UpdateCustomFieldData, EntryType } from './customFieldService';

// Re-export CustomField type for convenience
export type { CustomField, CreateCustomFieldData, UpdateCustomFieldData, EntryType };

export const exitFieldService = {
  /**
   * Get all exit field configurations for a job site
   */
  async getExitFields(jobSiteId: string, entryType?: EntryType): Promise<CustomField[]> {
    const params: Record<string, string> = { job_site_id: jobSiteId };
    if (entryType) {
      params.entry_type = entryType;
    }

    const response = await api.get<ApiResponse<{ exitFields: CustomField[]; fieldConfigs?: CustomField[] }>>('/exit-fields', { params });

    if (!response.data.success || !response.data.data) {
      throw new Error('Failed to fetch exit field configurations');
    }

    return response.data.data.fieldConfigs || response.data.data.exitFields;
  },

  /**
   * Create a new exit field
   */
  async createExitField(data: CreateCustomFieldData): Promise<CustomField> {
    const response = await api.post<ApiResponse<{ exitField: CustomField }>>('/exit-fields', data);

    if (!response.data.success || !response.data.data) {
      throw new Error(response.data.error?.message || 'Failed to create exit field');
    }

    return response.data.data.exitField;
  },

  /**
   * Update an exit field
   */
  async updateExitField(id: string, data: UpdateCustomFieldData): Promise<CustomField> {
    const response = await api.put<ApiResponse<{ exitField: CustomField }>>(`/exit-fields/${id}`, data);

    if (!response.data.success || !response.data.data) {
      throw new Error(response.data.error?.message || 'Failed to update exit field');
    }

    return response.data.data.exitField;
  },

  /**
   * Delete an exit field
   */
  async deleteExitField(id: string): Promise<void> {
    const response = await api.delete<ApiResponse>(`/exit-fields/${id}`);

    if (!response.data.success) {
      throw new Error(response.data.error?.message || 'Failed to delete exit field');
    }
  },
};

