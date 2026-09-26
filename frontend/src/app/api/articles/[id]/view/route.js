import {API_URL} from "../../../../../lib/api";
export async function POST(request,{params}) {
 const {id}=await params;
 if(!/^[a-f\d]{24}$/i.test(id))return new Response(null,{status:400});
 try {
  const result=await fetch(API_URL+"/articles/"+id+"/view",{method:"POST",cache:"no-store",signal:AbortSignal.timeout(5000)});
  return new Response(null,{status:result.ok?204:result.status});
 } catch {return new Response(null,{status:503});}
}
