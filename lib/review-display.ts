export const PAGE_SIZE=10;
export function ratingFill(rating:number,index:number){return Math.max(0,Math.min(1,rating-index))}
export function pageSlice<T>(items:T[],requestedPage:number){
 const pages=Math.max(1,Math.ceil(items.length/PAGE_SIZE)),page=Math.max(1,Math.min(pages,Math.floor(requestedPage)||1));
 return {page,pages,items:items.slice((page-1)*PAGE_SIZE,page*PAGE_SIZE)};
}
export function pageNumbers(page:number,pages:number):(number|'…')[]{
 const values=[...new Set([1,pages,page-2,page-1,page,page+1,page+2].filter(n=>n>=1&&n<=pages))].sort((a,b)=>a-b);
 const result:(number|'…')[]=[];for(const n of values){const prev=result[result.length-1];if(typeof prev==='number'&&n-prev>1)result.push('…');result.push(n)}return result;
}
