// Scènes (docs/scenes.md, docs/concept-leerwereld.md stap 2): controle van het formaat, de eisen, en de rij schermen die de speler maakt.
import vm from 'node:vm';
import { readFileSync, readdirSync } from 'node:fs';
import { boot, PC, html, ROOT } from './app-harness.mjs';
let fails = 0; const ok = (n, v, extra) => { if (!v) fails++; console.log((v ? 'OK  ' : 'FOUT') + ' ' + n + (v || extra == null ? '' : '\n     ' + extra)); };
const fnBlock = name => { const i = html.indexOf('function ' + name + '('); if (i < 0) throw new Error(name); let d = 0, j = html.indexOf('{', i); for (; j < html.length; j++) { if (html[j] === '{') d++; else if (html[j] === '}') { d--; if (!d) break; } } return html.slice(i, j + 1); };
const app = await boot(); const g = app.api.get();
const packs = readdirSync(new URL('content/', ROOT)).filter(f => f.endsWith('.json')).map(f => JSON.parse(readFileSync(new URL('content/' + f, ROOT), 'utf8')));   // alle pakketten in content/, ook een hoofdstuk dat de app (nog) verbergt
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
  art: { bg: 'room', alt: { nl: 'een bord' }, things: [{ kind: 'sign', x: 60, y: 50, text: 'Bord', hot: true, item: w0, label: T3('het bord') }] },
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
// stap 2 afmaken (docs/ontwerp-stap2.md): bestaande oefenvormen als vraag, hint, spreken, spel, zwaardere vorm, hoofdstukcontrole
const gapQ = { form: 'gap', items: [w0], err: 'lidwoord', why: T3('Zo.'), data: { s: 'Ik zie de ___.', o: ['a', 'b'], a: 'a', tr: { th: 'ก', en: 'x' } } };
const bq = { form: 'build', items: [rl], err: 'woordvolgorde', why: T3('Zo.'), data: { parts: ['Morgen', 'werk', 'ik.'], verb: 'werk', tr: { th: 'ก', en: 'x' } } };
const typeQ = { form: 'type', items: [w0], ask: T3('Typ.'), answer: 'x', why: T3('Zo.'), hint: [T3('klein'), T3('groot')] };
ok('controle: een bestaande oefenvorm (gap, build) mag een vraag zijn; een typvraag met hint in twee stappen ook', chk(sc => { sc.steps[1].q.push(gapQ, bq, typeQ); }) === '', chk(sc => { sc.steps[1].q.push(gapQ, bq, typeQ); }));
ok('controle: een vorm die nog niet in een scène kan, wordt geweigerd (stap 6)', /nog niet in een scène/.test(chk(sc => { sc.steps[1].q.push({ form: 'match', items: [w0], ask: T3('x') }); })));
ok('controle: een fout in de gegevens van een oefenvorm wordt gevonden', /parts|verb/.test(chk(sc => { sc.steps[1].q.push({ ...bq, data: { ...bq.data, verb: 'niet' } }); })));
ok('controle: een hint heeft precies twee stappen', /twee stappen/.test(chk(sc => { sc.steps[1].q.push({ ...typeQ, hint: [T3('één')] }); })));
ok('controle: spreken en spel (dehet) zijn stappen; een onbekend spel wordt geweigerd',
  chk(sc => { sc.steps.splice(4, 0, { type: 'speak', items: [w0], ask: T3('Zeg.'), model: T3('Zo.'), checklist: [T3('a')] }, { type: 'game', kind: 'dehet', items: [w0] }); }) === '' && /nog niet in de app/.test(chk(sc => { sc.steps.splice(4, 0, { type: 'game', kind: 'raket', items: [w0] }); })));
