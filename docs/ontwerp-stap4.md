# Bouwontwerp werkorder stap 4: de route met tijd

Stand: 15 november 2026. Bouwsessie. Werkt `route-en-prognose.md` uit (akkoord van de eigenaar op de vier besluiten: tempo over vier weken, tijd buiten de app met een eigen knop van hooguit 60 minuten per dag, op het thuisscherm één maand met de bandbreedte, acht weken marge). Dient E5, M10 (deels) en N-M8 (deels).

## Wat de leerder ziet

- **Vandaag:** één regel met de eerstvolgende poort en de verwachte maand, met de bandbreedte eronder. Een tik opent Route.
- **Route:** per baan (Nederlands, rekenen, Engels) de blokken met de duur in het eigen tempo, de begin- en eindmaand en hoe ver je bent. Poorten als vlag. Daaronder:
  - twee tempo's naast elkaar: *jouw tempo van de laatste vier weken* en *als je je weekdoel haalt*;
  - *Wat als*: een schuif met uren per week, waarmee de datum meebeweegt;
  - *Tijd buiten de app*: lezen, kijken en luisteren, les, gesprek; 15, 30 of 60 minuten, hooguit 60 per dag;
  - één keer per maand de zin *waarom de datum verschoof*.

## Generiek

De route staat niet in de code maar in een pakket `content/route-nt2.json` (type `route`): banen met blokken (`id`, `vak`, `naam`, `kan`, `lo`, `hi`) en poorten (`id`, `naam`, `na` = het blok waarna de poort komt, `marge` in weken). `pakketcheck` controleert het (`checkRoute`). De uren komen uit de tabel in `route-en-prognose.md` (bron: `leerroute.md`; schatting).

## Rekenen

- **Tijd per vak:** de klok telt voortaan ook per vak (`app.dataset.vak`; een losse les en buiten een vraag tellen als Nederlands). Dagen van vóór deze stand worden verdeeld als 60/30/10 (`route-en-prognose.md`).
- **Tempo per vak:** het gemiddelde over de laatste vier weken. In de eerste twee weken na de eerste leertijd telt het weekdoel × het aandeel van het vak.
- **Gedaan per baan:** alle uren in dat vak (in de app en daarbuiten). Hoe ver je bent in een blok volgt uit de som van de blokken ervoor.
- **De datum** van een poort is vandaag plus het aantal weken dat je nog nodig hebt plus de marge. Het aantal weken is (de uren tot en met het blok vóór de poort min wat gedaan is) gedeeld door de uren per week. Verwacht = het midden van lo en hi, vroegst = lo, laatst = hi.
- **Rust:** de datum op Vandaag wordt één keer per week vastgelegd (`S.prog`) en per maand getoond. De zin *waarom* vergelijkt met de vastgelegde datum van vier weken eerder.
- **Bijstellen na een blok:** de nieuwe schatting is het gemiddelde van de oude en wat het blok werkelijk kostte (aanname, ontwerp). Dit is gebouwd en getest, maar gaat pas werken als een blok als af gemarkeerd wordt. Dat komt met de toetsen (stap 10).
- **Tempo 0** (geen leertijd en geen weekdoel): geen datum, maar *nog geen tempo*.

## Opslag

SCHEMA 6 → 7, alleen toevoegend en idempotent, met eerst een reservekopie (zoals elke migratie). De velden zijn leeg bij de start:

- `S.minsV` = per dag `{nl, rk, en}`;
- `S.outside` = per dag het aantal minuten buiten de app;
- `S.prog` = per week de vastgelegde datum per poort;
- `S.blockAdj` = de bijstelling per baan (een factor per vak). Dit wordt vastgelegd in stap 10: de factor mag dan alleen gelden voor de blokken ná het afgeronde blok, en `adjusted()` wordt aangeroepen bij het afronden van een blok. Dat volgt uit de codereview van de route, punt 9.

`S.mins` blijft zoals het is: het weekdoel en de begeleider lezen dat. Het protocol met de begeleider verandert niet.

## Wat kan breken

- **Voortgang:** niets wordt weggehaald; `test-migratie` krijgt een stap 6 → 7.
- **De EDGE:** onveranderd.
- **De les van `test-les`:** onveranderd, want de samensteller wordt niet geraakt.
- **De oude routekaart met vaste teksten in de code** wordt vervangen. Daarmee verdwijnt de laatste losse Thai uit `vRoute`.

## Besluiten van de ontwerpsessie (15 november 2026)

1. **N-M8:** tot stap 10 één datum voor programma I, met bandbreedte en "eerder of later dan vorige maand", de vier onderdelen eronder en de zin dat een datum per onderdeel volgt na de eerste toets. Zo gebouwd.
2. **Startpunt:** geen omrekening met een verzonnen factor, maar ook niet nul. Het startpunt is het begin van het eerste blok dat nog niet af is, plus de leertijd die al in de app staat. In de route staat dat het startpunt geschat is en nauwkeuriger wordt na de startmeting. De bovenkant van de bandbreedte gebruikt de hoge schatting van het blok. De test controleert dat een lege geschiedenis en tien uur leertijd verschillende data geven.
