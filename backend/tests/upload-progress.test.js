import {test} from "node:test";
import assert from "node:assert/strict";
import {apiUpload} from "../../admin/src/lib/api.js";

test("upload tracks transfer separately from server completion and handles errors",async t=>{
 const original=globalThis.XMLHttpRequest;
 let xhr;
 globalThis.XMLHttpRequest=class {
  constructor(){this.upload={};xhr=this;}
  open(method,url){this.method=method;this.url=url;}
  send(body){this.body=body;}
 };
 t.after(()=>{if(original)globalThis.XMLHttpRequest=original;else delete globalThis.XMLHttpRequest;});
 const progress=[];
 let resolved=false;
 const pending=apiUpload("/admin/upload/image",new FormData(),value=>progress.push(value)).then(result=>{resolved=true;return result;});
 assert.equal(xhr.url,"/api/cms/admin/upload/image");
 xhr.upload.onprogress({lengthComputable:true,loaded:25,total:100});
 xhr.upload.onload();
 await Promise.resolve();
 assert.deepEqual(progress,[25,100]);
 assert.equal(resolved,false);
 xhr.status=201;xhr.responseText=JSON.stringify({data:{url:"https://example.com/image.png"}});xhr.onload();
 assert.ok((await pending).data.url);
 const failed=apiUpload("/admin/upload/image",new FormData(),()=>{});
 xhr.status=413;xhr.responseText="Payload too large";xhr.onload();
 await assert.rejects(failed,/under 4 MB/);
 const timedOut=apiUpload("/admin/upload/image",new FormData(),()=>{});
 xhr.ontimeout();
 await assert.rejects(timedOut,/timed out/);
});
