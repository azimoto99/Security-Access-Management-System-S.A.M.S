import {
  VehicleEntryData,
  VisitorEntryData,
  TruckEntryData,
  EntryType,
  EntryStatus,
  CreateEntryRequest,
  ExitEntryRequest,
  SearchEntriesRequest,
} from '../types/entry';
import { AppError } from '../middleware/errorHandler';
import type { EntryFieldConfig } from '../types/customField';

// Re-export types for convenience
export type {
  EntryType,
  EntryStatus,
  CreateEntryRequest,
  ExitEntryRequest,
  SearchEntriesRequest,
  VehicleEntryData,
  VisitorEntryData,
  TruckEntryData,
};

/**
 * Validate vehicle entry data
 */
export const validateVehicleEntry = (data: any, fieldConfigs?: EntryFieldConfig[]): VehicleEntryData & Record<string, any> => {
  const validatedData: any = {};

  if (fieldConfigs && fieldConfigs.length > 0) {
    // Dynamic validation based on field configurations
    fieldConfigs.forEach((field) => {
      if (field.is_active) {
        const value = data[field.field_key];

        // Validate required fields
        if (field.is_required) {
          if (value === undefined || value === null || value === '') {
            throw new Error(`${field.field_label} is required`);
          }
        }

        // Add field value if present
        if (value !== undefined && value !== null) {
          if (field.field_type === 'number') {
            const numValue = Number(value);
            if (isNaN(numValue)) {
              throw new Error(`${field.field_label} must be a number`);
            }
            validatedData[field.field_key] = numValue;
          } else if (field.field_type === 'boolean') {
            validatedData[field.field_key] = Boolean(value);
          } else if (field.field_type === 'date' && value) {
            // Validate date format
            const date = new Date(value);
            if (isNaN(date.getTime())) {
              throw new Error(`${field.field_label} must be a valid date`);
            }
            validatedData[field.field_key] = value;
          } else if (field.field_type === 'email' && value) {
            // Basic email validation
            const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
            if (!emailRegex.test(value)) {
              throw new Error(`${field.field_label} must be a valid email address`);
            }
            validatedData[field.field_key] = value.trim();
          } else if (field.field_type === 'phone' && value) {
            // Basic phone validation (allow various formats)
            const phoneRegex = /^[\+]?[\d\s\-\(\)]{10,}$/;
            if (!phoneRegex.test(value.replace(/\s/g, ''))) {
              throw new Error(`${field.field_label} must be a valid phone number`);
            }
            validatedData[field.field_key] = value.trim();
          } else if (typeof value === 'string') {
            validatedData[field.field_key] = value.trim();
          } else {
            validatedData[field.field_key] = value;
          }
        }
      }
    });
  } else {
    // Fallback to hardcoded validation for backward compatibility
    if (!data.license_plate || typeof data.license_plate !== 'string' || data.license_plate.trim().length === 0) {
      throw new Error('License plate is required');
    }

    if (!data.vehicle_type || typeof data.vehicle_type !== 'string' || data.vehicle_type.trim().length === 0) {
      throw new Error('Vehicle type is required');
    }

    if (!data.driver_name || typeof data.driver_name !== 'string' || data.driver_name.trim().length === 0) {
      throw new Error('Driver name is required');
    }

    if (!data.purpose || typeof data.purpose !== 'string' || data.purpose.trim().length === 0) {
      throw new Error('Purpose is required');
    }

    if (data.expected_duration !== undefined && (typeof data.expected_duration !== 'number' || data.expected_duration < 0)) {
      throw new Error('Expected duration must be a non-negative number');
    }

    validatedData.license_plate = data.license_plate.trim().toUpperCase();
    validatedData.vehicle_type = data.vehicle_type.trim();
    validatedData.driver_name = data.driver_name.trim();
    validatedData.company = data.company?.trim();
    validatedData.purpose = data.purpose.trim();
    validatedData.expected_duration = data.expected_duration;
  }

  return validatedData;
};

/**
 * Validate visitor entry data
 */
