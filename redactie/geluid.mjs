// Lijnstap geluid (docs/geluid.md): verzamel per pakket de Nederlandse teksten die de app voorleest, maak de ontbrekende
// bestanden en schrijf per pakket de lijst audio/<pakket>.json.
// Gebruik:
//   node redactie/geluid.mjs --controleer      alleen nagaan; exit 1 als er een bestand of lijst ontbreekt (de poort)
//   node redactie/geluid.mjs [pakket-id ...]   lijsten bijwerken en ontbrekende bestanden maken
// Het spraakprogramma staat buiten de repo. TONAOR_STEM wijst naar die map (met venv/, maak.py en stemmen/<stem-bestand>.onnx);
// zonder TONAOR_STEM schrijft het script alleen de lijst met wat ontbreekt naar redactie/uit/geluid-todo.txt.
import { readFileSync, writeFileSync, readdirSync, existsSync, mkdirSync } from 'node:fs';
import { execFileSync } from 'node:child_process';
import { createRequire } from 'node:module';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';

const PC = createRequire(import.meta.url)('../pakketcheck.js');
const ROOT = fileURLToPath(new URL('../', import.meta.url));
const STEM = 'pim', MODEL = 'nl_NL-pim-medium.onnx';   // de stem staat ook in index.html (AUDIOSTEM)
const args = process.argv.slice(2), check = args.includes('--controleer'), only = args.filter(a => !a.startsWith('--'));
const dir = join(ROOT, 'audio', 'nl', STEM);
const packs = readdirSync(join(ROOT, 'content')).filter(f => f.endsWith('.json') && f !== 'index.json').map(f => JSON.parse(readFileSync(join(ROOT, 'content', f), 'utf8')));
let missing = [], stale = [];
for (const p of packs) {
  if (only.length && !only.includes(p.id)) continue;
  const texts = PC.audioTexts(p);
  if (!texts.length) continue;
  const byHash = new Map();
  for (const t of texts) { const h = PC.audioHash(t, STEM); if (!byHash.has(h)) byHash.set(h, t); }
  const list = { stem: STEM, h: [...byHash.keys()].sort() };
  const lf = join(ROOT, 'audio', p.id + '.json');
  const cur = existsSync(lf) ? readFileSync(lf, 'utf8') : '';
  const want = JSON.stringify(list) + '\n';
  if (cur !== want) { if (check) stale.push(p.id); else { mkdirSync(join(ROOT, 'audio'), { recursive: true }); writeFileSync(lf, want); } }
  for (const [h, t] of byHash) if (!existsSync(join(dir, h + '.m4a'))) missing.push([h, t, p.id]);
}
const uniq = [...new Map(missing.map(m => [m[0], m])).values()];
if (check) {
  if (stale.length) console.log('FOUT lijst niet bij: ' + stale.join(', ') + ' (draai node redactie/geluid.mjs)');
  if (uniq.length) console.log('FOUT ' + uniq.length + ' teksten zonder geluid, bijvoorbeeld: ' + uniq.slice(0, 3).map(m => m[2] + ': ' + m[1]).join(' | '));
  if (!stale.length && !uniq.length) console.log('geluid in orde');
  process.exit(stale.length || uniq.length ? 1 : 0);
}
mkdirSync(join(ROOT, 'redactie', 'uit'), { recursive: true });
const todo = join(ROOT, 'redactie', 'uit', 'geluid-todo.txt');
writeFileSync(todo, uniq.map(m => m[0] + '\t' + m[1].replace(/[\t\n]/g, ' ')).join('\n') + '\n');
console.log(uniq.length + ' bestanden te maken');
if (!uniq.length) process.exit(0);
const S = process.env.TONAOR_STEM;
if (!S) { console.log('TONAOR_STEM niet gezet: lijst staat in redactie/uit/geluid-todo.txt'); process.exit(0); }
const py = existsSync(join(S, 'venv', 'Scripts', 'python.exe')) ? join(S, 'venv', 'Scripts', 'python.exe') : join(S, 'venv', 'bin', 'python');
execFileSync(py, [join(S, 'maak.py'), join(S, 'stemmen', MODEL), dir, todo], { stdio: 'inherit' });
console.log('klaar');
