import {createHmac,timingSafeEqual} from 'node:crypto';
import {BUILD} from '../src/engine.mjs';
// Accept the secret name configured by Oriol without needing to reveal or recreate it.
export const key=()=>process.env.OPENAI_API_KEY||process.env.PerspectivesConcert;
const signature=data=>createHmac('sha256',key()).update('concert-v1:'+data).digest('base64url');
export function sign(payload){const data=Buffer.from(JSON.stringify(payload)).toString('base64url');return data+'.'+signature(data);}
export function verify(token){
 if(typeof token!=='string'||token.length>45000)throw Error('session');
 const [data,sig]=token.split('.');const expected=signature(data||'');
 if(!sig||sig.length!==expected.length||!timingSafeEqual(Buffer.from(sig),Buffer.from(expected)))throw Error('session');
 const parsed=JSON.parse(Buffer.from(data,'base64url').toString());if(parsed.expires<Date.now())throw Error('expired');if(parsed.build!==BUILD)throw Error('session');return parsed;
}
