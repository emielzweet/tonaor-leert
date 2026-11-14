# Bouwstenen: de kaart en de tijdlijn

Stand: 15 november 2026. Ontwerp van de ontwerpsessie, op vraag van de bouwsessie. Hoort bij `algemene-ontwikkeling.md` ("Wat ervoor nodig is") en `scenes.md`. Dient eis H6 (geen grind, afwisseling in vorm) en de vaste punten van algemene ontwikkeling: *je doet iets*, *het klopt*. Later ook voor het scherm Ontdek (stap 11), topografie en de route op de kaart.

## Wat de leerder ermee doet

- **Kaart:** een plek aantikken (*Waar ligt de Mekong?*), een gebied aantikken (*Welke provincie is dit?*), een route volgen die wordt getekend (de zijderoute), kijken waar iets vandaan komt (de aardappel: van de Andes naar Europa).
- **Tijdlijn:** gebeurtenissen leggen op een lijn met jaartallen, iets plaatsen ten opzichte van wat je al kent (*vóór of na de Tweede Wereldoorlog?*), zien hoe lang iets duurde.

Beide zijn **tekeningen** (in de catalogus van `scene.js`) die in elke stap kunnen staan, en **vormen van `do`**, met een gesloten antwoord zodat de app kan nakijken (masterplan, uitleg 16). In een les telt het niet voor het herhaalmodel (zie `algemene-ontwikkeling.md`); in een gewone scène wel, zoals elke `do`.

## De kaart

**Kaartgegevens.** Vier kaarten om mee te beginnen: `wereld`, `europa`, `azie`, `nederland` (met provincies). Bron: Natural Earth (publiek domein), de schaal 1:110m voor de wereld en 1:50m of 1:10m waar nodig voor Europa, Azië en de provincies. Een script op de computer (`tools/bouw-kaart.mjs`) maakt er per kaart één bestand van, `kaart/<naam>.json`:

- `view` (viewBox), `proj` (de projectie en haar getallen, zodat een punt in lengte- en breedtegraad omgerekend kan worden), `regions` (per gebied een id, een Nederlandse naam en één vereenvoudigd pad), `lic` (bron en licentie).
- **Id's:** landen met de ISO-code van twee letters (`TH`, `NL`, `PE`); provincies met hun Nederlandse naam in kleine letters zonder spaties (`noord-holland`). Rivieren, zeeën en bergen zijn geen gebieden maar lijnen of punten in de les zelf.
- **Projectie:** wereld equirectangulair; Europa, Azië en Nederland een kegelprojectie die op 375 breed niet vertekent. De omrekening zit in het bestand, niet in de les: een les geeft altijd lengte- en breedtegraad.
- **Grootte:** per kaart hooguit 80 kB; vereenvoudigen tot die grens. De kaarten gaan in de cache van de service worker zodra een les ze gebruikt (zoals het geluid: niet allemaal vooraf).
- Het script draait alleen bij het maken; het bronbestand gaat niet mee in de repo, wel de bron en de versie in `lic`.

**In een tekening:**

```json
{ "kind": "map", "map": "azie", "zoom": [95, 5, 110, 25],
  "hl": ["TH", "LA", "KH", "VN"],
  "pins": [{ "at": [105.8, 21.0], "label": "Hanoi" }],
  "line": { "pts": [[98.5, 33.5], [101.8, 23.5], [104.9, 11.6], [106.7, 9.6]], "label": "Mekong" } }
```

- `zoom` (lengte, breedte, lengte, breedte) knipt een stuk uit; zonder `zoom` de hele kaart. Op 375 breed past een uitsnede beter dan een wereld waar Thailand een stip is. Er is geen knijpen en schuiven: de les kiest de uitsnede, met hooguit een knop *Uitzoomen* naar de hele kaart.
- `hl` kleurt gebieden in (pastel, geen rood); `pins` zijn punten met een naam; `line` is een lijn (rivier, route, grens) die eventueel langzaam wordt getekend (`"draw": true`).
- Namen zijn pakkettekst: door `SAFE` of `esc()` zoals alle pakkettekst, en aan te tikken als moeilijk woord.

**Als vraag (`do`, vorm `map`):**

