import env from "../../config/env.js";
import { AppError } from "../../utils/apiResponse.js";
import { adapters } from "./providers/index.js";
import { setTimeout as delay } from "node:timers/promises";
export async function callProvider(config, key, system, user, schema, signal = AbortSignal.timeout(env.aiTimeoutMs)) {
  const adapter = adapters[config.provider], request = adapter.build(config,key,system,user,schema);
  for (let attempt=0; attempt<3; attempt++) {
    try {
      const response = await fetch(request.url,{method:"POST",headers:{"Content-Type":"application/json",...request.headers},body:JSON.stringify(request.body),signal,redirect:"error"});
      if (!response.ok) {
        await response.body?.cancel();
        if ([429,502,503,504].includes(response.status) && attempt<2) { await delay(500*2**attempt,undefined,{signal}); continue; }
        throw new AppError([401,403].includes(response.status)?"AI provider rejected the credentials. Check the API key and model access.":response.status===429?"AI provider rate limit reached. Try again later.":"AI provider rejected the request. Check model settings and output mode.",502);
      }
      const result = adapter.read(await response.json());
      if (typeof result.text!=="string" || !result.text.trim() || result.text.length>200000) throw new AppError("AI provider returned an empty or oversized response",502);
      const raw=result.usage||{};
      const inputTokens=Number(raw.prompt_tokens??raw.input_tokens??raw.promptTokenCount)||0;
      const outputTokens=Number(raw.completion_tokens??raw.output_tokens??raw.candidatesTokenCount)||0;
      return {text:result.text,usage:{inputTokens,outputTokens,totalTokens:Number(raw.total_tokens??raw.totalTokenCount)||inputTokens+outputTokens}};
    } catch (error) {
      if (error instanceof AppError) throw error;
      throw new AppError(signal.aborted?"AI request timed out. Try again.":"AI provider is unreachable or returned an invalid response.",503);
    }
  }
}
