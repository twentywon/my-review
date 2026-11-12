import {isReleaseYear,workCategory} from './manual-entry.ts';
export type Work={id?:string;type:string;title:string;creator:string;cast:string;date:string;genres:string;image:string;origin:string;source:string;externalId:string;rating:number;review:string;sourceUrl?:string;updated?:string};
export function normalizeWork(input:unknown,allowDeviceImage=false):Work{
 if(!input||typeof input!=='object'||Array.isArray(input))throw Error('작품 정보를 확인해 주세요.');
 const x={type:'album',creator:'',cast:'',date:'',genres:'',image:'',origin:'unknown',rating:0,review:'',source:'manual',externalId:'',...input} as Work;
 x.type=workCategory(x.type);
 if(!['album','screen','game'].includes(x.type)||typeof x.title!=='string'||!x.title.trim()||x.title.length>200)throw Error('제목을 200자 이내로 입력해 주세요.');
 for(const [key,max] of [['creator',300],['cast',500],['genres',300],['review',160]] as const){if(typeof x[key]!=='string'||x[key].length>max)throw Error('입력한 정보가 너무 깁니다.');x[key]=x[key].trim()}
 if(typeof x.date!=='string'||x.date!==''&&!isReleaseYear(x.date))throw Error('연도는 네 자리 숫자로 입력해 주세요.');
 if(typeof x.rating!=='number'||!Number.isFinite(x.rating)||x.rating<0||x.rating>5||x.rating*2%1)throw Error('별점은 0.5점 단위로 선택해 주세요.');
 if(!['domestic','overseas','unknown'].includes(x.origin))throw Error('국내 / 해외 구분을 확인해 주세요.');
 if(typeof x.image!=='string')throw Error('이미지 주소를 확인해 주세요.');
 const device=allowDeviceImage&&/^data:image\/jpeg;base64,[A-Za-z0-9+/]+=*$/.test(x.image)&&x.image.length<2100000;
 const local=/^\/api\/images\?id=[a-f0-9-]{36}$/.test(x.image);
 let remote=false;try{const u=new URL(x.image);remote=u.protocol==='https:'&&!u.username&&!u.password&&x.image.length<=8192}catch{}
 if(x.image&&!device&&!local&&!remote)throw Error('이미지 주소를 확인해 주세요.');
 return {type:x.type,title:x.title.trim(),creator:x.creator,cast:x.cast,date:x.date,genres:x.genres,image:x.image,origin:x.origin,rating:x.rating,review:x.review,source:'manual',externalId:''};
}