const dq2 = app.sq({ ...deep, steps: [{ type: 'quiz', role: 'ophalen', q: [gapQ, bq, typeQ] }, { type: 'speak', items: [w0], ask: T3('Zeg.'), model: T3('Zo.'), checklist: [T3('a')] }, { type: 'game', kind: 'dehet', items: [w0] }, { type: 'end' }] });
ok('rij: gap en build gaan naar het bestaande oefenscherm, met de soort fout en de scène erbij', dq2.some(x => x.type === 'gap' && x._sceneErr === 'lidwoord' && x.sc && x.exid.startsWith('test-diep#')) && dq2.some(x => x.type === 'build' && x.s && x.s.verb === 'werk'));
ok('rij: spreken en spel worden eigen schermen', dq2.some(x => x.type === 'sc_speak') && dq2.some(x => x.type === 'sc_game'));
const hq = app.sq(deep, true);
ok('zwaardere vorm: elke vraag van de scène weet dat hij zwaarder is', hq.filter(x => x.type === 'sc_q').every(x => x.hard) && hq[0].hard);
ok('fout in een bestaand oefenscherm telt in het foutprofiel, hooguit één keer per vraag, bij Volgende (codereview A2, standreview 1)', html.includes('Q[qi]._sceneErr&&!Q[qi]._faulted){Q[qi]._faulted=1;const fq=Q[qi];later(()=>scFault(fq,fq._sceneErr))}'));
ok('spel telt niet als vorm voor bloei (C5)', /const NOGROW=\[[^\]]*'spel'/.test(html));
ok('hint in twee stappen: goed na een hint telt als retry', html.includes('const right=msg=>{done=true;if(hint)first=false;'));
ok('opslag: eigen record per scène (world.best) in migratie 5', html.includes('s.world.best={}') && html.includes('world:{ok:{},best:{},done:{}'));
ok('alle schermen voor stap 2 bestaan', ['sc_speak', 'sc_game'].every(t => html.includes('H.' + t + '=q=>')));
// hoofdstukcontrole (masterplan A6, B1, B2, C1, C2, G2): een volledig hoofdstuk haalt hem, en elke eis wordt afzonderlijk bewaakt
const CH = (() => {
  const nlScene = n => ({ ...deep, id: 'h-' + n, n, goals: ['nt2-I-lezen'],
    steps: [{ type: 'look', min: 1 }, { type: 'quiz', role: 'instap', q: [ch(w0, 'betekenis', T3('i1')), { form: 'hear', items: [w0], say: 'goed', ask: { nl: 'Hoor.' }, opts: [{ t: 'goed', r: 'ok', why: T3('Ja.') }, { t: 'fout', r: 'no', err: 'klank', why: T3('Nee.') }] }] },
      { type: 'quiz', role: 'ophalen', q: [typeQ, { ...typeQ, form: 'hear-type', say: 'x' }] },
      { type: 'talk', who: 'assistent', turns: [0, 1, 2, 3].map(i => ({ them: T3('Zin ' + i), items: [w0], opts: [{ t: 'ja', r: 'ok', why: T3('Ja.') }, { t: 'nee', r: 'no', err: 'beleefdheid', why: T3('Nee.') }] })) },
      { type: 'rule', items: [rl], example: T3('Vb.'), q: [Object.assign(ch(rl, 'woordvolgorde', T3('r1')), { help: 2 }), Object.assign({ ...typeQ, form: 'complete', items: [rl] }, { help: 1 }), Object.assign(ch(rl, 'woordvolgorde', T3('r3')), { help: 0 })] },
      { type: 'extra', err: 'woordvolgorde', explain: T3('Kort.'), q: [ch(rl, 'woordvolgorde', T3('e1')), ch(rl, 'woordvolgorde', T3('e2'))] },
      { type: 'read', text: T3('Tekst.'), q: [1, 2, 3, 4].map(i => ch(w0, 'lezen', T3('v' + i))).concat([{ ...typeQ, ask: T3('Typ uit de tekst.') }]) },
      { type: 'listen', say: 'Hallo.', q: [1, 2, 3, 4].map(i => ch(w0, 'klank', T3('l' + i))).concat([{ ...typeQ, form: 'hear-type', say: 'x', ask: T3('Typ wat je hoort.') }]) },
      { type: 'make', items: [w0], frame: 'Ik ___.', model: T3('Ik ben.'), checklist: [T3('a'), T3('b')] },
      { type: 'speak', items: [w0], ask: T3('Zeg.'), model: T3('Zo.'), checklist: [T3('a')] }, { type: 'game', kind: 'dehet', items: [w0] },
      { type: 'quiz', role: 'controle', q: [{ form: 'type', items: [w0], ask: { nl: 'Typ het woord.' }, answer: 'x', why: T3('Zo.') }, { form: 'number', items: [w1], ask: { nl: 'Reken.' }, answer: '42', why: T3('Zo.') }] },
      { type: 'end' }] });
  const rk = { ...deep, id: 'h-rk', subject: 'rk', n: undefined, steps: [{ type: 'look' }, { type: 'explain', id: 'u.rk.klok' }, { type: 'read', text: T3('Etiket.'), q: [1, 2].map(i => ch(w1, 'lezen', T3('v' + i))) },
    { type: 'quiz', role: 'ophalen', q: [{ form: 'number', items: [w1], ask: T3('Reken.'), answer: '6', why: T3('Zo.') }, ch(w1, 'getal', T3('k')), { form: 'money', items: [w1], why: T3('Zo.'), gen: { coins: [500, 200, 100, 50], n: [2, 4] } }, { form: 'number', items: [w1], ask: T3('Reken.'), answer: '42', why: T3('Zo.') }, { ...typeQ, items: [w1] }] },
    { type: 'do', form: 'money', items: [w1], gen: { coins: [500, 200, 100, 50], n: [2, 4] } },
    { type: 'quiz', role: 'controle', q: [{ form: 'number', items: [w1], ask: { nl: 'R.' }, answer: '1', why: T3('Zo.') }, ch(w1, 'getal', { nl: 'K.' })] }, { type: 'end' }] };
  return { format: 1, id: 'h', type: 'hoofdstuk', version: 1, learn: 'nl', level: 'A1', order: 99, goals: ['nt2-I-lezen'], purpose: T3('Dit heb je nodig voor lezen.'), review: { model: 'groot', date: '2026-11-15', verdict: 'goed' }, title: T3('H'), items: [], scenes: [1, 2, 3, 4, 5].map(nlScene).concat([rk]) };
})();
const cc = mut => { const p = JSON.parse(JSON.stringify(CH)); if (mut) mut(p); return PC.checkChapter(p).errors.join(' | '); };
ok('hoofdstuk: een volledig hoofdstuk haalt de hoofdstukcontrole en de pakketcontrole', cc() === '' && PC.checkPack(CH, packs).errors.length === 0, cc() + ' || ' + PC.checkPack(CH, packs).errors.slice(0, 3).join(' | '));
ok('hoofdstuk C2: minder dan zes werkvormen in een scène', /minstens zes/.test(cc(p => { p.scenes[0].steps = p.scenes[0].steps.filter(s => ['look', 'talk', 'end'].includes(s.type) || s.role === 'instap'); })));
ok('hoofdstuk C1: drie keer dezelfde vorm achter elkaar', /drie keer achter elkaar/.test(cc(p => { p.scenes[0].steps[1].q.push(ch(w0, 'betekenis', T3('x')), ch(w0, 'betekenis', T3('y')), ch(w0, 'betekenis', T3('z'))); })));
ok('hoofdstuk B1: te weinig antwoordmomenten', /antwoordmomenten/.test(cc(p => { p.scenes[0].steps = p.scenes[0].steps.filter(s => s.type !== 'read' && s.type !== 'listen'); })));
ok('hoofdstuk B2: leestekst met vijf tot tien vragen, luistertekst, spreken en spel', ['leestekst', 'luistertekst', 'spreekopdracht', 'spel'].every((w, i) => new RegExp(w).test(cc(p => { const t = ['read', 'listen', 'speak', 'game'][i]; p.scenes.forEach(sc => { sc.steps = sc.steps.filter(s => s.type !== t); }); }))));
ok('hoofdstuk A6: zelf typen zonder hint in twee stappen', /zonder hint/.test(cc(p => { delete p.scenes[0].steps[2].q[0].hint; })));
ok('hoofdstuk E3: een foute keuze zonder soort fout', /zonder soort fout/.test(cc(p => { delete p.scenes[0].steps[3].turns[0].opts[1].err; })));
ok('hoofdstuk E2: een grammaticapunt zonder extra', /hoort een stap extra/.test(cc(p => { p.scenes.forEach(sc => { sc.steps = sc.steps.filter(s => s.type !== 'extra'); }); })));
ok('hoofdstuk G2: goals bij hoofdstuk en scène', /goals/.test(cc(p => { delete p.goals; })) && /goals/.test(cc(p => { delete p.scenes[0].goals; })));
ok('hoofdstuk: vragen bij een tekst in de nieuwe vorm (met err), een gesprek hooguit zes beurten, een tekst hooguit tien vragen', /nieuwe vorm/.test(cc(p => { p.scenes[0].steps[6].q[0] = { q: T3('x'), items: [w0], o: [T3('a'), T3('b')], a: 0, why: T3('Zo.') }; })) && /zes beurten/.test(cc(p => { const t = p.scenes[0].steps[3]; while (t.turns.length < 7) t.turns.push(t.turns[0]); })) && /tien vragen/.test(cc(p => { const t = p.scenes[0].steps[6]; while (t.q.length < 11) t.q.push(ch(w0, 'lezen', T3('x' + t.q.length))); })));
ok('hoofdstuk: rekenen in de situatie is verplicht', /rekenen in de situatie/.test(cc(p => { p.scenes = p.scenes.filter(s => s.subject !== 'rk'); })));
for (const p of packs.filter(p => p.type === 'hoofdstuk')) { const e = PC.checkChapter(p).errors; console.log((e.length ? 'NOG ' : 'OK  ') + 'hoofdstuk ' + p.id + ' in content/: ' + (e.length ? 'niet zichtbaar in de app (' + e.length + ' punt(en), o.a. ' + e[0].slice(0, 80) + ')' : 'zichtbaar met Proefonderdelen')); }
ok('hoofdstuk: zonder review met oordeel goed niet zichtbaar (uitleg bij de eisen 12)', /review ontbreekt/.test(cc(p => { delete p.review; })) && /review ontbreekt/.test(cc(p => { p.review.verdict = 'verbeteren'; })));
// antwoord ontwerpsessie (docs/scenes.md, de examenvorm en ongeveer): soort fout model; tol verplicht bij ongeveer of schatten
ok('controle: soort fout model (verkeerd model of aanpak) mag', chk(sc => { sc.steps[0].q[0].opts[1].err = 'model'; }) === '');
ok('controle: een vraag met ongeveer zonder tol wordt geweigerd, met tol niet', /tol nodig/.test(chk(sc => { sc.steps[5].q[1].ask = { nl: 'Ongeveer hoeveel?' }; })) && chk(sc => { sc.steps[5].q[1].ask = { nl: 'Ongeveer hoeveel?' }; sc.steps[5].q[1].tol = 2; }) === '');
ok('speler: een antwoord binnen de marge (tol) is goed', html.includes("<=(typeof qq.tol==='number'?qq.tol:1e-9)"));
// review 2 (aan de bouwsessie)
ok('controle: een uitleg-id die niet bestaat wordt geweigerd, een bestaande niet', /bestaat niet/.test(chk(sc => { sc.steps.splice(1, 0, { type: 'explain', id: 'klok-half' }); })) && chk(sc => { sc.steps.splice(1, 0, { type: 'explain', id: 'u.rk.klok' }); }) === '');
ok('hoofdstuk: bij elk grammaticapunt een extra', /hoort een stap extra/.test(cc(p => { p.scenes.forEach(sc => { const r = sc.steps.find(s => s.type === 'rule'); if (r) { r.items = ['nl.regel.heb']; r.q.forEach(q => { q.items = ['nl.regel.heb']; }); } }); })));
{ const cx = {}; vm.createContext(cx); vm.runInContext(fnBlock('scNum') + '\nthis.n=scNum;', cx); const T = [['6,60', 6.6], ['€ 6,60', 6.6], ['6 euro 60', 6.6], ['25 cent', 0.25], ['1.000', 1000], ['€ 1.250,50', 1250.5], ['1250', 1250], ['0,25 euro', 0.25], ['6,-', 6], ['zes', NaN], ['0.125', 0.125], ['0.500', 0.5]];
  const bad = T.filter(([v, w]) => !(Number.isNaN(w) ? Number.isNaN(cx.n(v)) : Math.abs(cx.n(v) - w) < 1e-9));
  ok('speler: een getal zoals een Nederlander het typt (€, duizendtal met punt, euro 60, cent) wordt goed gelezen (codereview B2)', !bad.length, bad.map(([v]) => v + ' -> ' + cx.n(v)).join('; ')); }
