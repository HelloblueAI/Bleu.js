import { promClient } from 'prom-client';

export interface MonitoringConfig {
  performance: {
    collectionInterval: number;
    maxResponseTimes: number;
    enableCPUProfiling: boolean;
    enableMemoryProfiling: boolean;
  };
  security: {
    scanInterval: number;
    criticalThreshold: number;
    enableVulnerabilityScanning: boolean;
    enableDependencyCheck: boolean;
    enableSystemHealthCheck: boolean;
  };
  metrics: {
    enablePrometheus: boolean;
    enableCustomMetrics: boolean;
    retentionPeriod: number;
    labels: Record<string, string>;
  };
  logging: {
    level: 'error' | 'warn' | 'info' | 'debug';
    format: 'json' | 'text';
    destination: 'console' | 'file' | 'both';
    filePath?: string;
  };
  alerts: {
    enableAlerts: boolean;
    cpuThreshold: number;
    memoryThreshold: number;
    responseTimeThreshold: number;
    errorRateThreshold: number;
    securityScoreThreshold: number;
    notificationChannels: ('email' | 'slack' | 'webhook')[];
    webhookUrl?: string;
    emailRecipients?: string[];
    slackWebhookUrl?: string;
  };
}

const defaultConfig: MonitoringConfig = {
  performance: {
    collectionInterval: 60000, // 1 minute
    maxResponseTimes: 1000,
    enableCPUProfiling: true,
    enableMemoryProfiling: true
  },
  security: {
    scanInterval: 3600000, // 1 hour
    criticalThreshold: 0,
    enableVulnerabilityScanning: true,
    enableDependencyCheck: true,
    enableSystemHealthCheck: true
  },
  metrics: {
    enablePrometheus: true,
    enableCustomMetrics: true,
    retentionPeriod: 604800000, // 7 days
    labels: {
      environment: process.env.NODE_ENV || 'development',
      application: 'bleujs'
    }
  },
  logging: {
    level: 'info',
    format: 'json',
    destination: 'console'
  },
  alerts: {
    enableAlerts: true,
    cpuThreshold: 80, // 80%
    memoryThreshold: 85, // 85%
    responseTimeThreshold: 1000, // 1 second
    errorRateThreshold: 5, // 5%
    securityScoreThreshold: 70, // 70%
    notificationChannels: ['console']
  }
};

export class MonitoringConfigManager {
  private static instance: MonitoringConfigManager;
  private config: MonitoringConfig;
  private prometheusRegistry: typeof promClient.Registry;

  private constructor() {
    this.config = { ...defaultConfig };
    this.prometheusRegistry = new promClient.Registry();
    this.initializePrometheus();
  }

  public static getInstance(): MonitoringConfigManager {
    if (!MonitoringConfigManager.instance) {
      MonitoringConfigManager.instance = new MonitoringConfigManager();
    }
    return MonitoringConfigManager.instance;
  }

  private initializePrometheus(): void {
    if (this.config.metrics.enablePrometheus) {
      // Add default metrics
      promClient.collectDefaultMetrics({
        register: this.prometheusRegistry,
        prefix: 'bleujs_',
        labels: this.config.metrics.labels
      });
    }
  }

  public getConfig(): MonitoringConfig {
    return { ...this.config };
  }

  public updateConfig(newConfig: Partial<MonitoringConfig>): void {
    this.config = {
      ...this.config,
      ...newConfig
    };
  }

  public getPrometheusRegistry(): typeof promClient.Registry {
    return this.prometheusRegistry;
  }

  public shouldAlert(metric: keyof MonitoringConfig['alerts'], value: number): boolean {
    if (!this.config.alerts.enableAlerts) return false;

    const threshold = this.config.alerts[metric];
    if (typeof threshold !== 'number') return false;

    switch (metric) {
      case 'cpuThreshold':
        return value > threshold;
      case 'memoryThreshold':
        return value > threshold;
      case 'responseTimeThreshold':
        return value > threshold;
      case 'errorRateThreshold':
        return value > threshold;
      case 'securityScoreThreshold':
        return value < threshold;
      default:
        return false;
    }
  }

  public getNotificationChannels(): MonitoringConfig['alerts']['notificationChannels'] {
    return [...this.config.alerts.notificationChannels];
  }

  public getWebhookUrl(): string | undefined {
    return this.config.alerts.webhookUrl;
  }

  public getEmailRecipients(): string[] | undefined {
    return this.config.alerts.emailRecipients;
  }

  public getSlackWebhookUrl(): string | undefined {
    return this.config.alerts.slackWebhookUrl;
  }

  public getLoggingConfig(): MonitoringConfig['logging'] {
    return { ...this.config.logging };
  }

  public getPerformanceConfig(): MonitoringConfig['performance'] {
    return { ...this.config.performance };
  }

  public getSecurityConfig(): MonitoringConfig['security'] {
    return { ...this.config.security };
  }

  public getMetricsConfig(): MonitoringConfig['metrics'] {
    return { ...this.config.metrics };
  }
}

export const monitoringConfig = MonitoringConfigManager.getInstance(); 