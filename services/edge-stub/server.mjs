/**
 * Local HTTP server that invokes the worker fetch handler.
 * Use for local testing: npm run dev / npm start so POST /api/v1/chat,
 * /api/v1/generate, /api/v1/embed are served without timeout.
 */
import { createServer } from "http";
import handler from "./index.mjs";

const PORT = Number(process.env.PORT) || 4003;
const HOST = process.env.HOST || "127.0.0.1";
const MAX_REQUEST_BODY_BYTES = Number(process.env.MAX_REQUEST_BODY_BYTES) || 1024 * 1024;
const REQUEST_TIMEOUT_MS = Number(process.env.REQUEST_TIMEOUT_MS) || 15_000;
const fetchHandler = handler?.default?.fetch ?? handler?.fetch;

if (typeof fetchHandler !== "function") {
  console.error("server: no fetch handler on index.mjs default.fetch");
  process.exit(1);
}

class RequestBodyTooLargeError extends Error {}
class RequestTimeoutError extends Error {}

async function readBody(req) {
  return new Promise((resolve, reject) => {
    const chunks = [];
    let received = 0;
    let settled = false;

    const fail = (err) => {
      if (settled) return;
      settled = true;
      req.removeAllListeners("data");
      req.removeAllListeners("end");
      req.resume();
      reject(err);
    };

    req.setTimeout(REQUEST_TIMEOUT_MS, () => {
      fail(new RequestTimeoutError("Request timed out"));
    });

    req.on("data", (chunk) => {
      received += chunk.length;
      if (received > MAX_REQUEST_BODY_BYTES) {
        fail(new RequestBodyTooLargeError("Request body too large"));
        return;
      }
      chunks.push(chunk);
    });
    req.on("end", () => {
      if (!settled) {
        settled = true;
        resolve(Buffer.concat(chunks));
      }
    });
    req.on("error", fail);
  });
}

const server = createServer(async (req, res) => {
  try {
    const url = new URL(req.url || "/", `http://${HOST}:${PORT}`);
    const headers = new Headers();
    for (const [k, v] of Object.entries(req.headers)) {
      if (v) headers.set(k.toLowerCase(), Array.isArray(v) ? v.join(", ") : v);
    }
    const body = await readBody(req);
    const request = new Request(url, {
      method: req.method,
      headers,
      body: body.length ? body : undefined,
    });

    const response = await fetchHandler(request, {}, {});
    res.writeHead(response.status, Object.fromEntries(response.headers));
    const buf = await response.arrayBuffer();
    res.end(Buffer.from(buf));
  } catch (err) {
    if (err instanceof RequestBodyTooLargeError) {
      res.writeHead(413, { "Content-Type": "application/json" });
      res.end(
        JSON.stringify({
          success: false,
          error: "Request body too large",
          code: "REQUEST_TOO_LARGE",
        })
      );
      return;
    }

    if (err instanceof RequestTimeoutError) {
      res.writeHead(408, { "Content-Type": "application/json" });
      res.end(
        JSON.stringify({
          success: false,
          error: "Request timed out",
          code: "REQUEST_TIMEOUT",
        })
      );
      return;
    }

    console.error("server:", err);
    res.writeHead(500, { "Content-Type": "application/json" });
    // Avoid exposing internal exception details to clients.
    res.end(
      JSON.stringify({
        success: false,
        error: "Internal server error",
        code: "INTERNAL_ERROR",
      }),
    );
  }
});

server.listen(PORT, HOST, () => {
  console.log(`Bleu.js backend listening on http://${HOST}:${PORT}`);
  console.log("  GET  /health");
  console.log("  GET  /api/v1/models");
  console.log("  POST /api/v1/chat");
  console.log("  POST /api/v1/generate");
  console.log("  POST /api/v1/embed");
});
