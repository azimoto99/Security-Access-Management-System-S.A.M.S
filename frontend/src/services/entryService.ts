import api from './api';
import type { ApiResponse } from './api';
import type { EntryType, EntryStatus } from '../types/entry';

export interface Entry {
  id: string;
  job_site_id: string;
  entry_type: EntryType;
  entry_data: Record<string, any>;
  entry_time: string;
  exit_time?: string;
  guard_id: string;
  photos: string[];
  status: EntryStatus;
  created_at: string;
}

export interface CreateEntryData {
  job_site_id: string;
  entry_type: EntryType;
  entry_data: Record<string, any>;
  photos?: string[];
}

export interface ExitEntryData {
  entry_id: string;
  override?: boolean;
  override_reason?: string;
  trailer_number?: string; // Optional: update trailer number on exit (for trucks)
}

export interface ManualExitData {
  job_site_id: string;
  entry_type: 'vehicle' | 'truck';
  entry_data: {
    license_plate: string;
    truck_number?: string; // Required for trucks
    trailer_number?: string;
    destination?: 'north' | 'south'; // For trucks
    driver_name?: string;
    company?: string;
    cargo_description?: string;
  };
}

export interface SearchEntriesParams {
  job_site_id?: string;
  entry_type?: EntryType;
  status?: EntryStatus;
  license_plate?: string;
  name?: string;
  company?: string;
  date_from?: string;
  date_to?: string;
  guard_id?: string;
  search_term?: string;
  page?: string;
  limit?: string;
}

export interface SearchEntriesResponse {
  entries: Entry[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

export const entryService = {
  /**
   * Create entry
   */
  async createEntry(data: CreateEntryData): Promise<Entry> {
    const response = await api.post<ApiResponse<{ entry: Entry }>>('/entries', data);
    if (response.data.success && response.data.data) {
      return response.data.data.entry;
    }
    throw new Error(response.data.error?.message || 'Failed to create entry');
  },

  /**
   * Get active entries for a job site
   */
  async getActiveEntries(jobSiteId: string, entryType?: EntryType): Promise<Entry[]> {
    const params = entryType ? { entry_type: entryType } : {};
    const response = await api.get<ApiResponse<{ entries: Entry[] }>>(
      `/entries/active/${jobSiteId}`,
      { params }
    );
    if (response.data.success && response.data.data) {
      return response.data.data.entries;
    }
    throw new Error(response.data.error?.message || 'Failed to fetch active entries');
  },

  /**
   * Process exit
   */
  async processExit(data: ExitEntryData): Promise<{ entry: Entry; duration_minutes: number }> {
    const response = await api.post<ApiResponse<{ entry: Entry; duration_minutes: number }>>(
      '/entries/exit',
      data
    );
    if (response.data.success && response.data.data) {
      return response.data.data;
    }
    throw new Error(response.data.error?.message || 'Failed to process exit');
  },

  /**
   * Create manual exit (for vehicles/trucks not logged in)
   */
  async createManualExit(data: ManualExitData): Promise<Entry> {
    const response = await api.post<ApiResponse<{ entry: Entry }>>('/entries/manual-exit', data);
    if (response.data.success && response.data.data) {
      return response.data.data.entry;
    }
    throw new Error(response.data.error?.message || 'Failed to create manual exit');
  },

  /**
   * Search entries
   */
  async searchEntries(params: SearchEntriesParams): Promise<SearchEntriesResponse> {
    const response = await api.get<ApiResponse<SearchEntriesResponse>>('/entries/search', {
      params,
    });
    if (response.data.success && response.data.data) {
      return response.data.data;
    }
    throw new Error(response.data.error?.message || 'Failed to search entries');
  },

  /**
   * Get entry by ID
   */
  async getEntryById(id: string): Promise<Entry> {
    const response = await api.get<ApiResponse<{ entry: Entry }>>(`/entries/${id}`);
    if (response.data.success && response.data.data) {
      return response.data.data.entry;
    }
    throw new Error(response.data.error?.message || 'Failed to fetch entry');
  },
};

