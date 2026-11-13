export interface ApiResponse<T> {
  status: 'success' | 'error';
  message: string;
  data: T;
  count?: number;
  [key: string]: unknown;
}

export interface HealthStatus {
  status: string;
  database: string;
  endpoints: string[];
}

