/**
 * Contract check: local OpenAPI spec defines paths the edge stub implements.
 * Run from repo root: node services/edge-stub/tests/contract.mjs
 */
import { readFileSync } from "fs";
import { fileURLToPath } from "url";
import { dirname, join } from "path";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "../../..");
const SPEC_PATH = join(ROOT, "docs/api/openapi.yaml");

const REQUIRED_PATHS = ["/api/v1/chat", "/api/v1/generate", "/api/v1/embed", "/api/v1/models"];
const RECOMMENDED_PATHS = ["/health"];

function specContainsPath(specText, path) {
  if (specText.includes(path)) return true;
  const pathKey = path.startsWith("/") ? path : "/" + path;
  return specText.includes(pathKey + ":") || specText.includes(" " + pathKey);
}

let text;
try {
  text = readFileSync(SPEC_PATH, "utf8");
} catch (e) {
  console.error("contract: could not read spec at", SPEC_PATH, e.message);
  process.exit(1);
}

const missingRequired = REQUIRED_PATHS.filter((p) => !specContainsPath(text, p));
if (missingRequired.length) {
  console.error("contract: spec is missing required paths:", missingRequired.join(", "));
  process.exit(1);
}

const missingRecommended = RECOMMENDED_PATHS.filter((p) => !specContainsPath(text, p));
if (missingRecommended.length) {
  console.warn("contract: spec should also define (recommended):", missingRecommended.join(", "));
}

console.log("contract: spec contains required paths");
process.exit(0);
