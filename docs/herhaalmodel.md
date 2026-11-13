# Ontwerp fase 3: het herhaalmodel laten kloppen

Status: **akkoord van de eigenaar op 13 november 2026** (alle vier besluiten volgens advies, zie sectie 14). Bouw gestart. Hoort bij `docs/bouwplan.md` (fase 3) en lost issues #28 en #29 op.

Doel: de les volgt wat de leerder bijna vergeten is, elke ronde is anders, en elk onderdeel kan in volle bloei komen.

## 1. Wat er nu misgaat

Vastgesteld in de code (`index.html`, `content/*.json`):

| Wat | Gevolg |
|---|---|
| Alleen woorden en vijf rekenvaardigheden hebben een herhaalitem (`S.items`). Regels (`nl.regel.plek2`, `nl.regel.heb`, `en.regel.s`) en klanken staan wel in de pakketten, maar worden niet ingepland. | Grammatica en uitspraak komen terug omdat ze in de vaste les staan, niet omdat ze bijna vergeten zijn. |
| Doorgroeien boven 9 dagen vraagt drie verschillende oefenvormen (`review()`), maar woorden hebben er twee, Engelse woorden en rekenvaardigheden één of twee. | Niets kan bloeien; alles komt elke 9 dagen terug en de stapel groeit (#28). |
| De les is een vaste lijst in het pakket (`lesson`): steeds dezelfde kaart, dezelfde gatzin, hetzelfde dictee, dezelfde sommen. | Na ongeveer een week is de les op (#29). |
| Een uitgewerkt voorbeeld bekijken telt als goed opgehaald (`review('r-10',true,'voorbeeld')`). | De app denkt dat iets gekend is dat alleen bekeken is. |
| Bij veel fouten verschijnt alleen een melding. | De moeilijkheid past zich niet aan. |
| De startmeting markeert hooguit drie woorden als bekend. | De uitslag bepaalt bijna niets. |

## 2. Uitgangspunten

- **Ophalen boven herkennen boven bekijken.** Alleen zelf ophalen (kiezen, typen, bouwen, uitrekenen) telt voor de planning. Bekijken en uitleg lezen tellen niet.
- **Spreiding en afwisseling.** Wat bijna vergeten is komt eerst; vormen wisselen af, want variatie is nodig voor beheersing.
- **Slagingskans 80 tot 90 procent.** Lager is frustrerend, hoger is te makkelijk.
- **Niets wordt afgepakt.** Bestaande voortgang blijft staan; een plant verwelkt niet en verdwijnt niet.
- **De les blijft een les:** ophalen, nieuw, oefenen, rekenen, afsluiten, met dezelfde schermen als nu. Alleen de inhoud wordt gekozen in plaats van vastgelegd.

## 3. Herhaalitems voor alle soorten

Elk onderdeel in een pakket met `kind` `word`, `rule`, `sound` of `skill` krijgt een herhaalitem in `S.items`, met dezelfde vorm als nu (`s`, `due`, `reps`, `lapses`, `forms`).

- Elke oefening heeft één **doelitem**: het eerste in `items`. `pakketcheck` eist dat `items[0]` bestaat. Alleen het doelitem krijgt een fout. De andere items krijgen bij goed alleen een poging erbij (voor `forms` en `exs`), zonder groei. Zo wordt een woord niet gestraft als de regel in dezelfde gatzin fout ging.
- Een item is **geïntroduceerd** zodra het voor het eerst in een les zat (nu alleen voor woorden via `S.introduced`; dat wordt voor alle soorten gebruikt).
- Stadia en kleuren in de tuin blijven gelijk (`stage()`: zaadje tot in volle bloei).

## 4. Bloei haalbaar maken (#28, besluit A van 13 november)

**Woorden** krijgen een derde vorm: **luisteren en typen.** De app zegt het woord (met `say()`), de leerder ziet geen tekst en typt het. Voor Engelse woorden komt er een tweede en derde vorm bij: herkennen (kiezen uit vier) en luisteren en typen.

**Andere soorten** hebben minder vormen. Voorstel: de eis wordt **"drie verschillende oefeningen of vormen"** in plaats van drie vormen. Dan telt het mee als dezelfde regel in een andere zin is geoefend.

| Soort | Vormen | Eis voor bloei (boven 9 dagen) |
|---|---|---|
| Woord (NL) | herkennen, typen, luisteren en typen | 3 vormen |
| Woord (EN) | herkennen, typen, luisteren en typen | 3 vormen |
| Regel | zin bouwen, gatzin, (later) zin afmaken en fout zoeken | 3 verschillende oefeningen, waarvan minstens één keer **zin bouwen** (productief) |
| Klank | luisteren en kiezen, luisteren en typen | 3 verschillende oefeningen, waarvan minstens één keer luisteren en typen |
| Rekenvaardigheid | opgaven met wisselende getallen (zie hieronder) | 3 verschillende varianten, waarvan minstens één zelf uitgerekend (niet het uitgewerkte voorbeeld) |

**Sommen die niet opraken.** Rekenen heeft nu één geldopgave, twee klokopgaven en drie kortingsopgaven. Daarmee is de eis niet haalbaar, en blijft de les voor rekenen gelijk. Daarom wordt een rekenopgave een recept met wisselende getallen: `gen` in het pakket, met bereiken voor prijs, percentage, munten, uur en minuut. Elke getrokken variant telt als een eigen oefening voor `exs`, met een vaste zaadwaarde, zodat dezelfde variant terug te vinden is. We beginnen met geld, klok en korting. De controle in `pakketcheck` eist dat elk bereik eindigt op nette bedragen en tijden, zoals hele of halve euro's en kwartieren.

Daarvoor houdt het item naast `forms` ook `exs` bij: de id's van de oefeningen die goed gingen (hooguit 10, de laatste blijven). Een test rekent na dat stadium 5 voor elk soort bereikbaar is met de inhoud die er nu is; waar dat niet kan, meldt de test welk pakket meer oefeningen nodig heeft.

## 5. Wat telt als ophalen

**Alleen groeien bij gespreid ophalen.** Nu geeft elk goed antwoord stabiliteit × 2,4, ook direct na elkaar. Drie goede antwoorden op één dag maken van een nieuw woord al een bloem (1 → 2,4 → 5,8 → 13,8 dagen). Dat is gestapeld oefenen, geen onthouden. Met meerdere rondes per dag gebeurt dat vaak. Regel: **de stabiliteit groeit alleen als het item aan de beurt was, of als minstens de helft van de wachttijd voorbij is.** De groei gaat naar verhouding: op de helft van de wachttijd × 1,7, aan de beurt × 2,4 (`s × (1 + 1,4 × deel van de wachttijd)`). Zonder die verhouding liet de simulatie (drie rondes per dag) volle bloei al na 12 dagen toe; met de verhouding op zijn vroegst rond dag 21 tot 23. Toegevoegd bij de bouw van stap 1.

| Gebeurtenis | Effect op het item |
|---|---|
| Eerste goede poging na de introductie | `s` = 1 (zoals nu) |
| Goed bij de eerste poging, item aan de beurt | `s` × 2,4, `due` = nu + `s` |
| Goed bij de eerste poging, tussen de halve en de volle wachttijd | `s` × 1,7 tot 2,4, naar verhouding |
| Goed, maar te vroeg (minder dan de halve wachttijd) | telt voor `forms` en `exs` en `reps`; `s` en `due` blijven gelijk |
| Goed na een hint of tweede poging | `s` gelijk, opnieuw ingepland op dezelfde wachttijd (`due` = nu + `s`) |
| Fout (alleen het doelitem) | `s` × 0,4, `lapses` + 1, vandaag nog een keer (zoals nu) |
| Uitgewerkt voorbeeld bekijken, uitleg lezen, kaart lezen | alleen geïntroduceerd; telt niet als goed |
| Controlevraag direct na een uitleg goed | introduceert de items van die uitleg en telt voor `forms` (`check`), maar laat niet groeien |

**Wat de leerder mag verwachten.** Bij steeds goed en op tijd ophalen is een item op zijn vroegst een knop na ongeveer 3 dagen, een bloem na ongeveer 9 dagen en in volle bloei na ongeveer 23 dagen. Een fout zet het terug, en het groeit daarna weer.

**Nu al bewaren voor later** (gebouwd in een latere fase):
- per antwoord het soort fout, waar dat bekend is: lidwoord, woordvolgorde, spelling of klinkerlengte;
- per oefening een teller voor goed en fout.

Dat is de basis voor het foutprofiel, "bijna goed" en oefeningen die zichzelf melden. Die staan al in het bouwplan.

## 6. De les uit gegevens samenstellen (#29)

De samensteller (`compose`) kiest per ronde. Het recept in het pakket beschrijft de stappen en aantallen, niet de oefeningen zelf.

1. **Ophalen** (stap 1): items die aan de beurt zijn, van alle soorten, gesorteerd op **hoe ver over tijd ten opzichte van de stabiliteit** (`(nu − due) / s`, het grootst eerst): dat is "bijna vergeten". Hooguit 6.
2. **Nieuw** (stap 2): hooguit 4 nieuwe items (3 op een Engelse dag), 1 als er meer dan 25 aan de beurt zijn (bestaat al voor woorden), 0 als de slagingskans in de vorige ronde onder 65 procent lag. Een nieuwe regel of vaardigheid begint met de **uitleg** als die er is en nog niet bekeken is.
3. **Oefenen** (stap 3): voor elk item uit stap 1 en 2 een oefening in een **vorm die het item nog mist** (op weg naar bloei), anders de oefening die het langst geleden is. Afwisselend Nederlands, klanken en dictee, zoals nu.
4. **Rekenen** (stap 4): rekenvaardigheden die aan de beurt zijn, plus hooguit 1 nieuwe; per vaardigheid een opgave die nog niet (of het langst geleden) gemaakt is. Volgorde bij nieuw: eerst het uitgewerkte voorbeeld (telt niet), dan zelf.
5. **Afsluiten** (stap 5): zoals nu.

Een **tweede of derde ronde** op dezelfde dag (het weekdoel stimuleert dat) gebruikt hetzelfde recept. De keuze schuift vanzelf door, want wat net goed ging is niet meer aan de beurt. Is er weinig aan de beurt, dan krijgt de ronde meer oefenen en een extra nieuw item, zodat er altijd iets te doen is. Door de regel uit sectie 5 telt dat extra oefenen wel voor de afwisseling, maar laat het items niet te snel groeien.

**Regels voor afwisseling** (uit het onderbouwde ontwerp, met een test):
- dezelfde oefenvorm hooguit twee keer achter elkaar;
- nieuwe woorden in een blok per thema;
- grammaticakeuzes en rekensommen juist door elkaar;
- binnen één ronde één leertaal (de Engelse ronde blijft apart).

**Uitleg op de momenten dat hij nodig is:**
- **Vóór iets nieuws** (een regel of rekenvaardigheid): de uitleg, en daarna een voorbeeld dat afbouwt. Eerst volledig uitgewerkt, dan de laatste stap zelf, dan helemaal zelf. Dat geldt voor rekenen én grammatica; bij korting bestaat die vorm al (`worked`, `part`, `own`).
- **Bij de eerste fout** op een regel of vaardigheid: in de terugkoppeling een link naar de uitleg, zonder dat de leerder erheen moet.
- **Na twee fouten**: het aanbod van de uitleg (bestaat).
- **In de tuin**: elke plant van een regel of rekenvaardigheid opent de uitleg, niet alleen de hardnekkige.

**Duur van een ronde:** zie besluit 3 in sectie 14.

## 7. Bijsturen binnen een ronde

De app houdt de laatste 8 antwoorden van de ronde bij.

- **Onder 65 procent goed:** de volgende oefeningen worden een stap makkelijker. Typen wordt herkennen, luisteren en typen wordt luisteren en kiezen, en bij een regel komt eerst het voorbeeld terug. De uitleg wordt aangeboden (bestaat na twee fouten). Geen nieuw item meer in deze ronde.
- **Boven 95 procent goed:** een stap moeilijker. Herkennen wordt typen, en er mag één nieuw item bij.
- Daartussen: zoals gepland.
- De leerder ziet geen melding over "te makkelijk" of "te moeilijk"; het gebeurt stil, zonder oordeel.

## 8. Hardnekkige onderdelen

Een item dat 4 keer fout ging (`lapses ≥ 4`, nu alleen een melding aan de begeleider):

- krijgt eerst de **uitleg** (als die er is) en dan een **makkelijkere vorm**;
- telt na 3 keer achter elkaar goed weer als gewoon (`lapses` gaat dan terug naar 2, de geschiedenis in `S.log` blijft);
- staat in de tuin met een klein lampje: tikken opent de uitleg;
- blijft gemeld aan de begeleider, zoals nu.

## 9. De startmeting gebruiken

De uitslag per vaardigheid (`S.placement.lv`: woorden, grammatica, luisteren, lezen, rekenen, Engels; elk 0 tot 1):

- **Hoog (vanaf 0,67):** de basisitems van die vaardigheid worden geïntroduceerd als **plantje** (`s = 2`, aan de beurt over 2 dagen). Ze worden dus snel gecontroleerd en niet blind als gekend aangenomen. Gaat zo'n item bij de eerste controle fout, dan wordt het behandeld als nieuw: eerst aanbieden, `s` terug naar 0, en de fout telt niet mee in `lapses`. Zo wordt een woord dat nooit geleerd is niet meteen als hardnekkig geteld.
- **Midden:** gewoon beginnen, in de normale volgorde.
- **Laag (onder 0,34):** de eerste ronde begint met de uitleg van die vaardigheid, en er komen minder nieuwe items per ronde (3 in plaats van 4).
- Na fase 9 (toetsen) wordt dit herhaald met elke voortgangstoets.

## 10. Opslag en migratie

`SCHEMA` 3 → 4, stap `MIGRATE[3]`, idempotent, met reservekopie vooraf zoals elke migratie:

- Bestaande items houden `s`, `due`, `reps`, `lapses` en `forms`. Er wordt niets teruggezet.
- Items die op 9 dagen vastzaten blijven op 9 staan; ze groeien zodra de nieuwe eis gehaald wordt.
- Nieuwe items voor regels en klanken beginnen leeg. Was een regel al in een les geweest (te zien aan `S.introduced` of de log), dan wordt hij als geïntroduceerd gemarkeerd.
- `exs: []` erbij op elk item.
- De vorm `voorbeeld` blijft in `forms` staan, maar telt niet mee voor de eis.

**Bij de bouw van stap 5 (13 november 2026):** het recept kreeg de plek `practice` (`n`, `n2`, `newMax`, `kinds`). Per oefenstap komen er hooguit twee nieuwe regels of klanken (`newMax` 2) en twee nieuwe rekenvaardigheden in de eerste ronde. Wie al lessen deed, krijgt bij de migratie naar schema 4 eenmalig de regels en klanken uit de vaste les als geïntroduceerd (`f3pending`), zodat de les niet dunner wordt. Bij-items tellen niet als herhaald; de komma kreeg daarom een eigen geldopgave. Het afbouwende voorbeeld bestaat nu voor korting (`fade`); voor grammatica volgt het met de lesstof van thema 2.

**Na de review van de bouw (Fable, 13 november 2026), besluit eigenaar "alles zo":** (1) ook in volle bloei komt een onderdeel na zijn wachttijd terug; (2) het begin van de wachttijd staat op het item (`t`): na een fout is `t` = nu, zodat fout en direct goed geen groei geeft (migratie vult `t` = `due − s`); (3) een bij-item krijgt alleen de oefening (`exs`), geen vorm; (4) bijsturen onder 65% geeft ook regels en sommen een makkelijkere oefening (lagere afbouwtrede of kiesvorm); (5) de service worker bewaart alleen geslaagde antwoorden; (6) een langere startmeting staat genoteerd bij fase 9.

## 11. Wat de leerder merkt

- Elke ronde is anders: wat bijna vergeten is komt terug, ook grammatica, klanken en sommen.
- Nieuwe oefenvorm: een woord horen en opschrijven.
- Sommen komen steeds met andere bedragen en tijden.
- Kort na elkaar steeds hetzelfde goed doen laat een plant niet harder groeien; terugkomen op een volgende dag wel.
- Planten kunnen weer verder groeien en bloeien.
- Een nieuwe regel of som begint met de uitleg.
- Bij een lastige ronde wordt het vanzelf iets makkelijker; bij een makkelijke ronde iets moeilijker.

## 12. Wat kan breken, en hoe we dat afvangen

| Risico | Afvangen |
|---|---|
| Voortgang (`localStorage`) | Migratie met reservekopie, test in `tools/test-migratie.mjs`: oude opslag erin, niets verloren, alle velden er nog. |
| De les verandert | Dat is bewust. `tools/les-verwacht.json` wordt opnieuw vastgelegd met `tools/les-vastleggen.mjs`, en de commit zegt dat. Nieuwe test: twee rondes op een rij zijn verschillend, en na zeven gesimuleerde dagen is er nog nieuwe inhoud. |
| Het model gedraagt zich anders dan bedoeld | **Simulatietest:** een nagebootste leerder met 85 procent goed, 30 dagen lang, drie rondes per dag. De stapel herhalingen blijft begrensd, elk soort item bereikt stadium 5, en geen item bloeit eerder dan na ongeveer drie weken. Ook de regels voor afwisseling worden getest. |
| Het bericht aan de begeleider en de EDGE-widget | Het formaat blijft gelijk (alleen toevoegen). De tuintellingen worden hoger, omdat regels en klanken meetellen; de widget rondt af en negeert onbekende velden. |
| Luisteren en typen zonder stem (geen spraak op het toestel) | Valt terug op typen met tekst; telt dan als `typen`. |
| Te weinig oefeningen in een pakket voor de nieuwe eis | De test meldt welk pakket meer nodig heeft; de lesstof van thema 2 vult dat aan. |

## 13. Bouwen in stappen (elk apart te committen en te testen)

1. Herhaalitems voor regels, klanken en vaardigheden, het doelitem, `exs`, migratie 3 → 4, wat telt als ophalen met de regel voor gespreid ophalen, en de simulatietest (secties 3, 5, 10 en 12).
2. De derde vorm voor woorden: luisteren en typen; herkennen en luisteren voor Engels (sectie 4).
3. Sommen die niet opraken: `gen` voor geld, klok en korting (sectie 4).
4. De nieuwe eis voor bloei, met de test dat stadium 5 bereikbaar is.
5. De samensteller kiest op bijna vergeten, nieuwe recepten, regels voor afwisseling, uitleg met een afbouwend voorbeeld vóór iets nieuws (sectie 6).
6. Bijsturen binnen de ronde, hardnekkige onderdelen, en uitleg bij de eerste fout en in de tuin (secties 6, 7 en 8).
7. De startmeting gebruiken (sectie 9).
8. Review door een aparte reviewer, controle in de browser op 375 px, en daarna voorleggen voor de release.

Geschatte omvang: drie tot vier werksessies. Na stap 5 is het grootste probleem (#29, de les is na een week op) opgelost.

## 14. Besluiten van de eigenaar (13 november 2026: akkoord op 1 voorstel, 2 voorstel, 3 B, 4 akkoord)

1. **De eis voor bloei** buiten woorden: "drie verschillende oefeningen, met minstens één productieve" (dit voorstel), of strikt drie vormen (dan zijn er voor regels en klanken eerst nieuwe vormen nodig, zoals fout zoeken en luisteren en typen).
2. **Startmeting:** hoog gescoorde onderdelen als plantje met snelle controle, en een fout bij de eerste controle telt niet als hardnekkig (dit voorstel). Of als bekend aannemen: sneller vooruit, maar gaten blijven onopgemerkt.
3. **Duur van een ronde:**
   - **A.** Ongeveer 25 minuten per ronde, zoals nu.
   - **B.** De eerste ronde van de dag heeft de volle vijf stappen (ongeveer 25 minuten). Latere rondes zijn kort: ophalen plus oefenen, 12 tot 15 minuten.

   B is het advies van de review en ook mijn advies. Bij een weekdoel van 10 uur passen korte rondes in een pauze, geven ze vaker een afgerond moment, en spreiden ze het ophalen over de dag.
4. **Akkoord dat de les bewust verandert:** `test-les` wordt opnieuw vastgelegd.

Review door de ontwerpsessie op 13 november 2026 verwerkt: gespreid ophalen, het doelitem per oefening, sommen die niet opraken, een productieve vorm voor regels, uitleg op meer momenten, regels voor afwisseling, de startmeting zonder valse hardnekkigheid, gegevens bewaren voor later, en de simulatietest. Doorgeschoven naar fase 9: "zeker maar toch fout krijgt voorrang".
