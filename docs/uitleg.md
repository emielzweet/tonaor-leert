# Uitleg: alles moet uitgelegd kunnen worden

Stand: 13 november 2026. Rekenen, grammatica en leestekens (Nederlands en Engels) krijgen stap-voor-stap uitleg met een bewegend plaatje en voorgelezen tekst. Oefenen komt daarna, niet in plaats daarvan.

## Uitgangspunten

1. **Kleine stappen, eigen tempo.** Een uitleg heeft 3 tot 6 stappen. De leerder tikt zelf verder en kan terug.
2. **Eén ding per stap.** Eén zin of twee, één plaatje. Het plaatje bouwt zich op terwijl de tekst klinkt.
3. **Horen en zien tegelijk.** Elke stap wordt voorgelezen in de leertaal; de steuntaal staat eronder volgens de gekozen stand. Voorlezen kan uit.
4. **Eerst het model, dan de som.** Rekenen begint met een strook, getallenlijn, verhoudingstabel of klok; pas daarna de berekening in cijfers.
5. **Vergelijk met de moedertaal** waar dat een bekende valkuil is (variant `nl@th`, `nl@en`).
6. **Afsluiten met zelf doen.** Elke uitleg eindigt met minstens één controlevraag met de reden bij het antwoord.
7. **Altijd bereikbaar.** Vanuit elke oefening waar een uitleg bij hoort, en vanuit een eigen overzicht.

## Wat het onderzoek zegt (bronnenonderzoek, 13 november 2026)

- **Stem en beeld tegelijk** is het sterkste principe uit de multimedia-leertheorie; daarna gesproken uitleg, weglaten wat niet uitlegt, één ding markeren, en opknippen in stappen die de leerder zelf doorklikt (Mayer 2023).
- **Animatie helpt matig en alleen als de verandering zelf de leerstof is** (Höffler & Leutner 2007; Berney & Bétrancourt 2016). Dus: animeer een sprong op de getallenlijn of een woord dat van plek wisselt, niet als versiering.
- **Voor wie in een tweede taal leert, helpt tekst naast de stem** (Lee & Mayer 2018). Daarom staat de tekst van de stap in beeld, kort, en kan de leerder opnieuw afspelen.
- **Uitgewerkte voorbeelden die afbouwen** werken beter dan alleen sommen (Renkl e.a. 2000): volledig voorbeeld, dan de laatste stap zelf, dan meer stappen zelf.
- **Rekenen:** eerst de situatie, dan een denkmodel (strook, getallenlijn), dan pas een rekenmodel (verhoudingstabel), dan de kale som. De verhoudingstabel is ongeschikt als begin; het trapje van het metriek stelsel hoort aan het eind, na meten en schatten (Freudenthal Instituut, SLO).
- **Grammatica:** expliciete uitleg werkt beter dan alleen oefenen; een korte vergelijking met de moedertaal helpt waar die afwijkt (Norris & Ortega 2000; McManus & Marsden 2017).
- **Zelf uitleggen** na de uitleg helpt, maar bij rekenen spaarzaam: één korte waarom-vraag over het begrip, pas na het voorbeeld.

Gevolg voor de eerste acht uitlegjes: de uitleg van de verhoudingstabel moet beginnen met een strook of dubbele getallenlijn voordat de tabel verschijnt.

Geen videobestanden: de animaties worden getekend door de app zelf. Dat werkt zonder internet, is te vertalen, en de leerder bepaalt het tempo. Video's van buiten horen bij de kijkopdrachten (bouwplan fase 6).

## Wat er al staat (ontwerpsessie)

- `uitleg.js`: de tekenmodule. `UitlegVis.render(visual, safe, ctx)` geeft HTML. Acht soorten plaatjes: `bar` (strook), `line` (getallenlijn met sprongen), `ratio` (verhoudingstabel), `steps` (uitgewerkt voorbeeld, regel voor regel), `zin` (zin in blokjes: kleur per zinsdeel, markering van een leesteken), `table` (vervoeging, vergelijking, positieschema), `clock`, `fraction`. Elk onderdeel dat erbij komt heeft de klasse `u-in` en een `animation-delay`.
- `pakketcheck.js`: het veld `explain` in een pakket wordt gecontroleerd (onderwerp, stappen, plaatje, controlevragen). Een plaatje mag alleen getallen, ja/nee en tekst zonder opmaakcode bevatten.
- `content/uitleg-rk.json` (procent, korting, verhoudingstabel, klok) en `content/uitleg-nl.json` (werkwoord op plek twee, persoonsvorm, hoofdletter en punt, komma): acht uitgewerkte voorbeelden. Ze zijn het model voor alle volgende.

## Formaat van een uitleg

```json
{"id": "u.rk.procent", "subject": "rekenen", "items": ["r-10"], "forms": ["discount"],
 "title": Tekst, "summary": Tekst,
 "steps": [{"text": Tekst, "visual": {"type": "bar", "total": 60, "unit": "€", "segs": [{"v": 6, "label": "10%", "tone": "apricot"}], "alt": "…"}}],
 "check": [{"q": Tekst, "o": ["€ 8", "€ 10", "€ 18"], "a": 0, "why": Tekst}]}
```

