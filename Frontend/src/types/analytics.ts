export interface HotspotTrendPoint {
  date: string;
  count: number;
}

export interface FrpTrendPoint {
  date: string;
  avg_frp: number;
  max_frp: number;
}

export interface LandCoverStat {
  land_cover: string;
  hotspot_count: number;
  avg_frp: number;
}

export interface RegionStat {
  region: string;
  hotspot_count: number;
  avg_frp: number;
  total_frp: number;
}

export interface SensorComparisonItem {
  sensor: string;
  count: number;
  avg_frp: number;
  max_frp: number;
}

export interface ExportHistoryRecord {
  id: string;
  file_name: string;
  file_type: string;
  file_path: string;
  record_count: number;
  created_at: string;
}

export interface BackgroundJob {
  id: string;
  job_type: string;
  status: 'queued' | 'running' | 'completed' | 'failed' | 'cancelled';
  progress: number;
  created_at: string;
  logs: string[];
}

