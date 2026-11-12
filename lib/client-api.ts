import {deviceEntries,saveDeviceEntry,deleteDeviceEntry} from './device-storage';
import {imageResults} from './image-search';
declare global{interface Window{TasteNative?:{request:(id:string,action:string,payload:string)=>void};tasteNativeResult?:(id:string,value:string)=>void}}
const pending=new Map<string,{resolve:(value:any)=>void;reject:(reason:Error)=>void;timer:ReturnType<typeof setTimeout>}>();
export function isDeviceApp(){return typeof window!=='undefined'&&!!window.TasteNative}
export function nativeCall(action:string,payload:unknown={}){return new Promise<any>((resolve,reject)=>{if(!window.TasteNative){reject(Error('휴대폰 앱에서 사용할 수 있습니다.'));return}window.tasteNativeResult=(id,value)=>{const request=pending.get(id);if(!request)return;clearTimeout(request.timer);pending.delete(id);try{const result=JSON.parse(value);if(result.error&&!result.code)request.reject(Error(result.error));else request.resolve(result)}catch{request.reject(Error('앱 응답을 확인하지 못했습니다.'))}};const id=crypto.randomUUID(),timer=setTimeout(()=>{pending.delete(id);reject(Error('요청 시간이 초과됐습니다. 다시 시도해 주세요.'))},['export','settings'].includes(action)?300000:30000);pending.set(id,{resolve,reject,timer});window.TasteNative.request(id,action,JSON.stringify(payload))})}
export function blobDataUrl(blob:Blob){return new Promise<string>((resolve,reject)=>{const reader=new FileReader();reader.onload=()=>resolve(String(reader.result));reader.onerror=()=>reject(Error('이미지를 열지 못했습니다.'));reader.readAsDataURL(blob)})}
export async function appFetch(url:string,options:RequestInit={}):Promise<Response>{
 if(!isDeviceApp())return fetch(url,{credentials:'same-origin',...options});
 try{
  const path=new URL(url,'https://appassets.androidplatform.net'),method=options.method||'GET';let data:unknown;
  if(path.pathname==='/api/entries'){
   if(method==='GET')data=await deviceEntries();
   else if(method==='POST')data=await saveDeviceEntry(JSON.parse(String(options.body)));
   else if(method==='DELETE'){await deleteDeviceEntry(path.searchParams.get('id')||'');data={ok:true}}
  }else if(path.pathname==='/api/images'&&method==='POST')data={url:await blobDataUrl(options.body as Blob)};
  else if(path.pathname==='/api/image-search'){
   const result=await nativeCall('search',{q:path.searchParams.get('q')||''});
   if(result.code)return Response.json(result,{status:503});data={results:imageResults(result)};
  }else return Response.json({error:'지원하지 않는 요청입니다.'},{status:404});
  return Response.json(data);
 }catch(e){return Response.json({error:(e as Error).message},{status:400})}
}
