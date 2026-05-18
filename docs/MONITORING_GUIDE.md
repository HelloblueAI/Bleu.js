# Bleu.js Monitoring Guide

**Purpose:** This guide provides monitoring strategies, metrics, and alerting recommendations for maintaining the health and performance of the Bleu.js platform.

---

## 📊 Key Performance Indicators (KPIs)

### 1. Application Health KPIs

| Metric | Target | Warning | Critical | Check Frequency |
|--------|--------|---------|----------|-----------------|
| **API Uptime** | ≥99.9% | <99.5% | <99% | Real-time |
| **API Response Time (p95)** | <500ms | >800ms | >1500ms | 1 min |
| **Error Rate** | <0.1% | >0.5% | >1% | 1 min |
| **CPU Usage** | <70% | >85% | >95% | 5 min |
| **Memory Usage** | <80% | >90% | >95% | 5 min |
| **Database Connections** | <80% pool | >90% | >95% | 1 min |

### 2. Business KPIs

| Metric | Target | Tracking Method |
|--------|--------|-----------------|
| **API Calls/Day** | Growing | Log aggregation |
| **Active Users** | Growing | Session tracking |
| **Model Predictions/Day** | Stable/Growing | Event tracking |
| **Quantum Jobs/Day** | Stable/Growing | Job queue metrics |
| **Average Session Duration** | >5 min | Analytics |

### 3. Quality KPIs

| Metric | Target | Check Frequency |
|--------|--------|-----------------|
| **Test Coverage** | ≥40% | Per commit |
| **CI/CD Success Rate** | ≥95% | Per run |
| **Security Vulnerabilities** | 0 critical | Daily |
| **Code Quality Score** | A | Per PR |
| **Documentation Completeness** | ≥90% | Weekly |

---

## 🔍 Monitoring Stack

### Recommended Tools

#### 1. Application Performance Monitoring (APM)
**Primary: Prometheus + Grafana**
```bash
# Docker setup
docker-compose -f docker-compose.monitoring.yml up -d
```

**Alternative Options:**
- Datadog (SaaS, comprehensive)
- New Relic (SaaS, easy setup)
- Elastic APM (Self-hosted, powerful)

#### 2. Log Aggregation
**Primary: ELK Stack (Elasticsearch, Logstash, Kibana)**
```bash
# Log format in application
import structlog
logger = structlog.get_logger()
logger.info("api_request", endpoint="/api/v1/chat", duration_ms=250)
```

**Alternative Options:**
- Loki + Grafana (lighter weight)
- CloudWatch Logs (AWS)
- Google Cloud Logging (GCP)

#### 3. Error Tracking
**Primary: Sentry**
```python
import sentry_sdk
sentry_sdk.init(
    dsn="YOUR_DSN",
    traces_sample_rate=0.1,
    environment="production"
)
```

**Alternative Options:**
- Rollbar
- Bugsnag
- Custom error logging

#### 4. Synthetic Monitoring
**Primary: Uptime Robot** (free tier available)
- Monitor: https://api.bleujs.org/health
- Frequency: 5 minutes
- Alert: Email/SMS/Slack

**Alternative Options:**
- Pingdom
- StatusCake
- Custom health check script

---

## 🚨 Alerting Strategy

### Alert Levels

#### 🔴 **CRITICAL** - Immediate Action Required (24/7)
- API down (health check fails)
- Error rate >1%
- Database connection failure
- Security breach detected
- CPU/Memory >95% for >5 minutes

**Response Time:** <5 minutes  
**Notification:** PagerDuty, SMS, Phone call

#### 🟠 **HIGH** - Action Required (Business Hours)
- API response time p95 >1500ms
- Error rate >0.5%
- Test coverage drops >5%
- Security vulnerability (high severity)
- Deployment failure

**Response Time:** <30 minutes  
**Notification:** Slack, Email

#### 🟡 **MEDIUM** - Investigation Needed (Next Day)
- API response time p95 >800ms
- CPU/Memory >85%
- Dependency update available
- Minor test failures
- Documentation gaps identified

**Response Time:** <24 hours  
**Notification:** Slack, Email (digest)

#### 🟢 **LOW** - Informational (Weekly Review)
- Performance degradation <10%
- Non-critical package updates
- Code quality improvements needed
- Documentation improvements needed

