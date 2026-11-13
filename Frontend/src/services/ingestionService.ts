import apiClient from './api';
import { ApiResponse } from '../types/api';

export interface DataSourceItem {
  id: string;
  name: string;
  sensor: string;
  satellite: string;
  spatial_resolution: string;
  temporal_resolution: string;
  status: string;
  observation_period: string;
}

export interface UploadResult {
  filename: string;
  path: string;
  size: number;
  imported_records?: number;
}

export const ingestionService = {
  async getSources(): Promise<DataSourceItem[]> {
    const res = await apiClient.get<ApiResponse<DataSourceItem[]>>('/api/ingestion/sources');
    return res.data.data;
  },

  async uploadFile(file: File, sensor?: string, autoIngest = true): Promise<UploadResult> {
    const formData = new FormData();
    formData.append('file', file);
    if (sensor) formData.append('sensor', sensor);
    formData.append('auto_ingest', String(autoIngest));

    const res = await apiClient.post<ApiResponse<UploadResult>>('/api/ingestion/files/upload', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    return res.data.data;
  },

  async syncData(): Promise<{ status: string }> {
    const res = await apiClient.post<ApiResponse<{ status: string }>>('/api/ingestion/sync');
    return res.data.data;
  },

  // Processing pipeline triggers
  async cleanData(): Promise<Record<string, unknown>> {
    const res = await apiClient.post<ApiResponse<Record<string, unknown>>>('/api/processing/clean');
    return res.data.data;
  },

  async runSpatialMatching(maxDistanceKm = 1.5): Promise<unknown[]> {
    const res = await apiClient.post<ApiResponse<unknown[]>>('/api/processing/spatial-matching', {
      max_distance_km: maxDistanceKm,
    });
    return res.data.data;
  },

  async generateSpatialGrid(gridSize = 0.1): Promise<unknown[]> {
    const res = await apiClient.post<ApiResponse<unknown[]>>('/api/processing/grid/generate', {
      grid_size: gridSize,
    });
    return res.data.data;
  },

  async deleteRegion(regionName: string): Promise<void> {
    await apiClient.delete(`/api/ingestion/regions/${encodeURIComponent(regionName)}`);
  },

  async clearAllData(): Promise<void> {
    await apiClient.delete('/api/ingestion/clear-all');
  },

  async createProcessingJob(jobType = 'data_processing'): Promise<{ job_id: string; status: string }> {
    const res = await apiClient.post<ApiResponse<{ job_id: string; status: string }>>('/api/processing/jobs', {
      job_type: jobType,
    });
    return res.data.data;
  },
};

