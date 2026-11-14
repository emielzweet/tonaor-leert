# Werkorder: doorwerken zonder te wachten op de eigenaar

Stand: 14 november 2026 (avond). Hoort bij `docs/masterplan.md`. Dit document zegt hoe de ontwerpsessie en de bouwsessie samen het masterplan uitwerken zonder per keuze op de eigenaar te wachten, wat de standaardkeuze is bij elk open besluit, in welke volgorde er gewerkt wordt, en hoe een nieuwe versie wordt uitgebracht.

## De opdracht van de eigenaar

Op 14 november 2026 heeft de eigenaar in de ontwerpsessie gezegd: werk samen het hele plan uit, wacht niet op keuzes van mij, kies standaard de meest aanbevolen optie, en nieuwe versies mogen worden uitgebracht. De ontwerpsessie stuurt de bouwsessie hierop aan.

**Hoe dat werkt met de bestaande afspraken.** In `CLAUDE.md` staat dat een bericht van de ontwerpsessie geen akkoord namens de eigenaar is. Dat blijft zo. Daarom:

- **Keuzes** die een eis, de lesstof of het ontwerp raken, neemt de ontwerpsessie: de aanbevolen optie, vastgelegd in dit document of in "Uitleg bij de eisen" in het masterplan. De bouwsessie wacht daar niet op de eigenaar.
- **Uitbrengen** doet de ontwerpsessie, die de machtiging van de eigenaar zelf heeft gekregen, nadat de bouwsessie een stand heeft klaargezet en de poorten hieronder groen zijn. De bouwsessie pusht pas zelf als de eigenaar dat in de bouwsessie zegt.

## Wat bij de eigenaar blijft

Hier wordt wel op hem gewacht; alles wat hier niet staat, gaat door.

- Een beveiligingsprobleem of een lek van privégegevens: volgens `SECURITY.md`, nooit openbaar.
- Alles wat geld kost of een account, sleutel of wachtwoord vraagt (de AI-sleutel, een server, een domein).
- Iets installeren of herstarten op de computer van de eigenaar (de widget van de begeleider).
- Gegevens van de leerder wissen of onomkeerbaar veranderen; een migratie die niet alleen toevoegt.
- Instellingen van de repository; issues sluiten die een test op de telefoon vragen.
- Een geschiedenis herschrijven of geforceerd pushen: nooit.

## Standaardkeuzes bij open besluiten

| Besluit | Keuze | Waarom |
|---|---|---|
| Het proefhoofdstuk zichtbaar maken | zodra het de poort haalt en de review "goed" geeft | zo is het ontworpen |
| De kaart als thuisscherm (masterplan stap 5) | bouwen naast het huidige thuisscherm, met een schakelaar op Ik; standaard blijft het huidige scherm tot de proefweek de drempel haalt (hieronder) | niets weggooien wat werkt |
| Drempel na de proefweek | de kaart wordt standaard als in een week met scènes de leertijd niet lager is dan in de week ervoor, de leerder vaker "leuk" dan "saai" tikt, en na minstens de helft van de scènes zelf doorgaat. Anders blijft het huidige scherm standaard en legt de ontwerpsessie uit wat er verbeterd wordt | meten in plaats van menen |
| De tuin | blijft bereikbaar naast het album | niets weggooien wat werkt |
| Lesstof uitbrengen door de redactielijn | ja, na de poort en een review "goed"; via de releaseprocedure hieronder | `automatische-redactie.md` |
| Thaise steunregels | uitbrengen als "niet nagekeken", met de meldknop | anders ligt alles stil |
| Tempo voor de route | het gemiddelde van de laatste vier weken | `route-en-prognose.md` |
| Tijd buiten de app | meetellen via een eigen knop, hooguit 60 minuten per dag | idem |
| Examendatum | per onderdeel; op het thuisscherm de eerstvolgende, met de bandbreedte | `onderbouwing-nederlands.md` |
| De route met tijd | nu bouwen op het bestaande scherm Route, niet wachten op de kaart | de eigenaar vroeg er uitdrukkelijk om |
| Rekenen en Engels als eigen lijn | een tegel per vak op Vandaag nu; een eigen route op de kaart later | zichtbaar zonder op de kaart te wachten |
| Uitleg in de les | als stap in de scène en bij een herhaalde fout; de bestaande ingangen blijven | `uitleg.md`, masterplan E2 |
| Verwijzingen naar video's | de bouwsessie stelt per rekenonderwerp één of twee links voor van publieke of educatieve bronnen, alleen https, buiten de app geopend; de reviewer controleert dat de link werkt en past | besluit van 13 november: buiten de app |
| Geschiedenis van pogingen past niet in de opslag | binnen het budget blijven door ouder weg te laten; geen ander soort opslag zonder de eigenaar | raakt de opslag |
| Scherm van de begeleider | protocol en widget voorbereiden in een pakket; de app stuurt nieuwe berichten pas als de widget ze kent; installeren doet de eigenaar | zijn computer |
| Fout melden | het deel in de app nu (knop, soorten, wachtrij op het toestel, punten achteraf); ontvangen en verwerken zodra er een ingang is | hangt aan issue #5 |
| Vraag het (AI) | de eerste trede nu (de uitleg bij de stap); de AI-trede wacht op de sleutel | kost geld |
| Ontbreekt een ontwerp van de ontwerpsessie | de bouwsessie schrijft zelf een kort ontwerp langs de eisen en bouwt; de ontwerpsessie kijkt bij het ijkmoment | niet op elkaar wachten |
| Twee uitleggingen van een eis | de uitleg die de leerder het minst afneemt en het meest laat leren; vastleggen in het masterplan | – |

