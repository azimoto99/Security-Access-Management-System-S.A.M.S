import api from './api';
import type { ApiResponse } from './api';

export type CustomFieldType = 'text' | 'number' | 'select' | 'date' | 'boolean' | 'textarea' | 'email' | 'phone';
export type EntryType = 'vehicle' | 'visitor' | 'truck';

export interface CustomFieldOption {
  value: string;
  label: string;
}

export interface CustomFieldValidation {
  minLength?: number;
  maxLength?: number;
  min?: number;
  max?: number;
  pattern?: string;
}

export interface CustomField {
  id: string;
  job_site_id: string;
  entry_type: EntryType;
  field_key: string;
  field_label: string;
  field_type: CustomFieldType;
  is_required: boolean;
  is_active: boolean;
  is_custom: boolean; // true for custom fields, false for standard fields
  options: CustomFieldOption[];
  validation: CustomFieldValidation;
  display_order: number;
  placeholder?: string;
  help_text?: string;
  created_at: string;
  updated_at: string;
}

export interface CreateCustomFieldData {
  job_site_id: string;
  entry_type: EntryType;
  field_key: string;
  field_label: string;
  field_type: CustomFieldType;
  is_required?: boolean;
  is_active?: boolean;
  options?: CustomFieldOption[];
  validation?: CustomFieldValidation;
  display_order?: number;
  placeholder?: string;
  help_text?: string;
}

export interface UpdateCustomFieldData {
  field_label?: string;
  field_type?: CustomFieldType;
  is_required?: boolean;
  is_active?: boolean;
  options?: CustomFieldOption[];
  validation?: CustomFieldValidation;
  display_order?: number;
  placeholder?: string;
  help_text?: string;
}

export interface ReorderCustomFieldsData {
  job_site_id: string;
  entry_type: EntryType;
  field_ids: string[];
}

export const customFieldService = {
  /**
   * Get all field configurations (both standard and custom) for a job site
   */
  async getCustomFields(jobSiteId: string, entryType?: EntryType): Promise<CustomField[]> {
    const params: Record<string, string> = { job_site_id: jobSiteId };
    if (entryType) {
      params.entry_type = entryType;
    }

    const response = await api.get<ApiResponse<{ customFields: CustomField[]; fieldConfigs?: CustomField[] }>>('/custom-fields', { params });

    if (!response.data.success || !response.data.data) {
      throw new Error('Failed to fetch field configurations');
    }

    // Support both legacy and new response format
    return response.data.data.fieldConfigs || response.data.data.customFields;
  },

  /**
   * Get a single custom field by ID
   */
  async getCustomFieldById(id: string): Promise<CustomField> {
    const response = await api.get<ApiResponse<{ customField: CustomField }>>(`/custom-fields/${id}`);

    if (!response.data.success || !response.data.data) {
      throw new Error('Failed to fetch custom field');
    }

    return response.data.data.customField;
  },

  /**
   * Create a new custom field
   */
  async createCustomField(data: CreateCustomFieldData): Promise<CustomField> {
    const response = await api.post<ApiResponse<{ customField: CustomField }>>('/custom-fields', data);

    if (!response.data.success || !response.data.data) {
      throw new Error(response.data.error?.message || 'Failed to create custom field');
    }

    return response.data.data.customField;
  },

  /**
   * Update a custom field
   */
  async updateCustomField(id: string, data: UpdateCustomFieldData): Promise<CustomField> {
    const response = await api.put<ApiResponse<{ customField: CustomField }>>(`/custom-fields/${id}`, data);

    if (!response.data.success || !response.data.data) {
      throw new Error(response.data.error?.message || 'Failed to update custom field');
    }

    return response.data.data.customField;
  },

  /**
   * Delete a custom field
   */
  async deleteCustomField(id: string): Promise<void> {
    const response = await api.delete<ApiResponse>(`/custom-fields/${id}`);

    if (!response.data.success) {
      throw new Error(response.data.error?.message || 'Failed to delete custom field');
    }
  },

  /**
   * Reorder custom fields
   */
  async reorderCustomFields(data: ReorderCustomFieldsData): Promise<void> {
    const response = await api.post<ApiResponse>('/custom-fields/reorder', data);

    if (!response.data.success) {
      throw new Error(response.data.error?.message || 'Failed to reorder custom fields');
    }
  },
};

