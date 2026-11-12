'use client';
import {useId,useState} from 'react';
import {CornerDownLeft} from 'lucide-react';
import {completeName,matchingNames} from '../lib/manual-entry';
export default function NameAutocomplete({label,value,onChange,names,placeholder='',required=false,maxLength=500}:{label:string;value:string;onChange:(value:string)=>void;names:string[];placeholder?:string;required?:boolean;maxLength?:number}){
 const id=useId(),[open,setOpen]=useState(false),[active,setActive]=useState(-1);
 const matches=matchingNames(names,value),visible=open&&matches.length>0;
 function choose(name:string){onChange(completeName(value,name));setOpen(false);setActive(-1)}
 return <div className="autocomplete-field"><label className="field" htmlFor={id}>{label}<input id={id} role="combobox" aria-autocomplete="list" aria-expanded={visible} aria-controls={id+'-options'} aria-activedescendant={visible&&active>=0&&matches[active]?id+'-option-'+active:undefined} autoComplete="off" required={required} maxLength={maxLength} value={value} placeholder={placeholder} onFocus={()=>{setOpen(true);setActive(-1)}} onBlur={()=>setOpen(false)} onChange={e=>{onChange(e.target.value);setOpen(true);setActive(-1)}} onKeyDown={e=>{
  if(e.key==='ArrowDown'&&matches.length){e.preventDefault();setOpen(true);setActive(i=>Math.min(i+1,matches.length-1))}
  else if(e.key==='ArrowUp'&&visible){e.preventDefault();setActive(i=>Math.max(i-1,0))}
  else if(e.key==='Enter'&&visible){e.preventDefault();if(active>=0&&matches[active])choose(matches[active]);else setOpen(false)}
  else if(e.key==='Escape'&&visible){e.preventDefault();e.stopPropagation();setOpen(false)}
 }}/></label>
 {visible&&<div className="autocomplete-options" id={id+'-options'} role="listbox" aria-label={label.replace(' *','')+' 자동완성'}>{matches.map((name,i)=><button key={name} id={id+'-option-'+i} type="button" tabIndex={-1} role="option" aria-selected={active===i} className={active===i?'active':''} onMouseDown={e=>e.preventDefault()} onClick={()=>choose(name)}><span>{name}</span><CornerDownLeft size={12}/></button>)}<p>기존 기록에서 선택 · 새 이름도 직접 입력할 수 있어요</p></div>}
 </div>
}
