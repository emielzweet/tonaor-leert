# Ontwerp fase 3: het herhaalmodel laten kloppen

Status: **ontwerp, wacht op akkoord van de eigenaar.** Hoort bij `docs/bouwplan.md` (fase 3) en lost issues #28 en #29 op.

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

- Een oefening met `items: [...]` werkt bij een antwoord al haar items bij, met de vorm van de oefening (`build`, `gap`, `listen`, `money`, `clock`, `discount`, …).
- Een item is **geïntroduceerd** zodra het voor het eerst in een les zat (nu alleen voor woorden via `S.introduced`; dat wordt voor alle soorten gebruikt).
- Stadia en kleuren in de tuin blijven gelijk (`stage()`: zaadje tot in volle bloei).

## 4. Bloei haalbaar maken (#28, besluit A van 13 november)

**Woorden** krijgen een derde vorm: **luisteren en typen.** De app zegt het woord (met `say()`), de leerder ziet geen tekst en typt het. Voor Engelse woorden komt er een tweede en derde vorm bij: herkennen (kiezen uit vier) en luisteren en typen.

**Andere soorten** hebben minder vormen. Voorstel: de eis wordt **"drie verschillende oefeningen of vormen"** in plaats van drie vormen. Dan telt het mee als dezelfde regel in een andere zin is geoefend.

| Soort | Vormen | Eis voor bloei (boven 9 dagen) |
|---|---|---|
| Woord (NL) | herkennen, typen, luisteren en typen | 3 vormen |
| Woord (EN) | herkennen, typen, luisteren en typen | 3 vormen |
| Regel | zin bouwen, gatzin, controlevraag bij de uitleg, (later) fout zoeken | 3 verschillende oefeningen, waarvan minstens 2 vormen |
| Klank | luisteren en kiezen, luisteren en typen | 3 verschillende oefeningen |
| Rekenvaardigheid | per vaardigheid de opgaven in het pakket (geld, klok, korting, …) | 3 verschillende opgaven |

Daarvoor houdt het item naast `forms` ook `exs` bij: de id's van de oefeningen die goed gingen (hooguit 10, de laatste blijven). Een test rekent na dat stadium 5 voor elk soort bereikbaar is met de inhoud die er nu is; waar dat niet kan, meldt de test welk pakket meer oefeningen nodig heeft.

## 5. Wat telt als ophalen

| Gebeurtenis | Effect op het item |
|---|---|
| Goed bij de eerste poging | stabiliteit × 2,4 (zoals nu) |
| Goed na een hint of tweede poging | stabiliteit gelijk, wel `reps` + 1 |
| Fout | stabiliteit × 0,4, `lapses` + 1, vandaag nog een keer (zoals nu) |
| Uitgewerkt voorbeeld bekijken, uitleg lezen, kaart lezen | alleen geïntroduceerd; telt niet als goed |
| Controlevraag bij een uitleg goed | telt als één goede poging met vorm `check`, voor de items van die uitleg |

## 6. De les uit gegevens samenstellen (#29)

De samensteller (`compose`) kiest per ronde. Het recept in het pakket beschrijft de stappen en aantallen, niet de oefeningen zelf.

1. **Ophalen** (stap 1): items die aan de beurt zijn, van alle soorten, gesorteerd op **hoe ver over tijd ten opzichte van de stabiliteit** (`(nu − due) / s`, het grootst eerst): dat is "bijna vergeten". Hooguit 6.
2. **Nieuw** (stap 2): hooguit 4 nieuwe items (3 op een Engelse dag), 1 als er meer dan 25 aan de beurt zijn (bestaat al voor woorden), 0 als de slagingskans in de vorige ronde onder 65 procent lag. Een nieuwe regel of vaardigheid begint met de **uitleg** als die er is en nog niet bekeken is.
3. **Oefenen** (stap 3): voor elk item uit stap 1 en 2 een oefening in een **vorm die het item nog mist** (op weg naar bloei), anders de oefening die het langst geleden is. Afwisselend Nederlands, klanken en dictee, zoals nu.
4. **Rekenen** (stap 4): rekenvaardigheden die aan de beurt zijn, plus hooguit 1 nieuwe; per vaardigheid een opgave die nog niet (of het langst geleden) gemaakt is. Volgorde bij nieuw: eerst het uitgewerkte voorbeeld (telt niet), dan zelf.
5. **Afsluiten** (stap 5): zoals nu.

