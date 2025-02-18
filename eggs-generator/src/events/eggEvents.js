import { EventEmitter } from 'events';
import winston from 'winston';
import cluster from 'cluster';

const logger = winston.createLogger({
  level: process.env.LOG_LEVEL || 'info',
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.errors({ stack: true }),
    winston.format.json(),
  ),
  defaultMeta: {
    service: 'egg-events',
    pid: process.pid,
    nodeVersion: process.version,
  },
  transports: [
    new winston.transports.File({
      filename: 'logs/egg-events-error.log',
      level: 'error',
    }),
    new winston.transports.File({
      filename: 'logs/egg-events.log',
    }),
  ],
});

export const EggEventTypes = {
  // Core lifecycle events
  CREATED: 'egg:created',
  UPDATED: 'egg:updated',
  DELETED: 'egg:deleted',

  // Evolution events
  EVOLUTION_STARTED: 'egg:evolution:started',
  EVOLUTION_COMPLETED: 'egg:evolution:completed',
  EVOLUTION_FAILED: 'egg:evolution:failed',
  EVOLUTION_REQUIREMENT_MET: 'egg:evolution:requirement:met',

  // Incubation events
  INCUBATION_STARTED: 'egg:incubation:started',
  INCUBATION_PROGRESS: 'egg:incubation:progress',
  INCUBATION_COMPLETED: 'egg:incubation:completed',
  INCUBATION_FAILED: 'egg:incubation:failed',
  TEMPERATURE_CHANGE: 'egg:temperature:changed',

  // Interaction events
  INTERACTION: 'egg:interaction',
  INTERACTION_SUCCESSFUL: 'egg:interaction:success',
  INTERACTION_FAILED: 'egg:interaction:failed',
  INTERACTION_COOLDOWN: 'egg:interaction:cooldown',

  // Status events
  STATUS_CHANGED: 'egg:status:changed',
  HEALTH_CHECK: 'egg:health:check',
  CONDITION_ADDED: 'egg:condition:added',
  CONDITION_REMOVED: 'egg:condition:removed',

  // Market events
  MARKET_LISTED: 'egg:market:listed',
  MARKET_UNLISTED: 'egg:market:unlisted',
  BID_PLACED: 'egg:market:bid:placed',
  BID_ACCEPTED: 'egg:market:bid:accepted',
  BID_REJECTED: 'egg:market:bid:rejected',
  OWNERSHIP_TRANSFERRED: 'egg:ownership:transferred',

  // System events
  SYNC_REQUIRED: 'egg:sync:required',
  CACHE_INVALIDATED: 'egg:cache:invalidated',
  METRICS_UPDATED: 'egg:metrics:updated',
};

class ClusterAwareEventEmitter extends EventEmitter {
  constructor() {
    super();
    this.isMaster = cluster.isPrimary;
    this.workers = new Map();
    this.setupClusterEventForwarding();
  }

  setupClusterEventForwarding() {
    if (this.isMaster) {
      cluster.on('message', (worker, message) => {
        if (message.type === 'EGG_EVENT') {
          this.emit(message.event, ...message.args);
          this.broadcastToWorkers(message, worker.id);
        }
      });
    }
  }

  broadcastToWorkers(message, excludeWorkerId) {
    if (this.isMaster) {
      for (const [id, worker] of Object.entries(cluster.workers)) {
        if (id !== excludeWorkerId) {
          worker.send(message);
        }
      }
    }
  }

  emit(event, ...args) {
    const timestamp = Date.now();
    const eventId = `${event}-${timestamp}-${Math.random().toString(36).substr(2, 9)}`;

    logger.info('Event emitted', {
      eventId,
      event,
      timestamp,
      args: args.map((arg) => (typeof arg === 'object' ? { ...arg } : arg)),
    });

    if (!this.isMaster) {
      process.send({
        type: 'EGG_EVENT',
        event,
        args,
        timestamp,
        eventId,
      });
    }

    return super.emit(event, ...args);
  }

  on(event, listener) {
    const wrappedListener = (...args) => {
      try {
        listener(...args);
      } catch (error) {
        logger.error('Event listener error', {
          event,
          error: error.message,
          stack: error.stack,
        });
        this.emit('error', error);
      }
    };

    return super.on(event, wrappedListener);
  }
}

export const EggEventsEmitter = new ClusterAwareEventEmitter();

EggEventsEmitter.on('error', (error) => {
  logger.error('EggEvents Error', {
    error: error.message,
    stack: error.stack,
  });
});

EggEventsEmitter.on('*', (event, ...args) => {
  logger.debug('Event intercepted', {
    event,
    args: args.map((arg) => (typeof arg === 'object' ? { ...arg } : arg)),
  });
});

const eventLatencies = new Map();

EggEventsEmitter.on('newListener', (event) => {
  const start = process.hrtime();
  eventLatencies.set(event, start);
});

EggEventsEmitter.on('removeListener', (event) => {
  const start = eventLatencies.get(event);
  if (start) {
    const [seconds, nanoseconds] = process.hrtime(start);
    const duration = seconds * 1000 + nanoseconds / 1e6;
    logger.info('Event listener duration', {
      event,
      duration: `${duration.toFixed(2)}ms`,
    });
    eventLatencies.delete(event);
  }
});

export const getEventMetrics = () => {
  return {
    eventCount: EggEventsEmitter.eventNames().length,
    listenerCount: EggEventsEmitter.eventNames().reduce(
      (acc, event) => acc + EggEventsEmitter.listenerCount(event),
      0,
    ),
    activeEvents: EggEventsEmitter.eventNames(),
    latencies: Object.fromEntries(eventLatencies),
  };
};
