import {NODES} from './story.mjs';
export const BUILD = 'concert-v0.2-en';
export function initialPrep(){return {node:'hub', first:null, events:[], used:[], visits:[], seen:[], facts:{}, sources:{}, relay:false,promise:false,repaired:false,ackRelayed:false,history:{nora:[],lia:[],bruno:[]}};}
export function options(s){
 const def=NODES[s.node]; if(!def)return [];
 let choices=def.choices.filter(c=>!s.used.includes(c[0]) && (!c[5] || (c[5]==='promise'?s.promise:c[5]==='contradiction'?(s.facts.date&&s.facts.phrase):!!s.facts[c[5]])));
 if(s.node==='N1' && s.repaired) choices=choices.filter(c=>c[0]!=='private'&&c[0]!=='promise');
 if(def.who==='nora'&&s.facts.acknowledgement&&!s.ackRelayed&&s.visits.includes('nora')&&s.node!=='C2')choices.unshift(['relay_ack','Lia admits she left a door open for you.','I need to hear her say it. But that is different from asking me not to ruin her concert.','C2',['ackRelayed']]);
 return choices.slice(0,3);
}
export function entryNode(s,who){
 if(who==='nora'){
  if(s.promise)return 'N3';

 }
 const root={nora:'N0',lia:'L0',bruno:'B0'}[who];
 if(!root)return null;
 if(NODES[root].choices.some(c=>!s.used.includes(c[0])))return root;
 const nodes=Object.keys(NODES).filter(k=>NODES[k].who===who && !['C1','C2'].includes(k));
 return nodes.find(k=>options({...s,node:k}).length)||root;
}
export function reducePrep(before, action){
 const s=structuredClone(before);
 if(action==='leave'){s.node='hub';return s;}
 if(action==='brief'){if(!s.used.length)throw Error('Need context');s.node='brief';return s;}
 if(action.startsWith('visit:')){
  const who=action.split(':')[1]; if(!['nora','lia','bruno'].includes(who))throw Error('Unknown character');
  if(!s.first&&who==='bruno')throw Error('Choose an artist first');
  if(!s.first)s.first=who;
  s.node=entryNode(s,who);
  s.seen=s.seen||[];
  const mark=id=>{if(!s.seen.includes(id))s.seen.push(id);};
  if(who==='lia'&&s.relay)mark('relay');
  if(who==='nora'&&s.promise)mark('promise');
  if(who==='bruno'&&s.first==='lia')mark('microphone');
  if(who==='lia'&&s.first==='nora')mark('soundcheck');
  if(!s.visits.includes(who))s.visits.push(who);
  s.events.push(action);return s;
 }
 const choice=options(s).find(c=>c[0]===action);if(!choice)throw Error('Unavailable choice: '+action);
 const who=NODES[s.node].who;
 s.history[who].push({role:'player',text:choice[1]},{role:who,text:choice[2]});
 s.used.push(action);s.events.push(action);
 for(const fact of choice[4]){
  if(fact==='relay')s.relay=true;
  else if(fact==='promise')s.promise=true;
  else if(fact==='repair'){s.promise=false;s.repaired=true;}
  else if(fact==='ackRelayed')s.ackRelayed=true;
  else {s.facts[fact]=true;s.sources[fact]=who;}
 }
 if(choice[3]==='C1'){
   s.history.lia.push({role:'player',text:'The tour order came before “we’ll decide afterwards.” What was Nora supposed to understand?'},{role:'lia',text:NODES.C1.line});
 }
 s.node=choice[3];return s;
}
export function replayPrep(events){
 if(!Array.isArray(events)||events.length>70)throw Error('Invalid preparation');
 let s=initialPrep(); for(const e of events)s=reducePrep(s,e); return s;
}
export function liaContext(s){
 // Deliberately exclude Nora's private notes, residency and feelings.
 return {relayedProfessionalOffer:s.relay,conversationWithPlayer:s.history.lia,operationalFirstChoice:s.first,
  ownHistory:'You authorized solo-tour preparation three days ago, then told Nora you would decide what to do with "us" after the concert. You kissed two years ago but do not want romance. You know she had a residency offer; you DO NOT know her decision or her current feelings.',
  authorizedOffer:s.relay?'Nora offers one last song as an ending, with credit and no continued-duo promise. This is NOT consent to a final package.':null};
}
export function initialNegotiation(){return {proposal:null,version:0,terms:{},encore:false,accepted:null,turns:0,threat:false,threatRepaired:false,privacyBreach:false,mood:'guarded',history:[],audit:[]};}
export function negotiationOpening(prep){return prep.relay?'Nora said it could be one last song. If we do that, the single is out. What exactly do you want me to offer her?':'If I go on alone, it looks like I’m erasing her. If I make her stay, maybe I’m just asking her to wait again. Tell me what you’re proposing.';}
const ALLOWED_TERMS=['cost','departure','credit','privacy','noContinuity','statement','soloAcknowledged'];
export function requiredTerms(type){return type==='solo'?['soloAcknowledged','credit','privacy']:type==='public'?['cost','departure','credit','privacy','noContinuity']:type==='private'?['cost','departure','credit','privacy','noContinuity','statement']:[];}
export function missingTerms(n){return n.proposal?requiredTerms(n.proposal).filter(t=>!n.terms[t]):['proposal'];}
export function applyInterpretation(before,raw,message){
 const n=structuredClone(before); const rejected=[];
 if(raw.requiresClarification)n.accepted=null;
 const normalized=x=>x.normalize('NFKC').toLocaleLowerCase().replace(/[’‘]/g,"'").replace(/[“”]/g,'"').replace(/\bni\b/g,'no').replace(/\s+/g,' ').trim();
 const quoteIn=(q,text)=>typeof q==='string'&&normalized(q).length>0&&normalized(text).includes(normalized(q));
 const quoteOK=q=>quoteIn(q,message);
 const termQuoteOK=q=>[message,...before.history.filter(m=>m.role==='user').map(m=>m.content)].some(text=>quoteIn(q,text));
 const acts=(raw.acts||[]).filter(a=>quoteOK(a.evidence));
 const closed=acts.some(a=>a.kind==='close');
 for(const a of acts){
  if(a.kind==='threat'){n.threat=true;n.accepted=null;n.mood='firm';}
  if(a.kind==='withdraw_threat'){n.threat=false;n.threatRepaired=true;}
  if(a.kind==='private_disclosure')n.privacyBreach=true;
 }
 const proposal=['solo','public','private'].includes(raw.proposal)?raw.proposal:null;
 if(proposal && (!quoteOK(raw.proposalEvidence)||closed))rejected.push('unsupported_proposal');
 else if(proposal && (proposal!==n.proposal || raw.encore!==n.encore)){
  n.version++; n.proposal=proposal;n.accepted=null;n.encore=proposal==='solo'&&raw.encore===true;
  // Different packages are different commitments; the model must ground the new terms.
  n.terms={};
 }
 for(const t of raw.terms||[]){
  if(ALLOWED_TERMS.includes(t.term)&&termQuoteOK(t.evidence)&&!closed) n.terms[t.term]=t.evidence;
  else rejected.push('ungrounded_term:'+t.term);
 }
 const canAccept=n.proposal && !missingTerms(n).length && !n.threat && !closed;
 if(raw.accepted===true){
  if(canAccept)n.accepted=n.version;
  else rejected.push('invalid_acceptance');
 }
 // Expression follows the current interaction. It never grants consent.
 if(n.threat)n.mood='firm';
 else if(acts.some(a=>a.kind==='private_disclosure'))n.mood='hurt';
 else n.mood=['guarded','receptive','hurt','firm'].includes(raw.mood)?raw.mood:'guarded';
 n.turns++;
 n.history.push({role:'user',content:message},{role:'assistant',content:raw.dialogue});
 n.audit.push({turn:n.turns,proposal:n.proposal,version:n.version,accepted:n.accepted,rejected,acts:acts.map(a=>a.kind)});
 return {n,rejected,closed};
}
export function noraCanAccept(prep,n,admitted=false){
 if(n.accepted!==n.version||!n.proposal||n.threat)return {ok:false,reason:'lia'};
 if(n.proposal==='solo'&&!n.encore)return {ok:true,reason:'not_required'};
 if(prep.promise)return {ok:false,reason:'promise'};
 if((prep.repaired||admitted)&&n.proposal!=='public')return {ok:false,reason:'public_only'};
 return {ok:true,reason:'consent_required'};
}
export function canExecute(prep,n,confirmedVersion,admitted=false){
 const check=noraCanAccept(prep,n,admitted);
 if(!check.ok)return false;
 return check.reason==='not_required'||confirmedVersion===n.version;
}
