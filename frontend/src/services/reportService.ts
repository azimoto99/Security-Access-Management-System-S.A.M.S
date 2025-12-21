import api from './api';
import type { ApiResponse } from './api';

export interface ReportFilters {
  job_site_id?: string;
  date_from: string;
  date_to: string;
  time_from?: string;
  time_to?: string;
  entry_type?: 'vehicle' | 'visitor' | 'truck';
}

export interface ReportData {
  summary: {
    total_entries: number;
    total_exits: number;
    active_entries: number;
    by_type: {
      vehicles: number;
      visitors: number;
      trucks: number;
    };
  };
  peak_hours: Array<{
    hour: number;
    count: number;
  }>;
  average_duration: number;
  by_job_site?: Array<{
    job_site_id: string;
    job_site_name: string;
    entries: number;
    exits: number;
  }>;
  daily_breakdown: Array<{
    date: string;
    entries: number;
    exits: number;
  }>;
}

export const reportService = {
  /**
   * Generate report
   */
  async generateReport(filters: ReportFilters): Promise<{ report: ReportData; filters: ReportFilters }> {
    const response = await api.post<ApiResponse<{ report: ReportData; filters: ReportFilters }>>(
      '/reports/generate',
      filters
    );
    if (response.data.success && response.data.data) {
      return response.data.data;
    }
    throw new Error(response.data.error?.message || 'Failed to generate report');
  },

  /**
   * Export report to CSV
   */
  async exportReport(filters: ReportFilters): Promise<Blob> {
    const response = await api.post('/reports/export', filters, {
      responseType: 'blob',
    });
    return response.data;
  },

  /**
   * Export entries to CSV
   */
  async exportEntries(filters: Record<string, any> = {}): Promise<Blob> {
    const response = await api.get('/reports/export-entries', {
      params: filters,
      responseType: 'blob',
    });
    return response.data;
  },
};



