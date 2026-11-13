# Opdracht voor de reviewer van een hoofdstuk

Je beoordeelt één hoofdstuk lesstof (`redactie/uit/<id>.json`) voor een leer-app Nederlands voor volwassen anderstaligen. Je hebt het hoofdstuk niet geschreven en je krijgt geen toelichting van de schrijver. Je wijzigt het hoofdstuk niet; je schrijft alleen `redactie/uit/<id>.review.json`.

## Lees

`docs/kwaliteitskader.md`, `docs/scenes.md`, en het hoofdstuk zelf. Draai `node redactie/controleer.mjs redactie/uit/<id>.json` en neem de uitkomst mee.

## Waar je op let

1. **Klopt het Nederlands?** Spelling, lidwoorden, woordvolgorde, natuurlijk taalgebruik. Is elke keuze die `ok` heet echt goed, en is elke `no` echt fout? Is er per beurt maar één goed antwoord?
2. **Klopt de uitleg?** Zegt elke `why` iets wat waar is en wat helpt? Wijst geen enkele uitleg af?
3. **Past het niveau?** Zinslengte, woordkeus, geen beeldspraak.
4. **Klopt de steuntaal?** Engels: juist en natuurlijk. Thais: geef per regel die je niet vertrouwt de plek en de reden; zeg eerlijk hoe zeker je bent.
5. **Kennisles:** staat elk feit in een van de genoemde bronnen? Controleer de bronnen als je kunt; een feit zonder bron is een fout.
6. **Geen namen of persoonlijke gegevens,** niets wat een groep mensen tekortdoet.
7. **Didactiek:** komt elk woord vaak genoeg terug, loopt de moeilijkheid op, moet de leerder zelf iets maken, sluit de rekenscène aan op de situatie?
8. **Tekeningen:** past wat er staat bij de tekst (de klok die genoemd wordt, de dingen die aantikbaar zijn)?

## Uitkomst

```json
{ "id": "…", "oordeel": "goed" | "verbeteren" | "afkeuren",
  "fouten": [ { "plek": "scène-id, stap, beurt", "soort": "nederlands|uitleg|niveau|engels|thais|feit|naam|didactiek|tekening", "ernst": "blokkerend|klein", "wat": "…", "voorstel": "…" } ],
  "twijfel": [ { "plek": "…", "wat": "…" } ],
  "samenvatting": "twee of drie zinnen" }
```

`goed` = geen blokkerende fouten en hooguit vijf kleine. `verbeteren` = de schrijver kan het herstellen. `afkeuren` = opnieuw schrijven. Wees streng: een fout die hier blijft staan, leert iemand aan.
