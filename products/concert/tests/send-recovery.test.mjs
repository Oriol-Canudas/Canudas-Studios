import test from 'node:test';
import assert from 'node:assert/strict';
import {recoverSend} from '../src/send-recovery.mjs';
import {initialPrep,initialNegotiation} from '../src/engine.mjs';
const saved=()=>({prep:initialPrep(),negotiation:initialNegotiation(),token:'original-token',draft:'A newer draft',confirmed:3,admitted:true,sendRequest:{message:'Original',token:'original-token',requestId:'stable-id',retries:1},aiMessages:[{who:'player',text:'Original',requestId:'stable-id',pending:true}]});
test('reload recovers exact request without changing authored state, consent or draft',()=>{
 const before=saved(),after=recoverSend(before);
 for(const key of ['prep','negotiation','token','draft','confirmed','admitted','sendRequest'])assert.deepEqual(after[key],before[key]);
 assert.equal(after.aiMessages[0].pending,false);assert.equal(after.aiMessages[0].unconfirmed,true);
 assert.equal(before.aiMessages[0].pending,true);assert.deepEqual(recoverSend(after),after);
});
test('existing interrupted saves recover their original envelope',()=>{
 const before=saved();delete before.sendRequest;
 assert.deepEqual(recoverSend(before).sendRequest,{message:'Original',token:'original-token',requestId:'stable-id',retries:1});
});
test('idle saves and drafts remain unchanged and missing legacy IDs are not invented',()=>{
 const before=saved();before.aiMessages=[];before.sendRequest=null;assert.deepEqual(recoverSend(before),before);
 before.aiMessages=[{who:'player',text:'Original',pending:true}];assert.equal(recoverSend(before).sendRequest,null);
});
