export interface MonitoringConfig {
  readonly enabled: boolean;
  readonly interval: number;
  readonly metrics: Record<string, number>;
  readonly alertThresholds: {
    readonly lowAccuracy: number;
    readonly highLatency: number;
    readonly highErrorRate: number;
  };
  readonly retention?: {
    readonly metrics: number;
    readonly alerts: number;
  };
}

export interface MonitoringMetrics {
  readonly accuracy: number;
  readonly latency: number;
  readonly throughput: number;
  readonly errorRate: number;
  readonly timestamp: number;
}

export interface Alert {
  readonly id: string;
  readonly type: string;
  readonly severity: 'low' | 'medium' | 'high' | 'critical';
  readonly message: string;
  readonly details?: Record<string, any>;
  readonly timestamp: number;
  readonly resolved?: boolean;
  readonly resolvedAt?: number;
}

export interface MetricsSnapshot {
  readonly timestamp: number;
  readonly metrics: MonitoringMetrics;
  readonly alerts?: Alert[];
}

export interface Metric {
  readonly value: number;
  readonly timestamp: number;
  readonly tags?: Record<string, string>;
}

export interface TimeRange {
  readonly start: number;
  readonly end: number;
}

export interface ModelMetrics {
  timestamp: number;
  accuracy: number;
  loss: number;
  latency: number;
  memoryUsage: number;
  gpuUsage?: number;
  customMetrics?: Record<string, number>;
} 