export function googleImageSearch(title:string,creator:string,type:string,custom=''){
 const suffix=type==='album'?'앨범 커버':type==='game'?'게임 표지':'포스터';
 const query=custom.trim()||[title.trim(),creator.trim(),suffix].filter(Boolean).join(' ');
 return 'https://www.google.com/search?tbm=isch&q='+encodeURIComponent(query);
}
export function imageQuery(title:string,creator:string,type:string,custom=''){
 return (new URL(googleImageSearch(title,creator,type,custom)).searchParams.get('q')||'').slice(0,250);
}
export type ImageResult={title:string;imageUrl:string;thumbnailUrl:string;source:string;link:string};
export function imageResults(data:unknown):ImageResult[]{
 const raw=(data as {images?:unknown[]})?.images;if(!Array.isArray(raw))return [];
 const seen=new Set<string>();const results:ImageResult[]=[];
 for(const value of raw){
  if(!value||typeof value!=='object')continue;
  const item=value as Record<string,unknown>;
  try{
   if(typeof item.imageUrl!=='string')continue;
   const imageUrl=imageAddress(item.imageUrl);if(seen.has(imageUrl))continue;seen.add(imageUrl);
   let thumbnailUrl=imageUrl,link='';try{if(typeof item.thumbnailUrl==='string')thumbnailUrl=imageAddress(item.thumbnailUrl)}catch{}
   try{if(typeof item.link==='string')link=imageAddress(item.link)}catch{}
   results.push({title:String(item.title||'이미지').slice(0,200),imageUrl,thumbnailUrl,source:String(item.source||item.domain||'').slice(0,120),link});
  }catch{}
  if(results.length===24)break;
 }
 return results;
}
export function imageAddress(value:string){
 let u:URL;try{u=new URL(value.trim())}catch{throw Error('이미지 주소를 붙여 넣어 주세요.')}
 if(['google.com','www.google.com','images.google.com','google.co.kr','www.google.co.kr','images.google.co.kr'].includes(u.hostname)){
  const direct=u.searchParams.get('imgurl');
  if(!direct)throw Error('Google 검색 페이지 주소 대신 선택한 이미지의 ‘이미지 주소 복사’를 사용해 주세요.');
  try{u=new URL(direct)}catch{throw Error('이미지 주소를 확인해 주세요.')}
 }
 if(u.protocol!=='https:'||u.username||u.password||u.href.length>8192)throw Error('HTTPS 이미지 주소를 사용해 주세요.');
 if(u.hostname==='images.app.goo.gl')throw Error('공유 링크 대신 이미지 주소를 복사하거나 이미지를 복사해 붙여 넣어 주세요.');
 return u.href;
}
