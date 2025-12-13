export interface User {
  id: string;
  username: string;
  password_hash: string;
  role: 'guard' | 'admin' | 'employee';
  job_site_access: string[];
  employee_id?: string;
  onboarding_status?: 'pending' | 'in_progress' | 'completed';
  created_at: Date;
  is_active: boolean;
}

export interface JobSite {
  id: string;
  name: string;
  address: string;
  contact_info: Record<string, any>;
  vehicle_capacity: number;
  visitor_capacity: number;
  truck_capacity: number;
  is_active: boolean;
  created_at: Date;
}

export interface Entry {
  id: string;
  job_site_id: string;
  entry_type: 'vehicle' | 'visitor' | 'truck';
  entry_data: Record<string, any>;
  entry_time: Date;
  exit_time?: Date;
  guard_id: string;
  photos: string[];
  status: 'active' | 'exited' | 'emergency_exit';
  created_at: Date;
}

export interface Photo {
  id: string;
  entry_id: string;
  filename: string;
  file_path: string;
  file_size: number;
  mime_type: string;
  thumbnail_path: string;
  uploaded_at: Date;
}

export interface WatchlistEntry {
  id: string;
  type: 'person' | 'vehicle';
  identifier: string;
  reason: string;
  alert_level: 'low' | 'medium' | 'high';
  created_by: string;
  created_at: Date;
  is_active: boolean;
}

export interface AuditLog {
  id: string;
  user_id: string;
  action: string;
  resource_type: string;
  resource_id: string;
  details: Record<string, any>;
  timestamp: Date;
}

export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  error?: {
    code: string;
    message: string;
    details?: Record<string, any>;
  };
}