// N-M1 (onderbouwing-nederlands.md 2.1, scenes.md "Een woord aantikken is een keuze"): een woord in een tekst of gesprek aantikken is een keuze.
// De logica draait in de app tegen echte pakketten; deze test controleert de regels die vastliggen en draait de woordenlijst en de afleiders na.
import { readFileSync, readdirSync } from 'node:fs';
const html = readFileSync(new URL('../index.html', import.meta.url), 'utf8');
let fout = 0;
const ok = (c, m) => { if (!c) { fout++; console.log('FOUT: ' + m); } };
const cut = (a, b) => { const i = html.indexOf(a); return html.slice(i, html.indexOf(b, i)); };

/* 1. aangesloten op lezen (ook een leesvraag via ask) en gesprek, met de items van de vraag uitgesloten */
ok(/if\(st\.type==='read'\)tikify\(app\.querySelector\('\.card'\),q\)/.test(html) && /const sc=q\.sc,skip=q\.items/.test(html), 'tikify bij een leestekst, zonder de woorden van de vraag');
ok(/if\(q\.ctx==='read'&&q\.sc&&!nos\)tikify\(app\.querySelector\('\.card'\),q\)/.test(html), 'tikify bij een leesvraag via ask, niet zonder steuntaal');
ok(/say\(scP\(tu\.them\)\),300\);tikify\(app\.querySelector\('\.card'\),q\)/.test(html), 'tikify bij een gesprek');
ok(/function tikNoSup\(q\)\{return !!\(q\.hard\|\|\(q\.sc&&q\.sc\.nosup\)\|\|/.test(html) && /nlOnly\(\)\|\|tikNoSup\(q\)/.test(html), 'niet waar de steuntaal bewust uit staat (moeilijk, nosup, instap, controle)');
ok(!/H\.sc_look=[^\n]*tikify/.test(html), 'in een tekening blijft aantikken tonen en voorlezen (geen keuze)');

ok(html.includes("if(S.thai==='altijd'){panel.innerHTML=") && /S\.thai==='altijd'[^\n]*say\([^\n]*return\}/.test(html), 'steuntaal altijd aan: meteen de betekenis, geen keuze en geen ontmoeting');
{ const rk = JSON.parse(readFileSync(new URL('../content/rk-1.json', import.meta.url), 'utf8')), M = { 'r-geld': 'money', 'r-komma': 'decimal', 'r-10': 'percent-tenth', 'r-25': 'percent-fraction' };
  ok(rk.exercises.every(e => !M[e.items[0]] || e.approach === M[e.items[0]]), 'rk-1: elke som heeft de aanpak van de ontwerpsessie (R-M3)'); }

/* 2. regels: geen steuntaal = geen keuze; een juiste keuze is een ontmoeting (passief, vorm tik); tik telt niet voor bloei; in een les en buiten ok niets */
const tk = cut('function tikify(', 'H.sc_look=');
ok(/if\(!root\|\|!q\|\|nlOnly\(\)\|\|tikNoSup\(q\)\)return/.test(tk), 'zonder steuntaal (examenvorm) niets aan te tikken');
ok(/S\.items\[x\.id\]\.reps>0\)review\(x\.id,true,'tik',null,true\)/.test(tk) && !/S\.introduced\.push/.test(tk), 'juiste keuze: alleen een ontmoeting voor een woord in de herhaling; een nieuw woord wordt niet verweesd');
ok(/done\.has\(x\.id\)/.test(tk) && /first=false;done\.add\(x\.id\)/.test(tk), 'hooguit één ontmoeting per woord per scherm; fout gekozen telt daarna niet meer');
ok(/if\(first&&!done\.has\(x\.id\)&&STORE==='ok'&&!\(typeof LES!=='undefined'&&LES\)/.test(tk), 'alleen bij de eerste keuze, alleen in ok, niet in een losse les');
ok(!/const NOGROW=\[[^\]]*'tik'/.test(html), 'een passieve ontmoeting slaat geen vorm op (tik hoeft niet in NOGROW)');
ok(/esc\(o\.tr\[L\]\)/.test(tk) && /esc\(x\.def\)/.test(tk) && /b\.textContent=m\[0\]/.test(tk), 'tekst uit het pakket via esc of textContent');
ok(!/innerHTML=[^;]*\$\{x\.w\}/.test(tk), 'het woord zelf nooit rauw in de HTML');

/* 3. de woorden en afleiders in de echte hoofdstukken: genoeg om drie verschillende betekenissen te tonen */
const packs = readdirSync(new URL('../content/', import.meta.url)).filter(f => f.endsWith('.json') && f !== 'index.json').map(f => JSON.parse(readFileSync(new URL('../content/' + f, import.meta.url), 'utf8')));
for (const p of packs.filter(p => p.type === 'hoofdstuk')) {
  for (const L of ['th', 'en']) {
    const ws = (p.items || []).filter(x => (x.kind === 'word' || x.kind === 'phrase') && typeof x.w === 'string' && !/\s/.test(x.w.trim()) && x.tr && x.tr[L]);
    const kinds = {}; ws.forEach(x => { kinds[x.kind] = kinds[x.kind] || new Set(); kinds[x.kind].add(x.tr[L]); });
    ok(ws.length >= 3 && Object.values(kinds).some(s => s.size >= 3), p.id + ' (' + L + '): genoeg woorden met een eigen vertaling voor drie keuzes');
  }
}

console.log(fout ? fout + ' FOUT(EN)' : 'test-tik: alles OK');
process.exit(fout ? 1 : 0);
