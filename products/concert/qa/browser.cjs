const {chromium}=require(process.env.QA_PLAYWRIGHT||'playwright');
const fs=require('fs');const assert=require('node:assert/strict');
(async()=>{
 const browser=await chromium.launch({headless:true,executablePath:process.env.QA_CHROME||undefined});
 const context=await browser.newContext({viewport:{width:390,height:844},reducedMotion:'reduce'});
 const page=await context.newPage(),errors=[];page.on('pageerror',e=>errors.push(e.message));
 const base=process.env.QA_URL||'http://127.0.0.1:8785';
 const click=async name=>page.getByRole('button',{name,exact:true}).click();
 await page.goto(base);await page.screenshot({path:'qa/01-cover.png'});
 await click('Enter backstage');await click('Go backstage');await page.locator('.contact').filter({hasText:'Nora, wait. I’m coming with you.'}).click();await click('What would singing it tell the audience?');await click('What would make it an encore you could mean?');await page.screenshot({path:'qa/02-nora.png'});await click('I’ll take her your conditions for tonight’s encore.');await page.screenshot({path:'qa/03-hub.png'});
 assert(await page.getByText('Lia has heard Nora’s offer').isVisible());
 await page.getByRole('button',{name:'Open notes'}).click();assert(await page.getByText('Nora permits sharing her conditions', {exact:false}).isVisible());await click('Close notes');
 await page.locator('.contact').filter({hasText:'Lia'}).click();await click('What would change if you did the encore without her?');await click('I want to work out an offer with you.');await page.screenshot({path:'qa/04-brief.png'});
 await click('Talk to Lia');await page.waitForTimeout(700);
 if(base.includes('127.'))assert(await page.getByRole('alert').isVisible());
 const layout=[];
 for(const size of [{width:360,height:740},{width:390,height:844},{width:430,height:932},{width:1440,height:1000}]){
  await page.setViewportSize(size);await page.waitForTimeout(100);const r=await page.evaluate(()=>({width:innerWidth,scroll:document.documentElement.scrollWidth,images:[...document.images].filter(x=>x.complete&&!x.naturalWidth).map(x=>x.src)}));assert(r.scroll<=r.width);assert.equal(r.images.length,0);layout.push({...size,...r});
 }
 await page.screenshot({path:'qa/05-desktop.png'});
 fs.writeFileSync('qa/browser-results.json',JSON.stringify({scope:'Authored real UI journey; local API unavailable verified; no model calls',errors,layout},null,2));
 assert.equal(errors.length,0);await browser.close();console.log(JSON.stringify({authoredRoute:'pass',viewports:layout.length,errors}));
})().catch(e=>{console.error(e);process.exit(1)});
