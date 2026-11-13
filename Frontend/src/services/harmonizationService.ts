import apiClient from './api';
import { ApiResponse } from '../types/api';
import {
  CalibrationMethod,
  CalibrationResult,
  HarmonizationRunRecord,
  ActivityIndexPoint,
  HarmonizationUncertainty,
} from '../types/harmonization';

export interface DiscoveredRegion {
  name: string;
  total_obs: number;
  modis_count: number;
  viirs_count: number;
  min_lat: number;
  max_lat: number;
  min_lon: number;
  max_lon: number;
  start_date: string;
  end_date: string;
  coincident_pairs: number;
  has_both_sensors: boolean;
  harmonization_ready: boolean;
}

export interface CalibrationFilterParams {
  min_lat?: number;
  max_lat?: number;
  min_lon?: number;
  max_lon?: number;
  start_date?: string;
  end_date?: string;
  region?: string;
  limit?: number;
}

export const harmonizationService = {
  async getMethods(): Promise<CalibrationMethod[]> {
    try {
      const res = await apiClient.get<ApiResponse<CalibrationMethod[]>>('/api/harmonization/methods');
      return Array.isArray(res.data?.data) ? res.data.data : [];
    } catch {
      return [];
    }
  },

  async getDiscoveredRegions(): Promise<DiscoveredRegion[]> {
    try {
      const res = await apiClient.get<ApiResponse<DiscoveredRegion[]>>('/api/harmonization/regions');
      return Array.isArray(res.data?.data) ? res.data.data : [];
    } catch {
      return [];
    }
  },

  async getCoincidentPairs(filters?: CalibrationFilterParams): Promise<{
    total_pairs: number;
    avg_modis_frp: number;
    avg_viirs_frp: number;
  }> {
    try {
      const res = await apiClient.post<ApiResponse<{
        total_pairs: number;
        avg_modis_frp: number;
        avg_viirs_frp: number;
      }>>('/api/harmonization/coincident-pairs', filters || {});
      return res.data?.data || { total_pairs: 0, avg_modis_frp: 0, avg_viirs_frp: 0 };
    } catch {
      return { total_pairs: 0, avg_modis_frp: 0, avg_viirs_frp: 0 };
    }
  },

  async calibrateRatio(filters?: CalibrationFilterParams): Promise<CalibrationResult | null> {
    try {
      const res = await apiClient.post<ApiResponse<CalibrationResult>>('/api/harmonization/calibrate/ratio', filters || {});
      return res.data?.data || null;
    } catch {
      return null;
    }
  },

  async calibrateLinearRegression(filters?: CalibrationFilterParams): Promise<CalibrationResult | null> {
    try {
      const res = await apiClient.post<ApiResponse<CalibrationResult>>('/api/harmonization/calibrate/linear-regression', filters || {});
      return res.data?.data || null;
    } catch {
      return null;
    }
  },

  async calibrateQuantileMapping(filters?: CalibrationFilterParams): Promise<CalibrationResult | null> {
    try {
      const res = await apiClient.post<ApiResponse<CalibrationResult>>('/api/harmonization/calibrate/quantile-mapping', filters || {});
      return res.data?.data || null;
    } catch {
      return null;
    }
  },

  async calibrateRandomForest(filters?: CalibrationFilterParams): Promise<CalibrationResult | null> {
    try {
      const res = await apiClient.post<ApiResponse<CalibrationResult>>('/api/harmonization/calibrate/random-forest', filters || {});
      return res.data?.data || null;
    } catch {
      return null;
    }
  },

  async runHarmonization(method: string, filters?: CalibrationFilterParams): Promise<{
    run_id: string;
    method: string;
    sample_size: number;
    results: CalibrationResult;
  }> {
    const res = await apiClient.post<ApiResponse<{
      run_id: string;
      method: string;
      sample_size: number;
      results: CalibrationResult;
    }>>('/api/harmonization/run', { method, ...(filters || {}) });
    return res.data.data;
  },

  async getResults(): Promise<HarmonizationRunRecord[]> {
    try {
      const res = await apiClient.get<ApiResponse<HarmonizationRunRecord[]>>('/api/harmonization/results');
      return Array.isArray(res.data?.data) ? res.data.data : [];
    } catch {
      return [];
    }
  },

  async getResultDetail(id: string): Promise<HarmonizationRunRecord | null> {
    try {
      const res = await apiClient.get<ApiResponse<HarmonizationRunRecord>>(`/api/harmonization/results/${id}`);
      return res.data?.data || null;
    } catch {
      return null;
    }
  },

  async getComparison(): Promise<Array<{ sensor: string; count: number; raw_mean_frp: number; std_frp: number }>> {
    try {
      const res = await apiClient.get<ApiResponse<Array<{ sensor: string; count: number; raw_mean_frp: number; std_frp: number }>>>('/api/harmonization/comparison');
      return Array.isArray(res.data?.data) ? res.data.data : [];
    } catch {
      return [];
    }
  },

  async getUncertainty(): Promise<HarmonizationUncertainty> {
    try {
      const res = await apiClient.get<ApiResponse<HarmonizationUncertainty>>('/api/harmonization/uncertainty');
      return res.data?.data || {
        confidence_level: '95%',
        uncertainty_range_mw: '± 4.2 MW',
        spatial_error_km: '0.375 - 1.0 km',
      };
    } catch {
      return {
        confidence_level: '95%',
        uncertainty_range_mw: '± 4.2 MW',
        spatial_error_km: '0.375 - 1.0 km',
      };
    }
  },

  async getActivityIndex(): Promise<ActivityIndexPoint[]> {
    try {
      const res = await apiClient.get<ApiResponse<ActivityIndexPoint[]>>('/api/harmonization/activity-index');
      return Array.isArray(res.data?.data) ? res.data.data : [];
    } catch {
      return [];
    }
  },
};
