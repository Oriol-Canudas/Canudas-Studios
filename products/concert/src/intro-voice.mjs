import manifest from '../public/audio/intro-v1/manifest.json' with {type:'json'};
export const INTRO_CLIPS=manifest.clips;
// One source at a time; each beat owns its loader, clock and completion timer.
export function createIntroVoice(ctx,output,{duck=()=>{},notify=()=>{},fetcher=fetch,timeoutMs=8000,interlude=()=>null}={}){
 let beat=null,version=0,buffer=null,source=null,abort=null,timer=null,playing=false,offset=0,elapsed=0,clock=null,sourceAt=0,state='idle',error=null,phase='voice',interludeSpec=null,envelope=null;
 const cache=new Map();
 const position=()=>Math.min(buffer?.duration||Infinity,offset+(source?Math.max(0,ctx.currentTime-sourceAt):0));
 const reading=()=>elapsed+(clock===null?0:Math.max(0,ctx.currentTime-clock));
 let readSeconds=0;
 const status=()=>({beat,state,error,phase,position:position(),duration:buffer?.duration||0,elapsed:reading(),playing,activeSources:source?1:0});
 const emit=()=>notify(status());
 function stop(){if(source){offset=position();source.onended=null;try{source.stop();}catch{}source.disconnect();source=null;}envelope?.disconnect();envelope=null;duck(false);}
 function freeze(){if(clock!==null){elapsed=reading();clock=null;}clearTimeout(timer);timer=null;stop();}
 function completeLater(){
  clearTimeout(timer);timer=null;if(!playing||!['ended','error'].includes(state))return;
  const remaining=Math.max(0,readSeconds-reading());
  if(remaining>.01){timer=setTimeout(completeLater,remaining*1000);return;}
  state='complete';emit();
 }
 function ended(){state='ended';emit();completeLater();}
 function start(){
  if(!playing||!buffer||source||['ended','complete'].includes(state))return;
  if(offset>=buffer.duration){duck(false);ended();return;}
  const current=version,node=ctx.createBufferSource();node.buffer=buffer;source=node;sourceAt=ctx.currentTime;state='playing';
  try{
   if(phase==='crowd'){
    envelope=ctx.createGain();node.connect(envelope);envelope.connect(interludeSpec.output||output);
    interludeSpec.envelope(ctx,envelope,offset,buffer.duration);
   }else node.connect(output);
   duck(true);
   node.onended=()=>{
    if(current!==version||source!==node)return;
    offset=buffer.duration;source=null;node.disconnect();envelope?.disconnect();envelope=null;
    if(phase==='voice'){
     // The optional interlude belongs to this playback, not the next story beat.
     try{interludeSpec=interlude(beat);}catch{interludeSpec=null;}
     if(interludeSpec?.buffer){phase='crowd';buffer=interludeSpec.buffer;offset=0;start();return;}
    }
    duck(false);ended();
   };
   node.start(0,offset);emit();
  }catch(e){
   stop();if(phase!=='crowd')throw e;
   // A missing/failed optional audience cue must never block the captions.
   ended();
  }
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
  version++;abort?.abort();abort=null;freeze();beat=index;buffer=null;offset=0;elapsed=0;clock=playing?ctx.currentTime:null;error=null;phase='voice';interludeSpec=null;readSeconds=readingMs/1000;
  state=index===null?'idle':'loading';emit();if(index!==null)void load(version,index);
 }
 return {line,setPlaying,status,retry(){if(beat!==null)line(beat,readSeconds*1000,true);},cancel(){setPlaying(false);line(null,0);}};
}
