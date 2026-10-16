import {createIntroVoice} from './intro-voice.mjs';
// Cinematic score bed with separate, occasional audience calls.
const ASSET='/audio/cinematic-score-v1.mp3';
const CROWD='/audio/encore-call-v2.mp3';
const VOLUME_KEY='perspectives-concert-volume';
let voice,voiceBus,voiceActive=false;const voiceListeners=new Set();
let ctx,master,musicBus,analyser,buffer,crowdBuffer,loading,timer,nextStart=0,enabled=false,captureMuted=false,scene='cover',hidden=false,scheduled=0;
const audiencePlayed=new Set();let lastAudienceAt=-Infinity,lastCue=null,cheerSource=null,cheerUntil=0;
export function getVolume(){try{const raw=localStorage.getItem(VOLUME_KEY);return raw===null?.6:Math.max(0,Math.min(1,Number(raw)||0));}catch{return .6;}}
let volume=getVolume();
const sceneGain=()=>voiceActive&&scene==='opening'?.12:ctx && ctx.currentTime<cheerUntil ? .15 : (['dialogue','brief','ai','review','reveal'].includes(scene) ? .45 : .8);
function mix(){if(!ctx)return;master.gain.cancelScheduledValues(ctx.currentTime);master.gain.setTargetAtTime(enabled&&!hidden&&!captureMuted?volume:0,ctx.currentTime,enabled&&!hidden?.15:.03);musicBus.gain.cancelScheduledValues(ctx.currentTime);musicBus.gain.setTargetAtTime(sceneGain(),ctx.currentTime,voiceActive?.06:.5);}
// Capture mute changes the live mixer only; it never overwrites the player's preference.
export function setCaptureMuted(value){captureMuted=!!value;mix();if(ctx&&captureMuted){master.gain.cancelScheduledValues(ctx.currentTime);master.gain.setValueAtTime(0,ctx.currentTime);}}
export function setVolume(value){volume=Math.max(0,Math.min(1,Number(value)||0));try{localStorage.setItem(VOLUME_KEY,String(volume));}catch{}mix();}
export function setAudioScene(value,isHidden=false){scene=value;hidden=isHidden;mix();}
function schedule(){
 if(!buffer||ctx.state!=='running')return;
 if(nextStart<ctx.currentTime)nextStart=ctx.currentTime+.05;
 if(nextStart>ctx.currentTime+.5)return;
 const source=ctx.createBufferSource(),envelope=ctx.createGain();source.buffer=buffer;
 source.connect(envelope);envelope.connect(musicBus);
 const start=nextStart,end=start+buffer.duration,fade=1.2;
 envelope.gain.setValueAtTime(0,start);envelope.gain.linearRampToValueAtTime(1,start+fade);
 envelope.gain.setValueAtTime(1,end-fade);envelope.gain.linearRampToValueAtTime(0,end);
 source.start(start);source.stop(end);source.onended=()=>{source.disconnect();envelope.disconnect();};
 nextStart=end-fade;scheduled++;
}
function initialize(){
 const Audio=globalThis.AudioContext||globalThis.webkitAudioContext;if(!Audio)throw Error('Audio is not supported by this browser.');
 ctx=new Audio();master=ctx.createGain();master.gain.value=0;musicBus=ctx.createGain();musicBus.connect(master);analyser=ctx.createAnalyser();analyser.fftSize=2048;
 master.connect(analyser);analyser.connect(ctx.destination);voiceBus=ctx.createGain();voiceBus.connect(master);
 voice=createIntroVoice(ctx,voiceBus,{duck:value=>{voiceActive=value;mix();},notify:value=>voiceListeners.forEach(fn=>fn(value)),interlude:index=>index===5&&crowdBuffer?{buffer:crowdBuffer,output:master,envelope:audienceEnvelope}:null});
}
export async function setSound(on){
 if(!on)voice?.cancel();
 if(!ctx){if(!on)return false;initialize();}
 if(on){
  // Resume directly on the click, before waiting for the file: required by mobile browsers.
  await ctx.resume();if(ctx.state!=='running')throw Error('Tap Sound on to allow audio in this browser.');
  if(!buffer){
   if(!loading)loading=(async()=>{const decode=async url=>{const r=await fetch(url);if(!r.ok)throw Error('The concert soundtrack could not load. Tap Sound on to retry.');return ctx.decodeAudioData(await r.arrayBuffer());};[buffer,crowdBuffer]=await Promise.all([decode(ASSET),decode(CROWD).catch(()=>null)]);})().catch(e=>{loading=null;buffer=null;throw e;});
   await loading;
  }
  if(!timer){schedule();timer=setInterval(schedule,200);}
 }
 enabled=on;mix();return enabled;
}
export function audioStatus(){
 if(!ctx)return {state:'not_started',enabled:false,rms:0};
 const samples=new Float32Array(analyser.fftSize);analyser.getFloatTimeDomainData(samples);
 return {state:ctx.state,enabled,rms:Math.sqrt(samples.reduce((n,v)=>n+v*v,0)/samples.length),asset:ASSET,duration:buffer?.duration||0,crowdAsset:CROWD,crowdDuration:crowdBuffer?.duration||0,audienceCues:[...audiencePlayed],lastCue,musicGain:musicBus.gain.value,voice:voice?.status(),voiceGain:voiceBus?.gain.value,volume,scene,hidden,captureMuted,scheduled};
}

// Preserve the same crowd envelope when an opening interlude resumes mid-clip.
function audienceEnvelope(context,gain,offset,duration){
 const now=context.currentTime,points=[[0,0],[.6,.65],[duration-1.5,.65],[duration,0]];
 const next=points.findIndex(([time])=>time>offset);
 const [from,value]=points[Math.max(0,next-1)], [to,target]=points[next<0?points.length-1:next];
 gain.gain.setValueAtTime(to===from?target:value+(target-value)*(offset-from)/(to-from),now);
 for(const [time,level] of points)if(time>offset)gain.gain.linearRampToValueAtTime(level,now+time-offset);
}
export function cueAudience(id){
 if(!enabled||hidden||!crowdBuffer||ctx.state!=='running'||audiencePlayed.has(id)||ctx.currentTime-lastAudienceAt<20)return false;
 audiencePlayed.add(id);lastAudienceAt=ctx.currentTime;lastCue=id;
 const source=ctx.createBufferSource(),gain=ctx.createGain();source.buffer=crowdBuffer;source.connect(gain);gain.connect(master);
 const start=ctx.currentTime,end=start+crowdBuffer.duration;
 audienceEnvelope(ctx,gain,0,crowdBuffer.duration);
 cheerSource=source;cheerUntil=end;mix();source.start();
 source.onended=()=>{source.disconnect();gain.disconnect();if(cheerSource===source){cheerSource=null;cheerUntil=0;mix();}};return true;
}
export function resetAudienceCues(){audiencePlayed.clear();lastAudienceAt=-Infinity;lastCue=null;cheerSource?.stop();cheerUntil=0;mix();}

export function subscribeIntroVoice(listener){voiceListeners.add(listener);return()=>voiceListeners.delete(listener);}
export function setIntroVoice({beat,playing,readingMs}){if(!voice)return;if(beat===null){voice.cancel();return;}voice.line(beat,readingMs);voice.setPlaying(playing&&enabled&&!hidden);}
export function retryIntroVoice(){voice?.retry();}
export function stopIntroVoice(){voice?.cancel();}
