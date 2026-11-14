// #30: opslag veilig laden, migreren, bewaren en terugzetten. Draait de echte code uit index.html met een nep-localStorage.
import vm from 'node:vm';
import { readFileSync } from 'node:fs';
const h = readFileSync(new URL('../index.html', import.meta.url), 'utf8');
let fails = 0; const ok = (n, v) => { if (!v) fails++; console.log((v ? 'OK  ' : 'FOUT') + ' ' + n); };
const KEY = 'tonaor-leert-v2';
const cut = (from, to) => { const a = h.indexOf(from); const b = h.indexOf(to, a); if (a < 0 || b < 0) throw new Error('niet gevonden: ' + from); return h.slice(a, b + to.length); };
const boot = cut('const SCHEMA=', '})();');
const SCH = +h.match(/const SCHEMA=([0-9]+)/)[1];
const fnLine = name => { const a = h.indexOf('function ' + name + '('); return h.slice(a, h.indexOf('\n', a)); };
const saveFn = fnLine('save');
const restore = fnLine('parseBackup') + '\n' + h.slice(h.indexOf('function parseBackup('), h.indexOf('function pickFile(')).split('\n').slice(1).join('\n');

// vaste voorbeeldopslag
const OLD = { v: 2, onboarded: true, thai: 'altijd', items: { werk: { s: 3, due: 1, reps: 4, lapses: 1, forms: ['typen'] } }, points: { 1: 30 }, code2: 'ABCD-EFGH', v2ok: true, help: [], answers: [] };
const CUR = { ...OLD, v2ok: undefined, v2seen: 5, tl1off: true, profile: { name: '' }, learn: 'nl', sup: 'en', schema: SCH };
delete CUR.v2ok;
const FUT = { ...CUR, schema: 99, nieuwVeld: [1, 2, 3] };

function run(store, patchBoot = x => x) {
  const ls = { _: { ...store }, getItem(k) { return k in this._ ? this._[k] : null }, setItem(k, v) { this._[k] = String(v) }, removeItem(k) { delete this._[k] } };
  const ctx = { localStorage: ls, KEY, LEARN: ['nl'], SUPPORT: ['th', 'en'], Date, JSON, Number, Array, Object, String, Math };
  vm.createContext(ctx);
  vm.runInContext('function fresh(){return {v:2,items:{},schema:SCHEMA,points:{},log:[],fresh:true}}\n' + patchBoot(boot) + '\n' + saveFn + '\n' + restore + '\nthis.get=()=>({S,STORE})', ctx);
  return { ctx, ls, ...ctx.get() };
}
const raw = o => JSON.stringify(o);

// 1. opslag zonder schema (alle bestaande installaties)
let r = run({ [KEY]: raw(OLD) });
ok('zonder schema: geladen als ok', r.STORE === 'ok');
ok('zonder schema: reservekopie is precies de oude opslag', r.ls._[KEY + '.bak'] === raw(OLD));
ok('zonder schema: gemigreerd naar het huidige schema en weggeschreven', r.S.schema === SCH && JSON.parse(r.ls._[KEY]).schema === SCH);
ok('migratie: profiel, talen en TL1-vlag aangevuld', r.S.profile && r.S.learn === 'nl' && r.S.sup === 'th' && r.S.tl1off === true && !('v2ok' in r.S));
ok('migratie: voortgang en koppelcode blijven', r.S.items.werk.reps === 4 && r.S.points[1] === 30 && r.S.code2 === 'ABCD-EFGH');
ok('migratie is herhaalbaar (idempotent)', JSON.stringify(r.ctx.migrate(JSON.parse(JSON.stringify(r.S)))) === JSON.stringify(r.S));

// 2. opslag met het huidige schema
r = run({ [KEY]: raw(CUR) });
ok('met schema: ok, geen nieuwe reservekopie, opslag onaangeroerd', r.STORE === 'ok' && !(KEY + '.bak' in r.ls._) && r.ls._[KEY] === raw(CUR) && r.S.sup === 'en');

