export type EntryType = 'vehicle' | 'visitor' | 'truck';
export type EntryStatus = 'active' | 'exited' | 'emergency_exit';

export interface VehicleEntryData {
  license_plate: string;
  vehicle_type: string;
  driver_name: string;
  company?: string;
  purpose: string;
  expected_duration?: number;
}

export interface VisitorEntryData {
  name: string;
  company?: string;
  contact_phone?: string;
  purpose: string;
  host_contact?: string;
  expected_duration?: number;
}

export interface TruckEntryData {
  license_plate: string;
  truck_number?: string;
  trailer_number?: string;
  company: string;
  driver_name: string;
  cargo_description?: string;
  delivery_pickup: 'delivery' | 'pickup';
  expected_duration?: number;
}





