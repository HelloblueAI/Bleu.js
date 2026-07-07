/**
 * Bleu.js edge API stub (Cloudflare Worker / fetch handler).
 *
 * Production chat / generate / embed: bleujs.org (Next.js on Vercel).
 * Production ML /predict: bleujs.org ml_engine on Railway.
 *
 * This handler provides stub responses for local dev, CI, and optional edge deployment.
 * Contract: docs/api/openapi.yaml
 */

const BASE_CORS_HEADERS = {
  "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, X-API-Key",
};

const DEV_CORS_HEADERS = {
  ...BASE_CORS_HEADERS,
  "Access-Control-Allow-Origin": "*",
};

function getProcessEnvValue(name) {
  return typeof process !== "undefined" ? process.env?.[name] : undefined;
}

function getEnvValue(env = {}, names = []) {
  for (const name of names) {
    const value = env?.[name] ?? getProcessEnvValue(name);
    if (value != null && String(value).trim() !== "") {
      return value;
    }
  }
  return undefined;
}

function getNumericEnvValue(name, fallback, env = {}) {
  const raw = getEnvValue(env, [name]);
  const value = Number(raw);
  return Number.isFinite(value) && value > 0 ? value : fallback;
}

function getLimits(env = {}) {
  const maxJsonBodyBytes =
    getNumericEnvValue("MAX_JSON_BODY_BYTES", 0, env) ||
    getNumericEnvValue("MAX_REQUEST_BODY_BYTES", 0, env) ||
    1024 * 1024;
  return {
    maxJsonBodyBytes,
    maxEmbedInputs: getNumericEnvValue("MAX_EMBED_INPUTS", 128, env),
    maxEmbedTextChars: getNumericEnvValue("MAX_EMBED_TEXT_CHARS", 8192, env),
  };
}

function isProductionEnv(env = {}) {
  const raw = getEnvValue(env, ["NODE_ENV", "ENV"]);
  return ["production", "prod"].includes(String(raw || "").toLowerCase());
}

function stripTrailingSlashes(value) {
  let result = value;
  while (result.endsWith("/")) {
    result = result.slice(0, -1);
  }
  return result;
}

function normalizeOrigin(value) {
  const trimmed = String(value || "").trim();
  if (!trimmed || trimmed === "*") {
    return trimmed;
  }

  try {
    return new URL(trimmed).origin;
  } catch {
    return stripTrailingSlashes(trimmed);
  }
}

function getAllowedCorsOrigins(env = {}) {
  const raw = getEnvValue(env, [
    "CORS_ORIGINS",
    "ALLOWED_ORIGINS",
    "PUBLIC_URL",
    "FRONTEND_URL",
  ]);
  return String(raw || "")
    .split(",")
    .map(normalizeOrigin)
    .filter(Boolean);
}

function getCorsHeaders(request, env = {}) {
  const production = isProductionEnv(env);
  const allowedOrigins = getAllowedCorsOrigins(env);
  const origin = normalizeOrigin(request?.headers?.get?.("Origin"));

  if (
    !production &&
    (allowedOrigins.length === 0 || allowedOrigins.includes("*"))
  ) {
    return DEV_CORS_HEADERS;
  }

  if (origin && allowedOrigins.includes(origin)) {
    return {
      ...BASE_CORS_HEADERS,
      "Access-Control-Allow-Origin": origin,
      Vary: "Origin",
    };
  }

  return BASE_CORS_HEADERS;
}

const DEFAULT_MODELS = [
  { id: "bleu-1", object: "model" },
  { id: "bleu-2", object: "model" },
  { id: "bleu-embed", object: "model" },
  { id: "bleu-chat-1", object: "model" },
  { id: "bleu-chat-2", object: "model" },
  { id: "bleu-generate-1", object: "model" },
  { id: "bleu-generate-2", object: "model" },
  { id: "bleu-quantum-1", object: "model" },
  { id: "bleu-quantum-2", object: "model" },
  { id: "bleu-default", object: "model" },
];

function jsonResponse(
  body,
  status = 200,
  headers = {},
  corsHeaders = DEV_CORS_HEADERS,
) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "Content-Type": "application/json", ...corsHeaders, ...headers },
  });
}

function textResponse(text, status = 200, corsHeaders = DEV_CORS_HEADERS) {
  return new Response(text, {
    status,
    headers: { "Content-Type": "text/plain", ...corsHeaders },
  });
}

class ApiError extends Error {
  constructor(status, code, message) {
    super(message);
    this.status = status;
    this.code = code;
  }
}

function errorResponse(
  error,
  fallbackStatus = 500,
  corsHeaders = DEV_CORS_HEADERS,
) {
  const status = Number(error?.status) || fallbackStatus;
  const code =
    error?.code || (status === 500 ? "INTERNAL_ERROR" : "BAD_REQUEST");
  const message =
    status === 500 ? "Internal server error" : error?.message || "Bad request";

  return jsonResponse(
    {
      success: false,
      error: message,
      code,
    },
    status,
    {},
    corsHeaders,
  );
}

function getConfiguredApiKeys(env = {}) {
  const raw = getEnvValue(env, [
    "BLEU_API_KEYS",
    "BLEU_API_KEY",
    "API_KEYS",
    "API_KEY",
  ]);

  return String(raw || "")
    .split(",")
    .map((key) => key.trim())
    .filter(Boolean);
}

