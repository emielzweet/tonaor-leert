// Offline: de app-schil wordt bewaard, lettertypes worden na de eerste keer gecachet.
const CACHE='tonaor-leert-v2-66';
const SHELL=['./','./index.html','./tlsync.js','./pakketcheck.js','./content/rk-1.json','./content/nl-t1.json','./content/nl-basis.json','./content/index.json','./scene.js','./kaart.js','./route.js','./content/route-nt2.json','./kaart/wereld.json','./kaart/europa.json','./kaart/azie.json','./kaart/nederland.json','./content/en-t1.json','./uitleg.js','./content/uitleg-rk.json','./content/uitleg-nl.json','./content/uitleg-en.json','./manifest.webmanifest','./icons/icon-180.png','./icons/icon-192.png','./icons/icon-512.png'];
// Eigen bestanden altijd vers bij de server opvragen (cache: 'reload' bij installeren, 'no-cache' daarna), zodat de
// HTTP-cache van de browser na een release nooit oude pakketten naast nieuwe code legt. Offline blijft de cache werken.
// Hoofdstukken uit content/index.json gaan bij het installeren mee in de cache (anders ontbreken ze offline na de eerste installatie
// en na elke nieuwe versie; review stap 3a, B1). Een pakket dat dan niet laadt, houdt de installatie niet tegen.
const IDXPACKS=c=>fetch('./content/index.json',{cache:'reload'}).then(r=>r.ok?r.json():null).then(j=>Promise.all((j&&Array.isArray(j.packs)?j.packs:[]).filter(u=>typeof u==='string'&&/^content\/[a-z0-9-]+\.json$/.test(u)).slice(0,200).map(u=>c.add(new Request('./'+u,{cache:'reload'})).catch(()=>{})))).catch(()=>{});
self.addEventListener('install',e=>{e.waitUntil(caches.open(CACHE).then(c=>c.addAll(SHELL.map(u=>new Request(u,{cache:'reload'}))).then(()=>IDXPACKS(c))).then(()=>self.skipWaiting()))});
self.addEventListener('activate',e=>{e.waitUntil(caches.keys().then(ks=>Promise.all(ks.filter(k=>k!==CACHE).map(k=>caches.delete(k)))).then(()=>self.clients.claim()))});
self.addEventListener('fetch',e=>{
  const r=e.request;if(r.method!=='GET')return;
  const u=new URL(r.url);
  if(u.origin===location.origin&&/\/audio\/.+\.m4a$/.test(u.pathname))return;   // geluid: de browser haalt het zelf (bytebereik voor iOS; review geluid B2); eigen geluidscache is docs/geluid.md stap 5
  if(u.origin===location.origin){ // eigen bestanden: eerst netwerk (nieuwe versie), anders cache
    e.respondWith(fetch(r.url,{cache:'no-cache',credentials:'same-origin'}).then(res=>{if(res.ok){const cp=res.clone();caches.open(CACHE).then(c=>c.put(r,cp))}return res})   /* alleen geslaagde antwoorden bewaren */.catch(()=>caches.match(r).then(m=>m||caches.match('./index.html'))));
  }else if(/fonts\.(googleapis|gstatic)\.com$/.test(u.hostname)){ // lettertypes: cache eerst
    e.respondWith(caches.match(r).then(m=>m||fetch(r).then(res=>{const cp=res.clone();caches.open(CACHE).then(c=>c.put(r,cp));return res})));
  }
});