// 3. kapotte of onbekende opslag: nooit overschrijven
for (const [naam, val] of [['geen JSON', '{kapot'], ['andere versie (v:3)', raw({ ...CUR, v: 3 })], ['geen items', raw({ v: 2 })], ['ongeldig schema', raw({ ...CUR, schema: 'x' })], ['lijst in plaats van object', '[1,2]']]) {
  r = run({ [KEY]: val, [KEY + '.bak']: 'oude-bak' });
  r.ctx.save();
  ok('kapot (' + naam + '): herstelstand, opslag en reservekopie onaangeroerd, ook na save()', r.STORE === 'broken' && r.ls._[KEY] === val && r.ls._[KEY + '.bak'] === 'oude-bak');
}

// 4. opslag van een nieuwere app: alleen lezen
r = run({ [KEY]: raw(FUT) });
r.S.points[2] = 99; r.ctx.save();
ok('nieuwer: alleen-lezen, gegevens zichtbaar, niets weggeschreven', r.STORE === 'newer' && r.S.nieuwVeld.length === 3 && r.ls._[KEY] === raw(FUT) && !(KEY + '.bak' in r.ls._));

// 5. lege opslag (nieuwe installatie)
r = run({});
ok('leeg: nieuwe stand, niets weggeschreven bij het laden', r.STORE === 'ok' && r.S.fresh && Object.keys(r.ls._).length === 0);

// 6. bestand terugzetten
r = run({ [KEY]: raw(CUR) });
const file = raw({ app: 'tonaor-leert', kind: 'reservekopie', schema: 1, saved: '2026-11-13T10:00:00Z', data: OLD });
let p = r.ctx.parseBackup(file);
ok('bestand: geldig reservekopiebestand gelezen, met datum', p.data && p.data.items.werk && p.saved === Date.parse('2026-11-13T10:00:00Z'));
ok('bestand: kale opslag mag ook', !!r.ctx.parseBackup(raw(CUR)).data);
ok('bestand: onleesbaar, ongeldig en nieuwer worden geweigerd', r.ctx.parseBackup('xx').err === 'bk.err.read' && r.ctx.parseBackup(raw({ a: 1 })).err === 'bk.err.invalid' && r.ctx.parseBackup(raw({ kind: 'reservekopie', data: FUT })).err === 'bk.err.newer');
ok('terugzetten: huidige stand eerst naar de reservekopie, daarna gemigreerd weggeschreven', r.ctx.writeRestored(p.data, KEY + '.bak') && r.ls._[KEY + '.bak'] === raw(CUR) && JSON.parse(r.ls._[KEY]).schema === SCH && JSON.parse(r.ls._[KEY]).items.werk.reps === 4);

// 7. migratiestappen compleet; een fout in een stap geeft het herstelscherm en schrijft niets weg
r = run({ [KEY]: raw(CUR) });
ok('MIGRATE heeft elke stap van 1 tot SCHEMA-1', vm.runInContext('Array.from({length:SCHEMA-1},(_,i)=>typeof MIGRATE[i+1]==="function").every(Boolean)', r.ctx));
r = run({ [KEY]: raw(OLD) }, b => b.replace('1:s=>{', "1:s=>{throw new Error('kapotte stap');"));
ok('fout in een migratiestap: herstelstand, opslag onaangeroerd, reservekopie wel gemaakt', r.STORE === 'broken' && r.ls._[KEY] === raw(OLD) && r.ls._[KEY + '.bak'] === raw(OLD));
r = run({ [KEY]: raw({ ...OLD, schema: 1 }) }, b => b.replace("const MIGRATE={", 'const MIGRATE={0:null,').replace(' 1:s=>{', ' x1:s=>{'));
ok('ontbrekende migratiestap: herstelstand, opslag onaangeroerd', r.STORE === 'broken' && r.ls._[KEY] === raw({ ...OLD, schema: 1 }));

// 8. ontbrekende velden worden aangevuld, niets overschreven
const ZONDER = { v: 2, schema: SCH, items: { werk: { s: 1, reps: 2 } }, points: { 1: 5 } };
r = run({ [KEY]: raw(ZONDER) });
ok('ontbrekend veld (log) aangevuld, bestaand veld (points) niet overschreven', Array.isArray(r.S.log) && r.S.points[1] === 5);

