// De les uit gegevens (docs/herhaalmodel.md sectie 6, fase 3 stap 5): elke dag anders, alles komt aan bod, afwisseling, korte latere rondes.
import vm from 'node:vm';
import { boot, html } from './app-harness.mjs';
let fails = 0; const ok = (n, v, extra) => { if (!v) fails++; console.log((v ? 'OK  ' : 'FOUT') + ' ' + n + (v || extra == null ? '' : '\n     ' + extra)); };
const fnBlock = name => { const i = html.indexOf('function ' + name + '('); if (i < 0) throw new Error(name); let d = 0, j = html.indexOf('{', i); for (; j < html.length; j++) { if (html[j] === '{') d++; else if (html[j] === '}') { d--; if (!d) break; } } return html.slice(i, j + 1); };
const line = start => { const i = html.indexOf(start); return html.slice(i, html.indexOf('\n', i)); };
const DAY = 864e5, BASE = Date.UTC(2026, 10, 16, 8);
let seed = 11; const rnd = () => (seed = (seed * 16807) % 2147483647) / 2147483647;

const S = { v: 2, introduced: [], items: {}, explained: {}, rounds: {}, log: [], days: {} };
const ctx = await boot({ S, random: rnd }); ctx.NOW = BASE;
vm.runInContext(fnBlock('canBloom') + '\n' + fnBlock('review') + '\n' + fnBlock('introduce') + '\n' + fnBlock('practiced') + '\nthis.sim={review,introduce,practiced};', ctx);
const FORM = { recall: 'typen', hear: 'luisteren', recog: 'herkennen', enrecall: 'typen', enhear: 'luisteren', enrecog: 'herkennen', build: 'build', gap: 'gap', engap: 'gap', dictee: 'dictee', money: 'geld', clock: 'klok', discount: 'korting' };
const lesson = short => { let got = null; ctx.runSession = (name, q) => { got = { name, q }; }; ctx.api.startLesson(short); return got; };
const answer = q => {
  for (const x of q) {
    if (x.type === 'explain') { S.explained[x.x] = ctx.NOW; continue; }
    if (x.type === 'learn') { if (!S.introduced.includes(x.w.id)) S.introduced.push(x.w.id); const it = S.items[x.w.id]; it.reps = Math.max(1, it.reps); it.due = ctx.NOW; continue; }
    if (x.w) { ctx.sim.review(x.w.id, true, FORM[x.type]); continue; }
    if (x.type === 'discount' && x.k === 'worked') { ctx.sim.introduce(x.items[0], 'voorbeeld'); continue; }
    if (x.items && x.items.length) ctx.sim.practiced(x, true, x.type === 'listen' && x.p && x.p.mode === 'type' ? 'luisteren' : x.type === 'listen' ? 'listen' : FORM[x.type]);
  }
};
const sig = r => r.q.map(x => x.type + ':' + (x.w ? x.w.id : (x.exid || '').replace(/#\d+$/, '#') || x.x || '')).join(' ');
const sigs = [], tooMany = [], stofOver = [];
for (let d = 0; d < 7; d++) {
  ctx.NOW = BASE + d * DAY; S.days[Math.floor(ctx.NOW / DAY) * DAY] = 1;
  stofOver.push(ctx.api.get().NL.some(w => !S.introduced.includes(w.id)));
  const r = lesson(false); sigs.push(sig(r)); answer(r.q);
  for (const step of [3, 4]) { const t = r.q.filter(x => x.step === step && x.type !== 'explain').map(x => x.type); for (let i = 2; i < t.length; i++) if (t[i] === t[i - 1] && t[i] === t[i - 2]) tooMany.push('dag ' + d + ' stap ' + step + ': ' + t.join(',')); }
}
ok('de les is elke dag anders (7 dagen)', new Set(sigs).size === 7, sigs.join('\n     '));
const size = x => new Set(x.split(' ').filter(t => !/^(card|conf|end|explain):/.test(t))).size;
ok('elke les heeft minstens 8 verschillende onderdelen zolang er nieuwe lesstof is (docs/toets-per-stap.md, punt 8)', sigs.every((x, d) => !stofOver[d] || size(x) >= 8), sigs.map(size).join(','));
if (stofOver.some(v => !v)) console.log('     LET OP: de nieuwe woorden van nl-t1 zijn op dag ' + stofOver.indexOf(false) + ' op; daarna worden de rondes korter (meer lesstof nodig, plan spoor A)');
const nlKinds = ctx.api.get().PACKS.filter(p => p.learn === 'nl' && p.type !== 'hoofdstuk').flatMap(p => p.items || []).filter(x => ['rule', 'sound', 'skill'].includes(x.kind)).map(x => x.id);
const notYet = nlKinds.filter(id => !(S.items[id] && S.items[id].reps > 0));
ok('na 7 dagen zijn alle regels, klanken en rekenvaardigheden aan bod geweest', !notYet.length, notYet.join(', '));
ok('dezelfde oefenvorm hooguit twee keer achter elkaar', !tooMany.length, tooMany.join('; '));
ok('iets nieuws begint met de uitleg (als die er is)', sigs[0].includes('explain:u.rk.'));
ok('korting bouwt af: eerst het voorbeeld, daarna zelf', (() => { const i = sigs.findIndex(s => s.includes('discount:rk.korting.voorbeeld')), j = sigs.findIndex(s => /discount:rk\.korting\.(deel|zelf)/.test(s)); return i >= 0 && (j < 0 || j > i); })(), sigs.filter(s => s.includes('discount')).join('\n     '));
// een tweede ronde op dezelfde dag is kort
S.rounds[Math.floor(ctx.NOW / DAY) * DAY] = 1; const second = lesson(false);
{ const sv = JSON.stringify(S.rounds); S.rounds = {}; const full = lesson(false); S.rounds = JSON.parse(sv); ok('tweede ronde op een dag: kort recept, korter dan een volle ronde', second.name === 'Korte les' && full.name !== 'Korte les' && second.q.length < full.q.length, second.name + ' ' + second.q.length + ' tegen ' + full.q.length); }
// opstartvolgorde: variabelen die na het laden gebruikt worden, moeten eerder gedeclareerd zijn (anders blijft de app op 'Lesstof laden' hangen)
ok('KIND is gedeclareerd vóór het eerste gebruik bij het opstarten', html.indexOf('let KIND={}') > 0 && html.indexOf('let KIND={}') < html.indexOf('KIND[x.id]=x.kind') && html.indexOf('let KIND={}') < html.indexOf('await loadPacks();'));
ok('de leerklok kan niet struikelen over het laden', html.includes('function learning(){try{'));
// startmeting gebruiken (stap 7, docs/herhaalmodel.md sectie 9)
{ const S2 = { v: 2, introduced: [], items: {}, explained: {}, rounds: {}, log: [], days: {} };
  const c2 = await boot({ S: S2, random: rnd }); c2.NOW = BASE;
  vm.runInContext(fnBlock('canBloom') + '\n' + fnBlock('review') + '\n' + fnBlock('placeFromLevels') + '\nthis.pl={review,placeFromLevels};', c2);
  S2.items.werk.reps = 3; S2.items.werk.s = 5;   // bestaande voortgang
  c2.pl.placeFromLevels({ woorden: .8, grammatica: .9, luisteren: .2, rekenen: .7, engels: 0 });
  const g = c2.api.get(), w6 = g.NL.slice(0, 6).map(x => x.id);
  ok('hoge score: basisonderdelen als plantje (s 2, over 2 dagen), met placed', w6.filter(id => id !== 'werk').every(id => S2.items[id].s === 2 && S2.items[id].reps === 1 && S2.items[id].due === BASE + 2 * DAY && S2.items[id].placed) && S2.items['nl.regel.plek2'].placed && S2.items['r-geld'].placed);
  ok('bestaande voortgang blijft staan', S2.items.werk.s === 5 && S2.items.werk.reps === 3 && !S2.items.werk.placed);
  ok('lage of middelmatige score: niets aangenomen', !S2.items['nl.klank.man'].placed && !S2.items['en-work'].placed);
  c2.NOW = BASE + 2 * DAY; c2.pl.review(w6[1], false, 'typen');
  ok('uit de startmeting en toch fout: als nieuw, en geen fout geteld', S2.items[w6[1]].s === 0 && S2.items[w6[1]].reps === 0 && S2.items[w6[1]].lapses === 0 && !S2.introduced.includes(w6[1]) && !S2.items[w6[1]].placed);
  c2.pl.review(w6[2], true, 'typen');
  ok('uit de startmeting en goed: groeit gewoon verder', S2.items[w6[2]].s > 2 && !S2.items[w6[2]].placed);
  S2.placement = { lv: { woorden: .2 } }; let got = null; c2.runSession = (n, q) => { got = q; }; c2.api.startLesson(false);
  const nieuw = new Set(got.filter(x => x.step === 2 && x.type === 'learn').map(x => x.w.id));
  ok('lage woordscore: hooguit 3 nieuwe woorden per les', nieuw.size <= 3 && nieuw.size > 0, [...nieuw].join(', '));
}
// review fase 3: bijsturen ook voor regels en sommen (een makkelijkere oefening)
{ const S3 = { v: 2, introduced: [], items: {}, explained: {}, rounds: {}, log: [], days: {} };
  const c3 = await boot({ S: S3, random: rnd }); c3.NOW = BASE;
  vm.runInContext('let Q=[],qi=0,SESS=[];\n' + fnBlock('adapt') + '\n' + fnBlock('easierEx') + '\nthis.ad={adapt,set:(q,s)=>{Q=q;qi=0;SESS=s},get:()=>Q};', c3);
  const rk = c3.api.get().PACKS.find(p => p.id === 'rk-1'); S3.items['r-10'].reps = 5; S3.items['r-10'].s = 6; S3.items['r-10'].forms = ['voorbeeld', 'korting'];
  const own = c3.api.exQ(rk.exercises.find(e => e.id === 'rk.korting.zelf.gen'), 4, 'nl', 'r-10');
  c3.ad.set([own], [false, false, true, false]); c3.ad.adapt(); const q2 = c3.ad.get()[0];
  ok('onder 65% goed: korting helemaal zelf wordt een lagere afbouwtrede', q2 !== own && q2._easy && (q2.k === 'worked' || q2.k === 'partial'), q2.k);
  const nl = c3.api.get().PACKS.find(p => p.id === 'nl-t1'); S3.items['nl.regel.heb'].reps = 3; S3.items['nl.regel.heb'].forms = ['gap', 'build'];
  const b = c3.api.exQ(nl.exercises.find(e => e.id === 'nl.zin.heb'), 3, 'nl', 'nl.regel.heb');
  c3.ad.set([b], [false, false, false, true]); c3.ad.adapt(); const b2 = c3.ad.get()[0];
  ok('onder 65% goed: zin bouwen wordt een kiesvorm (gatzin) voor dezelfde regel', b2.type === 'gap' && b2.items[0] === 'nl.regel.heb', b2.type);
  c3.ad.set([b], Array(8).fill(true)); c3.ad.adapt();
  ok('bij goed gaan blijft de oefening zoals ze is', c3.ad.get()[0] === b);
}
// feedback eigenaar (13 november): drie rondes op één dag, niet steeds dezelfde woorden en vormen
{ const S4 = { v: 2, introduced: [], items: {}, explained: {}, rounds: {}, log: [], days: {} };
  const c4 = await boot({ S: S4, random: rnd }); c4.NOW = BASE;
  vm.runInContext(fnBlock('canBloom') + '\n' + fnBlock('review') + '\n' + fnBlock('introduce') + '\n' + fnBlock('practiced') + '\nthis.sim={review,introduce,practiced};', c4);
  const run = short => { let got = null; c4.runSession = (n, q) => { got = q; }; c4.api.startLesson(short); return got; };
  const doAll = q => { for (const x of q) { if (x.type === 'explain') { S4.explained[x.x] = c4.NOW; continue; } if (x.type === 'learn') { if (!S4.introduced.includes(x.w.id)) S4.introduced.push(x.w.id); const it = S4.items[x.w.id]; it.reps = Math.max(1, it.reps); it.due = c4.NOW; continue; } if (x.w) { c4.sim.review(x.w.id, true, FORM[x.type]); continue; } if (x.type === 'discount' && x.k === 'worked') { c4.sim.introduce(x.items[0], 'voorbeeld'); continue; } if (x.items && x.items.length) c4.sim.practiced(x, true, x.type === 'listen' && x.p && x.p.mode === 'type' ? 'luisteren' : x.type === 'listen' ? 'listen' : FORM[x.type]); } };
  // vier dagen gewoon leren, zodat er bekende woorden zijn
  for (let d = 0; d < 4; d++) { c4.NOW = BASE + d * DAY; doAll(run(false)); }
  c4.NOW = BASE + 4 * DAY + 3600e3; const today = Math.floor(c4.NOW / DAY) * DAY;
  const r1 = run(false); doAll(r1); S4.rounds[today] = 1; c4.NOW += 1800e3;
  const r2 = run(false); doAll(r2); S4.rounds[today] = 2; c4.NOW += 1800e3;
  const r3 = run(false);
  const words = r => r.filter(x => x.w && x.step === 1).map(x => x.w.id);
  const w1 = new Set(words(r1)), w2 = words(r2), w3 = words(r3);
  ok('ronde 2 en 3 op dezelfde dag: geen woorden uit ronde 1 die toen goed gingen', w2.every(id => !w1.has(id)) && w3.every(id => !w1.has(id) && !w2.includes(id)), [...w1].join(',') + ' | ' + w2.join(',') + ' | ' + w3.join(','));
  ok('ronde 2 en 3 hebben wel iets te doen (herhalen of nieuw)', w2.length > 0 && w3.length > 0);
  const ex = r => r.filter(x => x.exid).map(x => x.exid.split('#')[0]).filter(id => !/\.gen$/.test(id));
  ok('zinnen en klanken: niet dezelfde oefening als in de ronde ervoor', ex(r2).filter(id => ex(r1).includes(id)).length <= 1, ex(r1).join(',') + ' | ' + ex(r2).join(','));
  const types = [...r1, ...r2, ...r3].filter(x => x.w && x.step === 1).map(x => x.type);
  ok('woordvormen wisselen over de rondes (niet alleen typen)', new Set(types).size >= 2, types.join(','));
  ok('na de les: Verder leren start meteen een nieuwe ronde', html.includes("id=\"c-next\"") && html.includes("$('#c-next').onclick=()=>startLesson(false)"));
}
// punt 1 (14 november): nieuw woord eerst als vraag, dagbudget, spreiding binnen een ronde
{ const S5 = { v: 2, introduced: [], items: {}, explained: {}, rounds: {}, log: [], days: {}, newPerDay: 16, newLog: {} };
  const c5 = await boot({ S: S5, random: rnd }); c5.NOW = BASE;
  let q = null; c5.runSession = (n, x) => { q = x; }; c5.api.startLesson(false);
  const probes = q.filter(x => x._probe), learns = q.filter(x => x.type === 'learn'), recogs = q.filter(x => x._ifUnknown && x.type !== 'learn');
  ok('nieuw woord: eerst als vraag (typen), dan de leerkaart, dan later de kiesvraag', probes.length > 0 && probes.every(x => x.type === 'recall') && learns.length === probes.length && recogs.length === probes.length);
  const lastLearn = q.map(x => x.type).lastIndexOf('learn'), firstRecog = q.findIndex(x => x._ifUnknown && x.type !== 'learn');
  ok('de kiesvraag komt na minstens drie andere onderdelen', firstRecog - lastLearn >= 4, 'afstand ' + (firstRecog - lastLearn));
  const per = {}; q.filter(x => x.w).forEach(x => per[x.w.id] = (per[x.w.id] || 0) + 1);
  ok('een woord hooguit drie keer per ronde (vraag, leerkaart, kiesvraag)', Object.values(per).every(n => n <= 3), JSON.stringify(per));
  S5.newLog[Math.floor(c5.NOW / DAY) * DAY] = 16; c5.api.startLesson(false);
  S5.newLog = {}; S5.rounds[Math.floor(c5.NOW / DAY) * DAY] = 2; c5.api.startLesson(false);
  ok('ook een latere ronde op dezelfde dag krijgt nieuwe woorden (zolang het dagbudget het toelaat)', q.some(x => x._probe));
  S5.rounds = {}; S5.newLog[Math.floor(c5.NOW / DAY) * DAY] = 16; c5.api.startLesson(false);
  ok('dagbudget op: geen nieuwe woorden meer vandaag', !q.some(x => x._probe));
  S5.newLog = {}; S5.newPerDay = 8; S5.newLog[Math.floor(c5.NOW / DAY) * DAY] = 6; c5.api.startLesson(false);
  ok('dagbudget 8 met 6 al gebruikt: hooguit 2 nieuw', q.filter(x => x._probe).length === 2);
  // de eerste vraag goed = al gekend: grote sprong, niet in het budget
  vm.runInContext(fnBlock('probeDone') + '\nthis.pd=probeDone;let KNOWN=new Set();', c5);
  const w = c5.api.get().NL[5]; S5.newLog = {}; c5.pd(w, true);
  ok('eerste vraag goed: bloem (14 dagen), controle na twee weken, telt niet mee', S5.items[w.id].s === 14 && S5.items[w.id].due === c5.NOW + 14 * DAY && !(S5.newLog[Math.floor(c5.NOW / DAY) * DAY]));
  const w2 = c5.api.get().NL[6]; c5.pd(w2, false);
  ok('eerste vraag niet goed: gewoon nieuw, telt mee in het budget, geen fout', S5.items[w2.id].lapses === 0 && S5.newLog[Math.floor(c5.NOW / DAY) * DAY] === 1);
  // na een fout: één keer terug, minstens vijf onderdelen later, in een andere vorm
  vm.runInContext('let Q=[],qi=0,RETRIED=new Set();' + line('const OTHER=') + '\n' + fnBlock('easierEx') + '\n' + fnBlock('retryLater') + '\nthis.rt={retryLater,set:(x,i)=>{Q=x;qi=i},get:()=>Q};', c5);
  const ww = c5.api.get().NL[0], Q0 = [{ type: 'recall', w: ww, step: 1 }, ...Array.from({ length: 8 }, (_, i) => ({ type: 'card', step: 2, i })), { type: 'conf', step: 5 }, { type: 'end', step: 5 }];
  c5.rt.set(Q0, 0); c5.rt.retryLater(Q0[0]); c5.rt.retryLater(Q0[0]);
  const Qn = c5.rt.get(), ri = Qn.findIndex(x => x._retry);
  ok('na een fout: één keer terug, zes plekken later, in een andere vorm', ri === 6 && Qn[ri].type === 'recog' && Qn.filter(x => x._retry).length === 1);
}
// punt 2 (14 november): bijsturen op Ik en na de ronde
{ const mk = () => { const S6 = { v: 2, introduced: [], items: {}, explained: {}, rounds: {}, log: [], days: {}, newPerDay: 16, newLog: {}, conf: [] }; return S6; };
  // vier dagen leren zodat er van alles aan de beurt is, dan dezelfde opslag met verschillende instellingen
  const S6 = mk(); const c6 = await boot({ S: S6, random: rnd }); c6.NOW = BASE;
  vm.runInContext(fnBlock('canBloom') + '\n' + fnBlock('review') + '\n' + fnBlock('introduce') + '\n' + fnBlock('practiced') + '\nthis.sim={review,introduce,practiced};', c6);
  const run = () => { let got = null; c6.runSession = (n, x) => { got = x; }; c6.api.startLesson(false); return got; };
  for (let d = 0; d < 4; d++) { c6.NOW = BASE + d * DAY; const r = run(); for (const x of r) { if (x.type === 'learn') { if (!S6.introduced.includes(x.w.id)) S6.introduced.push(x.w.id); const it = S6.items[x.w.id]; it.reps = Math.max(1, it.reps); it.due = c6.NOW; } else if (x.w && !x._probe) c6.sim.review(x.w.id, false, 'typen'); else if (x.items && x.items.length) c6.sim.practiced(x, false, 'gap'); } }
  c6.NOW = BASE + 5 * DAY; const snap = JSON.stringify(S6);
  const withS = (set) => { Object.assign(S6, JSON.parse(snap)); for (const it of Object.values(S6.items)) it.h = [];   /* hier gaat het om bijsturen, niet om rust (H3) of de vorige vorm (H2) */ set(S6); return run(); };
  const kort = withS(o => { o.roundLen = 'kort'; }), normaal = withS(o => { o.roundLen = 'normaal'; }), lang = withS(o => { o.roundLen = 'lang'; });
  const n = r => r.filter(x => !['card', 'conf', 'end', 'explain'].includes(x.type)).length;
  ok('lengte van een ronde: kort < normaal < lang', n(kort) < n(normaal) && n(normaal) < n(lang), n(kort) + ' / ' + n(normaal) + ' / ' + n(lang));
  const moeilijk = withS(o => { o.conf = [{ c: 'moeilijk', fun: 'saai' }]; }), makkelijk = withS(o => { o.conf = [{ c: 'makkelijk', fun: 'leuk' }]; });
  const recalls = r => r.filter(x => x.step === 1 && x.w && ['recall', 'hear'].includes(x.type)).length;
  ok('na "te moeilijk": minder typen bij het ophalen dan na "te makkelijk"', recalls(moeilijk) < recalls(makkelijk), recalls(moeilijk) + ' tegen ' + recalls(makkelijk));
  vm.runInContext('QUIET=true', c6); const stil = withS(o => { o.roundLen = 'lang'; }); vm.runInContext('QUIET=false', c6);
  ok('stille stand: geen luisteroefeningen of horen en opschrijven', !stil.some(x => ['listen', 'hear', 'enhear', 'dictee'].includes(x.type)), stil.map(x => x.type).join(','));
  ok('Bijsturen op Ik: nieuwe woorden per dag, lengte, stille stand, terug naar standaard; geen oefenvormen uitzetten', ['data-npd', 'data-len', 'data-quiet', 'steerReset'].every(k => html.includes(k)) && !html.includes('data-form-off'));
  ok('na de ronde: te makkelijk, goed, te moeilijk en leuk of saai; gaat mee naar de begeleider', html.includes('data-c=\"makkelijk\"') && html.includes('data-f=\"saai\"') && html.includes('steer:{newPerDay:dayBudget()'));
}
// R-M3 (onderbouwing-rekenen.md 2.5): nooit twee sommen met dezelfde aanpak achter elkaar in herhaling; nieuw mag geblokt
{ const cm = vm.createContext({}); vm.runInContext(fnBlock('mixAppr') + '\nthis.mix=mixAppr;', cm);
  const s = (a, o) => ({ type: 'discount', items: ['r-' + a], _appr: a, ...(o || {}) }), w = id => ({ type: 'recall', w: { id } });
  const ap = q => q.filter(x => x._appr).map(x => x._appr).join(',');
  const adj = q => { const r = q.filter(x => !['explain', 'card', 'conf', 'end', 'learn'].includes(x.type)); return r.some((x, i) => i && x._appr && !x._new && !r[i - 1]._new && x._appr === r[i - 1]._appr); };
  const q1 = cm.mix([s('procent'), s('procent'), w('a'), s('geld')]);
  ok('R-M3: twee procentsommen achter elkaar worden gescheiden', !adj(q1), q1.map(x => x._appr || x.w.id).join(' '));
  const q2 = cm.mix([s('procent', { _new: 1 }), s('procent', { _new: 1 }), s('geld')]);
  ok('R-M3: nieuwe sommen mogen geblokt (aanpak eerst leren)', ap(q2) === 'procent,procent,geld');
  const q3 = cm.mix([s('klok'), { type: 'explain', x: 'u.x' }, s('klok'), w('b')]);
  ok('R-M3: een uitleg blijft bij de som erna', q3.findIndex(x => x.type === 'explain') === q3.indexOf(q3.filter(x => x._appr === 'klok')[1]) - 1 && !adj(q3), q3.map(x => x._appr || x.type).join(' '));
  const q5 = cm.mix([s('klok'), s('klok'), { type: 'explain', x: 'u.y' }, s('geld'), s('geld')]);
  ok('R-M3: een som schuift niet over een uitleg heen naar voren', q5[2].type === 'explain', q5.map(x => x._appr || x.type).join(' '));
  const q4 = cm.mix([s('geld'), s('geld')]);
  ok('R-M3: niets om ertussen te zetten: de volgorde blijft (niets valt weg)', q4.length === 2);
  ok('R-M3: elke som kent zijn aanpak (veld approach, anders de vorm)', /function apprOf\(r,e\)\{if\(r&&KIND\[\(r\.items\|\|\[\]\)\[0\]\]==='skill'\)r\._appr=e\.approach\|\|e\.form/.test(html) && /breakTriples\(mixAppr\(noSameForm\(q,learn\)\)\)/.test(html));
}
console.log(fails ? fails + ' FOUT' : 'alles OK');
