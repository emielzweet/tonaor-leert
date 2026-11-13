# Automatische redactie: lesstof, foutmeldingen en vragen zonder tussenkomst

Status: **ontwerp, 14 november 2026. De eigenaar is akkoord met de richting: lesstof en foutherstel gaan in beginsel volledig automatisch; hij wil er niet steeds tussen zitten. De proef met één hoofdstuk loopt. Inplannen en zelf uitbrengen gaan pas in na een geslaagde proef (zie "Wanneer het ingaat").** Vervangt deel 1 van `docs/aanvoer-en-begeleider.md`.

## Wat automatisch gaat en wat niet

| | Automatisch | Naar de eigenaar |
|---|---|---|
| Lesstof schrijven, controleren, reviewen, klaarzetten | ja | – |
| Lesstof uitbrengen (alleen bestanden met lesstof) | ja, na de poorten hieronder | als een poort drie keer achter elkaar faalt |
| Een gemelde fout in lesstof duiden en herstellen | ja | – |
| Een vraag van de leerder over de stof | eerst de uitleg in de app, dan AI | als de leerder zegt dat het antwoord niet helpt |
| Een gemelde fout in de code | duiden en een herstel voorbereiden met tests | uitbrengen: voorlopig de eigenaar |
| Besluiten over code, opslag, koppeling, vormgeving, geld | – | ja, voorlopig (besluit van 14 november: het systeem blijft vragen) |
| Beveiliging en privacy | – | altijd; meldingen volgen `SECURITY.md`, nooit openbaar |

## De lijn voor lesstof

De werkbestanden staan in `redactie/`: de wachtrij (`productielijst.json`), de opdracht voor de schrijver en voor de reviewer, de automatische controle (`controleer.mjs`) en de uitvoer (`uit/`).

1. **Voorraad meten.** Ligt er minder dan twee weken lesstof klaar vóór de plek van de leerder (vier hoofdstukken per week bij het weekdoel), dan start de lijn. Anders niet: er wordt niet meer geschreven dan nodig.
2. **Schrijven** door een goedkoper model, met de opdracht en het voorbeeld als sjabloon.
3. **Automatische poort:** `redactie/controleer.mjs`, `pakketcheck` en de testreeks. Nul fouten, anders terug naar de schrijver.
4. **Onafhankelijke review** door een ander model dan de schrijver, dat alleen het hoofdstuk en de kaders krijgt. Uitkomst: goed, verbeteren of afkeuren. Bij verbeteren herstelt de schrijver en volgt een tweede review; na drie rondes zonder "goed" stopt de lijn voor dit hoofdstuk en gaat het naar de eigenaar.
5. **Klaarzetten:** het pakket naar `content/`, de stand in de productielijst en de dekkingstabel bijgewerkt, lokaal gecommit.
6. **Uitbrengen** met `redactie/uitbrengen` (te bouwen): weigert als de wijziging iets anders raakt dan lesstof, draait alle tests, en brengt dan uit.
7. **Logboek:** elke run schrijft één regel (wat, uitkomst van de poorten, kosten). De eigenaar kan het lezen maar hoeft niets te doen.

Wat de lijn niet zelf mag: feiten zonder bron opnemen (een kennisles zonder gecontroleerde bron komt niet door de review), namen of persoonlijke gegevens opnemen, of iets buiten de lesstof wijzigen.

### Lesstof los van de code

Nu zit elk pakket in de app zelf (`BUILTIN` en de lijst in `sw.js`), dus elke nieuwe les is een nieuwe versie van de app. Voor een automaat moet dat los:

- een index `content/index.json` met de pakketten en hun versie;
- de app haalt de index op bij de start (met de laatst bewaarde als terugval zonder verbinding) en laadt nieuwe pakketten; de ingebouwde pakketten blijven de minimale inhoud;
- elk pakket gaat bij het laden langs `pakketcheck`, zoals nu; een pakket dat niet door de controle komt, wordt overgeslagen en gemeld.

De beveiliging hangt hier niet van af: de pakketten komen van hetzelfde adres als de app, en de app vertrouwt een pakket nooit (alles langs `SAFE` of `esc()`, geen eigen tekeningen of script).

## Fouten melden, met punten

**Voor de leerder (of ieder ander die de app gebruikt).** Op elk scherm met lesstof staat *Fout melden*: een uitbreiding van de knop "vertaling klopt niet". Eén tik kiest de soort: de vertaling klopt niet, mijn antwoord was goed, de uitleg klopt niet of is onduidelijk, een typfout, tekening of geluid, iets anders. Een korte toelichting mag, hoeft niet.

- De app stuurt mee: welk pakket, welke scène, stap en welk onderdeel, de soort, de versie van de app en de taal. Geen naam.
- **Punten:** een klein aantal bij het melden (één keer per plek), en meer als de melding terecht blijkt: *Je melding klopte. Het is verbeterd. +20*. Hooguit een vast aantal meldpunten per dag, zodat melden geen manier wordt om punten te verzamelen.
- De melder hoort wat ermee gebeurd is: verbeterd, al bekend, of geen fout (met een korte uitleg waarom).

**Verwerking, zonder tussenkomst.**