ok('zwaardere vorm: alleen een kort antwoord (hooguit drie woorden) wordt typen', html.includes('typeIt=q.hard&&qq.answer!=null&&String(qq.answer).trim().split(/\\s+/).length<=3'));
ok('een hoofdstuk dat de hoofdstukcontrole niet haalt, staat helemaal buiten de app (scènes, woorden, regels)', packs.filter(p => p.type === 'hoofdstuk' && PC.checkChapter(p).errors.length).every(p => !g.PACKS.some(o => o.id === p.id) && !(p.items || []).some(x => g.NL.some(w => w.id === x.id))));
ok('hoofdstuk G5: een hoofdstuk met goals heeft purpose', /purpose/.test(cc(p => { delete p.purpose; })));
ok('purpose staat bij het begin en op het slot van de laatste scène (scPurpose)', html.includes("scPurpose(sc,'first')") && html.includes("scPurpose(sc,'last')"));
ok('H3 rust pas over tijd: drie dagen en zeven dagen ertussen (MOTOR.restDays, restSpan)', html.includes('h[h.length-1][0]-h[0][0]>=MOTOR.restSpan') && html.includes('.size>=MOTOR.restDays'));
{ const cx = { NL: [{ id: 'a', also: ['b'] }, { id: 'b' }, { id: 'c' }] }; vm.createContext(cx); vm.runInContext(fnBlock('alsoOf') + '\nthis.f=alsoOf;', cx);
  ok('also werkt in beide richtingen (review 3: pijn aan / pijn in)', JSON.stringify(cx.f(cx.NL[0])) === '["b"]' && JSON.stringify(cx.f(cx.NL[1])) === '["a"]' && cx.f(cx.NL[2]).length === 0); }
