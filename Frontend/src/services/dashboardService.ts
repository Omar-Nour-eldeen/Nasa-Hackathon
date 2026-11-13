import apiClient from './api';
import { ApiResponse, HealthStatus } from '../types/api';
import { CalendarDayData, MapHotspot } from '../types/fire';
import { ActivityIndexPoint } from '../types/harmonization';

export const dashboardService = {
  async getHealth(): Promise<HealthStatus> {
    try {
      const res = await apiClient.get<HealthStatus>('/api/health');
      return res.data;
    } catch {
      return { status: 'offline', database: 'Unreachable', endpoints: [] };
    }
  },

  async getOverview(region?: string) {
    try {
      const params = new URLSearchParams();
      if (region && region !== 'ALL') params.append('region', region);
      const url = params.toString() ? `/api/dashboard/overview?${params.toString()}` : '/api/dashboard/overview';
      const res = await apiClient.get<ApiResponse<{
        observations: {
          total_observations: number;
          modis_count: number;
          viirs_count: number;
          avg_frp: number;
          max_frp: number;
          min_frp: number;
        };
        anomalies: {
          total_anomalies: number;
          avg_frp: number;
          max_frp: number;
          high_severity_count: number;
          extreme_severity_count: number;
        };
      }>>(url);
      return res.data?.data || null;
    } catch {
      return null;
    }
  },

  async getCalendar(region?: string): Promise<CalendarDayData[]> {
    try {
      const params = new URLSearchParams();
      if (region && region !== 'ALL') params.append('region', region);
      const url = params.toString() ? `/api/dashboard/calendar?${params.toString()}` : '/api/dashboard/calendar';
      const res = await apiClient.get<ApiResponse<CalendarDayData[]>>(url);
      return Array.isArray(res.data?.data) ? res.data.data : [];
    } catch {
      return [];
    }
  },

  async getMapHotspots(limit = 1000): Promise<MapHotspot[]> {
    try {
      const res = await apiClient.get<ApiResponse<MapHotspot[]>>(`/api/dashboard/map?limit=${limit}`);
      return Array.isArray(res.data?.data) ? res.data.data : [];
    } catch {
      return [];
    }
  },

  async getAnomaliesSummary() {
    try {
      const res = await apiClient.get<ApiResponse<{
        summary: Record<string, unknown>;
        recent: unknown[];
      }>>('/api/dashboard/anomalies');
      return res.data?.data || { summary: {}, recent: [] };
    } catch {
      return { summary: {}, recent: [] };
    }
  },

  async getTrends() {
    try {
      const res = await apiClient.get<ApiResponse<{
        counts: Array<{ date: string; count: number }>;
        frp: Array<{ date: string; avg_frp: number; max_frp: number }>;
      }>>('/api/dashboard/trends');
      return res.data?.data || { counts: [], frp: [] };
    } catch {
      return { counts: [], frp: [] };
    }
  },

  async getSensorComparison() {
    try {
      const res = await apiClient.get<ApiResponse<Array<{
        sensor: string;
        count: number;
        avg_frp: number;
        max_frp: number;
      }>>>('/api/dashboard/sensor-comparison');
      return Array.isArray(res.data?.data) ? res.data.data : [];
    } catch {
      return [];
    }
  },

  async getActivityIndex(): Promise<ActivityIndexPoint[]> {
    try {
      const res = await apiClient.get<ApiResponse<ActivityIndexPoint[]>>('/api/dashboard/activity-index');
      return Array.isArray(res.data?.data) ? res.data.data : [];
    } catch {
      return [];
    }
  },
};
