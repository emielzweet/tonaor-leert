# Ontwerp stap 2b: de motor langs het didactisch plan

Stand: 14 november 2026. Hoort bij `docs/masterplan.md` (stap 2b) en `docs/didactisch-plan.md` hoofdstuk 5 (M1 tot M12).

## De code naast M1 tot M12

| # | Eis | Wat er is (functie in `index.html`) | Wat ontbreekt |
|---|---|---|---|
| M1 | stand per onderdeel: sterkte, laatste poging, volgende beurt, vormen | `S.items[id]` met `s`, `t`, `due`, `reps`, `lapses`, `forms`, `exs`; `review()` | niets |
| M2 | gespreid ophalen, groei alleen na een echte wachttijd | `review()`: groei vanaf `MOTOR.growFrom`, factor `1 + MOTOR.growGain × deel` | niets; de waarden zijn aannames (M12 toetst ze) |
| M3 | ophalen in een nieuwe vorm en situatie; nooit twee keer achter elkaar dezelfde vorm | `pickForm` (de vorm die nog ontbreekt), `chooseEx` (niet recent), `breakTriples`, `retryLater` (andere vorm), open plekken in scènes | dezelfde vorm over dagen heen (H2: 129 keer in de nagebootste week); `pickForm` kijkt naar welke vormen gelukt zijn, niet naar de vorige keer |
| M4 | 80 tot 90 procent goed, hulp afbouwen | `adapt()` binnen een ronde, `feel()` na de ronde, afbouw `fade` 1-2-3, grote sprong (`probeDone`, instap in een scène), hint in twee stappen | sturen per scène op het aandeel goed; afbouw per regel over sessies heen (zie M5) |
| M5 | per regel de trede (kiezen, afmaken, zelf maken) en per fout het soort | soort fout: `S.errs` (`errNote`, `errTop`) | de trede per regel: **nieuw**, zie hieronder |
| M6 | taaltijd over de vier strengen, melden als er een achterblijft | de klok telt leertijd per dag (`S.mins`) | **nieuw**, zie hieronder |
| M7 | tijd over de vakken volgens de fase | weekdoel en de Engelse les op vaste dagen; rekenen als scène en in de les | een verdeling 60/30/10 met meten en bijsturen; hoort bij de route (stap 5) |
| M8 | teksten op het aandeel bekende woorden kiezen; leestijd tellen | leestijd telt mee in de klok | het aandeel bekende woorden per tekst en de keuze daarop: **nieuw**, komt met de bibliotheek (stap 11) |
| M9 | beheerst pas na ophalen in meerdere vormen over tijd; een toets verandert het vervolg | `canBloom` (drie vormen, drie oefeningen) en de wachttijd boven `MOTOR.bloomDays`; `S.world.ok` na de controle | de toets per thema en de voortgangstoets die het vervolg veranderen (stap 8) |
| M10 | beheersing per eindterm, voor de route en de examendatum | `goals` bij hoofdstuk en scène (formaat en controle) | **nieuw**, zie hieronder; wacht op `docs/eindtermen.md` (stap 3b) |
| M11 | bij elk antwoord de reden; bij een herhaalde fout uitleg en extra | `why` bij elke keuze, `fb.ok`/`fb.no`, uitleg na twee fouten (`explFor`), stap `extra` na de tweede fout van dezelfde soort | uitleg ook bij een herhaalde fout over sessies heen (het foutprofiel stuurt nu alleen de open plekken) |
| M12 | per onderdeel de reeks pogingen met tijd, vorm en uitkomst | `S.log`: tijd, onderdeel, goed of fout, oefening; hooguit 600 regels voor alles samen | de vorm per poging en een eigen reeks per onderdeel: **nieuw**, zie hieronder |

Alle waarden van de motor staan sinds deze stap in `MOTOR` (bovenaan het lesblok in `index.html`), elk met de paragraaf uit het didactisch plan of het woord "aanname". `tools/test-herhaal.mjs` bewaakt dat er geen losse waarden terugkomen.

## Nieuw te bouwen

### M12: de reeks pogingen per onderdeel

