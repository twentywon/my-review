export const GENRES:Record<string,readonly string[]>={
 album:['발라드','댄스 / 팝','R&B / 소울','힙합 / 랩','록','인디','재즈','일렉트로닉','포크 / 어쿠스틱','클래식','OST','트로트','국악','월드뮤직','기타'],
 screen:['드라마','코미디','액션','스릴러','미스터리','범죄','로맨스','공포','SF','판타지','모험','애니메이션','다큐멘터리','가족','역사 / 시대극','전쟁','음악','기타'],
 game:['액션','어드벤처','RPG','액션 RPG','전략','시뮬레이션','퍼즐','플랫폼','슈팅','스포츠','레이싱','리듬','로그라이크','서바이벌','공포','비주얼 노벨','기타']
};
export function genreOptions(type:string){return GENRES[type==='movie'||type==='tv'?'screen':type]||GENRES.album}
export function selectedGenres(value:string){return [...new Set(value.split(',').map(x=>x.trim()).filter(Boolean))]}
export function toggleGenre(value:string,genre:string){const selected=selectedGenres(value);return (selected.includes(genre)?selected.filter(x=>x!==genre):[...selected,genre]).join(', ')}
export const NO_GENRE='__unassigned__';
export function matchesGenre(value:string,genre:string){const selected=selectedGenres(value);return !genre||(genre===NO_GENRE?!selected.length:selected.includes(genre))}
export function genreCounts(items:{genres:string}[]){
 const counts=new Map<string,number>();
 for(const item of items){const genres=selectedGenres(item.genres||'');for(const genre of genres.length?genres:[NO_GENRE])counts.set(genre,(counts.get(genre)||0)+1)}
 return [...counts.entries()].sort(([a],[b])=>a===NO_GENRE?1:b===NO_GENRE?-1:a.localeCompare(b,'ko'));
}
