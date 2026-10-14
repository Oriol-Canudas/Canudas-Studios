// Original, synthesized backstage atmosphere. No third-party recordings.
let ctx,master,analyser;
let enabled=false;
function note(frequency,at,duration=.8,volume=.15){
 const oscillator=ctx.createOscillator(),gain=ctx.createGain();
 oscillator.type='sine';oscillator.frequency.value=frequency;
 oscillator.connect(gain);gain.connect(master);
 gain.gain.setValueAtTime(0,at);gain.gain.linearRampToValueAtTime(volume,at+.04);
 gain.gain.exponentialRampToValueAtTime(.0001,at+duration);
 oscillator.start(at);oscillator.stop(at+duration+.1);
}
function initialize(){
 const Audio=globalThis.AudioContext||globalThis.webkitAudioContext;
 if(!Audio)throw Error('Audio is not supported by this browser.');
 ctx=new Audio();master=ctx.createGain();master.gain.value=0;
 analyser=ctx.createAnalyser();analyser.fftSize=1024;
 master.connect(analyser);analyser.connect(ctx.destination);
 const buffer=ctx.createBuffer(1,ctx.sampleRate*5,ctx.sampleRate),data=buffer.getChannelData(0);
 for(let i=0;i<data.length;i++)data[i]=(Math.random()*2-1)*.32;
 const crowd=ctx.createBufferSource(),filter=ctx.createBiquadFilter();
 crowd.buffer=buffer;crowd.loop=true;filter.type='lowpass';filter.frequency.value=1400;
 crowd.connect(filter);filter.connect(master);crowd.start();
 // Restrained musical tension beneath the crowd, with a slow breathing envelope.
 for(const [index,frequency] of [110,164.81,220].entries()){
  const oscillator=ctx.createOscillator(),gain=ctx.createGain(),lfo=ctx.createOscillator(),depth=ctx.createGain();
  oscillator.type='sine';oscillator.frequency.value=frequency;gain.gain.value=.035;
  lfo.frequency.value=.12+index*.025;depth.gain.value=.012;lfo.connect(depth);depth.connect(gain.gain);
  oscillator.connect(gain);gain.connect(master);oscillator.start();lfo.start();
 }
}
export async function setSound(on){
 if(!ctx){if(!on)return false;initialize();}
 if(on){await ctx.resume();if(ctx.state!=='running')throw Error('Tap Sound on to allow audio in this browser.');}
 enabled=on;master.gain.cancelScheduledValues(ctx.currentTime);
 master.gain.setTargetAtTime(on?.55:0,ctx.currentTime,.12);
 if(on){note(329.63,ctx.currentTime,.5,.13);note(440,ctx.currentTime+.2,.8,.10);}
 return enabled;
}
export function motif(duet){
 if(!ctx||!enabled)return;
 const notes=duet?[220,261.63,329.63,293.66,261.63,220]:[220,329.63,392,349.23,329.63,440];
 notes.forEach((f,i)=>note(f,ctx.currentTime+i*.85,1.8,.2));
}
// Useful for verifying a real running signal, rather than an optimistic UI toggle.
export function audioStatus(){
 if(!ctx)return {state:'not_started',enabled:false,rms:0};
 const samples=new Float32Array(analyser.fftSize);analyser.getFloatTimeDomainData(samples);
 return {state:ctx.state,enabled,rms:Math.sqrt(samples.reduce((n,v)=>n+v*v,0)/samples.length)};
}
