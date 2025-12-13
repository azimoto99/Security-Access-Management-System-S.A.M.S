import api from './api';

export type AlertType =
  | 'overstay'
  | 'capacity_warning'
  | 'watchlist_match'
  | 'invalid_exit'
  | 'failed_login'
  | 'account_locked';

export type AlertSeverity = 'low' | 'medium' | 'high' | 'critical';

export interface Alert {
  id: string;
  type: AlertType;
  severity: AlertSeverity;
  title: string;
  message: string;
  job_site_id?: string;
  entry_id?: string;
  watchlist_id?: string;
  user_id?: string;
  is_acknowledged: boolean;
  acknowledged_by?: string;
  acknowledged_at?: string;
  metadata: Record<string, any>;
  created_at: string;
}

export interface GetAlertsParams {
  type?: AlertType;
  severity?: AlertSeverity;
  job_site_id?: string;
  is_acknowledged?: boolean;
  limit?: number;
  offset?: number;
}

export interface AlertsResponse {
  alerts: Alert[];
  total: number;
}

export const alertService = {
  /**
   * Get alerts
   */
  getAlerts: async (params?: GetAlertsParams): Promise<AlertsResponse> => {
    const response = await api.get<{ success: boolean; data: AlertsResponse }>('/alerts', { params });
    return response.data.data;
  },

  /**
   * Acknowledge alert
   */
  acknowledgeAlert: async (id: string): Promise<Alert> => {
    const response = await api.post<{ success: boolean; data: { alert: Alert } }>(`/alerts/${id}/acknowledge`);
    return response.data.data.alert;
  },

  /**
   * Trigger alert checks (admin only)
   */
  triggerAlertChecks: async (): Promise<void> => {
    const response = await api.post<{ success: boolean }>('/alerts/trigger-checks');
    if (!response.data.success) {
      throw new Error('Failed to trigger alert checks');
    }
  },
};





