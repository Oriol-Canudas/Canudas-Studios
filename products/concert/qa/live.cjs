const {chromium}=require(process.env.QA_PLAYWRIGHT||'playwright');
const assert=require('node:assert/strict'),fs=require('fs');
(async()=>{
 const browser=await chromium.launch({headless:true,executablePath:process.env.QA_CHROME||undefined});const context=await browser.newContext({viewport:{width:390,height:844},reducedMotion:'reduce'});const page=await context.newPage();const errors=[];page.on('pageerror',e=>errors.push(e.message));
 const click=name=>page.getByRole('button',{name,exact:true}).click();
 await page.goto('https://gamex-concert.vercel.app');await click('Enter backstage');await click('Go backstage');await page.locator('.contact').filter({hasText:'Nora, wait.'}).click();await click('What don’t you want the audience to assume?');await click('What conditions can I take back to her?');await click('I’ll share only your professional conditions.');await click('Prepare an agreement with Lia');await click('Talk to Lia');await page.locator('#message').waitFor();
 const messages=[
  'El single pot esperar demà. Avui feu la cançó que vau escriure juntes, com un comiat professional públic. Reconeix que Nora deixa el projecte, dona-li el crèdit que li pertoca i no prometis continuar ni expliquis res íntim. La vostra història no era una mentida: acabar també pot ser cuidar-la.',
  'Sí, exactament així. Accepto que perdem l’estrena del single. Agraïm l’autoria de totes dues i diem que tanquem aquesta etapa, sense detalls privats ni promeses de gira. És un final honest, no negar el que heu viscut.'
 ];
 for(const message of messages){
  await page.locator('#message').fill(message);
  const response=page.waitForResponse(r=>r.url().endsWith('/api/negotiate')&&r.request().method()==='POST');await click('Send message');const r=await response;const d=await r.json();
  console.log(JSON.stringify({status:r.status(),reply:d.reply,error:d.error,proposal:d.negotiation?.proposal,accepted:d.negotiation?.accepted,version:d.negotiation?.version,terms:d.negotiation?.terms,diagnostic:d.diagnostic}));
  if(!r.ok()){await page.screenshot({path:'qa/live-error.png'});throw Error('Live AI failed '+JSON.stringify(d));}
  await page.getByRole('button',{name:'Review the agreement',exact:true}).waitFor();await page.waitForTimeout(500);
  if(d.negotiation.accepted===d.negotiation.version&&d.negotiation.proposal)break;
 }
 await page.screenshot({path:'qa/06-live-ai.png'});await click('Review the agreement');
 if(await page.getByRole('button',{name:'Put this agreement to Nora',exact:true}).count())await click('Put this agreement to Nora');
 await page.screenshot({path:'qa/07-live-agreement.png'});await click('Cue the duet');await page.screenshot({path:'qa/08-live-ending.png'});await click('See what changed');await page.screenshot({path:'qa/09-live-reveal.png'});
 const saved=await page.evaluate(()=>JSON.parse(localStorage.getItem('perspectives-concert-v2-en')));delete saved.token;fs.writeFileSync('qa/live-public-results.json',JSON.stringify({errors,...saved},null,2));assert.equal(saved.ending,'public');assert.equal(errors.length,0);
 await browser.close();console.log('Live public duet journey passed');
})().catch(e=>{console.error(e.message);process.exit(1)});
