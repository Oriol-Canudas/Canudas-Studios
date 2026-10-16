// Actual authored choices + one controlled start response. Never calls a provider.
const {chromium}=require(process.env.QA_PLAYWRIGHT||'playwright');
const assert=require('node:assert/strict'),fs=require('node:fs');
(async()=>{
 const E=await import('../src/engine.mjs'),S=await import('../src/story.mjs');
 const browser=await chromium.launch({headless:true,executablePath:process.env.QA_CHROME||undefined}),results=[];
 try{
 async function journey(name,fn){
  const page=await browser.newPage({viewport:{width:390,height:844},reducedMotion:'reduce'}),errors=[],requests=[];
  page.on('pageerror',e=>errors.push(e.message));
  await page.route('**/api/negotiate',r=>{
   if(r.request().method()==='GET')return r.fulfill({json:{available:true,build:E.BUILD}});
   const b=r.request().postDataJSON();requests.push(b);assert.equal(b.action,'start');
   const prep=E.replayPrep(b.events);return r.fulfill({json:{token:'dialogue-fixture',negotiation:E.initialNegotiation(prep),opening:E.negotiationOpening(prep)}});
  });
  await page.goto(process.env.QA_URL||'http://127.0.0.1:8796');
  const read=()=>page.evaluate(key=>JSON.parse(localStorage.getItem(key)),E.SAVE),click=name=>page.getByRole('button',{name,exact:true}).click();
  const action=async id=>{const before=(await read()).prep,c=E.options(before).find(c=>c[0]===id);assert(c,name+': '+id);await click(c[1]);await page.waitForFunction(({key,id})=>JSON.parse(localStorage.getItem(key)).prep.events.at(-1)===id,{key:E.SAVE,id});assert.deepEqual((await read()).prep,E.reducePrep(before,id));};
  const contact=async who=>{await page.locator('.contacts .contact').filter({has:page.locator('strong').filter({hasText:new RegExp('^'+who+'(?:,|$)')})}).click();await page.waitForFunction(({key,who})=>JSON.parse(localStorage.getItem(key)).prep.events.at(-1)==='visit:'+who.toLowerCase(),{key:E.SAVE,who});};
  const leave=async()=>click((await read()).screen==='brief'?'Backstage':'Return backstage');
  const start=async who=>{await click('Enter backstage');await click('Go backstage');await contact(who);};
  const shot=async label=>{
   for(const size of [{width:390,height:844},{width:390,height:480},{width:1440,height:1000}]){
    await page.setViewportSize(size);await page.evaluate(()=>Promise.all([...document.images].map(i=>i.decode().catch(()=>{}))));
    assert(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth));
    assert(await page.locator('.character-speech').isVisible());assert(await page.locator('.response-options').isVisible());
    await page.locator('.character-speech').scrollIntoViewIfNeeded();await page.screenshot({path:`qa/dialogue-${name}-${label}-${size.width}x${size.height}.png`});
    await page.locator('.response-options').scrollIntoViewIfNeeded();await page.screenshot({path:`qa/dialogue-${name}-${label}-${size.width}x${size.height}-choices.png`});
   }
   await page.setViewportSize({width:390,height:844});
  };
  await fn({page,read,click,action,contact,leave,start,shot,requests});
  const saved=await read();let replayed=E.replayPrep(saved.prep.events);
  // Navigation actions deliberately do not enter the preparation event log.
  if(saved.prep.node==='brief'&&replayed.node!=='brief')replayed=E.reducePrep(replayed,'brief');
  else if(saved.prep.node==='hub'&&replayed.node!=='hub')replayed=E.reducePrep(replayed,'leave');
  assert.deepEqual(saved.prep,replayed);assert.deepEqual(errors,[]);results.push({name,passed:true,requests:requests.length,events:saved.prep.events,facts:saved.prep.facts,sources:saved.prep.sources,deliveries:saved.prep.deliveries,errors});await page.close();
 }
 await journey('love-privacy-context-ack',async({page,read,action,start,shot,contact,leave})=>{
  await start('Nora');for(const id of ['sheet','changed','love'])await action(id);
  assert.equal(await page.locator('.character-speech .spoken').count(),1);assert(!(await read()).prep.facts.rehearsal_account);assert(!/rehearsal/.test(await page.locator('.character-speech').innerText()));
  assert((await page.locator('.choices').innerText()).includes('It stays here.'));await shot('confession');
  await action('permission');assert((await read()).prep.facts.rehearsal_account);assert(!(await read()).prep.contextRelayed);await action('relay_context');await contact('Lia');await action('lc_offer');
  const prep=(await read()).prep;assert(prep.facts.acknowledgement);assert(prep.history.lia.some(m=>m.role==='lia'&&/planned the tour without her/.test(m.text)));assert(!/love/.test(JSON.stringify(E.liaContext(prep))));
  await leave();await contact('Nora');await action('relay_ack');assert.equal((await read()).negotiation.accepted,null);await shot('acknowledgment');
 });
 await journey('love-rehearsal-only',async({read,action,start,shot})=>{await start('Nora');for(const id of ['sheet','changed','love','accountability'])await action(id);const p=(await read()).prep;assert(p.facts.rehearsal_account);assert(!p.facts.professional);assert(!p.facts.permission);await shot('rehearsal');});
 await journey('love-tonight-only',async({read,action,start,shot})=>{await start('Nora');for(const id of ['sheet','changed','love','tonight_nora'])await action(id);const p=(await read()).prep;assert(!p.facts.rehearsal_account);assert(!p.facts.permission);await shot('tonight');});
 await journey('professional-only-context',async({page,read,action,start,contact,shot})=>{await start('Nora');for(const id of ['sheet','interpretation','permission','relay_context'])await action(id);assert(!(await read()).prep.facts.love);await contact('Lia');assert((await page.locator('.character-speech').innerText()).includes('still wanted the music'));await action('lc_excuse');await shot('admission');assert(!(await read()).prep.facts.love);});
 await journey('offer-first-returns-known-listen',async({page,read,action,start,contact,leave,shot})=>{
  await start('Nora');for(const id of ['meaning','terms'])await action(id);await shot('relay-menu');await action('relay');await contact('Nora');assert.match(await page.locator('.character-speech').innerText(),/Have you reached her yet/);await leave();await contact('Lia');assert.match(await page.locator('.character-speech').innerText(),/I heard her offer/);await shot('first-receipt');for(const id of ['cost','without'])await action(id);assert.match(await page.locator('.choices').innerText(),/conditions are already clear/);await action('listen');await contact('Nora');assert.match(await page.locator('.character-speech').innerText(),/You’ve spoken to her/);assert(!(await read()).prep.facts.love);await shot('return');
 });
 await journey('lia-first-to-negotiation',async({page,read,action,start,contact,leave,click,shot,requests})=>{
  await start('Lia');for(const id of ['why','asked'])await action(id);assert.match(await page.locator('.character-speech').innerText(),/I heard permission. Maybe I wanted to/);await leave();await contact('Nora');for(const id of ['meaning','terms','relay'])await action(id);await contact('Lia');assert.match(await page.locator('.character-speech').innerText(),/I heard her offer/);await shot('return-receipt');await leave();await click('Prepare an agreement with Lia');await click('Talk to Lia');await page.locator('#message').waitFor();const saved=await read();assert.equal(saved.negotiation.turns,0);assert.equal(saved.negotiation.accepted,null);assert.equal(requests.length,1);assert(!saved.prep.facts.love);
 });
 await journey('chronology-selected-intervention',async({page,read,action,start,contact,leave,shot})=>{
  await start('Nora');await action('sheet');await leave();await contact('Bruno');await action('date');const before=(await read()).prep,c=E.options(before).find(c=>c[0]==='contrast');await shot('challenge-menu');await action('contrast');assert.equal(await page.locator('.portrait-title h1').textContent(),'Lia');assert.equal(await page.locator('.your-line').textContent(),c[1]);assert.deepEqual((await read()).prep.history.bruno,before.history.bruno);assert.match(await page.locator('.character-speech').innerText(),/planned the tour without her/);await shot('lia-answer');await action('own');await contact('Nora');await action('relay_ack');assert.equal((await read()).negotiation.accepted,null);
 });
 await journey('rehearsal-before-love',async({page,read,action,start,contact,leave,shot})=>{
  await start('Nora');await action('sheet');await action('interpretation');assert((await read()).prep.facts.rehearsal_account);
  for(const id of ['meaning','goodbye']){await leave();await contact('Nora');await action(id);}
  await leave();await contact('Nora');await action('changed');await action('love');
  const facts=(await read()).prep.facts;assert(facts.love);assert(facts.rehearsal_account);assert.equal(await page.locator('.character-speech .spoken').count(),1);assert((await page.locator('.choices').innerText()).includes('It stays here.'));await shot('confession');await action('tonight_nora');assert.deepEqual((await read()).prep.facts,facts);
 });
 for(const staged of [false,true])await journey(staged?'staged-context-then-offer':'combined-context-and-offer',async({page,read,action,start,contact,leave,shot})=>{
  await start('Nora');for(const id of ['sheet','interpretation','permission','relay_context'])await action(id);
  if(staged){await contact('Lia');await leave();}await contact('Nora');for(const id of ['meaning','terms','relay'])await action(id);await contact('Lia');
  const line=await page.locator('.character-speech').innerText();assert.equal(line.split('I heard her offer').length-1,1);assert.equal(line.includes('still wanted the music'),!staged);assert.equal((await read()).negotiation.accepted,null);await shot('receipt');
 });
 fs.writeFileSync('qa/dialogue-results.json',JSON.stringify({pass:true,scope:'Actual authored browser choices; local static preview, controlled start response; no model calls',viewports:['390x844','390x480','1440x1000'],editorialLimit:'Not a measured enjoyment score',results},null,2));console.log('Dialogue: ten controlled authored journeys passed');
 }finally{await browser.close();}
})().catch(e=>{console.error(e);process.exitCode=1;});