**Response Time:** Next sprint  
**Notification:** Weekly report

### Alert Configuration Examples

#### Prometheus Alert Rules
```yaml
# /etc/prometheus/alerts.yml
groups:
  - name: bleujs_alerts
    interval: 30s
    rules:
      - alert: HighErrorRate
        expr: rate(http_requests_total{status=~"5.."}[5m]) > 0.01
        for: 5m
        labels:
          severity: critical
        annotations:
          summary: "High error rate detected"
          description: "Error rate is {{ $value }} (>1%)"

      - alert: SlowAPIResponse
        expr: histogram_quantile(0.95, http_request_duration_seconds_bucket) > 1.5
        for: 10m
        labels:
          severity: high
        annotations:
          summary: "Slow API responses"
          description: "P95 latency is {{ $value }}s"

      - alert: HighMemoryUsage
        expr: (node_memory_Active_bytes / node_memory_MemTotal_bytes) > 0.9
        for: 5m
        labels:
          severity: high
        annotations:
          summary: "High memory usage"
          description: "Memory usage is {{ $value }}%"
```

---

## 📈 Metrics to Collect

### Application Metrics

#### API Metrics
```python
# In src/middleware/metrics.py
from prometheus_client import Counter, Histogram, Gauge

# Request metrics
api_requests_total = Counter(
    'api_requests_total',
    'Total API requests',
    ['method', 'endpoint', 'status']
)

api_request_duration = Histogram(
    'api_request_duration_seconds',
    'API request duration',
    ['method', 'endpoint']
)

# Model metrics
model_predictions_total = Counter(
    'model_predictions_total',
    'Total model predictions',
    ['model_type']
)

model_prediction_duration = Histogram(
    'model_prediction_duration_seconds',
    'Model prediction duration',
    ['model_type']
)

# Quantum metrics
quantum_jobs_total = Counter(
    'quantum_jobs_total',
    'Total quantum jobs',
    ['backend', 'status']
)

quantum_job_duration = Histogram(
    'quantum_job_duration_seconds',
    'Quantum job duration',
    ['backend']
)
```

#### System Metrics
- CPU usage (per process)
- Memory usage (RSS, VMS)
- Disk I/O (read/write bytes)
- Network I/O (sent/received bytes)
- Thread/process count
- File descriptor count

#### Database Metrics
- Connection pool usage
- Query duration (p50, p95, p99)
- Slow queries (>1s)
- Transaction count
- Lock wait time
- Table sizes

#### Cache Metrics (Redis)
- Hit rate
- Miss rate
- Eviction rate
- Memory usage
- Connection count
- Command duration

---

## 🔧 Implementation Guide

### Step 1: Add Prometheus Metrics to FastAPI

```python
# src/middleware/prometheus_middleware.py
from prometheus_client import Counter, Histogram, generate_latest
from starlette.middleware.base import BaseHTTPMiddleware
import time

class PrometheusMiddleware(BaseHTTPMiddleware):
    async def dispatch(self, request, call_next):
        start_time = time.time()
        
        response = await call_next(request)
        
        duration = time.time() - start_time
        api_request_duration.labels(
            method=request.method,
            endpoint=request.url.path
        ).observe(duration)
        
        api_requests_total.labels(
            method=request.method,
            endpoint=request.url.path,
            status=response.status_code
        ).inc()
        
        return response

# Add to app
from src.middleware.prometheus_middleware import PrometheusMiddleware
app.add_middleware(PrometheusMiddleware)

# Expose metrics endpoint
@app.get("/metrics")
async def metrics():
    from prometheus_client import generate_latest, CONTENT_TYPE_LATEST
    return Response(generate_latest(), media_type=CONTENT_TYPE_LATEST)
```

### Step 2: Deploy Prometheus

