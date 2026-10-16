// Controlled static UI; never calls a model.
const {chromium}=require(process.env.QA_PLAYWRIGHT||'playwright'),assert=require('node:assert/strict'),fs=require('node:fs');
(async()=>{
 const {initialPrep,reducePrep,initialNegotiation,options,BUILD}=await import('../src/engine.mjs');
 const {CAST,NODES}=await import('../src/story.mjs');
 const browser=await chromium.launch({headless:true,executablePath:process.env.QA_CHROME||undefined}),page=await browser.newPage({viewport:{width:390,height:844},reducedMotion:'reduce'}),errors=[];
 page.on('pageerror',e=>errors.push(e.message));await page.route('**/api/negotiate',r=>r.fulfill({json:{available:false}}));await page.goto(process.env.QA_URL||'http://127.0.0.1:8796');
 const saved=()=>page.evaluate(()=>JSON.parse(localStorage.getItem('perspectives-concert-encore-v05')));
 const seed=async(prep,extra={})=>{await page.evaluate(({prep,extra,BUILD,n})=>localStorage.setItem('perspectives-concert-encore-v05',JSON.stringify({build:BUILD,screen:'dialogue',prep,negotiation:n,...extra})),{prep,extra,BUILD,n:initialNegotiation()});await page.reload();};
 const click=name=>page.getByRole('button',{name,exact:true}).click();
 const verify=async prep=>{
  const who=NODES[prep.node].who,h=prep.history[who],speech=page.getByRole('region',{name:`${CAST[who].name} says`});
  assert.equal(await speech.locator('.conversation-label').textContent(),CAST[who].name);const lines=await speech.locator('.spoken').allTextContents();assert.deepEqual(lines,[prep.current.line,...(prep.current.continuation?[prep.current.continuation]:[])]);assert.equal(await page.locator('.follow-line').count(),0);
  assert.deepEqual(await page.locator('.choices .btn span').allTextContents(),options(prep).map(c=>c[1]));assert.equal(await page.locator('.choice-label').textContent(),'What do you say?');
 };
 let prep=reducePrep(initialPrep(),'visit:nora');await seed(prep);await verify(prep);
 for(const action of ['meaning','promise']){await click(options(prep).find(c=>c[0]===action)[1]);prep=reducePrep(prep,action);assert.deepEqual((await saved()).prep,prep);await verify(prep);}
 assert.equal(await page.locator('.player-intervention .conversation-label').textContent(),'You said');assert.equal(await page.locator('.your-line').textContent(),prep.history.nora.at(-2).text);assert.equal(await page.locator('.character-speech .spoken').count(),2);
 const transcript=page.locator('.transcript');assert.equal(await transcript.getAttribute('open'),null);const before=await saved();await transcript.locator('summary').click();assert.notEqual(await transcript.getAttribute('open'),null);assert.deepEqual(await saved(),before);await transcript.locator('summary').click();
 const layout=[];for(const size of [{width:390,height:844},{width:390,height:480},{width:1440,height:1000}]){
  await page.setViewportSize(size);await page.waitForTimeout(150);await page.locator('.character-speech').scrollIntoViewIfNeeded();await page.screenshot({path:`qa/hierarchy-${size.width}x${size.height}.png`});await page.locator('.choices .btn').first().scrollIntoViewIfNeeded();const b=await page.locator('.choices .btn').first().boundingBox();assert(b.y>=0&&b.y+b.height<=size.height+1);assert(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth));
  const fonts=await page.locator('.conversation-label,.choice-label,summary').evaluateAll(els=>els.filter(e=>e.getBoundingClientRect().height).map(e=>parseFloat(getComputedStyle(e).fontSize)));assert(fonts.every(f=>f>=11));layout.push(size);
 }
 for(const who of ['lia','bruno']){
  let state=reducePrep(reducePrep(initialPrep(),'visit:nora'),'leave');state=reducePrep(state,`visit:${who}`);await seed(state);await verify(state);if(who==='bruno')assert((await page.locator('.character-speech').textContent()).includes('The set’s done.'));
  const choice=options(state)[0];await click(choice[1]);state=reducePrep(state,choice[0]);assert.deepEqual((await saved()).prep,state);if((await saved()).screen==='dialogue')await verify(state);
 }
 const goal='An honest farewell without pressure',cue='She puts down her headphones.';
 await seed(prep,{screen:'ai',goal,draft:'Keep this draft',aiMessages:[{who:'lia',cue,text:'Tell me what you propose.'},{who:'player',text:'Let’s agree on an honest farewell.'},{who:'bruno',text:'Last call from the broadcast desk.'}]});
 assert.equal(await page.locator('.private-goal .conversation-label').textContent(),'Your goal · private');assert.equal(await page.locator('.private-goal p').textContent(),goal);assert.deepEqual(await page.locator('.message-who').allTextContents(),['Lia','YOU','Bruno']);assert.equal(await page.locator('.chat-message.lia .cue').textContent(),cue);assert.equal(await page.locator('.chat-message.lia .cue').evaluate(el=>getComputedStyle(el).fontStyle),'italic');assert.equal(await page.locator('.chat-message.lia .message-speech').textContent(),'Tell me what you propose.');assert.equal(await page.locator('textarea').inputValue(),'Keep this draft');
 await page.setViewportSize({width:390,height:844});await page.waitForTimeout(150);await page.screenshot({path:'qa/hierarchy-ai.png'});assert.equal(errors.length,0);fs.writeFileSync('qa/hierarchy-results.json',JSON.stringify({passed:true,scope:'Real UI with controlled saves and unavailable API fixture; no model calls',checks:['promise path speaker continuity','exact reducer state and available choices','initial and later cast hierarchy','Bruno context spoken','history collapsed and inert','AI private goal and physical cues','draft preserved','short and tall mobile plus desktop'],layout,errors},null,2));await browser.close();console.log('Conversation hierarchy and unchanged state: PASS');
})().catch(e=>{console.error(e);process.exit(1);});
