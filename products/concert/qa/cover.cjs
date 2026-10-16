// Cover-only rendered checks and entry journey; all API requests blocked locally.
const {chromium}=require(process.env.QA_PLAYWRIGHT||'playwright'),assert=require('node:assert/strict'),fs=require('node:fs');
(async()=>{
 const browser=await chromium.launch({headless:true,executablePath:process.env.QA_CHROME||undefined}),results=[];
 try{
 for(const size of [{width:906,height:1058},{width:1440,height:1000},{width:390,height:844},{width:390,height:480}]){
  const page=await browser.newPage({viewport:size,reducedMotion:'reduce'}),errors=[],posts=[];page.on('pageerror',e=>errors.push(e.message));
  await page.route('**/api/negotiate',r=>{if(r.request().method()==='POST')posts.push(r.request().postDataJSON());return r.fulfill({json:{available:false}});});
  await page.goto(process.env.QA_URL||'http://127.0.0.1:8796');await page.evaluate(()=>document.fonts.ready);await page.evaluate(()=>Promise.all([...document.images].map(i=>i.decode().catch(()=>{}))));
  // Resize/visualViewport effects must settle before recording comparable geometry.
  await page.waitForFunction(height=>parseFloat(getComputedStyle(document.documentElement).getPropertyValue('--app-height'))===height,size.height);
  const geometry=await page.evaluate(()=>{const box=selector=>{const r=document.querySelector(selector).getBoundingClientRect();return {x:r.x,y:r.y,width:r.width,height:r.height};};return {cover:box('.cover'),stage:box('.stage'),shell:box('.shell'),copy:box('.cover-copy'),cta:box('.cover-copy .btn'),grid:getComputedStyle(document.querySelector('.shell')).gridTemplateColumns,scroll:document.documentElement.scrollWidth,viewport:innerWidth};});
  assert(geometry.scroll<=size.width);assert.equal(await page.locator('.cover h1:visible').count(),1);assert.equal(await page.locator('.desktop-art h2:visible').count(),0);assert.equal(await page.locator('.cover>img:visible').count(),1);assert(!await page.locator('.desktop-art').isVisible());
  if(size.width>900){assert.equal(geometry.stage.width,geometry.shell.width);assert(geometry.copy.width<=520);assert(geometry.cta.width<=424);assert(geometry.copy.width<geometry.cover.width*.65);assert(geometry.grid.split(' ').length===1);}
  if(size.width===390&&size.height===844){assert.equal(geometry.cover.x,1);assert.equal(geometry.cover.width,388);assert.equal(geometry.cover.height,784);}
  await page.screenshot({path:`qa/cover-${size.width}x${size.height}.png`});
  const enter=page.getByRole('button',{name:'Enter backstage',exact:true});await enter.scrollIntoViewIfNeeded();const b=await enter.boundingBox();assert(b.y>=0&&b.y+b.height<=size.height+1);await page.screenshot({path:`qa/cover-${size.width}x${size.height}-cta.png`});await enter.click();await page.locator('.opening').waitFor();
  if(size.width>900){assert(await page.locator('.desktop-art').isVisible());const columns=await page.locator('.shell').evaluate(el=>getComputedStyle(el).gridTemplateColumns);assert.equal(columns.split(' ').length,2);}
  await page.getByRole('button',{name:'Go backstage',exact:true}).click();await page.locator('.contacts .contact').filter({hasText:'Nora, wait.'}).click();assert(await page.getByRole('region',{name:'Nora says'}).isVisible());
  if(size.width>900)assert(await page.locator('.desktop-art').isVisible());
  assert.deepEqual(posts,[]);assert.deepEqual(errors,[]);results.push({size,pass:true,geometry,journey:'Enter→opening→hub→Nora',posts:posts.length,errors});await page.close();
 }
 fs.writeFileSync('qa/cover-results.json',JSON.stringify({pass:true,scope:'Local static preview; API blocked; desktop single-cover and unchanged mobile geometry',results},null,2));console.log('Single desktop cover, mobile geometry and four entry journeys: PASS');
 }finally{await browser.close();}
})().catch(e=>{console.error(e);process.exitCode=1;});
