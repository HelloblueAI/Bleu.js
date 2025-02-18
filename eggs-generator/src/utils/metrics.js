class Metrics {
  constructor() {
    this.stats = {
      totalRequests: 0,
      successfulRequests: 0,
      failedRequests: 0,
      averageResponseTime: 0,
      typeStats: new Map(),
    };
  }

  recordGeneration(type, duration) {
    this.stats.totalRequests++;
    this.stats.successfulRequests++;

    const typeStats = this.stats.typeStats.get(type) || {
      count: 0,
      totalDuration: 0,
      averageDuration: 0,
    };

    typeStats.count++;
    typeStats.totalDuration += duration;
    typeStats.averageDuration = typeStats.totalDuration / typeStats.count;

    this.stats.typeStats.set(type, typeStats);
  }

  recordError(type) {
    this.stats.failedRequests++;
  }

  getMetrics() {
    return {
      ...this.stats,
      typeStats: Object.fromEntries(this.stats.typeStats),
      uptime: process.uptime(),
      timestamp: new Date().toISOString(),
    };
  }
}

export const metrics = new Metrics();
