// Synthetic visual-viewport/keyboard geometry, not a substitute for physical iOS QA.
const {chromium}=require(process.env.QA_PLAYWRIGHT||'playwright');
const assert=require('node:assert/strict'),fs=require('node:fs');
(async()=>{
 const {initialPrep,initialNegotiation,BUILD,SAVE}=await import('../src/engine.mjs');
 const browser=await chromium.launch({headless:true,executablePath:process.env.QA_CHROME||undefined});
 const results=[],errors=[];
 const line='I want Nora to know exactly what I am agreeing to. We wrote this song together. I will acknowledge the decision about the tour, but I cannot promise that we will go back to how things were.';
 const fixture={build:BUILD,screen:'ai',prep:initialPrep(),negotiation:initialNegotiation(),token:'fixture-token',draft:'',aiMessages:Array.from({length:9},(_,i)=>({who:i%2?'player':'lia',text:`${i+1}. ${line}`,cue:i%2?undefined:'She looks toward the stage.'}))};
 const settleLayout=page=>page.evaluate(async()=>{await document.fonts.ready;await new Promise(resolve=>requestAnimationFrame(()=>requestAnimationFrame(resolve)));});
 const read=page=>page.evaluate(SAVE=>JSON.parse(localStorage.getItem(SAVE)),SAVE);
 const geometry=page=>page.evaluate(()=>{
  const box=s=>{const e=document.querySelector(s),r=e.getBoundingClientRect();return {top:r.top,bottom:r.bottom,height:r.height,left:r.left,right:r.right,client:e.clientHeight,scroll:e.scrollHeight};};
  return {visual:{height:visualViewport?.height||innerHeight,top:visualViewport?.offsetTop||0},app:box('.app'),log:box('.chat-log'),composer:box('.composer'),input:box('#message'),send:box('.send'),identity:box('.presence-identity'),status:box('.agreement-strip'),exit:box('.continue-agreement'),windowScroll:scrollY,portrait:getComputedStyle(document.querySelector(innerWidth>900?'.desktop-art':'.lia-presence .portrait-frame')).display,keyboard:document.querySelector('.app').classList.contains('keyboard-open'),font:parseFloat(getComputedStyle(document.querySelector('#message')).fontSize),horizontal:document.documentElement.scrollWidth>innerWidth,bubbles:[...document.querySelectorAll('.chat-message')].map(e=>({height:e.clientHeight,scroll:e.scrollHeight,shrink:getComputedStyle(e).flexShrink})),atEnd:document.querySelector('.chat-log').scrollHeight-document.querySelector('.chat-log').scrollTop-document.querySelector('.chat-log').clientHeight};
 });
 const check=(g,min=1)=>{assert(Math.abs(g.app.top-g.visual.top)<=3,'app follows pan');assert(Math.abs(g.composer.bottom-g.visual.top-g.visual.height)<=3,'composer follows visible bottom');assert(g.log.height>=min,`log ${g.log.height} >= ${min}`);assert(g.log.bottom<=g.composer.top+1);assert(g.log.top>=g.status.bottom-1);assert(g.input.top>=g.composer.top&&g.send.bottom<=g.composer.bottom);assert(g.exit.bottom<=g.composer.bottom);assert(g.font>=16);assert(!g.horizontal);for(const b of g.bubbles){assert.equal(b.shrink,'0');assert(b.scroll<=b.height+1,'bubble is not compressed');}};
 try{
 const page=await browser.newPage({viewport:{width:390,height:844},reducedMotion:'reduce'});page.on('pageerror',e=>errors.push(e.message));
 await page.addInitScript(()=>{
  const visual=new EventTarget();Object.assign(visual,{height:844,width:390,offsetTop:0,offsetLeft:0,scale:1});Object.defineProperty(window,'visualViewport',{configurable:true,value:visual});
  window.setVisual=(height,top=0,event='resize',scale=1)=>{Object.assign(visual,{height,offsetTop:top,scale});visual.dispatchEvent(new Event(event));};
  window.unwantedScrolls=0;Element.prototype.scrollIntoView=function(){window.unwantedScrolls++;};
 });
 let posts=[],release,fail=false;
 await page.route('**/api/negotiate',async route=>{
  if(route.request().method()==='GET')return route.fulfill({json:{available:true}});
  posts.push(route.request().postDataJSON());await new Promise(resolve=>release=resolve);
  if(fail)return route.fulfill({status:503,json:{error:'fixture_unavailable'}});
  return route.fulfill({json:{token:'fixture-next',negotiation:{...initialNegotiation(),turns:1},reply:{text:'I heard the offer. Let me think about what it asks of Nora.',cue:'She pauses.'},diagnostic:{source:'fixture'}}});
 });
 await page.goto(process.env.QA_URL||'http://127.0.0.1:8796');await page.evaluate(({SAVE,fixture})=>localStorage.setItem(SAVE,JSON.stringify(fixture)),{SAVE,fixture});await page.reload();await page.locator('#message').waitFor();await settleLayout(page);
 const before=await read(page);await page.locator('#message').focus();await page.locator('#message').fill('Keep the shared credit.');
 for(const config of [[430,170,'resize',120],[430,250,'scroll',120],[360,250,'resize',90]]){
  await page.evaluate(([height,top,event])=>setVisual(height,top,event),config);await page.waitForTimeout(90);const g=await geometry(page);check(g,config[3]);assert(g.keyboard);assert.equal(g.portrait,'none');assert(g.atEnd<=2,'latest response stays in view');await page.screenshot({path:`qa/keyboard-${config[0]}-${config[1]}.png`});results.push({name:`viewport-${config[0]}-${config[1]}`,geometry:g});
 }
 const after=await read(page);for(const k of ['prep','negotiation','token','confirmed'])assert.deepEqual(after[k],before[k]);assert.equal(after.draft,'Keep the shared credit.');
 // Notes fit the same visible viewport, then return without erasing the draft.
 await page.getByRole('button',{name:'Check notes',exact:true}).click();await page.getByRole('dialog').waitFor();
 const modal=await page.getByRole('dialog').boundingBox();assert(modal.y>=250&&modal.y+modal.height<=610);await page.getByRole('button',{name:'Close notes',exact:true}).click();assert.equal(await page.locator('#message').inputValue(),'Keep the shared credit.');
 await page.locator('#message').focus();await page.locator('#message').press('Enter');await page.waitForFunction(()=>document.querySelector('.typing'));assert.equal(await page.locator('#message').inputValue(),'');
 await page.locator('#message').fill('My newer draft survives.');await page.waitForTimeout(50);assert.equal(posts.length,1);const original=posts[0];fail=true;release();await page.getByRole('button',{name:'Retry saved message',exact:true}).waitFor();
 check(await geometry(page),90);await page.screenshot({path:'qa/keyboard-failed-retry.png'});
 await page.getByRole('button',{name:'Retry saved message',exact:true}).click();await page.waitForFunction(()=>document.querySelector('.typing'));assert.equal(posts.length,2);for(const k of ['message','token','requestId'])assert.equal(posts[1][k],original[k]);fail=false;release();await page.getByText('I heard the offer. Let me think about what it asks of Nora.',{exact:true}).waitFor();
 assert.equal(await page.locator('#message').inputValue(),'My newer draft survives.');const completed=await read(page);assert.equal(completed.negotiation.turns,1);assert.equal(completed.sendRequest,null);
 await page.locator('#message').evaluate(e=>e.blur());await page.evaluate(()=>setVisual(844));await page.waitForTimeout(100);const restored=await geometry(page);check(restored);assert(!restored.keyboard);assert.notEqual(restored.portrait,'none');assert(restored.log.height>90);results.push({name:'restored',geometry:restored});
 // Pinch zoom remains permitted and does not masquerade as keyboard focus.
 await page.locator('#message').focus();await page.evaluate(()=>setVisual(430,50,'resize',2));await page.waitForTimeout(100);assert(!(await geometry(page)).keyboard);assert.notEqual((await geometry(page)).portrait,'none');assert(!/user-scalable\s*=\s*no|maximum-scale\s*=\s*1/.test(await page.locator('meta[name=viewport]').getAttribute('content')));await page.evaluate(()=>setVisual(844));
 assert.equal(await page.evaluate(()=>window.unwantedScrolls),0);assert.equal(await page.evaluate(()=>scrollY),0);
 await page.getByRole('button',{name:'End conversation and review',exact:true}).click();await page.locator('.review-head').waitFor();
 // Ordinary short/tall windows and no-visualViewport fallback preserve state and a visible portrait.
 for(const size of [{width:390,height:844},{width:390,height:480},{width:1440,height:1000}]){
  const other=await browser.newPage({viewport:size,reducedMotion:'reduce'});other.on('pageerror',e=>errors.push(e.message));await other.addInitScript(()=>Object.defineProperty(window,'visualViewport',{configurable:true,value:undefined}));await other.route('**/api/negotiate',r=>r.fulfill({json:{available:false}}));await other.goto(process.env.QA_URL||'http://127.0.0.1:8796');await other.evaluate(({SAVE,fixture})=>localStorage.setItem(SAVE,JSON.stringify(fixture)),{SAVE,fixture});await other.reload();await other.locator('#message').waitFor();await settleLayout(other);let g=await geometry(other);check(g,size.height===480?90:120);assert(!g.keyboard);assert.notEqual(g.portrait,'none');await other.screenshot({path:`qa/keyboard-ordinary-${size.width}x${size.height}.png`});
  const saved=await read(other);await other.locator('#message').focus();if(size.width>900){await other.waitForTimeout(100);assert(!(await geometry(other)).keyboard);assert.notEqual((await geometry(other)).portrait,'none');}
  await other.setViewportSize({width:size.height,height:size.width});await other.waitForTimeout(100);assert.deepEqual(await read(other),saved);results.push({name:`fallback-${size.width}x${size.height}`,geometry:g});await other.close();
 }
 assert.deepEqual(errors,[]);fs.writeFileSync('qa/keyboard-results.json',JSON.stringify({pass:true,scope:'Synthetic visible viewport and focus; controlled static browser fixtures, no paid AI; physical iOS remains unverified',checks:['resize and pan offsets','360/430px transcript space','natural bubbles','send/draft/retry identity','notes overlay','keyboard restoration','zoom allowed','no visualViewport fallback and rotation','no ancestor auto-scroll'],results},null,2));console.log('Keyboard layout checks passed');
 }finally{await browser.close();}
})().catch(error=>{console.error(error);process.exitCode=1;});
