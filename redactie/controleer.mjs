// Poort van de redactielijn: controleert een hoofdstuk (pakket met scenes) tegen docs/scenes.md en docs/kwaliteitskader.md.
// Gebruik: node redactie/controleer.mjs redactie/uit/<pakket>.json   (fouten = afgekeurd, exit 1; waarschuwingen = voor de reviewer)
import { readFileSync, readdirSync } from 'node:fs';
import { createRequire } from 'node:module';
const require = createRequire(import.meta.url);
const SceneVis = require('../scene.js');

const file = process.argv[2];
if (!file) { console.error('Geef een pakketbestand op.'); process.exit(2); }
let p; try { p = JSON.parse(readFileSync(file, 'utf8')); } catch (e) { console.error('Geen geldige JSON: ' + e.message); process.exit(1); }

const err = [], warn = [];
// dezelfde controle als de app (pakketcheck.js), tegen de ingebouwde pakketten: wat de app weigert, keurt de lijn ook af
{ const PC = require('../pakketcheck.js'), dir = new URL('../content/', import.meta.url);
  const others = readdirSync(dir).filter(f => f.endsWith('.json')).map(f => { try { return JSON.parse(readFileSync(new URL(f, dir), 'utf8')); } catch (e) { return null; } }).filter(o => o && o.id !== p.id);
  const r = PC.checkPack(p, others); for (const m of r.errors) err.push('pakketcheck: ' + m); for (const m of r.quality || []) warn.push('pakketcheck: ' + m);
  for (const m of PC.checkChapter(p).errors) err.push('hoofdstuk: ' + m); }   // werkvormen, hints, lees- en luistertekst, spreken, spel, goals (masterplan A6, B1, B2, C1, C2, G2)
