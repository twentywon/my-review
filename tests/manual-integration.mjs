import assert from 'node:assert/strict';import {readFileSync} from 'node:fs';
const base='http://127.0.0.1:5173';
const auth=await fetch(base+'/signin-with-chatgpt?return_to=/',{redirect:'manual'});const cookie=auth.headers.getSetCookie().map(s=>s.split(';')[0]).join('; ');
async function get(path){return fetch(base+path,{headers:{cookie}})}
async function save(work){return fetch(base+'/api/entries',{method:'POST',headers:{cookie,'Content-Type':'application/json'},body:JSON.stringify(work)})}
for(const path of ['/api/import','/api/search','/api/detail'])assert.equal((await get(path)).status,404,path);
assert.equal((await fetch(base+'/api/entries')).status,401);
assert.equal((await fetch(base+'/api/image-search?q=test')).status,401);
assert.equal((await get('/api/image-search?q=')).status,400);
const anonymousHome=await fetch(base+'/',{redirect:'manual'});assert.equal(anonymousHome.status,307);assert.ok(anonymousHome.headers.get('location').startsWith('/signin-with-chatgpt?'));
assert.equal((await get('/')).status,200);
const imageResponse=await fetch(base+'/api/images',{method:'POST',headers:{cookie,'Content-Type':'image/jpeg'},body:readFileSync('tests/cover.jpg')});assert.equal(imageResponse.status,200);const image=await imageResponse.json();
const fixture={type:'album',title:'수동 입력 통합 검증',creator:'검증 가수',cast:'',date:'2024',genres:'록, 인디',image:image.url,origin:'domestic',rating:4.5,review:'수동 입력 기능 통합 검증용 임시 기록'};
assert.equal((await save({...fixture,date:'2024-10-17'})).status,400);assert.equal((await save({...fixture,date:'0000'})).status,400);assert.equal((await save({...fixture,rating:4.7})).status,400);
const created=await save(fixture);assert.equal(created.status,200);const work=await created.json();assert.equal(work.genres,'록, 인디');assert.equal(work.date,'2024');assert.equal(work.source,'manual');
try{
 const all=await (await get('/api/entries')).json();assert.ok(all.some(w=>w.id===work.id&&w.creator==='검증 가수'&&w.date==='2024'));
 const edit=await save({...work,creator:'검증 가수, 검증 협업 가수',date:'2025',rating:5});assert.equal(edit.status,200);const edited=await edit.json();assert.equal(edited.date,'2025');assert.equal(edited.rating,5);
 console.log('PASS: removed crawler/DB routes, account auth, image upload, year-only validation, manual create/read/update and name persistence.');
}finally{assert.equal((await fetch(base+'/api/entries?id='+work.id,{method:'DELETE',headers:{cookie}})).status,200)}

for(const type of ['album','screen','movie','tv','game']){
 const response=await save({title:'선택 항목 검증 '+type,type});assert.equal(response.status,200);const minimal=await response.json();
 try{assert.equal(minimal.rating,0);assert.equal(minimal.date,'');assert.equal(minimal.image,'');assert.equal(minimal.creator,'');assert.equal(minimal.origin,'unknown');const edited=await save({...minimal,rating:3.5,date:'2026'});assert.equal(edited.status,200)}
 finally{await fetch(base+'/api/entries?id='+minimal.id,{method:'DELETE',headers:{cookie}})}
}
assert.equal((await save({title:''})).status,400);assert.equal((await save({title:'검증',image:'javascript:alert(1)'})).status,400);assert.equal((await save({title:'검증',rating:-1})).status,400);
console.log('PASS: title-only registration for all categories, optional images/year/creator/rating/cast/origin and later completion; invalid supplied values rejected.');
