'use client';
import {useEffect,useRef,useState} from 'react';
import {ArrowUpRight,LoaderCircle,Search,X} from 'lucide-react';
import {appFetch,isDeviceApp,nativeCall} from '../lib/client-api';
import type {ImageResult} from '../lib/image-search';
export default function ImageSearchWindow({initialQuery,onSelect,onClose}:{initialQuery:string;onSelect:(url:string)=>void;onClose:()=>void}){
 const [query,setQuery]=useState(initialQuery),[results,setResults]=useState<ImageResult[]>([]),[busy,setBusy]=useState(false),[error,setError]=useState(''),[setup,setSetup]=useState(false),[searched,setSearched]=useState(false);
 const [needsLogin,setNeedsLogin]=useState(false);
 const panel=useRef<HTMLElement>(null),request=useRef<AbortController|null>(null);
 useEffect(()=>{const previous=document.activeElement as HTMLElement;panel.current?.querySelector('input')?.focus();search(initialQuery);return()=>{request.current?.abort();previous?.focus()}},[]);
 async function search(value:string){
  request.current?.abort();const controller=new AbortController();request.current=controller;
  if(!value.trim())return;setBusy(true);setError('');setSetup(false);setNeedsLogin(false);setResults([]);setSearched(false);
  try{const r=await appFetch('/api/image-search?q='+encodeURIComponent(value.trim()),{signal:controller.signal,credentials:'same-origin'}),data=await r.json() as {code?:string;error?:string;results?:ImageResult[]};if(controller.signal.aborted)return;if(!r.ok){setNeedsLogin(r.status===401);setSetup(data.code==='SETUP_REQUIRED');throw Error(r.status===401?'앱 로그인 상태를 다시 확인해 주세요.':data.error||'검색하지 못했습니다.')}setResults(data.results||[]);setSearched(true)}catch(e){if(!controller.signal.aborted)setError((e as Error).message)}finally{if(!controller.signal.aborted)setBusy(false)}
 }
 function keys(e:React.KeyboardEvent){
  if(e.key==='Escape'){e.preventDefault();e.stopPropagation();onClose()}
  if(e.key==='Tab'){
   e.stopPropagation();const els=Array.from(panel.current?.querySelectorAll<HTMLElement>('button:not(:disabled),input,a[href]')||[]),first=els[0],last=els[els.length-1];
   if(e.shiftKey&&document.activeElement===first){e.preventDefault();last?.focus()}else if(!e.shiftKey&&document.activeElement===last){e.preventDefault();first?.focus()}
  }
 }
 return <div className="image-search-overlay" onKeyDown={keys} onClick={e=>{if(e.target===e.currentTarget){e.stopPropagation();onClose()}}}><section className="image-search-window" role="dialog" aria-modal="true" aria-label="Google 이미지 선택" ref={panel}>
  <header><div><p className="eyebrow">FIND YOUR COVER</p><h3>Google 이미지 선택</h3></div><button type="button" className="icon-btn" aria-label="이미지 검색 닫기" onClick={onClose}><X/></button></header>
  <div className="image-search-bar"><Search size={18}/><input aria-label="Google 이미지 검색어" maxLength={250} value={query} onChange={e=>setQuery(e.target.value)} onKeyDown={e=>{if(e.key==='Enter'){e.preventDefault();search(query)}}}/><button type="button" className="primary" disabled={!query.trim()} onClick={()=>search(query)}>검색</button></div>
  <p className="image-search-hint">사진을 누르면 작품 이미지로 바로 적용됩니다.</p>
  <div className="image-search-body" aria-busy={busy}>
   {busy&&<p className="image-search-status" role="status"><LoaderCircle className="spin"/>이미지를 검색하는 중이에요.</p>}
   {error&&<div className="image-search-status"><p role="alert">{error}</p>{needsLogin&&<><p>새 탭에서 앱에 로그인한 뒤 돌아와 검색을 다시 누르세요. 이 창의 입력 내용은 유지됩니다.</p><a className="secondary" href="/signin-with-chatgpt?return_to=/" target="_blank" rel="noopener noreferrer">앱 로그인 <ArrowUpRight size={14}/></a></>}{setup&&isDeviceApp()&&<><p>앱 설정에서 Serper 키를 등록하면 이미지 검색을 사용할 수 있습니다.</p><button type="button" className="secondary" onClick={async()=>{try{await nativeCall('settings');search(query)}catch(e){setError((e as Error).message)}}}>검색 키 설정</button></>}{setup&&!isDeviceApp()&&<><p>Serper에서 키를 발급받아 앱의 서버 설정에 연결하면 이 창에서 사진을 선택할 수 있습니다. 키는 채팅에 보내지 마세요.</p><a className="secondary" href="https://serper.dev/" target="_blank" rel="noopener noreferrer">Serper 열기 <ArrowUpRight size={14}/></a><p className="hint">연결 전에는 아래 Google 검색에서 이미지를 복사한 후 작품 입력창에 붙여 넣거나, 파일을 업로드할 수 있습니다.</p></>}</div>}
   {!busy&&searched&&!results.length&&<p className="image-search-status">검색 결과가 없어요. 제목이나 가수 이름을 바꿔 보세요.</p>}
   <div className="image-results">{results.map((item,i)=><div className="image-result" key={item.imageUrl}><button type="button" aria-label={item.title+' 이미지 선택'} onClick={()=>onSelect(item.imageUrl)}><img src={item.thumbnailUrl} alt={item.title} loading="lazy" referrerPolicy="no-referrer" onError={e=>{e.currentTarget.style.opacity='0.2'}}/><span>{item.title}</span><small>{item.source}</small></button>{item.link&&<a href={item.link} target="_blank" rel="noopener noreferrer" aria-label={(i+1)+'번 이미지 출처 열기'}>출처 <ArrowUpRight size={12}/></a>}</div>)}</div>
  </div><footer><span>Google 이미지 검색 · Serper 제공</span><a href={'https://www.google.com/search?tbm=isch&q='+encodeURIComponent(query)} target="_blank" rel="noopener noreferrer">Google에서 직접 검색 <ArrowUpRight size={13}/></a></footer>
 </section></div>
}
