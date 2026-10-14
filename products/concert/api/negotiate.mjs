import {createHmac,timingSafeEqual,randomUUID} from 'node:crypto';
import {initialNegotiation,replayPrep,negotiationOpening,BUILD} from '../src/engine.mjs';
import {generateTurn} from '../server/lia.mjs';
const sessions=new Map(),rate=new Map();
// Accept the secret name configured by Oriol without needing to reveal or recreate it.
const key=()=>process.env.OPENAI_API_KEY||process.env.PerspectivesConcert;
const signature=data=>createHmac('sha256',key()).update('concert-v1:'+data).digest('base64url');
function sign(payload){const data=Buffer.from(JSON.stringify(payload)).toString('base64url');return data+'.'+signature(data);}
function verify(token){
 if(typeof token!=='string'||token.length>45000)throw Error('session');
 const [data,sig]=token.split('.');const expected=signature(data||'');
 if(!sig||sig.length!==expected.length||!timingSafeEqual(Buffer.from(sig),Buffer.from(expected)))throw Error('session');
 const parsed=JSON.parse(Buffer.from(data,'base64url').toString());if(parsed.expires<Date.now())throw Error('expired');return parsed;
}
export default async function handler(req,res){
 res.setHeader('Cache-Control','no-store');
 if(req.method==='GET')return res.status(200).json({available:Boolean(key()),model:process.env.OPENAI_MODEL||'gpt-4.1',build:BUILD});
 if(req.method!=='POST')return res.status(405).json({error:'method'});
 if(!key())return res.status(503).json({error:'ai_unavailable'});
 const b=req.body||{};
 if(JSON.stringify(b).length>60000)return res.status(413).json({error:'too_large'});
 // No database for this POC. Signed envelopes protect validated state; warm-instance
 // deduplication/rate limiting is an additional best-effort spend guard, not a global quota.
 const ip=String(req.headers['x-forwarded-for']||'local').split(',')[0];
 const bucket=rate.get(ip)||{time:Date.now(),count:0};if(Date.now()-bucket.time>3600000){bucket.time=Date.now();bucket.count=0;}
 if(bucket.count>=90)return res.status(429).json({error:'rate_limit'});
 bucket.count++;rate.set(ip,bucket);if(rate.size>2000)rate.delete(rate.keys().next().value);
 try{
  if(b.action==='start'){
   const prep=replayPrep(b.events);if(!prep.used.length)return res.status(400).json({error:'context_required'});
   const opening=negotiationOpening(prep);
   const payload={id:randomUUID(),expires:Date.now()+7200000,events:prep.events,n:{...initialNegotiation(),history:[{role:'assistant',content:opening}]}};
   return res.status(200).json({token:sign(payload),negotiation:payload.n,opening});
  }
  const payload=verify(b.token);const prep=replayPrep(payload.events);
  if(payload.n.turns>=6)return res.status(409).json({error:'turn_limit'});
  const message=typeof b.message==='string'?b.message.trim():'';
  if(!message||message.length>1400||typeof b.requestId!=='string'||b.requestId.length>80)return res.status(400).json({error:'invalid_request'});
  const id=payload.id+':'+payload.n.turns+':'+b.requestId;
  const fingerprint=createHmac('sha256',key()).update(b.token+message).digest('hex');
  if(sessions.has(id)){
   const previous=sessions.get(id);if(previous.fingerprint!==fingerprint)return res.status(409).json({error:'conflicting_retry'});
   return res.status(200).json(await previous.promise);
  }
  const promise=(async()=>{
   const result=await generateTurn(prep,payload.n,message,{key:key(),model:process.env.OPENAI_MODEL||'gpt-4.1'});
   const next={...payload,n:result.n};
   console.log(JSON.stringify({event:'concert_ai_turn',session:payload.id,turn:next.n.turns,...result.diagnostic}));
   return {token:sign(next),negotiation:result.n,reply:result.reply,closed:result.closed,diagnostic:result.diagnostic};
  })();
  sessions.set(id,{fingerprint,promise});if(sessions.size>300)sessions.delete(sessions.keys().next().value);
  try{return res.status(200).json(await promise);}catch(e){sessions.delete(id);throw e;}
 }catch(e){
  const code=String(e.message||'failure');
  console.error(JSON.stringify({event:'concert_ai_error',code:code.slice(0,100)}));
  const bad=['session','expired','Invalid preparation','Unknown character'].some(x=>code.includes(x));
  return res.status(bad?400:502).json({error:bad?'session_expired':code==='interpretation_rejected'?'interpretation_rejected':'generation_failed',...(e.validation?{validation:e.validation}:{})});
 }
}