```yaml
# docker-compose.monitoring.yml
version: '3.8'

services:
  prometheus:
    image: prom/prometheus:latest
    volumes:
      - ./monitoring/prometheus.yml:/etc/prometheus/prometheus.yml
      - ./monitoring/alerts.yml:/etc/prometheus/alerts.yml
      - prometheus_data:/prometheus
    ports:
      - "9090:9090"
    command:
      - '--config.file=/etc/prometheus/prometheus.yml'
      - '--storage.tsdb.path=/prometheus'
    restart: unless-stopped

  grafana:
    image: grafana/grafana:latest
    volumes:
      - grafana_data:/var/lib/grafana
      - ./monitoring/dashboards:/etc/grafana/provisioning/dashboards
    ports:
      - "3001:3000"
    environment:
      - GF_SECURITY_ADMIN_PASSWORD=admin
      - GF_USERS_ALLOW_SIGN_UP=false
    restart: unless-stopped

  alertmanager:
    image: prom/alertmanager:latest
    volumes:
      - ./monitoring/alertmanager.yml:/etc/alertmanager/alertmanager.yml
    ports:
      - "9093:9093"
    restart: unless-stopped

volumes:
  prometheus_data:
  grafana_data:
```

### Step 3: Configure Prometheus Scraping

```yaml
# monitoring/prometheus.yml
global:
  scrape_interval: 15s
  evaluation_interval: 15s

rule_files:
  - "alerts.yml"

alerting:
  alertmanagers:
    - static_configs:
        - targets:
            - alertmanager:9093

scrape_configs:
  - job_name: 'bleujs-api'
    static_configs:
      - targets: ['backend:4003']
    metrics_path: '/metrics'
    scrape_interval: 10s

  - job_name: 'bleujs-core'
    static_configs:
      - targets: ['core-engine:6000']
    metrics_path: '/metrics'

  - job_name: 'redis'
    static_configs:
      - targets: ['redis:6379']

  - job_name: 'postgres'
    static_configs:
      - targets: ['postgres:5432']
```

### Step 4: Create Grafana Dashboard

**Import Pre-built Dashboards:**
1. FastAPI Dashboard (ID: 17733)
2. PostgreSQL Dashboard (ID: 9628)
3. Redis Dashboard (ID: 11835)
4. Node Exporter (ID: 1860)

**Custom Bleu.js Dashboard:**
```json
{
  "dashboard": {
    "title": "Bleu.js Overview",
    "panels": [
      {
        "title": "API Request Rate",
        "targets": [
          {
            "expr": "rate(api_requests_total[5m])",
            "legendFormat": "{{method}} {{endpoint}}"
          }
        ]
      },
      {
        "title": "API Latency (p95)",
        "targets": [
          {
            "expr": "histogram_quantile(0.95, api_request_duration_seconds_bucket)",
            "legendFormat": "P95"
          }
        ]
      },
      {
        "title": "Error Rate",
        "targets": [
          {
            "expr": "rate(api_requests_total{status=~\"5..\"}[5m])",
            "legendFormat": "5xx errors"
          }
        ]
      }
    ]
  }
}
```

### Step 5: Set Up Alerting

```yaml
# monitoring/alertmanager.yml
global:
  resolve_timeout: 5m

route:
  group_by: ['alertname', 'severity']
  group_wait: 10s
  group_interval: 10s
  repeat_interval: 12h
  receiver: 'slack-notifications'
  routes:
    - match:
        severity: critical
      receiver: 'pagerduty'
      continue: true
    - match:
        severity: high
      receiver: 'slack-critical'
    - match:
        severity: medium
      receiver: 'slack-warnings'

receivers:
  - name: 'slack-notifications'
    slack_configs:
      - api_url: 'YOUR_SLACK_WEBHOOK_URL'
        channel: '#bleujs-alerts'
        title: 'Bleu.js Alert'
        text: '{{ range .Alerts }}{{ .Annotations.summary }}{{ end }}'

  - name: 'slack-critical'
    slack_configs:
      - api_url: 'YOUR_SLACK_WEBHOOK_URL'
        channel: '#bleujs-critical'
        color: 'danger'

  - name: 'pagerduty'
    pagerduty_configs:
      - service_key: 'YOUR_PAGERDUTY_KEY'
```

---

## 📊 Dashboards

### Main Dashboard Panels

1. **Overview**
   - Total requests (24h)
   - Active users (24h)
   - Error rate (1h)
   - Average response time (1h)

2. **API Performance**
   - Request rate (requests/s)
   - Response time (p50, p95, p99)
   - Error rate by endpoint
   - Status code distribution

3. **ML Performance**
   - Predictions per minute
   - Model inference time
   - Model accuracy (if tracked)
   - Active models

