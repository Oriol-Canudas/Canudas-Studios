const {chromium}=require(process.env.QA_PLAYWRIGHT||'playwright');
const assert=require('node:assert/strict'),fs=require('fs');
(async()=>{
 const {initialPrep,reducePrep,initialNegotiation,BUILD}=await import('../src/engine.mjs');
 const browser=await chromium.launch({headless:true,executablePath:process.env.QA_CHROME||undefined});
 const page=await browser.newPage({viewport:{width:390,height:844},reducedMotion:'reduce'});
 await page.route('**/api/negotiate',r=>r.fulfill({json:{available:false}}));
 await page.goto('http://127.0.0.1:8785');
 const click=name=>page.getByRole('button',{name,exact:true}).click();
 await page.evaluate(()=>localStorage.setItem('perspectives-concert-v1','preserved-old-session'));
 await click('Enter backstage');await page.waitForTimeout(600);
 const audio=await page.evaluate(async()=> (await import('/src/audio.mjs')).audioStatus());
 assert.equal(audio.state,'running');assert(audio.rms>.0001,JSON.stringify(audio));
 await click('Turn sound off');await page.waitForTimeout(3500);
 const muted=await page.evaluate(async()=> (await import('/src/audio.mjs')).audioStatus());assert(muted.rms<.001,JSON.stringify(muted));
 await page.waitForTimeout(5000);assert(await page.getByText('Five minutes before the broadcast ends.',{exact:true}).isVisible());
 await click('Pause');await click('Next');assert(await page.getByText('We ran over.',{exact:false}).isVisible());await click('Previous');assert(await page.getByText('Five minutes before the broadcast ends.',{exact:true}).isVisible());
 await page.screenshot({path:'qa/v02-opening.png'});await click('Go backstage');
 await page.locator('.contact').filter({hasText:'Lia, tell me'}).click();await page.evaluate(()=>Promise.all([...document.images].map(i=>i.decode().catch(()=>{}))));await page.screenshot({path:'qa/v02-lia-authored.png'});
 const portrait=await page.locator('.portrait-scene .portrait-frame').boundingBox(),title=await page.locator('.portrait-title').boundingBox();assert(title.y>=portrait.y+portrait.height-1);
 const prep=['visit:lia','cost','listen'].reduce(reducePrep,initialPrep());
 const layouts=[];
 for(const mood of ['guarded','hurt','firm','receptive']){
  await page.evaluate(({prep,BUILD,mood})=>localStorage.setItem('perspectives-concert-v2-en',JSON.stringify({build:BUILD,screen:'ai',prep,negotiation:{proposal:null,version:0,terms:{},turns:1,accepted:null,mood},aiMessages:[{who:'lia',text:'I can’t offer her a future I don’t want.'}]})),{prep,BUILD,mood});await page.reload();
  await page.locator('.lia-presence').waitFor();assert.equal(await page.locator('.lia-presence').getAttribute('data-mood'),mood);
  for(const size of [{width:390,height:844},{width:655,height:1050},{width:1440,height:1000},{width:390,height:480}]){
   await page.setViewportSize(size);await page.waitForTimeout(180);await page.evaluate(()=>Promise.all([...document.images].map(i=>i.decode().catch(()=>{}))));
   const send=await page.getByRole('button',{name:'Send message',exact:true}).boundingBox();assert(send.y+send.height<=size.height+1,JSON.stringify({size,send}));
   assert(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth));
   await page.screenshot({path:`qa/v02-${mood}-${size.width}x${size.height}.png`});layouts.push({mood,...size,send});
  }
 }
 assert.equal(await page.evaluate(()=>localStorage.getItem('perspectives-concert-v1')),'preserved-old-session');
 fs.writeFileSync('qa/immersion-results.json',JSON.stringify({audio,muted,layouts,oldSavePreserved:true,pacing:'first screen still present after 5 seconds; pause/next/previous pass',scope:'Actual local browser and real Web Audio signal; emotional replies are fixtures, not live inference; no physical iPhone audio check'},null,2));
 await browser.close();console.log('Immersion checks passed');
})().catch(e=>{console.error(e);process.exit(1)});
