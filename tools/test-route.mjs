// Test van de route met tijd (docs/route-en-prognose.md, docs/ontwerp-stap4.md): tempo, datum, bandbreedte, bijstelling, lege geschiedenis,
// een maand zonder leertijd, tijd buiten de app, het routepakket en de koppeling in de app.
import { createRequire } from 'node:module';
import { readFileSync } from 'node:fs';
const require = createRequire(import.meta.url);
const RC = require('../route.js');
const ROUTE = JSON.parse(readFileSync(new URL('../content/route-nt2.json', import.meta.url), 'utf8'));
let fout = 0;
const ok = (c, m) => { if (!c) { fout++; console.log('FOUT: ' + m); } };
const DAY = RC.DAY, WEEK = RC.WEEK, sh = ROUTE.aandeel;
const T0 = new Date(2026, 10, 16, 12).getTime();   // een vaste dag
const day = n => { const d = new Date(T0 - n * DAY); d.setHours(0, 0, 0, 0); return d.getTime(); };
const near = (a, b, tol) => Math.abs(a - b) <= tol;

/* 1. het routepakket */
ok(RC.checkRoute(ROUTE).length === 0, 'route-nt2 is in orde: ' + RC.checkRoute(ROUTE).join('; '));
ok(RC.checkRoute({ ...ROUTE, aandeel: { nl: 0.5, rk: 0.3, en: 0.1 } }).some(m => /samen 1/.test(m)), 'aandeel dat niet optelt tot 1 geweigerd');
ok(RC.checkRoute({ ...ROUTE, poorten: [{ id: 'x', na: 'BESTAAT-NIET', marge: 0, naam: { nl: 'x', th: 'x', en: 'x' } }] }).some(m => /na moet/.test(m)), 'poort na een onbekend blok geweigerd');
ok(RC.checkRoute({ ...ROUTE, banen: [{ ...ROUTE.banen[0], blokken: [{ ...ROUTE.banen[0].blokken[0], lo: 300, hi: 200 }] }] }).some(m => /hi >= lo/.test(m)), 'blok met hi < lo geweigerd');
ok(RC.checkRoute({ ...ROUTE, banen: [{ ...ROUTE.banen[0], blokken: [ROUTE.banen[0].blokken[0], ROUTE.banen[0].blokken[0]] }] }).some(m => /twee keer/.test(m)), 'dubbel blok-id geweigerd');
ok(RC.checkRoute({ ...ROUTE, type: 'hoofdstuk' }).length === 1, 'geen route geweigerd');

/* 2. lege geschiedenis: tempo = weekdoel naar aandeel; doorgerekend als in het ontwerp (10 uur: Nederlands 6 uur per week) */
const leeg = { mins: {}, minsV: {}, outside: {} };
const tp = RC.tempo(leeg, 'nl', sh, T0, 600);
ok(tp.bron === 'doel' && near(tp.h, 6, 1e-9), 'lege geschiedenis: tempo Nederlands = 6 uur (weekdoel 10 uur x 0,6)');
const g1 = ROUTE.poorten.find(g => g.id === 'nt2-1');
const f = RC.forecast(ROUTE, g1, 0, 6, T0, {});
ok(near((f.mid - T0) / WEEK, 325 / 6 + 8, 0.01), 'programma I bij 6 uur Nederlands: 325/6 weken + 8 weken marge (' + ((f.mid - T0) / WEEK).toFixed(1) + ')');
ok(near((f.lo - T0) / WEEK, 250 / 6 + 8, 0.01) && near((f.hi - T0) / WEEK, 400 / 6 + 8, 0.01), 'bandbreedte uit lo (250) en hi (400)');
ok(f.lo < f.mid && f.mid < f.hi, 'vroegst < verwacht < laatst');
const f35 = RC.forecast(ROUTE, g1, 0, 2.1, T0, {});
ok(near((f35.mid - T0 - 8 * WEEK) / WEEK, 154.8, 0.5), '3,5 uur per week: ongeveer 155 weken (ontwerp)');
ok(RC.forecast(ROUTE, g1, 0, 0, T0, {}) === null, 'tempo 0: geen datum');

/* 2b. startpunt (besluit ontwerpsessie): de leertijd in de app telt als gedaan; lege geschiedenis en tien uur geven verschillende data */
{ const S10 = { mins: { [day(40)]: 600 }, minsV: {}, outside: {} }, d0 = RC.doneHours(leeg, 'nl', sh), d10 = RC.doneHours(S10, 'nl', sh);
  ok(d0 === 0 && near(d10, 6, 1e-9), 'tien uur leertijd = zes uur Nederlands gedaan');
  ok(RC.forecast(ROUTE, g1, d10, 6, T0, {}).mid < RC.forecast(ROUTE, g1, d0, 6, T0, {}).mid, 'met tien uur leertijd een eerdere datum dan met een lege geschiedenis'); }