4. **Quantum Performance**
   - Jobs per minute
   - Circuit depth distribution
   - Backend utilization
   - Job success rate

5. **System Resources**
   - CPU usage
   - Memory usage
   - Disk I/O
   - Network I/O

6. **Database**
   - Connection pool usage
   - Query duration
   - Slow queries
   - Cache hit rate

---

## 🔒 Security Monitoring

### Security Metrics to Track

1. **Authentication Failures**
   - Failed login attempts
   - Invalid API keys
   - Expired tokens

2. **Authorization Failures**
   - 403 Forbidden responses
   - Unauthorized resource access
   - Permission denied errors

3. **Suspicious Activity**
   - Unusual request patterns
   - High request rate from single IP
   - Access to non-existent endpoints
   - SQL injection attempts

4. **Dependency Vulnerabilities**
   - CVE alerts
   - Outdated packages
   - Security scan results

### Security Alerts

```yaml
# Security-specific alerts
- alert: HighAuthFailureRate
  expr: rate(auth_failures_total[5m]) > 10
  for: 5m
  labels:
    severity: high
  annotations:
    summary: "High authentication failure rate"

- alert: SuspiciousActivity
  expr: rate(http_requests_total{status="403"}[5m]) > 5
  for: 10m
  labels:
    severity: high
  annotations:
    summary: "Unusual number of 403 responses"

- alert: SecurityVulnerability
  expr: security_vulnerabilities_total{severity="critical"} > 0
  labels:
    severity: critical
  annotations:
    summary: "Critical security vulnerability detected"
```

---

## 📋 Monitoring Checklist

### Daily
- [ ] Check dashboard for anomalies
- [ ] Review critical alerts
- [ ] Verify backups completed
- [ ] Check API uptime percentage

### Weekly
- [ ] Review all alerts (including resolved)
- [ ] Analyze performance trends
- [ ] Review error logs
- [ ] Check disk space usage
- [ ] Review security scan results

### Monthly
- [ ] Generate performance report
- [ ] Review and update alert thresholds
- [ ] Capacity planning review
- [ ] Update monitoring documentation
- [ ] Review and archive old metrics

### Quarterly
- [ ] Comprehensive security audit
- [ ] Load testing
- [ ] Disaster recovery drill
- [ ] Monitoring stack updates
- [ ] Review and optimize costs

---

## 🎯 Quick Start

### For Small Teams (5-10 requests/s)
```bash
# Minimal setup: Health checks + basic logging
1. Set up UptimeRobot for /health endpoint
2. Use built-in application logging
3. Set up Sentry for error tracking
4. Manual performance checks weekly
```

### For Medium Teams (10-100 requests/s)
```bash
# Recommended setup
1. Deploy Prometheus + Grafana
2. Set up Alertmanager with Slack
3. Implement structured logging
4. Create custom dashboards
5. Set up automated alerts
```

### For Large Teams (100+ requests/s)
```bash
# Full observability stack
1. Prometheus + Grafana + Alertmanager
2. ELK stack for log aggregation
3. Distributed tracing (Jaeger/Zipkin)
4. PagerDuty for critical alerts
5. Custom analytics pipeline
6. Dedicated DevOps engineer
```

---

## 📚 Resources

### Documentation
- [Prometheus Documentation](https://prometheus.io/docs/)
- [Grafana Documentation](https://grafana.com/docs/)
- [FastAPI Monitoring](https://fastapi.tiangolo.com/advanced/monitoring/)

### Pre-built Dashboards
- [Awesome Prometheus Alerts](https://awesome-prometheus-alerts.grep.to/)
- [Grafana Dashboard Library](https://grafana.com/grafana/dashboards/)

### Tools
- [Prometheus Exporter Registry](https://prometheus.io/docs/instrumenting/exporters/)
- [Python Prometheus Client](https://github.com/prometheus/client_python)

---

## 🤝 Support

For monitoring setup assistance:
- **Email:** support@helloblue.ai
- **Discussions:** [GitHub Discussions](https://github.com/HelloblueAI/Bleu.js/discussions)
- **Documentation:** [Bleu.js Docs](https://bleujs.org/docs)

---

**Last Updated:** May 18, 2026  
**Version:** 1.0.0  
**Maintained By:** Bleu.js Team
