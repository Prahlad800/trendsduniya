// Extract only a complete JSON object, never evaluate or invent missing values.
export function parseJsonObject(raw) {
  const text=raw.trim().replace(/^```(?:json)?\s*/i,"").replace(/\s*```$/,"");
  try{return JSON.parse(text);}catch{
    const start=text.indexOf("{"),end=text.lastIndexOf("}");
    if(start<0||end<=start)throw new Error("Invalid JSON");
    return JSON.parse(text.slice(start,end+1));
  }
}
