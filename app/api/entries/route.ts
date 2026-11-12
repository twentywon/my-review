import {getChatGPTUser} from '../../chatgpt-auth';
import {getDb} from '../../../db';
import {entries} from '../../../db/schema';
import {and,eq,desc} from 'drizzle-orm';
import {releaseYear} from '../../../lib/manual-entry';
import {normalizeWork} from '../../../lib/work';
function safeUrl(value:unknown){
 if(typeof value!=='string')return '';
 try{const u=new URL(value);return u.protocol==='https:'&&!u.username&&!u.password?u.href:''}catch{return ''}
}
function imageUrl(value:unknown){
 if(typeof value==='string'&&/^\/api\/images\?id=[a-f0-9-]{36}$/.test(value))return value;
 return safeUrl(value);
}
export async function GET(){
 const user=await getChatGPTUser();if(!user)return Response.json({error:'로그인이 필요합니다.'},{status:401});
 const rows=await getDb().select().from(entries).where(eq(entries.owner,user.userId)).orderBy(desc(entries.updated));
 return Response.json(rows.map(row=>{const work=JSON.parse(row.data);return {...work,date:releaseYear(work.date)}}));
}
export async function POST(req:Request){
 const user=await getChatGPTUser();if(!user)return Response.json({error:'로그인이 필요합니다.'},{status:401});
 try{
  const input:any=await req.json();
  if(!input||typeof input!=='object'||Array.isArray(input))return Response.json({error:'작품 정보를 확인해 주세요.'},{status:400});
  let x;try{x=normalizeWork(input)}catch(e){return Response.json({error:(e as Error).message},{status:400})}
  const id=typeof input.id==='string'&&/^[\w:-]{1,150}$/.test(input.id)?input.id:crypto.randomUUID();
  const previous=await getDb().select().from(entries).where(eq(entries.id,id));
  if(previous.length&&previous[0].owner!==user.userId)return Response.json({error:'권한이 없습니다.'},{status:403});
  const data={id,type:x.type,title:x.title.trim(),creator:x.creator.trim(),date:x.date,genres:x.genres.trim(),cast:String(x.cast||'').trim().slice(0,500),image:imageUrl(x.image),rating:x.rating,review:x.review.trim(),origin:x.origin,source:previous.length?String(input.source||'manual').slice(0,100):'manual',sourceUrl:previous.length?safeUrl(input.sourceUrl).slice(0,2000):'',externalId:previous.length?String(input.externalId||'').slice(0,2000):'',updated:new Date().toISOString()};
  await getDb().insert(entries).values({id,owner:user.userId,data:JSON.stringify(data),updated:data.updated}).onConflictDoUpdate({target:entries.id,set:{data:JSON.stringify(data),updated:data.updated}});
  return Response.json(data);
 }catch{return Response.json({error:'저장하지 못했습니다. 잠시 후 다시 시도해 주세요.'},{status:500})}
}
export async function DELETE(req:Request){
 const user=await getChatGPTUser();if(!user)return Response.json({error:'로그인이 필요합니다.'},{status:401});
 const id=new URL(req.url).searchParams.get('id');if(!id)return Response.json({error:'ID가 없습니다.'},{status:400});
 await getDb().delete(entries).where(and(eq(entries.owner,user.userId),eq(entries.id,id)));return Response.json({ok:true});
}
