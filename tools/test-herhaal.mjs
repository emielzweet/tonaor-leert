// Herhaalmodel (docs/herhaalmodel.md, fase 3): wat telt als ophalen, gespreid groeien, doelitem, en een simulatie.
import vm from 'node:vm';
import { html } from './app-harness.mjs';
let fails = 0; const ok = (n, v, extra) => { if (!v) fails++; console.log((v ? 'OK  ' : 'FOUT') + ' ' + n + (v || extra == null ? '' : '\n     ' + extra)); };
const fnBlock = name => { const i = html.indexOf('function ' + name + '('); if (i < 0) throw new Error(name); let d = 0, j = html.indexOf('{', i); for (; j < html.length; j++) { if (html[j] === '{') d++; else if (html[j] === '}') { d--; if (!d) break; } } return html.slice(i, j + 1); };
const line = start => { const i = html.indexOf(start); return html.slice(i, html.indexOf('\n', i)); };
const DAY = 864e5;

function model() {
  const ctx = { S: { items: {}, introduced: [], log: [] }, T: 0, DAY, Math, Array, Object };
  vm.createContext(ctx);
  vm.runInContext('const now=()=>T;const today=()=>Math.floor(T/DAY)*DAY;const save=()=>{};' + line('const NOGROW=') + '\n' + fnBlock('item') + '\n' + fnBlock('review') + '\n' + fnBlock('introduce') + '\n' + fnBlock('practiced') + '\n' + fnBlock('stage') + '\n' + fnBlock('thirsty') + '\nthis.api={review,introduce,practiced,stage,thirsty,item};', ctx);
  return ctx;
}
const at = (c, d) => { c.T = d * DAY; };

// 1. wat telt als ophalen
let c = model(); c.S.items.w = c.api.item(); at(c, 0); c.api.introduce('w', 'voorbeeld');
ok('bekijken introduceert, maar telt niet als gekend', c.S.items.w.reps === 1 && c.S.items.w.s === 0 && c.S.introduced.includes('w') && c.api.thirsty('w'));
c.api.review('w', true, 'herkennen');
ok('eerste goede poging: stabiliteit 1 dag', c.S.items.w.s === 1 && c.S.items.w.due === DAY);
c.api.review('w', true, 'typen'); c.api.review('w', true, 'luisteren');
ok('gestapeld: nog twee keer goed op dezelfde dag laat niet groeien', c.S.items.w.s === 1 && c.S.items.w.due === DAY && c.S.items.w.forms.length === 4);
at(c, 0.6); c.api.review('w', true, 'typen');
ok('na de halve wachttijd groeit het, naar verhouding (0,6 van de wachttijd: × 1,84)', Math.abs(c.S.items.w.s - 1.84) < 1e-9);
{ const d = model(); d.S.items.v = { ...d.api.item(), s: 2, due: 2 * DAY, reps: 3 }; at(d, 2); d.api.review('v', true, 'typen'); ok('aan de beurt: × 2,4', Math.abs(d.S.items.v.s - 4.8) < 1e-9); }
at(c, 1); const before = c.S.items.w.s; c.api.review('w', 'retry', 'typen');
ok('goed na een hint: stabiliteit gelijk, opnieuw ingepland op dezelfde wachttijd', c.S.items.w.s === before && c.S.items.w.due === DAY + before * DAY && c.S.items.w.lapses === 0);
c.api.review('w', false, 'typen');
ok('fout: stabiliteit omlaag, lapses + 1, vandaag nog een keer', Math.abs(c.S.items.w.s - before * 0.4) < 1e-9 && c.S.items.w.lapses === 1 && c.S.items.w.due === DAY);

// 2. doelitem: alleen het eerste item van een oefening krijgt een fout
c = model(); c.S.items.regel = { ...c.api.item(), s: 3, due: 0, reps: 2 }; c.S.items.woord = { ...c.api.item(), s: 3, due: 0, reps: 2 }; at(c, 1);
c.api.practiced({ items: ['regel', 'woord'], exid: 'ex.1' }, false, 'gap');
ok('fout op een oefening: alleen het doelitem krijgt de fout', c.S.items.regel.lapses === 1 && c.S.items.woord.lapses === 0 && c.S.items.woord.s === 3);
c.api.practiced({ items: ['regel', 'woord'], exid: 'ex.2' }, true, 'gap');
ok('goed: bij-item krijgt vorm en oefening, maar groeit niet', c.S.items.woord.s === 3 && c.S.items.woord.exs.includes('ex.2') && c.S.items.woord.forms.includes('gap'));
ok('goed: doelitem houdt bij welke oefening goed ging', c.S.items.regel.exs.includes('ex.2'));

// 3. bloei: bekijken en de controlevraag tellen niet als vorm
c = model(); c.S.items.w = { ...c.api.item(), s: 5, due: 0, reps: 5, forms: ['herkennen', 'voorbeeld', 'check'] }; at(c, 1);
c.api.review('w', true, 'typen');
ok('voorbeeld en check tellen niet mee voor de drie vormen', c.S.items.w.s === 9);