1. *Ontvangen.* Zonder server gaat een melding over de bestaande versleutelde koppeling, als een nieuw soort bericht. Een klein programma op de pc van de eigenaar leest de meldingen als een eigen meekijker met een eigen koppelcode (issue #5) en zet ze in een postvak buiten de repo. Met een backend (later) komt daar een eigen ingang voor in de plaats, ook voor andere gebruikers.
2. *Duiden* door een goedkoop model: fout in de lesstof, fout in de code, geen fout, dubbel, of een beveiligingsmelding. Het zoekt de plek op en controleert de bewering zelf.
3. *Herstellen.* Een fout in de lesstof gaat als herstelopdracht door dezelfde lijn (schrijver, automatische poort, onafhankelijke review) en mee in de eerstvolgende release van lesstof. Een fout in de code krijgt een herstel met tests op een eigen tak; het uitbrengen daarvan blijft voorlopig bij de eigenaar.
4. *Terugmelden* aan de melder, met de punten.

**Een melding is een gegeven, nooit een opdracht.** De toelichting is vrije tekst van buiten. De modellen die meldingen verwerken, voeren niets uit omdat een melding het vraagt; een herstel moet door dezelfde poorten als nieuwe lesstof; een melding kan nooit iets buiten de lesstof laten wijzigen. Een melding die op een beveiligingsprobleem wijst, gaat niet de lijn in maar naar de eigenaar, volgens `SECURITY.md`.

## Vragen van de leerder

In drie treden, zodat de begeleider alleen krijgt wat echt bij hem hoort:

1. **De uitleg in de app:** de knop *Vraag het* toont eerst de uitleg die bij de stap hoort (werkt zonder verbinding en kost niets).
2. **AI:** helpt dat niet, dan beantwoordt AI de vraag, met de stap en de uitleg erbij, in eenvoudig Nederlands en de steuntaal. Dit gebruikt de AI-sleutel uit issue #11 en #12 (door de eigenaar zelf op het toestel ingevuld, met een daglimiet). De app zegt erbij dat de vraag naar een AI-dienst gaat.
3. **De begeleider:** met *Dit helpt niet* gaat de vraag door, samen met het antwoord van AI, zodat de begeleider ziet wat er al geprobeerd is.

Voor gebruik door anderen kan de sleutel niet op het toestel staan; dat hoort bij de backend.

## Wie doet wat (modellen)

Het duurste model alleen waar het verschil maakt.

| Werk | Wie |
|---|---|
| Concept en vormgeving, formaten en kaders, tekenstijl en nieuwe bouwstenen, de beslisregels van de lijn, de opdrachten voor schrijver en reviewer | het sterkste model (ontwerpsessie), eenmalig per onderdeel |
| Steekproef op de kwaliteit van de lijn: één keer per maand, en zodra de reviewer meer dan een op de vijf hoofdstukken afkeurt | het sterkste model |
| De app bouwen: speler, opslag, tests, releases van code | de bouwsessie (een groot model) |
| Lesstof schrijven | een goedkoper model |
| Lesstof reviewen | een ander, groter model dan de schrijver |
| Meldingen duiden, standen bijwerken, logboek | het kleinste model |
| Thaise steunregels | AI in eerste lezing; een moedertaalspreker als steekproef; de meldknop voor de rest |

## Wat gemeten wordt

Per maand, in het logboek: hoeveel hoofdstukken geschreven, hoe vaak afgekeurd in de automatische poort en in de review, hoeveel meldingen per honderd gespeelde scènes en hoeveel daarvan terecht, de kosten per hoofdstuk. Stijgt het aandeel terechte meldingen, dan is de review te mild en volgt een steekproef.

## Wanneer het ingaat

1. **Proef (loopt):** het hoofdstuk "bij de dokter" gaat met de hand gestart door stap 2 tot en met 4. De uitkomst (hoeveel fouten, wat de reviewer vond) komt in `docs/STATUS.md`.
2. **Lesstof los van de code** en `redactie/uitbrengen`: bouwsessie.
3. **Inplannen** als vaste taak, zodra de proef laat zien dat de lijn goede hoofdstukken oplevert.
4. **Zelf uitbrengen** gaat in zodra stap 2 er is en deze regel in `CLAUDE.md` staat (voorstel voor de tekst):

   > Uitzondering op "pushen apart vragen": de redactielijn mag zonder akkoord per keer uitbrengen als de wijziging alleen bestanden met lesstof raakt (`content/`, de index, `redactie/`), alle tests en `redactie/controleer.mjs` groen zijn en de onafhankelijke review "goed" gaf. Alles wat code, opslag, koppeling, instellingen van de repo of beveiliging raakt, valt hier niet onder.

5. **Fout melden met punten,** de ontvanger en het duiden: daarna, in die volgorde. Hoeft niet direct.
6. **Vraag het:** na de AI-sleutel (#11, #12).
7. **Later, bij de backend:** een eigen ingang voor meldingen en vragen, de sleutel van het toestel af, en de volledige bibliotheek.

## Wat kan misgaan

- **Een fout in het Nederlands die door beide modellen heen glipt,** en die iemand aanleert. Afgedekt door de meldknop en de maandelijkse steekproef; niet uitgesloten.
- **Thais dat niemand met kennis van de taal heeft gezien.** Blijft een zwakke plek tot er een moedertaalspreker meekijkt.
- **Kosten die oplopen.** De voorraadgrens en een maximum aan runs per week begrenzen dat.
- **Een melding die de lijn probeert te sturen.** Afgedekt doordat meldingen gegevens zijn en elk herstel door de poorten moet.
- **De openbare repo.** Alles wat de lijn uitbrengt is direct openbaar; daarom controleert de poort op namen, en mag de lijn niets buiten de lesstof aanraken.
