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
const c = await boot({ S, random: rnd }); c.NOW = BASE; c.window.speechSynthesis = {};   // het doeltoestel (iPhone) heeft een stem: ook horen en typen
vm.runInContext(fnBlock('canBloom') + '\n' + fnBlock('review') + '\n' + fnBlock('introduce') + '\n' + fnBlock('practiced') + '\nlet KNOWN=new Set();\n' + fnBlock('probeDone') + '\nthis.sim={review,introduce,practiced,probeDone};', c);
const FORM = { recall: 'typen', hear: 'luisteren', recog: 'herkennen', build: 'build', gap: 'gap', dictee: 'dictee', money: 'geld', clock: 'klok', discount: 'korting' };
const P_GOED = 0.85, P_AL_GEKEND = 0.3, RONDES = 6;   // aannames: 85% goed (doel 80-90%), 30% van de nieuwe woorden kent de leerder al, 6 rondes per dag (10 uur per week)
const rondes = [], probleem = { herhaling: [], vorm: [], klein: [], geenNieuw: [] };
// nooit een grind (masterplan H1 tot H4): per onderdeel de rij vormen over de hele week, en de reeks goed in verschillende vormen
const vormRij = {}, reeks = {}, rust = new Set(), grind = { zelfdeVorm: [], stof: [], rustTerug: [] };
const eenVorm = id => { const g = c.api.get(); if (g.NL.some(w => w.id === id) || g.EN.some(w => w.id === id)) return false; const ex = g.PACKS.flatMap(p => p.exercises || []).filter(e => (e.items || [])[0] === id); return new Set(ex.map(e => e.form)).size <= 1; };   // alleen één vorm in de lesstof: een tekort aan lesstof
const zag = (id, vorm, goed, d, r) => { const rij = vormRij[id] = vormRij[id] || []; if (rij.length && rij[rij.length - 1] === vorm && grind.zelfdeVorm.length < 400) (eenVorm(id) ? grind.stof : grind.zelfdeVorm).push('dag ' + d + ' ronde ' + r + ': ' + id + ' weer ' + vorm); rij.push(vorm);
  if (rust.has(id) && !(S.items[id] && S.items[id].due <= c.NOW)) grind.rustTerug.push('dag ' + d + ' ronde ' + r + ': ' + id);
  const k = reeks[id] = reeks[id] || []; k.push([d, vorm, goed]); const L = k.slice(-3);   // rust: drie keer op rij goed, drie vormen, drie dagen, zeven dagen ertussen (H3, MOTOR.restDays en restSpan)
  if (L.length === 3 && L.every(x => x[2]) && new Set(L.map(x => x[1])).size >= 3 && new Set(L.map(x => x[0])).size >= 3 && L[2][0] - L[0][0] >= 7) rust.add(id); };
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
  for (let i = 2; i < ty.length; i++) if (ty[i] === ty[i - 1] && ty[i] === ty[i - 2] && !['learn'].includes(ty[i])) { probleem.vorm.push('dag ' + d + ' ronde ' + r + ': ' + ty[i] + ' 3x [' + q.map(x => x.type + (x._probe ? '?' : x._ifUnknown ? '*' : '')).join(' ') + ']'); break; }
  const verschillend = Object.keys(per).length;
  const nieuwHier = q.filter(x => x._new && x.type === 'learn').length, dueOver = Object.keys(S.items).filter(id => S.items[id].reps > 0 && S.items[id].due <= c.NOW && !per[id]).length;   // uitleg bij de eisen 9: kort mag als er niets zinnigs meer was
  if (verschillend < 8 && ((woordenOver >= 4 && budget - nieuwHier > 1) || dueOver > 0)) probleem.klein.push('dag ' + d + ' ronde ' + r + ': ' + verschillend + ' [' + q.map(x => x.type + (x.w ? ':' + x.w.id : x.exid ? ':' + x.exid.split('#')[0] : '')).join(' ') + '] budget ' + budget + ' woorden over ' + woordenOver);
  rondes.push({ d, r, n: ty.length, verschillend });
  // spelen als de leerder
  const KNOWN = new Set();
  for (const x of q) {
    if (x._ifUnknown && x.w && KNOWN.has(x.w.id)) continue;
    if (x.type === 'explain') { S.explained[x.x] = c.NOW; continue; }
    if (x._probe) { const k = rnd() < P_AL_GEKEND; c.sim.probeDone(x.w, k); if (k) KNOWN.add(x.w.id); continue; }
    if (x.type === 'learn') { const it = S.items[x.w.id]; it.reps = Math.max(1, it.reps); it.due = c.NOW; continue; }
    const goed = rnd() < P_GOED;
    if (x.w) { zag(x.w.id, FORM[x.type] || 'typen', goed, d, r); c.sim.review(x.w.id, goed, FORM[x.type] || 'typen'); continue; }
    if (x.type === 'discount' && x.k === 'worked') { c.sim.introduce(x.items[0], 'voorbeeld'); continue; }
    if (x.items && x.items.length) zag(x.items[0], x.type, goed, d, r);
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
// H1: losse herhaling (Onderweg) hooguit een vijfde van de leertijd. De nagebootste dag bestaat nu alleen uit Onderweg-rondes:
// scènes, algemene ontwikkeling en spel staan nog niet in de dagindeling (masterplan stap 5 en 11). H2 en H3 vragen een samensteller
// die vormen over dagen bijhoudt en wat rust niet meer losse oefent; H4 een melding als de nieuwe lesstof op is. Tot dat gebouwd is: LET OP, met --streng FOUT.
const Hs = [   // H2 tot H4 gelden nu (antwoord ontwerpsessie 14 nov 2026): FOUT. H1 komt met masterplan stap 5: tot dan LET OP
  ['H2 een onderdeel nooit twee keer achter elkaar in dezelfde vorm, ook niet over dagen', !grind.zelfdeVorm.length, grind.zelfdeVorm.length + ' keer, bijvoorbeeld ' + grind.zelfdeVorm.slice(0, 3).join('; ')],
  ['H3 wat rust komt alleen terug als het volgens zijn wachttijd aan de beurt is (niet als opvulling), en telt niet als dorst', !grind.rustTerug.length && vm.runInContext(fnBlock('dorst') + ';Object.keys(S.items).filter(id=>rests(id)&&dorst(id)).length===0', c), grind.rustTerug.length + ' keer (' + rust.size + ' onderdelen in rust), bijvoorbeeld ' + grind.rustTerug.slice(0, 3).join('; ')],
  ['H4 is de nieuwe lesstof op, dan zegt de app dat en vult niet op met sommen die niet aan de beurt zijn', html.includes('"stock.out"') && html.includes('${stockOut()?') && html.includes('round.shortStock'), 'melding of rem ontbreekt'],
];
for (const [n, v, extra] of Hs) ok(n, v, extra);
if (grind.stof.length) console.log('LET OP H2 bij onderdelen met maar één vorm in de lesstof: ' + grind.stof.length + ' keer (meer werkvormen nodig, redactielijn), bijvoorbeeld ' + grind.stof.slice(0, 3).join('; '));
const H = [
  ['H1 losse herhaling hooguit een vijfde van de leertijd', false, 'de nagebootste week is ' + rondes.length + ' Onderweg-rondes en niets anders (100%); de dagindeling met scènes en algemene ontwikkeling bestaat nog niet'],
];
for (const [n, v, extra] of H) { if (streng) ok(n, v, extra); else console.log((v ? 'OK  ' : 'LET OP') + ' ' + n + (v ? '' : '\n     ' + extra)); }
const gem = rondes.reduce((a, x) => a + x.verschillend, 0) / rondes.length;
console.log('     ' + rondes.length + ' rondes; gemiddeld ' + gem.toFixed(1) + ' verschillende onderdelen per ronde; nieuwe woorden per dag: ' + Array.from({ length: 7 }, (_, d) => S.newLog[Math.floor((BASE + d * DAY) / DAY) * DAY] || 0).join(', '));
console.log(fails ? fails + ' FOUT' : 'alles OK');
