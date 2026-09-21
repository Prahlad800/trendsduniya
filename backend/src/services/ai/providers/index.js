// Adapter interface: build(config, key, system, user, schema), read(response).
function compatible(config, key, system, user, schema) {
  const reasoning = /(?:^|\/)(?:gpt-5|o[134])/.test(config.model);
  const body = { model: config.model, messages: [{role:"system",content:system},{role:"user",content:user}],
    ...(reasoning ? {reasoning_effort:"low"} : {temperature:config.temperature}),
    [config.provider === "openai" || reasoning ? "max_completion_tokens" : "max_tokens"]: config.maxTokens };
  if (schema && config.outputMode !== "prompt") body.response_format = config.outputMode === "schema"
    ? {type:"json_schema",json_schema:{name:"article",strict:true,schema}} : {type:"json_object"};
  return {url:config.baseUrl+"/chat/completions",headers:{Authorization:`Bearer ${key}`},body};
}
const chat = { build: compatible, read: r => ({text:r.choices?.[0]?.message?.content,usage:r.usage}) };
export const adapters = {
  openai: chat, openrouter: chat, groq: chat, custom: chat,
  gemini: {
    build: (c,key,system,user,schema) => ({url:`${c.baseUrl}/models/${encodeURIComponent(c.model)}:generateContent`,headers:{"x-goog-api-key":key},body:{systemInstruction:{parts:[{text:system}]},contents:[{role:"user",parts:[{text:user}]}],generationConfig:{temperature:c.temperature,maxOutputTokens:c.maxTokens,...(schema&&c.outputMode!=="prompt"?{responseMimeType:"application/json",...(c.outputMode==="schema"?{responseJsonSchema:schema}:{})}:{})}}}),
    read: r => ({text:r.candidates?.[0]?.content?.parts?.map(p=>p.text||"").join(""),usage:r.usageMetadata}),
  },
  anthropic: {
    build: (c,key,system,user) => ({url:c.baseUrl+"/messages",headers:{"x-api-key":key,"anthropic-version":"2023-06-01"},body:{model:c.model,system,messages:[{role:"user",content:user}],temperature:c.temperature,max_tokens:c.maxTokens}}),
    read: r => ({text:r.content?.filter(p=>p.type==="text").map(p=>p.text).join(""),usage:r.usage}),
  },
};
