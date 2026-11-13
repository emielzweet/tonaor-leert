# Bouwplan: van één vaste les naar een app die meegroeit

Stand: 13 november 2026, na een ontwerpreview van de code (cache v2-12), de open issues en het didactisch ontwerp.
Dit plan is een voorstel. Elke fase begint pas na een besluit van de eigenaar (zie "Besluit nodig" per fase en de werkwijze in `CLAUDE.md`).

## Waarom dit plan

De review vond drie dingen die zwaarder wegen dan de losse issues:

1. **Niets kan in bloei komen.** `review()` houdt een onderdeel op 9 dagen vast zolang het in minder dan drie oefenvormen goed ging. Woorden hebben maar twee vormen (`herkennen`, `typen`), Engelse woorden één. Stadium 4 en 5 zijn dus onbereikbaar en alles komt eeuwig elke 9 dagen terug.
2. **De les is na ongeveer een week op.** `startLesson()` bouwt elke dag dezelfde rij: alleen de woorden wisselen. Grammaticakaart, zinnen, dictee, kloksom en kortingssommen staan vast in de code. Regels en zinnen hebben geen herhaalitem. De startmeting stuurt bijna niets. Bij veel fouten verschijnt alleen een melding.
3. **Voortgang kan in één keer weg zijn.** `if(!S||S.v!==2)S=fresh()` wist alles zodra het versienummer afwijkt. Een oude versie uit de offline-cache die een nieuwere opslag aantreft, doet dat ook. Er is geen reservekopie waaruit je kunt herstellen.

Daarnaast: spraak is nu alleen voorlezen door de stem van het toestel, opnemen staat uit, video is één externe link, en er is één animatie (infaden) plus de bloemblaadjes.

## Regels voor alle fasen

- **Eén schrijver tegelijk** in deze map. De ontwerpsessie schrijft specificaties en reviewt; de onderhoudssessie bouwt. Wie bouwt, staat per fase.
- **Geen gedragswijziging zonder dat het in de fase staat.** Fase 2 verandert bijvoorbeeld niets aan wat de leerder ziet.
- **Opslag:** sleutel `tonaor-leert-v2` en `S.v===2` blijven. Migraties lopen via een nieuw veld `S.schema` (zie fase 1). Bestaande item-id's blijven geldig.
- **Koppeling:** `app:'tonaor-leert'`, kanaal- en sleutelafleiding blijven gelijk. Nieuwe velden in het bericht alleen erbij, nooit hernoemen.
- **Privacy en generiek:** geen namen, plaatsen of persoonlijk traject in nieuwe code of inhoud. Persoonlijke inhoud leeft alleen op het toestel.
- **Elke fase eindigt met:** alle tests groen, `CACHE` in `sw.js` verhoogd, test op 375 px, en een controle op het echte toestel voor alles met geluid of opslag.

## Fase 1 — Voortgang beveiligen (eerst, klein)

Doel: geen enkele latere fase kan voortgang kosten.

- `S.schema` (getal, begint op 1 voor bestaande opslag zonder veld). Migraties zijn genummerde functies `1→2`, `2→3`, elk idempotent.
- Vóór een migratie: kopie van de ruwe opslag naar `tonaor-leert-v2.bak` (één generatie).
- Laden wordt voorzichtig: onleesbare of onbekende opslag **nooit** overschrijven. Toon een herstelscherm met "reservekopie terugzetten" en "bestand kiezen". Een hogere `S.schema` dan de app kent: alleen lezen en melden dat de app moet bijwerken, niets opslaan.
- Op Ik: "Voortgang bewaren" (bestand via de deelknop van het systeem) en "Voortgang terugzetten" (bestand kiezen, eerst valideren, huidige stand naar `.bak`).
- Test: `tools/test-migratie.mjs` met vastgelegde voorbeeldopslag (v2 zonder schema, met schema, kapot, van de toekomst).

Wie: onderhoudssessie. Review: ontwerpsessie. Besluit nodig: geen, behalve akkoord op de fase.

## Fase 2 — Inhoud uit de code, les uit gegevens (#26)

Doel: een thema toevoegen vraagt geen codewijziging. De leerder merkt van deze fase niets.

