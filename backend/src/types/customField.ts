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
  required?: boolean;
}

export interface EntryFieldConfig {
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
  created_at: Date;
  updated_at: Date;
}

// Legacy alias for backward compatibility
export type CustomField = EntryFieldConfig;

export interface CreateFieldConfigRequest {
  job_site_id: string;
  entry_type: EntryType;
  field_key: string;
  field_label: string;
  field_type: CustomFieldType;
  is_required?: boolean;
  is_active?: boolean;
  is_custom?: boolean;
  options?: CustomFieldOption[];
  validation?: CustomFieldValidation;
  display_order?: number;
  placeholder?: string;
  help_text?: string;
}

export interface UpdateFieldConfigRequest {
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

// Legacy aliases for backward compatibility
export type CreateCustomFieldRequest = CreateFieldConfigRequest;
export type UpdateCustomFieldRequest = UpdateFieldConfigRequest;

