// De poort voor geluid (docs/geluid.md, eis F7): elk pakket heeft een bestand voor elke Nederlandse tekst die de app voorleest,
// en de lijst audio/<pakket>.json is bij. Herstellen: node redactie/geluid.mjs (met TONAOR_STEM gezet).
import { execFileSync } from 'node:child_process';
import { readFileSync, existsSync, readdirSync, statSync } from 'node:fs';
import { createRequire } from 'node:module';
let fails = 0; const ok = (n, v, extra) => { if (!v) fails++; console.log((v ? 'OK  ' : 'FOUT') + ' ' + n + (v || !extra ? '' : '\n     ' + extra)); };
const ROOT = new URL('../', import.meta.url), PC = createRequire(import.meta.url)('../pakketcheck.js');
let out = '', code = 0;
try { out = execFileSync('node', ['redactie/geluid.mjs', '--controleer'], { cwd: ROOT, encoding: 'utf8' }); } catch (e) { out = String(e.stdout || ''); code = 1; }
ok('elk pakket heeft geluid voor alles wat de app voorleest, en de lijst per pakket is bij', code === 0, out.trim());
// de sleutel is in de app en in de lijn dezelfde: zonder slotteken, zonder opmaak, met de stem erbij
ok('sleutel: slotteken, opmaak en spaties tellen niet; stem wel', PC.audioHash('de afspraak.', 'pim') === PC.audioHash('  de <b>afspraak</b>', 'pim') && PC.audioHash('de afspraak', 'pim') !== PC.audioHash('de afspraak', 'alex') && /^[0-9a-f]{14}$/.test(PC.audioHash('x', 'pim')));
ok('zinnen los zonder lookbehind (oude iOS)', JSON.stringify(PC.audioParts('Goed zo! Dat klopt. Nog één?')) === JSON.stringify(['Goed zo!', 'Dat klopt.', 'Nog één?']) && !/\(\?<[=!]/.test(readFileSync(new URL('pakketcheck.js', ROOT), 'utf8')));
ok('vraag en mededeling hebben elk een bestand; een open plek wordt een pauze (review geluid K5, B1)', PC.audioHash('Kom je?', 'pim') !== PC.audioHash('Kom je.', 'pim') && PC.audioKey('Wij ___ om tien uur.') === 'Wij … om tien uur');
ok('aanhalingsteken na het slotteken hoort bij de zin (review geluid B1)', JSON.stringify(PC.audioParts('Sanne lacht. "Dat kun je leren!"')) === JSON.stringify(['Sanne lacht.', '"Dat kun je leren!"']));
ok('ook elke losse zin van een tekst krijgt een bestand (samengevoegde teksten spelen zin voor zin)', PC.withParts(['Eén. Twee?']).length === 3);
ok('vaste zinnen in de app (say met een letterlijke tekst) staan in audio/app.json', existsSync(new URL('audio/app.json', ROOT)) && (() => { const l = JSON.parse(readFileSync(new URL('audio/app.json', ROOT), 'utf8')).h; return l.includes(PC.audioHash('Zo klinkt deze stem. Goedemorgen, hoe gaat het met je?', 'pim')); })());
const swTxt = readFileSync(new URL('sw.js', ROOT), 'utf8');
ok('geluid gaat buiten de service worker om (iOS vraagt een bytebereik; review geluid B2)', swTxt.includes("if(u.origin===location.origin&&/\\/audio\\/.+\\.m4a$/.test(u.pathname))return;"));
const dir = new URL('audio/nl/pim/', ROOT);
if (existsSync(dir)) {
  const files = readdirSync(dir), big = files.filter(f => statSync(new URL(f, dir)).size > 400000);
  ok('elk geluidsbestand is .m4a en kleiner dan 400 kB (een hele leestekst duurt ongeveer een minuut)', files.every(f => /^[0-9a-f]{14}\.m4a$/.test(f)) && !big.length, big.join(', '));
}
const html = readFileSync(new URL('index.html', ROOT), 'utf8'), lijn = readFileSync(new URL('redactie/geluid.mjs', ROOT), 'utf8');
ok('app en lijn gebruiken dezelfde stem', /const AUDIOSTEM='([a-z0-9_-]+)'/.exec(html)[1] === /const STEM = '([a-z0-9_-]+)'/.exec(lijn)[1]);
console.log(fails ? fails + ' FOUT' : 'alles OK');
