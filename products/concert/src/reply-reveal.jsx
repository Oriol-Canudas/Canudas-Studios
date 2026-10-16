import React,{useEffect,useLayoutEffect,useMemo,useRef,useState} from 'react';

// Presentation only. The complete utterance remains in the accessibility tree
// and defines its final layout; an aria-hidden copy is progressively uncovered.
export function ReplyReveal({lines,animate=false,completeNow=false,paragraphClass,onShown,heading,cue}){
 const textKey=lines.join('\u0000');
 const segments=useMemo(()=>{
  // If grapheme segmentation is unavailable, prefer readable complete text.
  if(!Intl.Segmenter)return null;
  const segmenter=new Intl.Segmenter('en',{granularity:'grapheme'});
  return lines.map(text=>[...segmenter.segment(text)].map(part=>({start:part.index,end:part.index+part.segment.length})));
 },[textKey]);
 const total=segments?.reduce((sum,line)=>sum+line.length,0)||0;
 const [count,setCount]=useState(()=>animate&&segments&&!completeNow&&!document.hidden&&!window.matchMedia('(prefers-reduced-motion: reduce)').matches?Math.min(1,total):total);
 const root=useRef(null),paragraphs=useRef([]),pointer=useRef(null),completed=useRef(count>=total);
 const revealing=count<total;
 const finish=()=>{if(document.activeElement?.classList.contains('reply-skip')&&root.current?.contains(document.activeElement))root.current.focus({preventScroll:true});completed.current=true;setCount(total);};
 useEffect(()=>{
  onShown?.();
  if(!revealing||completed.current)return;
  const motion=window.matchMedia('(prefers-reduced-motion: reduce)');
  const interrupt=()=>{if(document.hidden||motion.matches)finish();};
  motion.addEventListener('change',interrupt);document.addEventListener('visibilitychange',interrupt);
  let frame;const start=performance.now(),duration=Math.min(5800,total*20);
  const tick=now=>{if(completed.current)return;const next=Math.min(total,Math.max(1,Math.floor((now-start)/duration*total)));setCount(next);if(next<total)frame=requestAnimationFrame(tick);else completed.current=true;};
  frame=requestAnimationFrame(tick);
  return()=>{cancelAnimationFrame(frame);motion.removeEventListener('change',interrupt);document.removeEventListener('visibilitychange',interrupt);};
 },[]);
 useEffect(()=>{if(completeNow)finish();},[completeNow]);
 useLayoutEffect(()=>{
  if(!revealing)return;
  const mask=()=>{
   let remaining=count;
   paragraphs.current.forEach((paragraph,index)=>{
    if(!paragraph)return;
    const visual=paragraph.querySelector('.reply-visual'),copy=paragraph.querySelector('.reply-accessible');
    const visible=Math.min(remaining,segments[index].length);remaining-=visible;
    visual.dataset.visibleText=lines[index].slice(0,visible?segments[index][visible-1].end:0);
    if(!visible){visual.style.clipPath='inset(0 100% 100% 0)';return;}
    if(visible===segments[index].length){visual.style.clipPath='none';return;}
    // Measure the unbroken, fully typeset text. No per-letter spans, changing
    // word boundaries or width changes, even while a word is being revealed.
    const part=segments[index][visible-1],range=document.createRange();range.setStart(copy.firstChild,part.start);range.setEnd(copy.firstChild,part.end);
    const rect=range.getClientRects()[0],box=paragraph.getBoundingClientRect();
    if(!rect)return;
    const top=Math.max(0,rect.top-box.top),bottom=Math.min(box.height,rect.bottom-box.top),right=Math.max(0,rect.right-box.left);
    visual.style.clipPath=`polygon(0 0,100% 0,100% ${top}px,${right}px ${top}px,${right}px ${bottom}px,0 ${bottom}px)`;
   });
  };
  mask();const observer=new ResizeObserver(mask);paragraphs.current.forEach(p=>p&&observer.observe(p));
  let live=true;document.fonts?.ready.then(()=>{if(live)mask();});
  return()=>{live=false;observer.disconnect();};
 },[count,textKey,revealing]);
 const tap=e=>{
  if(!revealing||e.target.closest('button')||window.getSelection()?.toString().trim())return;
  const start=pointer.current;pointer.current=null;
  if(!start||start.moved||Math.hypot(e.clientX-start.x,e.clientY-start.y)>10||start.scroll?.scrollTop!==start.top)return;
  finish();
 };
 return <div className="reply-reveal" ref={root} tabIndex={-1} data-revealing={revealing?'true':'false'} onPointerDown={e=>{const scroll=e.currentTarget.closest('.content,.chat-log');pointer.current={x:e.clientX,y:e.clientY,scroll,top:scroll?.scrollTop,moved:false};}} onPointerMove={e=>{if(pointer.current&&Math.hypot(e.clientX-pointer.current.x,e.clientY-pointer.current.y)>10)pointer.current.moved=true;}} onPointerCancel={()=>{pointer.current=null;}} onClick={tap}>
  <div className="reply-heading">{heading}{revealing&&<button className="reply-skip" onClick={finish}>Show full reply</button>}</div>
  {cue}
  {lines.map((text,i)=><p key={i} className={`${paragraphClass} reply-paragraph`} ref={el=>{paragraphs.current[i]=el;}}><span className="reply-accessible">{text}</span>{revealing&&<span className="reply-visual" data-text={text} aria-hidden="true"/>}</p>)}
 </div>;
}

