// Controlled static-browser QA: never invokes model generation.
const {chromium}=require(process.env.QA_PLAYWRIGHT||'playwright');
const assert=require('node:assert/strict'),fs=require('node:fs');
(async()=>{
 const {OPENING,openingDuration}=await import('../src/story.mjs');
 const browser=await chromium.launch({headless:true,executablePath:process.env.QA_CHROME||undefined});
 const page=await browser.newPage({viewport:{width:390,height:844},reducedMotion:'reduce'}),errors=[];
 page.on('pageerror',e=>errors.push(e.message));
 await page.route('**/api/negotiate',r=>r.fulfill({json:{available:false}}));
 await page.clock.install();
 await page.goto(process.env.QA_URL||'http://127.0.0.1:8796');
 const click=n=>page.getByRole('button',{name:n,exact:true}).click();
 const line=()=>page.locator('.opening .big-line');
 const expectBeat=async i=>assert.equal(await line().textContent(),OPENING[i].text);
 const saved=()=>page.evaluate(()=>{const s=JSON.parse(localStorage.getItem('perspectives-concert-encore-v05'));return {prep:s.prep,negotiation:s.negotiation,draft:s.draft,confirmed:s.confirmed};});
 await click('Enter backstage');await click('Pause');await expectBeat(0);
 const initial=await saved();
 await page.locator('.opening-caption').click();await expectBeat(1);
 assert(OPENING[0].text.includes('main set'));assert(OPENING[1].text.includes('co-wrote'));assert(OPENING[2].text.includes('without Nora'));
 await page.clock.fastForward(40000);await expectBeat(1); // paused scene tap remains paused
 await click('Previous');await expectBeat(0);
 await page.getByRole('button',{name:'Next',exact:true}).focus();await page.keyboard.press('Enter');await expectBeat(1);
 await click('Open notes');await expectBeat(1);await click('Close notes');await expectBeat(1);
 await click('Turn sound on');await expectBeat(1);await click('Turn sound off');await expectBeat(1);
 // Selected text and dragged scene are not advance gestures.
 await page.evaluate(()=>{const r=document.createRange();r.selectNodeContents(document.querySelector('.opening .big-line'));const s=getSelection();s.removeAllRanges();s.addRange(r);});
 await page.locator('.opening-caption').dispatchEvent('click',{clientX:80,clientY:200});await expectBeat(1);
 await page.evaluate(()=>getSelection().removeAllRanges());
 await page.locator('.opening').dispatchEvent('pointerdown',{clientX:60,clientY:150});
 await page.locator('.opening').dispatchEvent('click',{clientX:60,clientY:210});await expectBeat(1);
 // Manual next cancels the nearly expired timer; next beat gets its complete reading time.
 await click('Previous');await click('Resume');await page.clock.fastForward(openingDuration(OPENING[0])-500);await expectBeat(0);
 await page.locator('.opening-caption').click();await expectBeat(1);
 await page.clock.fastForward(600);await expectBeat(1);
 await page.clock.fastForward(openingDuration(OPENING[1]));await expectBeat(2);
 await click('Pause');await expectBeat(2);
 for(const size of [{width:390,height:844},{width:390,height:480}]){
  await page.setViewportSize(size);
  for(const name of ['Resume','Previous','Next','Go backstage']){const b=page.getByRole('button',{name,exact:true});await b.scrollIntoViewIfNeeded();const box=await b.boundingBox();assert(box&&box.x>=0&&box.x+box.width<=size.width+1&&box.y>=0&&box.y+box.height<=size.height+1,name);}
  assert(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth));
  await page.screenshot({path:`qa/opening-${size.width}x${size.height}.png`});
 }
 for(let i=3;i<OPENING.length;i++){await page.locator('.opening-caption').click();await expectBeat(i);}
 await page.locator('.opening-caption').click();await page.locator('.contact').first().waitFor();
 assert.deepEqual(await saved(),initial);
 // Separate restart verifies Go backstage does not bubble into unrelated state changes.
 await page.evaluate(()=>localStorage.removeItem('perspectives-concert-encore-v05'));await page.reload();
 await click('Enter backstage');await click('Go backstage');await page.locator('.contact').first().waitFor();assert.deepEqual(await saved(),initial);
 assert.equal(errors.length,0);
 fs.writeFileSync('qa/opening-results.json',JSON.stringify({passed:true,scope:'Static UI with unavailable API fixture; no model calls',checks:['main set, central creative roles, booking notification and refusal','single taps advance once including paused','last tap reaches hub','controls/topbar do not advance scene','selected text and drags do not advance','manual next resets timer; auto progression retained','reduced-motion browser preference','390x844 and 390x480 controls reachable','intro preserves prep/negotiation/draft/consent'],errors},null,2));
 await browser.close();console.log('Opening clarity, gestures, timer, controls and state: PASS');
})().catch(e=>{console.error(e);process.exit(1);});
