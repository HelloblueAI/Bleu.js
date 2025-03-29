export interface Metric {
  name: string;
  value: number;
  timestamp: number;
  metadata?: Record<string, unknown>;
}

export interface Alert {
  modelId: string;
  metricName: string;
  metricValue: number;
  type: 'warning' | 'critical';
  message: string;
  timestamp: number;
  metadata?: Record<string, unknown>;
}

export interface Threshold {
  min?: number;
  max?: number;
}

export interface MonitoringStats {
  totalMetrics: number;
  totalAlerts: number;
  activeMonitors: number;
  lastCleanup: number;
} 