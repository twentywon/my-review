import assert from 'node:assert/strict';
import {releaseYear,isReleaseYear,savedNames,matchingNames,completeName} from '../lib/manual-entry.ts';
import {googleImageSearch,imageAddress,imageQuery,imageResults} from '../lib/image-search.ts';
assert.equal(releaseYear('2021-12-29'),'2021');assert.equal(releaseYear('2021'),'2021');assert.equal(releaseYear('bad'),'');assert.equal(isReleaseYear('2021'),true);assert.equal(isReleaseYear('2021-12-29'),false);assert.equal(isReleaseYear('0000'),false);
const items=[{type:'album',creator:'아이유, 오혁',genres:'발라드'},{type:'album',creator:' 아이유 ',genres:'록'},{type:'movie',creator:'봉준호',cast:'송강호, 박소담'},{type:'tv',creator:'황동혁',cast:'이정재, 송강호'},{type:'game',creator:'Round8 Studio'}];
assert.deepEqual(savedNames(items,'creator','album'),['아이유','오혁']);assert.deepEqual(savedNames(items,'creator','movie'),['봉준호','황동혁']);assert.deepEqual(savedNames(items,'creator','game'),['Round8 Studio']);assert.deepEqual(savedNames(items,'cast','tv'),['박소담','송강호','이정재']);assert.deepEqual(matchingNames(['아이유','오혁'],'아이유, 오'),['오혁']);assert.deepEqual(matchingNames(['Round8 Studio'],'round'),['Round8 Studio']);assert.equal(completeName('아이유, 오','오혁'),'아이유, 오혁');assert.equal(completeName('봉','봉준호'),'봉준호');
const url=new URL(googleImageSearch('조각집','아이유','album'));assert.equal(url.hostname,'www.google.com');assert.equal(url.searchParams.get('tbm'),'isch');assert.equal(url.searchParams.get('q'),'조각집 아이유 앨범 커버');
const image='https://example.org/poster.jpg?a=1&b=2';assert.equal(imageAddress('https://www.google.com/imgres?imgurl='+encodeURIComponent(image)),image);assert.equal(imageAddress(image),image);assert.throws(()=>imageAddress('https://www.google.com/search?tbm=isch&q=test'));assert.throws(()=>imageAddress('https://images.app.goo.gl/Test'));assert.throws(()=>imageAddress('javascript:alert(1)'));assert.throws(()=>imageAddress('https://www.google.com/imgres?imgurl='+encodeURIComponent('javascript:alert(1)')));
console.log('PASS: year-only and legacy dates, role-specific and comma-separated autocomplete, Google image search URL and image-only extraction.');

const {genreOptions,selectedGenres,toggleGenre}=await import('../lib/genres.ts');
assert.ok(genreOptions('album').includes('발라드'));assert.ok(!genreOptions('album').includes('RPG'));assert.deepEqual(genreOptions('movie'),genreOptions('tv'));assert.ok(genreOptions('game').includes('RPG'));
assert.equal(toggleGenre('록','인디'),'록, 인디');assert.equal(toggleGenre('록, 인디','록'),'인디');assert.deepEqual(selectedGenres('록, 록, 인디'),['록','인디']);
assert.equal(imageQuery('조각집','아이유','album'),'조각집 아이유 앨범 커버');assert.equal(imageQuery('a'.repeat(300),'','album').length,250);
const normalized=imageResults({images:[{title:'표지',imageUrl:'https://example.org/cover.jpg',thumbnailUrl:'javascript:bad',link:'https://example.org/album',source:'출처'},{imageUrl:'https://example.org/cover.jpg'},{imageUrl:'javascript:alert(1)'},null,{}]});
assert.equal(normalized.length,1);assert.equal(normalized[0].thumbnailUrl,normalized[0].imageUrl);assert.equal(normalized[0].source,'출처');assert.deepEqual(imageResults({images:'bad'}),[]);
console.log('PASS: category genre presets, multi-selection, legacy values, image query limits, safe normalized and deduplicated search results.');

const {genreCounts,matchesGenre,NO_GENRE}=await import('../lib/genres.ts');
assert.deepEqual(genreCounts([{genres:'록, 인디, 록'},{genres:'록'},{genres:''}]),[['록',2],['인디',1],[NO_GENRE,1]]);
assert.equal(matchesGenre('인디 록','록'),false);assert.equal(matchesGenre('록, 인디','인디'),true);assert.equal(matchesGenre('',NO_GENRE),true);assert.equal(matchesGenre('록',NO_GENRE),false);assert.equal(matchesGenre('록',''),true);
console.log('PASS: exact genre filtering, multi-genre counts, unassigned genres and all-genres reset.');

const {normalizeWork}=await import('../lib/work.ts');
assert.equal(normalizeWork({title:'제목만'}).type,'album');assert.equal(normalizeWork({title:'제목만'}).rating,0);
assert.throws(()=>normalizeWork({title:'이미지 검증',image:'data:image/jpeg;base64,/9j/'}));
assert.equal(normalizeWork({title:'이미지 검증',image:'data:image/jpeg;base64,/9j/'},true).image,'data:image/jpeg;base64,/9j/');
assert.throws(()=>normalizeWork({title:'검증',rating:4.7}));assert.throws(()=>normalizeWork({title:'검증',date:'2026-01-01'}));assert.throws(()=>normalizeWork({title:'검증',image:'https://name:secret@example.org/a.jpg'}));
console.log('PASS: shared optional-field validation, native-only embedded JPEG images, invalid dates/ratings/credential URLs rejected.');

const {PAGE_SIZE,pageSlice,pageNumbers,ratingFill}=await import('../lib/review-display.ts');
assert.equal(PAGE_SIZE,10);assert.equal(ratingFill(4.5,3),1);assert.equal(ratingFill(4.5,4),.5);assert.equal(ratingFill(.5,0),.5);assert.equal(ratingFill(0,0),0);
for(const [count,pages] of [[0,1],[10,1],[11,2],[20,2],[21,3]])assert.equal(pageSlice(Array.from({length:count},(_,i)=>i),1).pages,pages);
assert.deepEqual(pageSlice(Array.from({length:11},(_,i)=>i),2).items,[10]);assert.equal(pageSlice([1],2).page,1);assert.equal(pageSlice([1],-2).page,1);assert.deepEqual(pageNumbers(5,10),[1,'…',3,4,5,6,7,'…',10]);
console.log('PASS: half-star fill, 10-record page boundaries, empty-page clamping and bounded numbered navigation.');

const {workCategory}=await import('../lib/manual-entry.ts');
assert.equal(workCategory('movie'),'screen');assert.equal(workCategory('tv'),'screen');assert.equal(workCategory('screen'),'screen');
assert.equal(normalizeWork({title:'기존 영화',type:'movie'}).type,'screen');assert.equal(normalizeWork({title:'기존 드라마',type:'tv'}).type,'screen');assert.equal(normalizeWork({title:'통합 작품',type:'screen'}).type,'screen');
assert.deepEqual(savedNames([{type:'movie',creator:'영화 감독'},{type:'tv',creator:'드라마 감독'},{type:'screen',creator:'통합 감독'}],'creator','screen'),['드라마 감독','영화 감독','통합 감독']);
console.log('PASS: unified screen category, legacy film/TV compatibility and shared director suggestions.');
