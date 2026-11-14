// Fase 2: inhoudspakketten. Test 1 (controle), 3 (veilig tonen), 4 (ontbrekend pakket) en 5 (BUILTIN = SHELL) uit docs/pakketformaat.md.
import { readFileSync, readdirSync } from 'node:fs';
import { boot, builtin, PC, html, ROOT } from './app-harness.mjs';
let fails = 0; const ok = (n, v, extra) => { if (!v) fails++; console.log((v ? 'OK  ' : 'FOUT') + ' ' + n + (v || !extra ? '' : '\n     ' + extra)); };
const files = readdirSync(new URL('content/', ROOT)).filter(f => f.endsWith('.json'));
const HIDDEN = files.map(f => JSON.parse(readFileSync(new URL('content/' + f, ROOT), 'utf8'))).filter(p => p.type === 'hoofdstuk' && PC.checkChapter(p).errors.length).map(p => p.id);   // haalt de hoofdstukcontrole niet: niet in de app (codereview B3)
const NLWORDS = files.map(f => JSON.parse(readFileSync(new URL('content/' + f, ROOT), 'utf8'))).filter(p => p.learn === 'nl' && !HIDDEN.includes(p.id)).reduce((a, p) => a + (p.items || []).filter(x => x.kind === 'word' || x.kind === 'phrase').length, 0);
const packs = files.map(f => JSON.parse(readFileSync(new URL('content/' + f, ROOT), 'utf8')));
const clone = o => JSON.parse(JSON.stringify(o));

// 1. alle pakketten zonder fouten; kwaliteitsmeldingen als lijst
for (const p of packs) {
  const r = PC.checkPack(p, packs.filter(o => o !== p));
  ok('pakket ' + p.id + ' zonder fouten', !r.errors.length, r.errors.join('\n     '));
  if (r.quality.length) console.log('     kwaliteit ' + p.id + ' (' + (p.quality || 'legacy') + ', blokkeert niet): ' + r.quality.length + ' meldingen' + (process.argv.includes('--kwaliteit') ? '\n       ' + r.quality.join('\n       ') : ' (lijst: --kwaliteit)'));
}
ok('bestandsnaam = pakket-id', packs.every((p, i) => files[i] === p.id + '.json'));
const nl = packs.find(p => p.id === 'nl-t1');
// de controle vangt echte fouten (een paar opzettelijk kapotte pakketten)
const broken = (f, m) => { const p = clone(nl); f(p); const r = PC.checkPack(p, packs.filter(o => o.id !== 'nl-t1')); return r.errors.some(e => e.includes(m)); };
ok('controle: dubbel id', broken(p => p.items.push(clone(p.items[0])), 'dubbel id'));
ok('controle: verwijzing naar onbekende oefening', broken(p => p.lesson.push({ step: 3, ex: 'bestaat.niet' }), 'bestaat niet'));
ok('controle: ontbrekende vertaling', broken(p => { delete p.items[0].tr.en; }, 'tr.en ontbreekt'));
ok('controle: goed antwoord niet tussen de keuzes', broken(p => { p.exercises.find(e => e.form === 'gap').data.a = 'xx'; }, 'goed antwoord'));
ok('controle: gatzin zonder ___', broken(p => { p.items[0].gap = 'Geen gat.'; }, 'precies één ___'));
ok('controle: toetsvraag in een recept', broken(p => p.lesson.push({ step: 3, ex: p.tests.placement[0] }), 'toetsvraag'));
ok('controle: gereserveerde vorm', broken(p => p.exercises.push({ id: 'x.1', form: 'hear-type', items: [], data: {} }), 'gereserveerd'));
ok('controle: strict maakt kwaliteitseisen blokkerend', broken(p => { p.quality = 'strict'; }, 'omschrijving'));