// 4. gespreid en steeds goed: knop rond dag 3, bloem rond dag 9, volle bloei rond dag 23
c = model(); c.S.items.w = c.api.item(); at(c, 0); c.api.introduce('w'); const forms = ['herkennen', 'typen', 'luisteren']; let k = 0; const reached = {};
for (let d = 0; d <= 40; d += 0.25) { at(c, d); if (c.api.thirsty('w')) { c.api.review('w', true, forms[k++ % 3]); const s = c.api.stage('w'); if (reached[s] == null) reached[s] = d; } }
ok('gespreid: knop rond dag 3, bloem rond dag 9, volle bloei rond dag 23', reached[3] >= 3 && reached[3] <= 4 && reached[4] >= 9 && reached[4] <= 10 && reached[5] >= 22 && reached[5] <= 24, JSON.stringify(reached));

// 5. simulatie: 85 procent goed, 30 dagen, drie rondes per dag; in elke ronde alles wat aan de beurt is plus nieuw, en extra (te vroeg) oefenen
let seed = 7; const rnd = () => (seed = (seed * 16807) % 2147483647) / 2147483647;
c = model(); const N = 120; for (let i = 0; i < N; i++) c.S.items['i' + i] = c.api.item();
let introduced = 0, maxDue = 0, earlyBloom = null;
for (let day = 0; day < 30; day++) for (const hour of [8, 13, 19]) {
  at(c, day + hour / 24);
  for (let n = 0; n < 4 && introduced < N; n++) c.api.introduce('i' + introduced++);
  const due = Object.keys(c.S.items).filter(id => c.api.thirsty(id)); maxDue = Math.max(maxDue, due.length);
  for (const id of due) c.api.review(id, rnd() < 0.85 ? true : false, forms[Math.floor(rnd() * 3)]);
  // extra oefenen van items die nog niet aan de beurt zijn (gestapeld): mag niet laten groeien
  for (const id of Object.keys(c.S.items).filter(id => c.S.items[id].reps > 0 && !c.api.thirsty(id)).slice(0, 6)) c.api.review(id, true, forms[Math.floor(rnd() * 3)]);
  if (earlyBloom == null && day < 21 && Object.keys(c.S.items).some(id => c.api.stage(id) === 5)) earlyBloom = day;
}
const st = [0, 0, 0, 0, 0, 0]; Object.keys(c.S.items).forEach(id => st[c.api.stage(id)]++);
ok('simulatie: geen item in volle bloei vóór dag 21', earlyBloom == null, 'dag ' + earlyBloom);
ok('simulatie: stapel herhalingen blijft begrensd (hooguit 60 tegelijk)', maxDue <= 60, 'max ' + maxDue);
ok('simulatie: na 30 dagen staat een deel in bloei of volle bloei', st[4] + st[5] > 0, 'stadia ' + st.join(','));
console.log('     stadia na 30 dagen (zaadje … volle bloei):', st.join(' '), '| max tegelijk aan de beurt:', maxDue);

// 6. de app gebruikt het model
ok('oefeningen uit pakketten werken het herhaalmodel bij (bouwen, gatzin, luisteren, dictee, geld, klok)', ["practiced(q,first,'build')", "practiced(q,first,'gap')", "practiced(q,first,'listen')", "practiced(q,ok,'dictee')", "'geld')", "'klok')"].every(s => html.includes(s)));
ok('uitgewerkt voorbeeld telt niet als goed', html.includes("introduce('r-10','voorbeeld')") && !html.includes("review('r-10',true,'voorbeeld')"));
ok('regels en klanken krijgen een herhaalitem', html.includes("filter(x=>x.kind==='rule'||x.kind==='sound')"));
// 7. vorm kiezen die het woord nog mist (stap 2)
const pick = (forms, learn, speak) => { const cx = { S: { items: { w: { forms } } }, window: speak ? { speechSynthesis: {} } : {} }; vm.createContext(cx); vm.runInContext(fnBlock('pickForm') + ';this.f=pickForm;', cx); return cx.f({ id: 'w' }, learn, learn === 'en' ? 'enrecall' : 'recall'); };
ok('NL: eerst typen, dan luisteren en typen, daarna weer typen', pick([], 'nl', true) === 'recall' && pick(['herkennen', 'typen'], 'nl', true) === 'hear' && pick(['herkennen', 'typen', 'luisteren'], 'nl', true) === 'recall');
ok('EN: eerst typen, dan luisteren, dan herkennen', pick([], 'en', true) === 'enrecall' && pick(['typen'], 'en', true) === 'enhear' && pick(['typen', 'luisteren'], 'en', true) === 'enrecog' && pick(['typen', 'luisteren', 'herkennen'], 'en', true) === 'enrecall');
ok('zonder spraak op het toestel geen luisteroefening', pick(['herkennen', 'typen'], 'nl', false) === 'recall' && pick(['typen'], 'en', false) === 'enrecog');
ok('schermen voor luisteren en typen en Engels herkennen bestaan, en tellen als eigen vorm', html.includes('H.hear=q=>') && html.includes('H.enhear=q=>') && html.includes('H.enrecog=q=>') && html.split("review(w.id,res,'luisteren')").length === 3);
console.log(fails ? fails + ' FOUT' : 'alles OK');