**Pakket** = één bestand `content/<id>.json` met:
- `meta`: id, leertaal, niveau, titel per taal, versie.
- `items`: alles wat herhaald wordt, met een `kind`: `word`, `rule`, `sound`, `skill`. Een item hoort bij de taal, niet bij een thema: het heeft één id dat over alle pakketten heen uniek is, en latere pakketten mogen ernaar verwijzen. De huidige id's (`werk`, `en-work`, `r-geld`) houden hun naam, dus de opgeslagen voortgang past zonder migratie. De volledige specificatie staat in `docs/pakketformaat.md`.
- `exercises`: oefeningen met een eigen id, een `form` (bestaande oefenvormen: `recog`, `recall`, `build`, `gap`, `listen`, `dictee`, `money`, `clock`, `discount`, …), de items die ze raken en de gegevens voor die vorm.
- `cards`: uitlegkaarten (nu de v2-kaart en de Engelse -s-kaart).
- `story`, `placement`, `route` (zie fase 5).
- Vertalingen naast het veld, zoals nu (`th`, `en`, `whyTh`, `'why@en'`).

**Lessamensteller** vervangt de vaste rij in `startLesson()` en `startEnglish()`: per stap (ophalen, nieuw, oefenen, rekenen, afsluiten) kiest hij uit het pakket. In deze fase met regels die exact de huidige les opleveren.

**Opslag:** items worden pas aangemaakt als ze voor het eerst aan bod komen. Items van een pakket dat niet geladen is, blijven bewaard.

**Offline:** pakketten staan in `SHELL` van `sw.js`. Laadt een pakket niet, dan meldt de app dat en start met wat er is.

**Kwaliteitskader:** het formaat krijgt velden voor alle labels uit `docs/kwaliteitskader.md` (vaardigheid, receptief of productief, gesloten of open, trede, alinea bij een tekstvraag, soort en lengte van een tekst). Zo kan de test de kwaliteitseisen controleren.

**Tests:** `tools/test-pakket.mjs` controleert het schema: unieke id's, bestaande verwijzingen, elke vertaling aanwezig, elke oefening een geldig antwoord. Daarnaast controleert hij elke eis uit het kwaliteitskader die met een A is gemerkt. Voor het bestaande thema 1 geeft hij in deze fase een lijst met wat ontbreekt, zonder de release te blokkeren; voor elk nieuw thema is slagen verplicht. De bestaande tests lezen dan het pakket in plaats van stukken uit `index.html`. Extra test: de samengestelde les is gelijk aan de les van vóór de fase (vaste zaadwaarde voor het husselen).

