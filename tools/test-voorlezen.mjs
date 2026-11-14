import vm from 'node:vm'; import { readFileSync } from 'node:fs';
const h = readFileSync(new URL('../index.html', import.meta.url), 'utf8');
const block = h.slice(h.indexOf('/* ============ voorlezen'), h.indexOf('function voiceCard'));
let fails = 0; const ok = (n, v) => { if (!v) fails++; console.log((v ? 'OK  ' : 'FOUT') + ' ' + n); };
function run(voices, S = {}, ua = 'Mozilla/5.0 (Windows NT 10.0)') {
  const spoken = [], toasts = [];
  const L = {};
  const ctx = { PC: null, STORE: 'ok', PACKS: [], PACK_TIMEOUT: 300, QUIET: false, S, toast: m => toasts.push(m), tab: 'vandaag', route: null, app: { classList: { contains: () => false } }, vMe() {}, setTimeout, clearTimeout, navigator: { userAgent: ua, platform: 'Win32', maxTouchPoints: 0 },
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
ok('geen proeven meer met stille geluidjes of de audiosessie (stilteschakelaar vraagt geluidsbestanden, zie STATUS)', !/silentWav|audioSession|iosPrime|VOICETEST|KEEP=/.test(h) && h.includes('function speakNow(t,slow,lang,v){audioStop();speechSynthesis.cancel();'));
{ // geluidsbestanden (docs/geluid.md): bestand als het er is, zinnen na elkaar, anders de stem van het toestel en op de lijst
  const PCm = (await import('node:module')).createRequire(import.meta.url)('../pakketcheck.js');
  const played = [], spoken = [], saves = [];
  function FakeAudio() { this.listeners = {}; this.setAttribute = () => {}; this.pause = () => {}; this.play = () => { played.push(this.src + '@' + this.playbackRate); return Promise.resolve(); }; this.addEventListener = (n, f) => { this.listeners[n] = f; }; }
  const S = {};
  const ctx = { PC: PCm, STORE: 'ok', PACKS: [], PACK_TIMEOUT: 300, QUIET: false, S, save: () => saves.push(1), toast() {}, tab: 'vandaag', route: null, app: { classList: { contains: () => false } }, vMe() {}, setTimeout, clearTimeout,
    navigator: { userAgent: 'Mozilla/5.0 (Windows NT 10.0)', platform: 'Win32' }, Audio: FakeAudio,
    SpeechSynthesisUtterance: function (t) { this.text = t; },
    speechSynthesis: { getVoices: () => [V('Xander', 'nl-NL')], cancel() {}, speak: u => spoken.push(u.text), addEventListener() {}, removeEventListener() {} } };
  vm.createContext(ctx); vm.runInContext(block, ctx);
  const H = t => PCm.audioHash(t, 'pim');
  vm.runInContext(`AUD=new Set(${JSON.stringify([H('de afspraak'), H('Ik heb een afspraak morgen.')])})`, ctx);
  ctx.say('de afspraak.');
  ok('geluid: een tekst met een bestand speelt het bestand, niet de stem van het toestel', played.length === 1 && played[0].includes('audio/nl/pim/' + H('de afspraak') + '.m4a') && !spoken.length);
  ctx.say('de afspraak. Ik heb een afspraak morgen.', true);
  ok('geluid: twee zinnen met elk een bestand spelen na elkaar, langzaam op 0,8', played.length === 2 && played[1].endsWith('@0.8'));
  vm.runInContext("AEL.listeners.ended()", ctx);
  ok('geluid: na het einde van de eerste zin volgt de tweede', played.length === 3 && played[2].includes(H('Ik heb een afspraak morgen.')));
  ctx.say('Een zin zonder bestand.');
  ok('geluid: geen bestand → de stem van het toestel, en de tekst op de lijst', spoken.includes('Een zin zonder bestand.') && S.audioMiss && S.audioMiss[0] === 'Een zin zonder bestand');
  ctx.say('Een zin zonder bestand.');
  ok('geluid: dezelfde tekst niet twee keer op de lijst', S.audioMiss.length === 1);
  ctx.say('the appointment', false, 'en');
  ok('geluid: Engels gaat via de stem van het toestel en niet op de lijst', S.audioMiss.length === 1);
  vm.runInContext("AEL.listeners.error()", ctx);
  ok('geluid: een bestand dat niet laadt (offline) valt terug op de stem van het toestel', spoken.length >= 2);
  const before = spoken.length;
  ctx.say('de afspraak. Ik heb een afspraak morgen.'); vm.runInContext("AEL.listeners.error()", ctx);
  ok('geluid: bij een fout leest het toestel de rest van de tekst, niet alleen de eerste zin (review geluid K1)', spoken[spoken.length - 1] === 'de afspraak. Ik heb een afspraak morgen.');
  const b2 = spoken.length; ctx.say('de afspraak'); vm.runInContext("audioStop(); AEL.listeners.error()", ctx);
  ok('geluid: na stoppen leest een late fout niets meer voor (review geluid K2)', spoken.length === b2);
  vm.runInContext("S.audioMiss=[]", ctx); const long = 'x'.repeat(250); ctx.say(long); ctx.say(long);
  ok('geluid: een lange tekst komt één keer op de lijst (review geluid K4)', S.audioMiss.length === 1);
}
console.log(fails ? fails + ' FOUT' : 'alles OK');
