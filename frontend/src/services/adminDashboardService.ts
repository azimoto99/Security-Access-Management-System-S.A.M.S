import api from './api';
import type { ApiResponse } from './api';

export interface DashboardMetrics {
  activeSites: number;
  totalSites: number;
  todayEntries: number;
  yesterdayEntries: number;
  entriesChange: number;
  currentOccupancy: number;
  activeAlerts: number;
}

export interface SiteStatus {
  id: string;
  name: string;
  clientName: string | null;
  status: 'active' | 'moderate' | 'quiet' | 'alert';
  currentOccupancy: number;
  todayEntries: number;
  lastEntryTime: string | null;
  hasAlerts: boolean;
}

export interface RecentActivity {
  id: string;
  entryType: 'vehicle' | 'visitor' | 'truck';
  identifier: string;
  company?: string;
  siteName: string;
  entryTime: string;
  exitTime?: string | null;
  hasAlert: boolean;
  alertType?: string;
  photos: string[];
}

export interface AnalyticsData {
  entriesOverTime: Array<{ time: string; entries: number }>;
  entriesBySite: Array<{ site: string; entries: number }>;
  entryTypeBreakdown: Array<{ type: string; count: number }>;
}

export interface ActiveAlert {
  id: string;
  type: string;
  siteName: string;
  entryId?: string;
  entryType?: string;
  identifier?: string;
  description: string;
  createdAt: string;
  priority: 'high' | 'medium' | 'low';
}

export interface ClientUsage {
  id: string;
  name: string;
  siteCount: number;
  lastLogin: string | null;
  activityLevel: 'active' | 'moderate' | 'inactive';
  todayEntries: number;
}

export const adminDashboardService = {
  async getMetrics(): Promise<DashboardMetrics> {
    const response = await api.get<ApiResponse<DashboardMetrics>>('/admin/dashboard/metrics');
    if (response.data.success && response.data.data) {
      return response.data.data;
    }
    throw new Error(response.data.error?.message || 'Failed to fetch dashboard metrics');
  },

  async getSitesStatus(): Promise<SiteStatus[]> {
    const response = await api.get<ApiResponse<SiteStatus[]>>('/admin/dashboard/sites-status');
    if (response.data.success && response.data.data) {
      return response.data.data;
    }
    throw new Error(response.data.error?.message || 'Failed to fetch sites status');
  },

  async getRecentActivity(limit: number = 20): Promise<RecentActivity[]> {
    const response = await api.get<ApiResponse<RecentActivity[]>>('/admin/dashboard/recent-activity', {
      params: { limit },
    });
    if (response.data.success && response.data.data) {
      return response.data.data;
    }
    throw new Error(response.data.error?.message || 'Failed to fetch recent activity');
  },

  async getAnalytics(period: 'today' | 'week' | 'month' = 'today'): Promise<AnalyticsData> {
    const response = await api.get<ApiResponse<AnalyticsData>>('/admin/dashboard/analytics', {
      params: { period },
    });
    if (response.data.success && response.data.data) {
      return response.data.data;
    }
    throw new Error(response.data.error?.message || 'Failed to fetch analytics');
  },

  async getActiveAlerts(): Promise<ActiveAlert[]> {
    const response = await api.get<ApiResponse<ActiveAlert[]>>('/admin/dashboard/alerts');
    if (response.data.success && response.data.data) {
      return response.data.data;
    }
    throw new Error(response.data.error?.message || 'Failed to fetch active alerts');
  },

  async getClientUsage(): Promise<ClientUsage[]> {
    const response = await api.get<ApiResponse<ClientUsage[]>>('/admin/dashboard/client-usage');
    if (response.data.success && response.data.data) {
      return response.data.data;
    }
    throw new Error(response.data.error?.message || 'Failed to fetch client usage');
  },
};

