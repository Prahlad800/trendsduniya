import env from "../config/env.js";
import { AppError } from "../utils/apiResponse.js";
import { setTimeout as delay } from "node:timers/promises";

const endpoint = "https://api.groq.com/openai/v1/chat/completions";
const aiError = (errorCode, message, status = 502) => Object.assign(new AppError(message, status), {
  errorCode, provider: "Groq", model: env.groq.model,
});

// Only explicit safe metadata can leave the server.
export function groqStatus() {
  return { provider: "Groq", model: env.groq.model,
    configured: !!(env.groq.apiKey && env.groq.model) };
}

export function requireGroq() {
  if (!env.groq.apiKey) throw aiError("CONFIGURATION_ERROR", "GROQ_API_KEY is not configured", 503);
  if (!env.groq.model) throw aiError("CONFIGURATION_ERROR", "GROQ_MODEL is not configured", 503);
}

function upstreamError(status, detail, retryAfter) {
  let error;
  if (status === 401 || detail?.code === "invalid_api_key") error = aiError("INVALID_API_KEY", "Groq rejected the server API key. Check GROQ_API_KEY.");
  else if (status === 403) error = aiError("ACCESS_DENIED", "Groq denied this request. Check API key permissions and model access.");
  else if (status === 429) error = aiError("RATE_LIMITED", "Groq quota or rate limit reached. Check billing and limits, or try again later.", 429);
  else if (status === 413) error = aiError("REQUEST_TOO_LARGE", "This request exceeds your Groq account's token budget. Use a shorter article or reduce GROQ_MAX_COMPLETION_TOKENS.", 413);
  else if (status === 404 || detail?.code === "model_not_found") error = aiError("MODEL_NOT_FOUND", "Groq model is unavailable. Check GROQ_MODEL.");
  else if ([408, 504].includes(status)) error = aiError("PROVIDER_TIMEOUT", "Groq request timed out. Try again shortly.", 504);
  else if (status >= 500) error = aiError("PROVIDER_UNAVAILABLE", "Groq is busy or temporarily unavailable. Automatic retries did not succeed; try again shortly.", 503);
  else error = aiError("INVALID_REQUEST", "Groq rejected the request. Check the model, JSON support and token limits.");
  error.retryable = status === 429 || status >= 500 || status === 408;
  const wait = Number(retryAfter) * 1000 || Math.max(0, Date.parse(retryAfter) - Date.now()) || 0;
  error.retryAfter = Math.min(wait, 86400000);
  return error;
}

async function readResponse(response) {
  const reader = response.body?.getReader();
  if (!reader) throw aiError("INVALID_RESPONSE", "Groq returned an empty response.");
  const chunks = [];
  let size = 0;
  try {
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      size += value.length;
      if (size > 3000000) throw aiError("INVALID_RESPONSE", "Groq returned an oversized response.");
      chunks.push(Buffer.from(value));
    }
  } finally { await reader.cancel().catch(() => {}); }
  try { return JSON.parse(Buffer.concat(chunks).toString("utf8")); }
  catch {
    if (!response.ok) return {};
    throw aiError("INVALID_RESPONSE", "Groq returned invalid JSON.");
  }
}

// All text generation uses the server's GROQ_MODEL, including automation.
export async function generateText({ system, input, json = false, signal, probe = false, maxCompletionTokens = env.groq.maxCompletionTokens || 4096, reasoningEffort }) {
  requireGroq();
  const deadline = AbortSignal.timeout(env.aiTimeoutMs);
  const requestSignal = signal ? AbortSignal.any([signal, deadline]) : deadline;
  try {
    requestSignal.throwIfAborted();
    const options = {
      method: "POST", redirect: "error", signal: requestSignal,
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${env.groq.apiKey}` },
      body: JSON.stringify({
        model: env.groq.model,
        messages: [{ role: "system", content: system }, { role: "user", content: input }],
        max_completion_tokens: probe ? 1024 : Math.min(32768, Math.max(256, maxCompletionTokens)),
        ...(reasoningEffort && ["openai/gpt-oss-120b", "openai/gpt-oss-20b"].includes(env.groq.model) ? { reasoning_effort: reasoningEffort } : {}),
        ...(json ? { response_format: { type: "json_object" } } : {}),
      }),
    };
    let response, payload;
    // Keep bounded transient retries within one deadline. Quotas retry only
    // through the durable automation queue, never inside a user request.
    for (let attempt = 0; attempt < 3; attempt++) {
      requestSignal.throwIfAborted();
      response = await fetch(endpoint, options);
      payload = await readResponse(response);
      const status = response.ok && payload?.error ? Number(payload.error.status || payload.error.code) : response.status;
      if (![500, 502, 503].includes(status) || attempt === 2) break;
      await delay(1000 * 2 ** attempt, undefined, { signal: requestSignal });
    }
    if (!response.ok || payload?.error) {
      const status = response.ok ? Number(payload.error?.status || payload.error?.code) || 400 : response.status;
      throw upstreamError(status, payload?.error, response.headers.get("retry-after"));
    }
    const choice = payload?.choices?.[0];
    if (choice?.finish_reason === "length")
      throw aiError("OUTPUT_TRUNCATED", "Groq output reached the token limit. Request a shorter article.");
    if (choice?.finish_reason !== "stop" || choice.message?.refusal || choice.message?.tool_calls?.length)
      throw aiError("INVALID_RESPONSE", "Groq could not complete a valid text response.");
    const text = choice.message?.content;
    if (typeof text !== "string" || !text.trim() || text.length > 600000)
      throw aiError("INVALID_RESPONSE", "Groq returned empty or oversized text.");
    const tokenCount = value => Number.isFinite(value) && value >= 0 ? value : 0;
    const inputTokens = tokenCount(payload.usage?.prompt_tokens), outputTokens = tokenCount(payload.usage?.completion_tokens);
    return { text, usage: { inputTokens, outputTokens, totalTokens: tokenCount(payload.usage?.total_tokens) || inputTokens + outputTokens } };
  } catch (error) {
    const safe = error instanceof AppError ? error : requestSignal.aborted
      ? aiError("PROVIDER_TIMEOUT", "Groq request timed out. Try again shortly.", 504)
      : aiError("PROVIDER_UNREACHABLE", "Unable to reach Groq. Try again shortly.", 503);
    if (!(error instanceof AppError)) safe.retryable = true;
    console.warn(JSON.stringify({ event: "groq.request.failed", errorCode: safe.errorCode, status: safe.statusCode }));
    throw safe;
  }
}

export async function testGroq() {
  const started = Date.now();
  await generateText({ system: "Follow the user instruction.", input: "Reply only with OK", probe: true,
    signal: AbortSignal.timeout(Math.min(env.aiTimeoutMs, 15000)) });
  return { ...groqStatus(), connected: true, latencyMs: Date.now() - started };
}
