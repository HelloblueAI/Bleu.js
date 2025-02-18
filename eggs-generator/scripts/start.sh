#!/bin/bash
set -e

export NODE_ENV=production
export DEBUG=eggs:*

# Start MongoDB
mongod --config ./config/db/mongodb.conf &

# Start Redis for caching
redis-server ./config/cache/redis.conf &

# Start message queue
rabbitmq-server &

# Start monitoring
node ./src/metrics/prometheus.js &
node ./src/metrics/grafana.js &

# Start API servers
pm2 start ecosystem.config.js

# Start worker processes
pm2 start ./src/workers/egg-generator.js
pm2 start ./src/workers/evolution-checker.js
pm2 start ./src/workers/market-maker.js

echo "System started successfully"
