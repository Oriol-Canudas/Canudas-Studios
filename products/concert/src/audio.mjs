// Original synthesized atmosphere and short musical motif; no third-party recordings.
let ctx,master,noise;
export function setSound(on){
 if(!ctx){const Audio=globalThis.AudioContext||globalThis.webkitAudioContext;if(!Audio)return;ctx=new Audio();master=ctx.createGain();master.gain.value=0;master.connect(ctx.destination);
  const buffer=ctx.createBuffer(1,ctx.sampleRate*3,ctx.sampleRate);const data=buffer.getChannelData(0);for(let i=0;i<data.length;i++)data[i]=(Math.random()*2-1)*0.07;
  noise=ctx.createBufferSource();noise.buffer=buffer;noise.loop=true;const filter=ctx.createBiquadFilter();filter.type='lowpass';filter.frequency.value=700;noise.connect(filter);filter.connect(master);noise.start();
 }
 ctx.resume();master.gain.setTargetAtTime(on?0.35:0,ctx.currentTime,0.4);
}
export function motif(duet){if(!ctx||master.gain.value<.01)return;const notes=duet?[220,261.63,329.63,293.66,261.63,220]:[220,329.63,392,349.23,329.63,440];notes.forEach((f,i)=>{const o=ctx.createOscillator(),g=ctx.createGain();o.type='sine';o.frequency.value=f;o.connect(g);g.connect(master);const t=ctx.currentTime+i*.85;g.gain.setValueAtTime(0,t);g.gain.linearRampToValueAtTime(.2,t+.04);g.gain.exponentialRampToValueAtTime(.001,t+1.8);o.start(t);o.stop(t+1.9);});}