// 8b. stap 2 → 3: standaard weekdoel 7 → 10 uur, een eigen keuze blijft
r = run({ [KEY]: raw({ ...CUR, schema: 2, weekGoal: 420 }) });
ok('schema 2 met 7 uur zonder eigen keuze: wordt 10 uur, met reservekopie', r.S.weekGoal === 600 && r.S.schema === SCH && JSON.parse(r.ls._[KEY + '.bak']).weekGoal === 420);
r = run({ [KEY]: raw({ ...CUR, schema: 2, weekGoal: 420, weekGoalSet: true }) });
ok('schema 2 met zelf gekozen 7 uur: blijft 7 uur', r.S.weekGoal === 420 && r.S.schema === SCH);
r = run({ [KEY]: raw({ ...CUR, schema: 2, weekGoal: 300 }) });
ok('schema 2 met 5 uur: blijft 5 uur', r.S.weekGoal === 300);

// 8c. stap 3 → 4: elk item krijgt exs, verder blijft alles staan
r = run({ [KEY]: raw({ ...CUR, schema: 3, items: { werk: { s: 9, due: 5, reps: 7, lapses: 2, forms: ['herkennen', 'typen'] } } }) });
ok('schema 3 → 4: item houdt s, due, reps, lapses en forms, en krijgt exs', (w => w.s === 9 && w.due === 5 && w.reps === 7 && w.lapses === 2 && w.forms.length === 2 && Array.isArray(w.exs) && !w.exs.length)(r.S.items.werk) && r.S.schema === SCH);
r = run({ [KEY]: raw({ ...CUR, schema: 3, items: { werk: { s: 2, exs: ['nl.zin.1'] } } }) });
ok('schema 3 → 4 is herhaalbaar: bestaande exs blijft', r.S.items.werk.exs[0] === 'nl.zin.1');
r = run({ [KEY]: raw({ ...CUR, schema: 3, days: { 1: 1 }, items: {} }) });
ok('schema 3 → 4: wie al lessen deed, krijgt de overstap van fase 3 (f3pending)', r.S.f3pending === 1);
r = run({ [KEY]: raw({ ...CUR, schema: 3, days: {}, items: {} }) });
ok('schema 3 → 4: zonder lessen geen overstap', r.S.f3pending == null);
ok('f3pending staat niet in fresh() (anders krijgt elke oude opslag het veld zonder migratie)', !(h.slice(h.indexOf('function fresh()'), h.indexOf('\n', h.indexOf('function fresh()')) + 400).includes('f3pending')));

// 8d. stap 4 → 5: S.world voor scènes, alleen toegevoegd
r = run({ [KEY]: raw({ ...CUR, schema: 4, items: { werk: { s: 3, reps: 2 } } }) });
ok('schema 4 → 5: S.world toegevoegd, de rest onaangeroerd', r.S.world && r.S.world.done && typeof r.S.world.done === 'object' && r.S.items.werk.s === 3 && r.S.schema === SCH);
r = run({ [KEY]: raw({ ...CUR, schema: 4, world: { done: { 'dokter-1': 5 }, at: 'dokter-1' } }) });
ok('schema 4 → 5 is herhaalbaar: een bestaande world blijft', r.S.world.done['dokter-1'] === 5 && r.S.world.at === 'dokter-1');

// 9. terugzetten vanaf Ik zet de oude koppeling (TL1) nooit opnieuw aan; in het herstelscherm is het bestand leidend
const ZONDERHELLO = { v: 2, schema: SCH, items: { werk: { s: 1 } }, code: 'oud-1234', code2: 'NIEUW' };
r = run({ [KEY]: raw(CUR) });
ok('terugzetten vanaf Ik: tl1off blijft aan en v2seen blijft het laatste', r.ctx.writeRestored(ZONDERHELLO, KEY + '.bak', true) && JSON.parse(r.ls._[KEY]).tl1off === true && JSON.parse(r.ls._[KEY]).v2seen === 5);
r = run({ [KEY]: raw(CUR) });
r.ctx.writeRestored(ZONDERHELLO, KEY + '.kapot', false);
ok('herstelscherm: het bestand is leidend', !JSON.parse(r.ls._[KEY]).tl1off && JSON.parse(r.ls._[KEY]).code === 'oud-1234');
r = run({ [KEY]: raw(CUR) });
ok('terugzetten van een bestand met een kapotte migratie lukt niet en laat de opslag staan', !r.ctx.writeRestored({ v: 2, items: {}, schema: 0 }, KEY + '.bak', true) && r.ls._[KEY] === raw(CUR));

