import {env} from 'cloudflare:workers';
import {getChatGPTUser} from '../../chatgpt-auth';
import {imageResults} from '../../../lib/image-search';
export async function GET(req:Request){
 const user=await getChatGPTUser();if(!user)return Response.json({error:'로그인이 필요합니다.'},{status:401});
 const q=new URL(req.url).searchParams.get('q')?.trim()||'';
 if(!q||q.length>250)return Response.json({error:'검색어를 250자 이내로 입력해 주세요.'},{status:400});
 if(!env.SERPER_API_KEY)return Response.json({code:'SETUP_REQUIRED',error:'내부 이미지 검색을 사용하려면 Serper API 키 연결이 필요합니다.'},{status:503});
 try{
  const response=await fetch('https://google.serper.dev/images',{method:'POST',headers:{'X-API-KEY':env.SERPER_API_KEY,'Content-Type':'application/json'},body:JSON.stringify({q,gl:'kr',hl:'ko',num:24}),signal:AbortSignal.timeout(15000)});
  if(!response.ok)return Response.json({error:response.status===401||response.status===403?'이미지 검색 키를 확인해 주세요.':response.status===429?'검색 한도에 도달했습니다. 잠시 후 다시 검색해 주세요.':'이미지 검색 서비스에 연결하지 못했습니다.'},{status:502});
  const results=imageResults(await response.json());return Response.json({results},{headers:{'Cache-Control':'private, no-store'}});
 }catch{return Response.json({error:'이미지 검색 시간이 초과되었거나 연결에 실패했습니다. 다시 검색해 주세요.'},{status:502})}
}
