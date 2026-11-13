// Legt de les van vóór fase 2 vast als verwachte uitkomst (tools/les-verwacht.json).
// Eenmalig gedraaid op de code van vóór de ombouw; tools/test-les.mjs vergelijkt de nieuwe samensteller hiermee.
// Gebruik: node tools/les-vastleggen.mjs <pad naar index.html van vóór fase 2>
//      of: node tools/les-vastleggen.mjs --huidig   (legt de les van de huidige code en pakketten vast, na een bewuste wijziging)
if (process.argv[2] === '--huidig') {
  const { boot } = await import('./app-harness.mjs');
  const { SCENARIOS: SC, summarize: sum, seeded: sd } = await import('./les-scenarios.mjs');
  const out = {};
  for (const sc of SC) {
    const ctx = await boot({ S: sc.state(), englishDay: sc.englishDay, random: sd(sc.seed) }); ctx.NOW = sc.now;
    let got = null; ctx.runSession = (name, q) => { got = { name, q }; };
    if (sc.kind === 'en') ctx.api.startEnglish(); else ctx.api.startLesson(sc.kind === 'short');
    out[sc.name] = sum(got);
  }
  writeFileSync(new URL('./les-verwacht.json', import.meta.url), JSON.stringify(out, null, 1));
  console.log('vastgelegd (huidige code):', Object.keys(out).join(', '));
  process.exit(0);
}
import vm from 'node:vm';
import { readFileSync, writeFileSync } from 'node:fs';
import { SCENARIOS, summarize, seeded } from './les-scenarios.mjs';
const src = readFileSync(process.argv[2] || new URL('../index.html', import.meta.url), 'utf8');
const cut = (a, b) => { const i = src.indexOf(a), j = src.indexOf(b, i); if (i < 0 || j < 0) throw new Error('niet gevonden: ' + a); return src.slice(i, j); };
const fnBlock = name => { const i = src.indexOf('function ' + name + '('); let d = 0, j = src.indexOf('{', i); for (; j < src.length; j++) { if (src[j] === '{') d++; else if (src[j] === '}') { d--; if (!d) break; } } return src.slice(i, j + 1); };
const content = cut('const NL=[', '/* ============ staat');
const code = [content, fnBlock('stage'), fnBlock('thirsty'), fnBlock('startLesson'), fnBlock('startEnglish'),
  "const shuffle=a=>{const b=[...a];for(let i=b.length-1;i>0;i--){const j=Math.floor(Math.random()*(i+1));[b[i],b[j]]=[b[j],b[i]]}return b};"].join('\n');
const out = {};
for (const sc of SCENARIOS) {
  const ctx = { Math: Object.create(Math), Date, JSON, Object, Array, String, Number, S: sc.state(), T: k => k, ts: k => k, supSpan: x => x, say() {}, $: () => ({}), icon: { play: '' }, nlOnly: () => false, LANG: { th: { name: { nl: 'Thai' } } }, supL: () => 'th', supAttr: () => '', now: () => sc.now, isEnglishDay: () => sc.englishDay, runSession: (name, q) => { ctx.result = { name, q } } };
  ctx.Math.random = seeded(sc.seed);
  vm.createContext(ctx); vm.runInContext(code + '\n' + (sc.kind === 'en' ? 'startEnglish()' : `startLesson(${sc.kind === 'short'})`), ctx);
  out[sc.name] = summarize(ctx.result);
}
writeFileSync(new URL('./les-verwacht.json', import.meta.url), JSON.stringify(out, null, 1));
console.log('vastgelegd:', Object.keys(out).join(', '));
