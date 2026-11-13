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
vm.runInContext(line('const NOGROW=') + '\n' + fnBlock('canBloom') + '\n' + fnBlock('review') + '\n' + fnBlock('introduce') + '\n' + fnBlock('practiced') + '\nthis.sim={review,introduce,practiced};', ctx);
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
const sigs = [], tooMany = [];
for (let d = 0; d < 7; d++) {
  ctx.NOW = BASE + d * DAY; S.days[Math.floor(ctx.NOW / DAY) * DAY] = 1;
  const r = lesson(false); sigs.push(sig(r)); answer(r.q);
  for (const step of [3, 4]) { const t = r.q.filter(x => x.step === step && x.type !== 'explain').map(x => x.type); for (let i = 2; i < t.length; i++) if (t[i] === t[i - 1] && t[i] === t[i - 2]) tooMany.push('dag ' + d + ' stap ' + step + ': ' + t.join(',')); }
}
ok('de les is elke dag anders (7 dagen)', new Set(sigs).size === 7, sigs.join('\n     '));
ok('elke les heeft oefenen (stap 3) en rekenen (stap 4)', sigs.every(s => / (build|gap|listen|dictee):/.test(s)) && sigs.every(s => /(money|clock|discount):/.test(s)));
const nlKinds = ctx.api.get().PACKS.filter(p => p.learn === 'nl').flatMap(p => p.items || []).filter(x => ['rule', 'sound', 'skill'].includes(x.kind)).map(x => x.id);
const notYet = nlKinds.filter(id => !(S.items[id] && S.items[id].reps > 0));
ok('na 7 dagen zijn alle regels, klanken en rekenvaardigheden aan bod geweest', !notYet.length, notYet.join(', '));
ok('dezelfde oefenvorm hooguit twee keer achter elkaar', !tooMany.length, tooMany.join('; '));
ok('iets nieuws begint met de uitleg (als die er is)', sigs[0].includes('explain:u.rk.'));
ok('korting bouwt af: eerst het voorbeeld, daarna zelf', (() => { const i = sigs.findIndex(s => s.includes('discount:rk.korting.voorbeeld')), j = sigs.findIndex(s => /discount:rk\.korting\.(deel|zelf)/.test(s)); return i >= 0 && (j < 0 || j > i); })(), sigs.filter(s => s.includes('discount')).join('\n     '));
// een tweede ronde op dezelfde dag is kort
S.rounds[Math.floor(ctx.NOW / DAY) * DAY] = 1; const second = lesson(false);
ok('tweede ronde op een dag: kort recept (ophalen en oefenen)', second.name === 'Korte les' && second.q.length < 15, second.name + ' ' + second.q.length);
// opstartvolgorde: variabelen die na het laden gebruikt worden, moeten eerder gedeclareerd zijn (anders blijft de app op 'Lesstof laden' hangen)
ok('KIND is gedeclareerd vóór het eerste gebruik bij het opstarten', html.indexOf('let KIND={}') > 0 && html.indexOf('let KIND={}') < html.indexOf('KIND[x.id]=x.kind') && html.indexOf('let KIND={}') < html.indexOf('await loadPacks();'));
ok('de leerklok kan niet struikelen over het laden', html.includes('function learning(){try{'));
// startmeting gebruiken (stap 7, docs/herhaalmodel.md sectie 9)
{ const S2 = { v: 2, introduced: [], items: {}, explained: {}, rounds: {}, log: [], days: {} };
  const c2 = await boot({ S: S2, random: rnd }); c2.NOW = BASE;
  vm.runInContext(line('const NOGROW=') + '\n' + fnBlock('canBloom') + '\n' + fnBlock('review') + '\n' + fnBlock('placeFromLevels') + '\nthis.pl={review,placeFromLevels};', c2);
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
console.log(fails ? fails + ' FOUT' : 'alles OK');
