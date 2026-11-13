// Weekdoel (7 uur per week): opslag, telling, bericht naar de begeleider, geen dagdoel in punten meer.
import { html } from './app-harness.mjs';
let fails = 0; const ok = (n, v) => { if (!v) fails++; console.log((v ? 'OK  ' : 'FOUT') + ' ' + n); };
ok('opslag: weekGoal 420, rounds en weekSeen in fresh()', /weekGoal:420,rounds:\{\},weekSeen:\{\}/.test(html));
ok('keuze op Ik: 3,5, 5, 7 of 10 uur', html.includes('const WEEKGOALS=[210,300,420,600]') && html.includes('data-wg='));
ok('onbekend weekdoel valt terug op 7 uur', html.includes('WEEKGOALS.includes(S.weekGoal)?S.weekGoal:420'));
ok('de klok telt alleen actieve tijd (2 minuten) bij een zichtbaar scherm', /now\(\)-lastAct>12e4/.test(html) && html.includes("document.visibilityState!=='visible'") && html.includes("STORE!=='ok'"));
ok('geen dubbele telling: finishTime telt geen minuten meer', /function finishTime\(\)\{save\(\);syncUp\(true\)\}/.test(html) && !html.includes('addLearnMs'));
ok('bericht naar de begeleider krijgt week.goal (alleen toegevoegd)', /week:\{days,mins:[^}]*goal:weekGoal\(\)\}/.test(html));
ok('dagdoel in punten is weg', !html.includes('GOALS[') && !html.includes('data-goal'));
ok('na een les en de activiteiten: doorgaan met drie keuzes', (html.match(/vContinue\(\)/g) || []).length >= 5 && html.includes('${contHtml()}') && html.includes("id=\"c-rev\"") && html.includes("id=\"c-expl\"") && html.includes("id=\"c-play\""));
ok('bonus voor de tweede en derde ronde', html.includes('bonus=rn===2?10:rn===3?20:0'));
console.log(fails ? fails + ' FOUT' : 'alles OK');
