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

    console.log(`🔗 WebSocket Connected | Active Clients: ${activeClients.size} | RequestID: ${requestId}`);

    ws.on('message', (message) => {
      try {
        const data = JSON.parse(message);
        if (typeof data !== 'object' || data === null || !data.event) {
          throw new Error("Invalid message format. Expected JSON object with 'event' field.");
        }

        console.log(`📨 WS Message Received [${requestId}]:`, data);

        switch (data.event) {
          case 'ping':
            ws.send(JSON.stringify({ event: 'pong', timestamp: Date.now() }));
            break;

          case 'generate_egg': {
            const egg = {
              event: "egg_generated",
              type: data.type || "unknown",
              rarity: data.rarity || "common",
              power: data.power || 1000,
              timestamp: Date.now(),
            };
            ws.send(JSON.stringify(egg));
            broadcastMessage(egg, ws);
            break;
          }

          case 'broadcast':
            if (!data.message) {
              ws.send(JSON.stringify({ error: "Missing 'message' field in broadcast event." }));
              return;
            }
            broadcastMessage({ event: "broadcast", message: data.message, timestamp: Date.now() }, ws);
            break;

          default:
            ws.send(JSON.stringify({ error: 'Unknown event type' }));
        }
      } catch (error) {
        console.error(`❌ WS Error [${requestId}]: ${error.message}`);
        ws.send(JSON.stringify({ error: "Invalid WebSocket message format." }));
      }
    });

    ws.on('close', () => {
      activeClients.delete(ws);
      console.log(`❌ WebSocket Disconnected | Active Clients: ${activeClients.size} | RequestID: ${requestId}`);
    });

    ws.on('error', (error) => {
      console.error(`🚨 WS Connection Error [${requestId}]:`, error);
    });
  });

  return wss;
};
