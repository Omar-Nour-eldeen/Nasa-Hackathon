export interface Observation {
  id: string;
  sensor: 'MODIS' | 'VIIRS' | string;
  latitude: number;
  longitude: number;
  brightness?: number;
  scan?: number;
  track?: number;
  acq_date: string;
  acq_time?: string;
  satellite?: string;
  confidence?: string;
  version?: string;
  bright_t31?: number;
  frp?: number;
  daynight?: 'D' | 'N' | string;
  region?: string;
  land_cover?: string;
  harmonized?: boolean;
  harmonized_frp?: number;
  created_at?: string;
}

export interface MapHotspot {
  id: string;
  sensor: string;
  latitude: number;
  longitude: number;
  frp: number;
  harmonized_frp?: number;
  harmonized?: boolean;
  acq_date: string;
  confidence?: string;
  brightness?: number;
  region?: string;
}

export interface CalendarDayData {
  date: string;
  fire_count: number;
  intensity: number; // avg frp
}

export interface ObservationStatistics {
  total_observations: number;
  modis_count: number;
  viirs_count: number;
  avg_frp: number;
  max_frp: number;
  min_frp: number;
}

