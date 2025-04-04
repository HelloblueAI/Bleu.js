import { EventEmitter } from 'events';
import * as os from 'os';

interface SystemMetrics {
  cpu: {
    usage: number;
    loadAverage: number[];
    temperature?: number;
    frequency: number;
  };
  memory: {
    total: number;
    used: number;
    free: number;
    cached?: number;
    buffers?: number;
    percentage: number;
  };
  network: {
    bytesIn: number;
    bytesOut: number;
    packetsIn: number;
    packetsOut: number;
    errors: number;
    latency: number;
  };
  disk: {
    total: number;
    used: number;
    free: number;
    readBytes: number;
    writeBytes: number;
    iops: number;
  };
  process: {
    uptime: number;
    pid: number;
    memoryUsage: NodeJS.MemoryUsage;
    cpuUsage: NodeJS.CpuUsage;
    threadCount: number;
  };
  predictions: {
    cpuTrend: 'increasing' | 'decreasing' | 'stable';
    memoryExhaustion?: Date;
    diskExhaustion?: Date;
    performanceIssues: string[];
  };
}

interface SystemMonitorConfig {
  updateInterval: number;
  enablePredictions: boolean;
  alertThresholds: {
    cpu: number;
    memory: number;
    disk: number;
    network: number;
  };
  retentionPeriod: number; // How long to keep historical data in minutes
}

export class SystemMonitor extends EventEmitter {
  private readonly config: SystemMonitorConfig;
  private readonly metrics: SystemMetrics = {
    cpu: {
      usage: 0,
      loadAverage: os.loadavg(),
      frequency: os.cpus()[0].speed,
    },
    memory: {
      total: os.totalmem(),
      used: 0,
      free: os.freemem(),
      percentage: 0,
    },
    network: {
      bytesIn: 0,
      bytesOut: 0,
      packetsIn: 0,
      packetsOut: 0,
      errors: 0,
      latency: 0,
    },
    disk: {
      total: 0,
      used: 0,
      free: 0,
      readBytes: 0,
      writeBytes: 0,
      iops: 0,
    },
    process: {
      uptime: process.uptime(),
      pid: process.pid,
      memoryUsage: process.memoryUsage(),
      cpuUsage: process.cpuUsage(),
      threadCount: 1, // Default for Node.js
    },
    predictions: {
      cpuTrend: 'stable',
      performanceIssues: [],
    },
  };
  private updateInterval: NodeJS.Timeout | null;
  private historicalData: Array<{
    timestamp: number;
    metrics: SystemMetrics;
  }> = [];
  private readonly startTime: number;
  private previousNetworkStats: {
    bytesIn: number;
    bytesOut: number;
    timestamp: number;
  };

  constructor(config: Partial<SystemMonitorConfig> = {}) {
    super();
    this.config = {
      updateInterval: config.updateInterval ?? 1000,
      enablePredictions: config.enablePredictions ?? true,
      alertThresholds: {
        cpu: config.alertThresholds?.cpu ?? 80,
        memory: config.alertThresholds?.memory ?? 90,
        disk: config.alertThresholds?.disk ?? 90,
        network: config.alertThresholds?.network ?? 80,
      },
      retentionPeriod: config.retentionPeriod ?? 60,
    };

    this.startTime = Date.now();
    this.previousNetworkStats = {
      bytesIn: 0,
      bytesOut: 0,
      timestamp: this.startTime,
    };

    this.updateInterval = null;

    this.startMonitoring();
  }

  private startMonitoring(): void {
    this.updateMetrics();
    this.updateInterval = setInterval(() => {
      this.updateMetrics();
    }, this.config.updateInterval);
  }

