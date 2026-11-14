// Lijnstap geluid (docs/geluid.md): verzamel per pakket de Nederlandse teksten die de app voorleest (plus de vaste zinnen in
// index.html als pakket "app"), maak de ontbrekende bestanden en schrijf per pakket de lijst audio/<pakket>.json.
// Gebruik:
//   node redactie/geluid.mjs --controleer      alleen nagaan; exit 1 als er een bestand of lijst ontbreekt (de poort)
//   node redactie/geluid.mjs                   ontbrekende bestanden maken, lijsten bijwerken, ongebruikte bestanden opruimen
// Het spraakprogramma staat buiten de repo. TONAOR_STEM wijst naar die map (met venv/, maak.py en stemmen/<stem>.onnx).
// Zonder TONAOR_STEM: alleen de lijst met wat ontbreekt in redactie/uit/geluid-todo.txt, exit 1 als er iets ontbreekt.
// Een lijst audio/<pakket>.json wordt pas geschreven als al zijn bestanden er zijn (review geluid K6).
import { readFileSync, writeFileSync, readdirSync, existsSync, mkdirSync, unlinkSync } from 'node:fs';
import { execFileSync } from 'node:child_process';
import { createRequire } from 'node:module';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';

const PC = createRequire(import.meta.url)('../pakketcheck.js');
const ROOT = fileURLToPath(new URL('../', import.meta.url));
const STEM = 'pim', MODEL = 'nl_NL-pim-medium.onnx';   // de stem staat ook in index.html (AUDIOSTEM)
const check = process.argv.includes('--controleer');
const dir = join(ROOT, 'audio', 'nl', STEM);

// teksten per pakket
const sets = readdirSync(join(ROOT, 'content')).filter(f => f.endsWith('.json') && f !== 'index.json')
  .map(f => JSON.parse(readFileSync(join(ROOT, 'content', f), 'utf8'))).map(p => ({ id: p.id, texts: PC.audioTexts(p) }));
// vaste zinnen die de app zelf voorleest: say('…') en say("…") in index.html
const html = readFileSync(join(ROOT, 'index.html'), 'utf8'), lit = [];
for (const m of html.matchAll(/\bsay\((['"])((?:(?!\1)[^\\]|\\.)+)\1/g)) lit.push(m[2].replace(/\\(.)/g, '$1'));
sets.push({ id: 'app', texts: PC.withParts(lit) });

const want = new Map();   // hash -> tekst
const lists = sets.filter(s => s.texts.length).map(s => {
  const hs = [...new Set(s.texts.map(t => { const h = PC.audioHash(t, STEM); if (!want.has(h)) want.set(h, t); return h; }))].sort();
  return { id: s.id, file: join(ROOT, 'audio', s.id + '.json'), body: JSON.stringify({ stem: STEM, h: hs }) + '\n', hs };
});
const has = h => existsSync(join(dir, h + '.m4a'));
const missing = [...want].filter(([h]) => !has(h));

if (check) {
  const stale = lists.filter(l => !existsSync(l.file) || readFileSync(l.file, 'utf8') !== l.body).map(l => l.id);
  if (stale.length) console.log('FOUT lijst niet bij: ' + stale.join(', ') + ' (draai node redactie/geluid.mjs)');
  if (missing.length) console.log('FOUT ' + missing.length + ' teksten zonder geluid, bijvoorbeeld: ' + missing.slice(0, 3).map(m => m[1]).join(' | '));
  if (!stale.length && !missing.length) console.log('geluid in orde (' + want.size + ' teksten)');
  process.exit(stale.length || missing.length ? 1 : 0);
}

mkdirSync(join(ROOT, 'redactie', 'uit'), { recursive: true });
const todo = join(ROOT, 'redactie', 'uit', 'geluid-todo.txt');
writeFileSync(todo, missing.map(([h, t]) => h + '\t' + t.replace(/[\t\n]/g, ' ')).join('\n') + '\n');
console.log(missing.length + ' bestanden te maken');
if (missing.length) {
  const S = process.env.TONAOR_STEM;
  if (!S) { console.log('TONAOR_STEM niet gezet: lijst staat in redactie/uit/geluid-todo.txt'); process.exit(1); }
  const py = existsSync(join(S, 'venv', 'Scripts', 'python.exe')) ? join(S, 'venv', 'Scripts', 'python.exe') : join(S, 'venv', 'bin', 'python');
  try { execFileSync(py, [join(S, 'maak.py'), join(S, 'stemmen', MODEL), dir, todo], { stdio: 'inherit' }); } catch (e) { console.log('maken mislukt'); }
}
// lijsten alleen als alles er is
let bad = 0;
mkdirSync(join(ROOT, 'audio'), { recursive: true });
for (const l of lists) { if (l.hs.every(has)) writeFileSync(l.file, l.body); else { bad++; console.log('lijst niet geschreven (bestanden ontbreken): ' + l.id); } }
// opruimen: bestanden en lijsten die niemand meer gebruikt
if (!bad) {
  for (const f of readdirSync(dir)) if (f.endsWith('.m4a') && !want.has(f.slice(0, -4))) unlinkSync(join(dir, f));
  const ids = new Set(lists.map(l => l.id + '.json'));
  for (const f of readdirSync(join(ROOT, 'audio'))) if (f.endsWith('.json') && !ids.has(f)) unlinkSync(join(ROOT, 'audio', f));
}
console.log(bad ? 'niet klaar' : 'klaar: ' + want.size + ' teksten');
process.exit(bad ? 1 : 0);
