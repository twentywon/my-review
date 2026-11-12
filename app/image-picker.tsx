'use client';
import {useEffect,useRef,useState} from 'react';
import {Search,ImagePlus,Check,LoaderCircle} from 'lucide-react';
import {imageQuery,imageAddress} from '../lib/image-search';
import ImageSearchWindow from './image-search-window';
export default function ImagePicker({title,creator,type,image,onApply,onUpload,uploading}:{title:string;creator:string;type:string;image:string;onApply:(url:string)=>void;onUpload:(file?:File)=>void;uploading:boolean}){
 const [custom,setCustom]=useState(''),[address,setAddress]=useState(''),[error,setError]=useState('');
 const [searchOpen,setSearchOpen]=useState(false);
 const changed=useRef(false);
 useEffect(()=>{if(!changed.current)setAddress(image.startsWith('/api/images')||image.startsWith('data:')?'':image);changed.current=false},[image]);
 const canSearch=!!(custom.trim()||title.trim());
 function apply(){try{const url=imageAddress(address);changed.current=false;onApply(url);setAddress(url);setError('')}catch(e){setError((e as Error).message)}}
 return <div className="image-picker">
  <label className="field small-field">이미지 검색어<input value={custom} onChange={e=>setCustom(e.target.value)} maxLength={200} placeholder={title?[title,creator].filter(Boolean).join(' '):'제목 입력 후 검색'}/></label>
  <button type="button" className="google-image-btn" disabled={!canSearch||uploading} onClick={()=>setSearchOpen(true)}>Google 이미지 검색 <Search size={14}/></button>
  {searchOpen&&<ImageSearchWindow initialQuery={imageQuery(title,creator,type,custom)} onClose={()=>setSearchOpen(false)} onSelect={url=>{changed.current=false;onApply(url);setAddress(url);setError('');setSearchOpen(false)}}/>}
  <label className="field small-field">선택한 이미지 주소<input type="url" value={address} maxLength={8192} placeholder="https://…" onChange={e=>{changed.current=true;setAddress(e.target.value);onApply('');setError('')}}/></label>
  <button type="button" className="apply-image" onClick={apply} disabled={!address.trim()||uploading}><Check size={13}/>이미지 적용</button>
  {error&&<p className="image-error" role="alert">{error}</p>}
  <p className="image-help">내부 검색창에서 사진을 선택하면 바로 적용됩니다. 이미지 주소 입력, <b>Ctrl+V</b> 붙여 넣기도 가능합니다.</p>
  <label className="upload">{uploading?<LoaderCircle size={16} className="spin"/>:<ImagePlus size={16}/>} {uploading?'이미지 저장 중':'이미지 파일 업로드'}<input type="file" accept="image/jpeg,image/png,image/webp" disabled={uploading} onChange={e=>{changed.current=false;onUpload(e.target.files?.[0]);e.target.value=''}}/></label>
  <p className="hint">JPG · PNG · WebP / 최대 10MB</p>
 </div>
}
