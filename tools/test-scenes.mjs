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
const lineOf = st => { const i = html.indexOf(st); return html.slice(i, html.indexOf('\n', i)); };
vm.runInContext(lineOf('const ERRS=[') + '\nvar SCN=null;\n' + fnBlock('errNote') + '\n' + fnBlock('errTop') + '\n' + fnBlock('scFault') + '\n' + fnBlock('sceneQ') +
  '\nthis.sq=sceneQ;this.fault=scFault;this.top=errTop;this.setSCN=x=>{SCN=x};this.getQ=()=>({Q,qi});this.setQ=(a,i)=>{Q=a;qi=i};', app);
const q = app.sq(sc0);
ok('rij schermen: begin, kijken, gesprek per beurt, doen, inschatting en slot', q[0].type === 'sc_intro' && q.some(x => x.type === 'sc_look') && q.filter(x => x.type === 'sc_talk').length === turns.filter(t => sc0.steps.some(s => s.turns && s.turns.includes(t))).length && q.some(x => x.type === 'sc_clock') && q[q.length - 2].type === 'conf' && q[q.length - 1].type === 'sc_end');
ok('elk vraagscherm van de scène heeft items en een eigen oefening-id', q.filter(x => ['sc_talk', 'sc_clock', 'sc_point', 'sc_read', 'sc_make'].includes(x.type)).every(x => x.items && x.items.length && x.exid && x.exid.startsWith(sc0.id + '#')));
ok('alle schermsoorten van de speler bestaan', ['sc_intro', 'sc_look', 'sc_talk', 'sc_read', 'sc_clock', 'sc_point', 'sc_make', 'sc_end'].every(t => html.includes('H.' + t + '=q=>')));
ok('antwoorden in een scène gaan langs het herhaalmodel (practiced)', ['practiced(q,first?true:\'retry\',\'talk\')', 'practiced(q,first?true:\'retry\',\'klok\')', 'practiced(q,true,\'make\')'].every(s => html.includes(s)));
ok('het slot bewaart de scène in S.world en telt als ronde', html.includes('S.world.done[sc.id]=now()') && /H\.sc_end=[^\n]*S\.rounds\[td\]/.test(html));
ok('scene.js staat in SHELL en wordt vóór pakketcheck geladen', readFileSync(new URL('sw.js', ROOT), 'utf8').includes("'./scene.js'") && html.indexOf('<script src="scene.js">') < html.indexOf('<script src="pakketcheck.js">'));
// diepte en diagnose (docs/scenes.md): instap, ophalen, regel, extra, controle, soort fout
const T3 = nl => ({ nl, th: 'ก', en: 'x' });
const w0 = g.NL[0].id, w1 = g.NL[1].id, rl = packs.flatMap(p => p.items || []).find(x => x.kind === 'rule').id;
const ch = (id, err, ask) => ({ form: 'choose', items: [id], ask: ask || { nl: 'Vraag?' }, opts: [{ t: 'goed', r: 'ok', why: T3('Goed.') }, { t: 'fout', r: 'no', err, why: T3('Nee.') }] });
const deep = { id: 'test-diep', place: 'test', subject: 'nl', level: 'A1', n: 1, title: T3('Test'), intro: T3('Test'), can: T3('Test'), targets: [w0, w1],
  art: { bg: 'room', alt: { nl: 'leeg' }, things: [] },
  steps: [{ type: 'quiz', role: 'instap', q: [ch(w0, 'betekenis')] }, { type: 'quiz', role: 'ophalen', q: [ch(w0, 'betekenis', T3('a')), ch(w1, 'betekenis', T3('b'))] },
    { type: 'rule', items: [rl], example: T3('Voorbeeld.'), q: [2, 1, 0].map(h => Object.assign(ch(rl, 'woordvolgorde', T3('r')), { help: h })) },
    { type: 'extra', err: 'woordvolgorde', explain: T3('Kort.'), q: [ch(rl, 'woordvolgorde', T3('d')), ch(rl, 'woordvolgorde', T3('e'))] },
    { type: 'do', items: [w0], ask: T3('Kies.'), opts: [{ t: 'ja', r: 'ok', why: T3('Ja.') }, { t: 'nee', r: 'no', err: 'betekenis', why: T3('Nee.') }] },
    { type: 'quiz', role: 'controle', q: [{ form: 'type', items: [w0], ask: { nl: 'Typ.' }, answer: 'x', why: T3('Zo.') }, { form: 'number', items: [w1], ask: { nl: 'Reken.' }, answer: '42', why: T3('Zo.') }] },
    { type: 'end', next: T3('Verder.'), real: T3('Echt.') }] };
