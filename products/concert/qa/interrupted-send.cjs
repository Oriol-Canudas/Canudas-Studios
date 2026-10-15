const {chromium}=require(process.env.QA_PLAYWRIGHT||'playwright');
const fs=require('node:fs'),assert=require('node:assert/strict');
(async()=>{
 const {initialPrep,reducePrep,initialNegotiation,BUILD,negotiationOpening}=await import('../src/engine.mjs');
 const prep=['visit:lia','cost','listen'].reduce(reducePrep,initialPrep());
 const browser=await chromium.launch({executablePath:process.env.QA_CHROME||undefined,headless:true});
 try{
 const results=[];
 for(const scenario of [{name:'newer-draft',draft:'A newer draft must survive.'},{name:'no-draft',draft:''},{name:'legacy',draft:'A newer draft must survive.',legacy:true}]){
 const page=await browser.newPage({viewport:{width:390,height:844},reducedMotion:'reduce'});
 const errors=[];page.on('pageerror',e=>errors.push(e.message));
 let posts=[],release;const reply='Controlled validated reply.';
 await page.route('**/api/negotiate',async route=>{
  if(route.request().method()==='GET')return route.fulfill({json:{available:true}});
  const body=route.request().postDataJSON();
  if(body.action==='start')return route.fulfill({json:{token:'fixture-token',negotiation:initialNegotiation(),opening:negotiationOpening(prep)}});
  posts.push(body);
  if(posts.length===1)await new Promise(r=>{release=r});
  await route.fulfill({json:{token:'next-token',negotiation:{...initialNegotiation(),turns:1},reply:{text:reply},diagnostic:{source:'mock'}}}).catch(()=>{});
 });
 const read=()=>page.evaluate(()=>JSON.parse(localStorage.getItem('perspectives-concert-v2-en')));
 await page.goto(process.env.QA_URL||'http://127.0.0.1:8785');
 await page.evaluate(({prep,BUILD})=>localStorage.setItem('perspectives-concert-v2-en',JSON.stringify({build:BUILD,screen:'brief',prep})),{prep,BUILD});await page.reload();
 await page.getByRole('button',{name:'Talk to Lia',exact:true}).click();
 const original='Please keep this interrupted message.',draft=scenario.draft;
 await page.locator('#message').fill(original);await page.getByRole('button',{name:'Send message',exact:true}).click();
 await page.getByRole('status').waitFor();await page.waitForFunction(()=>JSON.parse(localStorage.getItem('perspectives-concert-v2-en')).sendRequest?.requestId);
 await page.locator('#message').fill(draft);await page.waitForFunction(draft=>JSON.parse(localStorage.getItem('perspectives-concert-v2-en')).draft===draft,draft);
 const before=await read();assert.equal(posts.length,1);
 if(scenario.legacy)await page.evaluate(()=>{const key='perspectives-concert-v2-en',save=JSON.parse(localStorage.getItem(key));delete save.sendRequest;localStorage.setItem(key,JSON.stringify(save));});
 await page.reload();await page.getByRole('button',{name:'Retry saved message',exact:true}).waitFor();
 assert.equal(await page.getByText('Sending…',{exact:true}).count(),0);assert.equal(await page.getByRole('status').count(),0);
 assert.equal(await page.getByText('Delivery unconfirmed · no reply applied',{exact:true}).count(),1);
 const recovered=await read();
 for(const key of ['prep','negotiation','token','confirmed','admitted','reviewLines','ending','diagnostics','draft'])assert.deepEqual(recovered[key],before[key]);
 assert.deepEqual(recovered.sendRequest,before.sendRequest);assert.equal(posts.length,1);
 // A second reload is still passive and the late original reply cannot mutate the new page.
 await page.reload();await page.getByRole('button',{name:'Retry saved message',exact:true}).waitFor();release();
 assert.equal(posts.length,1);assert.equal((await read()).negotiation.turns,0);assert.equal(await page.locator('#message').inputValue(),draft);
 await page.screenshot({path:`qa/interrupted-send-${scenario.name}-recovered.png`});
 await page.getByRole('button',{name:'Retry saved message',exact:true}).click();await page.getByText(reply,{exact:true}).waitFor();
 await page.waitForFunction(()=>JSON.parse(localStorage.getItem('perspectives-concert-v2-en')).negotiation.turns===1);
 assert.equal(posts.length,2);for(const key of ['token','message','requestId'])assert.equal(posts[1][key],posts[0][key]);
 assert.equal(await page.locator('.chat-message.player').count(),1);assert.equal(await page.getByText(reply,{exact:true}).count(),1);
 assert.equal(await page.locator('#message').inputValue(),draft);
 const completed=await read();assert.equal(completed.sendRequest,null);assert.equal(completed.diagnostics.length,1);assert.deepEqual(completed.prep,before.prep);assert.equal(completed.confirmed,before.confirmed);assert.equal(completed.admitted,before.admitted);
 await page.reload();await page.locator('#message').waitFor();assert.equal(posts.length,2);assert.equal((await read()).negotiation.turns,1);assert.equal(await page.locator('.chat-message.player').count(),1);
 assert.deepEqual(errors,[]);await page.screenshot({path:`qa/interrupted-send-${scenario.name}-complete.png`});
 results.push({scenario:scenario.name,posts,before,recovered,completed,errors});await page.close();
 }
 fs.writeFileSync('qa/interrupted-send-results.json',JSON.stringify({pass:true,scope:'Controlled route-held response; static local preview; no model calls',checks:['newer draft, no draft and legacy save scenarios','two reloads do not auto-send or change story/consent/turns','delivery unconfirmed without permanent Sending','explicit retry reuses original message token and ID','one bubble, one reply and one validated fixture turn'],results},null,2));
 console.log('Interrupted-send recovery checks passed');
 }finally{await browser.close();}
})().catch(error=>{console.error(error);process.exitCode=1});
