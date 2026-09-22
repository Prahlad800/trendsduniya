// Adapter interface: build(config, key, system, user, schema), read(response).
function compatible(config, key, system, user, schema) {
  const reasoning = /(?:^|\/)(?:gpt-5|o[134])/.test(config.model);
  const body = { model: config.model, messages: [{role:"system",content:system},{role:"user",content:user}],
    ...(!reasoning ? {temperature:config.temperature} : {}),
    [config.provider === "openai" || reasoning ? "max_completion_tokens" : "max_tokens"]: config.maxTokens };
  if (schema) body.response_format = {type:"json_object"};
  return {url:config.baseUrl+"/chat/completions",headers:{Authorization:`Bearer ${key}`},body};
}
const chat = { build: compatible, read: r => ({text:r.choices?.[0]?.message?.content,usage:r.usage,truncated:r.choices?.[0]?.finish_reason==="length"}) };
export const adapters = {
  openai: chat, openrouter: chat, groq: chat, custom: chat,
  gemini: {
    build: (c,key,system,user,schema) => ({url:`${c.baseUrl}/models/${encodeURIComponent(c.model.replace(/^models\//,""))}:generateContent`,headers:{"x-goog-api-key":key},body:{systemInstruction:{parts:[{text:system}]},contents:[{role:"user",parts:[{text:user}]}],generationConfig:{temperature:c.temperature,maxOutputTokens:c.maxTokens,...(schema?{responseMimeType:"application/json"}:{})}}}),
    read: r => ({text:r.candidates?.[0]?.content?.parts?.map(p=>p.text||"").join(""),usage:r.usageMetadata,truncated:r.candidates?.[0]?.finishReason==="MAX_TOKENS"}),
  },
  anthropic: {
    build: (c,key,system,user) => ({url:c.baseUrl+"/messages",headers:{"x-api-key":key,"anthropic-version":"2023-06-01"},body:{model:c.model,system,messages:[{role:"user",content:user}],temperature:c.temperature,max_tokens:c.maxTokens}}),
    read: r => ({text:r.content?.filter(p=>p.type==="text").map(p=>p.text).join(""),usage:r.usage,truncated:r.stop_reason==="max_tokens"}),
  },
};
