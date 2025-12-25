import api from './api';

export interface DashboardSummary {
  currentOccupancy: number;
  todayEntries: number;
  todayExits: number;
  activeAlerts: number;
  recentEntries: RecentEntry[];
  peakOccupancyTime: string | null;
  lastUpdated: string;
}

export interface RecentEntry {
  id: string;
  entryType: 'vehicle' | 'visitor' | 'truck';
  identifier: string;
  companyName: string;
  entryTime: string;
  exitTime: string | null;
  photoUrl: string | null;
  isOnSite: boolean;
}

export const dashboardService = {
  /**
   * Get dashboard summary for a site
   */
  async getDashboardSummary(siteId: string): Promise<DashboardSummary> {
    const response = await api.get<{ success: boolean; data: DashboardSummary }>(
      `/client/dashboard/${siteId}/summary`
    );

    if (!response.data.success || !response.data.data) {
      throw new Error('Failed to fetch dashboard summary');
    }

    return response.data.data;
  },
};

