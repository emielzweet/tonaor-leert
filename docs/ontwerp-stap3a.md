# Ontwerp stap 3a: lesstof los van de code, en uitbrengen

Stand: 15 november 2026. Werkorder stap 3, eerste deel; `automatische-redactie.md`, "Lesstof los van de code" en de lijn stap 6.

## Waarom

Nu staat elk pakket in de app zelf (`BUILTIN` in `index.html` en `SHELL` in `sw.js`). Elke nieuwe les is dan een nieuwe versie van de app. De redactielijn moet lesstof kunnen uitbrengen zonder de code te raken, en de app moet daarbij blijven werken zoals nu.

## Wat er verandert

1. **De index `content/index.json`:** `{ "v": 1, "packs": ["content/<id>.json", …] }`. Hierin staan de pakketten die niet ingebouwd zijn: de hoofdstukken. De app accepteert alleen paden van de vorm `content/<kleine letters, cijfers, streepjes>.json` op het eigen adres, hooguit 200 stuks. Een ander pad wordt overgeslagen.
2. **Ingebouwd blijft de basis:** `rk-1`, `nl-t1`, `nl-basis`, `en-t1` en de drie uitlegpakketten, zoals nu in `BUILTIN` en `SHELL`. `nl-dokter` gaat naar de index.
3. **Laden (`loadPacks`):** eerst de index (zelfde tijdslimiet en terugval op de cache als een pakket), dan de ingebouwde pakketten en de pakketten uit de index samen. Elk pakket gaat langs `pakketcheck`, en een hoofdstuk ook langs `checkChapter`, zoals nu. Ontbreekt de index of is hij onleesbaar, dan laadt de app alleen de basis en meldt niets: zonder hoofdstukken werkt de app gewoon. Een pakket uit de index dat niet laadt, wordt gemeld zoals een ontbrekend ingebouwd pakket.
4. **Offline:** de index staat in `SHELL`. Pakketten uit de index komen in de cache zodra ze één keer met verbinding zijn opgehaald (de service worker bewaart elk geslaagd antwoord van het eigen adres).
5. **Uitbrengen (`node redactie/uitbrengen.mjs`, met `--droog` om alleen te controleren):**
   - weigert als er iets niet gecommit is (behalve de map `redactie/uit/`, die niet in git staat);
   - weigert als de commits sinds wat live staat iets anders raken dan `content/*.json` en `redactie/productielijst.json`;
   - weigert als een pakket in `content/` niet in `BUILTIN` en niet in de index staat, of als de index een pakket noemt dat er niet is;
   - draait `redactie/controleer.mjs` op elk gewijzigd pakket (nul fouten; een hoofdstuk dus ook met een review "goed");
   - draait alle `tools/test-*.mjs`;
   - pusht dan naar `main` en schrijft één regel in `redactie/uit/logboek.txt` (niet in git).
   Een wijziging aan de code gaat nooit via dit script.

## Wat de leerder merkt

Niets, behalve dat nieuwe hoofdstukken voortaan zonder appversie verschijnen. De opslag verandert niet. De koppeling verandert niet. De les van `test-les` verandert niet.

## Wat kan breken, en hoe het getest wordt

- Een hoofdstuk valt weg als de index niet laadt: alleen de proefonderdelen, en alleen tot de volgende start met verbinding. Getest in `test-pakket` (index ontbreekt; index met een vreemd pad; pakket uit de index ontbreekt).
- Een pakket uit de index dat een `also` heeft naar een basispakket: dat werkt, want de basis laadt altijd mee.
- `BUILTIN` = `SHELL` blijft gelden voor de basis; nieuwe test: elk pakket in `content/` staat in `BUILTIN` of in de index.

## Eisen

Masterplan stap 3 (redactielijn in bedrijf); `automatische-redactie.md` (lesstof uitbrengen zonder de eigenaar, na de poorten); werkorder "Uitbrengen", poorten 1 tot 8: het script controleert 1, 2 en 5 zelf; 6 (privacy) en 7 (trucs) gelden voor lesstof via de review; 3, 4 en 8 gaan over code en komen daarom niet via dit script.