  private async updateMetrics(): Promise<void> {
    try {
      // Update CPU metrics
      await this.updateCPUMetrics();

      // Update memory metrics
      this.updateMemoryMetrics();

      // Update network metrics
      await this.updateNetworkMetrics();

      // Update disk metrics
      await this.updateDiskMetrics();

      // Update process metrics
      this.updateProcessMetrics();

      // Store historical data
      this.storeHistoricalData();

      // Generate predictions if enabled
      if (this.config.enablePredictions) {
        this.generatePredictions();
      }

      // Check for alerts
      this.checkAlerts();

      // Emit metrics update
      this.emit('metrics-update', this.metrics);
    } catch (error) {
      this.emit('monitoring-error', error);
    }
  }

  private async updateCPUMetrics(): Promise<void> {
    const cpus = os.cpus();
    const totalTimes = cpus.reduce(
      (acc, cpu) => {
        acc.idle += cpu.times.idle;
        acc.total += Object.values(cpu.times).reduce((sum, time) => sum + time, 0);
        return acc;
      },
      { idle: 0, total: 0 }
    );

    this.metrics.cpu = {
      ...this.metrics.cpu,
      usage: ((1 - totalTimes.idle / totalTimes.total) * 100),
      loadAverage: os.loadavg(),
      frequency: cpus[0].speed,
    };
  }

  private updateMemoryMetrics(): void {
    const total = os.totalmem();
    const free = os.freemem();
    const used = total - free;

    this.metrics.memory = {
      total,
      free,
      used,
      percentage: (used / total) * 100,
      cached: 0, // Platform specific
      buffers: 0, // Platform specific
    };
  }

  private async updateNetworkMetrics(): Promise<void> {
    const interfaces = os.networkInterfaces();
    let bytesIn = 0;
    let bytesOut = 0;
    let packetsIn = 0;
    let packetsOut = 0;
    let errors = 0;

    Object.values(interfaces).forEach(iface => {
      if (!iface) return;
      iface.forEach(details => {
        if (details.internal) return;
        // Note: This is a simplified version. Real implementation would need OS-specific stats
        bytesIn += Math.random() * 1000; // Simulated network stats
        bytesOut += Math.random() * 1000;
        packetsIn += Math.random() * 10;
        packetsOut += Math.random() * 10;
      });
    });

    const now = Date.now();
    const timeDiff = (now - this.previousNetworkStats.timestamp) / 1000;
    const bytesInRate = (bytesIn - this.previousNetworkStats.bytesIn) / timeDiff;
    const bytesOutRate = (bytesOut - this.previousNetworkStats.bytesOut) / timeDiff;

    this.metrics.network = {
      bytesIn: bytesInRate,
      bytesOut: bytesOutRate,
      packetsIn,
      packetsOut,
      errors,
      latency: await this.measureNetworkLatency(),
    };

    this.previousNetworkStats = {
      bytesIn,
      bytesOut,
      timestamp: now,
    };
  }

  private async measureNetworkLatency(): Promise<number> {
    const start = process.hrtime();
    try {
      // Simulate network request
      await new Promise(resolve => setTimeout(resolve, Math.random() * 10));
      const [seconds, nanoseconds] = process.hrtime(start);
      return seconds * 1000 + nanoseconds / 1000000;
    } catch {
      return 0;
    }
  }

  private async updateDiskMetrics(): Promise<void> {
    // Note: This is a simplified version. Real implementation would use fs.statfs or similar
    this.metrics.disk = {
      total: 1000000000000, // 1TB
      used: 500000000000,  // 500GB
      free: 500000000000,  // 500GB
      readBytes: Math.random() * 1000000,
      writeBytes: Math.random() * 1000000,
      iops: Math.random() * 100,
    };
  }

  private updateProcessMetrics(): void {
    this.metrics.process = {
      uptime: process.uptime(),
      pid: process.pid,
      memoryUsage: process.memoryUsage(),
      cpuUsage: process.cpuUsage(),
      threadCount: 1, // Default for Node.js
    };
  }

  private storeHistoricalData(): void {
    const now = Date.now();
    this.historicalData.push({
      timestamp: now,
      metrics: { ...this.metrics },
    });

    // Remove old data based on retention period
    const retentionTime = now - (this.config.retentionPeriod * 60 * 1000);
    this.historicalData = this.historicalData.filter(data => data.timestamp >= retentionTime);
  }

