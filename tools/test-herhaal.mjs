// Herhaalmodel (docs/herhaalmodel.md, fase 3): wat telt als ophalen, gespreid groeien, doelitem, en een simulatie.
import vm from 'node:vm';
import { html } from './app-harness.mjs';
let fails = 0; const ok = (n, v, extra) => { if (!v) fails++; console.log((v ? 'OK  ' : 'FOUT') + ' ' + n + (v || extra == null ? '' : '\n     ' + extra)); };
const fnBlock = name => { const i = html.indexOf('function ' + name + '('); if (i < 0) throw new Error(name); let d = 0, j = html.indexOf('{', i); for (; j < html.length; j++) { if (html[j] === '{') d++; else if (html[j] === '}') { d--; if (!d) break; } } return html.slice(i, j + 1); };
const line = start => { const i = html.indexOf(start); return html.slice(i, html.indexOf('\n', i)); };
const MOTORCODE = html.slice(html.indexOf('const MOTOR={'), html.indexOf('\n};', html.indexOf('const MOTOR={')) + 3);   // alle waarden van de motor (didactisch plan, hoofdstuk 5)
const DAY = 864e5;

function model() {
  const ctx = { S: { items: {}, introduced: [], log: [] }, T: 0, DAY, Math, Array, Object };
  vm.createContext(ctx);
  vm.runInContext(MOTORCODE + '\nconst now=()=>T;const today=()=>Math.floor(T/DAY)*DAY;const save=()=>{};' + line('const NOGROW=') + '\n' + line('let KIND=') + '\n' + fnBlock('canBloom') + '\n' + fnBlock('item') + '\n' + fnBlock('review') + '\n' + fnBlock('introduce') + '\n' + fnBlock('practiced') + '\n' + fnBlock('stage') + '\n' + fnBlock('thirsty') + '\nthis.api={review,introduce,practiced,stage,thirsty,item,canBloom,setKind:(id,k)=>{KIND[id]=k}};', ctx);
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
ok('goed: bij-item krijgt de oefening (exs), geen vorm, en groeit niet', c.S.items.woord.s === 3 && c.S.items.woord.exs.includes('ex.2') && !c.S.items.woord.forms.includes('gap'));
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
const pick = (forms, learn, speak) => { const cx = { QUIET: false, S: { items: { w: { forms } } }, window: speak ? { speechSynthesis: {} } : {} }; vm.createContext(cx); vm.runInContext(fnBlock('pickForm') + ';this.f=pickForm;', cx); return cx.f({ id: 'w' }, learn, learn === 'en' ? 'enrecall' : 'recall'); };
ok('NL: eerst typen, dan luisteren en typen, daarna weer typen', pick([], 'nl', true) === 'recall' && pick(['herkennen', 'typen'], 'nl', true) === 'hear' && pick(['herkennen', 'typen', 'luisteren'], 'nl', true) === 'recall');
ok('EN: eerst typen, dan luisteren, dan herkennen', pick([], 'en', true) === 'enrecall' && pick(['typen'], 'en', true) === 'enhear' && pick(['typen', 'luisteren'], 'en', true) === 'enrecog' && pick(['typen', 'luisteren', 'herkennen'], 'en', true) === 'enrecall');
ok('zonder spraak op het toestel geen luisteroefening', pick(['herkennen', 'typen'], 'nl', false) === 'recall' && pick(['typen'], 'en', false) === 'enrecog');
ok('schermen voor luisteren en typen en Engels herkennen bestaan, en tellen als eigen vorm', html.includes('H.hear=q=>') && html.includes('H.enhear=q=>') && html.includes('H.enrecog=q=>') && html.split("review(w.id,res,'luisteren')").length === 3);
// 8. eis voor bloei per soort (stap 4)
const grow = (kind, forms, exs) => { const m = model(); m.api.setKind('x', kind); m.S.items.x = { ...m.api.item(), s: 5, due: 0, reps: 5, forms, exs }; at(m, 1); m.api.review('x', true, forms[0] || 'gap'); return m.S.items.x.s > 9; };
ok('woord: drie vormen nodig', !grow('word', ['herkennen', 'typen'], []) && grow('word', ['herkennen', 'typen', 'luisteren'], []));
ok('regel: drie verschillende oefeningen, waarvan één keer zin bouwen', !grow('rule', ['gap'], ['a', 'b', 'c']) && !grow('rule', ['build', 'gap'], ['a', 'b']) && grow('rule', ['build', 'gap'], ['a', 'b', 'c']));
ok('klank: drie verschillende oefeningen, waarvan één keer luisteren en typen', !grow('sound', ['listen'], ['a', 'b', 'c']) && grow('sound', ['listen', 'luisteren'], ['a', 'b', 'c']));
ok('rekenvaardigheid: drie verschillende varianten', !grow('skill', ['geld'], ['g#1', 'g#2']) && grow('skill', ['geld'], ['g#1', 'g#2', 'g#3']));
ok('de app vult de soort per item uit de pakketten', html.includes("KIND[x.id]=x.kind"));

// 9. haalbaar met de inhoud die er nu is? (meldt welk onderdeel meer oefeningen of een vorm nodig heeft)
{ const { boot } = await import('./app-harness.mjs'); const app = await boot(); const P = app.api.get().PACKS;
  const all = P.flatMap(p => (p.items || []).map(x => ({ ...x, learn: p.learn }))), exs = P.flatMap(p => p.exercises || []);
  const gaps = [];
  for (const x of all) {
    const mine = exs.filter(e => (e.items || []).includes(x.id)), gen = mine.some(e => e.gen);
    if (x.kind === 'word') continue; // woorden: herkennen, typen en luisteren bestaan voor NL en EN
    if (x.kind === 'skill') { if (!gen && mine.length < 3) gaps.push(x.id + ': ' + mine.length + ' oefening(en), 3 nodig of een recept (gen)'); continue; }
    if (x.kind === 'rule') { const why = []; if (mine.length < 3) why.push(mine.length + ' oefening(en), 3 nodig'); if (!mine.some(e => e.form === 'build')) why.push('geen zin bouwen'); if (why.length) gaps.push(x.id + ': ' + why.join(', ')); continue; }
    if (x.kind === 'sound') { const why = []; if (mine.length < 3) why.push(mine.length + ' oefening(en), 3 nodig'); if (!mine.some(e => e.data && e.data.mode === 'type')) why.push('geen horen en opschrijven'); if (why.length) gaps.push(x.id + ': ' + why.join(', ')); }
  }
  ok('rekenvaardigheden met een recept kunnen bloeien', !gaps.some(g => /^(r-geld|r-klok|r-10|r-25)/.test(g)), gaps.filter(g => /^r-/.test(g)).join('; '));
  ok('elk onderdeel kan met de huidige inhoud in volle bloei komen', !gaps.length, gaps.join('; '));
  if (gaps.length) console.log('     LET OP, nog niet haalbaar met de huidige inhoud (' + gaps.length + '):\n       ' + gaps.join('\n       '));
}
// 10. bijsturen binnen een ronde (stap 6, sectie 7)
{ const cx = { S: { introduced: ['a', 'b'], items: { a: { forms: ['herkennen'] }, b: { forms: [] } } }, Q: [], qi: 0, SESS: [] }; vm.createContext(cx);
  vm.runInContext(MOTORCODE + '\n' + line('const EASIER=') + '\n' + fnBlock('adapt') + '\nthis.adapt=adapt;', cx);
  const mk = () => [{ type: 'recall', w: { id: 'a' } }, { type: 'learn', w: { id: 'n' }, _new: 1 }, { type: 'recog', w: { id: 'a' } }, { type: 'hear', w: { id: 'b' } }, { type: 'recall', w: { id: 'z' } }];
  cx.Q = mk(); cx.qi = 0; cx.SESS = [false, false, true, false]; cx.adapt();
  ok('onder 65% goed: typen wordt kiezen, nieuw wordt overgeslagen', cx.Q[0].type === 'recog' && cx.Q[1]._skip && cx.Q[3].type === 'recog' && cx.Q[4].type === 'recall');
  cx.Q = mk(); cx.SESS = Array(8).fill(true); cx.adapt();
  ok('boven 95% goed (8 antwoorden): kiezen wordt typen (alleen als het woord al herkend is)', cx.Q[2].type === 'recall' && !cx.Q[1]._skip);
  cx.Q = mk(); cx.SESS = [true, false, true]; cx.adapt();
  ok('minder dan 4 antwoorden: niets aanpassen', cx.Q[0].type === 'recall' && !cx.Q[1]._skip);
  cx.Q = mk(); cx.Q[0]._t = 1; cx.SESS = [false, false, false, false]; cx.adapt();
  ok('een oefening waar al iets mee gedaan is, blijft zoals ze is', cx.Q[0].type === 'recall');
}
// 11. hardnekkig (stap 6, sectie 8)
{ const m = model(); m.S.items.h = { ...m.api.item(), s: 1, due: 0, reps: 9, lapses: 5, forms: ['herkennen', 'typen'] };
  for (let d = 1; d <= 3; d++) { at(m, d * 3); m.api.review('h', true, 'typen'); }
  ok('hardnekkig: na 3 keer achter elkaar goed weer gewoon (lapses 2)', m.S.items.h.lapses === 2);
  const m2 = model(); m2.S.items.h = { ...m2.api.item(), s: 1, due: 0, reps: 9, lapses: 5 }; at(m2, 3); m2.api.review('h', true, 'typen'); at(m2, 6); m2.api.review('h', false, 'typen'); at(m2, 9); m2.api.review('h', true, 'typen');
  ok('hardnekkig: een fout ertussen telt niet als 3 keer achter elkaar', m2.S.items.h.lapses === 6);
  ok('hardnekkig woord krijgt eerst weer herkennen', pick(['herkennen', 'typen'], 'nl', true) === 'hear' && (() => { const cx = { QUIET: false, S: { items: { w: { forms: ['typen'], lapses: 4 } } }, window: {} }; vm.createContext(cx); vm.runInContext(fnBlock('pickForm') + ';this.f=pickForm;', cx); return cx.f({ id: 'w' }, 'nl', 'recall') === 'recog' && cx.f({ id: 'w' }, 'en', 'enrecall') === 'enrecog'; })());
  ok('hardnekkige regel of vaardigheid: de uitleg opnieuw in de les', html.includes('if(xid&&(hard||!(S.explained||{})[xid]))'));
}
// 12. tuin: regels en klanken, uitleg bij tikken, lampje bij hardnekkig
ok('tuin: bed voor regels en klanken, tikken opent de uitleg, lampje bij hardnekkig', html.includes("const beds=['nl','regel','rek','en'];") && html.includes('if(w.xid)return openExplain(w.xid);') && html.includes("class=\"lamp\""));
// 13. review fase 3: volle bloei komt terug, fout en direct goed geeft geen groei
{ const m = model(); m.S.items.b = { ...m.api.item(), s: 33, t: 23 * DAY, due: 56 * DAY, reps: 9, forms: ['herkennen', 'typen', 'luisteren'] };
  at(m, 40); const voor = m.api.thirsty('b'); at(m, 56); const op = m.api.thirsty('b'); at(m, 400); const later = m.api.thirsty('b');
  ok('volle bloei: na de wachttijd weer aan de beurt (ook na een jaar)', m.api.stage('b') === 5 && !voor && op && later);
  const f = model(); f.S.items.v = { ...f.api.item(), s: 9, t: 1 * DAY, due: 10 * DAY, reps: 5, forms: ['herkennen', 'typen', 'luisteren'] };
  at(f, 10); f.api.review('v', false, 'typen'); const na = f.S.items.v.s; at(f, 10.001); f.api.review('v', true, 'typen');
  ok('fout en direct daarna goed: geen groei, opnieuw ingepland vanaf de fout', Math.abs(f.S.items.v.s - na) < 1e-9 && Math.abs(f.S.items.v.due - (10 * DAY + na * DAY)) < 1e-6, 's ' + f.S.items.v.s);
  at(f, 10 + na * 0.6); f.api.review('v', true, 'typen');
  ok('na de fout op een latere dag goed: wel groei', f.S.items.v.s > na);
  const o = model(); o.S.items.x = { ...o.api.item(), s: 4, due: 10 * DAY, reps: 3, forms: [] }; delete o.S.items.x.t; at(o, 9); o.api.review('x', true, 'typen');
  ok('item zonder t (oude opslag): t wordt afgeleid uit due − s', Math.abs(o.S.items.x.s - 4 * (1 + 1.4 * 0.75)) < 1e-9);
}
// didactisch plan hoofdstuk 5: elke waarde van de motor op één plek, met bron of aanname
{
  const L = MOTORCODE.split('\n'), WHY = /aanname|§|kwaliteitskader|masterplan/i;
  const vals = L.filter(l => /^\s+[a-zA-Z]+:[\d.[]/.test(l));
  const bad = vals.filter(l => !WHY.test(l) && !WHY.test(L[L.indexOf(l) - 1] || ''));
  ok('motor: de waarden staan in MOTOR, elk met een bron (§) of het woord aanname', vals.length >= 15 && !bad.length, bad.join(' | '));
  ok('motor: geen losse waarden meer in review, adapt, retryLater, newWords en het foutprofiel',
    !['it.s=Math.max(.5,it.s*.4)', '.length>40', 'acc<.65', 'acc>.95', 'qi+6,at', 'it.s=14;', 'n>=2&&(!best', 'SCN.errs[err]<2'].some(x => html.includes(x)));
  const head = f => { const i = html.indexOf(f); return html.slice(i, html.indexOf('\n', i) + 120); };
  ok('motor: de functies die bepalen wat de leerder krijgt, noemen hun M-eis', ['function review(', 'function adapt(', 'function retryLater(', 'function errNote(', 'function canBloom('].every(f => /M\d/.test(head(f))));
}
console.log(fails ? fails + ' FOUT' : 'alles OK');
