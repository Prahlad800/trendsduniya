import env from "../config/env.js";
import { AppError } from "../utils/apiResponse.js";
import { setTimeout as delay } from "node:timers/promises";

const endpoint = "https://generativelanguage.googleapis.com/v1beta/models";
const aiError = (errorCode, message, status = 502) => Object.assign(new AppError(message, status), {
  errorCode, provider: "Gemini", model: env.gemini.model,
});

// Only explicit safe metadata can leave the server.
export function geminiStatus() {
  return { provider: "Gemini", model: env.gemini.model,
    configured: !!(env.gemini.apiKey && env.gemini.model) };
}

export function requireGemini() {
  if (!env.gemini.apiKey) throw aiError("CONFIGURATION_ERROR", "GEMINI_API_KEY is not configured", 503);
  if (!env.gemini.model) throw aiError("CONFIGURATION_ERROR", "GEMINI_MODEL is not configured", 503);
}

function upstreamError(status, detail = {}) {
  const reasons = Array.isArray(detail?.details) ? detail.details.map(item => item.reason) : [];
  if (status === 401 || reasons.includes("API_KEY_INVALID")) return aiError("INVALID_API_KEY", "Gemini rejected the server API key. Check GEMINI_API_KEY.");
  if (status === 403) return aiError("ACCESS_DENIED", "Gemini denied this request. Check API key restrictions and model access.");
  if (status === 429) return aiError("RATE_LIMITED", "Gemini quota or rate limit reached. Check billing and limits, or try again later.", 429);
  if (status === 404) return aiError("MODEL_NOT_FOUND", "Gemini model is unavailable. Check GEMINI_MODEL.");
  if ([408, 504].includes(status)) return aiError("PROVIDER_TIMEOUT", "Gemini request timed out. Try again shortly.", 504);
  if (status >= 500) return aiError("PROVIDER_UNAVAILABLE", "Gemini is busy or temporarily unavailable. Automatic retries did not succeed; try again shortly.", 503);
  return aiError("INVALID_REQUEST", "Gemini rejected the request. Check the model, JSON support and token limits.");
}

async function readResponse(response) {
  const reader = response.body?.getReader();
  if (!reader) throw aiError("INVALID_RESPONSE", "Gemini returned an empty response.");
  const chunks = [];
  let size = 0;
  try {
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      size += value.length;
      if (size > 3000000) throw aiError("INVALID_RESPONSE", "Gemini returned an oversized response.");
      chunks.push(Buffer.from(value));
    }
  } finally { await reader.cancel().catch(() => {}); }
  try { return JSON.parse(Buffer.concat(chunks).toString("utf8")); }
  catch {
    if (!response.ok) return {};
    throw aiError("INVALID_RESPONSE", "Gemini returned invalid JSON.");
  }
}

// Every AI feature uses this transport. No SDK, fallback model or browser key.
export async function generateText({ system, input, json = false, signal, probe = false }) {
  requireGemini();
  const deadline = AbortSignal.timeout(env.aiTimeoutMs);
  const requestSignal = signal ? AbortSignal.any([signal, deadline]) : deadline;
  try {
    requestSignal.throwIfAborted();
    const model = env.gemini.model.replace(/^models\//, "");
    const url = `${endpoint}/${encodeURIComponent(model)}:generateContent`;
    const options = {
      method: "POST", redirect: "error", signal: requestSignal,
      headers: { "Content-Type": "application/json", "x-goog-api-key": env.gemini.apiKey },
      body: JSON.stringify({
        systemInstruction: { parts: [{ text: system }] },
        contents: [{ role: "user", parts: [{ text: input }] }],
        generationConfig: { maxOutputTokens: probe ? 1024 : 24000,
          ...(json ? { responseMimeType: "application/json" } : {}) },
      }),
    };
    let response, payload;
    // Retry only explicit transient server failures, using the same model and
    // shared deadline. Never retry credentials, quota, or ambiguous network errors.
    for (let attempt = 0; attempt < 3; attempt++) {
      requestSignal.throwIfAborted();
      response = await fetch(url, options);
      payload = await readResponse(response);
      const status = response.ok && payload?.error ? Number(payload.error.code) : response.status;
      if (![500, 502, 503].includes(status) || attempt === 2) break;
      await delay(1000 * 2 ** attempt, undefined, { signal: requestSignal });
    }
    // Gemini may include an error in an HTTP 200 response.
    if (!response.ok || payload?.error) {
      const status = response.ok ? Number(payload.error?.code) || 502 : response.status;
      throw upstreamError(status, payload?.error);
    }
    const candidate = payload?.candidates?.[0];
    if (candidate?.finishReason === "MAX_TOKENS")
      throw aiError("OUTPUT_TRUNCATED", "Gemini output reached the token limit. Request a shorter article.");
    if (payload?.promptFeedback?.blockReason || candidate?.finishReason !== "STOP")
      throw aiError("INVALID_RESPONSE", "Gemini could not complete a valid text response.");
    const text = candidate.content?.parts?.filter(part => !part.thought && typeof part.text === "string").map(part => part.text).join("");
    if (typeof text !== "string" || !text.trim() || text.length > 600000)
      throw aiError("INVALID_RESPONSE", "Gemini returned empty or oversized text.");
    const tokenCount = value => Number.isFinite(value) && value >= 0 ? value : 0;
    const inputTokens = tokenCount(payload.usageMetadata?.promptTokenCount), outputTokens = tokenCount(payload.usageMetadata?.candidatesTokenCount);
    return { text, usage: { inputTokens, outputTokens, totalTokens: tokenCount(payload.usageMetadata?.totalTokenCount) || inputTokens + outputTokens } };
  } catch (error) {
    const safe = error instanceof AppError ? error : requestSignal.aborted
      ? aiError("PROVIDER_TIMEOUT", "Gemini request timed out. Try again shortly.", 504)
      : aiError("PROVIDER_UNREACHABLE", "Unable to reach Gemini. Try again shortly.", 503);
    console.warn(JSON.stringify({ event: "gemini.request.failed", errorCode: safe.errorCode, status: safe.statusCode }));
    throw safe;
  }
}

export async function testGemini() {
  const started = Date.now();
  await generateText({ system: "Follow the user instruction.", input: "Reply only with OK", probe: true,
    signal: AbortSignal.timeout(Math.min(env.aiTimeoutMs, 15000)) });
  return { ...geminiStatus(), connected: true, latencyMs: Date.now() - started };
}
