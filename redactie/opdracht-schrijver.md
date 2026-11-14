# Opdracht voor de schrijver van een hoofdstuk

Je schrijft één hoofdstuk lesstof voor een leer-app Nederlands voor volwassen anderstaligen (steuntalen Thais en Engels). Je levert precies één bestand: `redactie/uit/<id>.json`. Je wijzigt geen andere bestanden.

## Lees eerst

1. `docs/scenes.md`: het formaat van een scène en de tekencatalogus.
2. `docs/voorbeeld-scene.json`: één uitgewerkte scène; neem vorm en toon over.
3. `docs/kwaliteitskader.md`: de eisen aan woorden, uitleg en oefeningen.
4. De regel van dit hoofdstuk in `redactie/productielijst.json`.

## Het bestand

```json
{ "format": 1, "id": "…", "type": "hoofdstuk", "version": 1, "order": 30, "requires": ["nl-t1", "nl-basis", "rk-1"],
  "place": "…", "learn": "nl", "level": "…", "goals": ["…"],
  "title": { "nl": "…", "th": "…", "en": "…" },
  "items": [ … ], "scenes": [ … ] }
```

- `order`, `requires`, `type` en `version` zijn nodig om het pakket in de app te laden. `requires` noemt de pakketten in `content/` waarvan je items gebruikt.
- `goals` (bij het pakket en bij elke scène Nederlands): de eindtermen die het dient. Zolang `docs/eindtermen.md` er niet is, kies uit deze voorlopige lijst: `nt2-I-lezen`, `nt2-I-luisteren`, `nt2-I-spreken`, `nt2-I-schrijven`, `nt2-I-woorden`, `nt2-I-taal` (grammatica), `rekenen-2F-getallen`, `rekenen-2F-verhoudingen`, `rekenen-2F-meten`, `rekenen-2F-verbanden`, `kennis-nederland`.
- `items`: 20 tot 32 woorden en vaste zinnen, plus de regels en vaardigheden van het hoofdstuk.
  - Woord: `{ "id", "kind": "word", "w", "art": "de" | "het", "tr": { "th", "en" }, "def", "ex", "gap" }`. Zonder lidwoord (werkwoord, bijvoeglijk naamwoord): laat `art` weg. `def` is een omschrijving in eenvoudig Nederlands die het woord zelf niet gebruikt. `ex` is een nieuwe voorbeeldzin met het woord, een andere dan in de scènes. `gap` is weer een andere zin met precies één `___` op de plek van het woord, die niet met `___` begint en met een leesteken eindigt; bij een woord met lidwoord staat het lidwoord zichtbaar vlak voor het gat (`De ___ is vol.`).
  - Vaste zin: zelfde velden, `"kind": "phrase"`, zonder `art`, ook met `gap`.
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
- **Werkvormen (masterplan C2, C3; `docs/scenes.md`, "Werkvormen, hints en de zwaardere vorm"):** een vraag kan `choose`, `hear` (met `say`), `type`, `number`, `hear-type` (met `say`), `complete` (zin afmaken, met `answer`) zijn, of een bestaande oefenvorm met `data` zoals in `docs/pakketformaat.md`: `build`, `gap`, `listen`, `money`, `clock`, `discount` (geld, klok en korting ook met `gen`). Zo'n oefenvorm heeft ook `items`, `why` en bij voorkeur `err`. Nog niet in een scène: `own`, `match`, `spot`, `dictee`, `mc`. Per scène minstens zes verschillende werkvormen; nooit drie keer achter elkaar dezelfde vorm (een gesprek en een lees- of luistertekst tellen als één blok). Per hoofdstuk minstens twaalf werkvormen.
- **Per hoofdstuk verplicht:** een leestekst (`read`) met vijf tot tien vragen in tekstvolgorde (geheel, detail, waarom, toepassen of woord); een luistertekst (`listen`, met `say` en de vragen); een spreekopdracht (`speak` met `items`, `ask`, `model` en `checklist`); een spel (`game` met `"kind": "dehet"` en `items`: woorden met de of het); schrijven (`make`); rekenen in de situatie (de rekenscène met `number`, `money`, `clock` of `discount`).
- **Hint in twee stappen (A6):** elke vraag waarin de leerder zelf typt (`type`, `hear-type`, `complete`) heeft `hint`: twee Teksten, eerst een kleine, dan een grotere aanwijzing. Niet in de instap en niet in de controle.
- **Elke vraag bij een lees- of luistertekst heeft `why`.** Een stap `explain` noemt alleen een uitleg die bestaat in `content/uitleg-*.json`.
- **Zwaardere vorm (B4):** geef een keuzevraag waar het kan ook `answer` (het goede antwoord als tekst om te typen); in de zwaardere vorm wordt het dan een typvraag.
- **Bronnen** bij de kennisles: `sources: [{ "url": "https://…", "title": "…" }]`.
- **Thais:** natuurlijk, beleefd en in Thais schrift. Vertaal de betekenis, niet woord voor woord. Nederlandse voorbeeldwoorden in een Thaise uitleg blijven Nederlands.

## Klaar

Draai `node redactie/controleer.mjs redactie/uit/<id>.json` tot er nul fouten zijn. Waarschuwingen mogen blijven staan als je ze hebt bekeken. Meld aan het eind: het aantal woorden, wat je niet zeker weet (vooral in het Thais en in de kennisles), en waar het formaat tekortschoot.
