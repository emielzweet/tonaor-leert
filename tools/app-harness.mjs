// Draait de echte pakketlader en lessamensteller uit index.html in Node (zonder browser). Gedeeld door test-les en test-pakket.
import vm from 'node:vm';
import { readFileSync } from 'node:fs';
import { createRequire } from 'node:module';
const require = createRequire(import.meta.url);
export const ROOT = new URL('../', import.meta.url);
export const html = readFileSync(new URL('index.html', ROOT), 'utf8');
export const PC = require('../pakketcheck.js');
export const UV = require('../uitleg.js');
const fnBlock = name => { const i = html.indexOf('function ' + name + '('); if (i < 0) throw new Error(name); let d = 0, j = html.indexOf('{', i); for (; j < html.length; j++) { if (html[j] === '{') d++; else if (html[j] === '}') { d--; if (!d) break; } } return html.slice(i, j + 1); };
const between = (a, b) => { const i = html.indexOf(a), j = html.indexOf(b, i); if (i < 0 || j < 0) throw new Error(a); return html.slice(i, j); };
// het pakketblok tot en met de samensteller, zonder de await aan het eind
const packCode = between('const BUILTIN=', 'await loadPacks();').replace('const PACK_TIMEOUT=4000;', 'const PACK_TIMEOUT=300;');
const lineOf = start => { const i = html.indexOf(start); if (i < 0) throw new Error(start); return html.slice(i, html.indexOf('\n', i)); };
const afterLoad = lineOf('[...NL,...EN,...REK,') + '\n' + lineOf('PACKS.forEach(p=>(p.items||[]).forEach(x=>{if(x&&x.id&&x.kind)KIND[x.id]=x.kind}));') + '\n' + lineOf("if(STORE==='ok'&&S.f3pending)");
const shuffleCode = html.slice(html.indexOf('const shuffle='), html.indexOf('\n', html.indexOf('const shuffle=')));
/* opts: S (opslag), englishDay, seed (Math.random), missing: lijst bestanden die niet laden, override: {bestand: inhoud} */
export async function boot({ S = { v: 2, introduced: [], items: {} }, englishDay = false, random = Math.random, missing = [], override = {}, pc = PC, hang = [] } = {}) {
  const fetch = u => hang.includes(u) ? new Promise(() => {}) : missing.includes(u) ? Promise.reject(new Error('offline')) : Promise.resolve({ ok: true, json: () => Promise.resolve(override[u] ? JSON.parse(JSON.stringify(override[u])) : JSON.parse(readFileSync(new URL(u, ROOT), 'utf8'))) });
  const m = Object.create(Math); m.random = random;
  const ctx = { window: pc === null ? { UitlegVis: UV } : { PakketCheck: pc, UitlegVis: UV }, fetch, Math: m, Date, JSON, Object, Array, String, Number, Promise, console: { warn() {} }, S, esc: s => String(s).replace(/[&<>"']/g, c => '&#' + c.charCodeAt(0) + ';'),
    toasts: [], toast(m) { ctx.toasts.push(m); }, tx: k => k, t: k => k, setTimeout, setInterval: () => 0, Promise, caches: undefined, document: { visibilityState: "hidden", getElementById: () => null, addEventListener() {}, createElement: () => ({ setAttribute() {}, addEventListener() {}, remove() {} }), body: { classList: { add() {}, remove() {} }, appendChild() {} } },
    nlOnly: () => false, supL: () => 'th', supAttr: () => 'lang="th"', supSpan: s => s, bi: (a, b) => a + '|' + b, T: k => k, LANG: {}, icon: { play: '' }, say() {}, $: () => null, now: () => ctx.NOW, isEnglishDay: () => englishDay, NOW: Date.now(), DAY: 864e5, STORE: 'ok', save() {}, today: () => Math.floor(ctx.NOW / 864e5) * 864e5 };
  vm.createContext(ctx);
  vm.runInContext(packCode + '\n' + fnBlock('item') + '\n' + fnBlock('stage') + '\n' + fnBlock('thirsty') + '\n' + shuffleCode + '\n' + fnBlock('startLesson') + '\n' + fnBlock('startEnglish')
    + '\nthis.api={loadPacks,compose,startLesson,startEnglish,explFor,exQ:(e,s,l)=>exQ(e,s,l),get:()=>({PACKS,PACK_MISSING,NL,EN,REK,SENT,PAIRS,DICTEE,STORY,PLACE,EXPL,EXPL_LIST})};', ctx);
  await ctx.api.loadPacks();
  vm.runInContext(afterLoad, ctx);
  return ctx;
}
export function builtin() { return JSON.parse(JSON.stringify(eval(html.slice(html.indexOf('const BUILTIN=') + 'const BUILTIN='.length, html.indexOf(';', html.indexOf('const BUILTIN=')))))); }