// 10. vangnetten in de rest van de code
const writes = [...h.matchAll(/localStorage\.setItem\(/g)].length;
ok('alleen save() en putStore() schrijven naar localStorage', writes === 2 && /function save\(\)\{if\(STORE!=='ok'\)return;/.test(h) && /function putStore\(/.test(h));
ok('koppelcodes schrijven via save()', /ensureCodes\(\)\{[^\n]*save\(\);/.test(h) && /if\(STORE==='ok'\)ensureCodes\(\);/.test(h));
ok('geen voortgang versturen buiten de stand ok', /function syncUp\(now_,cb\)\{if\(STORE!=='ok'\)return/.test(h));
ok('Alles wissen maakt eerst een reservekopie', /\$\('#yes'\)\.onclick=\(\)=>\{backupNow\(\);/.test(h));
ok('bewaren buiten stand ok: ruwe opslag met het schema van de gegevens zelf', /d=STORE==='ok'\?S:\(parseState\(rawStore\(KEY\)\)\|\|S\)/.test(h) && /schema:schemaOf\(d\)/.test(h));
ok('geen systeemvenster (confirm) voor opnieuw beginnen', !/[^.\w]confirm\(/.test(h.slice(h.indexOf('function vRecover('), h.indexOf('function vNewer('))));
ok('opstarten toont herstel- of bijwerkscherm', /if\(STORE==='broken'\)vRecover\(\);else if\(STORE==='newer'\)vNewer\(\);/.test(h));
// review fase 3: de migratie vult het begin van de wachttijd (t) voor bestaande items
r = run({ [KEY]: raw({ ...CUR, schema: 3, items: { werk: { s: 2, due: 10 * 864e5, reps: 3, lapses: 0, forms: [] }, nieuw: { s: 0, due: 5, reps: 0, lapses: 0, forms: [] } } }) });
ok('schema 3 → 4: t = due − s voor items met voortgang, niets bij nieuwe items', r.S.items.werk.t === 8 * 864e5 && r.S.items.nieuw.t == null);
// 8e. stap 5 → 6: foutprofiel (S.errs), beheerste scènes (world.ok) en eigen record (world.best), alleen toegevoegd
r = run({ [KEY]: raw({ ...CUR, schema: 5, world: { done: { 'dokter-1': 5 }, at: 'dokter-1' } }) });
ok('schema 5 → 6: errs, world.ok en world.best toegevoegd; world.done en items onaangeroerd', r.S.errs && typeof r.S.errs === 'object' && r.S.world.ok && r.S.world.best && r.S.world.done['dokter-1'] === 5 && r.S.items.werk.s === 3 && r.S.schema === SCH);
r = run({ [KEY]: raw({ ...CUR, schema: 5, errs: { lidwoord: { n: 2, t: 1, ids: ['werk'] } }, world: { done: {}, at: null, ok: { a: true }, best: { a: 7 } } }) });
ok('schema 5 → 6 is herhaalbaar: een bestaand foutprofiel en record blijven', r.S.errs.lidwoord.n === 2 && r.S.world.ok.a === true && r.S.world.best.a === 7);
r = run({ [KEY]: raw({ ...CUR, schema: 5, errs: [1, 2] }) });
ok('schema 5 → 6: een ongeldig foutprofiel wordt een leeg object', r.S.errs && !Array.isArray(r.S.errs) && Object.keys(r.S.errs).length === 0);
// F1: een volle opslag. setItem schrijft alles of niets; save() maakt eerst ruimte in de reeksen en meldt het anders één keer, zonder de opslag te beschadigen
{ const store = { [KEY]: 'oud' }, toasts = []; let full = true; const ctx = { STORE: 'ok', KEY, S: { v: 2, items: {} }, MOTOR: { histBudget: 300000 }, histTrim: () => 0, toast: m => toasts.push(m), tx: k => k, localStorage: { setItem(k, v) { if (full) throw new Error('QuotaExceededError'); store[k] = v; } } };
  vm.createContext(ctx); vm.runInContext(saveFn + '\nthis.save=save;', ctx);
  const r1 = ctx.save(), r2 = ctx.save();
  ok('F1: lukt wegschrijven niet, dan blijft de oude opslag staan, komt er één melding en geeft save() false', r1 === false && r2 === false && store[KEY] === 'oud' && toasts.length === 1 && toasts[0] === 'store.full');
  full = false; ok('F1: is er weer ruimte, dan schrijft save() gewoon', ctx.save() === true && store[KEY] !== 'oud'); }
console.log(fails ? fails + ' FOUT' : 'alles OK');
