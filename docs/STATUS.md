# Stand van zaken

Kort en feitelijk. De werkende sessie houdt dit bestand bij; een eventuele extra ontwerp- of reviewsessie leest het. Geen privégegevens.

Bijgewerkt: 14 november 2026.

## Werkverdeling

- Sinds 14 november 2026 (bevestigd door de eigenaar): de ontwerpsessie stuurt via `docs/masterplan.md`; de bouwsessie voert uit (code, tests, releases, de redactielijn) en vraagt de ontwerpsessie bij een vraag over een eis. Zie `CLAUDE.md`, "Werkverdeling".
- De eigenaar beslist over pushen van code, beveiliging en privacy, geld, wat niet terug te draaien is, en de overgang naar de kaart.

## Live (GitHub Pages)

- Fase 1, voortgang beveiligen (#30): gesloten.
- Fase 2, inhoud uit de code en lessamensteller (#26): gesloten.
- Uitleg (speler, drie ingangen, 32 uitleggen) en het weekdoel (standaard 10 uur, merktekens op 3,5, 7 en 10 uur).
- Fase 3, het herhaalmodel (docs/herhaalmodel.md), inclusief de verwerkte review: live sinds 13 november 2026.
- Na gebruik: herhaling met tijd ertussen, dagbudget voor nieuwe woorden (eerst als vraag), Bijsturen op Ik, na de ronde te makkelijk/goed/te moeilijk en leuk/saai, vertaling melden, ervaringstest: live sinds 14 november 2026, cache v2-34 (t/m bad647d).

## Klaar, lokaal gecommit, nog niet gepusht

- Lesstof: 100 basiswoorden (nl-basis), concept stap 1 (kleur per vak) en stap 2 (scènespeler met scène 1 van "bij de dokter").
- Scènespeler voor diepte en diagnose (docs/scenes.md), 14 november 2026: stappen `quiz` (instap, ophalen, controle), `rule` (voorbeeld, dan afbouwende oefeningen) en `extra` (alleen na een tweede fout van dezelfde soort, direct erna); vragen `choose`, `hear`, `type`, `number`; `do` met keuzes; `nosup` (instap en controle altijd zonder steuntaal tot de eerste poging); bronnen bij een leestekst (link met `https`, opent apart); `make` met een vraag en een kader met `___` dat in het invulvak klaarstaat; rekenen en kennis zonder `n` (na scène 5).
- Foutprofiel: elke foute keuze met `err` telt per soort in `S.errs` (recent weegt zwaarder: halveert in 14 dagen; de laatste 8 onderdelen per soort). Een open plek in een scène vult eerst de helft met onderdelen van de vaakste soort fout (vanaf gewicht 2, alleen al geoefende onderdelen), daarna wat aan de beurt is. Instap goed bij de eerste poging: een nieuw woord maakt de grote sprong en het ophalen (en de regel) van dat onderdeel valt weg. De controle bepaalt `S.world.ok[scène]` (beheerst). Opslag: SCHEMA 6 (migratie 5 → 6 voegt `errs` en `world.ok` toe, gooit niets weg).
- `phrase` (vaste zin) is een woord zonder lidwoord; `art: ""` geldt als geen lidwoord.
- De versie van "bij de dokter" uit de redactielijn wordt leidend (besluit eigenaar 14 november 2026); de eigen scènes 2 tot en met 5 van de bouwsessie zijn teruggedraaid. Overnemen zodra de review klaar is.
- Getest in de browser op 375 px met een tijdelijke kopie van `redactie/uit/nl-dokter.json`: scène 1, 2, de rekenscène en de kennisles spelen door; de extra stap komt na de tweede lidwoordfout; foutprofiel en "beheerst" worden bewaard.
- Stap 2 van het masterplan, de rest (docs/ontwerp-stap2.md): elke bestaande oefenvorm als vraag in een scène (`build`, `gap`, `listen`, `money`, `clock`, `discount`; hetzelfde scherm als in de les, een fout telt in het foutprofiel); `hear-type` en `complete`; hint in twee stappen (goed na een hint telt als `'retry'`; niet bij instap, controle en de zwaardere vorm); stap `speak` (voorbeeld om te horen, checklist; opnemen volgt in stap 6); stap `game` met `dehet` (60 seconden, woorden van de scène en wat aan de beurt is, vorm `spel` telt niet voor bloei); de zwaardere vorm (een gespeelde scène opnieuw zonder steuntaal, typen waar een vraag ook `answer` heeft, eigen record in `S.world.best`, in dezelfde migratie 5 → 6). Hoofdstukcontrole `PakketCheck.checkChapter` (A6, B1, B2, C1, C2, E2, E3, G2), gebruikt door de poort en de scènetest. Migratie 5 → 6 getest. Getest in de browser op 375 px: spreken, spel, zwaarder met nieuw record.
- Stap 2 is af als het proefhoofdstuk uit de redactielijn in `content/` staat en de hoofdstukcontrole haalt (de scènetest meldt het nu als "NOG"); dan volgt ijkmoment G1.

## Nooit een grind (H2 tot H4) en M12, 14 november 2026

- M12: elke poging staat per onderdeel in `S.items[id].h` als één korte tekenreeks (dagen sinds de vorige poging, vormcode, uitkomst), 24 pogingen en 6 in volle bloei, met `f1`, `na` en `nk` voor wat afvalt; in migratie 5 → 6 (nog niet uitgebracht). F1 (antwoord ontwerpsessie): alle reeksen samen hooguit 300.000 tekens (eerst de oudste pogingen van onderdelen in volle bloei weg, nooit de stand); na drie nagebootste jaren met de reservekopie 1,36 miljoen tekens (grens in de test: 2 miljoen); lukt wegschrijven niet, dan maakt `save()` eerst ruimte in de reeksen, anders één melding, en de bestaande opslag blijft heel. IndexedDB is niet nodig.
- H2: `pickForm` en `chooseEx` kiezen niet de vorm van de vorige poging (ook van een vorige dag); `noSameForm` en `breakTriples` als vangnet. Wat overblijft in de ervaringstest zijn onderdelen met maar één vorm in de lesstof (klanken met alleen luisteren, rekenvaardigheden met alleen één soort som): een lesstoftekort voor de redactielijn (LET OP).
- H3: wat drie keer op rij goed ging bij de eerste poging in drie vormen (`rests`), komt niet meer in Onderweg; wel in scènes (de open plek).
- H4: is alle nieuwe lesstof aangeboden (`stockOut`), dan staat dat op Vandaag en vult de ronde niet aan met sommen die niet aan de beurt zijn.
- De ervaringstest: H2, H3 en H4 nu als FOUT en groen; H1 LET OP tot stap 5. De test rekent met de stem van het toestel (iPhone).
- Hoofdstukcontrole aangescherpt (antwoord ontwerpsessie): een gesprek hooguit zes beurten, een tekst hooguit tien vragen, twee blokken van dezelfde soort niet direct na elkaar, vragen bij een tekst in de nieuwe vorm (met `err`), een luistertekst met vijf tot tien vragen.

## Redactielijn: "bij de dokter"

- Ronde 3 (schrijver, goedkoper model): poort 0 fouten. Review (ander, groter model): **verbeteren**, 3 blokkerend en 26 klein (`redactie/uit/nl-dokter.review.json`). Blokkerend: de regel "pijn aan, niet pijn in" is onjuist; open typvragen in de controle keuren goede antwoorden af; vragen bij lees- en luisterteksten in de oude vorm zonder `err`. Verder o.a. rollen en tijden die niet kloppen, alle de/het-oefeningen met antwoord "de", een kennistekst ver boven A2, labels in de tekening die niet passen, en Thaise tijdsaanduidingen. De kennisles klopt met de bron.
- De poort vangt het derde blokkerende punt nu zelf af. Ronde 4: de schrijver herstelt op de review.

## Stap 2b: de motor langs het didactisch plan

De stand per eis M1 tot M12 (wat er is, wat ontbreekt) staat in `docs/ontwerp-stap2b.md`. Kort: M1 en M2 bestaan; M3, M4, M7, M9, M11 en M12 deels; M5, M6, M8 en M10 nieuw. Alle waarden van de motor staan nu op één plek (`MOTOR` in `index.html`) met bron of "aanname"; `test-herhaal` bewaakt dat, en de les van `test-les` is ongewijzigd. Volgende bouw: M12 (reeks pogingen per onderdeel), M5 (trede per regel), M6 (vier strengen), M10 (na `docs/eindtermen.md`); drie vragen aan de ontwerpsessie staan onderaan het ontwerp.

## Afstemming redactielijn en app (voor de schrijversopdracht)

`redactie/controleer.mjs` draait nu ook `pakketcheck.js` tegen de ingebouwde pakketten: wat de app weigert, keurt de lijn af. De schrijversopdracht moet daarom overnemen:

1. Bovenaan het pakket: `type: "hoofdstuk"`, `version`, `order` (getal; de dokter: 30) en `requires` (de pakketten waarvan het items gebruikt, bijvoorbeeld `nl-t1`, `nl-basis`, `rk-1`).
2. Elk woord en elke vaste zin (`phrase`) heeft `gap`: een zin met precies één `___`, die niet met het gat begint en met een leesteken eindigt. Bij een woord met lidwoord staat het lidwoord zichtbaar vóór het gat (`De ___ is vol.`), of `askArt: true` als de leerder het lidwoord moet typen. De app gebruikt `gap` voor de oefening "vul in".
3. `art` is `de`, `het`, of weglaten (leeg mag ook); een `phrase` heeft geen lidwoord.
4. Elke vraag bij een lees- of luistertekst heeft `why`, ook in de oude vorm (`q`, `o`, `a`).
5. Een stap `explain` verwijst naar een uitleg die bestaat (`content/uitleg-*.json`); anders slaat de speler hem stil over.
6. Bronnen: `{ "url": "https://…", "title": "…" }`.
7. De hoofdstukcontrole (`checkChapter`, ook in de poort): per scène minstens zes werkvormen en nooit drie keer dezelfde vorm achter elkaar (een gesprek en een lees- of luistertekst tellen als één blok); per hoofdstuk minstens twaalf werkvormen, een leestekst met vijf tot tien vragen, een luistertekst (stap `listen`), een stap `speak`, een stap `game` (nu alleen `kind: "dehet"`), schrijven (`make`) en rekenen in de situatie; `goals` bij het hoofdstuk en elke scène Nederlands; een hint in twee stappen bij elke typvraag (`type`, `hear-type`, `complete`) behalve in instap en controle; een `err` bij elke foute keuze; een `extra` in elke scène met een `rule`.
8. Vormen die nog niet in een scène kunnen (stap 6): `own`, `match`, `spot`, `dictee`, `mc`. De controle weigert ze.
9. Voor de zwaardere vorm (B4): geef een keuzevraag waar dat kan ook een `answer`, dan wordt het in de zwaardere vorm een typvraag.

Opmerking na het spelen: de leestekst van de kennisles is lang en staat bij elke vraag opnieuw boven in beeld; op 375 px moet de leerder ver scrollen. Korter, of in twee delen met elk eigen vragen.

Nog niet gebouwd uit "Diepte en diagnose": de hoofdstuktoets met de uitkomst door, gericht extra of sneller; het foutprofiel op het scherm van de begeleider (hoort bij docs/aanvoer-en-begeleider.md); de schatting van de route bijstellen.

## Dekking van de lesstof (bijgewerkt 14 november 2026)

Wat er is, naast wat het kwaliteitskader en de leerroute vragen. Bepaalt de volgende stap: een motor zonder lesstof levert herhaling op, geen leren.

| Lijn | Onderdeel | Er is | Gevraagd | Dekking |
|---|---|---|---|---|
| Nederlands thema 1 | Woorden | 18 (zonder Nederlandse omschrijving) | ±75 met lidwoord, omschrijving en eigen voorbeeldzin | ±25% |
| | Teksten (cycli) | 1 verhaal (2 teksten), los van de les | 2 tot 3 cycli rond een eigen tekst | ±10% |
| | Grammatica | 2 punten (plek twee, hebben), alleen gesloten | de punten van het thema in 3 treden (o.a. verleden tijd, inversie) | ±15% |
| | Uitspraak | 3 klankparen, 9 oefeningen | knelpunten van de moedertaal als eigen lijn | begin |
| | Luisteren | 1 dictee, klankoefeningen | minstens 1 luistertekst met vragen | 0% |
| | Schrijven | spraakdagboek | 3 treden met schrijfkader | 0% |
| | Spreken | gesprekskaart aan tafel | spreeksituaties, opnemen en terugluisteren | ±5% |
| | Taalfuncties | 0 | kaders met standaardzinnen | 0% |
| | Afsluitende mix | 0 | mix die 70% van de doelwoorden raakt | 0% |
| Nederlands woordenschat | Frequentielijst | 100 basiswoorden (nl-basis): 50 zelfstandige naamwoorden, 30 werkwoorden, 20 bijvoeglijke naamwoorden en tijdwoorden, met omschrijving | ±8 per lesdag, op weg naar 3.000–5.000 (B1) | ±3% van B1 |
| Rekenen | Onderwerpen R1–R4 | 5 vaardigheden (geld, komma, klok, 10%, 25%), 11 oefeningen, wisselende getallen | R1 tot R4 volledig (±20 onderwerpen) | ±25% |
| | Uitleg | 17 uitleggen | per onderwerp | ±60% voor R1–R2 |
| Engels | Woorden en regels | 8 woorden, 1 regel, 1 klank, 8 oefeningen | route tot A2 | ±5% |
| Uitleg | Totaal | 32 (rekenen 17, Nederlands 11, Engels 4) | catalogus R1–R4, thema 1–3, Engels A2 | ±35% |
| Kwaliteit | Meldingen pakketcontrole | 115 open | 0 | – |

De ervaringstest (`node tools/test-ervaring.mjs --streng`): met thema 1 en de 100 basiswoorden is de nieuwe lesstof bij 16 per dag na 6 dagen op; gemiddeld 8,4 verschillende onderdelen per ronde.

## Leidend plan

docs/didactisch-plan.md is het fundament (leeruitkomsten per jaar, leerweg, onderbouwing met bronnen, eisen M1 tot M12 aan de motor). docs/masterplan.md (14 november 2026): de eisen die onverminderd gelden, de catalogus van werkvormen, de stappen 1 tot 13 met wie bouwt en wanneer iets klaar is, en de ijkmomenten G1 tot G5 van de ontwerpsessie. De volgorde daar vervangt de volgorde hieronder en die in docs/bouwplan.md en docs/plan-herzien.md.

## Open besluiten voor de eigenaar

- Nieuw concept (kaart, scènes, album): docs/concept-leerwereld.md. Richting goedgekeurd op 14 november 2026; vier besluiten staan onderaan dat ontwerp. Akkoord op alle vier (14 november 2026): stap 1 en 2 mogen gebouwd worden; formaat en tekencatalogus in docs/scenes.md, `scene.js` en docs/voorbeeld-scene.json. Pushen en stap 4 blijven een apart akkoord.
- Route met tijd en een verwachte examendatum: docs/route-en-prognose.md. Akkoord op de vier besluiten (14 november 2026); bouwen na de scènespeler.
- Scherm van de begeleider: docs/aanvoer-en-begeleider.md, deel 2. Akkoord (14 november 2026): in één keer, na de scènespeler; eerst de widget, dan de app.
- Automatische redactie (lesstof, fout melden met punten, vragen van de leerder, wie doet wat): docs/automatische-redactie.md, werkbestanden in redactie/. Richting akkoord; de proef met het hoofdstuk "bij de dokter" loopt. Voor de bouwsessie volgt hieruit: lesstof los van de code (content/index.json) en redactie/uitbrengen. Zelf uitbrengen door de lijn gaat pas in als de regel in CLAUDE.md staat.
- Wereld en kennis: geen vast stramien per stroming; één specifieke vraag per les (docs/concept-leerwereld.md).

- Herzien plan na gebruik: docs/plan-herzien.md (sporen A tot F, zes open besluiten). Onderzoek: docs/onderzoek-beloning.md.

- Test op de telefoon: een volle les, "luister en schrijf op" met echte stem, een tweede ronde op dezelfde dag, en de Engelse les op dinsdag of donderdag. Daarna #28 en #29 sluiten (alleen met akkoord).

## Volgorde

1. Uitlegcatalogus, per groep: wat de huidige oefeningen raken (klaar), dan rekenen R1 t/m R4, dan grammatica en leestekens van thema 1 t/m 3, dan Engels tot A2. Rekenen volgt strook of getallenlijn, dan tabel, dan de kale som.
2. Fase 3, het herhaalmodel (`docs/herhaalmodel.md`): akkoord 13 november 2026, bouw loopt (8 stappen). Stap 1 klaar: herhaalitems voor alle soorten, doelitem, gespreid ophalen, migratie 3 → 4. Stap 2 klaar: luisteren en typen (NL, EN), Engels herkennen, vorm kiezen die het woord nog mist. Stap 3 klaar: sommen die niet opraken (geld, klok, korting met wisselende getallen). Stap 4 klaar: eis voor bloei per soort. Stap 5 klaar: de les kiest wat bijna vergeten is (oefenen per onderdeel, uitleg vóór iets nieuws, afbouwend kortingsvoorbeeld, afwisseling, korte latere rondes), plus oefeningen zodat elk onderdeel kan bloeien. Stap 6 klaar: bijsturen binnen een ronde, hardnekkige onderdelen, uitleg in de tuin. Stap 7 klaar: de startmeting zet basisonderdelen bij een hoge score als plantje; lage woordscore geeft minder nieuwe woorden. Stap 8: review door de ontwerpsessie; vijf punten opgelost (volle bloei komt terug, wachttijd vanaf de laatste poging, bij-items zonder vorm, bijsturen ook voor regels en sommen, service worker bewaart alleen geslaagde antwoorden), de zesde (langere startmeting) staat bij fase 9. Volgt: eindcontrole in de browser, ook de Engelse les, dan release met akkoord.
3. Lesstof thema 2 volgens het kwaliteitskader.
4. Daarna pas spellen en vormgeving.

## Wachtlijst (niet nu bouwen)

- Knop "vertaling klopt niet" bij elke steunregel, zodat de leerder een fout in de vertaling meldt aan de begeleider.
- Spellen (fase 8).
- Vormgeving en animaties (fase 7).
- Nieuwe wensen van de eigenaar.
