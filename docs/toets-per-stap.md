# Toets per stap: klopt het met het onderzoek, de methodiek en de leerervaring?

Stand: 13 november 2026. Aanleiding: het tempo van 4 nieuwe woorden per ronde zat al in de eerste versie en is door alle fasen heen meegenomen zonder het te leggen naast het onderbouwde ontwerp (ongeveer 8 per lesdag bij een half uur per dag) of de leerroute. De tests waren groen; de leerervaring klopte niet. Deze toets hoort bij elke stap, naast de tests.

## Vóór het bouwen (in het ontwerp van de stap)

1. **Welke regel dient dit?** Noem de plek in het onderbouwde ontwerp, `docs/kwaliteitskader.md`, `docs/leerroute.md` of `docs/uitleg.md`. Staat er niets over, zeg dat dan en onderbouw de keuze apart.
2. **Elk getal heeft een herkomst.** Voor elk getal in de stap (nieuwe onderdelen per dag, lengte van een ronde, wachttijden, drempels, aantallen oefeningen): de bron, of het woord "aanname" met de redenering. Ook getallen die al in de code stonden: overnemen is geen onderbouwing.
3. **Reken een week door voor de echte situatie.** Uitgaande van het weekdoel (nu 10 uur) en de lesstof die er is: hoeveel nieuwe onderdelen per dag, hoeveel herhalingen per dag, hoeveel verschillende oefeningen per ronde, en op welke dag is de lesstof op? Schrijf uit wat de leerder ziet in ronde 1, 2 en 3 van dag 1 en van dag 7.
4. **Is er genoeg lesstof voor deze stap?** Kijk in de dekkingstabel (`docs/STATUS.md`). Een motor zonder lesstof levert herhaling op, geen leren.
5. **Kan er bijgestuurd worden?** Wat kan de leerder of de begeleider instellen, binnen welke grenzen, en wat ziet de begeleider ervan?
6. **Wat neemt het weg of verzwakt het?** Benoem het als een stap een oefenvorm, herhaling of terugkoppeling vermindert.

## Vóór de release (leerervaring, niet alleen tests)

7. **Speel het zelf.** Drie rondes achter elkaar in de browser op 375 px, als de leerder, met een opslag die lijkt op de echte (aantal dagen, aantal woorden). Noteer: wat kwam te vaak terug, wat was saai, waar bleef het stil, waar klopte een tekst niet.
8. **Ervaringstest in de testreeks.** Een nagebootste week met het echte weekdoel. De test faalt als:
   - hetzelfde onderdeel vaker dan twee keer in één ronde komt;
   - dezelfde oefenvorm vaker dan twee keer achter elkaar komt;
   - een ronde minder dan acht verschillende onderdelen heeft terwijl er lesstof beschikbaar is;
   - er op een dag geen nieuw onderdeel is terwijl de stapel herhalingen klein is en er nog lesstof ligt;
   - de lesstof binnen de week op is (dan meldt de test welk pakket meer nodig heeft).
9. **Een onafhankelijke review langs deze lijst,** niet alleen langs de code.

## Na de release

10. **Vraag het de leerder.** Aan het eind van een ronde één tik: te makkelijk, goed of te moeilijk; en één tik: leuk of saai. De uitkomst gaat mee in het bericht aan de begeleider en in `docs/STATUS.md`.
11. **Kijk na een week naar wat er gebeurd is:** minuten, rondes per dag, aandeel goed, wat het vaakst fout ging, wat het vaakst terugkwam. Leg dat naast punt 3. Wijkt het af, dan is dat de volgende stap.

## Vaste waarden en hun herkomst

| Waarde | Stand | Herkomst |
|---|---|---|
| Nieuwe woorden | 16 per dag (keuze 8, 16, 24); woorden die bij de eerste vraag al goed zijn tellen niet mee | Het onderbouwde ontwerp: ongeveer 8 per lesdag bij een half uur per dag; het weekdoel is nu ruim tweeënhalf keer zo groot. Elk nieuw woord vraagt in de eerste maand zes tot acht herhalingen: bij 16 per dag ongeveer 110 tot 130 herhalingen per dag, ruwweg een half uur. Bij 24 per dag bijna een uur. Aanname, te toetsen met punt 11 |
| Rem op nieuw | Geen nieuwe woorden bij meer dan 40 herhalingen die aan de beurt zijn | Onderbouwd ontwerp: minder nieuw bij een grote stapel (daar 25, bij een half uur per dag) |
| Slagingskans | 80 tot 90 procent | Onderbouwd ontwerp (Wilson e.a. 2019) |
| Lengte van een ronde | 12 tot 15 minuten (keuze kort, normaal, lang) | Besluit van de eigenaar bij fase 3; spreiding over de dag |
| Verdeling over de vakken | 60 procent Nederlands, 30 rekenen, 10 Engels; geen vak onder 10 procent | `docs/leerroute.md`, volgorde en prioriteit |
| Groei bij herhaling | Alleen vanaf de halve wachttijd; vroegste volle bloei na ongeveer drie weken | `docs/herhaalmodel.md`, gespreid ophalen |
