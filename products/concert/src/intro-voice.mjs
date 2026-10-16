import manifest from '../public/audio/intro-v1/manifest.json' with {type:'json'};
export const INTRO_CLIPS=manifest.clips;
// One source at a time; each beat owns its loader, clock and completion timer.
export function createIntroVoice(ctx,output,{duck=()=>{},notify=()=>{},fetcher=fetch,timeoutMs=8000}={}){
 let beat=null,version=0,buffer=null,source=null,abort=null,timer=null,playing=false,offset=0,elapsed=0,clock=null,sourceAt=0,state='idle',error=null;
 const cache=new Map();
 const position=()=>Math.min(buffer?.duration||Infinity,offset+(source?Math.max(0,ctx.currentTime-sourceAt):0));
 const reading=()=>elapsed+(clock===null?0:Math.max(0,ctx.currentTime-clock));
 let readSeconds=0;
 const status=()=>({beat,state,error,position:position(),duration:buffer?.duration||0,elapsed:reading(),playing,activeSources:source?1:0});
 const emit=()=>notify(status());
 function stop(){if(source){offset=position();source.onended=null;source.stop();source.disconnect();source=null;}duck(false);}
 function freeze(){if(clock!==null){elapsed=reading();clock=null;}clearTimeout(timer);timer=null;stop();}
 function completeLater(){
  clearTimeout(timer);timer=null;if(!playing||!['ended','error'].includes(state))return;
  const remaining=Math.max(0,readSeconds-reading());
  if(remaining>.01){timer=setTimeout(completeLater,remaining*1000);return;}
  state='complete';emit();
 }
 function start(){
  if(!playing||!buffer||source||['ended','complete'].includes(state))return;
  if(offset>=buffer.duration){state='ended';emit();completeLater();return;}
  const current=version,node=ctx.createBufferSource();node.buffer=buffer;node.connect(output);source=node;sourceAt=ctx.currentTime;state='playing';duck(true);
  node.onended=()=>{if(current!==version||source!==node)return;offset=buffer.duration;source=null;node.disconnect();duck(false);state='ended';emit();completeLater();};
  node.start(0,offset);emit();
 }
 function setPlaying(value){
  if(playing===value)return;playing=value;
  if(!value){freeze();if(state==='playing')state='paused';emit();return;}
  clock=ctx.currentTime;if(buffer&&!['ended','complete'].includes(state))start();else completeLater();emit();
 }
 async function load(current,index){
  const controller=new AbortController();abort=controller;let deadline;
  try{
   const work=(async()=>{if(cache.has(index))return cache.get(index);const r=await fetcher('/audio/intro-v1/'+INTRO_CLIPS[index].filename,{signal:controller.signal});if(!r.ok)throw Error('load');const decoded=await ctx.decodeAudioData(await r.arrayBuffer());cache.set(index,decoded);return decoded;})();
   const decoded=await Promise.race([work,new Promise((_,reject)=>{deadline=setTimeout(()=>{controller.abort();reject(Error('timeout'));},timeoutMs);})]);
   if(current!==version)return;buffer=decoded;state=playing?'ready':'paused';emit();start();
  }catch(e){if(current!==version)return;error='This voice could not load. Captions and navigation still work.';state='error';emit();completeLater();}
  finally{clearTimeout(deadline);if(current===version)abort=null;}
 }
 function line(index,readingMs,force=false){
  if(index===beat&&!force)return;
  version++;abort?.abort();abort=null;freeze();beat=index;buffer=null;offset=0;elapsed=0;clock=playing?ctx.currentTime:null;error=null;readSeconds=readingMs/1000;
  state=index===null?'idle':'loading';emit();if(index!==null)void load(version,index);
 }
 return {line,setPlaying,status,retry(){if(beat!==null)line(beat,readSeconds*1000,true);},cancel(){setPlaying(false);line(null,0);}};
}