ok('Proefonderdelen: de scènetegel alleen met de schakelaar aan; standaard uit (aanbeveling 10.25)', html.includes('${SCENES.length&&S.trial?') && html.includes('explainVoice:true,trial:false,') && html.includes("if(typeof s.trial!=='boolean')s.trial=false"));
{ const cx = {}; vm.createContext(cx); vm.runInContext(lineOf('const normS=') + '\n' + lineOf('const norm=') + '\nthis.n=norm;this.s=normS;', cx);
  ok('tolerant typen (10.29): hoofdletter, spatie, accent en trema geen fout; het dictee blijft streng', cx.n('  Ruïne ') === cx.n('ruine') && cx.n('Café') === 'cafe' && cx.s('ruïne') !== cx.s('ruine')); }
ok('korte ronde: de melding komt aan (de vlag gaat mee met de rij die compose teruggeeft)', html.includes('if(q._short)out._short=q._short;return out'));
ok('speltimer stopt als de sessie verlaten is', html.includes("const here=Q[qi]===q&&app.classList.contains('sess')"));
ok('herkennen: geen afleider met dezelfde vertaling of uit also (twee goede antwoorden)', html.includes('!AL.includes(x.id)&&x.th!==w.th&&x.en!==w.en'));
ok('poort (uitleg bij de eisen 13, 14): dubbele vraag, tekst zonder typen, te weinig zelf maken, rekenscène zonder voorbeeld, schuine streep', /dezelfde vraag/.test(cc(p => { const q = p.scenes[0].steps[1].q; q.push(JSON.parse(JSON.stringify(q[0]))); })) && /zelf typt of bouwt/.test(cc(p => { const r = p.scenes[0].steps.find(s => s.type === 'read'); r.q = r.q.slice(0, 4).concat([ch(w0, 'lezen', T3('v5'))]); })) && /uitgewerkt voorbeeld/.test(cc(p => { const r = p.scenes.find(s => s.subject === 'rk'); r.steps = r.steps.filter(s => s.type !== 'explain'); })) && /schuine streep/.test(cc(p => { p.items = [{ id: 'x', kind: 'phrase', w: 'a / b' }]; })));
{ const cx = {}; vm.createContext(cx); vm.runInContext('var Q=[];' + fnBlock('scPh') + ';this.f=scPh;this.set=q=>{Q=q};', cx);
  const A = { id: 'a' }, B = { id: 'b' }; cx.set([{ sc: A, step: 1 }, { sc: A, step: 1 }, { sc: A, step: 3 }, { sc: A, step: 4 }, { sc: B, step: 2 }, { type: 'x' }]);
  const r1 = cx.f({ sc: A, step: 3 }), r2 = cx.f({ sc: B, step: 2 });
  ok('voortgang in een scène telt alleen de delen die de scène heeft (G1: geen Stap 1 van 4 bij drie delen)', r1.n === 2 && r1.m === 3 && r2.n === 1 && r2.m === 1, JSON.stringify([r1, r2]));
  ok('de instap heet niet Kijken', html.includes("PHROLE={instap:'scene.warm'") && html.includes('t(PHROLE[q.role]||PH[q.step]')); }
{ const cx = {}; vm.createContext(cx); vm.runInContext(lineOf('const scNorm=') + ';' + fnBlock('scNum') + ';' + fnBlock('scLoose') + ';this.f=scLoose;', cx);
  ok('zwaardere vorm: keel telt voor de keel, 45 voor 45 minuten, maar 45 uur en hals niet', cx.f('de keel', 'keel') && cx.f('45 minuten', '45') && cx.f('de keel', 'De keel.') && !cx.f('45 minuten', '45 uur') && !cx.f('de keel', 'hals') && !cx.f('45 minuten', '50'));
  ok('typen vanuit de steuntaal: een woord uit also is geen fout (pijn in bij pijn aan)', html.includes("if(alsoOf(w).some(id=>{const o=NL.find(x=>x.id===id);return o&&(norm(o.w)===a||norm(fw(o))===a)}))"));
  ok('een do-oefening in een scène toont de vraag van de stap (Heb je genoeg?)', html.includes('if(st.ask)x._ask=st.ask') && html.includes("Q[qi]._ask&&inner.startsWith('<div class=\"card stack\">'))inner='<div class=\"card stack\"><p class=\"prompt\">'+scT(Q[qi]._ask)+'</p>'+inner.slice(24)")); }
{ const cx = {}; vm.createContext(cx); vm.runInContext(lineOf('const scNorm=') + ';' + fnBlock('scNum') + ';' + fnBlock('scLoose') + ';this.f=scLoose;this.n=scNorm;', cx);
  ok('zwaardere vorm: 3 x 4 en 3*4 tellen voor 3 × 4, 0,25 voor € 0,25, maar 0,30 niet', cx.n('3 x 4') === cx.n('3 × 4') && cx.n('3*4') === cx.n('3 × 4') && cx.f('€ 0,25', '0,25') && !cx.f('€ 0,25', '0,30'));
  ok('scènevraag: een woord uit also van het doel is geen fout', html.includes('/* review dokter 6: een woord uit also is in een scènevraag ook geen fout */')); }
