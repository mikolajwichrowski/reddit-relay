// One viewport coordinator for native videos, GIFs, and supported embedded players.
// Visibility callbacks initialize network-heavy players only when first visible.
export function visibleEnough(entry) {
 return entry.isIntersecting && entry.intersectionRect.height >= Math.min(160, entry.boundingClientRect.height * .45) && entry.intersectionRatio >= .15;
}
export function createPlayback({isMuted,onSoundChange,isBlocked=()=>false}) {
 const records=new Map();
 function active(record){return record.visible&&!document.hidden&&!isBlocked(record.node);}
 function update(record){record.setPlaying(active(record));}
 const observer=new IntersectionObserver(entries=>{for(const entry of entries){const record=records.get(entry.target);if(record){record.visible=visibleEnough(entry);update(record);}}},{threshold:[0,.15,.25,.45,.6,1],rootMargin:window.matchMedia('(max-width:720px)').matches?'-80px 0px -90px 0px':'-80px 0px 0px 0px'});
 const refresh=()=>records.forEach(update);
 document.addEventListener('visibilitychange',refresh);
 function register(node,setPlaying,setMuted=()=>{},dispose=()=>{}){
  const record={node,setPlaying,setMuted,dispose,visible:false};records.set(node,record);setMuted(isMuted());observer.observe(node);
  return ()=>{observer.unobserve(node);records.delete(node);setPlaying(false);dispose();};
 }
 function syncSound(){records.forEach(r=>r.setMuted(isMuted()));}
 function soundChanged(muted){if(muted!==isMuted()){onSoundChange(!muted);syncSound();}}
 function clear(root){for(const [node,r] of records)if(root.contains(node)){observer.unobserve(node);records.delete(node);r.setPlaying(false);r.dispose();}}
 return {register,refresh,syncSound,soundChanged,clear};
}
