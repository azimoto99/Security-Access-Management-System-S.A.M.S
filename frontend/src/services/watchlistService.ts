import api from './api';

export interface WatchlistEntry {
  id: string;
  type: 'person' | 'vehicle';
  identifier: string;
  reason: string;
  alert_level: 'low' | 'medium' | 'high';
  created_by: string;
  created_at: string;
  is_active: boolean;
  created_by_username?: string;
}

export interface CreateWatchlistData {
  type: 'person' | 'vehicle';
  identifier: string;
  reason: string;
  alert_level?: 'low' | 'medium' | 'high';
}

export interface UpdateWatchlistData {
  identifier?: string;
  reason?: string;
  alert_level?: 'low' | 'medium' | 'high';
  is_active?: boolean;
}

export const watchlistService = {
  /**
   * Get all watchlist entries
   */
  getAllEntries: async (activeOnly?: boolean): Promise<WatchlistEntry[]> => {
    const params = activeOnly ? { active_only: 'true' } : {};
    const response = await api.get<{ success: boolean; data: { entries: WatchlistEntry[] } }>('/watchlist', { params });
    return response.data.data.entries;
  },

  /**
   * Get watchlist entry by ID
   */
  getEntryById: async (id: string): Promise<WatchlistEntry> => {
    const response = await api.get<{ success: boolean; data: { entry: WatchlistEntry } }>(`/watchlist/${id}`);
    return response.data.data.entry;
  },

  /**
   * Create watchlist entry
   */
  createEntry: async (data: CreateWatchlistData): Promise<WatchlistEntry> => {
    const response = await api.post<{ success: boolean; data: { entry: WatchlistEntry } }>('/watchlist', data);
    return response.data.data.entry;
  },

  /**
   * Update watchlist entry
   */
  updateEntry: async (id: string, data: UpdateWatchlistData): Promise<WatchlistEntry> => {
    const response = await api.put<{ success: boolean; data: { entry: WatchlistEntry } }>(`/watchlist/${id}`, data);
    return response.data.data.entry;
  },

  /**
   * Delete watchlist entry
   */
  deleteEntry: async (id: string): Promise<void> => {
    const response = await api.delete<{ success: boolean }>(`/watchlist/${id}`);
    if (!response.data.success) {
      throw new Error('Failed to delete watchlist entry');
    }
  },
};

















