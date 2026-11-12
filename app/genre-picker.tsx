'use client';
import {genreOptions,selectedGenres,toggleGenre} from '../lib/genres';
export default function GenrePicker({type,value,onChange}:{type:string;value:string;onChange:(value:string)=>void}){
 const selected=selectedGenres(value),options=genreOptions(type),legacy=selected.filter(x=>!options.includes(x));
 return <fieldset className="genre-picker"><legend>장르 <small>여러 개 선택 가능</small></legend><div className="genre-options">{[...options,...legacy].map(genre=><label key={genre} className={selected.includes(genre)?'genre-option selected':'genre-option'}><input type="checkbox" checked={selected.includes(genre)} onChange={()=>onChange(toggleGenre(value,genre))}/><span>{genre}{legacy.includes(genre)&&<small> · 기존</small>}</span></label>)}</div>{!selected.length&&<p className="hint">원하는 장르를 선택할 수 있어요.</p>}</fieldset>
}