Wie: de ontwerpsessie schrijft het schema met één uitgewerkt voorbeeld en de regels van de samensteller; de onderhoudssessie verhuist de inhoud en bouwt. Besluit nodig: volgorde (#26 vóór #7).

## Fase 3 — Het herhaalmodel laten kloppen

Doel: bloei is haalbaar en de les volgt wat de leerder bijna vergeten is.

- **Derde oefenvorm voor woorden:** luisteren en typen (het woord horen, zonder tekst, en het opschrijven). Daarmee is de drie-vormen-regel haalbaar. Alternatief: de eis naar twee vormen.
- **Regels, zinnen en klanken krijgen een herhaalitem** en worden net als woorden ingepland. Een uitgewerkt voorbeeld bekijken telt niet meer als goed opgehaald.
- **De samensteller kiest op "bijna vergeten"**: eerst wat aan de beurt is (alle soorten), dan nieuw met een plafond, minder nieuw bij meer dan 25 herhalingen (bestaat al voor woorden).
- **Bijsturen op 80 tot 90% goed:** onder de 65% in een sessie een stap terug (herkennen in plaats van typen, een voorbeeld erbij); boven de 95% een stap moeilijker.
- **Hardnekkig (4 keer fout):** andere oefenvorm, zoals het ontwerp vraagt, naast de melding aan de begeleider.
- **Startmeting gebruiken:** de uitslag per vaardigheid bepaalt wat als bekend wordt aangenomen en waar de les begint.
- Migratie (`S.schema` omhoog): bestaande items houden hun stand; niets wordt teruggezet.

Wie: ontwerp en review door de ontwerpsessie, bouw door de onderhoudssessie. Besluit nodig: derde vorm of eis verlagen.

## Fase 4 — Neutraal standaardpakket en persoonlijk pakket (#7)

- Het standaardpakket in de repo krijgt fictieve plaatsen en neutrale situaties. Id's blijven gelijk, dus voortgang blijft.
- **Profielvelden alleen voor eigennamen** (plaatsnaam). Een zin met `{plaats}` blijft grammaticaal goed. Soort werk of rooster invullen breekt voorzetsel en lidwoord, ook in de steuntaal, en gaat daarom niet via een veld.
- **Persoonlijk pakket:** een bestand dat op Ik wordt gekozen en alleen op het toestel wordt bewaard. Het mag items en oefeningen van het standaardpakket vervangen (zelfde id) of toevoegen. Zo blijft de inhoud herkenbaar zonder dat hij in de openbare code staat.
- Extra's (zoals het culturele tussendoortje) worden modules in een pakket, standaard uit; een bestaande keuze blijft.

Let op: plaatsnamen die al in de git-geschiedenis staan, verdwijnen daar niet door.

Wie: de ontwerpsessie schrijft de neutrale inhoud (didactisch werk); de onderhoudssessie bouwt de import. Besluit nodig: profielvelden beperken tot eigennamen.

## Fase 5 — Route, vakken en ritme instelbaar (#8)

- De inhoud van de route staat in `docs/leerroute.md`: de volledige stof voor Nederlands (drie fasen, 25 thema's en blokken), rekenen (zes modules) en Engels (vier modules), met de omvang en een schatting van de tijd. De routekaart in de app toont die fasen, modules en poorten.
- `route` in het pakket: fasen, poorten, thema's. De huidige route wordt een voorbeeldroute zonder persoonlijke details; bij migratie krijgt de bestaande gebruiker precies de huidige route en het huidige ritme als instelling.
- Vakken aan of uit, en op welke dagen de tweede taal (nu vast dinsdag en donderdag in `isEnglishDay()`).
- Het bericht naar de begeleider haalt `fase` en `thema` uit de route. De ontvanger toont ze zoals ze binnenkomen.

Wie: onderhoudssessie, review door de ontwerpsessie.

## Fase 6 — Spraak, luisteren en video

Nu: alles loopt via de stem van het toestel (`speechSynthesis`). Zonder Nederlandse stem is er geen geluid. Klankparen (kort tegenover lang, g tegenover k) hangen af van hoe goed die stem toevallig is.

Voorstel, in volgorde van opbrengst:

1. **Opnemen en terugluisteren, zonder server.** Met `MediaRecorder` neemt de leerder een zin op en hoort die naast het voorbeeld. De opname blijft op het toestel en wordt niet verstuurd. Dit is de uitspraakoefening uit het ontwerp en heeft de server niet nodig; de app zegt nu ten onrechte dat het daarop wacht. Vraagt microfoontoestemming en moet op het echte toestel getest worden.
2. **Vaste geluidsbestanden voor de kern.** Klankparen, dictee en de zinnen van een thema als bestand in het pakket, offline beschikbaar. Dan klinkt het op elk toestel gelijk en werkt het ook zonder geïnstalleerde stem. De stem van het toestel blijft de terugval. Bron van de opnamen: ingesproken door een begeleider (het ontwerp noemt dat al) of eenmalig gemaakt met een spraakdienst.
3. **Luisteren verbeteren:** bij het verhaal de zin die klinkt aanwijzen, een knop voor langzaam en herhalen op elke plek, en bij luisteroefeningen eerst alleen geluid en de tekst pas na het antwoord (regel uit het ontwerp).
4. **Kijkopdrachten als inhoud.** Een lijst in het pakket: adres, kijkvraag vooraf, twee of drie vragen achteraf. De video opent buiten de app of ingesloten in de app. Het onderdeel met de videoselectie in het ontwerp is nog niet in deze review betrokken.

Spraakherkenning in de browser is op het doelapparaat niet betrouwbaar genoeg om op te bouwen; beoordeling van spraak hoort bij de AI-issues (#11, #12).

Wie: ontwerp en de eerste werkende versie van punt 1 door de ontwerpsessie; de rest door de onderhoudssessie. Besluit nodig: bron van de geluidsbestanden; video in de app insluiten (vraagt een uitzondering in een latere Content Security Policy, #15) of buiten de app openen.

## Fase 7 — Vormgeving en animaties

Nu: rustig en verzorgd, maar stil. Eén animatie (infaden) en de bloemblaadjes. De groei van een plant, waar de beloning om draait, is niet te zien: de plant staat de volgende keer gewoon in een ander stadium.

Voorstel:

1. **Groei zichtbaar maken.** Aan het eind van de les groeien de planten die een stadium opschoven, één voor één, van oud naar nieuw stadium. Dit is het belangrijkste moment van de app.
2. **Antwoord krijgt een reactie.** Goed: een zachte bevestiging op de knop of het invulveld. Fout: rustig, zonder schudden en zonder rood (bewuste keuze van het palet).
3. **Overgangen tussen stappen** die laten zien dat je verder gaat, en een voortgangsbalk die meebeweegt.
4. **De tuin leeft:** dorstige planten vallen op, water geven is te zien.
5. **Beeld bij woorden.** Een eenvoudig pictogram per woord in het pakket helpt onthouden (woord en beeld samen). Optioneel per pakket.
6. **Lettertypen zelf hosten** (#15): geen verspringende tekst bij het laden en ook offline het juiste lettertype voor de steuntaal.

Alles respecteert "minder beweging" van het toestel (staat al in de CSS) en blijft licht voor een oudere telefoon.

Wie: de ontwerpsessie bouwt punt 1 en 2 zelf en controleert ze in de browser, omdat het om smaak en timing gaat; de rest de onderhoudssessie. Besluit nodig: geen, behalve akkoord.

## Fase 8 — Spel en beloning

Doel: zin om terug te komen, zonder dat spelen het leren vervangt. Uitgangspunt uit het didactisch ontwerp: de app beloont regelmaat, niet uren, en straft een gemiste dag niet.

**Spelregels voor alle spellen**
- Elk spel oefent woorden of regels die de leerder al gehad heeft en werkt het herhaalmodel bij. Spelen telt als één oefenvorm; het kan productief oefenen niet vervangen.
- Een spel duurt één tot drie minuten en komt na de les of als tussendoortje, niet in plaats van de les.
- Elk spel heeft niveaus die meegroeien met de inhoud en houdt een eigen record bij.

**Taalspellen**
1. *De of het*: woorden sorteren op tempo (bestaat als snelronde; krijgt niveaus en vaste combinaties).
2. *Plek twee*: een zin bouwen uit blokken tegen de klok; het werkwoord moet op de goede plek. Niveaus: gewone zin, zin die met een tijd begint, bijzin.
3. *Klankduel*: een woord horen en het goede van twee kiezen, in een reeks die sneller wordt.
4. *Koppelen*: woord bij omschrijving of woord bij beeld, als geheugenspel.
5. *Fout zoeken*: tik het woord aan dat niet klopt in een zin of kort bericht.
6. *Zin afmaken*: kies het voegwoord dat past (reden, gevolg, tijd, voorwaarde).
7. *Letters op hun plek*: een gehusseld woord goed zetten, na het horen.

**Rekenspellen**
8. *Wisselgeld*: het juiste bedrag bij elkaar leggen met munten en biljetten.
9. *Zet de klok*: de wijzers draaien naar een gesproken tijd.
10. *Kortingsjacht*: snel de beste aanbieding kiezen.

**Beloning en punten**
- Punten blijven staan voor inspanning en kwaliteit (zelf typen levert meer op dan kiezen).
- De tuin is het middelpunt: zichtbare groei (fase 7), eigen bloemen per thema, en verdiende onderdelen die de leerder zelf een plek geeft.
- Mijlpalen met een klein feest: eerste bloem, vijftig woorden, thema af, eerste toets gehaald.
- Een weekdoel naast het dagdoel, met rustdagen: een gemiste dag breekt niets.
- Beloningen die leerder en begeleider samen afspreken ("bij thema af gaan we ...").
- Af en toe een verrassing: een bijzonder zaadje na een goede les.
- Zichtbaar hoe ver het nog is naar het volgende doel op de route.

**Wat er bewust niet in komt:** punten of planten verliezen, meldingen die op schuldgevoel spelen, tijdsdruk als straf, aankopen.

Wie: de ontwerpsessie ontwerpt de spellen en bouwt de eerste twee als voorbeeld; de onderhoudssessie bouwt de rest naar dat voorbeeld. Hangt af van fase 2 en 3.

## Fase 9 — Toetsen die bijsturen

Doel: een toets is geen eindpunt maar bepaalt wat de leerder daarna krijgt.

1. **Instaptoets per thema.** Kort, vooraf. Wat de leerder al kan, wordt als bekend gemarkeerd en hoeft niet opnieuw geleerd, alleen herhaald.
2. **Themaoefentoets.** Aan het eind van een thema, op alle vaardigheden. De uitslag komt per onderdeel. Wat onvoldoende is, gaat terug in de herhaling en krijgt extra oefeningen; het volgende thema gaat open als de toets gehaald is.
3. **Voortgangstoets.** Elke vier weken, in examenvorm, over alles tot dan toe. De uitslag stelt de niveau-inschatting per vaardigheid bij.
4. **Adaptief.** Een toets begint in het midden. Na een goed antwoord wordt de volgende vraag moeilijker, na een fout makkelijker, per vaardigheid. Zo is hij kort en toch precies.
5. **Examenstand.** Oefenen in de vorm van het echte examen: met klok, zonder steuntaal, met taken die langer worden. De spreekopdrachten volgen de vaste tijden van het examen.
6. **Foutenanalyse na elke toets.** Per fout: lag het aan een woord, aan de vraag, aan de tijd, of aan de regel? Het antwoord stuurt wat er extra geoefend wordt.
7. **Zeker of twijfel per vraag.** Zeker en toch fout krijgt voorrang in de herhaling.

De vragen in toetsen voldoen aan dezelfde eisen als oefeningen (`docs/kwaliteitskader.md`) en staan in het pakket, apart van de oefeningen, zodat een toetsvraag nooit eerst als oefening voorbijkomt.

Wie: ontwerp door de ontwerpsessie, bouw door de onderhoudssessie. Hangt af van fase 2 en 3.

## Eigen voorstellen van de ontwerpsessie

Niet gevraagd, wel aangeraden. Elk voorstel kan los worden goedgekeurd of geschrapt.

| Voorstel | Wat het doet | Hoort bij |
|---|---|---|
| Foutprofiel | De app onthoudt het soort fout (lidwoord, woordvolgorde, klinkerlengte, werkwoordsvorm) en oefent daar vaker op | fase 3 |
| Sommen die niet opraken | Rekenopgaven uit een recept met wisselende getallen en situaties | fase 3 |
| Bijna goed | Bij een typfout uitleggen wat er net misging in plaats van alleen fout | fase 3 |
| Tikbare teksten | Een woord in een tekst aantikken voor de betekenis en het in de tuin zetten | fase 6 |
| Vervolgverhaal met keuzes | De leerder kiest hoe het verder gaat; geleerde woorden komen terug | fase 4 |
| Samen spelen aan tafel | Een spel voor twee op één toestel, leerder tegen begeleider | fase 8 |
| Opdrachten buiten de app | Een zin gebruiken in het echt, dingen in huis benoemen; afvinken geeft een bijzondere plant | fase 8 |
| Weekadvies voor de begeleider | Eén concreet advies en een gesprekskaart die past bij de fouten van de week | fase 5 |
| Oefeningen die zichzelf melden | Oefeningen die bijna altijd goed of fout gaan komen op een lijst om te verbeteren | fase 3 |

## Daarna

Thema 2 schrijven als voorbeeldthema volgens het kwaliteitskader (ontwerpsessie), volgende thema's naar dat voorbeeld (onderhoudssessie, met de pakkettest als vangnet). De vertalingen in de steuntaal blijven nakijkwerk voor een moedertaalspreker.

## Volgorde en afhankelijkheden

| Fase | Hangt af van | Kan tegelijk met |
|---|---|---|
| 1 Voortgang beveiligen | – | – |
| 2 Inhoud uit de code | 1 | – |
| 3 Herhaalmodel | 2 | – |
| 4 Standaard- en persoonlijk pakket | 2 | 5 |
| 5 Route en ritme | 2 | 4 |
| 6 Spraak, luisteren, video | 2 voor de bestanden; punt 1 kan na fase 1 | 7 |
| 7 Vormgeving en animaties | 3 voor de groei; punt 2 en 6 kunnen eerder | 6 |
| 8 Spel en beloning | 2 en 3 | 7, 9 |
| 9 Toetsen die bijsturen | 2 en 3 | 8 |

Kleine losse issues (#27, #17, #16, #9, #10) kunnen tussendoor, zolang ze fase 2 niet doorkruisen: liever vóór fase 2 of erna, niet tijdens.

## Besluiten van de eigenaar (13 november 2026)

1. Bloei: een derde oefenvorm toevoegen (luisteren en typen); de eis blijft drie vormen. Issue #28.
2. Volgorde: inhoud uit de code (#26) vóór het neutrale pakket (#7).
3. Profielvelden alleen voor eigennamen; de rest via een persoonlijk pakket op het toestel.
4. De drie bevindingen staan als issues: #28 (bloei), #29 (vaste les), #30 (voortgang beveiligen).
5. Geluidsbestanden: eerst zelf ingesproken; een spraakdienst kan later.
6. Video: buiten de app openen, niet insluiten.

7. Het kwaliteitskader (`docs/kwaliteitskader.md`), fase 8 (spel en beloning) en fase 9 (toetsen die bijsturen) zijn akkoord. De eigen voorstellen van de ontwerpsessie gaan mee, elk nog los te schrappen.

Akkoord op het plan als geheel en op de start van fase 1. Pushen, issues sluiten en elke volgende fase blijven een apart akkoord.
