// #4: volledigheid van de vertaaltabel en de inhoud
import { readFileSync } from 'node:fs';
const h = readFileSync(new URL('../index.html', import.meta.url), 'utf8');
let fails = 0; const ok = (n, v, extra) => { if (!v) fails++; console.log((v ? 'OK  ' : 'FOUT') + ' ' + n + (v || !extra ? '' : '\n     ' + extra)); };
const a = h.indexOf('const I18N=') + 'const I18N='.length; const b = h.indexOf('\n};', a) + 3;
const I18N = eval('(' + h.slice(a, b).trim().replace(/;$/, '') + ')');
const langs = ['nl', 'th', 'en'];
// sleutels die de code gebruikt
const used = new Set(); for (const m of h.matchAll(/(?<![A-Za-z0-9_$.])(T|t|ts|tx|TB|fbK)\((?:(?:true|false|ok|!ok|[a-z]+),)?'([a-zA-Z0-9.@]+)'/g)) used.add(m[2]);
for (const m of h.matchAll(/\?'([a-z][a-zA-Z0-9.]+)':'([a-z][a-zA-Z0-9.]+)'/g)) { if (I18N.en[m[1]] || I18N.nl[m[1]]) used.add(m[1]); if (I18N.en[m[2]] || I18N.nl[m[2]]) used.add(m[2]); }
for (const m of h.matchAll(/data-i18n="([a-zA-Z0-9.]+)"/g)) used.add(m[1]);
const ex = k => (k in I18N.nl) || (k in I18N.en) || (k in I18N.th);
const allK = [...Object.keys(I18N.nl), ...Object.keys(I18N.en), ...Object.keys(I18N.th)];
const missing = [...used].filter(k => k.endsWith('.') ? !allK.some(x => x.startsWith(k)) : !ex(k));
ok('alle gebruikte sleutels bestaan (' + used.size + ' gevonden)', !missing.length, missing.join(', '));
// elke Nederlandse tekst heeft Thai en Engels (sleutels met alleen steuntaal mogen zonder nl)
const all = new Set([...Object.keys(I18N.nl), ...Object.keys(I18N.th), ...Object.keys(I18N.en)]);
const noTh = [...all].filter(k => !k.includes('@') && !(k in I18N.th) && !/^(sup\.show|moment\.when\.|me\.support)/.test(k));
const noEn = [...all].filter(k => !(k in I18N.en) && k !== 'en.trio');
ok('elke tekst heeft Thai (behalve bewuste uitzonderingen)', !noTh.length, noTh.join(', '));
ok('elke tekst heeft Engels', !noEn.length, noEn.join(', '));
// {plekken} gelijk in alle talen (Thai mag {sup}/{name} weglaten)
const ph = s => typeof s === 'object' ? [ph(s.other), ph(s.one || '')].filter(Boolean).join(',') : [...String(s).matchAll(/\{(\w+)\}/g)].map(m => m[1]).filter(x => x !== 'sup' && x !== 'name').sort().join();
const P = (l, k) => I18N[l][k] == null ? null : new Set(ph(I18N[l][k]).split(',').filter(Boolean));
const bad = [...all].filter(k => { const n = P('nl', k), e = P('en', k), t = P('th', k); if (n && e && [...n].sort().join() !== [...e].sort().join()) return true; if (t && n && [...t].some(x => !n.has(x))) return true; return false; });
ok('dezelfde {plekken} in elke taal', !bad.length, bad.map(k => k + ': ' + langs.map(l => l + '=' + JSON.stringify(I18N[l][k])).join(' ')).join('\n     '));
// meervoud: one/other aanwezig
const pl = [...all].filter(k => langs.some(l => typeof I18N[l][k] === 'object' && !(I18N[l][k].one && I18N[l][k].other)));
ok('meervoudsvormen compleet', !pl.length, pl.join(', '));
// Engelse referentie zonder HTML-tags (vertalers)
const tags = Object.entries(I18N.en).filter(([k, v]) => /<[a-z]/i.test(typeof v === 'object' ? v.other : v)).map(([k]) => k);
ok('Engelse referentieteksten zonder HTML', !tags.length, tags.join(', '));
// inhoud: elk th-veld heeft een en-veld ernaast (woorden, zinnen, verhaal, route, ...)
// leerinhoud staat sinds fase 2 in content/*.json; de vertalingen daar controleert tools/test-pakket.mjs (pakketcheck.js)
ok('geen leerinhoud meer in index.html', !/const (NL|SENT|PAIRS|STORY|PLACE)=\[/.test(h) && !/const (DICTEE|STORY)=\{/.test(h));
// geen Thai buiten tabel/inhoud in de code (uitzondering: het woord ทำบุญ in de boeddhisme-opdracht)
const code = h.slice(h.indexOf('const momentText'));
const thaiCode = code.split('\n').filter(l => /[\u0E00-\u0E7F]/.test(l) && !/Th:|,en:/.test(l) && !l.includes("'<i>ทำบุญ</i>'"));
ok('geen losse Thaise tekst meer in de code', !thaiCode.length, thaiCode.map(l => l.trim().slice(0, 90)).join('\n     '));
// meldingen en terugkoppeling nooit met letterlijke Thaise tekst (die zou ook in de NL-stand en bij steuntaal Engels verschijnen)
const litThai = [...h.matchAll(/(?:toast|fbBox|bi)\(\s*'[^']*'\s*,?\s*'?[^')]*[฀-๿]/g)].map(m => m[0].slice(0, 70)).concat([...h.matchAll(/toast\('[^']*[฀-๿]/g)].map(m => m[0].slice(0, 70)));
ok('geen meldingen of terugkoppeling met letterlijke Thai', !litThai.length, litThai.join('\n     '));
console.log(fails ? fails + ' FOUT' : 'alles OK');