// 3. veilig tonen
const evil = ['<script>alert(1)</script>', '<img src=x onerror=alert(1)>', '<b onclick="alert(1)">x</b>', '<a href="javascript:alert(1)">x</a>', '<svg/onload=alert(1)>', '&lt;script&gt;', '&#60;img&#62;', 'x &amp; y'];
for (const s of evil) ok('controle weigert opmaak: ' + s, broken(p => { p.items[0].ex = s; }, 'opmaak'));
ok('controle staat een losse & toe', !broken(p => { p.items[0].ex = 'Brood & melk.'; }, 'opmaak'));
ok('controle weigert opmaak in een vertaling', broken(p => { p.exercises.find(e => e.fb).fb.ok.th = '<script>x</script>'; }, 'opmaak'));
const st = PC.safeText('<script>alert(1)</script><b>vet</b> <i>schuin</i> <u>onder</u> <b onclick="x">y</b> & "q"');
ok('safeText: alles onschadelijk, alleen <b> <i> <u> terug', !/<script|<b onclick|<img/.test(st) && st.includes('<b>vet</b>') && st.includes('<i>schuin</i>') && st.includes('<u>onder</u>') && st.includes('&lt;script&gt;') && st.includes('&amp;'));
const evilPack = clone(nl); evilPack.items[0].ex = '<img src=x onerror=alert(1)>';
let app = await boot({ override: { 'content/nl-t1.json': evilPack } });
let g = app.api.get();
ok('app laadt een pakket met verboden opmaak niet en meldt het', g.PACK_MISSING.includes('nl-t1') && !g.NL.some(w => nl.items.some(x => x.id === w.id)));
// tweede verdedigingslinie: ook als de controle iets zou doorlaten, maakt de app de tekst onschadelijk
const noCheck = { ...PC, checkPack: () => ({ errors: [], quality: [] }) };
// regel: elke waarde gaat door precies één van safeText (rauw in de HTML) of esc() (in het scherm)
const evil2 = clone(nl); evil2.items[0].tr.th = '<script>x</script>'; evil2.texts[0].title.nl = '<img src=x onerror=1>'; evil2.exercises.find(e => e.text === 'nl.verhaal.1').data.q.nl = '<b onclick="x">a</b>'; evil2.items[0].ex = '<i onclick="y">z</i>';
app = await boot({ override: { 'content/nl-t1.json': evil2 }, pc: noCheck }); g = app.api.get();
ok('app: velden die rauw in de HTML komen, gaan altijd door safeText, ook zonder controle', g.NL[0].th.startsWith('&lt;script') && g.STORY.title.startsWith('&lt;img') && g.STORY.q[0].q.startsWith('&lt;b onclick'));
ok('app: velden die platte tekst blijven, toont het scherm met esc()', g.NL[0].ex === '<i onclick="y">z</i>' && ['esc(w.ex)', 'esc(w.w)', 'esc(l[0])', 'esc(p.text)', 'esc(x.s)', 'esc(x.nl)', 'esc(w.nl)', 'full=esc(fullT)'].every(s => html.includes(s)));
ok('app: opties in klok, Engelse gatzin en geld met esc(), ook in het attribuut', ['c.o.map(o=>`<button class="choice" data-o="${esc(o)}">${esc(o)}', 'x.o.map(o=>`<button class="choice" data-o="${esc(o)}" lang="en">${esc(o)}', 'd.o.map(o=>`<button class="choice num" data-o="${esc(o)}">${esc(o)}'].every(s => html.includes(s)));
ok('voorlezen spreekt geen tags of tekencodes uit', html.includes("t=String(t==null?'':t).replace(/<[^>]*>/g,'')"));
app = await boot(); g = app.api.get();
ok('app: ingebouwde pakketten geladen, niets gemeld', !g.PACK_MISSING.length && g.NL.length === NLWORDS && g.EN.length === 8 && g.REK.length === g.PACKS.flatMap(p => p.items || []).filter(x => x.kind === 'skill').length && g.SENT.length === g.PACKS.filter(p => p.learn === 'nl').flatMap(p => p.exercises || []).filter(e => e.form === 'build').length && g.PAIRS.length === g.PACKS.find(p => p.id === 'nl-t1').exercises.filter(e => e.form === 'listen').length && g.SENT.length >= 4 && g.PAIRS.length >= 3 && g.PLACE.length === 15 && g.STORY.lines.length === 10);
ok('app: inhoud gelijk aan het pakket na safeText', g.NL[0].w === nl.items[0].w && g.STORY.lines[5][0] === PC.safeText(nl.texts[0].paras[0][5].nl));

