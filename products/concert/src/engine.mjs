import {NODES} from './story.mjs';
export const BUILD='concert-encore-v05';
export const SAVE='perspectives-concert-encore-v05';
export const LEGACY_SAVE='perspectives-concert-v2-en';
export function initialPrep(){return {node:'hub',first:null,events:[],used:[],visits:[],seen:[],facts:{},sources:{},relay:false,contextRelayed:false,privateRelayed:false,promise:false,repaired:false,ackRelayed:false,current:null,returns:{},unlocked:['N0','L0','B0'],deliveries:[],history:{nora:[],lia:[],bruno:[]}};}
function available(s,c){return !s.used.includes(c[0])&&(!c[5]||(c[5]==='promise'?s.promise:c[5]==='contradiction'?(s.facts.date&&s.facts.phrase):!!s.facts[c[5]]));}
export function options(s){
 const def=NODES[s.node];if(!def)return [];
 let choices=def.choices.filter(c=>available(s,c));
 if(s.node==='N3')choices=choices.filter(c=>!(c[0]==='relay_context'&&s.contextRelayed)&&!(c[0]==='relay_private'&&s.privateRelayed)&&!(c[0]==='relay'&&s.relay));
 if(def.who==='nora'&&s.facts.acknowledgement&&!s.ackRelayed&&s.visits.includes('nora')&&s.node!=='C2')choices.unshift(['relay_ack','Lia admits she kept the decision from you. I want you to hear what she said.','I need to hear that from her. But don’t turn it into a reason I owe her the last song.','C2',['ackRelayed']]);
 // On a return, keep unexplored root topics reachable without replaying the opening monologue.
 if(s.returns[def.who]){
  const root={nora:'N0',lia:'L0',bruno:'B0'}[def.who];
  const roots=NODES[root].choices.filter(c=>available(s,c)&&!choices.some(x=>x[0]===c[0]));
  if(choices.length<3&&!['N2','N2a','N2b','LC','C1','C2'].includes(s.node))choices=[...choices.slice(0,2),...roots,...choices.slice(2)];
 }
 return choices.slice(0,3);
}
export function entryNode(s,who){
 if(who==='nora'&&(s.promise||(s.facts.permission&&!s.contextRelayed)||(s.facts.private&&!s.privateRelayed)||(s.facts.offer&&!s.relay)))return 'N3';
 if(who==='lia'&&s.contextRelayed&&!s.seen.includes('context'))return 'LC';
 const root={nora:'N0',lia:'L0',bruno:'B0'}[who];if(!root)return null;return NODES[root].choices.some(c=>available(s,c))?root:s.unlocked.find(k=>NODES[k]?.who===who&&NODES[k].choices.some(c=>available(s,c)))||root;
}
export function returnLine(s,who){
 if(who==='nora')return s.promise?'Have you spoken to her about what you promised me?':s.relay?'What is she actually offering?':s.facts.love?'You know why this is hard. That doesn’t make the decision yours.':'Have you found a way for the encore not to promise I’ll be back?';
 if(who==='lia')return s.contextRelayed&&!s.seen.includes('context')?NODES.LC.line:s.relay?'You said she’d consider the encore. What would I have to say?':s.facts.acknowledgement?'I know what I need to own. We still have to decide what happens out there.':'What have you heard? I still need to decide what I can stand behind.';
 return 'Still holding. Both vocal microphones, Lia’s only, or house lights?';
}
const relayText={offer:'Nora would consider the encore if you acknowledge the decision before singing, credit her and make no promise about another tour. She has not agreed yet.',private:'Nora would consider the encore if you tell her before going on that she isn’t on the next tour, keep physical space onstage, and agree tomorrow’s statement together. She has not agreed yet.',context:'Nora says she still believed in the music. She knows she hurt you at rehearsals. That was not her asking you to end the project.'};
export function reducePrep(before,action){
 const s=structuredClone(before);s.current=null;
 if(action==='repair_review'){if(!s.promise)throw Error('No promise to repair');s.promise=false;s.repaired=true;s.events.push(action);s.history.nora.push({role:'player',text:'I promised something I couldn’t guarantee. That was mine, not Lia’s. I withdraw it.'},{role:'nora',text:'Then I need this offer to come from her, without anything hidden inside it.'});return s;}
 if(action==='leave'){s.node='hub';return s;}
 if(action==='brief'){if(!s.used.length)throw Error('Need context');s.node='brief';return s;}
 if(action.startsWith('visit:')){
  const who=action.split(':')[1];if(!['nora','lia','bruno'].includes(who))throw Error('Unknown character');if(!s.first&&who==='bruno')throw Error('Choose an artist first');if(!s.first)s.first=who;
  const returning=s.visits.includes(who);s.node=entryNode(s,who);s.returns[who]=returning;
  s.current={who,line:returning?returnLine(s,who):NODES[s.node].line,player:null};
  if(who==='lia'&&s.contextRelayed&&!s.seen.includes('context')){s.current.line=NODES.LC.line;s.seen.push('context');}
  if(who==='lia'&&s.relay&&!s.seen.includes('relay'))s.seen.push('relay');
  if(who==='nora'&&s.promise&&!s.seen.includes('promise'))s.seen.push('promise');
  if(who==='bruno'&&s.first==='lia'&&!s.seen.includes('microphone'))s.seen.push('microphone');
  if(!returning)s.visits.push(who);s.history[who].push({role:who,text:s.current.line,entry:true});s.events.push(action);return s;
 }
 const choice=options(s).find(c=>c[0]===action);if(!choice)throw Error('Unavailable choice: '+action);
 const who=NODES[s.node].who;s.history[who].push({role:'player',text:choice[1]},{role:who,text:choice[2]});s.current={who,line:choice[2],player:choice[1],cue:choice[6]||null};s.used.push(action);s.events.push(action);
 for(const fact of choice[4]){
  if(fact.startsWith('deliver_')){
   const type=fact.slice(8);s.deliveries.push({to:'lia',kind:type,text:relayText[type],status:'delivered'});
   if(type==='context')s.contextRelayed=true;else {s.relay=true;if(type==='private')s.privateRelayed=true;}
  }else if(fact==='promise')s.promise=true;else if(fact==='repair'){s.promise=false;s.repaired=true;}else if(fact==='ackRelayed')s.ackRelayed=true;else{s.facts[fact]=true;s.sources[fact]=who;}
 }
 s.node=choice[3];if(NODES[s.node]&&!s.unlocked.includes(s.node))s.unlocked.push(s.node);if(NODES[s.node]?.who===who&&NODES[s.node].line!==choice[2]){s.current.continuation=NODES[s.node].line;s.history[who].at(-1).text+='\n'+s.current.continuation;}
 if(s.node==='N2b'){s.facts.rehearsal_account=true;s.sources.rehearsal_account='nora';}
 if(s.node==='C1'){const words='You reserved the dates without Nora before telling her you’d talk about her coming. What was she supposed to understand?';s.history.lia.push({role:'player',text:words},{role:'lia',text:NODES.C1.line});s.current={who:'lia',player:words,line:NODES.C1.line};}
 return s;
}
export function replayPrep(events){if(!Array.isArray(events)||events.length>100)throw Error('Invalid preparation');let s=initialPrep();for(const e of events)s=reducePrep(s,e);return s;}
export function liaContext(s){return {conversationWithPlayer:s.history.lia,deliveredMessages:s.deliveries.filter(d=>d.to==='lia'&&d.status==='delivered').map(d=>d.text),relayedProfessionalOffer:s.relay,relayedProfessionalContext:s.contextRelayed,ownHistory:'You front the band. Nora co-writes and sings many songs, a central creative member. Three days ago you asked Bruno to reserve next-tour dates without Nora. Two days ago you told her you would discuss her participation after the concert. Today the booking confirmation arrived. You read her harsh rehearsals and distance as no longer wanting the project. You have been seeing Eva. You do not know Nora’s current feelings. The main set is complete; the crowd calls for the customary shared encore song.'};}
export function initialNegotiation(prep=initialPrep()){return {proposal:null,version:0,terms:{},encore:false,accepted:null,turns:0,threat:false,threatRepaired:false,privacyBreach:false,knowsLove:!!prep.facts.love,withdrawnProposal:null,willingness:'withhold',mood:'guarded',history:[],audit:[]};}
export function negotiationOpening(s){return s.contextRelayed?'She still wanted the music. I made a whole plan out of thinking she didn’t. That doesn’t make the tour disappear. What do you want me to tell her now?':s.relay?'You said she’d consider doing the encore, without being promised the next tour. I heard you. I don’t know what I can say to her that makes tonight feel honest.':'They’re calling for us. I can go back with the band without her. I don’t know how to sing it with her knowing she won’t be coming on the next tour. Tell me what you’re asking.';}
const ALLOWED_TERMS=['departure','credit','privacy','noContinuity','statement','soloAcknowledged','stageSpace'];
export function requiredTerms(type){return type==='solo'?['soloAcknowledged','credit','privacy']:type==='public'?['departure','credit','privacy','noContinuity']:type==='private'?['departure','credit','privacy','noContinuity','statement']:[];}
export function missingTerms(n){return n.proposal?requiredTerms(n.proposal).filter(t=>!n.terms[t]):['proposal'];}
export function applyInterpretation(before,raw,message){
 const n=structuredClone(before); const rejected=[];
 if(raw.requiresClarification){n.accepted=null;if(before.accepted===before.version)n.version++;}
 for(const term of raw.withdrawnTerms||[])if(ALLOWED_TERMS.includes(term)){delete n.terms[term];n.accepted=null;if(n.version===before.version)n.version++;}
 const normalized=x=>x.normalize('NFKC').toLocaleLowerCase().replace(/[’‘]/g,"'").replace(/[“”]/g,'"').replace(/\bni\b/g,'no').replace(/\s+/g,' ').trim();
 const quoteIn=(q,text)=>typeof q==='string'&&normalized(q).length>0&&normalized(text).includes(normalized(q));
 const quoteOK=q=>quoteIn(q,message);
 const termQuoteOK=q=>[message,...before.history.filter(m=>m.role==='user').map(m=>m.content)].some(text=>quoteIn(q,text));
 const acts=(raw.acts||[]).filter(a=>quoteOK(a.evidence));
 const closed=acts.some(a=>a.kind==='close');
 const actorWithheld=['withhold','withdraw'].includes(raw.willingness);
 const unchangedClose=closed&&!raw.requiresClarification&&!raw.withdrawnTerms?.length&&!actorWithheld&&!raw.proposal&&['agree','continue'].includes(raw.willingness);
 const continuing=raw.willingness==='continue'&&!raw.requiresClarification&&!raw.withdrawnTerms?.length;
 // Grounded terms are not an actor's continuing consent. Revoke the version as well
 // so a later new yes can never reuse Nora's confirmation from before the withdrawal.
 if(before.accepted===before.version&&(actorWithheld||(raw.accepted!==true&&!unchangedClose&&!continuing))){n.accepted=null;if(n.version===before.version)n.version++;}

 for(const a of acts){
  if(a.kind==='threat'){n.threat=true;n.accepted=null;if(before.accepted===before.version&&n.version===before.version)n.version++;n.mood='firm';}
  if(a.kind==='withdraw_threat'){n.threat=false;n.threatRepaired=true;}
  if(a.kind==='private_disclosure'&&n.knowsLove)n.privacyBreach=true;
 }
 const proposal=['solo','public','private'].includes(raw.proposal)?raw.proposal:null;
 if(proposal && (!quoteOK(raw.proposalEvidence)||closed))rejected.push('unsupported_proposal');
 else if(proposal && (proposal!==n.proposal)){
  if(n.version===before.version)n.version++; n.proposal=proposal;n.accepted=null;n.encore=false;
  // Different packages are different commitments; the model must ground the new terms.
  n.terms={};
 }
 for(const t of raw.terms||[]){
  if(ALLOWED_TERMS.includes(t.term)&&termQuoteOK(t.evidence)&&!closed){if(!n.terms[t.term]&&before.accepted===before.version&&n.version===before.version){n.version++;n.accepted=null;}n.terms[t.term]=t.evidence;}
  else rejected.push('ungrounded_term:'+t.term);
 }
 if(raw.willingness==='withdraw'||(before.accepted===before.version&&raw.accepted===false&&!raw.willingness&&!closed))n.withdrawnProposal=n.proposal;
 n.willingness=raw.willingness||(raw.accepted?'agree':'withhold');
 const canAccept=n.proposal && !missingTerms(n).length && !n.threat && !closed && !actorWithheld;
 if(raw.accepted===true&&!closed){
  if(canAccept){n.accepted=n.version;n.withdrawnProposal=null;}
  else rejected.push('invalid_acceptance');
 }
 // Expression follows the current interaction. It never grants consent.
 if(n.threat)n.mood='firm';
 else if(acts.some(a=>a.kind==='private_disclosure'))n.mood='hurt';
 else n.mood=['guarded','receptive','hurt','firm'].includes(raw.mood)?raw.mood:'guarded';
 n.turns++;
 n.history.push({role:'user',content:message},{role:'assistant',content:raw.dialogue});
 n.audit.push({turn:n.turns,proposal:n.proposal,version:n.version,accepted:n.accepted,rejected,willingness:raw.willingness||null,acts:acts.map(a=>a.kind)});
 return {n,rejected,closed};
}
export function noraCanAccept(prep,n,admitted=false){
 if(n.willingness==='withdraw'||n.accepted!==n.version||!n.proposal||n.threat)return {ok:false,reason:'lia'};
 if(n.proposal==='solo')return {ok:true,reason:'not_required'};
 if(n.privacyBreach)return {ok:false,reason:admitted?'refused':'breach'};
 if(prep.promise)return {ok:false,reason:'promise'};
 if(n.proposal==='private'&&!n.terms.stageSpace)return {ok:false,reason:'stageSpace'};
 return {ok:true,reason:'consent_required'};
}
export function canExecute(prep,n,confirmedVersion,admitted=false){const check=noraCanAccept(prep,n,admitted);return check.ok&&(check.reason==='not_required'||confirmedVersion===n.version);}
