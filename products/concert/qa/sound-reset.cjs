// Actual local audio + bounded browser/API fixtures. No provider requests can escape.
const {chromium}=require(process.env.QA_PLAYWRIGHT||'playwright'),assert=require('node:assert/strict'),fs=require('node:fs');
(async()=>{
 const E=await import('../src/engine.mjs'),{openOptions,editReply}=require('./conversation-controls.cjs');
 const browser=await chromium.launch({headless:true,executablePath:process.env.QA_CHROME||undefined});
 const base=process.env.QA_URL||'http://127.0.0.1:8796',errors=[],checks=[],api=[];
 const read=p=>p.evaluate(k=>JSON.parse(localStorage.getItem(k)),E.SAVE);
 const click=(p,name)=>p.getByRole('button',{name,exact:true}).click();
 const setup=async(size={width:390,height:844},handler)=>{
  const p=await browser.newPage({viewport:size,reducedMotion:'reduce'});p.on('pageerror',e=>errors.push(e.message));
  await p.route('**/api/**',r=>{api.push({method:r.request().method(),path:new URL(r.request().url()).pathname});if(handler)return handler(r);assert.equal(r.request().method(),'GET');return r.fulfill({json:{available:true}});});
  await p.addInitScript(()=>{
   const Native=window.AudioContext;window.soundQA={contexts:[],nodes:[],holdResume:false,holdDecode:false,resumes:[],decodes:[]};
   window.AudioContext=class extends Native{
    constructor(...args){super(...args);this.qaGains=[];soundQA.contexts.push(this);}
    createGain(){const g=super.createGain();this.qaGains.push(g);return g;}
    async resume(){await super.resume();if(soundQA.holdResume)await new Promise(r=>soundQA.resumes.push(r));}
    async decodeAudioData(...args){const b=await super.decodeAudioData(...args);if(soundQA.holdDecode)await new Promise(r=>soundQA.decodes.push(r));return b;}
    createBufferSource(){const n=super.createBufferSource(),start=n.start.bind(n),stop=n.stop.bind(n),q={ctx:this,node:n};soundQA.nodes.push(q);n.start=(...args)=>{q.started=true;q.duration=n.buffer.duration;return start(...args);};n.stop=(when)=>{if(!when||when<=this.currentTime)q.stopped=true;return stop(when);};n.addEventListener('ended',()=>q.ended=true);return n;}
    createMediaStreamSource(stream){if(stream.qaFake)return{connect(meter){meter.getFloatTimeDomainData=x=>x.fill(.1);}};return super.createMediaStreamSource(stream);}
   };
  });
  await p.goto(base);return p;
 };
 const music=async p=>{await p.waitForFunction(()=>soundQA.nodes.some(n=>n.started&&n.duration>59&&!n.stopped&&!n.ended));await p.waitForFunction(()=>soundQA.contexts[0].qaGains[0].gain.value>0);};
 const voice=p=>p.waitForFunction(()=>document.querySelector('[data-intro-voice-state]')?.dataset.introVoiceState==='playing');
 const active=p=>p.evaluate(()=>soundQA.nodes.filter(n=>n.started&&!n.stopped&&!n.ended).map(n=>n.duration));
 const seed=async(p,patch)=>{await p.evaluate(({key,state})=>localStorage.setItem(key,JSON.stringify(state)),{key:E.SAVE,state:{...fresh,...patch}});await p.reload();};
 let fresh;
 try{
  const p=await setup();fresh=await read(p);assert(await p.getByRole('button',{name:'Turn sound off',exact:true}).isVisible());assert.equal(await p.evaluate(()=>soundQA.contexts.length),0);
  await click(p,'Enter backstage');await music(p);await voice(p);await click(p,'Pause');assert((await active(p)).some(d=>d>59));assert(!(await active(p)).some(d=>d<30));
  const preserved=await read(p);await click(p,'Open notes');await click(p,'Close notes');assert.deepEqual(await read(p),preserved);
  await p.getByLabel('Adjust volume',{exact:true}).click();await p.getByRole('slider',{name:'Music and voice volume'}).fill('37');await p.getByLabel('Adjust volume',{exact:true}).click();assert.deepEqual(await read(p),preserved);
  await click(p,'Turn sound off');await click(p,'Go backstage');await p.locator('.contacts .contact').filter({hasText:'Lia, tell me'}).click();assert(await p.getByRole('button',{name:'Turn sound on',exact:true}).isVisible());const restored=await read(p);
  await p.reload();assert(await p.getByRole('button',{name:'Turn sound off',exact:true}).isVisible());assert.equal(await p.evaluate(()=>soundQA.contexts.length),0);assert.deepEqual(await read(p),restored);
  await click(p,'Open notes');await music(p);assert.deepEqual(await read(p),restored);await click(p,'Close notes');await p.waitForFunction(()=>Math.abs(soundQA.contexts[0].qaGains[0].gain.value-.37)<.005);assert.equal(await p.evaluate(()=>localStorage.getItem('perspectives-concert-volume')),'0.37');
  await p.getByLabel('Adjust volume',{exact:true}).click();await p.getByRole('slider',{name:'Music and voice volume'}).fill('0');await p.getByLabel('Adjust volume',{exact:true}).click();await click(p,'Open notes');await click(p,'Close notes');await p.waitForFunction(()=>soundQA.contexts[0].qaGains[0].gain.value<.001);assert.deepEqual(await read(p),restored);
  await click(p,'PERSPECTIVES · start again');assert(await p.getByRole('button',{name:'Enter backstage',exact:true}).isVisible());assert.equal(await p.getByRole('dialog').count(),0);assert.deepEqual(await read(p),fresh);assert.equal(await p.evaluate(()=>localStorage.getItem('perspectives-concert-volume')),'0.6');await p.reload();assert(await p.getByRole('button',{name:'Turn sound off',exact:true}).isVisible());
  await p.evaluate(()=>{localStorage.setItem('perspectives-concert-sound-review','off');localStorage.setItem('perspectives-concert-volume','0');});await p.reload();assert(await p.getByRole('button',{name:'Turn sound off',exact:true}).isVisible());assert.equal(await p.evaluate(()=>localStorage.getItem('perspectives-concert-volume')),'0.6');await click(p,'Enter backstage');await music(p);await voice(p);await click(p,'Pause');await p.screenshot({path:'qa/sound-reset-opening-mobile.png'});checks.push('Fresh/restored/off/zero launch, actual score/voice, positive-volume preservation, explicit visit mute and zero, notes preserve state');await p.close();

  for(const size of [{width:390,height:844},{width:390,height:480},{width:1440,height:1000}]){
   const p=await setup(size);await p.evaluate(({legacy})=>{localStorage.setItem(legacy,'legacy-sentinel');localStorage.setItem('unrelated-project','keep');localStorage.setItem('perspectives-concert-volume','.42');}, {legacy:E.LEGACY_SAVE});
   const dirty={prep:['visit:nora','sheet','changed','love'].reduce(E.reducePrep,E.initialPrep()),negotiation:{...E.initialNegotiation(),turns:3,proposal:'public',version:3,accepted:3},confirmed:3,token:'fixture-secret',draft:'Unsent exact words',ending:'public',aiMessages:[{who:'lia',text:'An old offer.'}],sendRequest:{message:'Pending words',requestId:'old-id',token:'fixture-secret',retries:1},goal:'Private goal',admitted:true};
   for(const [screen,entry] of [['dialogue','PERSPECTIVES · start again'],['ai','PERSPECTIVES · start again'],['reveal','Try another approach']]){
    await seed(p,{...dirty,screen});const before=await read(p);if(screen==='ai'){await openOptions(p);assert.deepEqual(await read(p),before);}const button=p.getByRole('button',{name:entry,exact:true});await button.scrollIntoViewIfNeeded();assert(await button.isEnabled());await button.click();await p.getByRole('button',{name:'Enter backstage',exact:true}).waitFor();assert.equal(await p.getByRole('dialog').count(),0);assert.equal(await p.getByText('Keep playing',{exact:true}).count(),0);assert.deepEqual(await read(p),fresh);assert(await p.getByRole('button',{name:'Turn sound off',exact:true}).isVisible());assert.equal(await p.evaluate(()=>localStorage.getItem('perspectives-concert-volume')),'0.42');assert.equal(await p.evaluate(k=>localStorage.getItem(k),E.LEGACY_SAVE),'legacy-sentinel');assert.equal(await p.evaluate(()=>localStorage.getItem('unrelated-project')),'keep');
   }
   await p.screenshot({path:`qa/sound-reset-${size.width}x${size.height}-cover.png`});await p.close();
  }checks.push('All three restart entries at mobile, short mobile and desktop clear only current game with no confirmation');

  for(const hold of ['Resume','Decode'])for(const action of ['mute','restart']){
   const p=await setup();await p.evaluate(hold=>soundQA['hold'+hold]=true,hold);await click(p,'Enter backstage');await p.waitForFunction(key=>soundQA[key].length>0,hold==='Resume'?'resumes':'decodes');
   if(action==='mute')await click(p,'Turn sound off');else await click(p,'PERSPECTIVES · start again');
   await p.evaluate(()=>{soundQA.holdResume=false;soundQA.holdDecode=false;for(const list of [soundQA.resumes,soundQA.decodes])for(const done of list.splice(0))done();});await p.waitForTimeout(350);
   if(action==='mute'){assert(await p.getByRole('button',{name:'Turn sound on',exact:true}).isVisible());assert.equal(await p.evaluate(()=>soundQA.contexts[0].qaGains[0].gain.value),0);assert.equal((await active(p)).length,0);}else{await music(p);assert.deepEqual(await read(p),fresh);const sources=await active(p);assert.equal(sources.filter(d=>d>59).length,1);assert.equal(sources.filter(d=>d<30).length,0);}
   assert(!await p.getByRole('button',{name:action==='mute'?'Turn sound on':'Turn sound off',exact:true}).isDisabled());await p.close();
  }checks.push('Late real decode/resume cannot undo mute/restart or overlap soundtrack/old voice');

  const failed=await setup();await failed.route('**/audio/cinematic-score-v1.mp3',r=>r.fulfill({status:404,body:'fixture missing audio'}));await click(failed,'Enter backstage');await failed.getByRole('alert').waitFor();assert(await failed.getByRole('button',{name:'Turn sound on',exact:true}).isEnabled());await failed.unroute('**/audio/cinematic-score-v1.mp3');await click(failed,'Turn sound on');await music(failed);await voice(failed);await click(failed,'Go backstage');assert.equal((await read(failed)).screen,'hub');await failed.close();checks.push('Failed score load is readable/retryable without blocking navigation');

  for(const mode of ['send','start-failure','transcribe']){
   let release,requested=false;const p=await setup(undefined,async r=>{
    if(r.request().method()==='GET')return r.fulfill({json:{available:true}});requested=true;await new Promise(done=>release=done);
    const body=mode==='transcribe'?{text:'A late transcript must never return.'}:mode==='start-failure'?{error:'ai_unavailable'}:{token:'stale-token',negotiation:{...E.initialNegotiation(),turns:4,version:7,accepted:7},reply:{text:'A late reply must never return.'},diagnostic:{source:'fixture'}};
    return r.fulfill({status:mode==='start-failure'?503:200,json:body}).catch(()=>{});
   });
   if(mode==='transcribe')await p.addInitScript(()=>{
    window.fakeTracks=[];Object.defineProperty(navigator,'mediaDevices',{value:{async getUserMedia(){const track={readyState:'live',stop(){this.readyState='ended';}};fakeTracks.push(track);return{qaFake:true,getTracks:()=>[track]};}},configurable:true});
    window.MediaRecorder=class{static isTypeSupported(t){return t==='audio/webm;codecs=opus';}constructor(_,o){this.mimeType=o.mimeType;this.state='inactive';}start(){this.state='recording';}stop(){this.state='inactive';setTimeout(()=>{this.ondataavailable?.({data:new Blob([new Uint8Array([26,69,223,163,...Array(100).fill(1)])])});this.onstop?.();},0);}};
   });
   await seed(p,{screen:mode==='start-failure'?'brief':'ai',prep:['visit:lia','cost','plan'].reduce(E.reducePrep,E.initialPrep()),token:'fixture',draft:mode==='send'?'A sent offer':'',confirmed:2,negotiation:{...E.initialNegotiation(),proposal:'public',version:2,accepted:2}});
   if(mode==='send'){await editReply(p);await click(p,'Send message');}else if(mode==='start-failure')await click(p,'Talk to Lia');else{await click(p,'Record your reply');await p.getByRole('button',{name:'Stop recording',exact:true}).waitFor();await p.waitForTimeout(350);await click(p,'Stop recording');}
   while(!requested||!release)await p.waitForTimeout(10);
   if(mode!=='start-failure')await openOptions(p);await click(p,'PERSPECTIVES · start again');assert.deepEqual(await read(p),fresh);release();await p.waitForTimeout(200);assert.deepEqual(await read(p),fresh);assert.equal(await p.locator('[role=dialog]').count(),0);assert.equal(await p.getByRole('alert').count(),0);assert.equal(await p.getByText(/A late (reply|transcript)/).count(),0);if(mode==='transcribe')assert(await p.evaluate(()=>fakeTracks.every(t=>t.readyState==='ended')));await p.close();
  }checks.push('Reset ignores late send, failed AI start and transcription; releases microphone tracks');
  assert.deepEqual(errors,[]);fs.writeFileSync('qa/sound-reset-results.json',JSON.stringify({pass:true,checks,errors,api,scope:'Isolated Chromium with actual local MP3 playback and controlled delayed API/audio boundaries. No paid calls; physical Safari/iOS autoplay and subjective sound not verified.'},null,2));console.log('Sound default and immediate restart: PASS');
 }finally{await browser.close();}
})().catch(e=>{console.error(e);process.exitCode=1;});
