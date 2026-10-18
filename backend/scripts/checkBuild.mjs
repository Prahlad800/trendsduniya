import {readdirSync} from "node:fs";
import {join} from "node:path";
import {spawnSync} from "node:child_process";
function files(dir){return readdirSync(dir,{withFileTypes:true}).flatMap(entry=>entry.isDirectory()?files(join(dir,entry.name)):/\.(?:m?js)$/.test(entry.name)?[join(dir,entry.name)]:[]);}
const sources=["server.js",...files("src"),...files("scripts")];
for(const source of sources){
 const result=spawnSync(process.execPath,["--check",source],{stdio:"inherit"});
 if(result.error)throw result.error;
 if(result.status!==0)process.exit(result.status||1);
}
console.log("Backend syntax validation passed for "+sources.length+" JavaScript files. No compilation required.");
