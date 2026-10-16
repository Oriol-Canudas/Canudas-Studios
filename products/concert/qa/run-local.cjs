// Only static preview + controlled browser fixtures. Never starts API middleware.
const {spawn}=require('node:child_process');
const path=require('node:path');
const root=path.resolve(__dirname,'..');
const suites=['browser','resilience','interrupted-send','agreement-exit','opening','opening-layout','hierarchy','encore','dialogue','cover','scenes','intro-voice','keyboard','speech-input','portrait','reply-reveal','authored-portrait'];
const requested=process.argv.slice(2);
if(requested.some(s=>!suites.includes(s)))throw Error('Unknown local QA suite');
const env={...process.env,QA_URL:'http://127.0.0.1:8796'};
for(const name of ['OPENAI_API_KEY','PerspectivesConcert','OPENAI_MODEL'])delete env[name];
const run=(cmd,args)=>new Promise((resolve,reject)=>{const child=spawn(cmd,args,{cwd:root,env,stdio:'inherit'});child.on('error',reject);child.on('exit',code=>code===0?resolve():reject(Error(`${cmd} exited ${code}`)));});
(async()=>{
 await run(process.execPath,[path.join(root,'node_modules/vite/bin/vite.js'),'build']);
 const server=spawn(process.execPath,[path.join(root,'node_modules/vite/bin/vite.js'),'preview','--host','127.0.0.1','--port','8796','--strictPort'],{cwd:root,env,stdio:['ignore','pipe','pipe']});
 let exited=false;server.on('exit',()=>{exited=true;});
 try{
  // Wait for OUR preview startup; never silently use another server occupying the port.
  await new Promise((resolve,reject)=>{const timeout=setTimeout(()=>reject(Error('Preview startup timeout')),15000);server.stdout.on('data',data=>{process.stdout.write(data);if(String(data).includes('127.0.0.1:8796')){clearTimeout(timeout);resolve();}});server.stderr.on('data',data=>process.stderr.write(data));server.once('error',e=>{clearTimeout(timeout);reject(e);});server.once('exit',code=>{clearTimeout(timeout);reject(Error(`Preview exited ${code}`));});});
  for(const suite of requested.length?requested:suites){if(exited)throw Error('Preview stopped');await run(process.execPath,[`qa/${suite}.cjs`]);}
 }finally{server.kill('SIGTERM');}
})().catch(error=>{console.error(error);process.exitCode=1;});