/* 3. tempo uit de laatste vier weken, per vak; oude dagen verdeeld 60/30/10 */
const S1 = { mins: {}, minsV: {}, outside: {} };
for (let i = 0; i < 60; i++) S1.mins[day(i)] = 60;   // 60 dagen lang een uur per dag, alleen in het oude veld
const t1 = RC.tempo(S1, 'nl', sh, T0, 600);
ok(t1.bron === 'tempo' && near(t1.h, 7 * 0.6, 1e-6), 'tempo: 7 uur per week, Nederlands 60% = 4,2 (' + t1.h + ')');
ok(near(RC.doneHours(S1, 'rk', sh), 60 * 0.3, 1e-6), 'gedaan rekenen: 60 uur x 0,3');
const S2 = { mins: { [day(0)]: 30 }, minsV: { [day(0)]: { nl: 10, rk: 20, en: 0 } }, outside: {} };
ok(near(RC.dayVak(S2, day(0), sh).rk, 20, 1e-9), 'met de klok per vak telt die, niet het aandeel');

/* 4. een maand zonder leertijd: het tempo zakt, de datum schuift later */
const S3 = { mins: {}, minsV: {}, outside: {} };
for (let i = 35; i < 90; i++) S3.mins[day(i)] = 90;   // tot vijf weken geleden, daarna niets
const t3 = RC.tempo(S3, 'nl', sh, T0, 600);
ok(t3.bron === 'tempo' && t3.h === 0, 'vier weken niets: tempo 0 (geen datum, geen verwijt)');
const S4 = { mins: {}, minsV: {}, outside: {} };
for (let i = 0; i < 90; i++) S4.mins[day(i)] = i < 28 ? 30 : 90;
const t4 = RC.tempo(S4, 'nl', sh, T0, 600), t4b = RC.tempo({ ...S4, mins: Object.fromEntries(Object.keys(S4.mins).map(k => [k, 90])) }, 'nl', sh, T0, 600);
ok(t4.h < t4b.h, 'minder leertijd in vier weken = lager tempo');
ok(RC.forecast(ROUTE, g1, 10, t4.h, T0, {}).mid > RC.forecast(ROUTE, g1, 10, t4b.h, T0, {}).mid, 'lager tempo = latere datum');
ok(RC.shiftWeeks(T0, T0 + 3 * WEEK) === 3 && RC.shiftWeeks(T0, T0 - 2 * WEEK) === -2, 'verschuiving in hele weken');

/* 5. in de eerste twee weken telt het weekdoel */
const S5 = { mins: { [day(3)]: 600 }, minsV: {}, outside: {} };
ok(RC.tempo(S5, 'nl', sh, T0, 600).bron === 'doel', 'eerste twee weken: weekdoel, ook na één lange dag');

/* 6. tijd buiten de app: telt als Nederlands, hooguit 60 minuten per dag */
const S6 = { mins: {}, minsV: {}, outside: { [day(0)]: { lezen: 45, les: 45 } } };
ok(RC.outsideMins(S6, day(0)) === 60, 'buiten de app: hooguit 60 per dag');
ok(RC.dayVak(S6, day(0), sh).nl === 60 && RC.dayVak(S6, day(0), sh).rk === 0, 'buiten de app telt als Nederlands');
ok(RC.outsideMins({ outside: { [day(0)]: 'x' } }, day(0)) === 0, 'onzin in buiten de app telt niet');

/* 7. blokken en voortgang */
const bl = RC.blocks(ROUTE.banen[0], 130, {});
ok(near(bl[0].prog, 130 / 260, 1e-9) && bl[1].prog === 0, 'N1 half gedaan bij 130 van 260 uur (midden), N2 nog niet');
ok(RC.blocks(ROUTE.banen[0], 999, {}).every(o => o.prog === 1), 'alles af bij genoeg uren');

/* 8. bijstellen na een blok (gemiddelde van schatting en werkelijkheid) */
const fA = RC.adjusted(1, 260, 200);
ok(near(fA, 230 / 260, 1e-9), 'blok in 200 in plaats van 260 uur: factor 230/260');
ok(RC.blocks(ROUTE.banen[0], 0, { nl: fA })[1].end.mid < RC.blocks(ROUTE.banen[0], 0, {})[1].end.mid, 'met de bijstelling komt de poort eerder');
ok(RC.factor({ nl: 'x' }, 'nl') === 1 && RC.factor({ nl: 99 }, 'nl') === 1, 'onzin of een extreme factor telt niet');
ok(RC.adjusted(1, 0, 100) === 1, 'zonder schatting geen bijstelling');

