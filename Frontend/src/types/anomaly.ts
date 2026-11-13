export type AnomalySeverity = 'low' | 'medium' | 'high' | 'extreme';

export interface Anomaly {
  id: string;
  observation_id?: string;
  sensor: string;
  latitude: number;
  longitude: number;
  acq_date: string;
  frp: number;
  anomaly_score: number;
  severity: AnomalySeverity;
  anomaly_type?: string;
  detected_at?: string;
}

export interface AnomalyStatistics {
  total_anomalies: number;
  avg_frp: number;
  max_frp: number;
  high_severity_count: number;
  extreme_severity_count: number;
}

export interface AnomalySeverityCount {
  severity: AnomalySeverity;
  count: number;
  mean_frp: number;
  max_frp: number;
}

