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
8. **Eén goed antwoord:** ga bij elke gatzin (`gap` van een woord, een `gap`-oefening, een `complete`) en elke keuzevraag na of een ander woord uit het pakket of uit de pakketten die het nodig heeft er even goed in past. Dan rekent de app een goed antwoord fout: blokkerend bij een keuzevraag of zin bouwen, klein bij een getypt woord (zie hieronder). Herstel: een zin die maar één woord toelaat, of `also` (de woorden die ook passen, in beide richtingen). Ga ook na of twee woorden dezelfde vertaling in de steuntaal hebben (bij kiezen van Thais naar Nederlands zijn er dan twee goede antwoorden), en of een omschrijving het woord zelf gebruikt.
9. **Tekeningen:** past wat er staat bij de tekst (de klok die genoemd wordt, de dingen die aantikbaar zijn)?

## Uitkomst

```json
{ "id": "…", "oordeel": "goed" | "verbeteren" | "afkeuren",
  "fouten": [ { "plek": "scène-id, stap, beurt", "soort": "nederlands|uitleg|niveau|engels|thais|feit|naam|didactiek|tekening", "ernst": "blokkerend|klein", "wat": "…", "voorstel": "…" } ],
  "twijfel": [ { "plek": "…", "wat": "…" } ],
  "samenvatting": "twee of drie zinnen" }
```

**Foute keuzes bij herkennen (masterplan uitleg 20 en 21):** heeft een woord `wrong`, controleer dan dat elk van die woorden echt niet in de gatzin past; een `wrong` die wel past, is blokkerend (de app rekent een goed antwoord fout bij kiezen). Zonder `wrong` haalt de app foute keuzes alleen uit hetzelfde pakket: zoek botsingen dan binnen het pakket, niet meer in alle pakketten.

**Wat blokkerend is (masterplan, uitleg bij de eisen 18):** blokkerend is alleen (a) de lesstof leert iets wat niet klopt: een foute regel, vertaling, uitkomst of lidwoord; of (b) de app rekent een goed antwoord fout zonder dat de leerder er iets aan kan doen: bij kiezen en bij een zin bouwen uit blokken. Klein is: een variant die ontbreekt bij een getypt woord (daarvoor heeft de leerder de knop "Mijn antwoord is ook goed"), stijl, een vraag die beter kan. Een typvraag met meer dan twee woorden als antwoord weigert de poort al.

**Na een herstelronde** krijg je de vorige review erbij. Tel dan alleen nieuwe blokkerende fouten en terugval (iets wat goed was en nu fout is). Wat eerder als klein is aanvaard, blijft klein.

`goed` = geen blokkerende fouten; de kleine punten gaan als lijst mee naar de volgende ronde van onderhoud. `verbeteren` = er zijn blokkerende fouten die de schrijver kan herstellen. `afkeuren` = opnieuw schrijven. Wees streng op wat blokkerend is: een fout die hier blijft staan, leert iemand aan.