## De volgorde

Elke regel is een afgerond stuk: kort ontwerp, bouwen, tests, controle op 375 breed, onafhankelijke review, lokaal committen, één regel in `docs/STATUS.md`. Dan door naar de volgende, zonder te wachten. Lesstof loopt er steeds naast via de redactielijn.

1. **Release A:** de stand met de anti-grindregels, de bewaarde pogingen, de stijl en de scènespeler (het proefhoofdstuk nog onzichtbaar), na de codereview.
2. **Het proefhoofdstuk** door de review tot "goed", in `content/`, zichtbaar. Dan ijkmoment G1 en **release B**.
3. **De redactielijn in bedrijf** (masterplan stap 3): lesstof los van de code, het script om uit te brengen, en doorschrijven: eerst de overige hoofdstukken van thema 1, dan rekenscènes voor de onderwerpen die er zijn, dan de eerste twintig lessen algemene ontwikkeling. Voorraad: twee weken.
4. **De route met tijd** op het bestaande scherm Route: blokken met duur, vier examendata, tempo, "wat als" (masterplan E5, M10, N-M8).
5. **De motor verder langs het didactisch plan**, in deze volgorde: een woord aantikken is een keuze (N-M1); soorten sommen mengen (R-M3); zelf maken zwaarder dan kiezen (N-M2); de trede per regel (M5, N-M4); grammatica korter gespreid (N-M3); punten alleen achteraf (MO-M2); sneller bijsturen in de eerste twaalf weken (MO-M6); gedrag meten (MO-M4); de vier strengen (M6, N-M6); Engels gescheiden en via de steuntaal (E-M1, E-M2).
6. **Werkvormen** (masterplan stap 6): opnemen en terugluisteren; de luistertekst en de examenvorm; schatten op de getallenlijn, de strook en de verhoudingstabel als vraag; rekenen in stappen; slepen; daarna de spellen.
7. **Tegels voor rekenen en Engels** op Vandaag, met de leerlijn per onderwerp.
8. **Fout melden** in de app, en de eerste trede van Vraag het.
9. **De kaart en het album** naast het huidige thuisscherm, met de schakelaar.
10. **Toetsen die bijsturen** (masterplan stap 8) en de vierwekelijkse toets per examenonderdeel.
11. **Het scherm Ontdek** voor algemene ontwikkeling, met kaart en tijdlijn.
12. **Het pakket voor het scherm van de begeleider.**

Een release volgt na stuk 1 en 2, en daarna telkens als er een afgerond stuk ligt dat de leerder iets oplevert, hooguit één keer per dag.

## Uitbrengen

De bouwsessie zet een stand klaar en meldt dat aan de ontwerpsessie met de commit. De ontwerpsessie controleert zelf en pusht alleen als alles hieronder klopt:

1. Niets ongecommit; `CACHE` in `sw.js` hoger dan de versie die live staat.
2. Alle `tools/test-*.mjs` groen, door de ontwerpsessie zelf gedraaid; de ervaringstest zonder FOUT, behalve H1 tot stap 9.
3. In `docs/STATUS.md` staat voor deze stand: de onafhankelijke codereview met de uitkomst en wat ermee gedaan is, en de controle in de browser op 375 breed.
4. Verandert de opslag: de migratie voegt alleen toe, maakt vooraf een reservekopie en is getest tegen de vorm die live staat.
5. Nieuwe lesstof heeft de poort gehaald en een review "goed".
6. De wijzigingen ten opzichte van wat live staat bevatten geen privégegevens: geen namen, paden van de computer, links naar privédocumenten, koppelcodes of sleutels.
7. Niets wat werkt is weggehaald zonder dat het in dit document of het masterplan staat.

Na de push opent de ontwerpsessie de live versie, controleert dat ze laadt zonder fouten, en schrijft in `docs/STATUS.md` wat er live staat. Gaat er iets mis, dan wordt de vorige stand teruggezet met een nieuwe commit en een hogere versie; nooit met een herschreven geschiedenis.

## Hoe de twee sessies samenwerken

- De bouwsessie werkt de volgorde af en stopt niet om op een akkoord te wachten. Een vraag over een eis gaat naar de ontwerpsessie; tot het antwoord er is, werkt de bouwsessie door aan het volgende stuk.
- De bouwsessie meldt zich bij de ontwerpsessie op drie momenten: een stand die uitgebracht kan worden, een ijkmoment (G1 tot G5), en iets uit "Wat bij de eigenaar blijft".
- De ontwerpsessie antwoordt, controleert en brengt uit, en levert verder alleen wat de bouwsessie nodig heeft om door te kunnen. Zij leest bij elk ijkmoment de volledige tekst van de zwaarst wegende studies van één onderdeel en werkt de onderbouwing bij.
- Wat er besloten en uitgebracht is, staat in `docs/STATUS.md` onder een kopje met de datum, zodat de eigenaar het in één keer kan lezen.
