export interface ModelMetrics {
  accuracy: number;
  loss: number;
  precision: number;
  recall: number;
  f1Score: number;
  timestamp: string;
}

export interface Metric {
  name: string;
  value: number;
  timestamp: Date;
}

export interface AlertThresholds {
  [key: string]: {
    warning: number;
    critical: number;
  };
}

export interface MonitorConfig {
  monitoringInterval?: number;
  retentionPeriod?: number;
  maxMetrics?: number;
  alertThresholds?: AlertThresholds;
} 