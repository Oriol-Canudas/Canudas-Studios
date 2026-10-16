import {createHash} from 'node:crypto';
import {key,verify} from '../server/session.mjs';
import {MAX_REQUEST_BYTES,parseClip,transcribeClip} from '../server/transcription.mjs';
// Warm-instance spend guards only, matching this prototype's existing bounded backend.
export function createTranscriptionHandler({provider=transcribeClip}={}){
 const requests=new Map(),rate=new Map();
 return async function handler(req,res){
  res.setHeader('Cache-Control','no-store');
  if(req.method!=='POST')return res.status(405).json({error:'method'});
  const origin=req.headers.origin,host=String(req.headers.host||'');
  let sameOrigin=false;try{const u=new URL(origin);sameOrigin=u.host===host&&u.protocol===(String(req.headers['x-forwarded-proto']||'').split(',')[0]||(host.startsWith('localhost:')||host.startsWith('127.0.0.1:')?'http':'https'))+':';}catch{}
  if(!sameOrigin||!host||req.headers['sec-fetch-site']&&req.headers['sec-fetch-site']!=='same-origin')return res.status(403).json({error:'origin'});
  if(!key())return res.status(503).json({error:'ai_unavailable'});
  if(Number(req.headers['content-length'])>MAX_REQUEST_BYTES||JSON.stringify(req.body||{}).length>MAX_REQUEST_BYTES)return res.status(413).json({error:'too_large'});
  if(!String(req.headers['content-type']||'').startsWith('application/json'))return res.status(415).json({error:'content_type'});
  try{
   const payload=verify(req.body?.token);if(payload.n.turns>=6)return res.status(409).json({error:'turn_limit'});
   const clip=parseClip(req.body),id=payload.id+':'+req.body.requestId,fingerprint=createHash('sha256').update(req.body.token).update(clip.audio).update(clip.mime+req.body.seconds).digest('hex');
   if(requests.has(id)){const existing=requests.get(id);if(existing.fingerprint!==fingerprint)return res.status(409).json({error:'conflicting_retry'});return res.status(200).json(await existing.promise);}
   const ip=String(req.headers['x-forwarded-for']||'local').split(',')[0];
   for(const bucketKey of ['session:'+payload.id,'ip:'+ip]){let bucket=rate.get(bucketKey);if(!bucket||Date.now()-bucket.time>3600000)bucket={time:Date.now(),count:0};if(bucket.count>=30)return res.status(429).json({error:'rate_limit'});bucket.count++;rate.set(bucketKey,bucket);}
   while(rate.size>2000)rate.delete(rate.keys().next().value);
   const promise=provider(clip,{key:key(),model:process.env.OPENAI_TRANSCRIBE_MODEL||'gpt-transcribe'});requests.set(id,{fingerprint,promise});if(requests.size>300)requests.delete(requests.keys().next().value);
   try{return res.status(200).json(await promise);}catch(e){requests.delete(id);throw e;}
  }catch(e){const code=String(e.message);const session=['session','expired'].includes(code)||e instanceof SyntaxError;const known=['invalid_audio','empty_transcript','transcript_too_long','transcription_timeout'];return res.status(session?401:code==='invalid_audio'?400:502).json({error:session?'session_expired':known.includes(code)?code:'transcription_failed'});}
 };
}
export default createTranscriptionHandler();
