const CACHE='relay-shell-v3';
const SHELL=['./','./index.html','./style.css','./app.js','./media.js','./demo.js','./icons.js','./playback.js','./manifest.webmanifest','./assets/icon.svg','./assets/icon-192.png','./assets/icon-512.png','./vendor/hls.min.js','./vendor/dash.all.min.js'];
self.addEventListener('install',e=>e.waitUntil(caches.open(CACHE).then(c=>c.addAll(SHELL))));
self.addEventListener('activate',e=>e.waitUntil(caches.keys().then(keys=>Promise.all(keys.filter(k=>k.startsWith('relay-shell-')&&k!==CACHE).map(k=>caches.delete(k)))).then(()=>self.clients.claim())));
self.addEventListener('fetch',e=>{
 const url=new URL(e.request.url);
 if(e.request.method!=='GET'||url.origin!==self.location.origin||!SHELL.some(p=>new URL(p,self.registration.scope).href===url.href))return;
 e.respondWith(fetch(e.request).then(response=>{if(response.ok){const copy=response.clone();e.waitUntil(caches.open(CACHE).then(c=>c.put(e.request,copy)));}return response;}).catch(()=>caches.match(e.request).then(cached=>cached||Response.error())));
});
