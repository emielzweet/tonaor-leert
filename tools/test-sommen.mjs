// Sommen die niet opraken (docs/herhaalmodel.md sectie 4, fase 3 stap 3): elke getrokken variant is geldig.
import { boot, PC } from './app-harness.mjs';
import { readFileSync } from 'node:fs';
let fails = 0; const ok = (n, v, extra) => { if (!v) fails++; console.log((v ? 'OK  ' : 'FOUT') + ' ' + n + (v || extra == null ? '' : '\n     ' + extra)); };
const app = await boot(); const rk = app.api.get().PACKS.find(p => p.id === 'rk-1'); const ex = id => rk.exercises.find(e => e.id === id);
const draw = (id, n = 300) => Array.from({ length: n }, () => app.api.exQ(ex(id), 4, 'nl'));
const euro = s => { const m = s.match(/^€ (\d+),(\d\d)$/); return m ? +m[1] * 100 + +m[2] : NaN; };

// geld
const M = draw('rk.geld.gen');
ok('geld: elke variant heeft 4 verschillende keuzes, met het goede antwoord erbij', M.every(q => q.d.o.length === 4 && new Set(q.d.o).size === 4 && q.d.o.includes(q.d.a)), JSON.stringify(M.find(q => !(q.d.o.length === 4 && new Set(q.d.o).size === 4))?.d));
ok('geld: het goede antwoord is de som van de munten', M.every(q => euro(q.d.a) === q.d.coins.reduce((a, b) => a + b, 0)));
ok('geld: munten van groot naar klein, 3 tot 6 stuks, met een beschrijving', M.every(q => q.d.coins.length >= 3 && q.d.coins.length <= 6 && q.d.coins.every((c, i, a) => !i || a[i - 1] >= c) && q.d.alt));
ok('geld: elke variant telt als eigen oefening (id#zaad) met het doelitem voorop', M.every(q => /^rk\.geld\.gen#\d+$/.test(q.exid) && q.items[0] === 'r-geld') && new Set(M.map(q => q.exid)).size > 200);

// klok
const C = draw('rk.klok.gen');
const NAMES = ['twaalf', 'één', 'twee', 'drie', 'vier', 'vijf', 'zes', 'zeven', 'acht', 'negen', 'tien', 'elf', 'twaalf'];
const said = (h, m) => { const n = h % 12 + 1; return m === 0 ? NAMES[h] + ' uur' : m === 15 ? 'kwart over ' + NAMES[h] : m === 30 ? 'half ' + NAMES[n] : 'kwart voor ' + NAMES[n]; };
ok('klok: het goede antwoord hoort bij de wijzers', C.every(q => q.c.a === said(q.c.h, q.c.m)));
ok('klok: 4 verschillende keuzes, met het goede antwoord erbij', C.every(q => q.c.o.length === 4 && new Set(q.c.o).size === 4 && q.c.o.includes(q.c.a)), JSON.stringify(C.find(q => !(q.c.o.length === 4 && new Set(q.c.o).size === 4))?.c));
ok('klok: half drie staat tussen de keuzes bij half vier (de bekende valkuil)', C.filter(q => q.c.m === 30).every(q => q.c.o.includes('half ' + NAMES[q.c.h])));
ok('klok: alle uren en kwartieren komen voor', new Set(C.map(q => q.c.h)).size === 12 && new Set(C.map(q => q.c.m)).size === 4);
ok('klok: uitleg per kwartier, vraag uit het pakket (met vertaling)', C.every(q => /^clock\.gen\.(0|15|30|45)$/.test(q.c.gk) && q.c.q && q.c.qTh));

// korting
for (const id of ['rk.korting.deel.gen', 'rk.korting.zelf.gen']) {
  const D = draw(id);
  ok(id + ': korting en te betalen bedrag zijn hele euro\'s', D.every(q => Number.isInteger(q.g.d) && Number.isInteger(q.g.pay) && q.g.d + q.g.pay === q.g.p && q.g.d === q.g.p * q.g.pct / 100));
  ok(id + ': doelitem past bij het percentage (tienden r-10, kwart en helft r-25)', D.every(q => q.items[0] === ([25, 50].includes(q.g.pct) ? 'r-25' : 'r-10')));
}

// de pakketcontrole weigert recepten die niet kloppen
const base = JSON.parse(readFileSync(new URL('../content/rk-1.json', import.meta.url), 'utf8')); const others = app.api.get().PACKS.filter(p => p.id !== 'rk-1');
const bad = mut => { const p = JSON.parse(JSON.stringify(base)); mut(p.exercises.find(e => e.id === 'rk.korting.zelf.gen'), p.exercises.find(e => e.id === 'rk.klok.gen'), p.exercises.find(e => e.id === 'rk.geld.gen')); return PC.checkPack(p, others).errors.join(' | '); };
ok('controle weigert een korting die geen heel bedrag oplevert', /geen heel bedrag/.test(bad(k => { k.gen.price = [10, 50, 10]; k.gen.pct = [25]; })));
ok('controle weigert een munt die niet bestaat', /bestaande munten/.test(bad((k, c, g) => { g.gen.coins = [300]; })));
ok('controle weigert minuten die geen kwartier zijn', /kwartieren/.test(bad((k, c) => { c.gen.m = [10]; })));
ok('de huidige pakketten zijn goed', !PC.checkPack(base, others).errors.length, PC.checkPack(base, others).errors.join(' | '));
console.log(fails ? fails + ' FOUT' : 'alles OK');
