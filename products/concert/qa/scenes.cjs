// Real scene navigation plus an explicitly accepted agreement fixture; no provider calls.
const {chromium}=require(process.env.QA_PLAYWRIGHT||'playwright'),assert=require('node:assert/strict'),fs=require('node:fs');
(async()=>{
 const E=await import('../src/engine.mjs'),{OPENING}=await import('../src/story.mjs');
 const browser=await chromium.launch({headless:true,executablePath:process.env.QA_CHROME||undefined}),results=[];
 try{
 for(const size of [{width:970,height:1067},{width:1440,height:1000},{width:390,height:844},{width:390,height:480}]){
  const page=await browser.newPage({viewport:size,reducedMotion:'reduce'}),errors=[],posts=[],screens=[];page.on('pageerror',e=>errors.push(e.message));
  await page.route('**/api/negotiate',r=>{if(r.request().method()==='GET')return r.fulfill({json:{available:true,build:E.BUILD}});const body=r.request().postDataJSON();posts.push(body);assert.equal(body.action,'start');const p=E.replayPrep(body.events);return r.fulfill({json:{token:'scenes-fixture',negotiation:E.initialNegotiation(p),opening:E.negotiationOpening(p)}});});
  await page.goto(process.env.QA_URL||'http://127.0.0.1:8796');await page.evaluate(()=>document.fonts.ready);
  const click=name=>page.getByRole('button',{name,exact:true}).click(),read=()=>page.evaluate(key=>JSON.parse(localStorage.getItem(key)),E.SAVE);
  const check=async(screen,label=screen)=>{
   await page.locator(`.screen-${screen}`).waitFor();assert(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth));
   if(size.width>900){const conversation=['dialogue','ai'].includes(screen);assert.equal(await page.locator('.desktop-art').isVisible(),conversation);assert.equal(await page.locator('.desktop-art h2:visible').count(),screen==='ai'?1:0);
    if(conversation)assert.equal(await page.locator('.desktop-art>img:visible,.stage .portrait-frame>img:visible').count(),1);
    if(screen==='dialogue'){assert.equal(await page.locator('.portrait-title h1').textContent(),'Nora');assert.match(await page.locator('.portrait-title p').textContent(),/Songwriter/);const back=await page.locator('.portrait-scene .back-over').boundingBox(),title=await page.locator('.portrait-title').boundingBox();assert(back.y+back.height<=title.y);}

    const g=await page.evaluate(()=>{const shell=document.querySelector('.shell'),stage=document.querySelector('.stage');return {shell:shell.getBoundingClientRect().width,stage:stage.getBoundingClientRect().width,columns:getComputedStyle(shell).gridTemplateColumns.split(' ').length};});
    assert.equal(g.columns,conversation?2:1);if(!conversation){assert.equal(g.stage,g.shell);assert(g.shell<=(['opening','ending','cover'].includes(screen)?1100:760));}
   }else assert(!await page.locator('.desktop-art').isVisible());
   await page.evaluate(()=>Promise.all([...document.images].map(i=>i.decode().catch(()=>{}))));await page.screenshot({path:`qa/scenes-${size.width}x${size.height}-${label}.png`});screens.push(label);
  };
  await check('cover');await click('Enter backstage');await click('Pause');
  for(let beat=0;beat<OPENING.length;beat++){
   if(beat)await click('Next');await page.getByText(OPENING[beat].text,{exact:true}).waitFor();await check('opening',`intro-${beat}`);
   if(beat===2)assert(await page.locator('.booking-message').isVisible());if(beat===4)assert.equal(await page.locator('.speaker span').textContent(),'Lia');
   for(const name of ['Resume','Previous','Next','Go backstage']){const b=page.getByRole('button',{name,exact:true});await b.scrollIntoViewIfNeeded();const box=await b.boundingBox();assert(box.y>=0&&box.y+box.height<=size.height+1);}
   if(size.width>900){const caption=await page.locator('.opening-caption').boundingBox();assert(caption.width<=680);assert(caption.y>=0&&caption.y+caption.height<=size.height);}
  }
  await click('Previous');await page.getByText(OPENING.at(-2).text,{exact:true}).waitFor();await click('Go backstage');await check('hub');
  await page.locator('.contact').filter({hasText:'Nora, wait.'}).click();await check('dialogue');assert((await page.locator('.desktop-art>img').getAttribute('src')).includes('nora'));
  await click(E.options((await read()).prep).find(c=>c[0]==='meaning')[1]);await click('Return backstage');await click('Prepare an agreement with Lia');await check('brief');
  await click('Talk to Lia');await page.locator('#message').waitFor();await check('ai');assert((await page.locator('.desktop-art>img').getAttribute('src')).includes('lia'));
  // The offer below is seeded, not inferred: exercise the real confirmation/cue/reveal controls.
  const saved=await read(),n={...E.initialNegotiation(saved.prep),proposal:'public',version:1,accepted:1,willingness:'agree',turns:1,mood:'receptive',terms:Object.fromEntries(E.requiredTerms('public').map(t=>[t,'controlled accepted agreement fixture']))};
  await page.evaluate(({key,saved,n})=>localStorage.setItem(key,JSON.stringify({...saved,screen:'ai',negotiation:n,confirmed:null,aiMessages:[{who:'lia',text:'Controlled fixture: I agree to this encore offer. Ask Nora.'}]})),{key:E.SAVE,saved,n});await page.reload();await click('Continue — confirm with Nora');await check('review');assert.equal((await read()).confirmed,null);
  await click('Put this agreement to Nora');assert.equal((await read()).confirmed,1);await click('Cue the encore together');await check('ending');assert.equal((await read()).ending,'public');await click('See what changed');await check('reveal');
  assert.deepEqual(errors,[]);assert.equal(posts.length,1);results.push({size,pass:true,introBeats:OPENING.length,screens,scope:'Actual entry/preparation; controlled start and accepted public-offer fixture; real Nora confirmation/cue/reveal',posts:posts.length,errors});await page.close();
 }
 fs.writeFileSync('qa/scenes-results.json',JSON.stringify({pass:true,scope:'Static preview, controlled fixtures; no model calls',results},null,2));console.log('Story scenes, all intro beats, retained conversation portraits and agreed encore journey: PASS');
 }finally{await browser.close();}
})().catch(e=>{console.error(e);process.exitCode=1;});
