import apiClient from './api';
import { ApiResponse } from '../types/api';
import { ExportHistoryRecord } from '../types/analytics';

export interface ExportResult {
  export_id: string;
  file_name: string;
  download_url: string;
  record_count: number;
}

export const exportService = {
  async exportCsv(table = 'observations', limit = 10000): Promise<ExportResult> {
    const res = await apiClient.post<ApiResponse<ExportResult>>('/api/exports/csv', { table, limit });
    return res.data.data;
  },

  async exportHarmonized(): Promise<ExportResult> {
    const res = await apiClient.post<ApiResponse<ExportResult>>('/api/exports/harmonized-data');
    return res.data.data;
  },

  async exportObservations(): Promise<ExportResult> {
    const res = await apiClient.post<ApiResponse<ExportResult>>('/api/exports/observations');
    return res.data.data;
  },

  async exportValidation(): Promise<ExportResult> {
    const res = await apiClient.post<ApiResponse<ExportResult>>('/api/exports/validation-report');
    return res.data.data;
  },

  async getHistory(): Promise<ExportHistoryRecord[]> {
    try {
      const res = await apiClient.get<ApiResponse<ExportHistoryRecord[]>>('/api/exports/history');
      return Array.isArray(res.data?.data) ? res.data.data : [];
    } catch {
      return [];
    }
  },

  getDownloadUrl(exportId: string): string {
    const baseURL = apiClient.defaults.baseURL || 'http://localhost:5000';
    return `${baseURL}/api/exports/${exportId}`;
  },
};
