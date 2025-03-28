import { Request, Response, NextFunction } from 'express';
import { PerformanceMonitor } from '../monitoring/performanceMonitor';
import { generateSecurityReport } from '../security/securityAnalyzer';
import { promClient } from 'prom-client';

// Initialize performance monitor
const performanceMonitor = new PerformanceMonitor();

// Prometheus metrics for middleware
const middlewareMetrics = {
  requestDuration: new promClient.Histogram({
    name: 'http_request_duration_seconds',
    help: 'Duration of HTTP requests in seconds',
    labelNames: ['method', 'route', 'status_code'],
    buckets: [0.1, 0.5, 1, 2, 5]
  }),
  activeRequests: new promClient.Gauge({
    name: 'http_active_requests',
    help: 'Number of active HTTP requests',
    labelNames: ['method', 'route']
  }),
  requestSize: new promClient.Histogram({
    name: 'http_request_size_bytes',
    help: 'Size of HTTP requests in bytes',
    labelNames: ['method', 'route'],
    buckets: [100, 1000, 10000, 100000, 1000000]
  }),
  responseSize: new promClient.Histogram({
    name: 'http_response_size_bytes',
    help: 'Size of HTTP responses in bytes',
    labelNames: ['method', 'route'],
    buckets: [100, 1000, 10000, 100000, 1000000]
  })
};

export function monitoringMiddleware() {
  return async (req: Request, res: Response, next: NextFunction) => {
    const startTime = Date.now();
    const method = req.method;
    const route = req.route?.path || req.path;

    // Record request start
    middlewareMetrics.activeRequests.inc({ method, route });
    middlewareMetrics.requestSize.observe({ method, route }, req.headers['content-length'] || 0);

    // Store original response methods
    const originalJson = res.json;
    const originalSend = res.send;

    // Override response methods to capture response size
    res.json = function (body: any) {
      const responseSize = JSON.stringify(body).length;
      middlewareMetrics.responseSize.observe({ method, route }, responseSize);
      return originalJson.call(this, body);
    };

    res.send = function (body: any) {
      const responseSize = typeof body === 'string' ? body.length : JSON.stringify(body).length;
      middlewareMetrics.responseSize.observe({ method, route }, responseSize);
      return originalSend.call(this, body);
    };

    // Record response time
    res.on('finish', () => {
      const duration = (Date.now() - startTime) / 1000;
      middlewareMetrics.requestDuration.observe(
        { method, route, status_code: res.statusCode.toString() },
        duration
      );
      middlewareMetrics.activeRequests.dec({ method, route });
      performanceMonitor.recordResponseTime(duration * 1000); // Convert to milliseconds
      performanceMonitor.recordRequest(res.statusCode < 400);
    });

    // Generate security report periodically
    if (Math.random() < 0.01) { // 1% chance to generate report on each request
      try {
        const securityReport = await generateSecurityReport();
        // Log security report if there are critical issues
        if (securityReport.vulnerabilities.critical > 0) {
          console.error('Critical security vulnerabilities detected:', securityReport);
        }
      } catch (error) {
        console.error('Error generating security report:', error);
      }
    }

    next();
  };
}

export function metricsEndpoint() {
  return async (req: Request, res: Response) => {
    try {
      // Get current metrics
      const performanceMetrics = performanceMonitor.getMetrics();
      const securityReport = await generateSecurityReport();

      // Format response
      const response = {
        timestamp: new Date().toISOString(),
        performance: {
          cpu: {
            usage: performanceMetrics.cpu.usage.toFixed(2) + '%',
            load: performanceMetrics.cpu.load.map(load => load.toFixed(2))
          },
          memory: {
            used: formatBytes(performanceMetrics.memory.used),
            total: formatBytes(performanceMetrics.memory.total),
            heapUsed: formatBytes(performanceMetrics.memory.heapUsed),
            heapTotal: formatBytes(performanceMetrics.memory.heapTotal)
          },
          responseTime: {
            p50: performanceMetrics.responseTime.p50.toFixed(2) + 'ms',
            p90: performanceMetrics.responseTime.p90.toFixed(2) + 'ms',
            p95: performanceMetrics.responseTime.p95.toFixed(2) + 'ms',
            p99: performanceMetrics.responseTime.p99.toFixed(2) + 'ms'
          },
          requests: {
            total: performanceMetrics.requests.total,
            success: performanceMetrics.requests.success,
            error: performanceMetrics.requests.error,
            rate: performanceMetrics.requests.rate.toFixed(2) + '/s'
          }
        },
        security: {
          score: securityReport.securityScore,
          vulnerabilities: securityReport.vulnerabilities,
          recommendations: securityReport.recommendations,
          systemHealth: securityReport.systemHealth
        }
      };

      res.json(response);
    } catch (error) {
      console.error('Error generating metrics endpoint response:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  };
}

export function prometheusMetricsEndpoint() {
  return async (req: Request, res: Response) => {
    try {
      res.set('Content-Type', promClient.register.contentType);
      const metrics = await promClient.register.metrics();
      res.send(metrics);
    } catch (error) {
      console.error('Error generating Prometheus metrics:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  };
}

function formatBytes(bytes: number): string {
  const units = ['B', 'KB', 'MB', 'GB', 'TB'];
  let size = bytes;
  let unitIndex = 0;

  while (size >= 1024 && unitIndex < units.length - 1) {
    size /= 1024;
    unitIndex++;
  }

  return `${size.toFixed(2)} ${units[unitIndex]}`;
}

export { performanceMonitor }; 