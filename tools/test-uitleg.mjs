// Uitleg (docs/uitleg.md): plaatjes, veilig tonen, uitleg vinden bij een oefening, opslag.
import { readFileSync, readdirSync } from 'node:fs';
import { boot, PC, UV, html, ROOT } from './app-harness.mjs';
let fails = 0; const ok = (n, v, extra) => { if (!v) fails++; console.log((v ? 'OK  ' : 'FOUT') + ' ' + n + (v || !extra ? '' : '\n     ' + extra)); };
const packs = readdirSync(new URL('content/', ROOT)).filter(f => f.endsWith('.json')).map(f => JSON.parse(readFileSync(new URL('content/' + f, ROOT), 'utf8')));
const expl = packs.flatMap(p => (p.explain || []).map(x => ({ x, p })));
const S = PC.safeText;

// 1. elk plaatje van elke uitleg geeft HTML, en elke uitleg heeft 3 tot 6 stappen en minstens één controlevraag
const empty = [];
for (const { x } of expl) x.steps.forEach((st, i) => { if (st.visual && !UV.render(st.visual, S, { lang: 'nl' })) empty.push(x.id + '[' + i + ']'); });
ok('elk plaatje van elke uitleg geeft HTML (' + expl.length + ' uitleg)', expl.length >= 11 && !empty.length, empty.join(', '));
ok('elke uitleg heeft 3 tot 6 stappen', expl.every(({ x }) => x.steps.length >= 3 && x.steps.length <= 6), expl.filter(({ x }) => x.steps.length < 3 || x.steps.length > 6).map(({ x }) => x.id).join(', '));
ok('elke uitleg heeft minstens één controlevraag met de reden', expl.every(({ x }) => x.check && x.check.length && x.check.every(c => c.why)));
ok('elk plaatje met een svg heeft een beschrijving (alt)', expl.every(({ x }) => x.steps.every(st => !st.visual || !['bar', 'line', 'clock', 'fraction'].includes(st.visual.type) || st.visual.alt)), expl.flatMap(({ x }) => x.steps.filter(st => st.visual && ['bar', 'line', 'clock', 'fraction'].includes(st.visual.type) && !st.visual.alt).map(() => x.id)).join(', '));
ok('id\'s van uitleg beginnen met u. en zijn uniek', new Set(expl.map(({ x }) => x.id)).size === expl.length && expl.every(({ x }) => /^u\.(rk|nl|en)\./.test(x.id)));
ok('verhoudingstabel begint met een strook, de tabel komt pas daarna', (() => { const v = expl.find(o => o.x.id === 'u.rk.verhouding').x.steps.map(s => s.visual.type); return v[0] === 'bar' && v.indexOf('ratio') > v.indexOf('bar'); })());
ok('Engelse uitleg: -s, hoofdletters en apostrof', ['u.en.s', 'u.en.hoofdletters', 'u.en.apostrof'].every(id => expl.some(o => o.x.id === id && o.p.learn === 'en')));

// 2. veilig tonen: opmaakcode in een plaatje wordt tekst, een aanhalingsteken in alt breekt het attribuut niet
const evil = { type: 'bar', total: 10, segs: [{ v: 5, label: '<img src=x onerror=alert(1)>', tone: 'x" onclick="y' }], alt: 'a" onload="b' };
const out = UV.render(evil, S);
ok('plaatje: opmaakcode in een label wordt tekst', out.includes('&lt;img') && !out.includes('<img'));
ok('plaatje: aanhalingsteken in alt breekt het attribuut niet', out.includes('aria-label="a&quot; onload=&quot;b"') && !/onload="b/.test(out));
ok('plaatje: onbekende kleur valt terug op mint', out.includes('var(--mint-fill)') && !out.includes('onclick'));
const zin = UV.render({ type: 'zin', rows: [{ parts: [{ t: '<script>x</script>' }] }] }, S);
ok('zin: script wordt tekst', zin.includes('&lt;script&gt;') && !zin.includes('<script'));
ok('onbekend soort plaatje geeft niets', UV.render({ type: 'video', src: 'x' }, S) === '');
const bad = JSON.parse(JSON.stringify(packs.find(p => p.id === 'uitleg-rk'))); bad.explain[0].steps[0].visual.alt = '<b onclick="x">a</b>';
ok('controle weigert opmaakcode in een plaatje', PC.checkPack(bad, packs.filter(p => p.id !== 'uitleg-rk')).errors.some(e => e.includes('niet toegestane tekst')));
const bad2 = JSON.parse(JSON.stringify(packs.find(p => p.id === 'uitleg-rk'))); bad2.explain[0].steps[0].visual.segs[0].tone = 'red';
ok('controle weigert een onbekende kleur in een plaatje', PC.checkPack(bad2, packs.filter(p => p.id !== 'uitleg-rk')).errors.some(e => e.includes('onbekende kleur')));

// 3. de juiste uitleg bij een oefening
const app = await boot(); const g = app.api.get();
ok('app laadt alle uitleg', g.EXPL_LIST.length === expl.length && !g.PACK_MISSING.length);
const f = q => app.api.explFor(q);
ok('uitleg bij zin bouwen: werkwoord op plek twee', f({ type: 'build', items: ['nl.regel.plek2'] }) === 'u.nl.plek2');
ok('uitleg bij de gatzin: persoonsvorm', f({ type: 'gap', items: ['nl.regel.heb'] }) === 'u.nl.persoonsvorm');
ok('uitleg bij korting: op onderdeel (procent)', f({ type: 'discount', items: ['r-25'] }) === 'u.rk.procent');
ok('uitleg bij de klok', f({ type: 'clock', items: ['r-klok'] }) === 'u.rk.klok');
ok('uitleg bij de Engelse gatzin: -s', f({ type: 'engap', items: ['en.regel.s'] }) === 'u.en.s');
ok('geen Nederlandse uitleg bij een Engelse oefening', f({ type: 'engap', items: [] }) !== 'u.nl.persoonsvorm');

// 4. app: speler, ingangen en opslag
ok('opslag: explained en explainVoice in fresh()', /explained:\{\},explainVoice:true/.test(html));
ok('speler is een eigen laag buiten het scherm van de oefening', html.includes("L.id='ulayer'") && html.includes('document.body.appendChild(L)') && !/app\.innerHTML[^;]*ulayer/.test(html));
ok('sluiten stopt het voorlezen en haalt de laag weg', /function closeExplain\(\)\{if\(!UX\)return;try\{speechSynthesis\.cancel\(\)\}/.test(html));
ok('ingangen: tegel, knop boven de oefening, aanbod na twee fouten', html.includes('id="uitleg"') && html.includes("data-uopen=\"${esc(x)}\">${TB('explain.open')}") && html.includes("q._wrong>=2&&explFor(q)"));
ok('uitleg.js en de uitlegpakketten worden geladen en staan in SHELL', html.includes('<script src="uitleg.js"></script>') && readFileSync(new URL('sw.js', ROOT), 'utf8').includes("'./uitleg.js'"));
ok('knoppen: Terug en Opnieuw als pictogram met aria-label, Voorlezen als schakelaar in de kop', /id="uprev"[^>]*aria-label=/.test(html) && /id="uagain" aria-label=/.test(html) && /<div class="u-tools"><button id="uvoice" aria-pressed=[^>]*aria-label=/.test(html));
console.log(fails ? fails + ' FOUT' : 'alles OK');