export const validateVisitorEntry = (data: any, fieldConfigs?: EntryFieldConfig[]): VisitorEntryData & Record<string, any> => {
  const validatedData: any = {};

  if (fieldConfigs && fieldConfigs.length > 0) {
    // Dynamic validation based on field configurations
    fieldConfigs.forEach((field) => {
      if (field.is_active) {
        const value = data[field.field_key];

        // Validate required fields
        if (field.is_required) {
          if (value === undefined || value === null || value === '') {
            throw new Error(`${field.field_label} is required`);
          }
        }

        // Add field value if present
        if (value !== undefined && value !== null) {
          if (field.field_type === 'number') {
            const numValue = Number(value);
            if (isNaN(numValue)) {
              throw new Error(`${field.field_label} must be a number`);
            }
            validatedData[field.field_key] = numValue;
          } else if (field.field_type === 'boolean') {
            validatedData[field.field_key] = Boolean(value);
          } else if (field.field_type === 'date' && value) {
            // Validate date format
            const date = new Date(value);
            if (isNaN(date.getTime())) {
              throw new Error(`${field.field_label} must be a valid date`);
            }
            validatedData[field.field_key] = value;
          } else if (field.field_type === 'email' && value) {
            // Basic email validation
            const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
            if (!emailRegex.test(value)) {
              throw new Error(`${field.field_label} must be a valid email address`);
            }
            validatedData[field.field_key] = value.trim();
          } else if (field.field_type === 'phone' && value) {
            // Basic phone validation (allow various formats)
            const phoneRegex = /^[\+]?[\d\s\-\(\)]{10,}$/;
            if (!phoneRegex.test(value.replace(/\s/g, ''))) {
              throw new Error(`${field.field_label} must be a valid phone number`);
            }
            validatedData[field.field_key] = value.trim();
          } else if (typeof value === 'string') {
            validatedData[field.field_key] = value.trim();
          } else {
            validatedData[field.field_key] = value;
          }
        }
      }
    });
  } else {
    // Fallback to hardcoded validation for backward compatibility
    if (!data.name || typeof data.name !== 'string' || data.name.trim().length === 0) {
      throw new Error('Name is required');
    }

    if (!data.purpose || typeof data.purpose !== 'string' || data.purpose.trim().length === 0) {
      throw new Error('Purpose is required');
    }

    if (data.contact_phone && typeof data.contact_phone !== 'string') {
      throw new Error('Contact phone must be a string');
    }

    if (data.expected_duration !== undefined && (typeof data.expected_duration !== 'number' || data.expected_duration < 0)) {
      throw new Error('Expected duration must be a non-negative number');
    }

    validatedData.name = data.name.trim();
    validatedData.company = data.company?.trim();
    validatedData.contact_phone = data.contact_phone?.trim();
    validatedData.purpose = data.purpose.trim();
    validatedData.host_contact = data.host_contact?.trim();
    validatedData.expected_duration = data.expected_duration;
  }

  return validatedData;
};

/**
 * Validate truck entry data
 */
export const validateTruckEntry = (data: any, fieldConfigs?: EntryFieldConfig[]): TruckEntryData & Record<string, any> => {
  const validatedData: any = {};

  if (fieldConfigs && fieldConfigs.length > 0) {
    // Dynamic validation based on field configurations
    fieldConfigs.forEach((field) => {
      if (field.is_active) {
        const value = data[field.field_key];

        // Validate required fields
        if (field.is_required) {
          if (value === undefined || value === null || value === '') {
            throw new Error(`${field.field_label} is required`);
          }
        }

        // Add field value if present
        if (value !== undefined && value !== null) {
          if (field.field_type === 'number') {
            const numValue = Number(value);
            if (isNaN(numValue)) {
              throw new Error(`${field.field_label} must be a number`);
            }
            validatedData[field.field_key] = numValue;
          } else if (field.field_type === 'boolean') {
            validatedData[field.field_key] = Boolean(value);
          } else if (field.field_type === 'date' && value) {
            // Validate date format
            const date = new Date(value);
            if (isNaN(date.getTime())) {
              throw new Error(`${field.field_label} must be a valid date`);
            }
            validatedData[field.field_key] = value;
          } else if (field.field_type === 'email' && value) {
            // Basic email validation
            const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
            if (!emailRegex.test(value)) {
              throw new Error(`${field.field_label} must be a valid email address`);
            }
            validatedData[field.field_key] = value.trim();
          } else if (field.field_type === 'phone' && value) {
            // Basic phone validation (allow various formats)
            const phoneRegex = /^[\+]?[\d\s\-\(\)]{10,}$/;
            if (!phoneRegex.test(value.replace(/\s/g, ''))) {
              throw new Error(`${field.field_label} must be a valid phone number`);
            }
            validatedData[field.field_key] = value.trim();
          } else if (typeof value === 'string') {
            validatedData[field.field_key] = value.trim();
          } else {
            validatedData[field.field_key] = value;
          }
        }
      }
    });
  } else {
    // Fallback to hardcoded validation for backward compatibility
    if (!data.license_plate || typeof data.license_plate !== 'string' || data.license_plate.trim().length === 0) {
      throw new Error('License plate is required');
    }

    if (!data.company || typeof data.company !== 'string' || data.company.trim().length === 0) {
      throw new Error('Company is required');
    }

    if (!data.driver_name || typeof data.driver_name !== 'string' || data.driver_name.trim().length === 0) {
      throw new Error('Driver name is required');
    }

    if (!data.delivery_pickup || !['delivery', 'pickup'].includes(data.delivery_pickup)) {
      throw new Error('Delivery/pickup type must be either "delivery" or "pickup"');
    }

    if (data.expected_duration !== undefined && (typeof data.expected_duration !== 'number' || data.expected_duration < 0)) {
      throw new Error('Expected duration must be a non-negative number');
    }

    validatedData.license_plate = data.license_plate.trim().toUpperCase();
    validatedData.truck_number = data.truck_number?.trim();
    validatedData.trailer_number = data.trailer_number?.trim();
    validatedData.company = data.company.trim();
    validatedData.driver_name = data.driver_name.trim();
    validatedData.cargo_description = data.cargo_description?.trim();
    validatedData.delivery_pickup = data.delivery_pickup;
    validatedData.expected_duration = data.expected_duration;
  }

  return validatedData;
};

/**
 * Validate entry data based on entry type
 */
export const validateEntryData = (entryType: EntryType, data: any, fieldConfigs?: EntryFieldConfig[]): (VehicleEntryData | VisitorEntryData | TruckEntryData) & Record<string, any> => {
  switch (entryType) {
    case 'vehicle':
      return validateVehicleEntry(data, fieldConfigs);
    case 'visitor':
      return validateVisitorEntry(data, fieldConfigs);
    case 'truck':
      return validateTruckEntry(data, fieldConfigs);
    default:
      throw new Error(`Invalid entry type: ${entryType}`);
  }
};



