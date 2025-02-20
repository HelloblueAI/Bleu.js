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
/** 🚀 WebSocket Utilities */
const activeClients = new Set();

/**
 * 📡 Broadcast Message to Connected Clients
 */
export const broadcastMessage = (message, sender = null) => {
  activeClients.forEach((client) => {
    if (client !== sender && client.readyState === client.OPEN) {
      client.send(JSON.stringify(message));
    }
  });
};

/**
 * 🔗 Handle WebSocket Connections
 */
export const handleWebSocket = (wss) => {
  wss.on('connection', (ws) => {
    activeClients.add(ws);
    const requestId = `ws-${Date.now()}-${Math.random().toString(36).substring(2, 8)}`;

    console.log(
      `🔗 WebSocket Connected | Active Clients: ${activeClients.size} | RequestID: ${requestId}`,
    );

    ws.on('message', (message) => {
      try {
        const data = JSON.parse(message);
        if (typeof data !== 'object' || data === null || !data.event) {
          throw new Error(
            "Invalid message format. Expected JSON object with 'event' field.",
          );
        }

        console.log(`📨 WS Message Received [${requestId}]:`, data);

        switch (data.event) {
          case 'ping':
            ws.send(JSON.stringify({ event: 'pong', timestamp: Date.now() }));
            break;

          case 'generate_egg': {
            const egg = {
              event: 'egg_generated',
              type: data.type || 'unknown',
              rarity: data.rarity || 'common',
              power: data.power || 1000,
              timestamp: Date.now(),
            };
            ws.send(JSON.stringify(egg));
            broadcastMessage(egg, ws);
            break;
          }

          case 'broadcast':
            if (!data.message) {
              ws.send(
                JSON.stringify({
                  error: "Missing 'message' field in broadcast event.",
                }),
              );
              return;
            }
            broadcastMessage(
              {
                event: 'broadcast',
                message: data.message,
                timestamp: Date.now(),
              },
              ws,
            );
            break;

          default:
            ws.send(JSON.stringify({ error: 'Unknown event type' }));
        }
      } catch (error) {
        console.error(`❌ WS Error [${requestId}]: ${error.message}`);
        ws.send(JSON.stringify({ error: 'Invalid WebSocket message format.' }));
      }
    });

    ws.on('close', () => {
      activeClients.delete(ws);
      console.log(
        `❌ WebSocket Disconnected | Active Clients: ${activeClients.size} | RequestID: ${requestId}`,
      );
    });

    ws.on('error', (error) => {
      console.error(`🚨 WS Connection Error [${requestId}]:`, error);
    });
  });

  return wss;
};
