import test from 'node:test';
import assert from 'node:assert/strict';
import {initialPrep,reducePrep,replayPrep,options,liaContext,initialNegotiation,returnLine} from '../src/engine.mjs';
import {NODES,OPENING,CAST,PROGRAMS} from '../src/story.mjs';
const run=events=>events.reduce(reducePrep,initialPrep());
const love=['visit:nora','sheet','changed','love'];
test('love stops at the confidence; all three player responses explicitly protect it',()=>{
 const s=run(love);assert(s.facts.love);assert(!s.facts.professional);assert(!s.facts.rehearsal_account);assert(!s.facts.permission);assert.equal(s.current.continuation,undefined);assert(!s.current.line.includes('rehearsal'));
 assert.equal(options(s).length,3);assert(options(s).every(c=>/stays here|won’t repeat/.test(c[1])));
 const rehearsal=reducePrep(s,'accountability');assert(rehearsal.facts.rehearsal_account);assert(!rehearsal.facts.professional);assert(!rehearsal.facts.permission);
 const tonight=reducePrep(s,'tonight_nora');assert(!tonight.facts.rehearsal_account);assert(!tonight.facts.professional);assert(!tonight.facts.permission);
});
test('love and professional-only paths deliver equivalent authorized context without leaking confidence',()=>{
 const a=run([...love,'permission']),b=run(['visit:nora','sheet','interpretation','permission']);
 for(const s of [a,b]){assert(s.facts.permission);assert(s.facts.professional);assert(s.facts.rehearsal_account);assert(!s.contextRelayed);assert.deepEqual(liaContext(s).deliveredMessages,[]);}
 assert(!b.facts.love);const da=reducePrep(a,'relay_context'),db=reducePrep(b,'relay_context');assert.deepEqual(da.deliveries,db.deliveries);assert(!/love|Eva/.test(JSON.stringify({conversation:liaContext(da).conversationWithPlayer,delivered:liaContext(da).deliveredMessages})));assert.equal(initialNegotiation(da).accepted,null);assert.equal(initialNegotiation(db).accepted,null);
});
test('every acknowledgment-enabling authored branch explicitly admits hidden tour exclusion',()=>{
 const routes=[['visit:lia','chronology'],['visit:lia','why','hiding'],...['lc_own','lc_excuse','lc_offer'].map(id=>['visit:nora','sheet','interpretation','permission','relay_context','visit:lia',id]),...['own','tonight'].map(id=>['visit:nora','sheet','leave','visit:bruno','date','contrast',id])];
 for(const events of routes){const s=run(events);assert(s.facts.acknowledgement);assert.equal(s.sources.acknowledgement,'lia');const words=s.history.lia.filter(m=>m.role==='lia').map(m=>m.text).join(' ');assert.match(words,/tour.*without (?:her|Nora)/);assert.match(words,/left her thinking|let her think/);assert.equal(initialNegotiation(s).accepted,null);const n=reducePrep(reducePrep(s,'leave'),'visit:nora');assert(options(n).some(c=>c[0]==='relay_ack'));const delivered=reducePrep(n,'relay_ack');assert(delivered.ackRelayed);assert.equal(initialNegotiation(delivered).accepted,null);}
});
test('visible relays carry before-singing acknowledgment, credit and no future guarantee, never a permanent exclusion promise',()=>{
 const routes=[['visit:nora','meaning','terms'],['visit:nora','meaning','private'],['visit:nora','meaning','terms','hear','visit:lia','cost','without']];
 for(const [i,events] of routes.entries()){const s=run(events),id=['relay','relay_private','relay_lia'][i],c=options(s).find(c=>c[0]===id);assert(c);assert.match(c[1],/tour (?:before singing|first)/);assert.match(c[1],/credit/);assert.match(c[1],/make no promise about another tour/);assert.doesNotMatch(c[1],/promise no (?:future|other) tour/);const d=reducePrep(s,id).deliveries.at(-1).text;assert.match(d,/before singing|before going on/);assert.match(d,/credit/);assert.match(d,/make no promise (?:of|about) another tour/);assert.match(d,/not agreed yet/);}
 assert.match(OPENING[2].text,/new tour goes ahead without Nora/);assert.equal(Object.keys(PROGRAMS).length,3);assert.match(CAST.nora.role,/core member/);
});
test('offer receipt and return menus fit whether Lia has actually been reached; listen uses known terms',()=>{
 let s=run(['visit:nora','meaning','terms','relay','visit:nora']);assert.match(s.current.line,/Have you reached her yet/);assert.doesNotMatch(s.current.line,/actually offering/);s=reducePrep(reducePrep(s,'leave'),'visit:lia');assert.match(s.current.line,/I heard her offer/);assert.match(s.current.line,/Neither have I/);s=reducePrep(reducePrep(s,'cost'),'without');const c=options(s).find(c=>c[0]==='listen');assert.match(c[1],/conditions are already clear/);s=reducePrep(reducePrep(s,'listen'),'visit:nora');assert.match(s.current.line,/You’ve spoken to her/);
 const first=run(['visit:lia','cost','without']);assert.match(options(first).find(c=>c[0]==='listen')[1],/I’ll ask what she needs/);
});
test('chronology selected words are the actual intervention and belong only to Lia conversation',()=>{
 const before=run(['visit:nora','sheet','leave','visit:bruno','date']),selected=options(before).find(c=>c[0]==='contrast');assert(selected);const after=reducePrep(before,'contrast');assert.equal(after.current.who,'lia');assert.equal(after.current.player,selected[1]);assert.deepEqual(after.history.bruno,before.history.bruno);assert.equal(after.history.lia.at(-2).text,selected[1]);assert.equal(after.history.lia.at(-1).text,after.current.line);assert.equal(after.current.continuation,undefined);assert.match(after.current.cue,/go to Lia/);
 const dateOnly=run(['visit:lia','cost','leave','visit:bruno','date']);assert(!options(dateOnly).some(c=>c[0]==='contrast'));
});
test('contextual menu variants never mutate authored NODES or the input preparation',()=>{
 const nodes=structuredClone(NODES);for(const events of [love,['visit:nora','meaning','terms','hear','visit:lia','cost','without']]){const s=run(events),before=structuredClone(s);options(s);options(s);assert.deepEqual(s,before);}assert.deepEqual(NODES,nodes);
});
// Frozen executable baseline witnesses from the pre-amendment audit at 24f2f22.
const legacyWitnesses={"meaning":["visit:nora","meaning"],"sheet":["visit:nora","sheet"],"goodbye":["visit:nora","goodbye"],"why":["visit:lia","why"],"chronology":["visit:lia","chronology"],"cost":["visit:lia","cost"],"terms":["visit:nora","meaning","terms"],"private":["visit:nora","meaning","private"],"promise":["visit:nora","meaning","promise"],"changed":["visit:nora","sheet","changed"],"interpretation":["visit:nora","sheet","interpretation"],"respect":["visit:nora","sheet","respect"],"asked":["visit:lia","why","asked"],"eva_lia":["visit:lia","why","eva_lia"],"hiding":["visit:lia","why","hiding"],"goodbye_lia":["visit:lia","chronology","goodbye_lia"],"without":["visit:lia","chronology","without"],"plan":["visit:lia","chronology","plan"],"relay":["visit:nora","meaning","terms","relay"],"hear":["visit:nora","meaning","terms","hear"],"relay_private":["visit:nora","meaning","private","relay_private"],"repair":["visit:nora","meaning","promise","repair"],"love":["visit:nora","sheet","changed","love"],"enough":["visit:nora","sheet","changed","enough"],"permission":["visit:nora","sheet","interpretation","permission"],"accountability":["visit:nora","sheet","interpretation","accountability"],"tonight_nora":["visit:nora","sheet","interpretation","tonight_nora"],"date":["visit:nora","leave","visit:bruno","date"],"rehearsal":["visit:nora","leave","visit:bruno","rehearsal"],"feasible":["visit:nora","leave","visit:bruno","feasible"],"listen":["visit:lia","chronology","goodbye_lia","listen"],"concrete":["visit:lia","chronology","goodbye_lia","concrete"],"relay_context":["visit:nora","sheet","interpretation","permission","relay_context"],"prepare":["visit:nora","leave","visit:bruno","date","prepare"],"done":["visit:nora","leave","visit:bruno","date","done"],"relay_ack":["visit:lia","chronology","leave","visit:nora","relay_ack"],"contrast":["visit:nora","sheet","leave","visit:bruno","date","contrast"],"include":["visit:lia","chronology","leave","visit:nora","relay_ack","include"],"norescue":["visit:lia","chronology","leave","visit:nora","relay_ack","norescue"],"lc_own":["visit:nora","sheet","interpretation","permission","relay_context","visit:lia","lc_own"],"lc_excuse":["visit:nora","sheet","interpretation","permission","relay_context","visit:lia","lc_excuse"],"lc_offer":["visit:nora","sheet","interpretation","permission","relay_context","visit:lia","lc_offer"],"own":["visit:nora","sheet","leave","visit:bruno","date","contrast","own"],"tonight":["visit:nora","sheet","leave","visit:bruno","date","contrast","tonight"],"relay_lia":["visit:nora","meaning","terms","relay","visit:lia","chronology","goodbye_lia","relay_lia"]};
test('all 45 baseline authored action witnesses remain replayable with their original IDs',()=>{
 assert.equal(Object.keys(legacyWitnesses).length,45);for(const [id,events] of Object.entries(legacyWitnesses)){const s=run(events);assert(s.used.includes(id),id);assert.deepEqual(replayPrep(s.events),s);}
});