ok('poort (uitleg bij de eisen 16): een typvraag met een zin als antwoord is een fout', /hooguit twee woorden/.test(cc(p => { const q = p.scenes[0].steps[1].q[0]; q.form = 'type'; q.answer = 'Ik wil een afspraak maken.'; delete q.opts; })) && !/hooguit twee woorden/.test(cc(p => {})));
{ // Mijn antwoord is ook goed (uitleg bij de eisen 17)
  const i0 = html.indexOf('const CLAIMMAX='), i1 = html.indexOf('\n', html.indexOf('function bindClaim('));
  const cx = { S: {}, saved: 0, nexted: 0, els: {} }; vm.createContext(cx);
  vm.runInContext(`var S=this.S;function save(){this.saved++}var now=()=>1;var T=k=>k,TB=k=>k,nextBtn=()=>'<nx>';function next(){}
    var EL={};function $(s){return EL[s]||null}this.EL=EL;` + html.slice(i0, i1) + ';this.later=later;this.flushPend=flushPend;this.bindClaim=bindClaim;this.getP=()=>PEND;', cx);
  let counted = 0; cx.later(() => counted++); cx.flushPend();
  ok('een uitgestelde fout telt bij Volgende', counted === 1 && cx.getP().length === 0);
  const btn = { remove() {} }, fb = { innerHTML: '' }, inp = { value: 'pijn in', disabled: false };
  Object.assign(cx.EL, { '#claim': btn, '#fb': fb, '#ans': inp, '#nx': { onclick: null, remove() {} } });
  counted = 0; cx.later(() => counted++); cx.bindClaim({ id: 'dok.pijnaan', q: 'Ik heb ___ mijn arm.', want: 'pijn aan' }); btn.onclick(); cx.flushPend();
  const c = cx.S.claims || [];
  ok('de knop neemt de fout weg en zet vraag en antwoord op de lijst', counted === 0 && c.length === 1 && c[0].a === 'pijn in' && c[0].want === 'pijn aan' && inp.disabled && fb.innerHTML.includes('claim.thanks'));
  for (let k = 0; k < 60; k++) { cx.EL['#claim'] = { remove() {} }; cx.bindClaim({ id: 'x' + k, q: '<b>q</b>', want: 'w' }); cx.EL['#claim'].onclick(); }
  ok('de lijst houdt de laatste vijftig, zonder html', cx.S.claims.length === 50 && cx.S.claims[49].id === 'x59' && cx.S.claims[49].q === 'q');
  ok('alle getypte schermen hebben de knop (ophalen, gatzin, luisteren, Engels, scène)', (html.match(/bindClaim\(/g) || []).length >= 9 && html.includes('function next(){flushPend();') && html.includes("$('#quit').onclick=()=>{flushPend();"));
}
ok('zin bouwen: de plek van het werkwoord volgt uit de goede zin (vraag: werkwoord vooraan), en de scènevraag staat erboven', html.includes("const vp=s.parts.indexOf(s.verb),okK=vp===1?'build.ok':vp===0?'build.okFirst':'build.okPlain';") && html.includes("vi===vp?'build.rest':vp===1?'build.verbPos':vp===0?'build.verbFirst':'build.again'") && html.includes('...(qq.ask?{_ask:qq.ask}:{})'));
{ const cx = {}; vm.createContext(cx); vm.runInContext(lineOf('const scNorm=') + ';' + fnBlock('scNum') + ';' + fnBlock('scLoose') + ';this.f=scLoose;', cx);
  ok('standreview 3: in de zwaardere vorm telt het keel niet voor de keel, keel en de keel wel', !cx.f('de keel', 'het keel') && cx.f('de keel', 'keel') && cx.f('de keel', 'de keel')); }
ok('standreview: knop weg na de tik, controle niet gehaald na de knop, lidwoord kiezen is geen typfout, alle fouten bij luisteren krijgen de knop, also alleen bij het doelwoord, tekens niet dubbel', html.includes("b.onclick=()=>{b.remove();PEND=[];if(info.after)") && html.includes("after:()=>{if(q.role==='controle'&&SCN)SCN.ctrl=false}") && html.includes('&&!q._probe&&!picked;') && html.includes("bad=res===false,") && html.includes("na(String(as[0]))===na(w0.w)") && html.includes(".replace(/&amp;/g,'&')"));
console.log(fails ? fails + ' FOUT' : 'alles OK');