const dp = { format: 1, id: 'test-diep', type: 'hoofdstuk', version: 1, learn: 'nl', level: 'A1', order: 99, title: T3('Test'), items: [], scenes: [deep] };
const chk = mut => { const p = JSON.parse(JSON.stringify(dp)); if (mut) mut(p.scenes[0]); return PC.checkPack(p, packs).errors.join(' | '); };
ok('controle: een diepe scène (quiz, rule, extra, do met keuzes) is geldig', chk() === '', chk());
ok('controle: een soort fout buiten de lijst wordt geweigerd', /staat niet in de lijst/.test(chk(sc => { sc.steps[0].q[0].opts[1].err = 'raar'; })));
ok('controle: hulp die niet afbouwt wordt geweigerd', /afbouwen/.test(chk(sc => { sc.steps[2].q[2].help = 2; })));
ok('controle: extra met één oefening wordt geweigerd', /minstens twee/.test(chk(sc => { sc.steps[3].q.pop(); })));
ok('controle: de controle heeft precies twee vragen', /precies twee/.test(chk(sc => { sc.steps[5].q.pop(); })));
ok('controle: een rekenscène zonder n mag, een scène Nederlands niet', chk(sc => { sc.subject = 'rk'; delete sc.n; }) === '' && /n moet 1 tot 5/.test(chk(sc => { delete sc.n; })));
ok('controle: instap en controle mogen alleen Nederlands vragen, ophalen niet', /ask/.test(chk(sc => { sc.steps[1].q[0].ask = { nl: 'Alleen nl' }; })));
ok('controle: getal-antwoord moet een getal zijn', /geen getal/.test(chk(sc => { sc.steps[5].q[1].answer = 'veel'; })));
const dq = app.sq(deep), types = dq.map(x => x.type);
ok('rij: vragen voor instap, ophalen, regel, doen en controle; de regel begint met het voorbeeld; extra staat er niet in',
  types.filter(x => x === 'sc_q').length === 1 + 2 + 3 + 1 + 2 && types.includes('sc_rule') && !types.includes('sc_extra') && types.indexOf('sc_rule') === types.indexOf('sc_q') + 3, types.join(','));
ok('rij: ophalen en de regel vallen weg als de instap het al liet zien (_skipKnown)', dq.filter(x => x._skipKnown).length === 2 + 1 + 3 && dq.filter(x => x._rule === rl).length === 3);
ok('rij: instap en ophalen horen bij kijken (fase 1), de controle bij het slot (fase 4)', dq.find(x => x.role === 'instap').step === 1 && dq.find(x => x.role === 'controle').step === 4);
vm.runInContext('S.errs={}', app);
const qs = dq.filter(x => x.type === 'sc_q'), at = dq.indexOf(qs[3]);
app.setQ(dq.slice(), at); app.setSCN({ sc: deep, errs: {}, extra: new Set(), ctrl: null });
app.fault(qs[3], 'woordvolgorde'); const n1 = app.getQ().Q.length; app.fault(qs[4], 'woordvolgorde'); const QQ = app.getQ().Q;
ok('extra: na de eerste fout nog niet, na de tweede van dezelfde soort direct erna (uitleg en twee oefeningen)', n1 === dq.length && QQ.length === dq.length + 3 && QQ[at + 1].type === 'sc_extra' && QQ[at + 2].role === 'extra' && QQ[at + 3].role === 'extra');
app.fault(qs[5], 'woordvolgorde');
ok('extra: komt hooguit één keer per soort per scène', app.getQ().Q.length === dq.length + 3);
const E = vm.runInContext('S.errs', app);
ok('foutprofiel: per soort geteld, met het onderdeel erbij', E.woordvolgorde && E.woordvolgorde.n >= 2.9 && E.woordvolgorde.ids[0] === rl);
app.fault(qs[0], 'raar');
ok('foutprofiel: een onbekende soort telt niet', !vm.runInContext('S.errs.raar', app));
vm.runInContext("S.errs={oud:{n:9,t:now(),ids:[]},betekenis:{n:4,t:now()-28*DAY,ids:['x']},lidwoord:{n:2.5,t:now(),ids:['y']}}", app);
ok('foutprofiel: recente fouten wegen zwaarder (halveert in 14 dagen), onbekende soorten tellen niet', app.top().err === 'lidwoord');
vm.runInContext("S.errs={}", app);
ok('foutprofiel: onder de drempel van 2 geen sturing', app.top() === null);
const known = g.NL[2]; vm.runInContext(`S.items[${JSON.stringify(known.id)}].reps=2`, app);
{ vm.runInContext(`S.errs={lidwoord:{n:3,t:now(),ids:[${JSON.stringify(known.id)}]}}`, app);
  const sq = app.sq({ ...deep, targets: [w1], steps: [{ type: 'slot', n: 4, kinds: ['word'] }, { type: 'end' }] });
  ok('slot: de open plek begint met het onderdeel van de vaakste soort fout', sq[1] && sq[1].w && sq[1].w.id === known.id && sq[1]._err === 'lidwoord', JSON.stringify(sq[1] && { t: sq[1].type, w: sq[1].w && sq[1].w.id })); }
vm.runInContext("S.errs={}", app);
ok('alle nieuwe schermsoorten bestaan', ['sc_q', 'sc_rule', 'sc_extra'].every(t => html.includes('H.' + t + '=q=>')));
ok('de controle bepaalt of de scène beheerst is (S.world.ok)', html.includes('S.world.ok[sc.id]=SCN.ctrl'));
ok('opslag: SCHEMA 6 voegt errs en world.ok toe', /const SCHEMA=6/.test(html) && html.includes('5:s=>{if(!s.errs'));
ok('gesprek: een foute keuze telt in het foutprofiel', html.includes("scFault(q,o.err);$('#fb').innerHTML=fbBox(false,scT(o.why),'')"));
console.log(fails ? fails + ' FOUT' : 'alles OK');