  private generatePredictions(): void {
    if (this.historicalData.length < 2) return;

    const predictions: SystemMetrics['predictions'] = {
      cpuTrend: this.predictTrend(this.historicalData.map(d => d.metrics.cpu.usage)),
      performanceIssues: [],
    };

    // Predict memory exhaustion
    const memoryTrend = this.calculateTrendLine(
      this.historicalData.map(d => d.metrics.memory.percentage)
    );
    if (memoryTrend.slope > 0) {
      const timeToExhaustion = (100 - this.metrics.memory.percentage) / memoryTrend.slope;
      predictions.memoryExhaustion = new Date(Date.now() + timeToExhaustion * 60 * 1000);
    }

    // Predict disk exhaustion
    const diskTrend = this.calculateTrendLine(
      this.historicalData.map(d => (d.metrics.disk.used / d.metrics.disk.total) * 100)
    );
    if (diskTrend.slope > 0) {
      const timeToExhaustion = (100 - (this.metrics.disk.used / this.metrics.disk.total) * 100) / diskTrend.slope;
      predictions.diskExhaustion = new Date(Date.now() + timeToExhaustion * 60 * 1000);
    }

    // Identify potential performance issues
    if (this.metrics.cpu.usage > 80) {
      predictions.performanceIssues.push('High CPU utilization may cause performance degradation');
    }
    if (this.metrics.memory.percentage > 85) {
      predictions.performanceIssues.push('Memory pressure detected');
    }
    if (this.metrics.network.latency > 100) {
      predictions.performanceIssues.push('High network latency detected');
    }

    this.metrics.predictions = predictions;
  }

  private predictTrend(values: number[]): 'increasing' | 'decreasing' | 'stable' {
    const trend = this.calculateTrendLine(values);
    if (Math.abs(trend.slope) < 0.1) return 'stable';
    return trend.slope > 0 ? 'increasing' : 'decreasing';
  }

  private calculateTrendLine(values: number[]): { slope: number; intercept: number } {
    const n = values.length;
    if (n < 2) return { slope: 0, intercept: 0 };

    const x = Array.from({ length: n }, (_, i) => i);
    const sumX = x.reduce((a, b) => a + b, 0);
    const sumY = values.reduce((a, b) => a + b, 0);
    const sumXY = x.reduce((sum, xi, i) => sum + xi * values[i], 0);
    const sumXX = x.reduce((sum, xi) => sum + xi * xi, 0);

    const slope = (n * sumXY - sumX * sumY) / (n * sumXX - sumX * sumX);
    const intercept = (sumY - slope * sumX) / n;

    return { slope, intercept };
  }

  private checkAlerts(): void {
    const alerts: string[] = [];

    if (this.metrics.cpu.usage > this.config.alertThresholds.cpu) {
      alerts.push(`High CPU usage: ${this.metrics.cpu.usage.toFixed(1)}%`);
    }

    if (this.metrics.memory.percentage > this.config.alertThresholds.memory) {
      alerts.push(`High memory usage: ${this.metrics.memory.percentage.toFixed(1)}%`);
    }

    const diskUsagePercent = (this.metrics.disk.used / this.metrics.disk.total) * 100;
    if (diskUsagePercent > this.config.alertThresholds.disk) {
      alerts.push(`High disk usage: ${diskUsagePercent.toFixed(1)}%`);
    }

    if (alerts.length > 0) {
      this.emit('system-alerts', alerts);
    }
  }

  getMetrics(): SystemMetrics {
    return { ...this.metrics };
  }

  getHistoricalData(): Array<{ timestamp: number; metrics: SystemMetrics }> {
    return [...this.historicalData];
  }

  getPredictions(): SystemMetrics['predictions'] {
    return { ...this.metrics.predictions };
  }

  cleanup(): void {
    if (this.updateInterval !== null) {
      clearInterval(this.updateInterval);
    }
    this.removeAllListeners();
    this.historicalData = [];
  }
} 