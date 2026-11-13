// Offline: de app-schil wordt bewaard, lettertypes worden na de eerste keer gecachet.
const CACHE='tonaor-leert-v2-21';
const SHELL=['./','./index.html','./tlsync.js','./pakketcheck.js','./content/rk-1.json','./content/nl-t1.json','./content/en-t1.json','./uitleg.js','./content/uitleg-rk.json','./content/uitleg-nl.json','./content/uitleg-en.json','./manifest.webmanifest','./icons/icon-180.png','./icons/icon-192.png','./icons/icon-512.png'];
self.addEventListener('install',e=>{e.waitUntil(caches.open(CACHE).then(c=>c.addAll(SHELL)).then(()=>self.skipWaiting()))});
self.addEventListener('activate',e=>{e.waitUntil(caches.keys().then(ks=>Promise.all(ks.filter(k=>k!==CACHE).map(k=>caches.delete(k)))).then(()=>self.clients.claim()))});
self.addEventListener('fetch',e=>{
  const r=e.request;if(r.method!=='GET')return;
  const u=new URL(r.url);
  if(u.origin===location.origin){ // eigen bestanden: eerst netwerk (nieuwe versie), anders cache
    e.respondWith(fetch(r).then(res=>{const cp=res.clone();caches.open(CACHE).then(c=>c.put(r,cp));return res}).catch(()=>caches.match(r).then(m=>m||caches.match('./index.html'))));
  }else if(/fonts\.(googleapis|gstatic)\.com$/.test(u.hostname)){ // lettertypes: cache eerst
    e.respondWith(caches.match(r).then(m=>m||fetch(r).then(res=>{const cp=res.clone();caches.open(CACHE).then(c=>c.put(r,cp));return res})));
  }
});
