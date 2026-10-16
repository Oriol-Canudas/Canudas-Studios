export const MAX_AUDIO_BYTES=2*1024*1024,MAX_REQUEST_BYTES=2850000,MAX_SECONDS=45;
const TYPES={'audio/webm':'webm','audio/mp4':'mp4'};
export function parseClip(body){
 if(!body||typeof body.audio!=='string'||!body.audio.length||body.audio.length>Math.ceil(MAX_AUDIO_BYTES/3)*4||!/^(?:[A-Za-z0-9+/]{4})*(?:[A-Za-z0-9+/]{2}==|[A-Za-z0-9+/]{3}=)?$/.test(body.audio))throw Error('invalid_audio');
 const mime=String(body.mime||'').split(';')[0].toLowerCase(),extension=TYPES[mime];
 if(!extension||!Number.isFinite(body.seconds)||body.seconds<.25||body.seconds>MAX_SECONDS||typeof body.requestId!=='string'||!/^[a-zA-Z0-9-]{8,80}$/.test(body.requestId))throw Error('invalid_audio');
 const audio=Buffer.from(body.audio,'base64');if(audio.length<32||audio.length>MAX_AUDIO_BYTES)throw Error('invalid_audio');
 const magic=mime==='audio/webm'?audio.subarray(0,4).equals(Buffer.from([0x1a,0x45,0xdf,0xa3])):audio.toString('ascii',4,8)==='ftyp';
 if(!magic)throw Error('invalid_audio');return {audio,mime,extension};
}
export async function transcribeClip(clip,{key,model='gpt-transcribe',fetcher=fetch,timeoutMs=20000}={}){
 const form=new FormData();form.set('model',model);form.set('file',new Blob([clip.audio],{type:clip.mime}),`recording.${clip.extension}`);form.set('response_format','json');
 const controller=new AbortController();let timer;
 try{
  const work=(async()=>{const response=await fetcher('https://api.openai.com/v1/audio/transcriptions',{method:'POST',headers:{Authorization:`Bearer ${key}`},body:form,signal:controller.signal});
  if(!response.ok)throw Error('transcription_failed');const result=await response.json();const text=typeof result.text==='string'?result.text.trim():'';
  if(!text)throw Error('empty_transcript');if(text.length>4000)throw Error('transcript_too_long');return {text};})();
  return await Promise.race([work,new Promise((_,reject)=>timer=setTimeout(()=>{controller.abort();reject(Error('transcription_timeout'));},timeoutMs))]);
 }finally{clearTimeout(timer);controller.abort();}
}