test('new context and offer together have one reaction each; staged and later offers never duplicate receipt',()=>{
 const context=['visit:nora','sheet','interpretation','permission','relay_context'];
 const offer=['visit:nora','meaning','terms','relay'];
 const both=run([...context,...offer,'visit:lia']);assert.match(both.current.line,/still wanted the music/);assert.equal(both.current.line.split('I heard her offer').length-1,1);
 let staged=run([...context,'visit:lia','leave',...offer,'visit:lia']);assert.doesNotMatch(staged.current.line,/still wanted the music/);assert.equal(staged.current.line.split('I heard her offer').length-1,1);
 staged=run([...staged.events,'leave','visit:nora','goodbye','private','relay_private','visit:nora']);assert.match(staged.current.line,/Have you reached her yet/);staged=reducePrep(reducePrep(staged,'leave'),'visit:lia');assert.equal(staged.current.line.split('I heard her offer').length-1,1);
});

test('a later love confession still offers privacy responses when rehearsal accountability is already known',()=>{
 const s=run(['visit:nora','sheet','interpretation','leave','visit:nora','meaning','leave','visit:nora','goodbye','leave','visit:nora','changed','love']);assert(s.facts.rehearsal_account);assert(s.facts.professional);assert(s.facts.love);assert.equal(s.current.continuation,undefined);assert(options(s).every(c=>/stays here|won’t repeat/.test(c[1])));const preserved=structuredClone(s.facts);const next=reducePrep(s,'tonight_nora');assert.deepEqual(next.facts,preserved);assert(!next.facts.permission);assert(!next.contextRelayed);
});

