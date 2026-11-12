import {deviceEntries,saveDeviceEntry,deleteDeviceEntry,importDeviceBackup} from '../lib/device-storage';
import type {Work} from '../lib/work';
const result=document.getElementById('result')!;const ids:string[]=[];const report:string[]=[];
function check(test:boolean,message:string){if(!test)throw Error(message);report.push('PASS '+message)}
(async()=>{try{
const first=await saveDeviceEntry({title:'기기 저장 검증',type:'game',image:'data:image/jpeg;base64,/9j/'} as Work);ids.push(first.id);
check((await deviceEntries()).some(w=>w.id===first.id&&w.title===first.title),'IndexedDB 등록 및 조회');
await saveDeviceEntry({...first,review:'수정 내용',rating:4.5});check((await deviceEntries()).find(w=>w.id===first.id)?.review==='수정 내용','기기 기록 수정');
check(await importDeviceBackup({entries:[first]})===0,'백업 중복 ID 보호');
const restoredId=crypto.randomUUID();ids.push(restoredId);check(await importDeviceBackup({entries:[{...first,id:restoredId}]})===1,'이미지 포함 백업 가져오기');
check((await deviceEntries()).find(w=>w.id===restoredId)?.image===first.image,'백업 이미지 유지');
try{await importDeviceBackup({entries:[{title:'잘못된 날짜',date:'2026-01-01'}]});throw Error('Invalid backup accepted')}catch(e){check((e as Error).message!=='Invalid backup accepted','잘못된 백업 전체 거부')}
for(const id of ids)await deleteDeviceEntry(id);check(!(await deviceEntries()).some(w=>ids.includes(w.id!)),'기기 리뷰 삭제');
result.textContent=report.join('\n')+'\nALL PASS';document.title='PASS 기기 저장소';
}catch(e){result.textContent=report.join('\n')+'\nFAIL '+(e as Error).message;document.title='FAIL 기기 저장소'}finally{for(const id of ids)await deleteDeviceEntry(id)}})();
