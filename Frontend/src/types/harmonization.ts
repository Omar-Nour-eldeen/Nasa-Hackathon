export interface CalibrationMethod {
  id: string;
  name: string;
  description: string;
}

export interface CalibrationMetrics {
  mae: number;
  rmse: number;
  bias: number;
  correlation: number;
}

export interface CalibrationResult {
  factor?: number;
  slope?: number;
  intercept?: number;
  quantiles_count?: number;
  estimators?: number;
  feature_importances?: number[];
  metrics: CalibrationMetrics;
}

export interface HarmonizationRunRecord {
  id: string;
  method: string;
  status: string;
  target_sensor: string;
  reference_sensor: string;
  samples_count: number;
  metrics_mae: number;
  metrics_rmse: number;
  metrics_bias: number;
  metrics_correlation: number;
  parameters?: string | null;
  created_at: string;
}

export interface ActivityIndexPoint {
  acq_date: string;
  total_hotspots: number;
  mean_frp: number;
  total_energy: number;
  harmonized_activity_index: number;
}

export interface HarmonizationUncertainty {
  confidence_level: string;
  uncertainty_range_mw: string;
  spatial_error_km: string;
}

