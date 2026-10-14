// Generated distant audience recording; no synthetic noise or continuous tones.
const ASSET='/audio/backstage-crowd-v1.mp3';
const VOLUME_KEY='perspectives-concert-volume';
let ctx,master,analyser,buffer,loading,timer,nextStart=0,enabled=false,scene='cover',hidden=false,scheduled=0;
export function getVolume(){try{const raw=localStorage.getItem(VOLUME_KEY);return raw===null?.6:Math.max(0,Math.min(1,Number(raw)||0));}catch{return .6;}}
let volume=getVolume();
const sceneGain=()=>hidden?0:['dialogue','brief','ai','review','reveal'].includes(scene)?.28:.65;
function mix(){if(!ctx)return;master.gain.cancelScheduledValues(ctx.currentTime);master.gain.setTargetAtTime(enabled?volume*sceneGain():0,ctx.currentTime,.35);}
export function setVolume(value){volume=Math.max(0,Math.min(1,Number(value)||0));try{localStorage.setItem(VOLUME_KEY,String(volume));}catch{}mix();}
export function setAudioScene(value,isHidden=false){scene=value;hidden=isHidden;mix();}
function schedule(){
 if(!buffer||ctx.state!=='running')return;
 if(nextStart<ctx.currentTime)nextStart=ctx.currentTime+.05;
 if(nextStart>ctx.currentTime+.5)return;
 const source=ctx.createBufferSource(),envelope=ctx.createGain();source.buffer=buffer;
 source.connect(envelope);envelope.connect(master);
 const start=nextStart,end=start+buffer.duration,fade=1.2;
 envelope.gain.setValueAtTime(0,start);envelope.gain.linearRampToValueAtTime(1,start+fade);
 envelope.gain.setValueAtTime(1,end-fade);envelope.gain.linearRampToValueAtTime(0,end);
 source.start(start);source.stop(end);source.onended=()=>{source.disconnect();envelope.disconnect();};
 nextStart=end-fade;scheduled++;
}
function initialize(){
 const Audio=globalThis.AudioContext||globalThis.webkitAudioContext;if(!Audio)throw Error('Audio is not supported by this browser.');
 ctx=new Audio();master=ctx.createGain();master.gain.value=0;analyser=ctx.createAnalyser();analyser.fftSize=2048;
 master.connect(analyser);analyser.connect(ctx.destination);
}
export async function setSound(on){
 if(!ctx){if(!on)return false;initialize();}
 if(on){
  // Resume directly on the click, before waiting for the file: required by mobile browsers.
  await ctx.resume();if(ctx.state!=='running')throw Error('Tap Sound on to allow audio in this browser.');
  if(!buffer){
   if(!loading)loading=(async()=>{const r=await fetch(ASSET);if(!r.ok)throw Error('The concert ambience could not load. Tap Sound on to retry.');buffer=await ctx.decodeAudioData(await r.arrayBuffer());})().catch(e=>{loading=null;throw e;});
   await loading;
  }
  if(!timer){schedule();timer=setInterval(schedule,200);}
 }
 enabled=on;mix();return enabled;
}
export function audioStatus(){
 if(!ctx)return {state:'not_started',enabled:false,rms:0};
 const samples=new Float32Array(analyser.fftSize);analyser.getFloatTimeDomainData(samples);
 return {state:ctx.state,enabled,rms:Math.sqrt(samples.reduce((n,v)=>n+v*v,0)/samples.length),asset:ASSET,duration:buffer?.duration||0,volume,scene,hidden,scheduled};
}
