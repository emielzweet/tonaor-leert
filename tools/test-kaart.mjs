// Test van kaart en tijdlijn (docs/kaart-en-tijdlijn.md): projectie heen en terug, afstand, tolerantie, de poort en de kaartbestanden.
import { createRequire } from 'node:module';
import { readFileSync } from 'node:fs';
const require = createRequire(import.meta.url);
const K = require('../kaart.js'), PC = require('../pakketcheck.js');
let fout = 0;
const ok = (c, m) => { if (!c) { fout++; console.log('FOUT: ' + m); } };
const kaart = n => JSON.parse(readFileSync(new URL('../kaart/' + n + '.json', import.meta.url), 'utf8'));

/* 1. de kaartbestanden: vorm, maat, licentie, geldige paden en id's (zoals validMap in de app) */
for (const n of K.MAPS) {
  const raw = readFileSync(new URL('../kaart/' + n + '.json', import.meta.url), 'utf8'), d = JSON.parse(raw);
  ok(raw.length <= 80000, n + ': groter dan 80 kB');
  ok(d.lic && /Natural Earth/.test(d.lic.src), n + ': licentie ontbreekt');
  ok(Array.isArray(d.view) && d.view.length === 4, n + ': view');
  ok(d.regions.length > 5, n + ': te weinig gebieden');
  ok(d.regions.every(r => /^[A-Za-z0-9-]{1,40}$/.test(r.id) && /^[MLZ0-9. -]+$/.test(r.d)), n + ': ongeldig id of pad');
  ok(new Set(d.regions.map(r => r.id)).size === d.regions.length, n + ': dubbel id');
  /* 2. projectie heen en terug binnen 1 km */
  const pts = { wereld: [[5, 52], [100, 15], [-70, -30]], europa: [[5, 52], [12.5, 41.9], [-3.7, 40.4]], azie: [[100.5, 13.75], [105.8, 21], [77.2, 28.6]], nederland: [[4.9, 52.37], [5.12, 52.09], [6.57, 53.22]] }[n];
  for (const ll of pts) { const back = K.unproject(d.proj, K.project(d.proj, ll)); ok(K.distKm(ll, back) < 1, n + ': heen en terug ' + ll + ' -> ' + back); }
}
/* 3. afstand: Amsterdam - Parijs ongeveer 430 km, Bangkok - Hanoi ongeveer 990 km */
const dAP = K.distKm([4.9, 52.37], [2.35, 48.86]); ok(dAP > 410 && dAP < 450, 'afstand Amsterdam-Parijs ' + dAP);
const dBH = K.distKm([100.5, 13.75], [105.8, 21.03]); ok(dBH > 950 && dBH < 1030, 'afstand Bangkok-Hanoi ' + dBH);
ok(K.dirOf([4.9, 52.37], [2.35, 48.86]) === 'zuidwest', 'richting Parijs vanuit Amsterdam: ' + K.dirOf([4.9, 52.37], [2.35, 48.86]));

/* 4. de poort voor een kaart */
const nl = kaart('nederland'), eu = kaart('europa');
ok(K.checkMapSpec({ map: 'nederland', answer: 'utrecht' }, nl).length === 0, 'Utrecht aantikken mag');
ok(K.checkMapSpec({ map: 'nederland', answer: 'nergens' }, nl).some(m => /bestaat niet/.test(m)), 'onbekend gebied geweigerd');
ok(K.checkMapSpec({ map: 'maan', answer: 'x' }).length === 1, 'onbekende kaart geweigerd');
ok(K.checkMapSpec({ map: 'europa', answer: [4.9, 52.37] }).some(m => /tol/.test(m)), 'plek zonder tol geweigerd');
ok(K.checkMapSpec({ map: 'europa', answer: [4.9, 52.37], tol: 100 }, eu).length === 0, 'plek met tol mag');
ok(K.checkMapSpec({ map: 'europa', zoom: [0, 45, 10, 55], answer: [30, 60], tol: 50 }).some(m => /uitsnede/.test(m)), 'plek buiten de uitsnede geweigerd');
ok(K.checkMapSpec({ map: 'europa', answer: 'NL' }, eu).some(m => /24 px/.test(m)), 'kleine landen in heel Europa geweigerd (24 px)');
ok(K.checkMapSpec({ map: 'europa', zoom: [-25, 34, 45, 72], hl: ['XX'] }, eu).some(m => /hl/.test(m)), 'hl met onbekend gebied geweigerd');

