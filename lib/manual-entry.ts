export type EntryNames = {type:string;creator:string;cast?:string;genres?:string};
export const workCategory=(type:string)=>type==='movie'||type==='tv'?'screen':type;
const group=workCategory;
export function releaseYear(value:unknown){return typeof value==='string'?value.match(/^[1-9]\d{3}(?=$|[-/.])/)?.[0]||'':''}
export function isReleaseYear(value:unknown){return typeof value==='string'&&/^[1-9]\d{3}$/.test(value)}
export function nameParts(value:string){return value.split(/[,，、;；\n]+/).map(s=>s.trim().replace(/\s+/g,' ')).filter(Boolean)}
export function savedNames(items:EntryNames[],field:'creator'|'cast'|'genres',type:string){
 const seen=new Map<string,string>();
 for(const item of items){
  if(group(item.type)!==group(type))continue;
  for(const name of nameParts(item[field]||'')){
   const key=name.normalize('NFKC').toLocaleLowerCase('ko');if(!seen.has(key))seen.set(key,name);
  }
 }
 return [...seen.values()].sort((a,b)=>a.localeCompare(b,'ko'));
}
export function matchingNames(names:string[],value:string){
 const parts=value.split(/[,，、;；\n]/),token=parts.pop()?.trim().normalize('NFKC').toLocaleLowerCase('ko')||'';
 const existing=new Set(parts.map(p=>p.trim().normalize('NFKC').toLocaleLowerCase('ko')));
 return names.filter(n=>!existing.has(n.normalize('NFKC').toLocaleLowerCase('ko'))&&n.normalize('NFKC').toLocaleLowerCase('ko').includes(token)).sort((a,b)=>Number(b.toLocaleLowerCase('ko').startsWith(token))-Number(a.toLocaleLowerCase('ko').startsWith(token))).slice(0,7);
}
export function completeName(value:string,name:string){
 const last=Math.max(...[',','，','、',';','；','\n'].map(c=>value.lastIndexOf(c)));
 return last<0?name:value.slice(0,last+1).trimEnd()+' '+name;
}
