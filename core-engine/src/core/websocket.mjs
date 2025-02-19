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
import { logger } from "../config/logger.mjs";
import { metrics } from "./metrics.mjs";

/**
 * Initializes WebSocket server
 * @param {import('http').Server} server - HTTP server instance
 */
export default async function setupWebSocketServer(server) {
  const WebSocket = await import("ws");
  const wss = new WebSocket.Server({ server });

  logger.info("✅ WebSocket server initialized");

  wss.on("connection", (ws, req) => {
    logger.info(`🔗 WebSocket client connected: ${req.socket.remoteAddress}`);


    metrics.counter("websocket.connections");

    ws.on("message", (message) => {
      try {
        const data = JSON.parse(message);
        logger.info(`📩 Received WebSocket message: ${message}`);

        if (data.type === "broadcast") {
          broadcastMessage(wss, data);
        }
      } catch (error) {
        logger.error("⚠️ Invalid WebSocket message format", { error });
      }
    });

    ws.on("close", () => {
      logger.info("🔌 WebSocket client disconnected");
      metrics.counter("websocket.disconnections");
    });

    ws.on("error", (error) => {
      logger.error("❌ WebSocket error", { error });
    });

    ws.send(JSON.stringify({ type: "welcome", message: "Welcome to Bleu.js WebSocket!" }));
  });


  process.on("SIGINT", () => shutdownWebSocket(wss));
  process.on("SIGTERM", () => shutdownWebSocket(wss));
}

/**
 * Broadcasts a message to all connected WebSocket clients
 * @param {WebSocket.Server} wss - WebSocket server instance
 * @param {object} data - Data to broadcast
 */
function broadcastMessage(wss, data) {
  wss.clients.forEach((client) => {
    if (client.readyState === 1) {
      client.send(JSON.stringify({ type: "broadcast", message: data.message }));
    }
  });
}

/**
 * Closes WebSocket server gracefully
 * @param {WebSocket.Server} wss - WebSocket server instance
 */
function shutdownWebSocket(wss) {
  logger.warn("⚠️ WebSocket server shutting down...");
  wss.close(() => logger.info("✅ WebSocket server closed"));
}
