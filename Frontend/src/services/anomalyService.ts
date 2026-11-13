import apiClient from './api';
import { ApiResponse } from '../types/api';
import { Anomaly, AnomalyStatistics, AnomalySeverityCount } from '../types/anomaly';

export const anomalyService = {
  async getAnomalies(limit = 100, severity?: string, region?: string): Promise<Anomaly[]> {
    try {
      const params = new URLSearchParams();
      if (limit) params.append('limit', String(limit));
      if (severity && severity !== 'ALL') params.append('severity', severity);
      if (region && region !== 'ALL') params.append('region', region);

      const res = await apiClient.get<ApiResponse<Anomaly[]>>(`/api/anomalies?${params.toString()}`);
      return Array.isArray(res.data?.data) ? res.data.data : [];
    } catch {
      return [];
    }
  },

  async getAnomalyDetail(id: string): Promise<Anomaly | null> {
    try {
      const res = await apiClient.get<ApiResponse<Anomaly>>(`/api/anomalies/${id}`);
      return res.data?.data || null;
    } catch {
      return null;
    }
  },

  async detectAnomalies(thresholdZscore = 2.5, region?: string): Promise<{ detected: number; threshold: number; sample_size: number }> {
    try {
      const res = await apiClient.post<ApiResponse<{ detected: number; threshold: number; sample_size: number }>>(
        '/api/anomalies/detect',
        { threshold_zscore: thresholdZscore, region: region && region !== 'ALL' ? region : undefined }
      );
      return res.data?.data || { detected: 0, threshold: thresholdZscore, sample_size: 0 };
    } catch {
      return { detected: 0, threshold: thresholdZscore, sample_size: 0 };
    }
  },

  async getStatistics(region?: string): Promise<AnomalyStatistics> {
    try {
      const params = new URLSearchParams();
      if (region && region !== 'ALL') params.append('region', region);
      const url = params.toString() ? `/api/anomalies/statistics?${params.toString()}` : '/api/anomalies/statistics';
      const res = await apiClient.get<ApiResponse<Record<string, unknown>>>(url);
      const d = (res.data?.data || {}) as Record<string, unknown>;
      return {
        total_anomalies: Number(d.total_anomalies || 0),
        avg_frp: Number(d.avg_frp ?? d.avg_anomaly_frp ?? 0),
        max_frp: Number(d.max_frp ?? d.max_anomaly_frp ?? 0),
        high_severity_count: Number(d.high_severity_count ?? d.high_count ?? 0),
        extreme_severity_count: Number(d.extreme_severity_count ?? d.extreme_count ?? 0),
      };
    } catch {
      return {
        total_anomalies: 0,
        avg_frp: 0,
        max_frp: 0,
        high_severity_count: 0,
        extreme_severity_count: 0,
      };
    }
  },

  async getBySeverity(region?: string): Promise<AnomalySeverityCount[]> {
    try {
      const params = new URLSearchParams();
      if (region && region !== 'ALL') params.append('region', region);
      const url = params.toString() ? `/api/anomalies/severity?${params.toString()}` : '/api/anomalies/severity';
      const res = await apiClient.get<ApiResponse<AnomalySeverityCount[]>>(url);
      return Array.isArray(res.data?.data) ? res.data.data : [];
    } catch {
      return [];
    }
  },

  async getByDate(): Promise<Array<{ acq_date: string; count: number; avg_frp: number }>> {
    try {
      const res = await apiClient.get<ApiResponse<Array<{ acq_date: string; count: number; avg_frp: number }>>>('/api/anomalies/by-date');
      return Array.isArray(res.data?.data) ? res.data.data : [];
    } catch {
      return [];
    }
  },

  async getAnomaliesMap(): Promise<Anomaly[]> {
    try {
      const res = await apiClient.get<ApiResponse<Anomaly[]>>('/api/anomalies/map');
      return Array.isArray(res.data?.data) ? res.data.data : [];
    } catch {
      return [];
    }
  },
};