/* 5. de tijdlijn */
const tl = { from: 1500, to: 2000 };
ok(K.defaultTol(tl) === 50, 'standaardtolerantie 10%');
ok(K.tyear(tl, K.tpos(tl, 1789)) === 1789, 'tijdlijn heen en terug');
const lg = { from: -10000, to: 2025, scale: 'log' };
ok(Math.abs(K.tyear(lg, K.tpos(lg, 1500)) - 1500) <= 1, 'log-tijdlijn heen en terug');
ok(K.tpos(lg, 1900) > K.tpos(lg, 0), 'log: later ligt lager');
const c = (y, at) => ({ y, label: 'x' + y, at });
ok(K.checkCards([c(1600, 1610), c(1800, 1790)], 50), 'goede volgorde binnen tol: goed');
ok(!K.checkCards([c(1600, 1700), c(1800, 1790)], 50), 'buiten tol: fout');
ok(!K.checkCards([c(1600, 1650), c(1640, 1620)], 50), 'verkeerde volgorde binnen tol: fout');
ok(!K.checkCards([c(1600, null), c(1800, 1800)], 50), 'niet alles gelegd: fout');
ok(K.checkTimeline(tl, [c(1600), c(1600)]).some(m => /hetzelfde jaartal/.test(m)), 'twee kaartjes met hetzelfde jaar geweigerd');
ok(K.checkTimeline(tl, [c(1600)]).some(m => /twee tot vijf/.test(m)), 'één kaartje geweigerd');
ok(K.checkTimeline(tl, [c(1400), c(1600)]).some(m => /buiten de lijn/.test(m)), 'kaartje buiten de lijn geweigerd');
ok(K.checkTimeline({ from: 2000, to: 1500 }).length === 1, 'from na to geweigerd');
ok(K.yearText(-500) === '500 v.Chr.', 'jaartal voor Christus');

/* 6. tekenen: id's alleen als aantikbaar, labels verborgen bij de vraag, tekst geescapet */
const svg = K.renderMap(nl, { map: 'nederland', pins: [{ at: [4.9, 52.37], label: '<b>x</b>' }] }, { tap: true });
ok(/data-id="utrecht"/.test(svg) && /role="button"/.test(svg), 'aantikbaar gebied');
ok(!/<b>/.test(svg), 'label geescapet');
ok(!/k-txt/.test(K.renderMap(nl, { map: 'nederland', pins: [{ at: [4.9, 52.37], label: 'A' }] }, { hide: true })), 'labels verborgen bij de vraag');
ok(/t-hit/.test(K.renderTimeline(tl, { cards: [c(1600, 1610)], real: true })), 'tijdlijn met aantikvlak');

/* 7. de poort in pakketcheck: do map en do timeline */
const pack = steps => ({ id: 'tk', type: 'les', title: 'x', scenes: [{ id: 'tk-1', steps }] });
const errs = st => (PC.checkPack(pack([st])).errors || []).filter(e => /answer|tol|cards|gebied|kaart|tijdlijn|jaartal/.test(e));
ok(errs({ type: 'do', form: 'map', map: 'nederland', ask: 'Waar?', why: 'Daar.' }).length > 0, 'do map zonder answer geweigerd');
ok(errs({ type: 'do', form: 'timeline', from: 1500, to: 2000, cards: [c(1600)], ask: 'Wanneer?', why: 'Toen.' }).length > 0, 'do timeline met één kaartje geweigerd');
ok(errs({ type: 'do', form: 'timeline', from: 1500, to: 2000, cards: [{ y: 1600, label: 'a' }, { y: 1800, label: 'b' }], ask: 'Wanneer?', why: 'Toen.' }).length === 0, 'goede do timeline: ' + errs({ type: 'do', form: 'timeline', from: 1500, to: 2000, cards: [{ y: 1600, label: 'a' }, { y: 1800, label: 'b' }], ask: 'Wanneer?', why: 'Toen.' }).join('; '));

/* 8. de app kent de schermen en laadt kaart.js (ook offline) */
const html = readFileSync(new URL('../index.html', import.meta.url), 'utf8'), sw = readFileSync(new URL('../sw.js', import.meta.url), 'utf8');
ok(/<script src="kaart.js"><\/script>/.test(html), 'kaart.js in index.html');
ok(/'\.\/kaart\.js'/.test(sw), 'kaart.js in de offline-cache');
ok(/H\.sc_map=/.test(html) && /H\.sc_tl=/.test(html), 'schermen sc_map en sc_tl');
ok(/function validMap\(/.test(html), 'kaartbestand wordt gecontroleerd voor het tekenen');

console.log(fout ? fout + ' FOUT(EN)' : 'test-kaart: alles OK');
process.exit(fout ? 1 : 0);
