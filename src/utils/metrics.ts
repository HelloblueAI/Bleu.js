import { MonitoringMetrics } from '../types';

export function generateMetrics(): MonitoringMetrics {
  return {
    cpu: {
      usage: 0,
      load: [0, 0, 0]
    },
    memory: {
      used: 0,
      total: 0,
      heapUsed: 0,
      heapTotal: 0
    },
    responseTime: {
      p50: 0,
      p90: 0,
      p95: 0,
      p99: 0
    },
    requests: {
      total: 0,
      success: 0,
      error: 0,
      rate: 0
    }
  };
} 