// 4. ontbrekend pakket: app start, meldt het, opslag ongewijzigd
const fillLine = html.slice(html.indexOf('[...NL,...EN,...REK].forEach(x=>{if(!S.items[x.id])'), html.indexOf('\n', html.indexOf('[...NL,...EN,...REK].forEach(x=>{if(!S.items[x.id])')));
const stored = { v: 2, schema: 2, introduced: ['werk'], items: { werk: { s: 3, due: 1, reps: 2, lapses: 0, forms: [] }, 'en-work': { s: 2, due: 1, reps: 1, lapses: 0, forms: [] }, 'r-geld': { s: 1, due: 1, reps: 1, lapses: 0, forms: [] } } };
for (const miss of ['content/en-t1.json', 'content/rk-1.json', 'content/nl-t1.json']) {
  const S = clone(stored);
  app = await boot({ S, missing: [miss] });
  g = app.api.get();
  const before = JSON.stringify(S);
  app.item = () => ({ s: 0, due: 0, reps: 0, lapses: 0, forms: [] });
  // dezelfde aanvulregel als bij het laden: vult alleen aan voor geladen pakketten
  const vm = await import('node:vm'); vm.runInContext('function item(){return {s:0,due:0,reps:0,lapses:0,forms:[]}}\n' + fillLine, app);
  const after = JSON.parse(JSON.stringify(S));
  const kept = Object.keys(stored.items).every(k => JSON.stringify(after.items[k]) === JSON.stringify(stored.items[k]));
  ok('ontbrekend ' + miss.split('/')[1] + ': gemeld, opslag van dat pakket onaangeroerd', g.PACK_MISSING.includes(miss.replace(/^content\/|\.json$/g, '')) && kept, 'gemeld: ' + g.PACK_MISSING + ' / ' + before);
}
app = await boot({ missing: ['content/rk-1.json'], S: clone(stored) }); g = app.api.get();
let q = null; app.runSession = (n, x) => { q = x; }; app.api.startLesson(false);
ok('zonder rekenpakket: Nederlands laadt nog (ook het hoofdstuk, met meldingen), les zonder rekenoefeningen', g.NL.length === NLWORDS && !q.some(x => ['money', 'clock', 'discount'].includes(x.type)) && q.some(x => x.type === 'build'));
app = await boot({ missing: ['content/nl-t1.json', 'content/en-t1.json', 'content/rk-1.json'] }); g = app.api.get();
q = null; app.runSession = (n, x) => { q = x; }; app.api.startLesson(false);
ok('geen enkel pakket: app start, meldt het bij een tik op de les en start geen lege les', g.PACK_MISSING.length === 3 && g.PACKS.length === builtin().length - 3 - HIDDEN.length && q === null && app.toasts.includes('pack.none'));
ok('melding op Vandaag als een pakket ontbreekt', /PACK_MISSING\.length\?`<div class="note" role="status">\$\{T\('pack\.missing'/.test(html));

// geen naambotsing: een functie of variabele uit het pakketblok mag elders in de app niet nog eens gedefinieerd worden
const block = html.slice(html.indexOf('const BUILTIN='), html.indexOf('await loadPacks();'));
const names = [...block.matchAll(/(?:^|\n)(?:function\s+([A-Za-z_$][\w$]*)\(|(?:const|let)\s+([A-Za-z_$][\w$]*)\s*=)/g)].map(m => m[1] || m[2]);
const dup = names.filter(n => (html.match(new RegExp('(?:function\\s+' + n.replace('$', '\\$') + '\\(|(?:const|let)\\s+' + n.replace('$', '\\$') + '\\s*=)', 'g')) || []).length > 1);
ok('geen naambotsing tussen het pakketblok en de rest van de app (' + names.length + ' namen)', names.length > 10 && !dup.length, dup.join(', '));

// review fase 2: & en aanhalingstekens in een woord komen goed in beeld; id of tone met een aanhalingsteken wordt geweigerd
{
  const amp = clone(nl); amp.items[0].w = 'brood & "melk"'; amp.items[0].ex = 'Ik koop brood & "melk".';
  ok('woord met & en aanhalingstekens is toegestaan', !PC.checkPack(amp, packs.filter(o => o.id !== 'nl-t1')).errors.length);
  const a2 = await boot({ override: { 'content/nl-t1.json': amp } }); const w0 = a2.api.get().NL[0];
  ok('woord met & en aanhalingstekens blijft platte tekst (het scherm escapet één keer)', w0.w === 'brood & "melk"' && w0.ex === 'Ik koop brood & "melk".');
  ok('controle weigert een id met een aanhalingsteken', broken(p => { p.items[0].id = 'werk" onclick="x'; }, 'id mag alleen'));
  ok('controle weigert een groepsnaam met een aanhalingsteken', broken(p => { p.exercises[0].pool = 'zinnen" x="'; }, 'groepsnaam'));
  const en = packs.find(p => p.id === 'en-t1');
  const badTone = clone(en); badTone.cards[0].notes[0].tone = 'sky" onclick="x';
  ok('controle weigert een tone buiten de vaste lijst', PC.checkPack(badTone, packs.filter(o => o.id !== 'en-t1')).errors.some(e => e.includes('tone moet')));
  ok('controle weigert onbekende vaardigheid, tekstsoort en vraagtype', broken(p => { p.exercises.find(e => e.skill).skill = 'x"'; }, 'vaardigheid') && broken(p => { p.texts[0].sort = 'x"'; }, 'tekstsoort') && broken(p => { p.exercises.find(e => e.qtype).qtype = 'x'; }, 'vraagtype'));
  ok('app: id in een attribuut altijd met esc()', html.includes('data-id="${esc(o.id)}"') && html.includes('data-w="${esc(w.id)}"') && !/data-[a-z]+="\$\{[a-z]+\.id\}"/.test(html));
  ok('app: tone alleen uit de vaste lijst', html.includes("NOTE_TONES.includes(n.tone)"));
  ok('app: zonder pakketcheck.js geen pakketten', html.includes("if(!PC){BUILTIN.forEach(u=>PACK_MISSING.push(name(u)));return}"));
  const noPC = await boot({ pc: null });
  ok('app laadt zonder controle geen enkel pakket en meldt ze', noPC.api.get().PACKS.length === 0 && noPC.api.get().PACK_MISSING.length === builtin().length);
  const slow = await boot({ hang: ['content/en-t1.json'] });
  ok('pakket dat blijft hangen: na de tijdslimiet gemeld, de rest laadt', slow.api.get().PACK_MISSING.includes('en-t1') && slow.api.get().NL.length === NLWORDS);
}

// bij het weghalen van de oude inhoudslijsten verdween ooit 'let PL={}' (stand van de startmeting); die moet blijven bestaan
ok('startmeting heeft zijn tussenstand (PL) nog', /\nlet PL=\{\};\nfunction startPlacement\(/.test(html));

// 5. BUILTIN = SHELL
const sw = readFileSync(new URL('sw.js', ROOT), 'utf8');
const shell = eval(sw.slice(sw.indexOf('const SHELL=') + 'const SHELL='.length, sw.indexOf(';', sw.indexOf('const SHELL='))));
const bi = builtin();
ok('BUILTIN en SHELL noemen dezelfde pakketten', JSON.stringify(bi.slice().sort()) === JSON.stringify(shell.filter(s => s.startsWith('./content/')).map(s => s.slice(2)).sort()), 'BUILTIN ' + bi + ' / SHELL ' + shell);
ok('elk pakket in content/ staat in BUILTIN', files.every(f => bi.includes('content/' + f)));
ok('pakketcheck.js staat in SHELL en wordt vóór de app geladen', shell.includes('./pakketcheck.js') && html.indexOf('<script src="pakketcheck.js">') < html.indexOf('(async function(){'));
ok('service worker vraagt eigen bestanden vers op: geen oud pakket uit de browsercache naast nieuwe code', sw.includes("SHELL.map(u=>new Request(u,{cache:'reload'}))") && sw.includes("fetch(r.url,{cache:'no-cache'") && !/fetch(r).then/.test(sw));
ok('service worker bewaart alleen geslaagde antwoorden', sw.includes('if(res.ok){const cp=res.clone()'));
console.log(fails ? fails + ' FOUT' : 'alles OK');
