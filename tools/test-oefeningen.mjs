import vm from 'node:vm'; import { readFileSync } from 'node:fs';
const h=readFileSync(new URL('../index.html', import.meta.url),'utf8');
let fails=0;const ok=(n,v)=>{if(!v)fails++;console.log((v?'OK  ':'FOUT')+' '+n)};
// woorden uit het pakket (fase 2); velden zoals de app ze opbouwt
const NL=JSON.parse(readFileSync(new URL('../content/nl-t1.json', import.meta.url),'utf8')).items.filter(x=>x.kind==='word').map(x=>({...x,th:x.tr.th,en:x.tr.en}));
const ids=new Set(NL.map(w=>w.id));
ok('elk woord heeft een oefenzin met precies één gat',NL.every(w=>w.gap&&w.gap.split('___').length===2));
ok('also bevat alleen bestaande andere woorden',NL.every(w=>(w.also||[]).every(b=>ids.has(b)&&b!==w.id)));
ok('genoeg foute keuzes over (minstens 2)',NL.every(w=>NL.length-1-(w.also||[]).length>=2));
ok('lidwoord staat zichtbaar voor het gat als askArt uit staat',NL.every(w=>w.askArt||new RegExp('\\b'+w.art+'\\s+(\\S+\\s+)?___','i').test(w.gap)));
ok('askArt aan: geen de/het/ons/onze vlak voor het gat (dat verraadt het lidwoord)',NL.every(w=>!w.askArt||!/\b(de|het|ons|onze|dit|dat|deze)\s+(\S+\s+)?___/i.test(w.gap)));
ok('zin met ingevuld woord eindigt met een leesteken',NL.every(w=>/[.!?]$/.test(w.gap)));
const grab=n=>{const i=h.indexOf('function '+n+'(');return h.slice(i,h.indexOf('\n',i))};
const c=vm.createContext({esc:s=>String(s).replace(/[&<>"']/g,m=>'&#'+m.charCodeAt(0)+';')});
vm.runInContext(grab('gapEx')+'\n'+grab('inOrder'),c);
ok('gapEx toont de eigen zin met gat',/ik heb nu <span class="slot s2">___<\/span> in een fabriek\./.test(c.gapEx(NL[0])));
ok('gapEx zonder oefenzin: null (dan luistervorm)',c.gapEx({w:'x',ex:'x'})===null);
const t='ik werk morgen in de fabriek'.split(' ');
const cnt=a=>c.inOrder(t,a.split(' ')).filter(Boolean).length;
ok('dictee: goede zin 6/6',cnt('ik werk morgen in de fabriek')===6);
ok('dictee: gehusselde zin niet 6/6 (#23)',cnt('fabriek de in morgen werk ik')<6);
ok('dictee: één woord vergeten 5/6',cnt('ik werk in de fabriek')===5);
// bedrag
const line=h.split('\n').find(l=>l.includes('const amt=raw'));const expr=line.slice(line.indexOf('const amt='),line.indexOf('const ok=Math.abs'));
const amount=raw=>vm.runInNewContext(expr+';v',{raw});
ok('bedrag 64 / 64,00 / 64.00',amount('64')===64&&amount('64,00')===64&&amount('64.00')===64);
ok('bedrag 64,- / 64,– / 64 euro',amount('64,-')===64&&amount('64,–')===64&&amount('64 euro')===64);
ok('bedrag 64fout geweigerd (#24)',Number.isNaN(amount('64fout')));
ok('bedrag 1.064,50 = 1064.5',amount('1.064,50')===1064.5);
ok('bedrag "6 4" geweigerd',Number.isNaN(amount('6 4')));
ok('onbegrijpelijk bedrag telt niet als poging',/if\(Number\.isNaN\(v\)\)\{[^}]*return\}/.test(h));
// deelpunten
const sc=vm.createContext({sp:0,sessTotal:0,sessRight:0,pts:0,SESS:[]});sc.addPts=n=>{sc.pts+=n};
vm.runInContext(grab('score'),sc);
vm.runInContext('score(false,15,6)',sc);ok('deelpunten dictee worden opgeslagen (#25)',sc.pts===6&&sc.sp===6);
// taalwissel
ok('taalwissel tekent een aangeraakte vraag of eindscherm niet opnieuw (#22)',/if\(q\)\{if\(!q\._t&&!\/\^\(end\|placeend\)\$\/\.test\(q\.type\)\)step\(\)\}/.test(h));
console.log(fails?fails+' FOUT':'alles OK');
