# Bouwontwerp werkorder stap 5, eerste deel: N-M1 en R-M3

Stand: 15 november 2026. Bouwsessie. De eerste twee eisen van stap 5 uit de werkorder. Daarna volgt ijkmoment G2 voor Nederlands, door de ontwerpsessie.

## N-M1: een woord aantikken is een keuze

Bron: `onderbouwing-nederlands.md` 2.1 en `scenes.md` ("Een woord aantikken is een keuze").

### Wat de leerder ziet

In een leestekst (ook bij een leesvraag) en in een gesprek staat een woord uit het hoofdstuk, of uit een pakket waar het op voortbouwt (`requires`), met een stippellijn eronder. Wie erop tikt, krijgt eerst drie betekenissen in de steuntaal. De juiste betekenis komt uit het woord zelf, de twee andere komen uit andere woorden van hetzelfde soort. Na een goede keuze toont de app het woord met lidwoord en betekenis, plus de omschrijving (`def`), en leest het woord voor.

### Wat de app bijhoudt (na de codereview)

- Een juiste keuze bij de eerste poging is een ontmoeting, maar alleen voor een woord dat al in de herhaling zit (`reps` > 0): een passieve review, met een logregel en zonder groei, fout of vorm.
- Een woord dat nog nieuw is, wordt niet als gezien gemarkeerd. Anders raakt het verweesd: het komt dan nooit als nieuw woord en nooit als herhaling.
- Hooguit één ontmoeting per woord per scherm. Is er eenmaal fout gekozen, dan telt het daarna niet meer.
- Een foute keuze telt niet. In een losse les en buiten `STORE` ok wordt niets bijgehouden.

### Wanneer het niet kan

- **Zonder steuntaal:** in de examenvorm, en ook waar de steuntaal bewust uit staat (moeilijk, `nosup`, instap, controle), is er niets aan te tikken.
- **In een tekening (`look`):** daar blijft aantikken tonen en voorlezen.
- **Woorden die de vraag zelf oefent (`q.items`):** die zijn niet aan te tikken, anders verraadt aantikken het antwoord.

### Grenzen

- Alleen losse woorden, geen vaste zinnen van meer woorden.
- Alleen de vorm zoals in het pakket: "stations" is niet aan te tikken als alleen "station" bestaat.
- Een woord met twee betekenissen ("hoe laat" tegenover "te laat") toont de betekenis uit het pakket. Dit is een punt voor het ijkmoment.

## R-M3: soorten sommen mengen

Bron: `onderbouwing-rekenen.md` 2.5.

### Hoe het werkt

- **Aanpak per som:** elke som kent zijn aanpak. Die staat in het veld `approach` van de oefening (zie `pakketformaat.md`); zonder dat veld geldt de vorm (geld, klok, korting).
- **Mengen in de herhaling:** de samensteller (`mixAppr`, na `noSameForm` en vóór `breakTriples`) zet twee sommen met dezelfde aanpak in de herhaling nooit direct na elkaar. Daartoe schuift hij een ander onderdeel ertussen. Een uitleg blijft bij de som erna. Als er niets te schuiven is, blijft de volgorde staan en valt er niets weg.
- **Nieuw mag geblokt:** een som die nieuw is (`_new`), mag wel naast een som met dezelfde aanpak staan. Zo leert de leerder de aanpak eerst geblokt.
- **Mengen van soorten:** de samensteller kiest per les al verschillende vaardigheden die aan de beurt zijn, één oefening per vaardigheid. Zodra een soort is aangeleerd, komt hij dus gemengd terug.

## Besluiten van de ontwerpsessie (Fable, 15 november 2026)

1. **Een nieuw woord aantikken:** zo laten; het levert niets op. De leerkaart en de uitleg bij de introductie zijn meer waard dan het overslaan ervan. Komt terug bij G2.
2. **Aanpakken:** rk-1 krijgt een expliciete `approach`: r-geld `money`, r-komma `decimal`, r-10 `percent-tenth`, r-25 `percent-fraction`. Wie verschillende aanpakken naast elkaar ziet, leert ze beter uit elkaar houden (`onderbouwing-rekenen.md` 2.5). Hetzelfde label zou ze ten onrechte nooit naast elkaar zetten. Gebouwd: per oefening naar het eerste item. De klok (r-klok) heeft geen `approach` en valt dus terug op de vorm.
3. **Steuntaal op "altijd":** aantikken blijft, maar toont de betekenis meteen, zonder keuze, en telt niet als ontmoeting. Gebouwd.

## Wat kan breken

- **Opslag:** niets. De vorm `tik` komt in de bestaande lijst `forms`.
- **`test-les`:** ongewijzigd, want in de vastgelegde les staan geen twee sommen met dezelfde aanpak naast elkaar.
- **Koppeling met de begeleider:** ongewijzigd.

## Tests

- `tools/test-tik.mjs`: aansluiting, regels en genoeg afleiders per hoofdstuk.
- `tools/test-samensteller.mjs`: R-M3.
