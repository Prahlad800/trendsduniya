import env from "../../config/env.js";
import { AppError } from "../../utils/apiResponse.js";
import { adapters } from "./providers/index.js";
import { setTimeout as delay } from "node:timers/promises";

function providerError(config, code, message, status=502) {
  const error=new AppError(message,status);
  Object.assign(error,{errorCode:code,provider:config.provider,model:config.model});
  return error;
}
// Never return upstream text: it can echo credentials, prompts or headers.
export function diagnoseProvider(config,status,payload) {
  const detail=String(payload?.error?.message||payload?.message||"").toLowerCase();
  const code=String(payload?.error?.code||payload?.error?.status||"").toLowerCase();
  if(status===401||/api.?key.*(invalid|not valid)|invalid.*api.?key|authentication_error/.test(detail+code)) return providerError(config,"INVALID_API_KEY","AI provider rejected the credentials. Check the API key.");
  if(status===403) return providerError(config,"ACCESS_DENIED","This API key does not have access to the selected model or provider.");
  if(status===404||/model_not_found|model.*(not found|does not exist|not supported|unavailable)/.test(detail+code)) return providerError(config,"MODEL_NOT_FOUND","The selected model or endpoint was not found. Verify the exact API model ID and base URL.");
  if(status===429) return providerError(config,"RATE_LIMITED","AI provider rate limit or quota reached. Check billing or try again shortly.");
  if(status===408||status===504) return providerError(config,"PROVIDER_TIMEOUT","AI provider timed out. Try again shortly.");
  if(status>=500) return providerError(config,"PROVIDER_UNAVAILABLE","AI provider is temporarily unavailable. Try again shortly.");
  if(/max.?tokens|max_completion_tokens|maxoutputtokens|token.*limit/.test(detail)) return providerError(config,"TOKEN_LIMIT","The model rejected the output token limit. Lower Maximum output tokens for this model.");
  if(/temperature|response.?format|schema|unsupported|not supported/.test(detail)) return providerError(config,"UNSUPPORTED_PARAMETER","The selected model does not support this request feature. Verify that it supports text chat generation.");
  return providerError(config,"INVALID_REQUEST","The provider rejected the request. Check the model ID, endpoint and model access.");
}
function adaptRequest(body,payload) {
  const detail=String(payload?.error?.message||payload?.message||"").toLowerCase();
  if(!/unsupported|not support|not allowed|unknown|unrecognized|only.*supported|invalid/.test(detail)) return false;
  if(/temperature/.test(detail)) {
    const target=body.generationConfig||body;
    if("temperature" in target){delete target.temperature;return true;}
  }
  if(/response_format|responsemimetype|response_mime_type|json.?mode|json.?schema/.test(detail)) {
    if(body.response_format){delete body.response_format;return true;}
    if(body.generationConfig?.responseMimeType){delete body.generationConfig.responseMimeType;return true;}
  }
  if(/max_completion_tokens/.test(detail)&&"max_completion_tokens" in body){body.max_tokens=body.max_completion_tokens;delete body.max_completion_tokens;return true;}
  if(/max_tokens/.test(detail)&&"max_tokens" in body){body.max_completion_tokens=body.max_tokens;delete body.max_tokens;return true;}
  return false;
}
async function readJson(response) {
  const reader=response.body?.getReader();if(!reader)return {};
  const chunks=[];let size=0;
  try {
    while(true){const {done,value}=await reader.read();if(done)break;size+=value.length;if(size>3000000)throw new Error("Oversized provider response");chunks.push(Buffer.from(value));}
    try{return JSON.parse(Buffer.concat(chunks).toString("utf8"));}catch{return {};}
  } finally {await reader.cancel();}
}
export async function callProvider(config,key,system,user,schema,signal=AbortSignal.timeout(env.aiTimeoutMs)) {
  const adapter=adapters[config.provider];
  if(!adapter)throw providerError(config,"INVALID_PROVIDER","Choose a supported AI provider.",422);
  const request=adapter.build(config,key,system,user,schema);
  let retries=0,adaptations=0;
  for(let attempt=0;attempt<6;attempt++) {
    try {
      signal.throwIfAborted();
      const response=await fetch(request.url,{method:"POST",headers:{"Content-Type":"application/json",...request.headers},body:JSON.stringify(request.body),signal,redirect:"error"});
      const payload=await readJson(response);
      if(!response.ok) {
        if(response.status===400&&adaptations<2&&adaptRequest(request.body,payload)){adaptations++;continue;}
        if((response.status===429||response.status===408||response.status>=500)&&retries<2){
          const retryAfter=Number(response.headers.get("retry-after"));
          await delay(Math.min(5000,Math.max(500*2**retries++,Number.isFinite(retryAfter)?retryAfter*1000:0)),undefined,{signal});continue;
        }
        throw diagnoseProvider(config,response.status,payload);
      }
      const result=adapter.read(payload);
      if(result.truncated)throw providerError(config,"OUTPUT_TRUNCATED","AI output reached the token limit. Increase Maximum output tokens or request a shorter article.");
      if(typeof result.text!=="string"||!result.text.trim()||result.text.length>600000)throw providerError(config,"INVALID_RESPONSE","AI provider returned an empty or oversized text response.");
      const raw=result.usage||{},inputTokens=Number(raw.prompt_tokens??raw.input_tokens??raw.promptTokenCount)||0,outputTokens=Number(raw.completion_tokens??raw.output_tokens??raw.candidatesTokenCount)||0;
      return {text:result.text,usage:{inputTokens,outputTokens,totalTokens:Number(raw.total_tokens??raw.totalTokenCount)||inputTokens+outputTokens}};
    } catch(error) {
      if(error instanceof AppError)throw error;
      if(signal.aborted)throw providerError(config,"PROVIDER_TIMEOUT","AI request timed out. Try again.",503);
      if(retries<2){await delay(500*2**retries++,undefined,{signal}).catch(()=>{});continue;}
      throw providerError(config,"PROVIDER_UNREACHABLE","AI provider is unreachable or returned an invalid response.",503);
    }
  }
  throw providerError(config,"INVALID_REQUEST","The provider rejected automatic compatibility adjustments. Verify the model and endpoint.");
}
