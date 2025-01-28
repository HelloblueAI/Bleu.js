import express from 'express';
import cors from 'cors';
import bodyParser from 'body-parser';
import cluster from 'cluster';
import os from 'os';
import { performance } from 'perf_hooks';
import Redis from 'ioredis';
import { WebSocketServer } from 'ws';
import http from 'http';

const CPU_CORES = os.cpus().length;
const METRICS_INTERVAL = 5000;
const CACHE_TTL = 300;

class MetricsCollector {
  metrics = new Map();
  histograms = new Map();
  counters = new Map();
  gauges = new Map();

  record(name, value, type = 'metric') {
    const metric = this.metrics.get(name) || {
      count: 0, sum: 0, min: Infinity, max: -Infinity,
      p95: 0, p99: 0, stddev: 0, values: []
    };

    metric.count++;
    metric.sum += value;
    metric.min = Math.min(metric.min, value);
    metric.max = Math.max(metric.max, value);
    metric.values.push(value);

    if (metric.values.length > 1000) metric.values.shift();

    const sorted = [...metric.values].sort((a, b) => a - b);
    metric.p95 = sorted[Math.floor(sorted.length * 0.95)];
    metric.p99 = sorted[Math.floor(sorted.length * 0.99)];

    const mean = metric.sum / metric.count;
    const squareDiffs = metric.values.map(x => Math.pow(x - mean, 2));
    metric.stddev = Math.sqrt(squareDiffs.reduce((a, b) => a + b) / metric.count);

    this.metrics.set(name, metric);
  }

  histogram(name, value) {
    const hist = this.histograms.get(name) || new Map();
    const bucket = Math.floor(value / 100) * 100;
    hist.set(bucket, (hist.get(bucket) || 0) + 1);
    this.histograms.set(name, hist);
  }

  counter(name, increment = 1) {
    const current = this.counters.get(name) || 0;
    this.counters.set(name, current + increment);
  }

  gauge(name, value) {
    this.gauges.set(name, value);
  }

  getMetrics() {
    return {
      metrics: Object.fromEntries(this.metrics),
      histograms: Object.fromEntries(this.histograms),
      counters: Object.fromEntries(this.counters),
      gauges: Object.fromEntries(this.gauges)
    };
  }
}

class CacheManager {
  constructor() {
    this.redis = new Redis();
    this.localCache = new Map();
  }

  async get(key) {
    const local = this.localCache.get(key);
    if (local && local.expires > Date.now()) return local.value;

    const value = await this.redis.get(key);
    if (value) {
      this.localCache.set(key, {
        value: JSON.parse(value),
        expires: Date.now() + CACHE_TTL * 1000
      });
      return JSON.parse(value);
    }
    return null;
  }

  async set(key, value, ttl = CACHE_TTL) {
    this.localCache.set(key, {
      value,
      expires: Date.now() + ttl * 1000
    });
    await this.redis.set(key, JSON.stringify(value), 'EX', ttl);
  }

  async cleanup() {
    for (const [key, value] of this.localCache.entries()) {
      if (value.expires <= Date.now()) {
        this.localCache.delete(key);
      }
    }
  }
}

class CircuitBreaker {
  constructor(options = {}) {
    this.failureThreshold = options.failureThreshold || 5;
    this.resetTimeout = options.resetTimeout || 60000;
    this.state = 'CLOSED';
    this.failures = 0;
    this.lastFailureTime = null;
  }

  async execute(fn) {
    if (this.state === 'OPEN') {
      if (Date.now() - this.lastFailureTime >= this.resetTimeout) {
        this.state = 'HALF_OPEN';
      } else {
        throw new Error('Circuit breaker is OPEN');
      }
    }

    try {
      const result = await fn();
      if (this.state === 'HALF_OPEN') {
        this.state = 'CLOSED';
        this.failures = 0;
      }
      return result;
    } catch (error) {
      this.failures++;
      this.lastFailureTime = Date.now();
      if (this.failures >= this.failureThreshold) {
        this.state = 'OPEN';
      }
      throw error;
    }
  }
}

class TemplateEngine {
  constructor(metrics) {
    this.templates = new Map();
    this.metrics = metrics;
    this.cache = new CacheManager();
    this.breaker = new CircuitBreaker();
  }

