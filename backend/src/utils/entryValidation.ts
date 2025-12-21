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
export const validateVehicleEntry = (data: any): VehicleEntryData => {
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

  return {
    license_plate: data.license_plate.trim().toUpperCase(),
    vehicle_type: data.vehicle_type.trim(),
    driver_name: data.driver_name.trim(),
    company: data.company?.trim(),
    purpose: data.purpose.trim(),
    expected_duration: data.expected_duration,
  };
};

/**
 * Validate visitor entry data
 */
export const validateVisitorEntry = (data: any): VisitorEntryData => {
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

  return {
    name: data.name.trim(),
    company: data.company?.trim(),
    contact_phone: data.contact_phone?.trim(),
    purpose: data.purpose.trim(),
    host_contact: data.host_contact?.trim(),
    expected_duration: data.expected_duration,
  };
};

/**
 * Validate truck entry data
 */
export const validateTruckEntry = (data: any): TruckEntryData => {
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

  return {
    license_plate: data.license_plate.trim().toUpperCase(),
    truck_number: data.truck_number?.trim(),
    trailer_number: data.trailer_number?.trim(),
    company: data.company.trim(),
    driver_name: data.driver_name.trim(),
    cargo_description: data.cargo_description?.trim(),
    delivery_pickup: data.delivery_pickup,
    expected_duration: data.expected_duration,
  };
};

/**
 * Validate entry data based on entry type
 */
export const validateEntryData = (entryType: EntryType, data: any): VehicleEntryData | VisitorEntryData | TruckEntryData => {
  switch (entryType) {
    case 'vehicle':
      return validateVehicleEntry(data);
    case 'visitor':
      return validateVisitorEntry(data);
    case 'truck':
      return validateTruckEntry(data);
    default:
      throw new Error(`Invalid entry type: ${entryType}`);
  }
};



