import apiClient from './api';
import { ApiResponse } from '../types/api';
import { Observation, ObservationStatistics } from '../types/fire';

export interface ObservationFilters {
  sensor?: string;
  min_frp?: number;
  start_date?: string;
  end_date?: string;
  limit?: number;
}

export interface BoundingBoxFilters {
  min_lat?: number;
  max_lat?: number;
  min_lon?: number;
  max_lon?: number;
  region?: string;
  sensor?: string;
  min_frp?: number;
  limit?: number;
}

export const observationService = {
  async getObservations(filters: ObservationFilters = {}): Promise<Observation[]> {
    try {
      const params = new URLSearchParams();
      if (filters.sensor && filters.sensor !== 'ALL') params.append('sensor', filters.sensor);
      if (filters.min_frp) params.append('min_frp', String(filters.min_frp));
      if (filters.start_date) params.append('start_date', filters.start_date);
      if (filters.end_date) params.append('end_date', filters.end_date);
      if (filters.limit) params.append('limit', String(filters.limit));

      const res = await apiClient.get<ApiResponse<Observation[]>>(`/api/observations?${params.toString()}`);
      return Array.isArray(res.data?.data) ? res.data.data : [];
    } catch (err) {
      console.warn('Failed to get observations', err);
      return [];
    }
  },

  async getObservationById(id: string): Promise<Observation | null> {
    try {
      const res = await apiClient.get<ApiResponse<Observation>>(`/api/observations/${id}`);
      return res.data?.data || null;
    } catch (err) {
      console.warn('Failed to get observation detail', err);
      return null;
    }
  },

  async getMapObservations(bbox: BoundingBoxFilters): Promise<Observation[]> {
    try {
      const params = new URLSearchParams();
      if (bbox.region) params.append('region', bbox.region);
      if (bbox.sensor && bbox.sensor !== 'ALL') params.append('sensor', bbox.sensor);
      if (bbox.min_frp) params.append('min_frp', String(bbox.min_frp));
      if (bbox.min_lat !== undefined) params.append('min_lat', String(bbox.min_lat));
      if (bbox.max_lat !== undefined) params.append('max_lat', String(bbox.max_lat));
      if (bbox.min_lon !== undefined) params.append('min_lon', String(bbox.min_lon));
      if (bbox.max_lon !== undefined) params.append('max_lon', String(bbox.max_lon));
      if (bbox.limit) params.append('limit', String(bbox.limit));

      const res = await apiClient.get<ApiResponse<Observation[]>>(`/api/observations/map?${params.toString()}`);
      return Array.isArray(res.data?.data) ? res.data.data : [];
    } catch (err) {
      console.warn('Failed to get map observations', err);
      return [];
    }
  },

  async getStatistics(): Promise<ObservationStatistics> {
    try {
      const res = await apiClient.get<ApiResponse<ObservationStatistics>>('/api/observations/statistics');
      return res.data?.data || {
        total_observations: 0,
        modis_count: 0,
        viirs_count: 0,
        avg_frp: 0,
        max_frp: 0,
        min_frp: 0,
      };
    } catch {
      return {
        total_observations: 0,
        modis_count: 0,
        viirs_count: 0,
        avg_frp: 0,
        max_frp: 0,
        min_frp: 0,
      };
    }
  },

  async getByRegion(): Promise<Array<{ region: string; count: number; avg_frp: number }>> {
    try {
      const res = await apiClient.get<ApiResponse<Array<{ region: string; count: number; avg_frp: number }>>>('/api/observations/by-region');
      return Array.isArray(res.data?.data) ? res.data.data : [];
    } catch {
      return [];
    }
  },

  async getBySensor(): Promise<Array<{ sensor: string; count: number; avg_frp: number; max_frp: number }>> {
    try {
      const res = await apiClient.get<ApiResponse<Array<{ sensor: string; count: number; avg_frp: number; max_frp: number }>>>('/api/observations/by-sensor');
      return Array.isArray(res.data?.data) ? res.data.data : [];
    } catch {
      return [];
    }
  },
};
