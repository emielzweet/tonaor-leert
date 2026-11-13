# Stand van zaken

Kort en feitelijk. De werkende sessie houdt dit bestand bij; een eventuele extra ontwerp- of reviewsessie leest het. Geen privégegevens.

Bijgewerkt: 13 november 2026 (later).

## Werkverdeling

- Eén sessie ontwerpt, bouwt, test en reviewt, volgens de werkwijze in `CLAUDE.md`: eerst een kort ontwerp in `docs/`, dan akkoord van de eigenaar, dan bouwen, dan een onafhankelijke review.
- Een aparte ontwerp- of reviewsessie is optioneel en alleen op verzoek van de eigenaar. Niets wacht erop.
- Pushen, releases en issues sluiten: alleen met akkoord van de eigenaar.

## Live (GitHub Pages)

- Fase 1, voortgang beveiligen (#30): gesloten.
- Fase 2, inhoud uit de code en lessamensteller (#26): gesloten.
- Uitleg (speler, drie ingangen, 32 uitleggen) en het weekdoel (standaard 10 uur, merktekens op 3,5, 7 en 10 uur).
- Fase 3, het herhaalmodel (docs/herhaalmodel.md), inclusief de verwerkte review: live sinds 13 november 2026.
- Na gebruik: herhaling met tijd ertussen, dagbudget voor nieuwe woorden (eerst als vraag), Bijsturen op Ik, na de ronde te makkelijk/goed/te moeilijk en leuk/saai, vertaling melden, ervaringstest: live sinds 14 november 2026, cache v2-34 (t/m bad647d).

## Klaar, lokaal gecommit, nog niet gepusht

- Niets, behalve deze statusregel.

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
| Nederlands woordenschat | Frequentielijst | 0 | ±8 per lesdag, op weg naar 3.000–5.000 (B1) | 0% |
| Rekenen | Onderwerpen R1–R4 | 5 vaardigheden (geld, komma, klok, 10%, 25%), 11 oefeningen, wisselende getallen | R1 tot R4 volledig (±20 onderwerpen) | ±25% |
| | Uitleg | 17 uitleggen | per onderwerp | ±60% voor R1–R2 |
| Engels | Woorden en regels | 8 woorden, 1 regel, 1 klank, 8 oefeningen | route tot A2 | ±5% |
| Uitleg | Totaal | 32 (rekenen 17, Nederlands 11, Engels 4) | catalogus R1–R4, thema 1–3, Engels A2 | ±35% |
| Kwaliteit | Meldingen pakketcontrole | 115 open | 0 | – |

De ervaringstest (`node tools/test-ervaring.mjs`) laat zien dat de nieuwe woorden van thema 1 bij 16 per dag op de eerste dag op zijn.

## Open besluiten voor de eigenaar

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
