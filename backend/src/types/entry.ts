export type EntryType = 'vehicle' | 'visitor' | 'truck';
export type EntryStatus = 'active' | 'exited' | 'emergency_exit';

export interface BaseEntryData {
  purpose?: string;
  expected_duration?: number; // in minutes
}

export interface VehicleEntryData extends BaseEntryData {
  license_plate: string;
  vehicle_type: string;
  driver_name: string;
  company?: string;
  purpose: string;
  expected_duration?: number;
}

export interface VisitorEntryData extends BaseEntryData {
  name: string;
  company?: string;
  contact_phone?: string;
  purpose: string;
  host_contact?: string;
  expected_duration?: number;
}

export interface TruckEntryData extends BaseEntryData {
  license_plate: string;
  company: string;
  driver_name: string;
  cargo_description?: string;
  delivery_pickup: 'delivery' | 'pickup';
  expected_duration?: number;
}

export type EntryData = VehicleEntryData | VisitorEntryData | TruckEntryData;

export interface Entry {
  id: string;
  job_site_id: string;
  entry_type: EntryType;
  entry_data: EntryData;
  entry_time: Date;
  exit_time?: Date;
  guard_id: string;
  photos: string[];
  status: EntryStatus;
  created_at: Date;
}

export interface CreateEntryRequest {
  job_site_id: string;
  entry_type: EntryType;
  entry_data: EntryData;
  photos?: string[];
}

export interface ExitEntryRequest {
  entry_id: string;
  override?: boolean;
  override_reason?: string;
}

export interface SearchEntriesRequest {
  job_site_id?: string;
  entry_type?: EntryType;
  status?: EntryStatus;
  license_plate?: string;
  name?: string;
  company?: string;
  date_from?: string;
  date_to?: string;
  guard_id?: string;
}




