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

export interface CreateFieldConfigRequest {
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

export interface EntryFieldConfig {
  id: string;
  job_site_id: string;
  entry_type: EntryType;
  field_key: string;
  field_label: string;
  field_type: CustomFieldType;
  is_required: boolean;
  is_active: boolean;
  is_custom: boolean;
  options: CustomFieldOption[];
  validation: CustomFieldValidation;
  display_order: number;
  placeholder?: string;
  help_text?: string;
  created_at: string;
  updated_at: string;
}
