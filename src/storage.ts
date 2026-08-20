export type HistoryItem={id:string;fileName:string;size:number;timestamp:number;duration:number;device:string;hash:string;mime:string};
const DB='qrblast-local', STORE='history';
function open(){ return new Promise<IDBDatabase>((resolve,reject)=>{const r=indexedDB.open(DB,1);r.onupgradeneeded=()=>r.result.createObjectStore(STORE,{keyPath:'id'});r.onsuccess=()=>resolve(r.result);r.onerror=()=>reject(r.error);}); }
export async function saveHistory(item:HistoryItem){const db=await open();await new Promise<void>((res,rej)=>{const tx=db.transaction(STORE,'readwrite');tx.objectStore(STORE).put(item);tx.oncomplete=()=>res();tx.onerror=()=>rej(tx.error);});}
export async function getHistory(){const db=await open();return new Promise<HistoryItem[]>((res,rej)=>{const r=db.transaction(STORE).objectStore(STORE).getAll();r.onsuccess=()=>res((r.result as HistoryItem[]).sort((a,b)=>b.timestamp-a.timestamp).slice(0,20));r.onerror=()=>rej(r.error);});}
