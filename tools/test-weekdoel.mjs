// Weekdoel (7 uur per week): opslag, telling, bericht naar de begeleider, geen dagdoel in punten meer.
import { html } from './app-harness.mjs';
let fails = 0; const ok = (n, v) => { if (!v) fails++; console.log((v ? 'OK  ' : 'FOUT') + ' ' + n); };
ok('opslag: weekGoal 600 (10 uur), weekGoalSet, rounds en weekSeen in fresh()', html.includes('weekGoal:600,weekGoalSet:false,rounds:{},weekSeen:{}'));
ok('keuze op Ik: 3,5, 5, 7 of 10 uur', html.includes('const WEEKGOALS=[210,300,420,600]') && html.includes('data-wg='));
ok('onbekend weekdoel valt terug op 10 uur', html.includes('WEEKGOALS.includes(S.weekGoal)?S.weekGoal:600'));
ok('migratie 2→3: 7 uur zonder eigen keuze wordt 10 uur, een eigen keuze blijft', html.includes('2:s=>{if(s.weekGoal===420&&!s.weekGoalSet)s.weekGoal=600;return s}') && html.includes('S.weekGoalSet=true'));
ok('merktekens op 3,5, 7 en 10 uur met een melding per merkteken', html.includes('const MILES=[210,420,600]') && html.includes("tx('week.mile'"));
ok('de klok telt alleen actieve tijd (2 minuten) bij een zichtbaar scherm', /now\(\)-lastAct>12e4/.test(html) && html.includes("document.visibilityState!=='visible'") && html.includes("STORE!=='ok'"));
ok('geen dubbele telling: finishTime telt geen minuten meer', /function finishTime\(\)\{save\(\);syncUp\(true\)\}/.test(html) && !html.includes('addLearnMs'));
ok('bericht naar de begeleider krijgt week.goal (alleen toegevoegd)', /week:\{days,mins:[^}]*goal:weekGoal\(\)\}/.test(html));
ok('dagdoel in punten is weg', !html.includes('GOALS[') && !html.includes('data-goal'));
ok('na een les en de activiteiten: doorgaan met drie keuzes', (html.match(/vContinue\(\)/g) || []).length >= 5 && html.includes('${contHtml()}') && html.includes("id=\"c-rev\"") && html.includes("id=\"c-expl\"") && html.includes("id=\"c-play\""));
ok('bonus voor de tweede en derde ronde', html.includes('bonus=rn===2?10:rn===3?20:0'));
ok('Vandaag: één weekkaart direct onder de begroeting, vóór de les', (()=>{const v=html.slice(html.indexOf('function vToday(){'));return v.indexOf('${weekCard()}')>0&&v.indexOf('${weekCard()}')<v.indexOf('class="card hero"')})() && !html.includes("T('week.points'"));
ok('weekkaart: resterende tijd in de ring en staafjes per dag', html.includes("esc(t('week.left'))") && html.includes('class="wbar'));
ok('opslag groeit niet: rounds en weekSeen tot acht weken', html.includes('function pruneWeeks(){const cut=monday()-8*7*DAY;'));
console.log(fails ? fails + ' FOUT' : 'alles OK');
