import test from 'node:test';import assert from 'node:assert/strict';import {createSpeechRecorder,recordingMime,appendTranscript,MAX_BYTES} from '../src/speech-recording.mjs';
const settle=()=>new Promise(r=>setTimeout(r,0));
function fixture({permission,fetcher,silent=false,throwRecorder=false,blobSize=84,timeoutMs=20,startupTimeoutMs=20,resume,staySuspended=false,amplitude=()=>silent?0:.1}={}){
 let now=0,calls=0,uploads=0,stops=0,resumes=0,closed=0;const order=[];const muted=[],states=[],texts=[],track={stop(){stops++;},onended:null};const stream={getTracks:()=>[track]};
 class Recorder{static isTypeSupported=t=>t.startsWith('audio/webm');constructor(_,opts){if(throwRecorder)throw Error('failed');this.mimeType=opts.mimeType;this.state='inactive';}start(){this.state='recording';}stop(){this.state='inactive';queueMicrotask(()=>{this.ondataavailable?.({data:new Blob([new Uint8Array([0x1a,0x45,0xdf,0xa3,...Array(blobSize-4).fill(1)])])});this.onstop?.();});}}
 class Audio{state='suspended';resume(){resumes++;order.push('resume');if(!staySuspended)this.state='running';return resume?resume():Promise.resolve();}async close(){closed++;this.state='closed';}createAnalyser(){return{fftSize:1024,getFloatTimeDomainData(values){values.fill(amplitude());}};}createMediaStreamSource(){return{connect(){}};}}
 const api=createSpeechRecorder({Recorder,Audio,mediaDevices:{getUserMedia(){calls++;order.push('permission');return permission?permission:Promise.resolve(stream);}},fetcher:async(...args)=>{uploads++;return fetcher?fetcher(...args):{ok:true,json:async()=>({text:'Recognized words.'})};},notify:s=>states.push(s),onTranscript:t=>texts.push(t),setCaptureMuted:v=>muted.push(v),getToken:()=> 'fixture-token',clock:()=>now,timeoutMs,startupTimeoutMs});
 return{api,states,texts,muted,stream,track,order,resumes:()=>resumes,closed:()=>closed,advance:t=>now=t,calls:()=>calls,uploads:()=>uploads,stops:()=>stops};
}
test('runtime codec selection supports Chrome WebM and Safari MP4; draft appending never truncates',()=>{assert.equal(recordingMime({isTypeSupported:t=>t==='audio/mp4'}),'audio/mp4');assert.equal(recordingMime({isTypeSupported:()=>false}),null);assert.equal(appendTranscript('Typed draft.','Spoken words.'),'Typed draft.\nSpoken words.');assert.equal(appendTranscript('x'.repeat(1395),'too long'),null);});
test('explicit start/stop mutes capture only, emits transcript once and releases mic',async()=>{const f=fixture();assert.equal(f.calls(),0);await f.api.start();await f.api.start();assert.equal(f.calls(),1);assert.equal(f.api.status(),'recording');f.advance(1000);f.api.stop();f.api.stop();await settle();await settle();assert.equal(f.uploads(),1);assert.deepEqual(f.texts,['Recognized words.']);assert.equal(f.stops(),1);assert(f.muted.includes(true));assert.equal(f.muted.at(-1),false);});
test('late microphone permission after cancel is stopped without upload or text',async()=>{let resolve;const f=fixture({permission:new Promise(r=>resolve=r)});const start=f.api.start();f.api.cancel();resolve(f.stream);await start;assert.equal(f.stops(),1);assert.equal(f.uploads(),0);assert.equal(f.api.status(),'idle');});
test('cancel and external track interruption never upload; late transcription never appears',async()=>{const capture=fixture();await capture.api.start();capture.api.cancel();await settle();assert.equal(capture.uploads(),0);assert.equal(capture.stops(),1);
 const interrupted=fixture();await interrupted.api.start();interrupted.track.onended();await settle();assert.equal(interrupted.uploads(),0);assert.equal(interrupted.api.status(),'error');
 let resolve;const late=fixture({fetcher:()=>new Promise(r=>resolve=r)});await late.api.start();late.advance(1000);late.api.stop();await settle();late.api.cancel();resolve({ok:true,json:async()=>({text:'stale'})});await settle();assert.deepEqual(late.texts,[]);assert.equal(late.api.status(),'idle');
});
test('denied, silent, recorder failure, empty transcript and timeout retain text fallback and release capture',async()=>{
 const denied=fixture({permission:Promise.reject(Object.assign(Error('denied'),{name:'NotAllowedError'}))});await denied.api.start();assert.match(denied.states.at(-1).error,/denied/);assert.equal(denied.uploads(),0);
 for(const config of [{silent:true},{throwRecorder:true},{fetcher:async()=>({ok:true,json:async()=>({text:''})})},{fetcher:()=>new Promise(()=>{})}]){const f=fixture(config);await f.api.start();f.advance(1000);f.api.stop();await new Promise(r=>setTimeout(r,30));assert.equal(f.api.status(),'error');assert.deepEqual(f.texts,[]);assert.equal(f.muted.at(-1),false);assert.equal(f.stops(),1);}
});
test('45-second cap stops once automatically',async()=>{const f=fixture();await f.api.start();f.advance(45000);await new Promise(r=>setTimeout(r,130));assert.equal(f.uploads(),1);assert.equal(f.stops(),1);assert.equal(f.api.status(),'ready');});

