// Vaste startstanden en zaadwaarden voor de lestest (fase 2). Gedeeld door les-vastleggen.mjs en test-les.mjs.
export const NOW = Date.UTC(2026, 10, 13, 12, 0, 0);
const DAY = 864e5;
const NLIDS = ['werk', 'dienst', 'collega', 'rooster', 'pauze', 'fabriek', 'machine', 'leidinggevende', 'salaris', 'vrijedag', 'afspraak', 'fiets', 'huis', 'winkel', 'korting', 'geld', 'week', 'opleiding'];
const ENIDS = ['en-work', 'en-colleague', 'en-break', 'en-schedule', 'en-factory', 'en-information', 'en-appointment', 'en-money'];
const it = (o = {}) => ({ s: 0, due: NOW, reps: 0, lapses: 0, forms: [], ...o });
function base() { const items = {}; [...NLIDS, ...ENIDS, 'r-geld', 'r-klok', 'r-10', 'r-25', 'r-komma'].forEach(id => items[id] = it()); return { v: 2, introduced: [], items }; }
// mulberry32: vaste reeks voor Math.random
export function seeded(seed) { let a = seed >>> 0; return () => { a |= 0; a = a + 0x6D2B79F5 | 0; let t = Math.imul(a ^ a >>> 15, 1 | a); t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t; return ((t ^ t >>> 14) >>> 0) / 4294967296; }; }
function withDue(intro, dueIds, extra = {}) {
  const S = base(); S.introduced = [...intro];
  intro.forEach((id, i) => S.items[id] = it({ s: 3, reps: 2, due: NOW + 5 * DAY }));
  dueIds.forEach((id, i) => S.items[id] = it({ s: 2, reps: 3, due: NOW - (dueIds.length - i) * DAY }));
  Object.assign(S, extra); return S;
}
export const SCENARIOS = [
  { name: 'nieuw-gewoon', kind: 'lesson', englishDay: false, seed: 1, now: NOW, state: () => base() },
  { name: 'nieuw-engelsedag', kind: 'lesson', englishDay: true, seed: 2, now: NOW, state: () => base() },
  { name: 'herhalen-gewoon', kind: 'lesson', englishDay: false, seed: 3, now: NOW, state: () => withDue(NLIDS.slice(0, 8), ['salaris', 'werk', 'pauze', 'collega', 'fabriek']) },
  { name: 'herhalen-engelsedag', kind: 'lesson', englishDay: true, seed: 4, now: NOW, state: () => withDue(NLIDS.slice(0, 6), ['dienst', 'rooster']) },
  { name: 'alles-bekend', kind: 'lesson', englishDay: false, seed: 5, now: NOW, state: () => withDue(NLIDS, ['week', 'geld']) },
  { name: 'kort-nieuw', kind: 'short', englishDay: false, seed: 6, now: NOW, state: () => base() },
  { name: 'kort-herhalen', kind: 'short', englishDay: false, seed: 7, now: NOW, state: () => withDue(NLIDS.slice(0, 10), ['huis', 'werk', 'week', 'geld', 'pauze']) },
  { name: 'engels-nieuw', kind: 'en', englishDay: true, seed: 8, now: NOW, state: () => base() },
  { name: 'engels-herhalen', kind: 'en', englishDay: true, seed: 9, now: NOW, state: () => { const S = base(); ENIDS.slice(0, 5).forEach((id, i) => S.items[id] = it({ s: 2, reps: 2, due: i < 3 ? NOW - (i + 1) * DAY : NOW + 3 * DAY })); return S; } },
];
// samenvatting van een lesrij: vorm, stap en wat hem bepaalt (woord, zin, klankpaar, ...)
export function summarize(res) {
  return { name: res.name, q: res.q.map(x => {
    const o = { type: x.type, step: x.step };
    if (x.w) o.w = x.w.id;
    if (x.s && x.s.parts) o.s = x.s.parts.join(' ');
    if (x.type === 'gap' || x.type === 'engap') o.s = (x.x || x).s;
    if (x.p) o.p = x.p.say;
    if (x.k) o.k = x.k;
    if (x.c) o.c = x.c.a;
    if (x.label) o.label = x.label;
    return o;
  }) };
}