test('Lia-first pending acknowledgment cannot displace any immediate privacy response and remains relayable afterward',()=>{
 const s=run(['visit:lia','chronology','leave','visit:nora','sheet','changed','love']);assert(s.facts.acknowledgement);assert(!s.ackRelayed);assert.equal(s.current.continuation,undefined);assert.deepEqual(options(s).map(c=>c[0]),['permission','accountability','tonight_nora']);const before=structuredClone(s);
 for(const action of ['permission','accountability','tonight_nora']){const next=reducePrep(s,action);assert(next.facts.acknowledgement);assert(!next.ackRelayed);assert(options(next).some(c=>c[0]==='relay_ack'),action);assert.equal(initialNegotiation(next).accepted,null);assert(!/love/.test(JSON.stringify(liaContext(next))));const delivered=reducePrep(next,'relay_ack');assert(delivered.ackRelayed);assert.equal(initialNegotiation(delivered).accepted,null);}
 assert.deepEqual(s,before);const practical=reducePrep(s,'tonight_nora');assert.deepEqual(practical.facts,s.facts);assert.deepEqual(practical.deliveries,s.deliveries);
});

test('pre-fix love then acknowledgment event logs replay safely without restoring the immediate UI option',()=>{
 const events=['visit:lia','chronology','leave','visit:nora','sheet','changed','love'];const s=run(events);assert(!options(s).some(c=>c[0]==='relay_ack'));assert(!s.ackRelayed);const old=run([...events,'relay_ack']);assert(old.ackRelayed);assert(old.facts.love);assert(old.facts.acknowledgement);assert.equal(initialNegotiation(old).accepted,null);assert(!old.facts.permission);assert(!old.contextRelayed);assert(!/love/.test(JSON.stringify(liaContext(old))));assert.deepEqual(replayPrep([...events,'relay_ack']),old);
 const absent=run(['visit:nora','sheet','changed','love']);assert.throws(()=>reducePrep(absent,'relay_ack'),/Unavailable/);
 const already=run(['visit:lia','chronology','leave','visit:nora','relay_ack','include','leave','visit:nora','sheet','changed','love']);assert.throws(()=>reducePrep(already,'relay_ack'),/Unavailable/);
 const wrongSource=structuredClone(s);wrongSource.sources.acknowledgement='nora';assert.throws(()=>reducePrep(wrongSource,'relay_ack'),/Unavailable/);
});
