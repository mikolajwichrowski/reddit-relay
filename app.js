import {decode, safeURL, mediaFor, listingURL} from './media.js';
import {demoPosts} from './demo.js';
import {icon,labelIcon} from './icons.js';
import {createPlayback} from './playback.js';
import {authorizationURL,readCallback,brokerStartURL,brokerExchangeURL} from './auth.js';
const $ = s => document.querySelector(s);
const KEY = 'relay.v1';
const defaults = {adult:false,blur:true,dark:false,compact:false,soundOn:false,communities:['EarthPorn','CozyPlaces','technology','AskReddit'],saved:[]};
let prefs = structuredClone(defaults);
try { const stored = JSON.parse(localStorage.getItem(KEY)); if(stored) prefs = validate(stored); } catch { /* Storage can be unavailable in private browsing. */ }
let feed='popular', sort='hot', query='', after='', posts=[], demo=false, savedView=false, controller, token='', installPrompt;
const TOKEN_KEY='relay.access-token';
let tokenExpiresAt=0,authNotice='',tokenRemembered=false;
try { token=localStorage.getItem(TOKEN_KEY)||'';tokenExpiresAt=Number(localStorage.getItem('relay.token-expires'))||0;if(tokenExpiresAt&&tokenExpiresAt<=Date.now()){token='';localStorage.removeItem(TOKEN_KEY);localStorage.removeItem('relay.token-expires');authNotice='Your Reddit token expired. Connect again in Settings.';} } catch {}
tokenRemembered=!!token;
let brokerNavigation=false;
const codeQuery=new URLSearchParams(location.search);
if((codeQuery.has('code')||codeQuery.has('error'))&&codeQuery.has('state')){
 history.replaceState(null,'',location.pathname+location.hash);
 try{const pending=JSON.parse(sessionStorage.getItem('relay.oauth-pending')||'null');const exchange=brokerExchangeURL(codeQuery.toString(),pending);if(exchange){brokerNavigation=true;location.replace(exchange);}}catch(error){sessionStorage.removeItem('relay.oauth-pending');authNotice=error.message;}
}
const callbackParams=new URLSearchParams(location.hash.slice(1));
if(callbackParams.has('access_token')||callbackParams.has('error')){
 history.replaceState(null,'',location.pathname+location.search);
 try{const pending=JSON.parse(sessionStorage.getItem('relay.oauth-pending')||'null');sessionStorage.removeItem('relay.oauth-pending');const result=readCallback('#'+callbackParams.toString(),pending);if(result){token=result.token;tokenExpiresAt=result.expiresAt;tokenRemembered=result.remember;if(result.remember){localStorage.setItem(TOKEN_KEY,token);localStorage.setItem('relay.token-expires',String(tokenExpiresAt));}else{localStorage.removeItem(TOKEN_KEY);localStorage.removeItem('relay.token-expires');}authNotice='Reddit connected. Your access token was received automatically.';}}catch(error){authNotice=error.message;}
}

