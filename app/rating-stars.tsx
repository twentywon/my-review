'use client';
import {useId} from 'react';
import {ratingFill} from '../lib/review-display';
function StarGlyph({fill}:{fill:number}){
 const id=useId();const points='12,2 15.09,8.26 22,9.27 17,14.14 18.18,21.02 12,17.77 5.82,21.02 7,14.14 2,9.27 8.91,8.26';
 return <svg viewBox="0 0 24 24" aria-hidden="true" className="rating-star"><defs><clipPath id={id}><rect width={24*fill} height="24"/></clipPath></defs><polygon points={points} fill="currentColor" clipPath={'url(#'+id+')'}/><polygon points={points} fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round"/></svg>
}
export function RatingStars({value}:{value:number}){return <span className="rating-visual" role="img" aria-label={value.toFixed(1)+'점 / 5점'}>{[0,1,2,3,4].map(n=><StarGlyph key={n} fill={ratingFill(value,n)}/>)}</span>}
export function RatingInput({value,onChange}:{value:number;onChange:(value:number)=>void}){
 function move(e:React.KeyboardEvent){const direction=['ArrowRight','ArrowUp'].includes(e.key)?1:['ArrowLeft','ArrowDown'].includes(e.key)?-1:0;let next=0;if(direction)next=Math.max(.5,Math.min(5,(value||.5)+direction*.5));else if(e.key==='Home')next=.5;else if(e.key==='End')next=5;else return;e.preventDefault();onChange(next);e.currentTarget.querySelector<HTMLButtonElement>('[data-rating="'+next+'"]')?.focus()}
 return <div className="rating-input-row"><div className="rating-input" role="radiogroup" aria-label="별점 선택" onKeyDown={move}>{[0,1,2,3,4].map(n=><span className="rating-choice" key={n}><StarGlyph fill={ratingFill(value,n)}/>{[.5,1].map(part=><button type="button" className={'rating-half '+(part===.5?'left':'right')} key={part} role="radio" aria-checked={value===n+part} aria-label={(n+part)+'점'} data-rating={n+part} tabIndex={value===n+part||!value&&n===0&&part===.5?0:-1} onClick={()=>onChange(n+part)}/>)}</span>)}</div><button type="button" className="clear-rating" onClick={()=>onChange(0)} disabled={!value}>별점 지우기</button></div>
}
