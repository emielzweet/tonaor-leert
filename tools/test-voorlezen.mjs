import vm from 'node:vm'; import { readFileSync } from 'node:fs';
const h = readFileSync(new URL('../index.html', import.meta.url), 'utf8');
const block = h.slice(h.indexOf('/* ============ voorlezen'), h.indexOf('function voiceCard'));
let fails = 0; const ok = (n, v) => { if (!v) fails++; console.log((v ? 'OK  ' : 'FOUT') + ' ' + n); };
function run(voices, S = {}, ua = 'Mozilla/5.0 (Windows NT 10.0)') {
  const spoken = [], toasts = [];
  const L = {};
  const ctx = { QUIET: false, S, toast: m => toasts.push(m), tab: 'vandaag', route: null, app: { classList: { contains: () => false } }, vMe() {}, setTimeout, clearTimeout, navigator: { userAgent: ua, platform: 'Win32', maxTouchPoints: 0 },
    SpeechSynthesisUtterance: function (t) { this.text = t; },
    speechSynthesis: { getVoices: () => voices, cancel() {}, speak: u => spoken.push(u),
      addEventListener: (n, f) => { (L[n] = L[n] || []).push(f) }, removeEventListener: (n, f) => { L[n] = (L[n] || []).filter(x => x !== f) },
      fire: n => (L[n] || []).slice().forEach(f => f({ type: n })) } };
  vm.createContext(ctx); vm.runInContext(block, ctx);
  return { ctx, spoken, toasts };
}
const V = (name, lang, extra = {}) => ({ name, lang, voiceURI: name, localService: true, ...extra });
// a) alleen een Engelse stem (zoals deze pc): niet voorlezen, wel melding
let r = run([V('Microsoft Zira Desktop', 'en-US')]);
r.ctx.say('Ik werk morgen.'); r.ctx.say('Nog een keer.');
ok('alleen Engelse stem: Nederlands wordt niet met Engelse stem gelezen', r.spoken.length === 0);
ok('één keer een melding', r.toasts.length === 1 && /Nederlandse stem/.test(r.toasts[0]));
r.ctx.say('She works.', false, 'en'); ok('Engels wordt wel voorgelezen', r.spoken.length === 1 && r.spoken[0].voice.lang === 'en-US');
// b) meerdere stemmen: natuurlijke nl-NL wint van nl-BE en gewone nl-NL
r = run([V('Ellen', 'nl-BE'), V('Xander', 'nl-NL'), V('Microsoft Fenna Online (Natural) - Dutch (Netherlands)', 'nl-NL', { localService: false }), V('Daniel', 'en-GB')]);
r.ctx.say('Hallo');
ok('beste stem: natuurlijke nl-NL', r.spoken[0].voice.name.startsWith('Microsoft Fenna') && r.spoken[0].lang === 'nl-NL');
// c) alleen Vlaams: dan toch Nederlandstalig (nl-BE) in plaats van niets
r = run([V('Ellen', 'nl-BE'), V('Samantha', 'en-US')]); r.ctx.say('Hallo');
ok('alleen nl-BE: die wordt gebruikt', r.spoken[0].voice.name === 'Ellen');
// d) gekozen stem wordt gerespecteerd
r = run([V('Xander', 'nl-NL'), V('Claire', 'nl-NL')], { voice: { nl: 'Claire' } }); r.ctx.say('Hallo');
ok('gekozen stem (Claire) gebruikt', r.spoken[0].voice.name === 'Claire');
// e) browser geeft nooit een lijst (zoals het voorbeeldvenster van de Claude-app): niet voorlezen, één melding
r = run([]); r.ctx.say('Hallo'); r.ctx.say('Nog een');
ok('lege lijst: eerst wachten, niet meteen voorlezen', r.spoken.length === 0 && r.toasts.length === 0);
r.ctx.speechSynthesis.fire('voiceschanged'); ok('event met nog lege lijst: blijft wachten', r.toasts.length === 0);
await new Promise(res => setTimeout(res, 1200));
ok('lege lijst blijft leeg: niet voorlezen (geen Engelse systeemstem), één melding', r.spoken.length === 0 && r.toasts.length === 1);
// e2) lijst komt later binnen: de laatste tekst wordt met een Nederlandse stem gelezen
const later = []; r = run(later); r.ctx.say('Eerste'); r.ctx.say('Tweede');
later.push(V('Xander', 'nl-NL'), V('Zira', 'en-US')); r.ctx.speechSynthesis.fire('voiceschanged');
ok('stemmen laden later: alleen de laatste tekst, met Nederlandse stem', r.spoken.length === 1 && r.spoken[0].text === 'Tweede' && r.spoken[0].voice.name === 'Xander');
await new Promise(res => setTimeout(res, 1700));
ok('daarna geen tweede keer voorgelezen door de wachttijd', r.spoken.length === 1);
// f) Engels kiest en-GB boven en-US
r = run([V('Samantha', 'en-US'), V('Daniel', 'en-GB'), V('Xander', 'nl-NL')]); r.ctx.say('Hi', false, 'en');
ok('Engels: en-GB eerst', r.spoken[0].voice.name === 'Daniel');
// g) iOS 'compact'/novelty-stemmen lager
r = run([V('Xander (compact)', 'nl-NL', { voiceURI: 'com.apple.voice.compact.nl-NL.Xander' }), V('Xander (Verbeterd)', 'nl-NL', { voiceURI: 'com.apple.voice.enhanced.nl-NL.Xander' })]); r.ctx.say('Hallo');
ok('verbeterde stem boven compacte', /Verbeterd/.test(r.spoken[0].voice.name));
// i) iPhone met lege lijst: meteen voorlezen op taal nl-NL (iOS kiest zijn Nederlandse stem)
r = run([], {}, 'Mozilla/5.0 (iPhone; CPU iPhone OS 18_0 like Mac OS X)'); r.ctx.say('Hallo');
ok('iPhone, lege lijst: meteen voorlezen met lang nl-NL, zonder wachten', r.spoken.length === 1 && r.spoken[0].lang === 'nl-NL' && !r.spoken[0].voice && r.toasts.length === 0);
// j) iPhone mét lijst: gewoon de beste Nederlandse stem
r = run([V('Xander', 'nl-NL'), V('Samantha', 'en-US')], {}, 'Mozilla/5.0 (iPhone)'); r.ctx.say('Hallo');
ok('iPhone met lijst: Nederlandse stem gekozen', r.spoken[0].voice.name === 'Xander');
ok('geen proeven meer met stille geluidjes of de audiosessie (stilteschakelaar vraagt geluidsbestanden, zie STATUS)', !/silentWav|audioSession|iosPrime|VOICETEST|KEEP=/.test(h) && h.includes('function speakNow(t,slow,lang,v){speechSynthesis.cancel();'));
console.log(fails ? fails + ' FOUT' : 'alles OK');