- **Gebied aantikken:** `"answer": "LA"`; elk gebied binnen de uitsnede is aantikbaar. Fout = een ander gebied; de terugkoppeling kleurt het goede gebied en noemt de naam van wat je aantikte.
- **Plek aantikken:** `"answer": [100.5, 13.75], "tol": 150` (kilometer). Goed als de tik binnen die afstand ligt. De app rekent de afstand uit en zegt die (*je zat 300 km te ver naar het noorden*): dat is zelf leerzaam.
- Elk aantikbaar gebied is minstens 24 bij 24 pixels op 375 breed; is een gebied kleiner in de gekozen uitsnede, dan weigert de poort de vraag (dan kiest de schrijver een andere uitsnede).

## De tijdlijn

**In een tekening:**

```json
{ "kind": "timeline", "from": -3000, "to": 2030, "scale": "lin",
  "marks": [{ "y": 1945, "label": "einde Tweede Wereldoorlog", "known": true }],
  "spans": [{ "from": 1568, "to": 1648, "label": "Tachtigjarige Oorlog" }] }
```

- Jaartallen als getallen; vóór het jaar 1 negatief. De app schrijft *3000 v.Chr.*
- `scale`: `lin` of `log` (voor een lijn van de oerknal tot nu: dan is de recente geschiedenis niet één stip). `log` telt terug vanaf `to`.
- `known: true` is een ankerpunt dat de leerder al kent; zo leert iemand plaatsen ten opzichte van wat er al is.
- Liggend op de telefoon? Nee: de lijn staat **rechtop** (verleden boven, nu onder), zodat hij op 375 breed lang genoeg is en de leerder kan scrollen.

**Als vraag (`do`, vorm `timeline`):**

- **Leggen:** twee tot vijf kaartjes (`cards`, elk met `y`) op de lijn zetten. Tikken op een kaartje en dan op de plek op de lijn (slepen mag ook; tikken werkt altijd). Goed is: de volgorde klopt **en** elk kaartje ligt binnen `tol` jaar (standaard: 10% van de lengte van de lijn, of zelf gegeven). Alleen de volgorde vragen kan nog steeds met zin bouwen zonder `verb`; dit is de rijkere vorm.
- **Ervoor of erna:** één kaartje, de vraag is alleen vóór of na een ankerpunt. Dat is een keuze en gaat met `quiz`.
- De terugkoppeling legt alle kaartjes op hun echte plek en laat de afstand zien.

## De poort (`pakketcheck`)

- De kaart bestaat; elk id in `hl` en elk `answer`-gebied bestaat in die kaart; elk punt ligt binnen de uitsnede; aantikbare gebieden zijn groot genoeg (zie boven).
- Op de tijdlijn ligt elk jaartal tussen `from` en `to`; kaartjes hebben verschillende `y` (anders is de volgorde niet eenduidig); `tol` is positief.
- Elk jaartal en elke plek heeft een bron in `sources` (regel "elk getal letterlijk uit de bron").

## Tekenen en stijl

In `scene.js`, als nieuwe dingen in de catalogus, met dezelfde regels: SVG, pastel, geen rood, donker en licht, rustige animatie die uit kan (de systeeminstelling *minder beweging*). Land is lichtgrijs, water lichtblauw, ingekleurde gebieden in de pastelkleuren van de app. Een naam staat niet op de kaart als de vraag erom gaat.

## Wat het raakt

- **Opslag:** niets. Een les met kaart of tijdlijn bewaart hetzelfde als nu.
- **Bestaande lessen:** aardappel, wet, Mekong en zijderoute worden bijgewerkt naar kaart of tijdlijn; de huidige volgorde-vragen mogen blijven als tweede vraag, want het zijn andere handelingen. Opnieuw door de review.
- **Geluid:** namen op de kaart en kaartjes krijgen een geluidsbestand zoals elke tekst.

## Volgorde van bouwen

1. Het script en de vier kaartbestanden (met licentie), en `map` als tekening.
2. De tijdlijn als tekening.
3. Beide als `do`-vorm, met de poort en tests (`tools/test-scenes.mjs`, en een test voor de afstand en de tolerantie).
4. De vier lessen bijwerken, review, uitbrengen.
5. Daarna mogen nieuwe lessen ze gebruiken; topografie (zoeken op de kaart met een verhaal bij elke plek) volgt dan vanzelf in de lijn.