const ID = /^[A-Za-z0-9._-]+$/, LANGS = ['nl', 'th', 'en'];
const E = (w, m) => err.push(w + ': ' + m), Wn = (w, m) => warn.push(w + ': ' + m);
const txt = (x, w, langs = LANGS) => { if (!x || typeof x !== 'object') return E(w, 'tekst ontbreekt'); for (const l of langs) if (typeof x[l] !== 'string' || !x[l].trim()) E(w, 'taal ' + l + ' ontbreekt'); };
const THAI = /[฀-๿]/;
const thai = (x, w) => { if (x && typeof x.th === 'string' && x.th && !THAI.test(x.th)) E(w, 'th bevat geen Thais schrift'); };
// eigennamen: een hoofdletter midden in een Nederlandse zin (behalve talen, landen en beleefdheidsvormen)
const OK_CAPS = new Set(['Nederland', 'Nederlands', 'Nederlandse', 'Engels', 'Engelse', 'Thais', 'Thaise', 'Ik', 'U', 'Uw']);
const names = (s, w) => { if (typeof s !== 'string') return; const m = s.replace(/<[^>]+>/g, '').match(/(?<![.!?:]\s|^|[„“"'(]\s?)\b[A-ZÀ-Ý][a-zà-ÿ]{2,}\b/g); (m || []).filter(x => !OK_CAPS.has(x)).forEach(x => Wn(w, 'mogelijk een eigennaam: ' + x)); };

const ERRS = ['lidwoord', 'woordvolgorde', 'werkwoordsvorm', 'tijd', 'voorzetsel', 'spelling', 'klank', 'betekenis', 'beleefdheid', 'getal', 'rekenstap', 'lezen'];
// een keuze: t, r, why in drie talen, en bij een foute keuze het soort fout
const opt = (q, w) => {
  if (!['ok', 'near', 'no'].includes(q.r)) E(w, 'r ongeldig');
  if (typeof q.t !== 'string' || !q.t.trim() || q.t.length > 70) E(w, 't ontbreekt of is langer dan 70 tekens');
  txt(q.why, w + '.why'); thai(q.why, w); names(q.t, w);
  if (q.r !== 'ok' && !ERRS.includes(q.err)) E(w, 'err (soort fout) ontbreekt of staat niet in de lijst');
};
// een vraag in quiz, rule of extra; geeft 1 terug als het een geldig antwoordmoment is
let itemIdsRef = null, useRef = null;
const question = (q, w, sid, nosup) => {
  if (!q || typeof q !== 'object') { E(w, 'vraag ontbreekt'); return 0; }
  if (!['choose', 'hear', 'type', 'number'].includes(q.form)) E(w, 'form moet choose, hear, type of number zijn');
  if (!Array.isArray(q.items) || !q.items.length) E(w, 'items ontbreekt'); else for (const t of q.items) { if (!itemIdsRef.has(t)) E(w, 'item bestaat niet: ' + t); else useRef(t, sid); }
  txt(q.ask, w + '.ask', nosup ? ['nl'] : LANGS);
  if (q.form === 'choose' || q.form === 'hear') {
    const o = q.opts || [];
    if (o.length < 2 || o.length > 4) E(w, 'twee tot vier keuzes');
    if (o.filter(x => x.r === 'ok').length !== 1) E(w, 'precies één keuze moet ok zijn');
    o.forEach((x, k) => opt(x, w + '.opts[' + k + ']'));
  } else { if (q.answer == null || String(q.answer).trim() === '') E(w, 'answer ontbreekt'); txt(q.why, w + '.why'); }
  return 1;
};

if (p.format !== 1) E('pakket', 'format moet 1 zijn');
if (!ID.test(p.id || '')) E('pakket', 'id ontbreekt of heeft verboden tekens');
txt(p.title, 'pakket.title');
if (!ID.test(p.place || '')) E('pakket', 'place ontbreekt');

// ---- items ----
const items = Array.isArray(p.items) ? p.items : [], itemIds = new Set();
if (!items.length) E('items', 'ontbreekt');
for (const it of items) {
  const w = 'item ' + (it && it.id);
  if (!it || !ID.test(it.id || '')) { E(w, 'id ongeldig'); continue; }
  if (itemIds.has(it.id)) E(w, 'id dubbel'); itemIds.add(it.id);
  if (!['word', 'phrase', 'rule', 'skill'].includes(it.kind)) E(w, 'kind moet word, phrase, rule of skill zijn');
  if (it.kind === 'word' || it.kind === 'phrase') {
    if (typeof it.w !== 'string' || !it.w.trim()) E(w, 'w ontbreekt');
    if (it.kind === 'word' && !['de', 'het', ''].includes(it.art)) E(w, 'art moet de, het of leeg zijn');
    if (!it.tr || !it.tr.th || !it.tr.en) E(w, 'vertaling th of en ontbreekt'); else thai({ th: it.tr.th }, w);
    if (typeof it.def !== 'string' || it.def.trim().split(/\s+/).length < 3) E(w, 'def (omschrijving in eenvoudig Nederlands) ontbreekt of is te kort');
    if (typeof it.ex !== 'string' || !it.ex.trim()) E(w, 'ex (voorbeeldzin) ontbreekt');
    else { const stem = String(it.w).toLowerCase().split(/\s+/).pop().slice(0, 4); if (stem && !it.ex.toLowerCase().includes(stem)) Wn(w, 'voorbeeldzin lijkt het woord niet te bevatten'); names(it.ex, w + '.ex'); }
    if (it.def && it.w && it.def.toLowerCase().includes(String(it.w).toLowerCase())) Wn(w, 'omschrijving gebruikt het woord zelf');
  } else { txt(it.title, w + '.title'); }
}
const words = items.filter(i => i.kind === 'word' || i.kind === 'phrase');
if (words.length < 20 || words.length > 32) E('items', 'verwacht 20 tot 32 woorden en zinnen, gevonden ' + words.length);

// ---- scenes ----
const scenes = Array.isArray(p.scenes) ? p.scenes : [], seen = new Map(), sceneIds = new Set();
const use = (id, sc) => { if (!seen.has(id)) seen.set(id, new Set()); seen.get(id).add(sc); };
itemIdsRef = itemIds; useRef = use;
const nlScenes = scenes.filter(s => s && s.subject === 'nl');
if (nlScenes.length !== 5) E('scenes', 'verwacht vijf scènes Nederlands, gevonden ' + nlScenes.length);
if (!scenes.some(s => s && s.subject === 'rk')) E('scenes', 'rekenscène ontbreekt');
if (!scenes.some(s => s && s.subject === 'kn')) E('scenes', 'kennisles ontbreekt');
if (nlScenes.map(s => s.n).sort().join() !== '1,2,3,4,5') E('scenes', 'n van de scènes Nederlands moet 1 tot 5 zijn');

for (const s of scenes) {
  const w = 'scène ' + (s && s.id);
  if (!s || !ID.test(s.id || '')) { E(w, 'id ongeldig'); continue; }
  if (sceneIds.has(s.id)) E(w, 'id dubbel'); sceneIds.add(s.id);
  if (!['nl', 'rk', 'en', 'kn'].includes(s.subject)) E(w, 'subject ongeldig');
  for (const k of ['title', 'intro', 'can']) { txt(s[k], w + '.' + k); thai(s[k], w + '.' + k); names(s[k] && s[k].nl, w + '.' + k); }
  if (!Array.isArray(s.targets) || !s.targets.length) E(w, 'targets ontbreekt');
  else for (const t of s.targets) { if (!itemIds.has(t)) E(w, 'target bestaat niet als item: ' + t); else use(t, s.id); }
  for (const m of SceneVis.check(s.art)) E(w + '.art', m);
  for (const [i, t] of ((s.art && s.art.things) || []).entries()) if (t && t.hot) { txt(t.label, w + '.art.things[' + i + '].label'); thai(t.label, w + '.art.things[' + i + ']'); if (t.item && !itemIds.has(t.item)) E(w + '.art.things[' + i + ']', 'item bestaat niet: ' + t.item); if (t.item) use(t.item, s.id); }
  const st = Array.isArray(s.steps) ? s.steps : [];
  if (st.length < 3) { E(w, 'te weinig stappen'); continue; }
  if (st[st.length - 1].type !== 'end') E(w, 'de laatste stap moet end zijn');
  if (!st.some(x => ['do', 'make'].includes(x.type))) E(w, 'geen stap waarin de leerder iets doet of maakt');
  if (s.subject === 'nl' && s.n >= 3 && !st.some(x => x.type === 'make')) E(w, 'scène 3 tot 5 heeft een stap make nodig (afmaken of zelf maken)');
  if (s.subject === 'nl' && s.n >= 2 && !st.some(x => x.type === 'slot')) Wn(w, 'geen open plek (slot) voor herhaling');
  let moments = 0, turns = 0; const roles = new Set();
  st.forEach((x, i) => {
    const ws = w + '.steps[' + i + '] ' + x.type;
    if (x.type === 'talk') { moments += (x.turns || []).length; turns += (x.turns || []).length; }
    if (['do', 'make'].includes(x.type)) moments++;
    if (x.type === 'read' || x.type === 'listen') moments += (x.q || []).length;
    if (x.type === 'quiz') {
      if (!['instap', 'ophalen', 'controle'].includes(x.role)) E(ws, 'role moet instap, ophalen of controle zijn'); else roles.add(x.role);
      if (!Array.isArray(x.q) || !x.q.length) E(ws, 'q ontbreekt');
      (x.q || []).forEach((q, k) => { moments += question(q, ws + '.q[' + k + ']', s.id, x.role !== 'ophalen'); });
      if (x.role === 'controle' && (x.q || []).length !== 2) E(ws, 'de controle heeft precies twee vragen');
    }
    if (x.type === 'rule') {
      if (!Array.isArray(x.items) || !x.items.length) E(ws, 'items (de regel) ontbreekt'); else for (const t of x.items) { if (!itemIds.has(t)) E(ws, 'item bestaat niet: ' + t); else use(t, s.id); }
      txt(x.example, ws + '.example'); thai(x.example, ws + '.example');
      if (!Array.isArray(x.q) || x.q.length < 3) E(ws, 'minstens drie oefeningen');
      (x.q || []).forEach((q, k) => { moments += question(q, ws + '.q[' + k + ']', s.id); });
      const helps = (x.q || []).map(q => q.help); if (helps.some(h => ![0, 1, 2].includes(h))) E(ws, 'elke oefening heeft help 0, 1 of 2'); else if (helps[helps.length - 1] !== 0 || helps.some((h, k) => k && h > helps[k - 1])) E(ws, 'de hulp moet afbouwen en eindigen op 0');
    }
    if (x.type === 'extra') {
      if (!ERRS.includes(x.err)) E(ws, 'err ontbreekt of staat niet in de lijst');
      txt(x.explain, ws + '.explain'); thai(x.explain, ws + '.explain');
      if (!Array.isArray(x.q) || x.q.length < 2) E(ws, 'minstens twee oefeningen');
      (x.q || []).forEach((q, k) => question(q, ws + '.q[' + k + ']', s.id));
    }
    const its = x.items || [];
    if (['do', 'make', 'read', 'listen'].includes(x.type)) { if (!its.length) E(ws, 'items ontbreekt (doel op de eerste plek)'); }
    for (const t of its) { if (!itemIds.has(t)) E(ws, 'item bestaat niet: ' + t); else use(t, s.id); }
    if (x.type === 'talk') {
      if (!Array.isArray(x.turns) || !x.turns.length) return E(ws, 'turns ontbreekt');
      x.turns.forEach((t, j) => {
        const wt = ws + '.turns[' + j + ']';
        txt(t.them, wt + '.them'); thai(t.them, wt + '.them'); names(t.them && t.them.nl, wt + '.them');
        if (!Array.isArray(t.items) || !t.items.length) E(wt, 'items ontbreekt'); else for (const q of t.items) { if (!itemIds.has(q)) E(wt, 'item bestaat niet: ' + q); else use(q, s.id); }
        const o = t.opts || [];
        if (o.length !== 3) E(wt, 'verwacht drie keuzes');
        if (o.filter(q => q.r === 'ok').length !== 1) E(wt, 'precies één keuze moet ok zijn');
        if (j === 0 && o[0] && o[0].r === 'ok') Wn(wt, 'het goede antwoord staat vooraan');
        o.forEach((q, k) => opt(q, wt + '.opts[' + k + ']'));
      });
    }
    if (x.type === 'do') { txt(x.ask, ws + '.ask'); txt(x.why, ws + '.why'); if (x.answer == null && !x.gen && !x.opts) E(ws, 'answer, opts of gen ontbreekt'); }
    if (x.type === 'make') { txt(x.ask, ws + '.ask'); if (typeof x.frame !== 'string' && !Array.isArray(x.frame)) E(ws, 'frame (schrijfkader) ontbreekt'); if (typeof x.model !== 'string') E(ws, 'model (voorbeeldantwoord) ontbreekt'); if (!Array.isArray(x.checklist) || x.checklist.length < 2) E(ws, 'checklist met minstens twee punten ontbreekt'); }
    if (x.type === 'read') { if (!x.text || typeof x.text.nl !== 'string') E(ws, 'text.nl ontbreekt'); if (!Array.isArray(x.q) || x.q.length < 2) E(ws, 'minstens twee vragen'); if (s.subject === 'kn' && (!Array.isArray(x.sources) || !x.sources.length)) E(ws, 'een kennisles heeft bronnen nodig (sources)'); }
    if (x.type === 'end') { txt(x.next, ws + '.next'); txt(x.real, ws + '.real'); }
  });
  // diepte (docs/scenes.md, Diepte en diagnose)
  if (s.subject === 'nl') {
    if (moments < 18) E(w, 'te dun: ' + moments + ' antwoordmomenten, minstens 18 nodig');
    if (turns < 4) E(w, 'het gesprek heeft ' + turns + ' beurten, minstens vier nodig');
    for (const r of ['instap', 'ophalen', 'controle']) if (!roles.has(r)) E(w, 'quiz met role ' + r + ' ontbreekt');
    if (!st.some(x => x.type === 'rule')) E(w, 'stap rule (taal uit de tekst) ontbreekt');
    if (!st.some(x => x.type === 'extra')) E(w, 'stap extra (bij een herhaalde fout) ontbreekt');
  } else {
    if (moments < 8) E(w, 'te dun: ' + moments + ' antwoordmomenten, minstens 8 nodig');
    if (!roles.has('controle')) E(w, 'quiz met role controle ontbreekt');
  }
}

// ---- dekking: elk woord in minstens twee scènes; elk woord minstens één keer ----
for (const it of words) { const n = seen.has(it.id) ? seen.get(it.id).size : 0; if (n === 0) E('dekking', it.id + ' komt in geen enkele scène voor'); else if (n === 1) Wn('dekking', it.id + ' komt maar in één scène voor'); }
const s5 = nlScenes.find(s => s.n === 5);
if (s5) { const in5 = words.filter(it => seen.has(it.id) && seen.get(it.id).has(s5.id)).length; if (in5 < Math.ceil(words.length * 0.7)) E('dekking', 'scène 5 raakt ' + in5 + ' van de ' + words.length + ' woorden; 70 procent is nodig'); }

console.log(file + ': ' + err.length + ' fouten, ' + warn.length + ' waarschuwingen');
for (const e of err) console.log('  FOUT  ' + e);
for (const x of warn) console.log('  let op  ' + x);
process.exit(err.length ? 1 : 0);
