import {normalizeWork,type Work} from './work';
let database:Promise<IDBDatabase>|undefined;
function db(){return database??=new Promise<IDBDatabase>((resolve,reject)=>{const request=indexedDB.open('taste-notes',1);request.onupgradeneeded=()=>request.result.createObjectStore('entries',{keyPath:'id'});request.onsuccess=()=>resolve(request.result);request.onerror=()=>{database=undefined;reject(Error('휴대폰 저장소를 열지 못했습니다.'))}})}
async function transaction<T>(mode:IDBTransactionMode,action:(store:IDBObjectStore)=>IDBRequest<T>){const database=await db();return new Promise<T>((resolve,reject)=>{const tx=database.transaction('entries',mode),request=action(tx.objectStore('entries'));tx.oncomplete=()=>resolve(request.result);tx.onerror=()=>reject(Error('휴대폰 저장 공간을 확인해 주세요.'));tx.onabort=()=>reject(Error('기록 저장이 중단되었습니다.'))})}
export async function deviceEntries(){return (await transaction('readonly',s=>s.getAll()) as Work[]).sort((a,b)=>(b.updated||'').localeCompare(a.updated||''))}
export async function saveDeviceEntry(input:Work){const work={...normalizeWork(input,true),id:input.id||crypto.randomUUID(),updated:new Date().toISOString()};await transaction('readwrite',s=>s.put(work));return work}
export async function deleteDeviceEntry(id:string){await transaction('readwrite',s=>s.delete(id))}
export async function importDeviceBackup(input:unknown){
 const raw=(input as {entries?:unknown[]})?.entries;if(!Array.isArray(raw)||raw.length>5000)throw Error('취향록 백업 파일을 선택해 주세요. (최대 5,000개)');
 const existing=new Set((await deviceEntries()).map(w=>w.id));
 const entries=raw.map(value=>{const item=value as Work,work=normalizeWork(item,true);if(work.image.startsWith('/api/images'))work.image='';return {...work,id:typeof item.id==='string'&&/^[\w:-]{1,150}$/.test(item.id)?item.id:crypto.randomUUID(),updated:typeof item.updated==='string'?item.updated:new Date().toISOString()}}).filter(w=>{if(existing.has(w.id))return false;existing.add(w.id);return true});
 const database=await db();await new Promise<void>((resolve,reject)=>{const tx=database.transaction('entries','readwrite'),store=tx.objectStore('entries');for(const work of entries)store.put(work);tx.oncomplete=()=>resolve();tx.onerror=()=>reject(Error('백업을 저장하지 못했습니다.'));tx.onabort=()=>reject(Error('백업 가져오기가 중단되었습니다.'))});return entries.length;
}