const playback=createPlayback({isMuted:()=>!prefs.soundOn,onSoundChange:on=>{prefs.soundOn=on;persist();updateSoundButtons();},isBlocked:node=>!!document.querySelector('dialog[open]')&&!node.closest('dialog[open]')});
function updateSoundButtons(){
 for(const b of document.querySelectorAll('.sound-toggle,#feed-sound')){labelIcon(b,prefs.soundOn?'volume':'muted','');b.setAttribute('aria-label',prefs.soundOn?'Turn sound off':'Turn sound on');b.setAttribute('aria-pressed',String(prefs.soundOn));}
 $('#soundOn').checked=prefs.soundOn;
}
function toggleSound(){prefs.soundOn=!prefs.soundOn;persist();updateSoundButtons();playback.syncSound();playback.refresh();}
function validate(value) {
  if (!value || typeof value !== 'object') throw Error('Invalid data file.');
  return {...defaults,...Object.fromEntries(['adult','blur','dark','compact','soundOn'].map(k=>[k,value[k]===true])),communities:Array.isArray(value.communities)?value.communities.filter(x=>typeof x==='string'&&/^[\w]{2,21}$/.test(x)).slice(0,40):defaults.communities,saved:Array.isArray(value.saved)?value.saved.filter(p=>p&&typeof p.id==='string'&&typeof p.title==='string').slice(0,200):[]};
}
function persist() { try { localStorage.setItem(KEY,JSON.stringify(prefs)); } catch { $('#settings-status').textContent='Device storage is unavailable or full. Export your data to keep a copy.'; $('#status').textContent='Could not save to device storage. Your changes will last only this session.'; } $('#saved-count').textContent=prefs.saved.length; }
function element(tag, props={}, text='') {const e=document.createElement(tag);Object.assign(e,props);if(text)e.textContent=text;return e;}
function link(text,url,className='') {const a=element('a',{textContent:text,href:safeURL(url)||'https://www.reddit.com',target:'_blank',rel:'noopener noreferrer',className});return a;}
function original(p) {return p.permalink && /^\/r\//.test(p.permalink)?`https://www.reddit.com${p.permalink}`:safeURL(p.url)||'https://www.reddit.com';}
function applyPrefs() {const chrome=prefs.dark?'#111114':'#f2f2f7';document.documentElement.style.backgroundColor=chrome;document.documentElement.style.colorScheme=prefs.dark?'dark':'light';document.querySelector('meta[name="theme-color"]').content=chrome;document.querySelector('meta[name="apple-mobile-web-app-status-bar-style"]').content=prefs.dark?'black-translucent':'default';document.body.classList.toggle('dark',prefs.dark);document.body.classList.toggle('compact',prefs.compact);$('#layout').setAttribute('aria-pressed',String(prefs.compact));for(const k of ['adult','blur','dark','soundOn'])$('#'+k).checked=prefs[k];$('#saved-count').textContent=prefs.saved.length;renderCommunities();updateSoundButtons();}
function renderCommunities() {$('#communities').replaceChildren(...prefs.communities.map(name=>{const b=element('button',{},'r/  '+name);b.onclick=()=>navigate(name);return b;}));}
function navigate(name) {$('#community-sheet').close();window.scrollTo({top:0});feed=name;query='';$('#search').value='';savedView=false;demo=false;load();}
function heading() {$('#page-title').textContent=savedView?'Saved':query?`“${query}”`:feed==='popular'?'Popular':feed==='all'?'All of Reddit':`r/${feed}`;$('#subtitle').textContent=savedView?'Good finds, kept close. Saved on this device.':demo?'A sample of what’s out there. This is demo content.':'Find your next rabbit hole.';document.querySelectorAll('[data-feed]').forEach(b=>b.classList.toggle('active',!savedView&&b.dataset.feed===feed));$('#saved-nav').classList.toggle('active',savedView);$('#sort-tabs').hidden=savedView;$('#period').hidden=sort!=='top'||savedView;setOverlayTab();}
function message(text,canDemo=false) {const n=element('div',{className:'notice'},text);if(canDemo){const b=element('button',{},'Explore demo');b.onclick=showDemo;n.append(' ',b,link('Open on Reddit ↗',query?`https://www.reddit.com/search/?q=${encodeURIComponent(query)}`:`https://www.reddit.com/r/${encodeURIComponent(feed)}/`));}$('#status').replaceChildren(n);}
async function load(more=false) {
  controller?.abort();controller=new AbortController();const current=controller;
  if(!more){after='';posts=[];playback.clear($('#posts'));$('#posts').replaceChildren();} heading();$('#more').hidden=true;
  if(savedView){posts=prefs.saved;render();message(posts.length?'Saved posts are stored on this device.':'No saved posts yet. Tap “Save” on something you want to keep.');return;}
  message('Finding your next rabbit hole…');
  const timeout=setTimeout(()=>current.abort(),15000);
  try {
    const res=await fetch(listingURL({feed,sort,query,period:$('#period').value,after:more?after:'',adult:prefs.adult,authenticated:!!token}),{signal:current.signal,credentials:'omit',headers:token?{Authorization:`Bearer ${token}`}:{}});
    if(!res.ok)throw Error(res.status===401?'Your Reddit token expired. Open Settings and connect again.':`Reddit returned ${res.status}.`);
    const data=await res.json();if(!Array.isArray(data?.data?.children))throw Error('Reddit did not return a post listing.');
    const incoming=data.data.children.map(x=>x.data).filter(p=>p?.id&&p.title);
    const ids=new Set(posts.map(p=>p.id));posts.push(...incoming.filter(p=>!ids.has(p.id)));after=data.data.after||'';render();$('#status').textContent=posts.length?'':'No posts found. Try another search or community.';$('#more').hidden=!after;
  } catch(err) {if(current!==controller)return;message(navigator.onLine===false?'You’re offline. Saved posts and preferences are still available.':(err.message.includes('token expired')?err.message:'Live Reddit is unavailable. Reddit may require approved API access, or block this browser request. Try again later, open Reddit directly, or explore the demo.'),true);$('#more').hidden=!after;} finally {clearTimeout(timeout);}
}
function showDemo(){$('#community-sheet').close();controller?.abort();demo=true;savedView=false;query='';feed='popular';posts=demoPosts;after='';heading();render();message('DEMO · Illustrative posts, not a live Reddit feed. Search or choose a community for live content.');$('#more').hidden=true;}
function render() {playback.clear($('#posts'));const visible=posts.filter(p=>prefs.adult||!p.over_18);$('#posts').replaceChildren(...visible.map(card));if(posts.length&&!visible.length)message('These posts are marked 18+. Enable mature content in Preferences if you are 18 or older.');}
function card(p) {
  const article=element('article',{className:'post'}),content=element('div',{className:'post-content'}),meta=element('div',{className:'post-meta'});
  meta.append(element('span',{className:'community-dot'},'r/'),link(`r/${p.subreddit||'reddit'}`,`https://www.reddit.com/r/${encodeURIComponent(p.subreddit||'all')}/`),element('span',{},demo?'· demo':`· ${age(p.created_utc)}`));
  const title=element('button',{className:'title-button'});title.append(element('h3',{},p.title));title.onclick=()=>openPost(p);content.append(meta,title);
  for(const text of [p.over_18?'18+':null,p.spoiler?'Spoiler':null,p.link_flair_text].filter(Boolean))content.append(element('span',{className:'tag'},text),' ');
  if(p.selftext)content.append(element('p',{className:'post-summary'},p.selftext));article.append(content);
  const media=mediaFor(p);if(media.type!=='text')article.append(renderMedia(p,media,false));
  const actions=element('div',{className:'post-actions'});const score=element('span');labelIcon(score,'arrow',count(p.score));actions.append(score);const comments=labelIcon(element('button'),'comment',count(p.num_comments));comments.onclick=()=>openPost(p);const save=element('button',{className:'save'},prefs.saved.some(x=>x.id===p.id)?'Saved':'Save');save.prepend(icon('bookmark'));save.setAttribute('aria-pressed',String(prefs.saved.some(x=>x.id===p.id)));save.onclick=()=>{const exists=prefs.saved.some(x=>x.id===p.id);if(!exists&&prefs.saved.length>=200){message('Your local library holds 200 posts. Export or remove a saved post first.');return;}prefs.saved=exists?prefs.saved.filter(x=>x.id!==p.id):[p,...prefs.saved];persist();if(savedView)posts=prefs.saved;render();};const source=link('',original(p));source.append(icon('external'));source.setAttribute('aria-label','Open original post');actions.append(comments,source,save);article.append(actions);return article;
}
function count(n){return Intl.NumberFormat('en',{notation:'compact',maximumFractionDigits:1}).format(Number(n)||0);}
function age(time){const hours=Math.max(0,Math.floor((Date.now()/1000-(time||Date.now()/1000))/3600));return hours<1?'just now':hours<24?`${hours}h ago`:`${Math.floor(hours/24)}d ago`;}
function renderMedia(p,m,detail,revealed=false) {
 const box=element('div',{className:'media'});
 if(prefs.blur&&(p.over_18||p.spoiler)&&!revealed){const b=element('button',{className:'reveal'},`${p.over_18?'18+ content':'Spoiler'} · Tap to reveal`);b.onclick=()=>box.replaceWith(renderMedia(p,m,detail,true));box.append(b);return box;}
 const image=(url)=>{
  const img=element('img',{alt:p.title,loading:'lazy',decoding:'async',referrerPolicy:'no-referrer'});
  const animated=/\.gif(?:[?#]|$)/i.test(url);
  if(animated){img.classList.add('animated-image');playback.register(img,playing=>{if(playing&&img.getAttribute('src')!==url)img.src=url;else if(!playing&&img.hasAttribute('src'))img.removeAttribute('src');});}else img.src=url;
  img.onerror=()=>{if(img.hasAttribute('src'))img.replaceWith(link('Image unavailable · Open source',url,'source'));};
  if(!detail){img.style.cursor='zoom-in';img.onclick=()=>openPost(p);}return img;
 };
 if(m.type==='image')box.append(image(m.url));
 else if(m.type==='gallery'){
  const g=element('div',{className:'gallery'});
  m.images.forEach(u=>/\.mp4(?:[?#]|$)/i.test(u)?g.append(videoPlayer({mp4:u,animated:true})):g.append(image(u)));
  box.append(g,element('small',{className:'gallery-count'},`${m.images.length} items · Swipe to browse`));
 }else if(m.type==='video')box.append(videoPlayer(m));
 else if(m.type==='embed')box.append(embedPlayer(m,p.title));
 else if(m.type==='link'){if(m.preview)box.append(image(m.preview));box.append(link(`Open ${m.provider||'original source'}`,m.url,'source'));}
 if(detail&&m.type!=='text')box.append(link('Open original media',safeURL(p.url)||original(p),'source'));
 return box;
}
const scripts=new Map();
function script(src){if(!scripts.has(src))scripts.set(src,new Promise((resolve,reject)=>{const s=element('script',{src});s.onload=resolve;s.onerror=()=>{scripts.delete(src);reject(Error('Playback library unavailable.'));};document.head.append(s);}));return scripts.get(src);}
function videoPlayer(m) {
 const wrap=element('div',{className:'video-wrap'}),v=element('video',{controls:true,playsInline:true,preload:'metadata',loop:!!m.animated});
 v.muted=!prefs.soundOn;v.defaultMuted=!prefs.soundOn;v.setAttribute('playsinline','');if(!prefs.soundOn)v.setAttribute('muted','');
 const info=element('small',{className:'playback-info'}),sound=element('button',{className:'sound-toggle'}),resume=labelIcon(element('button',{className:'resume-play',hidden:true}),'play','Tap to play');
 sound.onclick=toggleSound;labelIcon(sound,prefs.soundOn?'volume':'muted','');sound.setAttribute('aria-label',prefs.soundOn?'Turn sound off':'Turn sound on');wrap.append(v,sound,resume,info);
 let player,engine,disposed=false,initialized=false,wanted=false;
 const fail=()=>{info.textContent='Playback unavailable. Open the original media to try its source player.';};
 const play=()=>{if(!wanted||disposed||!initialized)return;const attempt=v.play();attempt?.then(()=>{resume.hidden=true;}).catch(()=>{if(wanted)resume.hidden=false;});};
 resume.onclick=()=>{v.muted=!prefs.soundOn;play();};
 v.addEventListener('canplay',play);v.addEventListener('error',fail);
 v.addEventListener('volumechange',()=>{if(!disposed)playback.soundChanged(v.muted);});
 async function initialize(){
  initialized=true;
  try{
   if(m.hls&&v.canPlayType('application/vnd.apple.mpegurl'))v.src=m.hls;
   else if(m.hls&&window.MediaSource){await script('./vendor/hls.min.js');if(disposed)return;if(window.Hls.isSupported()){engine=new window.Hls();engine.loadSource(m.hls);engine.attachMedia(v);engine.on(window.Hls.Events.ERROR,(_e,data)=>{if(data.fatal)fail();});}else if(m.mp4)v.src=m.mp4;else fail();}
   else if(m.dash&&window.MediaSource){await script('./vendor/dash.all.min.js');if(disposed)return;player=window.dashjs.MediaPlayer().create();player.initialize(v,m.dash,false);player.on('error',fail);}
   else if(m.mp4){v.src=m.mp4;if(m.native)info.textContent='Direct Reddit MP4 may be silent. Adaptive streams carry sound when available.';}else fail();
  }catch{if(disposed)return;if(m.mp4){v.src=m.mp4;info.textContent='Using direct video; sound may be unavailable.';}else fail();}
  play();
 }
 playback.register(v,playing=>{wanted=playing;if(playing){if(!initialized)initialize();else play();}else{v.pause();resume.hidden=true;}},muted=>{v.muted=muted;},()=>{disposed=true;engine?.destroy();player?.reset();v.removeAttribute('src');v.load();});
 updateSoundButtons();return wrap;
}
function embedPlayer(m,title){
 const wrap=element('div',{className:'video-wrap embed-wrap'}),frame=element('iframe',{title,allow:'autoplay; fullscreen; picture-in-picture; encrypted-media',referrerPolicy:'strict-origin-when-cross-origin'}),sound=element('button',{className:'sound-toggle'});
 frame.setAttribute('allowfullscreen','');sound.onclick=toggleSound;labelIcon(sound,prefs.soundOn?'volume':'muted','');sound.setAttribute('aria-label',prefs.soundOn?'Turn sound off':'Turn sound on');wrap.append(frame,sound);
 const url=new URL(m.url),youtube=m.provider==='YouTube';let loaded=false,wanted=false,muted=!prefs.soundOn;
 function command(name,value){if(!loaded)return;frame.contentWindow?.postMessage(JSON.stringify(youtube?{event:'command',func:name,args:value===undefined?[]:[value]}:{method:name,...(value===undefined?{}:{value})}),url.origin);}
 function sync(){command(youtube?(muted?'mute':'unMute'):'setVolume',youtube?undefined:muted?0:1);command(youtube?(wanted?'playVideo':'pauseVideo'):(wanted?'play':'pause'));}
 const onMessage=e=>{if(e.source!==frame.contentWindow||e.origin!==url.origin)return;let data;try{data=typeof e.data==='string'?JSON.parse(e.data):e.data;}catch{return;}if(data?.event==='onReady'||data?.event==='ready'){if(!youtube)command('addEventListener','volumechange');sync();}if(youtube&&data?.event==='infoDelivery'&&typeof data.info?.muted==='boolean')playback.soundChanged(data.info.muted);if(!youtube&&data?.event==='volumechange'&&typeof data.data?.volume==='number')playback.soundChanged(data.data.volume===0);};
 window.addEventListener('message',onMessage);frame.onload=()=>{loaded=true;if(youtube)frame.contentWindow?.postMessage(JSON.stringify({event:'listening',id:'relay'}),url.origin);sync();};
 playback.register(frame,playing=>{wanted=playing;if(playing&&!frame.hasAttribute('src')){url.searchParams.set('autoplay','1');url.searchParams.set(youtube?'mute':'muted',muted?'1':'0');url.searchParams.set('playsinline','1');if(youtube){url.searchParams.set('enablejsapi','1');url.searchParams.set('origin',location.origin);}else url.searchParams.set('api','1');frame.src=url.href;}else sync();},value=>{muted=value;sync();},()=>{window.removeEventListener('message',onMessage);frame.removeAttribute('src');});
 updateSoundButtons();return wrap;
}
async function openPost(p){const detail=$('#post-detail');playback.clear(detail);detail.replaceChildren(element('small',{},`r/${p.subreddit} · u/${p.author||'unknown'}`),element('h2',{},p.title));if(p.over_18&&!prefs.adult){detail.append(element('p',{},'Enable mature content in Preferences to view this post.'));$('#viewer').showModal();return;}if(p.selftext)detail.append(element('p',{className:'body-text'},p.selftext));detail.append(renderMedia(p,mediaFor(p),true),link('View conversation on Reddit ↗',original(p),'source'));const comments=element('div');detail.append(comments);$('#viewer').showModal();playback.refresh();if(demo||!p.permalink)return;comments.textContent='Loading comments…';try{const host=token?'https://oauth.reddit.com':'https://www.reddit.com';const response=await fetch(`${host}${p.permalink.replace(/\/$/,'')}.json?raw_json=1&limit=15`,{credentials:'omit',headers:token?{Authorization:`Bearer ${token}`}:{},signal:AbortSignal.timeout(12000)});if(!response.ok)throw Error();const data=await response.json();comments.replaceChildren(element('h3',{},'Conversation'));for(const child of data[1]?.data?.children||[]){const c=child.data;if(child.kind!=='t1'||!c.body)continue;const row=element('div',{className:'notice'});row.append(element('small',{},`u/${c.author} · ↑ ${count(c.score)}`),element('p',{className:'body-text'},c.body));comments.append(row);}if(comments.children.length===1)comments.append(element('p',{},'No comments available.'));}catch{comments.textContent='Comments unavailable here. Open the conversation on Reddit to read more.';}}
$('#search-form').onsubmit=e=>{e.preventDefault();$('#search').blur();query=$('#search').value.trim().slice(0,512);demo=false;savedView=false;load();};
$('#community-form').onsubmit=e=>{e.preventDefault();const name=$('#community').value.replace(/^r\//,'').trim();if(!/^[\w]{2,21}$/.test(name))return;if(!prefs.communities.includes(name))prefs.communities.push(name);prefs.communities=prefs.communities.slice(-40);persist();renderCommunities();navigate(name);$('#community').value='';};
document.querySelectorAll('[data-feed]').forEach(b=>b.onclick=()=>navigate(b.dataset.feed));
document.querySelectorAll('[data-sort]').forEach(b=>b.onclick=()=>{sort=b.dataset.sort;document.querySelectorAll('[data-sort]').forEach(x=>x.classList.toggle('active',x===b));if(demo){demo=false;}load();});
$('#saved-nav').onclick=()=>{window.scrollTo({top:0});savedView=true;demo=false;load();};$('#more').onclick=()=>load(true);$('#period').onchange=()=>load();$('#demo-button').onclick=showDemo;
$('#layout').onclick=()=>{prefs.compact=!prefs.compact;applyPrefs();persist();};
for(const id of ['settings-button','mobile-settings'])$('#'+id).onclick=()=>{$('#settings').showModal();setOverlayTab('settings');playback.refresh();};
$('#settings').addEventListener('close',()=>{setOverlayTab();playback.refresh();});
$('#community-sheet').addEventListener('close',()=>{setOverlayTab();playback.refresh();});
$('#viewer').addEventListener('close',()=>{playback.clear($('#post-detail'));$('#post-detail').replaceChildren();playback.refresh();});
$('#feed-sound').onclick=toggleSound;
$('#soundOn').onchange=toggleSound;
for(const key of ['adult','blur','dark'])$('#'+key).onchange=e=>{prefs[key]=e.target.checked;persist();applyPrefs();if(key==='adult'&&!demo&&!savedView)load();else render();};
function saveToken(){try{if($('#remember-token').checked&&token){localStorage.setItem(TOKEN_KEY,token);if(tokenExpiresAt)localStorage.setItem('relay.token-expires',String(tokenExpiresAt));else localStorage.removeItem('relay.token-expires');}else{localStorage.removeItem(TOKEN_KEY);localStorage.removeItem('relay.token-expires');}}catch{$('#token-status').textContent='Token could not be saved to device storage.';}}
$('#token').value=token;$('#remember-token').checked=tokenRemembered;
$('#connection-state').textContent=token?(tokenExpiresAt?'Connected':'Token saved'):'Not connected';
const redirectUri=new URL('./',location.href).href;
$('#redirect-uri').value=redirectUri;
try{$('#client-id').value=localStorage.getItem('relay.client-id')||'';const type=localStorage.getItem('relay.app-type');if(['web','script','installed'].includes(type))$('#app-type').value=type;}catch{}
$('#app-type').onchange=()=>{try{localStorage.setItem('relay.app-type',$('#app-type').value);}catch{}};
$('#client-id').onchange=()=>{try{localStorage.setItem('relay.client-id',$('#client-id').value.trim());}catch{$('#oauth-status').textContent='Client ID could not be saved on this device.';}};
$('#copy-redirect').onclick=async()=>{try{await navigator.clipboard.writeText(redirectUri);$('#oauth-status').textContent='Redirect URI copied.';}catch{$('#redirect-uri').select();$('#oauth-status').textContent='Select and copy the redirect URI shown above.';}};
$('#oauth-connect').onclick=()=>{
 try{const clientId=$('#client-id').value.trim();const state=Array.from(crypto.getRandomValues(new Uint8Array(32)),byte=>byte.toString(16).padStart(2,'0')).join('');const type=$('#app-type').value;const provider=type==='installed'?'reddit':'broker';const url=provider==='reddit'?authorizationURL(clientId,redirectUri,state):brokerStartURL(clientId,state,type);localStorage.setItem('relay.client-id',clientId);localStorage.setItem('relay.app-type',type);sessionStorage.setItem('relay.oauth-pending',JSON.stringify({state,provider,createdAt:Date.now(),remember:$('#remember-token').checked}));location.assign(url);}catch(error){$('#oauth-status').textContent=error.message;}
};
if(authNotice){$('#oauth-status').textContent=authNotice;$('#settings').showModal();setOverlayTab('settings');playback.refresh();}
$('#show-token').onclick=()=>{const show=$('#token').type==='password';$('#token').type=show?'text':'password';$('#show-token').textContent=show?'Hide':'Show';};
$('#remember-token').onchange=saveToken;
let tokenRequest;
$('#connect-token').onclick=async()=>{
 const candidate=$('#token').value.trim().replace(/^Bearer\s+/i,'');
 if(!candidate||/\s/.test(candidate)){$('#token-status').textContent='Paste a valid bearer access token, without whitespace.';return;}
 tokenRequest?.abort();tokenRequest=new AbortController();const request=tokenRequest;
 $('#connect-token').disabled=true;$('#token-status').textContent='Checking Reddit connection…';
 const timeout=setTimeout(()=>request.abort(),12000);
 try{
  let res=await fetch('https://oauth.reddit.com/api/v1/me',{headers:{Authorization:`Bearer ${candidate}`},credentials:'omit',signal:request.signal});
  if(request!==tokenRequest)return;
  let readOnly=false;if(res.status===403){res=await fetch('https://oauth.reddit.com/r/popular/hot.json?limit=1&raw_json=1',{headers:{Authorization:`Bearer ${candidate}`},credentials:'omit',signal:request.signal});readOnly=true;}
  if(!res.ok)throw Error(res.status===401?'Token expired or invalid. Paste a fresh token.':`Reddit denied verification (${res.status}). Check the token’s identity scope and API access.`);
  const account=await res.json();if(!account.name&&!(readOnly&&Array.isArray(account.data?.children)))throw Error('Reddit did not return a valid API response.');
  if(token!==candidate)tokenExpiresAt=0;token=candidate;saveToken();$('#connection-state').textContent='Connected';$('#token-status').textContent=account.name?`Connected as u/${account.name}.`:'Connected with read access.';demo=false;savedView=false;load();
 }catch(err){if(request===tokenRequest)$('#token-status').textContent=err.name==='AbortError'?'Connection timed out. Check your network and Reddit API access.':err.message==='Failed to fetch'?'Reddit could not be reached. Browser access may be restricted.':err.message;}
 finally{clearTimeout(timeout);if(request===tokenRequest)$('#connect-token').disabled=false;}
};
$('#disconnect-token').onclick=()=>{tokenRequest?.abort();tokenRequest=null;token='';tokenExpiresAt=0;$('#token').value='';$('#remember-token').checked=false;saveToken();$('#connect-token').disabled=false;$('#connection-state').textContent='Not connected';$('#token-status').textContent='Disconnected. Token removed from this device.';if(!demo&&!savedView)load();};
$('#export').onclick=()=>{const url=URL.createObjectURL(new Blob([JSON.stringify(prefs,null,2)],{type:'application/json'}));const a=element('a',{href:url,download:'relay-backup.json'});a.click();setTimeout(()=>URL.revokeObjectURL(url),1000);};
$('#import').onchange=async e=>{try{const file=e.target.files[0];if(!file)return;if(file.size>5*1024*1024)throw Error('Backup must be under 5 MB.');prefs=validate(JSON.parse(await file.text()));persist();applyPrefs();playback.syncSound();if(savedView)posts=prefs.saved;render();$('#settings-status').textContent='Local data imported.';}catch(err){$('#settings-status').textContent=err.message;}finally{e.target.value='';}};
$('#clear').onclick=()=>{if(!confirm('Remove all saved posts and preferences from this device?'))return;tokenRequest?.abort();tokenRequest=null;$('#connect-token').disabled=false;prefs=structuredClone(defaults);token='';tokenExpiresAt=0;$('#token').value='';$('#remember-token').checked=false;saveToken();localStorage.removeItem('relay.client-id');localStorage.removeItem('relay.app-type');sessionStorage.removeItem('relay.oauth-pending');$('#client-id').value='';$('#connection-state').textContent='Not connected';persist();applyPrefs();if(savedView)posts=[];render();$('#settings-status').textContent='Local data cleared.';};
window.addEventListener('beforeinstallprompt',e=>{e.preventDefault();installPrompt=e;$('#install').hidden=false;});$('#install').onclick=async()=>{if(!installPrompt)return;await installPrompt.prompt();installPrompt=null;$('#install').hidden=true;};window.addEventListener('appinstalled',()=>$('#install').hidden=true);
function setOverlayTab(tab){if(tab===undefined)tab=$('#settings').open?'settings':$('#community-sheet').open?'communities':undefined;
 $('#communities-nav').classList.toggle('active',tab==='communities');$('#mobile-settings').classList.toggle('active',tab==='settings');
 $('#primary-nav [data-feed=popular]').classList.toggle('active',!tab&&!savedView);$('#saved-nav').classList.toggle('active',!tab&&savedView);
 for(const button of document.querySelectorAll('#primary-nav button'))button.setAttribute('aria-current',button.classList.contains('active')?'page':'false');
}
function openCommunities(){$('#community-sheet').showModal();setOverlayTab('communities');playback.refresh();}
$('#feed-picker').onclick=openCommunities;$('#communities-nav').onclick=openCommunities;$('#popular-choice').onclick=()=>navigate('popular');
function searchPanel(show){$('#search-panel').hidden=!show;$('#search-toggle').setAttribute('aria-expanded',String(show));if(show)$('#search').focus();else $('#search').blur();}
$('#search-toggle').onclick=()=>searchPanel($('#search-panel').hidden);$('#search-cancel').onclick=()=>searchPanel(false);
for(const [selector,name,text] of [['[data-feed=popular]','compass','Feed'],['#communities-nav','globe','Communities'],['#settings-button','settings','Settings'],['#mobile-settings','settings','Settings'],['#layout','grid',''],['#install','download','Install'],['#search-toggle','search',''],['[data-sort=hot]','flame','Hot'],['[data-sort=new]','sparkles','New'],['[data-sort=top]','arrow','Top'],['[data-sort=rising]','trend','Rising'],['#community-form button','plus','']])labelIcon($(selector),name,text);
const savedCount=$('#saved-count');labelIcon($('#saved-nav'),'bookmark','Saved');$('#saved-nav').append(savedCount);
$('#search-form>span').replaceChildren(icon('search'));
document.querySelectorAll('.close').forEach(b=>labelIcon(b,'close',''));
if('serviceWorker'in navigator)navigator.serviceWorker.register('./sw.js').catch(()=>message('Offline support could not start. Use HTTPS or localhost.'));
applyPrefs();if(!brokerNavigation)load();