/* 9. de eerstvolgende poort */
const lst = ROUTE.poorten.map(g => ({ g, f: RC.forecast(ROUTE, g, 0, 6 * (RC.baanOf(ROUTE, g.na).vak === 'nl' ? 1 : RC.baanOf(ROUTE, g.na).vak === 'rk' ? 0.5 : 1 / 6), T0, {}) }));
ok(RC.nextGate(lst).g.id === 'nt2-1', 'bij 10 uur per week is programma I de eerstvolgende poort');

/* 9b. verschuiving tegen de week van vier weken eerder, ook over de zomertijd heen (codereview route 5) */
{ const wk = t => RC.monday(t), w0 = wk(new Date(2027, 3, 19, 12).getTime()), w4 = wk(new Date(2027, 2, 22, 12).getTime());   // vier maandagen terug, over 28 maart (zomertijd)
  const prog = { [w4]: { a: [0, 1000 * WEEK, 0] }, [w0]: { a: [0, 1003 * WEEK, 0] } };
  ok(RC.shiftFrom(prog, w0, 'a') === 3, 'drie weken later, ook als de zomertijd ertussen valt');
  ok(RC.shiftFrom({ [w0]: { a: [0, 1, 0] } }, w0, 'a') === null, 'zonder week van vier weken eerder: geen verschuiving');
  ok(RC.shiftFrom({ [w4]: { b: [0, 1, 0] }, [w0]: { a: [0, 1, 0] } }, w0, 'a') === null, 'andere poort in de oude week: geen verschuiving');
  ok(RC.shiftFrom('x', w0, 'a') === null, 'onzin in de opslag: geen verschuiving'); }
/* 9c. checkRoute vangt rommel zonder te crashen (codereview route 10) */
ok(RC.checkRoute({ ...ROUTE, banen: [null] }).some(m => /geen baan/.test(m)), 'null-baan geeft een melding');
ok(RC.checkRoute({ ...ROUTE, banen: [ROUTE.banen[0], ROUTE.banen[0]] }).some(m => /heeft al een baan/.test(m)), 'twee banen met hetzelfde vak geweigerd');
ok(RC.checkRoute({ ...ROUTE, poorten: [ROUTE.poorten[0], ROUTE.poorten[0]] }).some(m => /twee keer/.test(m)), 'dubbele poort-id geweigerd');
ok(RC.checkRoute({ ...ROUTE, poorten: [null] }).some(m => /geen poort/.test(m)), 'null-poort geeft een melding');
/* 10. de app: koppeling, opslag, teksten */
const html = readFileSync(new URL('../index.html', import.meta.url), 'utf8'), sw = readFileSync(new URL('../sw.js', import.meta.url), 'utf8');
ok(/<script src="route.js"><\/script>/.test(html) && /'\.\/route\.js'/.test(sw) && /'\.\/content\/route-nt2\.json'/.test(sw), 'route.js en het routepakket in de app en de offline-cache');
ok(/const SCHEMA=7/.test(html) && /6:s=>\{for\(const k of \['minsV','outside','prog','blockAdj'\]\)/.test(html), 'SCHEMA 7: de stap 6 -> 7 voegt alleen toe');
ok(/minsV:\{\},outside:\{\},prog:\{\},blockAdj:\{\}/.test(html), 'nieuwe opslag begint met lege velden');
ok(/function routeLine\(/.test(html) && /\$\{routeLine\(\)\}/.test(html), 'de datum op Vandaag');
ok(!/route\.next\.placed":"[^"]*Emiel/.test(html), 'geen naam meer in de tekst bij de volgende mijlpaal');
ok(/UX&&UX\.e\?\(UX\.e\.learn==='en'/.test(html) && /function startSpeed\(\)\{\n  app\.dataset\.vak='nl'/.test(html), 'klok per vak: uitleg en snelronde tellen bij hun eigen vak');
ok(/if\(!cur\|\|\(c\.next&&!cur\[c\.next\.g\.id\]\)\)/.test(html), 'een week die zonder tempo begon, wordt opnieuw vastgelegd');

console.log(fout ? fout + ' FOUT(EN)' : 'test-route: alles OK');
process.exit(fout ? 1 : 0);
