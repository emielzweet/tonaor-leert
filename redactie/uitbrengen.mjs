// Lesstof uitbrengen zonder de code te raken (docs/ontwerp-stap3a.md, docs/automatische-redactie.md stap 6).
// Gebruik: node redactie/uitbrengen.mjs [--droog]
// Weigert bij: iets niet gecommit; een commit sinds wat live staat die iets anders raakt dan lesstof; een pakket dat niet in
// BUILTIN of de index staat; een gewijzigd pakket dat de poort niet haalt; een test die niet groen is. Daarna: push naar main.
import { execFileSync } from 'node:child_process';
import { readFileSync, readdirSync, appendFileSync, mkdirSync, existsSync } from 'node:fs';
import { createRequire } from 'node:module';
const PC = createRequire(import.meta.url)('../pakketcheck.js');

const ROOT = new URL('../', import.meta.url), droog = process.argv.includes('--droog');
const git = (...a) => execFileSync('git', a, { cwd: ROOT, encoding: 'utf8' }).trim();
const stop = m => { console.log('GEWEIGERD: ' + m); log('geweigerd: ' + m); process.exit(1); };
const log = m => { try { mkdirSync(new URL('redactie/uit/', ROOT), { recursive: true }); appendFileSync(new URL('redactie/uit/logboek.txt', ROOT), new Date().toISOString() + ' uitbrengen ' + m + '\n'); } catch (e) {} };

// 1. niets ongecommit (de werkmap redactie/uit/ staat niet in git)
const dirty = git('status', '--porcelain').split('\n').filter(l => l && !/^\?\? redactie\/uit\//.test(l));
if (dirty.length) stop('niet alles is gecommit:\n  ' + dirty.join('\n  '));

// 2. alleen lesstof sinds wat live staat
try { git('fetch', '-q', 'origin'); } catch (e) { stop('kan origin niet bijwerken (geen verbinding?)'); }
try { git('merge-base', '--is-ancestor', 'origin/main', 'HEAD'); } catch (e) { stop('de stand bouwt niet voort op wat live staat (eerst bijwerken)'); }
const changed = git('diff', '--name-only', 'origin/main..HEAD').split('\n').filter(Boolean);
if (!changed.length) stop('er is niets nieuws om uit te brengen');
const LESSTOF = f => /^content\/[a-z0-9-]+\.json$/.test(f) || f === 'redactie/productielijst.json';
const anders = changed.filter(f => !LESSTOF(f));
if (anders.length) stop('deze wijzigingen zijn geen lesstof (gaan via een gewone release):\n  ' + anders.join('\n  '));

// 3. elk pakket staat in BUILTIN of in de index, en de index klopt
const html = readFileSync(new URL('index.html', ROOT), 'utf8');
const BUILTIN = JSON.parse(html.slice(html.indexOf('const BUILTIN=') + 14, html.indexOf(';', html.indexOf('const BUILTIN='))).replace(/'/g, '"'));
let IDX; try { IDX = JSON.parse(readFileSync(new URL('content/index.json', ROOT), 'utf8')).packs; } catch (e) { stop('content/index.json is onleesbaar'); }
if (!Array.isArray(IDX) || IDX.some(u => typeof u !== 'string' || !/^content\/[a-z0-9-]+\.json$/.test(u))) stop('content/index.json: packs moet een lijst van content/<id>.json zijn');
const files = readdirSync(new URL('content/', ROOT)).filter(f => f.endsWith('.json') && f !== 'index.json').map(f => 'content/' + f);
const los = files.filter(f => !BUILTIN.includes(f) && !IDX.includes(f));
if (los.length) stop('niet in BUILTIN en niet in content/index.json: ' + los.join(', '));
const weg = IDX.filter(u => !files.includes(u));
if (weg.length) stop('de index noemt pakketten die er niet zijn: ' + weg.join(', '));
const ids = files.map(f => { try { return JSON.parse(readFileSync(new URL(f, ROOT), 'utf8')).id; } catch (e) { stop('onleesbaar pakket: ' + f); } });
const dubbel = ids.filter((x, i) => ids.indexOf(x) !== i);
if (dubbel.length) stop('pakket-id komt twee keer voor: ' + dubbel.join(', '));

// 4. de poort op elk gewijzigd pakket
// een hoofdstuk door de volledige poort (controleer.mjs, met review); een basispakket door pakketcheck; een verwijderd pakket niet
const all = files.map(f => JSON.parse(readFileSync(new URL(f, ROOT), 'utf8')));
for (const f of changed.filter(f => f.startsWith('content/') && f !== 'content/index.json' && existsSync(new URL(f, ROOT)))) {
  const p = JSON.parse(readFileSync(new URL(f, ROOT), 'utf8'));
  if (p.type === 'hoofdstuk' || p.type === 'les') {   // een losse les: dezelfde poort, met review
    let out = '';
    try { out = execFileSync('node', ['redactie/controleer.mjs', f], { cwd: ROOT, encoding: 'utf8' }); }
    catch (e) { stop('poort niet gehaald voor ' + f + ':\n' + String(e.stdout || '').trim()); }
    if (/eigennaam/i.test(out)) stop('mogelijk een eigennaam in ' + f + ' (publieke repo; eerst nakijken):\n' + out.trim());
  } else {
    const r = PC.checkPack(p, all.filter(o => o.id !== p.id));
    if (r.errors.length) stop('pakketcheck niet gehaald voor ' + f + ':\n  ' + r.errors.join('\n  '));
  }
}

// de lijst lessen: draden bestaan, nooit twee keer achter elkaar dezelfde vorm, hooguit twee uit hetzelfde gebied
{ const r = PC.checkLessen(all); if (r.errors.length) stop('lijst lessen: ' + r.errors.join('; ')); }

// 5. alle tests
for (const t of readdirSync(new URL('tools/', ROOT)).filter(f => /^test-.*\.mjs$/.test(f))) {
  let out = '';
  try { out = execFileSync('node', ['tools/' + t], { cwd: ROOT, encoding: 'utf8', timeout: 600000 }); } catch (e) { out = String(e.stdout || '') + 'FOUT'; }
  if (!/alles OK\s*$/.test(out)) stop('test niet groen: ' + t);
}

if (droog) { console.log('DROOG: alles in orde, niets gepusht. Gewijzigd: ' + changed.join(', ')); log('droog in orde: ' + changed.join(', ')); process.exit(0); }
try { git('push', '-q', 'origin', 'HEAD:main'); } catch (e) { stop('push mislukt: ' + String(e.message || e).split('\n')[0]); }
console.log('UITGEBRACHT: ' + git('rev-parse', '--short', 'HEAD') + ' (' + changed.join(', ') + ')');
log('uitgebracht ' + git('rev-parse', '--short', 'HEAD') + ': ' + changed.join(', '));