- Per onderdeel een korte reeks in `S.items[id].h`: de laatste `MOTOR.histMax` pogingen (voorstel 24), elk als `[minuten sinds 1 januari 2026, vorm, uitkomst]` met vorm als korte code en uitkomst `1` (goed), `2` (goed na een poging of hint), `0` (fout). Zo'n poging kost ongeveer 15 tekens; bij 3.000 onderdelen met elk 24 pogingen is dat ruim 1 MB. **Te groot** voor `localStorage` (vaak 5 MB voor alles, en de reservekopie verdubbelt het). Daarom: 24 pogingen alleen voor onderdelen die nog niet in volle bloei zijn; in volle bloei de laatste 6. Schatting na drie jaar: ongeveer 300 kB.
- `review()` schrijft de poging; niets anders verandert. Migratie 6 → 7 maakt de reeks leeg aan (geen terugrekenen uit `S.log`: dat mist de vorm).
- Het exportbestand (Ik → Voortgang bewaren) bevat de reeksen; een script in `tools/` legt per kwartaal de voorspelde wachttijd naast wat de leerder werkelijk nog wist (didactisch plan hoofdstuk 6).

### M5: de trede per regel

- Elke oefenvorm hoort bij een trede: **kiezen** (`gap`, `choose`, `hear`, `listen` met kiezen, keuzes in een gesprek), **afmaken** (`build`, `complete`, `type`, `hear-type`, `make` met een kader met `___`), **zelf maken** (`make` zonder kader, `own`, `speak`).
- Per regel (`kind: "rule"`) in `S.items[id].tier`: de hoogste trede die beheerst is. Beheerst = drie keer goed bij de eerste poging op die trede, op minstens twee verschillende dagen (M9: over tijd). Waarden in `MOTOR` (aanname).
- De samensteller (`chooseEx`) kiest voor een regel een oefening op de trede erboven zolang die er is; bij twee fouten van dezelfde soort op een regel zakt hij één trede (M4 hulp terug, M11).
- `canBloom` voor een regel vraagt dan trede 2 (afmaken) in plaats van "minstens één keer zin bouwen"; zelf maken telt voor de toets per thema (stap 8).

### M6: de vier strengen

- Elke werkvorm hoort bij een streng (didactisch plan hoofdstuk 2): **input** (lezen, luisteren, een gesprek volgen, algemene ontwikkeling), **output** (een gesprek met keuzes, `make`, `speak`, de gesprekskaart, het dagboek), **taal** (kijken, ophalen, `rule`, `extra`, uitleg), **vloeiendheid** (spel, de zwaardere vorm, de snelronde, opnieuw lezen).
- De klok die nu actieve leertijd telt (`S.mins`), telt ook per streng (`S.strand[dag] = {in, out, taal, vl}`, in minuten), toegerekend aan het scherm dat open staat.
- Over de laatste zeven dagen: is een streng minder dan de helft van zijn richtdeel (een kwart, dus onder 12,5 procent), dan meldt de app dat op Vandaag ("Deze week weinig zelf zeggen: kies een gesprek of schrijf een bericht") en weegt de keuze van de volgende scène of activiteit mee. De begeleider ziet de verdeling (stap 9). Drempel: aanname in `MOTOR`.

### M10: beheersing per eindterm

- Wacht op `docs/eindtermen.md`. Dan: per eindterm de onderdelen en vragen die ernaar verwijzen (`goals` bij hoofdstuk en scène; later ook bij toetsvragen).
- Beheersing per eindterm = het deel van die onderdelen dat beheerst is (M9), en de uitslag van de toetsvragen voor die eindterm (stap 8), samen in één getal per eindterm. De route (stap 5) rekent met de eindtermen die nog openstaan en het tempo van de laatste weken; zo hangt de examendatum aan beheersing, niet alleen aan uren (masterplan G3).

## Rekenen: R-M1 tot R-M8

Uit `docs/onderbouwing-rekenen.md` hoofdstuk 3, aanvullend op M1 tot M12. Stand in de code:

| # | Eis | Wat er is | Wat ontbreekt |
|---|---|---|---|
| R-M1 | per rekenvaardigheid de laag (situatie, model, tabel, som), op en terug | rekenvaardigheden als onderdeel (`kind: "skill"`), afbouw `fade` 1-2-3 bij korting | de laag per vaardigheid; hoort bij M5 (trede): voor een vaardigheid zijn de treden situatie, model, tabel, som |
| R-M2 | hulp afbouwen van voorbeeld naar zelf | `fade` 1-2-3 in `chooseEx` (alleen korting) | voor alle rekenonderwerpen; komt met de lesstof via de redactielijn |
| R-M3 | soorten sommen mengen zodra aangeleerd; nooit twee sommen met dezelfde aanpak achter elkaar | sommen met wisselende getallen (`GEN`), dezelfde vorm hooguit twee keer achter elkaar | "dezelfde aanpak" kennen: een veld `approach` per oefening, en de samensteller die daarop mengt |
| R-M4 | drie soorten fouten: vraag gelezen, model gekozen, rekenen | foutsoorten `lezen`, `rekenstap`, `getal` | een eigen soort voor het model (voorstel `model`, toe te voegen aan de lijst in `docs/scenes.md`) en per soort een eigen reactie: taal (lezen), voorbeeld (model), extra som (rekenen) |
| R-M5 | de taal van een opgave onder het taalniveau | de poort controleert de zinslengte niet | een controle in de poort op zinslengte en aantal woorden per opgave |
| R-M6 | uitkomst en stappen beoordelen, niet de methode; marge bij "ongeveer" | `accept` (andere schrijfwijzen); `number` met exacte vergelijking | een marge (`tol`) bij `number`; tussenstappen als eigen vraag (rekenen in stappen) |
| R-M7 | meten per domein en niveau van de officiële eisen | de codes per domein en niveau in `docs/eindtermen.md` | hoort bij M10 |
| R-M8 | de begeleider ziet welk onderwerp blijft hangen, met een gesprekskaart | het foutprofiel (`S.errs`) | het scherm van de begeleider (masterplan stap 9), met een wekelijkse gesprekskaart op basis van het foutprofiel |

Vragen aan de ontwerpsessie: mag de soort fout `model` erbij (R-M4), en wordt `tol` (marge) een veld van een `number`-vraag (R-M6)?

## Nederlands: N-M1 tot N-M9

Uit `docs/onderbouwing-nederlands.md` hoofdstuk 3, aanvullend op M1 tot M12. Stand in de code:

| # | Eis | Wat er is | Wat ontbreekt |
|---|---|---|---|
| N-M1 | aantikken in een tekst: eerst kiezen uit drie betekenissen, juiste keuze = ontmoeting | aantikken in een tekening toont en leest voor (`sc_look`, `introduce`) | het kiezen in een tekst of gesprek (`docs/scenes.md`, "Een woord aantikken is een keuze"): een tikbaar woord in `read` en `talk`, drie betekenissen, `review` met de vorm `tik` |
| N-M2 | zelf maken en afwegen zwaarder dan kiezen | bloei vraagt drie vormen waarvan één productief (typen, zin bouwen) | een gewicht per vorm in `MOTOR` (bijvoorbeeld kiezen 1, typen 1,5, zelf maken 2) dat de groei van de wachttijd bepaalt; aanname |
| N-M3 | een regel in de eerste weken een korte tussentijd (twee tot vier dagen), daarna oplopend | dezelfde groei als bij woorden | `MOTOR.ruleEarlyDays` en `MOTOR.ruleEarlyMax` (aanname): voor een regel jonger dan een paar weken blijft de wachttijd tussen 2 en 4 dagen |
| N-M4 | een regel pas beheerst na een eigen zin | `canBloom` voor een regel: drie oefeningen en minstens één keer zin bouwen | trede 3 (M5): een eigen zin (`make` zonder kader, `own`, spreken) goed |
| N-M5 | bij een fout eerst een tweede poging met een aanwijzing | keuzes: opnieuw kiezen met de reden; typen: een tweede poging, hint in twee stappen | bij een gesprek en een tekstvraag de aanwijzing vóór de tweede poging, niet het antwoord |
| N-M6 | elke dag lees- en luistertijd, apart geteld | de klok telt leertijd | hoort bij M6 (strengen): input apart tellen en elke dag inplannen |
| N-M7 | tijd meten bij spreken en tempospellen, zonder straf, als eigen record | snelronde en spel met record; zwaardere vorm met record | de tijd bij `speak` (20 en 30 seconden zichtbaar, geen straf) |
| N-M8 | per examenonderdeel de stand en een verwachte datum | – | hoort bij M10 en de route (stap 5): vier data, de eerstvolgende op het thuisscherm |
| N-M9 | melden bij vier weken leertijd zonder vooruitgang op de toetsen | – | hoort bij de toets per vier weken (stap 8) en het scherm van de begeleider (stap 9) |

## Engels: E-M1 tot E-M6

Uit `docs/onderbouwing-engels.md` hoofdstuk 3. Stand in de code:

