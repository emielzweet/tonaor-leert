# Herzien plan na gebruik (13 november 2026)

Status: **voorstel, wacht op besluiten van de eigenaar en eenmalige afstemming met de ontwerpsessie.** Vult `docs/bouwplan.md` aan; de fasen daar blijven gelden, dit plan zet ze in sporen die naast elkaar lopen.

## Wat de eigenaar na gebruik merkt

1. Te weinig variatie, te veel herhaling kort na elkaar, steeds dezelfde vorm. Na de les stopt het. (Deels opgelost in commit 1330615: herhaling met tijd ertussen, wisselende vormen, "Verder leren".)
2. Te weinig woorden: 4 nieuwe per ronde is te weinig, en er is geen instelling om dat te veranderen. Als de leerder "zeker" kiest en geen fouten maakt, mag een woord als geleerd gelden.
3. Er is bijna geen uitleg, en de uitleg is niet goed in de les verweven.
4. Rekenen heeft geen eigen plek. Het hoort een eigen lijn te zijn, met uitleg, veel verschillende oefeningen en verwijzingen naar uitleg elders (video's), net als Nederlands en Engels.
5. Het moet vooral leuk zijn. De tuin is leuk, maar niet genoeg: er moet veel meer beloning en reden zijn om door te gaan.

## Waar het aan ligt

- **Inhoud, niet de motor.** De methodiek (`docs/kwaliteitskader.md`, `docs/leerroute.md`) vraagt ongeveer 75 themawoorden per thema plus een frequentielijst van ongeveer 8 woorden per lesdag, op weg naar 3.000 tot 5.000 woorden voor B1. De app heeft 18 woorden, één tekst en een handvol zinnen. De motor (herhaalmodel, fase 3) is klaar voor veel meer.
- **Rekenen en Engels zijn stappen in de Nederlandse les,** geen eigen lijnen. De leerroute beschrijft rekenen wel als zes modules (R1 tot R6) en Engels als eigen route.
- **Uitleg:** 32 onderwerpen, vooral bij de huidige oefeningen. De catalogus voor rekenen R1 tot R4, grammatica van thema 1 tot 3 en Engels tot A2 is nog niet geschreven.
- **Beloning:** alleen punten, de tuin en de weekring. Onderzoek naar wat werkt: `docs/onderzoek-beloning.md`.

## De sporen

Elk spoor levert in kleine, losse stappen op. Elke stap: ontwerp kort vastleggen waar nodig, bouwen, tests, controle op 375 px, en pas na akkoord een release.

### Spoor A — Lesstof Nederlands (grootste gat)

1. **Frequentielijst, deel 1:** ongeveer 300 basiswoorden die het meest voorkomen, eigen werk (geen lijst uit een boek of database overnemen), met lidwoord, Thaise en Engelse vertaling, een Nederlandse omschrijving en een eigen voorbeeldzin. Een eigen pakket, naast de thema's.
2. **Thema 1 volledig volgens het kwaliteitskader:** ongeveer 75 woorden, twee tot drie cycli rond een eigen tekst (voorkennis, tekst, taal uit de tekst, zelf gebruiken), grammatica in drie treden, en een afsluitende mix.
3. **Thema 2 en 3** op dezelfde manier.

### Spoor B — Rekenen als eigen lijn

1. **Een eigen plek in de app:** een tab of tegel "Rekenen" met de route R1 tot R4. Per onderwerp: uitleg, oefenen en "meer uitleg". De leerder kan zelf een onderwerp kiezen; het herhaalmodel plant ook hier.
2. **Per onderwerp een reeks oefeningen** met wisselende getallen (de generator uit fase 3 uitbreiden): optellen en aftrekken, tafels en delen, nullen, plaatswaarde, kommagetallen, geld en wisselgeld, klok en tijdsduur, meten en omrekenen, breuken, "per" en verhoudingstabel, procenten en korting, tabellen en grafieken, omtrek en oppervlakte.
3. **Uitleg per onderwerp** (catalogus R1 tot R4), volgens het model: strook of getallenlijn, dan tabel, dan de kale som.
4. **Verwijzingen naar uitleg elders:** per onderwerp één of twee links naar een betrouwbare uitleg (bijvoorbeeld een video). Volgens het besluit van 13 november worden video's buiten de app geopend, niet ingesloten. Links staan in het pakket en worden door `pakketcheck` gecontroleerd (alleen https, alleen goedgekeurde domeinen). De begeleider kiest of keurt de links goed; de app kan de inhoud van een video niet zelf controleren.
5. Rekenen blijft ook kort in de Nederlandse les terugkomen (taal van het rekenen).

### Spoor C — Engels als eigen lijn

Zelfde opzet als rekenen: eigen plek, route tot A2, woorden, regels en uitleg. Start na spoor B, met dezelfde bouwstenen.

### Spoor D — Uitleg

1. Catalogus schrijven: rekenen R1 tot R4 (gaat mee met spoor B), grammatica en leestekens thema 1 tot 3 (met spoor A), Engels tot A2 (met spoor C).
2. **Integratie in de les** (wacht op de eigenaar: wat stoort het meest):
   - als stap ín de les in plaats van een venster;
   - op het juiste moment;
   - aansluitend op de oefening erna;
   - korter of helderder.

### Spoor E — Plezier en beloning

Op basis van `docs/onderzoek-beloning.md`, binnen de vaste grenzen (nooit iets afpakken, geen schuldgevoel, geen geld, spel oefent altijd stof):

1. **Klein en direct:**
   - "Nog eentje?" met onderdelen die bijna bloeien;
   - een bloei-moment met animatie en geluid;
   - combo zonder straf;
   - weekring met vergeving en een frisse start op maandag;
   - een terugblik per week;
   - een doorkijkje naar wat komt.
2. **Gemengde les en moeilijkheid richting 80 tot 85 procent goed** (deels gebouwd).
3. **Mini-spellen die de stof zelf zijn:** marktkraam (wisselgeld en korting), memory, klokkenmaker. Fase 8 van het bouwplan.
4. **Verzamelen en progressie:**
   - herbarium;
   - tuin-uitbreidingen per thema;
   - keuze uit drie opdrachten;
   - eindopdracht per thema.

### Spoor F — Instellingen en tempo

1. Nieuwe woorden per ronde instelbaar op Ik.
2. "Zeker en foutloos" telt zwaarder.

## Voorstel voor de volgorde

Sporen lopen naast elkaar; per keer wordt één stap gebouwd.

1. **Eerst** (snelste effect voor de leerder):
   - F1 en F2;
   - E1, de kleine beloningen;
   - A1, de frequentielijst, in delen van ongeveer 100 woorden.
2. **Dan:**
   - B1 tot en met B3, rekenen als eigen lijn, met uitleg en oefeningen;
   - D2, de uitleg-integratie, zodra de eigenaar heeft gezegd wat stoort.
3. **Dan:**
   - A2, thema 1 volledig;
   - E3, de marktkraam als eerste mini-spel.
4. **Daarna:**
   - B4, de verwijzingen, na de keuze van de links;
   - spoor C, Engels;
   - A3;
   - E4.

## Open besluiten voor de eigenaar

1. **Lesstof eerst:** frequentielijst en thema 1 tegelijk (advies), of een van beide eerst?
2. **Tempo:** nieuwe woorden per ronde kiezen op Ik (4, 8 of 12), standaard 8 (advies)?
3. **Zeker en foutloos:**
   - grote sprong naar "bloem", met één controle na ongeveer drie weken (advies);
   - direct geleerd;
   - of alleen een knop "Ken ik al".
4. **Uitleg:** wat stoort het meest? Een los venster, het verkeerde moment, het sluit niet aan, of te lang of onduidelijk.
5. **Rekenen:** een eigen tab naast Vandaag, Tuin, Route en Ik, of een grote tegel op Vandaag?
6. **Verwijzingen:** kiest de begeleider de video's zelf, of stelt de bouwsessie een lijst voor die de begeleider goedkeurt?
