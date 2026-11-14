# Ontwerp stap 2: de scènespeler afmaken

Stand: 14 november 2026. Hoort bij `docs/masterplan.md`, stap 2 ("klaar als: de scènetest bewaakt A1 tot A7, B1, B3, C1, C2, E2, E3; migratie getest"). Formaat: `docs/scenes.md`.

## Al gebouwd (commit 54f4b11)

`quiz` (instap, ophalen, controle), `rule`, `extra`, vragen `choose`/`hear`/`type`/`number`, `do` met keuzes, `nosup`, bronnen, het foutprofiel (`S.errs`) en de open plek op het foutprofiel, beheerst (`S.world.ok`). Eisen: B3, E2 (extra bij een herhaalde fout), E3.

## Wat erbij komt

| Onderdeel | Hoe | Eis |
|---|---|---|
| Elke bestaande oefenvorm als vraag | een vraag met `form` `build`, `gap`, `listen`, `money`, `clock`, `discount` en `data` gaat langs `exQ`, dus langs hetzelfde scherm als in de les. Zin bouwen en luisteren krijgen hun gegevens direct uit de vraag (niet uit de lijst van de les). Een fout telt in het foutprofiel met de `err` van de vraag | C3 |
| Nieuwe vraagvormen | `hear-type` (horen en typen) en `complete` (zin afmaken, typen met `answer`) in hetzelfde scherm als `type` | C3, A7 |
| Nog niet in de app | `own`, `match`, `spot`, `dictee` met eigen tekst: de controle weigert ze in een scène met "nog niet in de app (stap 6)", zodat er nooit een vraag stil wegvalt | C3 |
| Hint in twee stappen | `hint`: twee Teksten. Knop "Hulpje": eerst de kleine, dan de grote aanwijzing. Goed na een hint telt als `'retry'`. In de controle geen hint | A6 |
| Spreken | stap `speak`: de situatie, het voorbeeld (voorlezen met de stem van het toestel), de checklist, en "zo heb ik het gezegd" of "nog niet helemaal". Opnemen en terugluisteren komt in stap 6 | C2, B2 |
| Spel | stap `game` met `kind`. Nu: `dehet` (de of het op tempo, 60 seconden), met de woorden van de scène en wat aan de beurt is; elk antwoord werkt het herhaalmodel bij met de vorm `spel`, die niet meetelt voor bloei (C5: vervangt productief oefenen niet). Andere spellen in stap 6 | C2, C5 |
| Zwaardere vorm | een scène die af is, kan opnieuw als "zwaarder": geen steuntaal, typen waar een vraag ook een `answer` heeft, en het aantal goed bij de eerste poging als eigen record (`S.world.best`) | B4 |
| Hoofdstukcontrole | `PakketCheck.checkChapter(pakket)`: per scène minstens zes werkvormen en nooit drie keer dezelfde achter elkaar; per hoofdstuk minstens twaalf werkvormen met lezen, luisteren, spreken, schrijven, rekenen in de situatie en een spel; een leestekst met vijf tot tien vragen; een luistertekst; een `speak` en een `game`; een hint bij elke typvraag buiten de controle; een `extra` per grammaticapunt; `goals` bij hoofdstuk en scène. De poort van de redactielijn gebruikt hem; de scènetest ook | A6, B1, B2, C1, C2, G2 |

## Werkvorm tellen

Een werkvorm is de `form` van een vraag of een `do`, of het soort stap (`look` = aantikken, `talk` = gesprek, `make` = schrijven, `speak` = spreken, `game` = spel). Een gesprek telt als één blok, ook met vier beurten. "Drie keer dezelfde achter elkaar" kijkt naar de rij vragen in de volgorde van de scène.

## Wat er voor de leerder verandert

Scènes kunnen alle bekende oefeningen bevatten, een hulpje in twee stappen, een spreekopdracht en een kort spel. Een gespeelde scène kan zwaarder opnieuw.

## Wat kan breken

- Opslag: `S.world.best` komt erbij in dezelfde migratie 5 → 6 (nog niet uitgebracht); niets wordt weggegooid.
- De les en `test-les`: niet geraakt; de nieuwe code zit alleen in de scènespeler.
- Lesstof die de app nu laadt blijft geldig; `checkChapter` is een aparte controle voor hoofdstukken, niet voor het laden.

## Vraag aan de ontwerpsessie (bij G1)

De telling van C1 en C2 hierboven is een interpretatie: een gesprek als één blok, en de rij vragen in scèneorde. Zo niet bedoeld, dan pas ik `checkChapter` aan.
