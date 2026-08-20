export type DeviceType = 'Desktop'|'Laptop'|'Phone'|'Tablet';
export type TransferMeta = { id:string; name:string; type:DeviceType; browser:string; timestamp:number; fileName:string; mime:string; size:number; totalChunks:number; streams:number; chunkSize:number; hash:string };
export type Frame = { v:1; t:string; s:number; f:number; n:number; i:number; d:string; c:number; p:string };
const enc = new TextEncoder(); const dec = new TextDecoder();
export function uid(){ return crypto.randomUUID().replaceAll('-','').slice(0,16); }
export async function sha256(data: ArrayBuffer | Uint8Array){ const b=await crypto.subtle.digest('SHA-256',data as unknown as BufferSource); return [...new Uint8Array(b)].map(x=>x.toString(16).padStart(2,'0')).join(''); }
export function crc32(input:string){ let crc=0xffffffff; for(const ch of enc.encode(input)){ crc^=ch; for(let k=0;k<8;k++) crc=(crc>>>1)^((crc&1)?0xedb88320:0); } return (crc^0xffffffff)>>>0; }
function b64(bytes:Uint8Array){ let s=''; for(let i=0;i<bytes.length;i+=0x8000)s+=String.fromCharCode(...bytes.subarray(i,i+0x8000)); return btoa(s); }
function from64(s:string){ const raw=atob(s); return Uint8Array.from(raw,c=>c.charCodeAt(0)); }
export function frameText(f:Frame){ return JSON.stringify(f); }
export function parseFrame(text:string): Frame|null { try { const f=JSON.parse(text) as Frame; return f?.v===1&&typeof f.t==='string'&&typeof f.d==='string'&&f.c===crc32(f.d)?f:null; } catch { return null; } }
export async function makeTransfer(file:File, streams:number, chunkSize=900, name:string, type:DeviceType){
  const bytes=new Uint8Array(await file.arrayBuffer()); const hash=await sha256(bytes); const id=uid(); const chunks:string[]=[];
  for(let i=0;i<bytes.length;i+=chunkSize) chunks.push(b64(bytes.subarray(i,i+chunkSize)));
  if(!chunks.length) chunks.push('');
  const meta:TransferMeta={id,name,type,browser:navigator.userAgent,timestamp:Date.now(),fileName:file.name,mime:file.type||'application/octet-stream',size:file.size,totalChunks:chunks.length,streams,chunkSize,hash};
  const frames:Frame[]=[{v:1,t:id,s:0,f:0,n:chunks.length,i:-1,d:btoa(JSON.stringify(meta)),c:0,p:'meta'}]; frames[0].c=crc32(frames[0].d);
  chunks.forEach((d,i)=>{ const stream=i%streams; const f:Frame={v:1,t:id,s:stream,f:i,n:chunks.length,i,d,c:crc32(d),p:'data'}; frames.push(f); });
  return {meta,frames};
}
export function reconstruct(meta:TransferMeta, frames:Map<number,Frame>){ const out=new Uint8Array(meta.size); let offset=0; for(let i=0;i<meta.totalChunks;i++){ const f=frames.get(i); if(!f) throw new Error(`Missing chunk ${i+1}`); const bytes=from64(f.d); out.set(bytes,offset); offset+=bytes.length; } return out.buffer; }
export { b64, from64 };
