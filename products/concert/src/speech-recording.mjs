export const MAX_SECONDS=45,MAX_BYTES=2*1024*1024;
export function recordingMime(Recorder){return ['audio/webm;codecs=opus','audio/mp4','audio/webm'].find(type=>Recorder?.isTypeSupported?.(type))||null;}
export function appendTranscript(draft,text){const joined=[draft.trimEnd(),text.trim()].filter(Boolean).join('\n');return joined.length>1400?null:joined;}
const messages={NotAllowedError:'Microphone permission was denied. You can still type.',NotFoundError:'No microphone was found. You can still type.',NotReadableError:'The microphone is busy or unavailable. You can still type.',unsupported:'This browser cannot record audio. You can still type.',silent:'No speech was detected. Try again or type your reply.',too_large:'That recording is too large. Try a shorter clip.',session_expired:'This conversation can no longer accept recordings. You can still review your agreement.',turn_limit:'No conversation turns remain. Review your agreement.',empty_transcript:'No words were recognized. Try again or type your reply.',transcript_too_long:'That transcript is too long. Try a shorter recording.',transcription_timeout:'Transcription took too long. Your typed draft is safe; try again.',interrupted:'Recording was interrupted. Your typed draft is safe.',transcription_failed:'Could not transcribe that recording. Your typed draft is safe; try again.'};
const stopTracks=stream=>stream?.getTracks().forEach(track=>{track.onended=null;track.stop();});
export function createSpeechRecorder({notify=()=>{},onTranscript=()=>{},setCaptureMuted=()=>{},getToken=()=>null,mediaDevices=globalThis.navigator?.mediaDevices,Recorder=globalThis.MediaRecorder,Audio=globalThis.AudioContext||globalThis.webkitAudioContext,fetcher=globalThis.fetch,clock=()=>Date.now(),maxSeconds=MAX_SECONDS,timeoutMs=25000}={}){
 let epoch=0,state='idle',stream,recorder,meterContext,meter,tick,abort,deadline,chunks=[],bytes=0,started=0,heard=false;
 const emit=(status,extra={})=>{state=status;notify({status,seconds:Math.min(maxSeconds,Math.floor((clock()-started)/1000)),...extra});};
 const release=()=>{clearInterval(tick);tick=null;stopTracks(stream);stream=null;if(meterContext){void meterContext.close().catch(()=>{});meterContext=null;}meter=null;setCaptureMuted(false);};
 const cleanup=()=>{clearTimeout(deadline);abort?.abort();abort=null;const previous=recorder;recorder=null;if(previous&&previous.state!=='inactive'){previous.ondataavailable=null;previous.onstop=null;previous.onerror=null;try{previous.stop();}catch{}}release();chunks=[];bytes=0;};
 const cancel=(reason='')=>{epoch++;cleanup();emit(reason?'error':'idle',reason?{error:messages[reason]||messages.interrupted}:{});};
 const fail=(ticket,error)=>{if(ticket!==epoch)return;epoch++;cleanup();emit('error',{error:messages[error?.name]||messages[error?.message]||messages.transcription_failed});};
 async function upload(ticket,mime,seconds){
  const blob=new Blob(chunks,{type:mime});chunks=[];release();
  if(ticket!==epoch)return;
  if(!heard||blob.size<32||seconds<.25){fail(ticket,Error('silent'));return;}if(blob.size>MAX_BYTES){fail(ticket,Error('too_large'));return;}
  emit('transcribing');abort=new AbortController();const signal=abort.signal;
  try{
   const buffer=new Uint8Array(await blob.arrayBuffer());if(ticket!==epoch)return;
   let binary='';for(let i=0;i<buffer.length;i+=8192)binary+=String.fromCharCode(...buffer.subarray(i,i+8192));
   const work=(async()=>{const response=await fetcher('/api/transcribe',{method:'POST',headers:{'Content-Type':'application/json'},signal,body:JSON.stringify({token:getToken(),requestId:crypto.randomUUID(),audio:btoa(binary),mime,seconds})});const result=await response.json();if(!response.ok)throw Error(result.error||'transcription_failed');if(typeof result.text!=='string'||!result.text.trim())throw Error('empty_transcript');return result.text.trim();})();
   const text=await Promise.race([work,new Promise((_,reject)=>deadline=setTimeout(()=>{abort?.abort();reject(Error('transcription_timeout'));},timeoutMs))]);
   if(ticket!==epoch)return;clearTimeout(deadline);abort=null;const added=onTranscript(text);emit('ready',{added:added!==false});
  }catch(error){fail(ticket,error);}
 }
 async function start(){
  if(['permission','recording','transcribing'].includes(state))return;
  const mime=recordingMime(Recorder);if(!mime||!mediaDevices?.getUserMedia||!Audio){emit('error',{error:messages.unsupported});return;}
  const ticket=++epoch;started=clock();emit('permission');
  try{
   const acquired=await mediaDevices.getUserMedia({audio:{echoCancellation:true,noiseSuppression:true},video:false});
   if(ticket!==epoch){stopTracks(acquired);return;}stream=acquired;
   setCaptureMuted(true);meterContext=new Audio();await meterContext.resume();if(ticket!==epoch)return;
   meter=meterContext.createAnalyser();meter.fftSize=1024;meterContext.createMediaStreamSource(stream).connect(meter);
   recorder=new Recorder(stream,{mimeType:mime,audioBitsPerSecond:64000});chunks=[];bytes=0;heard=false;started=clock();
   const samples=new Float32Array(meter.fftSize);
   const sample=()=>{if(!meter)return;meter.getFloatTimeDomainData(samples);if(Math.sqrt(samples.reduce((sum,v)=>sum+v*v,0)/samples.length)>.006)heard=true;};
   recorder.ondataavailable=event=>{if(ticket!==epoch||!event.data?.size)return;bytes+=event.data.size;if(bytes>MAX_BYTES){fail(ticket,Error('too_large'));return;}chunks.push(event.data);};
   recorder.onerror=()=>fail(ticket,Error('interrupted'));
   recorder.onstop=()=>{if(ticket===epoch)void upload(ticket,recorder?.mimeType||mime,Math.min(maxSeconds,(clock()-started)/1000));};
   stream.getTracks().forEach(track=>{track.onended=()=>cancel('interrupted');});
   recorder.start(250);sample();emit('recording');
   tick=setInterval(()=>{sample();if((clock()-started)/1000>=maxSeconds)stop();else emit('recording');},100);
  }catch(error){fail(ticket,error);}
 }
 function stop(){if(state!=='recording')return;clearInterval(tick);emit('transcribing');try{recorder.stop();}catch(error){fail(epoch,error);}release();}
 return {start,stop,cancel,status:()=>state};
}
