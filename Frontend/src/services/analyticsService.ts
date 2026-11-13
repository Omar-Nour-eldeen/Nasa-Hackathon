import apiClient from './api';
import { ApiResponse } from '../types/api';
import {
  HotspotTrendPoint,
  FrpTrendPoint,
  LandCoverStat,
  RegionStat,
  SensorComparisonItem,
} from '../types/analytics';

export const analyticsService = {
  async getOverview() {
    try {
      const res = await apiClient.get<ApiResponse<Record<string, unknown>>>('/api/analytics/overview');
      return res.data?.data || {};
    } catch {
      return {};
    }
  },

  async getHotspotTrends(period: 'daily' | 'monthly' | 'yearly' = 'daily', region?: string): Promise<HotspotTrendPoint[]> {
    try {
      const params = new URLSearchParams({ period });
      if (region && region !== 'ALL') params.append('region', region);
      const res = await apiClient.get<ApiResponse<HotspotTrendPoint[]>>(`/api/analytics/hotspot-trends?${params.toString()}`);
      return Array.isArray(res.data?.data) ? res.data.data : [];
    } catch {
      return [];
    }
  },

  async getFrpTrends(region?: string): Promise<FrpTrendPoint[]> {
    try {
      const params = new URLSearchParams();
      if (region && region !== 'ALL') params.append('region', region);
      const url = params.toString() ? `/api/analytics/frp-trends?${params.toString()}` : '/api/analytics/frp-trends';
      const res = await apiClient.get<ApiResponse<FrpTrendPoint[]>>(url);
      return Array.isArray(res.data?.data) ? res.data.data : [];
    } catch {
      return [];
    }
  },

  async getDaily(): Promise<HotspotTrendPoint[]> {
    try {
      const res = await apiClient.get<ApiResponse<HotspotTrendPoint[]>>('/api/analytics/daily');
      return Array.isArray(res.data?.data) ? res.data.data : [];
    } catch {
      return [];
    }
  },

  async getMonthly(): Promise<HotspotTrendPoint[]> {
    try {
      const res = await apiClient.get<ApiResponse<HotspotTrendPoint[]>>('/api/analytics/monthly');
      return Array.isArray(res.data?.data) ? res.data.data : [];
    } catch {
      return [];
    }
  },

  async getYearly(): Promise<HotspotTrendPoint[]> {
    try {
      const res = await apiClient.get<ApiResponse<HotspotTrendPoint[]>>('/api/analytics/yearly');
      return Array.isArray(res.data?.data) ? res.data.data : [];
    } catch {
      return [];
    }
  },

  async getRegions(): Promise<RegionStat[]> {
    try {
      const res = await apiClient.get<ApiResponse<RegionStat[]>>('/api/analytics/regions');
      return Array.isArray(res.data?.data) ? res.data.data : [];
    } catch {
      return [];
    }
  },

  async getLandCover(): Promise<LandCoverStat[]> {
    try {
      const res = await apiClient.get<ApiResponse<LandCoverStat[]>>('/api/analytics/land-cover');
      return Array.isArray(res.data?.data) ? res.data.data : [];
    } catch {
      return [];
    }
  },

  async getSensorComparison(region?: string): Promise<SensorComparisonItem[]> {
    try {
      const params = new URLSearchParams();
      if (region && region !== 'ALL') params.append('region', region);
      const url = params.toString() ? `/api/analytics/sensor-comparison?${params.toString()}` : '/api/analytics/sensor-comparison';
      const res = await apiClient.get<ApiResponse<SensorComparisonItem[]>>(url);
      return Array.isArray(res.data?.data) ? res.data.data : [];
    } catch {
      return [];
    }
  },
};
