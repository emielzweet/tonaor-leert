# Opdracht voor de schrijver van een hoofdstuk

Je schrijft één hoofdstuk lesstof voor een leer-app Nederlands voor volwassen anderstaligen (steuntalen Thais en Engels). Je levert precies één bestand: `redactie/uit/<id>.json`. Je wijzigt geen andere bestanden.

## Lees eerst

1. `docs/scenes.md`: het formaat van een scène en de tekencatalogus.
2. `docs/voorbeeld-scene.json`: één uitgewerkte scène; neem vorm en toon over.
3. `docs/kwaliteitskader.md`: de eisen aan woorden, uitleg en oefeningen.
4. De regel van dit hoofdstuk in `redactie/productielijst.json`.

## Het bestand

```json
{ "format": 1, "id": "…", "place": "…", "learn": "nl", "level": "…",
  "title": { "nl": "…", "th": "…", "en": "…" },
  "items": [ … ], "scenes": [ … ] }
```

- `items`: 20 tot 32 woorden en vaste zinnen, plus de regels en vaardigheden van het hoofdstuk.
  - Woord: `{ "id", "kind": "word", "w", "art": "de" | "het" | "", "tr": { "th", "en" }, "def", "ex" }`. `def` is een omschrijving in eenvoudig Nederlands die het woord zelf niet gebruikt. `ex` is een nieuwe voorbeeldzin met het woord, een andere dan in de scènes.
  - Vaste zin: zelfde velden, `"kind": "phrase"`, zonder `art`.
  - Regel of vaardigheid: `{ "id", "kind": "rule" | "skill", "title": Tekst }`.
- `scenes`: vijf scènes Nederlands (`n` 1 tot 5), één rekenscène (`subject: "rk"`) en één kennisles (`subject: "kn"`), volgens de productielijst.

## Regels

- **Geen namen** van personen, plaatsen, bedrijven of merken. Rollen heten naar wat ze doen (de assistent, de dokter). Geen geslacht waar het niet hoeft.
- **Niveau:** korte zinnen, alledaagse woorden, geen beeldspraak. Wat de ander zegt: hooguit 15 woorden per beurt.
- **Elke keuze heeft een reden** (`why`) in drie talen, ook de goede. De reden legt uit, wijst nooit af. `near` is bijna goed: zeg wat er goed is en wat er mist.
- **De goede keuze staat niet steeds op dezelfde plek.**
- **Diepte:** volg de vaste opbouw in `docs/scenes.md`, Diepte en diagnose. Een scène Nederlands heeft minstens 18 antwoordmomenten: een `quiz` met role `instap` (3 tot 5 vragen), kijken, een `quiz` met role `ophalen` (4 tot 6), een gesprek van minstens vier beurten, een `rule` met een uitgewerkt voorbeeld en drie tot vier oefeningen waarin de hulp afbouwt (`help` 2, 1, 0), een `slot`, `do`, vanaf scène 3 `make`, een `extra` voor het soort fout dat in deze scène het meest voor de hand ligt, en een `quiz` met role `controle` (precies twee vragen, zonder hint). Een rekenscène en een kennisles hebben minstens 8 antwoordmomenten en een controle.
- **Elke foute keuze heeft een `err`** uit de lijst in `docs/scenes.md`. Kies foute antwoorden die een echte, veelgemaakte fout zijn (voor een leerder met een Aziatische moedertaal: lidwoord, woordvolgorde, werkwoordsvorm, tijd), geen onzin.
- **Vragen herhalen elkaar niet:** elke vraag vraagt iets anders of in een andere vorm (horen, kiezen, typen).
- **Opbouw over het hoofdstuk:** scène 1 en 2 kiezen; scène 3 en 4 hebben een stap `make` (zin afmaken of bericht met een schrijfkader, een voorbeeldantwoord en een checklist); scène 5 gebruikt minstens 70 procent van alle woorden opnieuw en heeft ook een `make`.
- **Elk woord komt in minstens twee scènes voor** (in `targets`, in `items` van een stap, of als aantikbaar ding in de tekening).
- **Scène 2 tot 5 hebben een stap `slot`** voor herhaling.
- **Tekeningen:** alleen achtergronden en dingen uit de catalogus; plekken binnen 340 bij 214; elk aantikbaar ding heeft een `label` in drie talen en een `item`.
- **De kennisles leert één specifiek ding,** geen overzicht: de titel is een vraag die nieuwsgierig maakt, de tekst gaat de diepte in en eindigt met iets om na te vertellen. Geen vast rijtje onderdelen, en de vorm mag per les anders zijn (zie `docs/algemene-ontwikkeling.md`: het enige wat vastligt, en de voorraad vormen).
- **De kennisles** bevat alleen feiten die je met een bron kunt staven. Zet de bronnen (adres en titel) in `sources` bij de stap `read`. Weet je iets niet zeker, laat het weg.
- **Thais:** natuurlijk, beleefd en in Thais schrift. Vertaal de betekenis, niet woord voor woord. Nederlandse voorbeeldwoorden in een Thaise uitleg blijven Nederlands.

## Klaar

Draai `node redactie/controleer.mjs redactie/uit/<id>.json` tot er nul fouten zijn. Waarschuwingen mogen blijven staan als je ze hebt bekeken. Meld aan het eind: het aantal woorden, wat je niet zeker weet (vooral in het Thais en in de kennisles), en waar het formaat tekortschoot.
