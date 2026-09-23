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
  const code=[payload?.error?.code,payload?.error?.status,payload?.error?.type,payload?.error?.metadata?.error_type].filter(Boolean).join(" ").toLowerCase();
  if(status===401||/api.?key.*(invalid|not valid)|invalid.*api.?key|authentication_error/.test(detail+code)) return providerError(config,"INVALID_API_KEY","AI provider rejected the credentials. Check the API key.");
  if(status===403) return providerError(config,"ACCESS_DENIED","This API key does not have access to the selected model or provider.");
  if(status===402||/insufficient_quota|billing|credit.*(exhaust|insufficient)|insufficient.*credit|quota.*per.?day|daily.*quota/.test(detail+code)) return providerError(config,"QUOTA_EXCEEDED","AI provider quota or credits are exhausted. Check provider billing and usage limits before retrying.");
  if(status===429) return providerError(config,"RATE_LIMITED","AI provider rate limit or quota reached. Check billing or try again shortly.");
  if(status===408||status===504) return providerError(config,"PROVIDER_TIMEOUT","AI provider timed out. Try again shortly.");
  if(status>=500) return providerError(config,"PROVIDER_UNAVAILABLE","AI provider is temporarily unavailable. Try again shortly.");
  if(status===404&&/no longer available|retired|decommissioned/.test(detail))return providerError(config,"MODEL_NOT_FOUND","This model has been retired or is no longer available to your account. Choose a currently supported API model ID from your provider.");
  if(status===404||/model_not_found|model.*(not found|does not exist)/.test(detail+code)) return providerError(config,"MODEL_NOT_FOUND","The selected model or endpoint was not found. Verify the exact API model ID and base URL.");
  if(/unsupported_parameter|unsupported.*parameter|unknown.*parameter|unrecognized.*(field|parameter)/.test(detail+code)) return providerError(config,"UNSUPPORTED_PARAMETER","The selected model does not support a request parameter. Check its text generation API requirements.");
  if(/max.?tokens|max_completion_tokens|maxoutputtokens|token.*limit|context.*(length|window)/.test(detail+code)) return providerError(config,"TOKEN_LIMIT","The model rejected the token budget. Reduce input length or adjust Maximum output tokens for this model.");
  if(/temperature|response.?format|schema|unsupported|not supported/.test(detail)) return providerError(config,"UNSUPPORTED_PARAMETER","The selected model does not support this request feature. Verify that it supports text chat generation.");
  return providerError(config,"INVALID_REQUEST","The provider rejected the request. Check the model ID, endpoint and model access.");
}
function adaptRequest(body,payload,changed) {
  const detail=String(payload?.error?.message||payload?.message||"").toLowerCase();
  const param=String(payload?.error?.param||"").toLowerCase();
  if(!/unsupported|not support|not allowed|unknown|unrecognized|only.*supported/.test(detail+String(payload?.error?.code||""))) return false;
  if(/temperature/.test(detail)) {
    const target=body.generationConfig||body;
    if("temperature" in target){delete target.temperature;return true;}
  }
  if(/response_format|responsemimetype|response_mime_type|json.?mode|json.?schema/.test(detail)) {
    if(body.response_format){delete body.response_format;return true;}
    if(body.generationConfig?.responseMimeType){delete body.generationConfig.responseMimeType;return true;}
  }
  // Only rename a rejected field; never toggle budgets repeatedly or adjust a valid limit.
  if(!changed.has("tokenParameter"))for(const [from,to] of [["max_completion_tokens","max_tokens"],["max_tokens","max_completion_tokens"]]){
    if(from in body&&(param===from||(!param&&new RegExp(`(?:unsupported|unknown|unrecognized) (?:parameter|field):? ['\"]?${from}\\b|\\b${from}['\"]? (?:is )?(?:not supported|unsupported)`).test(detail)))){
      body[to]=body[from];delete body[from];changed.add("tokenParameter");return true;
    }
  }
  return false;
}
async function readJson(response,config) {
  const reader=response.body?.getReader();if(!reader)return {};
  const chunks=[];let size=0;
  try {
    while(true){const {done,value}=await reader.read();if(done)break;size+=value.length;if(size>3000000)throw providerError(config,"INVALID_RESPONSE","AI provider returned an oversized response.");chunks.push(Buffer.from(value));}
    try{return JSON.parse(Buffer.concat(chunks).toString("utf8"));}catch{return {};}
  } finally {await reader.cancel();}
}
export async function callProvider(config,key,system,user,schema,signal=AbortSignal.timeout(env.aiTimeoutMs)) {
  const adapter=adapters[config.provider];
  if(!adapter)throw providerError(config,"INVALID_PROVIDER","Choose a supported AI provider.",422);
  const request=adapter.build(config,key,system,user,schema);
  let retries=0,adaptations=0;const changed=new Set();
  for(let attempt=0;attempt<6;attempt++) {
    try {
      signal.throwIfAborted();
      const response=await fetch(request.url,{method:"POST",headers:{"Content-Type":"application/json",...request.headers},body:JSON.stringify(request.body),signal,redirect:"error"});
      const payload=await readJson(response,config);
      if(!response.ok||payload?.error) {
        const status=response.ok?(Number(payload.error?.code)||502):response.status;
        if([400,422].includes(status)&&adaptations<3&&adaptRequest(request.body,payload,changed)){adaptations++;continue;}
        const error=diagnoseProvider(config,status,payload);
        if(["RATE_LIMITED","PROVIDER_TIMEOUT","PROVIDER_UNAVAILABLE"].includes(error.errorCode)&&retries<2){
          const header=response.headers.get("retry-after");
          const retryAfter=header===null?0:/^\d+(?:\.\d+)?$/.test(header)?Number(header)*1000:Math.max(0,Date.parse(header)-Date.now())||0;
          // A long server-directed wait is returned to the caller, never shortened.
          if(retryAfter>5000)throw error;
          await delay(Math.max(500*2**retries++,retryAfter),undefined,{signal});continue;
        }
        throw error;
      }
      let result;
      try{result=adapter.read(payload);}catch{throw providerError(config,"INVALID_RESPONSE","AI provider returned an invalid response structure.");}
      if(result.blocked)throw providerError(config,"INVALID_RESPONSE","AI provider refused or could not complete the text response. Check the model and input.");
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
