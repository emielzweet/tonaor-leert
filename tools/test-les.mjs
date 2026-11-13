// Zelfde les: de samensteller levert met vaste opslag en vaste zaadwaarde precies de vastgelegde rij (tools/les-verwacht.json).
// Verandert de les bewust, leg dan opnieuw vast met: node tools/les-vastleggen.mjs --huidig (en zeg dat in de commit).
import { readFileSync } from 'node:fs';
import { boot } from './app-harness.mjs';
import { SCENARIOS, summarize, seeded } from './les-scenarios.mjs';
let fails = 0; const ok = (n, v, extra) => { if (!v) fails++; console.log((v ? 'OK  ' : 'FOUT') + ' ' + n + (v || !extra ? '' : '\n     ' + extra)); };
const expected = JSON.parse(readFileSync(new URL('./les-verwacht.json', import.meta.url), 'utf8'));
for (const sc of SCENARIOS) {
  const ctx = await boot({ S: sc.state(), englishDay: sc.englishDay, random: seeded(sc.seed) });
  ctx.NOW = sc.now;
  let got = null; ctx.runSession = (name, q) => { got = { name, q }; };
  if (sc.kind === 'en') ctx.api.startEnglish(); else ctx.api.startLesson(sc.kind === 'short');
  const a = JSON.stringify(summarize(got)), b = JSON.stringify(expected[sc.name]);
  const diff = () => { const x = summarize(got).q, y = expected[sc.name].q; const i = x.findIndex((o, k) => JSON.stringify(o) !== JSON.stringify(y[k])); return 'eerste verschil op plek ' + i + ': ' + JSON.stringify(x[i]) + ' tegenover ' + JSON.stringify(y[i]); };
  ok('zelfde les: ' + sc.name, a === b, a === b ? '' : diff());
}
// de rij is ook bruikbaar: elke oefening heeft wat het scherm nodig heeft
const ctx = await boot({ S: SCENARIOS[2].state(), random: seeded(3) }); ctx.NOW = SCENARIOS[2].now;
let q = null; ctx.runSession = (n, x) => { q = x; }; ctx.api.startLesson(false);
ok('kaarten hebben een weergave', q.filter(x => x.type === 'card').every(x => typeof x.html === 'function'));
ok('gatzin, klok en geld hebben hun gegevens', q.find(x => x.type === 'gap').o.length === 2 && q.find(x => x.type === 'clock').c.qTh && q.find(x => x.type === 'money').d.coins.length >= 3 && q.find(x => x.type === 'money').d.o.length === 4 && q.find(x => x.type === 'money').d.o.includes(q.find(x => x.type === 'money').d.a));
console.log(fails ? fails + ' FOUT' : 'alles OK');
