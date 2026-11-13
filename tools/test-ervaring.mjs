// Ervaringstest (docs/toets-per-stap.md, punt 8): een nagebootste week met het echte weekdoel.
// Faalt bij te veel herhaling of te weinig variatie. Is de lesstof binnen de week op, dan meldt de test welk pakket meer nodig heeft;
// dat telt als fout met --streng (zo hoort het volgens de toets), anders als LET OP zolang spoor A (meer lesstof) loopt.
import vm from 'node:vm';
import { boot, html } from './app-harness.mjs';
const streng = process.argv.includes('--streng');
let fails = 0; const ok = (n, v, extra) => { if (!v) fails++; console.log((v ? 'OK  ' : 'FOUT') + ' ' + n + (v || extra == null ? '' : '\n     ' + extra)); };
const fnBlock = name => { const i = html.indexOf('function ' + name + '('); if (i < 0) throw new Error(name); let d = 0, j = html.indexOf('{', i); for (; j < html.length; j++) { if (html[j] === '{') d++; else if (html[j] === '}') { d--; if (!d) break; } } return html.slice(i, j + 1); };
const line = start => { const i = html.indexOf(start); return html.slice(i, html.indexOf('\n', i)); };
const DAY = 864e5, BASE = Date.UTC(2026, 10, 16, 7);
let seed = 23; const rnd = () => (seed = (seed * 16807) % 2147483647) / 2147483647;

const S = { v: 2, introduced: [], items: {}, explained: {}, rounds: {}, log: [], days: {}, newPerDay: 16, newLog: {}, conf: [], weekGoal: 600 };
const c = await boot({ S, random: rnd }); c.NOW = BASE;
vm.runInContext(line('const NOGROW=') + '\n' + fnBlock('canBloom') + '\n' + fnBlock('review') + '\n' + fnBlock('introduce') + '\n' + fnBlock('practiced') + '\nlet KNOWN=new Set();\n' + fnBlock('probeDone') + '\nthis.sim={review,introduce,practiced,probeDone};', c);
const FORM = { recall: 'typen', hear: 'luisteren', recog: 'herkennen', build: 'build', gap: 'gap', dictee: 'dictee', money: 'geld', clock: 'klok', discount: 'korting' };
const P_GOED = 0.85, P_AL_GEKEND = 0.3, RONDES = 6;   // aannames: 85% goed (doel 80-90%), 30% van de nieuwe woorden kent de leerder al, 6 rondes per dag (10 uur per week)
const rondes = [], probleem = { herhaling: [], vorm: [], klein: [], geenNieuw: [] };
let opDag = null;
for (let d = 0; d < 7; d++) for (let r = 0; r < RONDES; r++) {
  c.NOW = BASE + d * DAY + r * 2 * 3600e3; const td = Math.floor(c.NOW / DAY) * DAY; S.days[td] = 1;
  const stofOver = c.api.get().NL.some(w => !S.introduced.includes(w.id)), woordenOver = c.api.get().NL.filter(w => !S.introduced.includes(w.id)).length, budget = (S.newPerDay || 16) - (S.newLog[td] || 0);
  if (!stofOver && opDag == null) opDag = d;
  let q = null; c.runSession = (n, x) => { q = x; }; c.api.startLesson(false);
  // regels per ronde
  const per = {}; q.forEach(x => { const id = x.w ? x.w.id : x.items && x.items[0]; if (id) per[id] = (per[id] || 0) + 1; });
  const teveel = Object.entries(per).filter(([id, n]) => n > (q.some(x => x.w && x.w.id === id && x._new) ? 3 : 2));
  if (teveel.length) probleem.herhaling.push('dag ' + d + ' ronde ' + r + ': ' + teveel.map(([id, n]) => id + ' ' + n + 'x').join(', '));
  const ty = q.filter(x => !['card', 'conf', 'end', 'explain'].includes(x.type)).map(x => x.type);
  for (let i = 2; i < ty.length; i++) if (ty[i] === ty[i - 1] && ty[i] === ty[i - 2] && !['learn'].includes(ty[i])) { probleem.vorm.push('dag ' + d + ' ronde ' + r + ': ' + ty[i] + ' 3x'); break; }
  const verschillend = Object.keys(per).length;
  if (verschillend < 8 && woordenOver >= 4 && budget > 1) probleem.klein.push('dag ' + d + ' ronde ' + r + ': ' + verschillend + ' [' + q.map(x => x.type + (x.w ? ':' + x.w.id : x.exid ? ':' + x.exid.split('#')[0] : '')).join(' ') + '] budget ' + budget + ' woorden over ' + woordenOver);
  rondes.push({ d, r, n: ty.length, verschillend });
  // spelen als de leerder
  const KNOWN = new Set();
  for (const x of q) {
    if (x._ifUnknown && x.w && KNOWN.has(x.w.id)) continue;
    if (x.type === 'explain') { S.explained[x.x] = c.NOW; continue; }
    if (x._probe) { const k = rnd() < P_AL_GEKEND; c.sim.probeDone(x.w, k); if (k) KNOWN.add(x.w.id); continue; }
    if (x.type === 'learn') { const it = S.items[x.w.id]; it.reps = Math.max(1, it.reps); it.due = c.NOW; continue; }
    const goed = rnd() < P_GOED;
    if (x.w) { c.sim.review(x.w.id, goed, FORM[x.type] || 'typen'); continue; }
    if (x.type === 'discount' && x.k === 'worked') { c.sim.introduce(x.items[0], 'voorbeeld'); continue; }
    if (x.items && x.items.length) c.sim.practiced(x, goed, x.type === 'listen' && x.p && x.p.mode === 'type' ? 'luisteren' : FORM[x.type] || 'gap');
  }
  S.rounds[td] = (S.rounds[td] || 0) + 1; S.conf.unshift({ c: 'goed', fun: 'leuk' });
}
// per dag: iets nieuws zolang er lesstof is en de stapel klein is
for (let d = 0; d < 7; d++) { const td = Math.floor((BASE + d * DAY) / DAY) * DAY; const nieuw = (S.newLog[td] || 0) + S.log.filter(e => e.known && Math.floor(e.t / DAY) * DAY === td).length; if (!nieuw && (opDag == null || d < opDag)) probleem.geenNieuw.push('dag ' + d); }

