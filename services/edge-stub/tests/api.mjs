/**
 * API tests: POST /api/v1/chat, /api/v1/generate, /api/v1/embed return 200
 * and response shapes expected by CLI/SDK (no timeout, no 500).
 * Run: npm run test:api
 */
const base = await import("../index.mjs");
const handler = base.default?.fetch ?? base.fetch;
if (typeof handler !== "function") {
  console.error("api test: no fetch handler found");
  process.exit(1);
}

async function request(method, path, body) {
  const url = "http://localhost/" + path.replace(/^\//, "");
  const opts = { method, headers: { "Content-Type": "application/json" } };
  if (body != null) opts.body = JSON.stringify(body);
  const res = await handler(new Request(url, opts), {}, {});
  const text = await res.text();
  let json = null;
  try {
    json = text ? JSON.parse(text) : null;
  } catch {
    // ignore
  }
  return { status: res.status, ok: res.ok, json, text };
}

let failed = 0;

// --- Chat ---
const chatRes = await request("POST", "/api/v1/chat", {
  messages: [{ role: "user", content: "Hello" }],
});
if (chatRes.status !== 200 || !chatRes.ok) {
  console.error("api test: POST /api/v1/chat expected 200, got", chatRes.status, chatRes.text?.slice(0, 200));
  failed++;
} else {
  const content = chatRes.json?.choices?.[0]?.message?.content ?? chatRes.json?.content;
  if (typeof content !== "string") {
    console.error("api test: POST /api/v1/chat expected choices[0].message.content (or content), got", chatRes.json);
    failed++;
  } else {
    console.log("api test: chat OK");
  }
}

// --- Generate ---
const genRes = await request("POST", "/api/v1/generate", { prompt: "Hi" });
if (genRes.status !== 200 || !genRes.ok) {
  console.error("api test: POST /api/v1/generate expected 200, got", genRes.status, genRes.text?.slice(0, 200));
  failed++;
} else {
  const text = genRes.json?.text ?? (typeof genRes.json === "string" ? genRes.json : null);
  if (text == null || typeof text !== "string") {
    console.error("api test: POST /api/v1/generate expected .text (or string body), got", genRes.json);
    failed++;
  } else {
    console.log("api test: generate OK");
  }
}

// --- Embed ---
const embedRes = await request("POST", "/api/v1/embed", { input: ["a", "b"] });
if (embedRes.status !== 200 || !embedRes.ok) {
  console.error("api test: POST /api/v1/embed expected 200, got", embedRes.status, embedRes.text?.slice(0, 200));
  failed++;
} else {
  const data = embedRes.json?.data;
  const arr = Array.isArray(data) ? data : null;
  if (!arr || arr.length !== 2) {
    console.error("api test: POST /api/v1/embed expected .data array of length 2, got", embedRes.json?.data);
    failed++;
  } else {
    const hasEmbedding = arr.every((x) => Array.isArray(x?.embedding) || Array.isArray(x));
    if (!hasEmbedding) {
      console.error("api test: POST /api/v1/embed expected each item to have .embedding (or be vector), got", arr[0]);
      failed++;
    } else {
      console.log("api test: embed OK");
    }
  }
}

if (failed) {
  console.error("api test:", failed, "failure(s)");
  process.exit(1);
}
console.log("api test: all OK");
process.exit(0);