test('oversized encoded clip is rejected before upload',async()=>{const f=fixture({blobSize:MAX_BYTES+1});await f.api.start();f.advance(1000);f.api.stop();await settle();assert.equal(f.uploads(),0);assert.equal(f.api.status(),'error');assert.match(f.states.at(-1).error,/too large/);});

test('audio resume is invoked in the same start gesture before delayed microphone permission',async()=>{
 let allow;const f=fixture({permission:new Promise(r=>allow=r)}),started=f.api.start();
 assert.deepEqual(f.order,['resume','permission']);assert.equal(f.api.status(),'permission');assert(!f.muted.includes(true));
 allow(f.stream);await started;assert.equal(f.api.status(),'recording');f.advance(1000);f.api.stop();await settle();await settle();assert.equal(f.uploads(),1);assert.equal(f.stops(),1);
});
test('pending audio resume is bounded, stops acquired microphone, and cannot complete late',async()=>{
 let resume;const f=fixture({resume:()=>new Promise(r=>resume=r)});await f.api.start();assert.equal(f.api.status(),'error');assert.match(f.states.at(-1).error,/setup took too long/);assert.equal(f.stops(),1);assert.equal(f.closed(),1);assert(!f.muted.includes(true));assert.equal(f.uploads(),0);resume();await settle();assert.equal(f.api.status(),'error');assert.deepEqual(f.texts,[]);
});
test('rejected resume fails immediately while late permission is released without an unhandled rejection',async()=>{
 let allow;const f=fixture({resume:()=>Promise.reject(Error('blocked')),permission:new Promise(r=>allow=r)});await f.api.start();assert.equal(f.api.status(),'error');assert.match(f.states.at(-1).error,/capture could not start/);assert.equal(f.closed(),1);assert.equal(f.stops(),0);allow(f.stream);await settle();assert.equal(f.stops(),1);assert.equal(f.uploads(),0);assert(!f.muted.includes(true));
});
test('permission timeout and a still-suspended meter fail safely; late grant is released',async()=>{
 let allow;const delayed=fixture({permission:new Promise(r=>allow=r)});await delayed.api.start();assert.equal(delayed.api.status(),'error');allow(delayed.stream);await settle();assert.equal(delayed.stops(),1);assert.equal(delayed.closed(),1);
 const suspended=fixture({staySuspended:true});await suspended.api.start();assert.equal(suspended.api.status(),'error');assert.equal(suspended.stops(),1);assert.equal(suspended.closed(),1);assert.equal(suspended.uploads(),0);
});

test('transient microphone level follows measured amplitude and clears outside capture',async()=>{
 let amplitude=0;const f=fixture({amplitude:()=>amplitude});await f.api.start();assert.equal(f.states.at(-1).level,0);
 amplitude=.05;await new Promise(r=>setTimeout(r,120));assert(Math.abs(f.states.at(-1).level-.4)<.001);
 amplitude=.25;await new Promise(r=>setTimeout(r,120));assert.equal(f.states.at(-1).level,1);
 amplitude=0;await new Promise(r=>setTimeout(r,120));assert.equal(f.states.at(-1).level,0);f.api.cancel();assert.equal(f.states.at(-1).level,0);assert.equal(f.uploads(),0);
});