ok('hetzelfde onderdeel hooguit twee keer per ronde (drie voor een nieuw woord)', !probleem.herhaling.length, probleem.herhaling.slice(0, 5).join('; '));
ok('dezelfde oefenvorm hooguit twee keer achter elkaar', !probleem.vorm.length, probleem.vorm.slice(0, 5).join('; '));
ok('een ronde heeft minstens 8 verschillende onderdelen zolang er lesstof is', !probleem.klein.length, probleem.klein.slice(0, 5).join('; '));
ok('elke dag iets nieuws zolang er lesstof is', !probleem.geenNieuw.length, probleem.geenNieuw.join(', '));
const stofOk = opDag == null;
if (streng) ok('de lesstof is niet binnen de week op', stofOk, 'nl-t1 heeft te weinig woorden: op dag ' + opDag + ' zijn alle nieuwe woorden aangeboden (meer lesstof nodig: spoor A)');
else if (!stofOk) console.log('LET OP de lesstof is op dag ' + opDag + ' op: nl-t1 heeft te weinig woorden voor ' + RONDES + ' rondes per dag (spoor A; met --streng telt dit als fout)');
const gem = rondes.reduce((a, x) => a + x.verschillend, 0) / rondes.length;
console.log('     ' + rondes.length + ' rondes; gemiddeld ' + gem.toFixed(1) + ' verschillende onderdelen per ronde; nieuwe woorden per dag: ' + Array.from({ length: 7 }, (_, d) => S.newLog[Math.floor((BASE + d * DAY) / DAY) * DAY] || 0).join(', '));
console.log(fails ? fails + ' FOUT' : 'alles OK');
