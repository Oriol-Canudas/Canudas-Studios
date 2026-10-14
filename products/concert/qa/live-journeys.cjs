const {chromium}=require(process.env.QA_PLAYWRIGHT||'playwright');
const fs=require('fs'),assert=require('node:assert/strict');
(async()=>{
 const browser=await chromium.launch({headless:true,executablePath:process.env.QA_CHROME||undefined});const results=[];
 for(const kind of ['public','solo']){
  const context=await browser.newContext({viewport:{width:390,height:844},reducedMotion:'reduce'}),page=await context.newPage();const errors=[];page.on('pageerror',e=>errors.push(e.message));
  const click=name=>page.getByRole('button',{name,exact:true}).click();
  const snap=async name=>{await page.evaluate(()=>Promise.all([...document.images].map(i=>i.decode().catch(()=>{}))));await page.screenshot({path:`qa/${name}.png`});};
  await page.goto('https://gamex-concert.vercel.app');await click('Entrar al backstage');await click('Anar al conflicte');
  if(kind==='public'){
   await page.locator('.contact').filter({hasText:'Nora, espera.'}).click();await click('Què no vols que el públic entengui?');await click('Quines condicions vols que li traslladi?');await click('Li trasllado només les teves condicions professionals.');
  }else{
   await page.locator('.contact').filter({hasText:'Lia, explica’m'}).click();await click('Què perds si avui no estrenes el single?');await click('Escoltaré què estaria disposada a fer ella.');
  }
  await click('Preparar un acord amb Lia');await click('Parlar amb Lia');await page.locator('#message').waitFor();
  const message=kind==='public'?'El single pot esperar demà. Avui feu la cançó que vau escriure juntes com un comiat professional públic. Digueu al públic que Nora deixa el projecte, reconeixeu l’autoria de totes dues, sense prometre continuar ni explicar res íntim. Acabar bé també pot ser cuidar el que heu viscut.':'Fes el single. Pots sortir sola sense esborrar Nora: agraeix les cançons que heu escrit juntes, sense inventar una malaltia ni dir que ella està d’acord amb tot. És la teva actuació, no una manera de castigar-la.';
  await page.locator('#message').fill(message);const response=page.waitForResponse(r=>r.url().endsWith('/api/negotiate')&&r.request().method()==='POST');await click('Enviar missatge');const r=await response,d=await r.json();assert(r.ok(),JSON.stringify(d));assert.equal(d.negotiation.proposal,kind);assert.equal(d.negotiation.accepted,d.negotiation.version);
  await page.getByText(d.reply.text,{exact:true}).waitFor();await snap(`${kind}-ai`);await click('Passar a l’acord');
  if(kind==='public'){await click('Presentar aquest acord a Nora');await snap('public-consent');}
  await click(kind==='public'?'Dona entrada al duet':'Dona entrada al single de Lia');await snap(`${kind}-performance`);await click('Veure què ha canviat');await snap(`${kind}-reveal`);
  const saved=await page.evaluate(()=>JSON.parse(localStorage.getItem('perspectives-concert-v1')));delete saved.token;assert.equal(saved.ending,kind);assert.equal(errors.length,0);
  results.push({kind,scope:'Live browser journey and real OpenAI generation',errors,...saved});console.log(JSON.stringify({kind,passed:true,model:d.diagnostic.model,reply:d.reply.text,latencyMs:d.diagnostic.latencyMs,calls:d.diagnostic.attempts.length}));await context.close();
 }
 fs.writeFileSync('qa/live-journeys-results.json',JSON.stringify(results,null,2));await browser.close();
})().catch(e=>{console.error(e);process.exit(1)});
