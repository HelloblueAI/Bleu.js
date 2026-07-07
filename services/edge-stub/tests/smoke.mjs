/**
 * Smoke test: entrypoint responds with 200 and expected body.
 * Run: npm run test:smoke
 */
const base = await import("../index.mjs");
const handler = base.default?.fetch ?? base.fetch;
if (typeof handler !== "function") {
  console.error("smoke: no fetch handler found");
  process.exit(1);
}

const request = new Request("http://localhost/", { method: "GET" });
const response = await handler(request, {}, {});
if (!response || !response.ok || response.status !== 200) {
  console.error("smoke: expected 200 OK, got", response?.status);
  process.exit(1);
}
const text = await response.text();
if (!text.includes("Backend Ready") && !text.includes("Ready")) {
  console.error("smoke: unexpected body:", text?.slice(0, 80));
  process.exit(1);
}
console.log("smoke: OK");
process.exit(0);
