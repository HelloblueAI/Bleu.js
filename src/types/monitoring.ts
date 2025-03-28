import { DeepLearningModel } from '../ai/deepLearning';

export interface MonitoringConfig {
  enabled: boolean;
  interval: number;
  metrics: Record<string, number>;
  alertThresholds: {
    lowAccuracy: number;
    highLatency: number;
    highErrorRate: number;
  };
  retention?: {
    metrics: number;
    alerts: number;
  };
}

export interface MonitoringMetrics {
  accuracy: number;
  latency: number;
  throughput: number;
  errorRate: number;
  timestamp: number;
}

export interface Alert {
  id: string;
  type: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  message: string;
  details?: Record<string, any>;
  timestamp: number;
  resolved?: boolean;
  resolvedAt?: number;
}

export interface MetricsSnapshot {
  timestamp: number;
  metrics: MonitoringMetrics;
  alerts?: Alert[];
}

export interface Metric {
  value: number;
  timestamp: number;
  tags?: Record<string, string>;
}

export interface TimeRange {
  start: number;
  end: number;
} 