const {chromium}=require(process.env.QA_PLAYWRIGHT||'playwright');
const fs=require('fs'),assert=require('node:assert/strict');
(async()=>{
 const browser=await chromium.launch({headless:true,executablePath:process.env.QA_CHROME||undefined});const results=[];
 for(const kind of ['public','solo']){
  const context=await browser.newContext({viewport:{width:390,height:844},reducedMotion:'reduce'}),page=await context.newPage();const errors=[];page.on('pageerror',e=>errors.push(e.message));
  const click=name=>page.getByRole('button',{name,exact:true}).click();
  const snap=async name=>{await page.evaluate(()=>Promise.all([...document.images].map(i=>i.decode().catch(()=>{}))));await page.screenshot({path:`qa/${name}.png`});};
  await page.goto('https://gamex-concert.vercel.app');await click('Enter backstage');await click('Go backstage');
  if(kind==='public'){
   await page.locator('.contact').filter({hasText:'Nora, wait.'}).click();await click('What don’t you want the audience to assume?');await click('What conditions can I take back to her?');await click('I’ll share only your professional conditions.');
  }else{
   await page.locator('.contact').filter({hasText:'Lia, tell me'}).click();await click('What do you lose if the single doesn’t premiere tonight?');await click('I’ll listen to what she would be willing to do.');
  }
  await click('Prepare an agreement with Lia');await click('Talk to Lia');await page.locator('#message').waitFor();
  const message=kind==='public'?'The single can wait until tomorrow. Tonight, sing the song you wrote together as a public professional farewell. Tell the audience Nora is leaving the project, acknowledge both of you as co-writers, with no promise to continue and no intimate details. Ending well can also mean caring for what you shared.':'Do the single. You can go on alone without erasing Nora: thank her for the songs you wrote together, without inventing an illness or claiming she agrees with everything. This is your performance, not a way to punish her.';
  await page.locator('#message').fill(message);const response=page.waitForResponse(r=>r.url().endsWith('/api/negotiate')&&r.request().method()==='POST');await click('Send message');const r=await response,d=await r.json();assert(r.ok(),JSON.stringify(d));fs.writeFileSync(`qa/live-${kind}-response.json`,JSON.stringify(d,null,2));console.log(JSON.stringify({kind,reply:d.reply,proposal:d.negotiation.proposal,accepted:d.negotiation.accepted}));assert.equal(d.negotiation.proposal,kind);assert.equal(d.negotiation.accepted,d.negotiation.version);
  await page.getByText(d.reply.text,{exact:true}).waitFor();await snap(`${kind}-ai`);await click('Review the agreement');
  if(kind==='public'){await click('Put this agreement to Nora');await snap('public-consent');}
  await click(kind==='public'?'Cue the duet':'Cue Lia’s single');await snap(`${kind}-performance`);await click('See what changed');await snap(`${kind}-reveal`);
  assert(!/[àèéíòóúç]/i.test(d.reply.text));
  const saved=await page.evaluate(()=>JSON.parse(localStorage.getItem('perspectives-concert-v2-en')));delete saved.token;assert.equal(saved.ending,kind);assert.equal(errors.length,0);
  results.push({kind,scope:'Live browser journey and real OpenAI generation',errors,...saved});console.log(JSON.stringify({kind,passed:true,model:d.diagnostic.model,reply:d.reply.text,latencyMs:d.diagnostic.latencyMs,calls:d.diagnostic.attempts.length}));await context.close();
 }
 fs.writeFileSync('qa/live-journeys-results.json',JSON.stringify(results,null,2));await browser.close();
})().catch(e=>{console.error(e);process.exit(1)});