function authorizeRequest(request, env) {
  const configuredKeys = getConfiguredApiKeys(env);
  if (configuredKeys.length === 0) {
    if (isProductionEnv(env)) {
      throw new ApiError(
        503,
        "AUTH_NOT_CONFIGURED",
        "API authentication is not configured",
      );
    }
    return;
  }

  const auth = request.headers.get("Authorization") || "";
  const bearer = auth.toLowerCase().startsWith("bearer ")
    ? auth.slice(7).trim()
    : "";
  const apiKey = request.headers.get("X-API-Key") || bearer;
  if (!apiKey || !configuredKeys.includes(apiKey)) {
    throw new ApiError(401, "UNAUTHORIZED", "Unauthorized");
  }
}

async function parseJson(request, limits) {
  const contentLength = Number(request.headers.get("content-length"));
  if (
    Number.isFinite(contentLength) &&
    contentLength > limits.maxJsonBodyBytes
  ) {
    throw new ApiError(413, "REQUEST_TOO_LARGE", "Request body too large");
  }

  const text = await request.text();
  if (!text.trim()) {
    return {};
  }

  if (new TextEncoder().encode(text).length > limits.maxJsonBodyBytes) {
    throw new ApiError(413, "REQUEST_TOO_LARGE", "Request body too large");
  }

  try {
    const body = JSON.parse(text);
    if (body != null && typeof body === "object" && !Array.isArray(body)) {
      return body;
    }
    throw new ApiError(
      400,
      "INVALID_JSON",
      "JSON request body must be an object",
    );
  } catch (error) {
    if (error instanceof ApiError) {
      throw error;
    }
    throw new ApiError(400, "INVALID_JSON", "Invalid JSON request body");
  }
}

export default {
  async fetch(request, env = {}, _ctx) {
    const url = new URL(request.url);
    const path = url.pathname;
    const method = request.method;
    const corsHeaders = getCorsHeaders(request, env);
    const limits = getLimits(env);

    if (method === "OPTIONS") {
      return new Response(null, { status: 204, headers: corsHeaders });
    }

    try {
      if (path.startsWith("/api/")) {
        authorizeRequest(request, env);
      }

      // Root: keep existing body for smoke test
      if (method === "GET" && (path === "/" || path === "")) {
        return textResponse(
          "Bleu.js Quantum-Enhanced AI Platform - Backend Ready",
          200,
          corsHeaders,
        );
      }

      if (method === "GET" && path === "/health") {
        return jsonResponse(
          { status: "healthy", version: "1.0" },
          200,
          {},
          corsHeaders,
        );
      }

      if (method === "GET" && path === "/api/v1/models") {
        return jsonResponse({ data: DEFAULT_MODELS }, 200, {}, corsHeaders);
      }

      if (method === "POST" && path === "/api/v1/chat") {
        const body = await parseJson(request, limits);
        const rawMessages = body?.messages;
        const messages = Array.isArray(rawMessages) ? rawMessages : [];
        const lastUser = messages
          .filter((m) => m != null && m?.role === "user")
          .pop();
        const userText =
          lastUser != null && typeof lastUser.content === "string"
            ? lastUser.content
            : "Hello!";
        const content =
          typeof userText === "string" && userText.length > 0
            ? `You said: "${userText.slice(0, 200)}". Hello! How can I help?`
            : "Hello! How can I help?";
        return jsonResponse(
          {
            choices: [{ message: { role: "assistant", content } }],
          },
          200,
          {},
          corsHeaders,
        );
      }

      if (method === "POST" && path === "/api/v1/generate") {
        const body = await parseJson(request, limits);
        const prompt = typeof body?.prompt === "string" ? body.prompt : "";
        const text =
          prompt.length > 0
            ? `Generated response to: "${prompt.slice(0, 100)}".`
            : "Generated response.";
        return jsonResponse(
          {
            text,
            id: "gen-" + String(Date.now()),
            model: typeof body?.model === "string" ? body.model : "bleu-1",
            usage: { prompt_tokens: 0, completion_tokens: 0, total_tokens: 0 },
            finish_reason: "stop",
          },
          200,
          {},
          corsHeaders,
        );
      }

      if (method === "POST" && path === "/api/v1/embed") {
        const body = await parseJson(request, limits);
        const input = body?.input ?? body?.inputs ?? body?.texts;
        const raw = Array.isArray(input) ? input : [input ?? ""];
        if (raw.length > limits.maxEmbedInputs) {
          throw new ApiError(
            400,
            "TOO_MANY_INPUTS",
            `Embedding input is limited to ${limits.maxEmbedInputs} item(s)`,
          );
        }
        const texts = raw.map((t) =>
          typeof t === "string" ? t : String(t ?? ""),
        );
        if (texts.some((text) => text.length > limits.maxEmbedTextChars)) {
          throw new ApiError(
            400,
            "INPUT_TOO_LONG",
            `Embedding text is limited to ${limits.maxEmbedTextChars} character(s)`,
          );
        }
        const dim = 384;
        const data = texts.map((_, i) => ({
          embedding: Array.from(
            { length: dim },
            (_, j) => (i * 0.001 + j * 0.001) % 0.1,
          ),
          index: i,
        }));
        return jsonResponse(
          {
            data,
            model: typeof body?.model === "string" ? body.model : "bleu-embed",
            usage: { prompt_tokens: 0, total_tokens: 0 },
          },
          200,
          {},
          corsHeaders,
        );
      }

      return jsonResponse(
        { success: false, error: "Not Found", code: "NOT_FOUND" },
        404,
        {},
        corsHeaders,
      );
    } catch (err) {
      if (err?.status == null) {
        console.error("api:", err);
      }
      return errorResponse(err, 500, corsHeaders);
    }
  },
};