Een **tweede of derde ronde** op dezelfde dag (het weekdoel stimuleert dat) gebruikt hetzelfde recept: de keuze schuift vanzelf door, want wat net goed ging is niet meer aan de beurt. Is er weinig aan de beurt, dan krijgt de ronde meer oefenen en een extra nieuw item, zodat er altijd iets te doen is.

De duur blijft ongeveer 25 minuten per ronde; de stappen op Vandaag tonen de verwachte minuten.

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

- **Hoog (vanaf 0,67):** de basisitems van die vaardigheid worden geïntroduceerd als **plantje** (`s = 2`, aan de beurt over 2 dagen). Ze worden dus snel gecontroleerd en niet blind als gekend aangenomen.
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

## 11. Wat de leerder merkt

- Elke ronde is anders: wat bijna vergeten is komt terug, ook grammatica, klanken en sommen.
- Nieuwe oefenvorm: een woord horen en opschrijven.
- Planten kunnen weer verder groeien en bloeien.
- Een nieuwe regel of som begint met de uitleg.
- Bij een lastige ronde wordt het vanzelf iets makkelijker; bij een makkelijke ronde iets moeilijker.

## 12. Wat kan breken, en hoe we dat afvangen

| Risico | Afvangen |
|---|---|
| Voortgang (`localStorage`) | Migratie met reservekopie, test in `tools/test-migratie.mjs`: oude opslag erin, niets verloren, alle velden er nog. |
| De les verandert | Dat is bewust. `tools/les-verwacht.json` wordt opnieuw vastgelegd met `tools/les-vastleggen.mjs`, en de commit zegt dat. Nieuwe test: twee rondes op een rij zijn verschillend, en na zeven gesimuleerde dagen is er nog nieuwe inhoud. |
| Het bericht aan de begeleider en de EDGE-widget | Het formaat blijft gelijk (alleen toevoegen). De tuintellingen worden hoger, omdat regels en klanken meetellen; de widget rondt af en negeert onbekende velden. |
| Luisteren en typen zonder stem (geen spraak op het toestel) | Valt terug op typen met tekst; telt dan als `typen`. |
| Te weinig oefeningen in een pakket voor de nieuwe eis | De test meldt welk pakket meer nodig heeft; de lesstof van thema 2 vult dat aan. |

## 13. Bouwen in stappen (elk apart te committen en te testen)

1. Herhaalitems voor regels, klanken en vaardigheden, `exs`, migratie 3 → 4, en wat telt als ophalen (secties 3, 5 en 10).
2. De derde vorm voor woorden: luisteren en typen; herkennen en luisteren voor Engels (sectie 4).
3. De nieuwe eis voor bloei, met de test dat stadium 5 bereikbaar is.
4. De samensteller kiest op bijna vergeten, nieuwe recepten, uitleg vóór iets nieuws (sectie 6).
5. Bijsturen binnen de ronde en hardnekkige onderdelen (secties 7 en 8).
6. De startmeting gebruiken (sectie 9).
7. Review door een aparte reviewer, controle in de browser op 375 px, en daarna voorleggen voor de release.

Geschatte omvang: twee tot drie werksessies. Na stap 4 is het grootste probleem (#29, de les is na een week op) al opgelost.

## 14. Besluiten voor de eigenaar

1. **De eis voor bloei** buiten woorden: "drie verschillende oefeningen" (dit voorstel), of strikt drie vormen (dan zijn er voor regels en klanken eerst nieuwe vormen nodig, zoals fout zoeken en luisteren en typen).
2. **Startmeting:** hoog gescoorde onderdelen als plantje met snelle controle (dit voorstel), of als bekend aannemen (sneller vooruit, maar gaten blijven onopgemerkt).
3. **Omvang van een ronde:** ongeveer 25 minuten, zoals nu (dit voorstel), of korter, zodat er makkelijker meerdere rondes per dag in passen.
4. **Akkoord dat de les bewust verandert:** `test-les` wordt opnieuw vastgelegd.
