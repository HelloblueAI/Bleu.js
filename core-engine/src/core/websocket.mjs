//  Copyright (c) 2025, Helloblue Inc.
//  Open-Source Community Edition

//  Permission is hereby granted, free of charge, to any person obtaining a copy
//  of this software and associated documentation files (the "Software"), to use,
//  copy, modify, merge, publish, distribute, sublicense, and/or sell copies of
//  the Software, subject to the following conditions:

//  1. The above copyright notice and this permission notice shall be included in
//     all copies or substantial portions of the Software.
//  2. Contributions to this project are welcome and must adhere to the project's
//     contribution guidelines.
//  3. The name "Helloblue Inc." and its contributors may not be used to endorse
//     or promote products derived from this software without prior written consent.

//  THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
//  IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
//  FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
//  AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
//  LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
//  OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN
//  THE SOFTWARE.

import { EventEmitter } from 'events';
import { performance } from 'perf_hooks';
import { logger } from '../config/logger.mjs';
import metrics from '../core/metrics.mjs';
import { WebSocketServer } from 'ws';
import cluster from 'node:cluster';

class WebSocketManager extends EventEmitter {
  constructor() {
    super();
    this.wss = null;
    this.clients = new Map();
    this.rooms = new Map();
    this.connectionStats = {
      total: 0,
      active: 0,
      peak: 0
    };
    this.heartbeatInterval = null;
  }

  async initialize(server) {
    // Only allow the primary worker to bind to the WebSocket port
    if (cluster.isWorker) {
      logger.warn(`🚧 Skipping WebSocket server in worker process ${process.pid}`);
      return;
    }

    try {
      const port = process.env.WS_PORT || server?.address()?.port || 8080;

      if (!port) {
        throw new Error('❌ WebSocket port is missing. Ensure WS_PORT is set.');
      }

      this.wss = new WebSocketServer({ server, clientTracking: true, perMessageDeflate: true });

      this.setupServerEvents();
      this.startHeartbeat();

      logger.info(`✅ WebSocket server initialized on port ${port}`);
      return this;
    } catch (error) {
      logger.error('❌ WebSocket initialization failed:', { error });
      throw error;
    }
  }

  setupServerEvents() {
    this.wss.on('connection', this.handleConnection.bind(this));
    this.wss.on('error', this.handleServerError.bind(this));

    ['SIGINT', 'SIGTERM'].forEach(signal => {
      process.on(signal, () => this.shutdown());
    });
  }

  handleConnection(ws, req) {
    try {
      const clientId = this.generateClientId();
      const startTime = performance.now();

      this.clients.set(ws, {
        id: clientId,
        ip: this.getClientIp(req),
        connectedAt: new Date(),
        messageCount: 0,
        rooms: new Set(),
        lastActivity: Date.now()
      });

      this.connectionStats.total++;
      this.connectionStats.active++;
      this.connectionStats.peak = Math.max(this.connectionStats.peak, this.connectionStats.active);

      ws.on('message', (data) => this.handleMessage(ws, data));
      ws.on('close', () => this.handleDisconnection(ws));
      ws.on('error', (error) => this.handleClientError(ws, error));
      ws.on('pong', () => this.updateClientActivity(ws));

      metrics.trackRequest(startTime, true, {
        endpoint: 'websocket.connect',
        clientId,
        ip: this.getClientIp(req)
      });

      logger.info(`🔗 WebSocket client connected: ${clientId} from ${this.getClientIp(req)}`);

      this.sendToClient(ws, {
        type: 'welcome',
        clientId,
        message: 'Welcome to Bleu.js WebSocket!',
        features: ['broadcast', 'rooms', 'direct']
      });
    } catch (error) {
      logger.error('❌ Error handling WebSocket connection:', error);
      ws.close();
    }
  }

  handleServerError(error) {
    logger.error('❌ WebSocket server error', { error });
    metrics.counter('websocket.server_errors');
  }

  async shutdown() {
    logger.warn('⚠️ WebSocket server shutting down...');
    clearInterval(this.heartbeatInterval);

    this.wss.clients.forEach(ws => {
      this.sendToClient(ws, { type: 'shutdown', message: 'Server is shutting down' });
      ws.close();
    });

    await new Promise(resolve => this.wss.close(resolve));
    logger.info('✅ WebSocket server closed');
  }
}

/**
 * Singleton instance for WebSocket server
 */
export const wsManager = new WebSocketManager();

/**
 * Function to initialize the WebSocket server
 */
export async function setupWebSocketServer(server) {
  return await wsManager.initialize(server);
}
