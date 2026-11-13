// Scènes (docs/scenes.md, docs/concept-leerwereld.md stap 2): controle van het formaat, de eisen, en de rij schermen die de speler maakt.
import vm from 'node:vm';
import { readFileSync } from 'node:fs';
import { boot, PC, html, ROOT } from './app-harness.mjs';
let fails = 0; const ok = (n, v, extra) => { if (!v) fails++; console.log((v ? 'OK  ' : 'FOUT') + ' ' + n + (v || extra == null ? '' : '\n     ' + extra)); };
const fnBlock = name => { const i = html.indexOf('function ' + name + '('); if (i < 0) throw new Error(name); let d = 0, j = html.indexOf('{', i); for (; j < html.length; j++) { if (html[j] === '{') d++; else if (html[j] === '}') { d--; if (!d) break; } } return html.slice(i, j + 1); };
const app = await boot(); const g = app.api.get(); const packs = g.PACKS;
const withScenes = packs.filter(p => p.scenes); const scenes = withScenes.flatMap(p => p.scenes.map(sc => ({ sc, p })));
ok('er is minstens één scène, en de pakketten met scènes zijn goed', scenes.length > 0 && withScenes.every(p => !PC.checkPack(p, packs.filter(o => o !== p)).errors.length), withScenes.map(p => PC.checkPack(p, packs.filter(o => o !== p)).errors.join('; ')).join(' | '));

// eisen uit docs/scenes.md
const turns = scenes.flatMap(({ sc }) => sc.steps.filter(s => s.type === 'talk').flatMap(s => s.turns));
ok('elke gespreksbeurt heeft precies één goede keuze, en elke keuze een reden', turns.every(t => t.opts.filter(o => o.r === 'ok').length === 1 && t.opts.every(o => o.why)));
ok('elke stap die iets vraagt heeft items, met het doel op de eerste plek', scenes.every(({ sc }) => sc.steps.every(s => !['do', 'make'].includes(s.type) || (s.items && s.items.length)) && turns.every(t => t.items && t.items.length)));
ok('elke scène heeft een stap waarin de leerder iets doet of maakt, en eindigt met het slot', scenes.every(({ sc }) => sc.steps.some(s => ['do', 'make'].includes(s.type)) && sc.steps[sc.steps.length - 1].type === 'end'));
const allIds = new Set(packs.flatMap(p => (p.items || []).map(x => x.id)));
ok('alle doelen en items bestaan als herhaalitem', scenes.every(({ sc }) => sc.targets.every(t => allIds.has(t))));
ok('geen eigen SVG of script in een scène (alleen de catalogus)', !scenes.some(({ sc }) => /<svg|<script|on\w+=/i.test(JSON.stringify(sc.art))));

// de controle weigert wat niet mag
const base = packs.find(p => p.scenes); const bad = mut => { const p = JSON.parse(JSON.stringify(base)); mut(p.scenes[0]); return PC.checkPack(p, packs.filter(o => o !== base)).errors.join(' | '); };
ok('controle: twee goede keuzes in een beurt wordt geweigerd', /precies één keuze/.test(bad(sc => { const t = sc.steps.find(s => s.type === 'talk').turns[0]; t.opts.forEach(o => o.r = 'ok'); })));
ok('controle: een keuze zonder reden wordt geweigerd', /why ontbreekt/.test(bad(sc => { delete sc.steps.find(s => s.type === 'talk').turns[0].opts[0].why; })));
ok('controle: onbekend ding in de tekening wordt geweigerd', /onbekend ding/.test(bad(sc => { sc.art.things.push({ kind: 'raket', x: 10, y: 10 }); })));
ok('controle: een scène zonder doen of maken wordt geweigerd', /doet of maakt/.test(bad(sc => { sc.steps = sc.steps.filter(s => !['do', 'make'].includes(s.type)); })));

// de speler: een scène wordt een rij schermen voor de lesmotor
const sc0 = scenes[0].sc; const S = app.S || {};
vm.runInContext(fnBlock('sceneQ') + '\nthis.sq=sceneQ;', app);
const q = app.sq(sc0);
ok('rij schermen: begin, kijken, gesprek per beurt, doen, inschatting en slot', q[0].type === 'sc_intro' && q.some(x => x.type === 'sc_look') && q.filter(x => x.type === 'sc_talk').length === turns.filter(t => sc0.steps.some(s => s.turns && s.turns.includes(t))).length && q.some(x => x.type === 'sc_clock') && q[q.length - 2].type === 'conf' && q[q.length - 1].type === 'sc_end');
ok('elk vraagscherm van de scène heeft items en een eigen oefening-id', q.filter(x => ['sc_talk', 'sc_clock', 'sc_point', 'sc_read', 'sc_make'].includes(x.type)).every(x => x.items && x.items.length && x.exid && x.exid.startsWith(sc0.id + '#')));
ok('alle schermsoorten van de speler bestaan', ['sc_intro', 'sc_look', 'sc_talk', 'sc_read', 'sc_clock', 'sc_point', 'sc_make', 'sc_end'].every(t => html.includes('H.' + t + '=q=>')));
ok('antwoorden in een scène gaan langs het herhaalmodel (practiced)', ['practiced(q,first?true:\'retry\',\'talk\')', 'practiced(q,first?true:\'retry\',\'klok\')', 'practiced(q,true,\'make\')'].every(s => html.includes(s)));
ok('het slot bewaart de scène in S.world en telt als ronde', html.includes('S.world.done[sc.id]=now()') && /H\.sc_end=[^\n]*S\.rounds\[td\]/.test(html));
ok('scene.js staat in SHELL en wordt vóór pakketcheck geladen', readFileSync(new URL('sw.js', ROOT), 'utf8').includes("'./scene.js'") && html.indexOf('<script src="scene.js">') < html.indexOf('<script src="pakketcheck.js">'));
console.log(fails ? fails + ' FOUT' : 'alles OK');