| # | Eis | Wat er is | Wat ontbreekt |
|---|---|---|---|
| E-M1 | Engels en Nederlands gescheiden: geen gemengde reeks; het Engelse en Nederlandse woord voor hetzelfde niet in dezelfde week als nieuw | de Engelse les is een eigen ronde op vaste dagen (`startEnglish`) | de regel "niet in dezelfde week als nieuw": per Engels woord het Nederlandse doel (`tr.nl`) kennen en het nieuwe Engelse woord uitstellen tot het Nederlandse een week oud is |
| E-M2 | betekenis via de steuntaal, met het verwante Nederlandse woord en een waarschuwing bij een valse vriend | betekenis in de steuntaal (`L_`) | de velden `nlLike` en `falseFriend` (voorstel in `docs/pakketformaat.md`), tonen bij de leerkaart en bij een fout |
| E-M3 | de vooruitgang in het Nederlands naast het aandeel Engels, en het aandeel bijstellen | Engels op vaste dagen | een aandeel in `MOTOR` (een tiende tot Nederlands op B1; aanname uit de onderbouwing) en bijstellen op de vierwekelijkse toets Nederlands (stap 8) |
| E-M4 | luisteren afbouwen: meelezen, alleen luisteren, examenvorm | luisteroefeningen met en zonder tekst | de afbouw per luistertekst; de examenvorm Engels (opnieuw afspelen mag, vragen in het Engels) bij `"exam": true` |
| E-M5 | Engelse teksten op het aandeel bekende woorden, oplopend naar 800 tot 1.200 woorden | – | hoort bij M8 en de bibliotheek (stap 11) |
| E-M6 | voortgang tegen de woordenlijsten (ongeveer 1.600 en 3.000) | – | het aantal beheerste Engelse woorden naast de maat, in de dekkingstabel |

## Motivatie: MO-M1 tot MO-M6

Uit `docs/onderbouwing-motivatie-en-kennis.md` hoofdstuk 3. Stand in de code:

| # | Eis | Wat er is | Wat ontbreekt |
|---|---|---|---|
| MO-M1 | voortgang concreet tonen en delen met de begeleider | weekring met het weekdoel, de tuin, het bericht aan de begeleider (`week.goal`) | voortgang per hoofdstuk en examenonderdeel; hoort bij de kaart en de route (stap 5) en het scherm van de begeleider (stap 9) |
| MO-M2 | punten alleen achteraf, nooit een voorwaarde voor inhoud of een functie | punten na een antwoord (`score`, `addPts`) | nagaan dat geen inhoud of functie aan een puntenaantal hangt (de codereview neemt dit mee); punten nooit vooraf beloven in een tekst |
| MO-M3 | na een scène twee tot vier wegen; op Ontdek een handvol vragen | na een scène: volgende scène, zwaarder, verder leren, Vandaag | het aantal wegen begrenzen op vier; Ontdek hoort bij stap 11 |
| MO-M4 | gedrag meten (doorgaan na een scène, terugkomen op een dag, minuten per week) naast de tikken | minuten per dag (`S.mins`), rondes per dag, de tikken na een ronde (`S.conf`) | doorgaan na een scène en terugkomen per dag vastleggen en naast de tikken leggen (proefweek, stap 4) |
| MO-M5 | weekdoel herstelbaar, geen reeks die breekt | weekdoel met inhalen binnen de week; geen reeks | niets |
| MO-M6 | in de eerste twaalf weken na twee keer "saai" of "te moeilijk" op hetzelfde soort onderdeel meteen bijsturen en de begeleider melden | `feel()` stuurt de volgende ronde op "te moeilijk"/"te makkelijk"; "saai" wordt bewaard | per soort onderdeel tellen; na twee keer meteen minder van die soort (H5) en een regel voor de begeleider |

## Wat kan breken

- M12 en M5 veranderen de opslag: migratie 6 → 7 met reservekopie, alleen toevoegen. De omvang van de opslag wordt bewaakt in `test-migratie` (een nagebootste opslag van drie jaar moet onder 1 MB blijven).
- M5 verandert welke oefening een regel krijgt: de les van `test-les` verandert, dus opnieuw vastleggen met uitleg in de commit.
- M6 voegt een melding toe op Vandaag; geen gedrag dat iets afpakt (D2).

## Vragen aan de ontwerpsessie

1. M12: is 24 pogingen per onderdeel (6 in volle bloei) genoeg om de aannames te toetsen?
2. M5: telt `type` (een woord typen) als afmaken, of alleen `complete` en `build`?
3. M6: is "minder dan de helft van het richtdeel over zeven dagen" de juiste drempel om te melden?
