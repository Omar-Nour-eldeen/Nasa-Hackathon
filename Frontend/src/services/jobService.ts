import apiClient from './api';
import { ApiResponse } from '../types/api';
import { BackgroundJob } from '../types/analytics';

export const jobService = {
  async getJobs(): Promise<BackgroundJob[]> {
    try {
      const res = await apiClient.get<ApiResponse<BackgroundJob[]>>('/api/jobs');
      return Array.isArray(res.data?.data) ? res.data.data : [];
    } catch {
      return [];
    }
  },

  async getJob(id: string): Promise<BackgroundJob | null> {
    try {
      const res = await apiClient.get<ApiResponse<BackgroundJob>>(`/api/jobs/${id}`);
      return res.data?.data || null;
    } catch {
      return null;
    }
  },

  async cancelJob(id: string): Promise<{ job_id: string; status: string } | null> {
    try {
      const res = await apiClient.post<ApiResponse<{ job_id: string; status: string }>>(`/api/jobs/${id}/cancel`);
      return res.data?.data || null;
    } catch {
      return null;
    }
  },
};