  registerTemplate(name, template) {
    this.templates.set(name, template);
  }

  async render(name, context) {
    const startTime = performance.now();
    try {
      const template = this.templates.get(name);
      if (!template) throw new Error(`Template not found: ${name}`);

      const cacheKey = `template:${name}:${JSON.stringify(context)}`;
      const cached = await this.cache.get(cacheKey);
      if (cached) {
        this.metrics.counter('template.cache.hit');
        return cached;
      }

      const result = await this.breaker.execute(async () => {
        const rendered = await template(context);
        await this.cache.set(cacheKey, rendered);
        return rendered;
      });

      const duration = performance.now() - startTime;
      this.metrics.record(`template.${name}.duration`, duration);
      this.metrics.histogram(`template.${name}.size`, result.length);

      return result;
    } catch (error) {
      this.metrics.counter('template.error');
      throw error;
    }
  }
}

if (cluster.isPrimary) {
  console.log(`Primary ${process.pid} is running`);

  for (let i = 0; i < CPU_CORES; i++) {
    cluster.fork();
  }

  cluster.on('exit', (worker, code, signal) => {
    console.log(`Worker ${worker.process.pid} died`);
    cluster.fork();
  });
} else {
  const server = http.createServer();
  const app = express();
  const wss = new WebSocketServer({ server });
  const metrics = new MetricsCollector();
  const templateEngine = new TemplateEngine(metrics);

  app.use(bodyParser.json({ limit: '50mb' }));
  app.use(cors({
    origin: process.env.ALLOWED_ORIGINS?.split(',') || '*',
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
    credentials: true,
    maxAge: 86400
  }));

  app.use((req, res, next) => {
    req.id = `${Date.now().toString(36)}-${Math.random().toString(36).substring(2)}`;
    const start = performance.now();

    res.on('finish', () => {
      const duration = performance.now() - start;
      metrics.record('http.duration', duration);
      metrics.histogram('http.response.time', duration);
      metrics.counter(`http.status.${res.statusCode}`);
    });

    next();
  });

  templateEngine.registerTemplate('service', require('./templates/service.js'));
  templateEngine.registerTemplate('api', require('./templates/api.js'));
  templateEngine.registerTemplate('model', require('./templates/model.js'));

  app.post('/api/generate-egg', async (req, res) => {
    const start = performance.now();
    try {
      const { type, parameters } = req.body;
      if (!type || !parameters) throw new Error('Missing required fields');

      const code = await templateEngine.render(type, parameters);
      const duration = performance.now() - start;

      metrics.record('generation.duration', duration);
      metrics.counter('generation.success');

      res.json({
        success: true,
        code,
        metadata: {
          requestId: req.id,
          generatedAt: new Date().toISOString(),
          duration: `${duration.toFixed(2)}ms`,
          engineVersion: '1.0.31'
        }
      });
    } catch (error) {
      metrics.counter('generation.error');
      res.status(500).json({
        success: false,
        error: error.message,
        metadata: {
          requestId: req.id,
          timestamp: new Date().toISOString()
        }
      });
    }
  });

  app.get('/api/health', (req, res) => {
    res.json({
      status: 'healthy',
      uptime: process.uptime(),
      memory: process.memoryUsage(),
      cpu: process.cpuUsage(),
      metrics: metrics.getMetrics(),
      timestamp: new Date().toISOString()
    });
  });

  wss.on('connection', (ws) => {
    ws.on('message', async (message) => {
      try {
        const { type, parameters } = JSON.parse(message);
        const code = await templateEngine.render(type, parameters);
        ws.send(JSON.stringify({ success: true, code }));
      } catch (error) {
        ws.send(JSON.stringify({ success: false, error: error.message }));
      }
    });
  });

  setInterval(() => {
    const stats = metrics.getMetrics();
    wss.clients.forEach(client => {
      if (client.readyState === WebSocket.OPEN) {
        client.send(JSON.stringify({ type: 'metrics', data: stats }));
      }
    });
  }, METRICS_INTERVAL);

  server.on('request', app);

  const port = process.env.PORT || 3001;
  server.listen(port, () => {
    console.log(`Worker ${process.pid} started on port ${port}`);
  });
}

export default app;