- `subject`: `rekenen`, `grammatica` of `leestekens`. De taal volgt uit `learn` van het pakket.
- `items` en `forms`: bij welke onderdelen en oefenvormen deze uitleg hoort. Daarmee vindt de app de uitleg bij een oefening.
- `text` is wat in beeld staat en wat voorgelezen wordt. Schrijf getallen in een voorleestekst uit als ze anders verkeerd klinken.
- `alt` beschrijft het plaatje voor wie het niet ziet.
- Keuzes in `check` mogen een gewone string zijn als ze in de leertaal moeten staan.

## Nog te bouwen (onderhoudssessie)

**De speler**, als laag boven het huidige scherm, zodat een oefening eronder blijft staan:
- kop met titel en sluitknop; daaronder het plaatje (`UitlegVis.render`), dan de tekst van de stap (`TKp`);
- knoppen: vorige, opnieuw afspelen (tekent het plaatje opnieuw en leest opnieuw voor), volgende; stippen voor de voortgang; een schakelaar voorlezen aan of uit (onthouden in `S.explainVoice`, standaard aan);
- bij elke stap: voorlezen met `say()` in de leertaal van het pakket; bij sluiten stopt het voorlezen;
- na de laatste stap de controlevragen, één per scherm: goed of fout met de reden; daarna "Klaar";
- afronden zet `S.explained[id]` op het tijdstip en geeft de eerste keer 10 punten; de tijd in de speler telt mee als leertijd;
- `u-in` krijgt een rustige animatie (ongeveer een halve seconde, infaden met een kleine verschuiving); bij "minder beweging" staat alles er meteen.

**Ingangen:**
- een tegel "Uitleg" op Vandaag die een overzicht opent, gegroepeerd per taal en onderwerp, met een vinkje bij wat bekeken is;
- een knop "Uitleg" in het kader van elke oefening waar een uitleg bij hoort (zoek op `items`, anders op `forms`);
- na twee fouten in dezelfde oefening biedt de terugkoppeling de uitleg aan.

**Verder:** de pakketten en `uitleg.js` in `BUILTIN`, `SHELL` en de scripts; alle nieuwe teksten in `I18N` (nl, th, en); `S.explained` en `S.explainVoice` in `fresh()`; tests (elk plaatje van elk pakket geeft HTML; een plaatje met opmaakcode of een aanhalingsteken in `alt` is onschadelijk; de speler opent en sluit zonder de oefening eronder te wijzigen).

**De lesrecepten blijven in deze stap ongewijzigd**, zodat `test-les` groen blijft. Uitleg in de les zelf komt in fase 3.

## Catalogus: wat uitgelegd moet worden

Elke regel is één uitleg, te schrijven naar het model van de eerste acht. Volgorde: wat de huidige oefeningen raken eerst.

**Rekenen** (volgt de modules R1 tot R6 in `docs/leerroute.md`): getallen lezen en zeggen; plaatswaarde en de komma; optellen en aftrekken met de getallenlijn; tafels als sprongen; rekenen met nullen; geld en wisselgeld; de klok (af); tijdsduur; meten en eenheden; de trap van het metriek stelsel; breuken als deel; breuk, procent en kommagetal; procent (af); korting (af); btw als 121 procent; terugrekenen naar 100 procent; verhoudingstabel (af); prijs per stuk; snelheid; schaal; tabel en grafiek lezen; gemiddelde; omtrek; oppervlakte; inhoud.

**Nederlands, grammatica** (volgt de thema's N1): werkwoord op plek twee (af); persoonsvorm (af); de en het; meervoud; verleden tijd; voltooide tijd met hebben of zijn; scheidbare werkwoorden; modale werkwoorden; bijzin met het werkwoord achteraan; voegwoorden; omdat en want; vergelijken; verwijswoorden; er; te + infinitief; om … te; zou; passief; betrekkelijke bijzin; niet en geen.

**Nederlands, leestekens:** hoofdletter, punt en vraagteken (af); komma (af); dubbele punt; aanhalingstekens; apostrof en meervoud op 's; 's ochtends; afkortingen; getallen en bedragen schrijven; een brief opmaken (aanhef, afsluiting).

**Engels, grammatica:** he, she, it met -s; am, is, are; a en an; meervoud; tegenwoordige tijd en "nu bezig" (-ing); verleden tijd; vragen en ontkenning met do; some en any; vergelijken; there is en there are.

**Engels, leestekens:** hoofdletters bij dagen, maanden en I (talen en nationaliteiten krijgen in beide talen een hoofdletter, dat is geen verschil); apostrof bij bezit en samentrekking; meervoud zonder apostrof; punt en komma in getallen (9.50 tegenover 9,50).

## Kwaliteit

- Elke uitleg voldoet aan `pakketcheck` en heeft minstens één controlevraag.
- De ontwerpsessie bekijkt elke nieuwe soort plaatje in de browser op 375 px en schaaft de timing bij.
- De vertalingen in de steuntaal worden nagekeken door een moedertaalspreker, net als alle andere inhoud.
