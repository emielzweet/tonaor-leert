# Ontwerp: nieuwe werkvormen

Stand: 15 november 2026. Hoort bij stap 6 van `werkorder.md` en de catalogus in `masterplan.md`. Eén ontwerp per groep, zodat de bouwsessie zonder verdere vragen kan bouwen. Elke vorm is een vraag of stap in een scène (`docs/scenes.md`) én kan in de korte ronde voorkomen, telt voor het herhaalmodel met een eigen vormcode, en volgt regel 16 van het masterplan: **de app keurt alleen een gesloten antwoord.**

Per vorm: wat de leerder doet, wat er in het pakket staat, hoe het wordt nagekeken, de vormcode en de streng (didactisch plan, hoofdstuk 2), en de onderbouwing.

## Algemeen

- **Tekenen:** waar een vorm een beeld nodig heeft, komt dat uit `uitleg.js` of `scene.js`, nooit uit het pakket. Nieuwe tekeningen worden daar een type, met `check()` voor de poort.
- **Minder beweging:** elke animatie heeft een stilstaande vorm.
- **Steuntaal:** de opdracht staat in het Nederlands met de steunregel; in de examenvorm zonder.
- **Mijn antwoord is ook goed** (masterplan 17): bij elke vorm waarin de leerder typt.
- **Trede** (M5): bij elke vorm staat welke trede hij is voor een regel: 1 gesloten, 2 half open, 3 toepassen.

## 1. Rekenen

### 1.1 Schatten op de getallenlijn (`numline`)
- **Leerder:** sleept een stip op een lijn van `from` tot `to` naar het getal dat genoemd of gesproken wordt (heel, komma, breuk, procent, bedrag, maat). Daarna verschijnt de echte plek met de afstand.
- **Pakket:** `{ "form": "numline", "from": 0, "to": 1, "target": 0.75, "show": "3/4", "tol": 0.05 }` of `gen` voor wisselende getallen.
- **Nakijken:** goed binnen `tol` (standaard 5 procent van de lijn); `retry` binnen tweemaal `tol`.
- **Code** `nl`; **streng** vloeiendheid en taal (rekenen).
- **Waarom:** samenhang getallenlijn en rekenvaardigheid r = 0,44; een kwartier met terugkoppeling gaf grote winst bij breuken (`onderbouwing-rekenen.md` 2.4).

### 1.2 De strook (`strip`)
- **Leerder:** tikt een strook in stukken (helften, kwarten, tienden) en kleurt het deel dat gevraagd wordt; of leest af welk deel gekleurd is. De strook toont tegelijk bovenaan het bedrag of de hoeveelheid en onderaan het percentage.
- **Pakket:** `{ "form": "strip", "total": 80, "unit": "€", "parts": 4, "ask": "25%", "answer": 20 }`.
- **Nakijken:** het aantal gekleurde delen, of het afgelezen getal (gesloten).
- **Code** `st`. **Tekening:** uitbreiding van het type `bar` in `uitleg.js`.
- **Waarom:** de strook als doorlopend model van situatie naar rekenmodel (2.3).

### 1.3 De verhoudingstabel aanvullen (`ratio`)
- **Leerder:** vult lege vakken in een tabel met twee rijen; bij elke pijl staat de bewerking (×2, :10). Eerst met de pijlen ingevuld, later zonder (afbouw `help` 2, 1, 0).
- **Pakket:** `{ "form": "ratio", "rows": [["kg", 1, 3, "?"], ["€", 2.5, "?", 20]], "answers": [7.5, 8], "help": 1 }`.
- **Nakijken:** elk vak een getal; `retry` als één vak fout is.
- **Code** `rt`. **Tekening:** type `ratio` bestaat in `uitleg.js`.

### 1.4 Rekenen in stappen (`steps`)
- **Leerder:** een situatie met twee tot vier deelvragen achter elkaar (wat wordt gevraagd → welke gegevens → rekenen → kan het kloppen), elk gesloten (kiezen of een getal). De vijf vaste stappen uit `onderbouwing-rekenen.md` 2.8.
- **Pakket:** een `steps`-vraag met `q[]`; de eerste deelvraag is vaak "wat moet je uitrekenen?" (kiezen).
- **Nakijken:** per deelvraag; de soort fout per stap (`lezen`, `model`, `rekenstap`).
- **Code** `sp`.

### 1.5 Welke aanpak past? (`approach`)
- **Leerder:** ziet een situatie en kiest alleen de aanpak (optellen, ×, :, verhoudingstabel, via 1 procent), zonder te rekenen.
- **Nakijken:** kiezen. **Code** `ap`.
- **Waarom:** bij gemengd oefenen moet de leerder zelf de aanpak kiezen; dat is wat het oplevert (2.5). De motor mengt deze vorm altijd met andere soorten.

### 1.6 Eerst schatten, dan rekenen (`estimate`)
- **Leerder:** kiest eerst een schatting uit drie (ongeveer 10, 50 of 100), rekent dan precies (getal), en ziet beide naast elkaar.
- **Nakijken:** schatting en uitkomst apart. **Code** `es`.

### 1.7 De rekenmachine (`calc`)
- **Leerder:** ziet een rekenmachine op het scherm en tikt in wat er moet; de app beoordeelt de toetsreeks (de bewerking) en de uitkomst. Daarna: "kan dit kloppen?" (kiezen).
- **Pakket:** `{ "form": "calc", "expr": "7.50*3", "answer": 22.5 }`; elke volgorde die op dezelfde uitkomst uitkomt is goed.
- **Code** `ca`. **Waarom:** de rekenmachine mag bij het examen; leren wat je intypt en controleren met een schatting (2.10).

### 1.8 Kiezen zonder te rekenen (`compare`) en schatspellen
- **Leerder:** wat is meer, wat past, welke aanbieding is goedkoper. Gesloten; op tempo als spel (`game`, `kind: "compare"`), zonder straf. (`aanbevelingen.md` 10.14.)

### 1.9 De rekenkaart
Een naslagscherm vanuit elke som (knop ⓘ): metriek stelsel, helft, kwart en tiende als procent, de vijf stappen, de rekenmachine. Geen werkvorm, wel altijd bereikbaar (10.13).

## 2. Zinsbouw en grammatica

### 2.1 De zinsbouwtafel (`table`)
- **Leerder:** een zin in blokken op een rij met vaste vakken (vak 1, werkwoord, rest, werkwoord aan het eind). Schuift een blok naar vak 1; het onderwerp springt vanzelf achter het werkwoord. Zo wordt de regel zichtbaar. Als oefening: bouw de zin met "morgen" vooraan, of maak er een bijzin van na "omdat".
- **Pakket:** `{ "form": "table", "parts": ["ik","werk","morgen","in de fabriek"], "verb": "werk", "start": "morgen", "answer": "Morgen werk ik in de fabriek." }`.
- **Nakijken:** de volgorde van de blokken (gesloten, zoals `build`). **Code** `tb`; trede 1.
- **Waarom:** woordvolgorde is een van de zwaarste punten voor wie Thais spreekt; uitleg met oefening en de volgorde zichtbaar maken (`onderbouwing-nederlands.md` 2.3).

### 2.2 De tijdlijn voor werkwoordstijden (`tense`)
- **Leerder:** ziet een tijdlijn (gisteren, nu, morgen) met een gebeurtenis; kiest of bouwt de vorm (*werkt, werkte, heeft gewerkt, gaat werken*). Onregelmatige werkwoorden in groepjes die op elkaar lijken (*zingen, zong, gezongen*).
- **Nakijken:** kiezen of één woord typen. **Code** `te`. **Tekening:** nieuw type `timeline` in `uitleg.js`.

### 2.3 Zin afmaken met blokken (`complete`, gesloten)
Een half open opdracht wordt gesloten door de leerder het ontbrekende deel uit blokken te laten bouwen in plaats van te typen (regel 16). Trede 2 blijft `make` met een kader.

### 2.4 Fout zoeken (`spot`)
- **Leerder:** tikt in een zin of bericht het woord dat niet klopt; daarna kiest hij het goede woord.
- **Nakijken:** twee gesloten stappen. **Code** `sf`. Spaarzaam, als afwisseling (`onderbouwing-rekenen.md` 2.2).

### 2.5 Signaalwoorden (`signal`)
- **Leerder:** tikt in een tekst de woorden die een verband aangeven en kiest het verband (reden, tegenstelling, tijd, gevolg). (10.8.)

### 2.6 Scheidbare werkwoorden en vaste voorzetsels
Een `build`-vraag waarin het losse deel naar het eind moet (*Ik bel je morgen op*), en een `gap` voor het vaste voorzetsel (*wachten op*). Geen nieuwe vorm; wel een eigen soort onderdeel (`kind: "verb-sep"`, `"prep"`) zodat de motor ze als groep herhaalt (2.4 van de aanbevelingen).

## 3. Luisteren en lezen

### 3.1 De luistertekst (`listen` als stap)
- **Leerder:** ziet eerst de vragen, hoort de tekst, beantwoordt. Daarna: opnieuw, met de tekst erbij en de zin die klinkt oplichtend.
- **Afbouw** (E-M4 en de Nederlandse examenvorm): meelezen → alleen luisteren met opnieuw afspelen → examenvorm (Nederlands: één keer, 25 seconden leestijd; Engels: opnieuw afspelen mag).
- **Snelheid:** knoppen langzaam, gewoon en iets sneller, en "deze zin nog eens", behalve in de examenvorm.
- **Pakket:** `text`, `say` per zin (of een geluidsbestand), `q[]` met de vorm uit `scenes.md`.
- **Code** `li`; **streng** input.

### 3.2 Meelezen met geluid
Bij elke leestekst een knop "lees voor": de zin die klinkt licht op. Telt als leestijd én luistertijd. (2.10 van de aanbevelingen.)

### 3.3 Getallen, tijden en bedragen verstaan (`numdictee`)
- **Leerder:** hoort een getal, tijd, datum, prijs of telefoonnummer en typt het in cijfers.
- **Pakket:** `gen` met soort (`time`, `date`, `price`, `phone`, `number`).
- **Nakijken:** het getal (gesloten). **Code** `nd`. (10.5.)

### 3.4 De lange tekst
Wekelijks één tekst die elke maand langer wordt, naar de examenlengte; de vragen in tekstvolgorde, met de soorten uit het kwaliteitskader. Geen nieuwe vorm; een vaste plek in de week (2.11 van de aanbevelingen).

## 4. Spreken en uitspraak

### 4.1 Opnemen en terugluisteren (`speak`)
- **Leerder:** hoort het voorbeeld, neemt zelf op (MediaRecorder), luistert terug naast het voorbeeld, en vinkt de checklist af. De opname blijft op het toestel.
- **Nakijken:** niet door de app; de leerder vinkt zelf af (open, regel 16). Telt voor het herhaalmodel als productieve vorm met de uitkomst die de leerder aangeeft (*klonk goed*, *nog niet*).
- **Examenvorm:** 20 of 30 seconden zichtbaar, opname stopt zelf (`scenes.md`).
- **Code** `sk`; **streng** output.
- **Opslag:** opnamen in IndexedDB, niet in de opslag van de voortgang, met een grens (bijvoorbeeld de laatste dertig); ze tellen niet mee in de reservekopie. Dit raakt de opslag niet, want het is een aparte bak.

### 4.2 Zeg het tegen het toetsenbord (`dictate`)
- **Leerder:** tikt op het invulveld en zegt de zin met de dicteerknop van het toetsenbord. De app vergelijkt de tekst met de zin (zonder hoofdletters en leestekens; woorden in de juiste volgorde). Overeenkomst = verstaanbaar.
- **Nakijken:** gesloten (de tekst is bekend). Mislukt het, dan geen fout maar "probeer nog eens, of oefen met het voorbeeld".
- **Code** `dc`. **Eerst uitproberen** op het doelapparaat; werkt het niet, dan valt de vorm weg zonder dat iets anders verandert (10.1).

### 4.3 Meespreken (`shadow`)
- **Leerder:** hoort een zin en zegt hem tegelijk mee, drie keer, steeds iets sneller. Geen beoordeling; telt als vloeiendheid. **Code** `sh` (2.8).

### 4.4 Klanken met meer stemmen en met beeld
De bestaande klankparen gebruiken alle Nederlandse stemmen van het toestel door elkaar, en de opnamen uit de inspreekhulp (6.1 van de aanbevelingen). Bij elke lastige klank een tekening van mond en tong (nieuw type `mouth` in `uitleg.js`). Een spel dat alleen op de laatste klank let.

### 4.5 De tijdcapsule
Op dag één en daarna elke maand dezelfde korte opdracht opnemen en drie zinnen schrijven; elke drie maanden toen en nu naast elkaar. Gebruikt 4.1 en de opslag daarvan (5.1 van de aanbevelingen).

## 5. Spellen

Spel is de stof zelf, één tot drie minuten, werkt het herhaalmodel bij, eigen record, geen straf op tijd (masterplan C5). Na de bestaande snelronde de of het:

| Spel | Wat | Gebruikt |
|---|---|---|
| Plek twee | zin bouwen tegen een rustige klok; niveaus: gewone zin, tijd vooraan, bijzin | 2.1 |
| Klankduel | horen en kiezen uit twee, steeds iets sneller | 4.4 |
| Koppelen | woord bij omschrijving of bij beeld, als geheugenspel | bestaande woorden |
| Fout zoeken | 2.4 op tempo | 2.4 |
| Wisselgeld | het bedrag leggen | bestaand `money` |
| Zet de klok | de wijzers naar een gesproken tijd | bestaand `clock` |
| Kortingsjacht | de goedkoopste aanbieding kiezen | 1.8 |
| De of het, met vorm | de vaste kleur en vorm uit 10.3 als hulp die afbouwt | bestaand |

## Volgorde van bouwen

1. Wat bestaande schermen uitbreidt: 3.1 (afbouw en snelheid), 3.2, 3.3, 2.3, 2.6.
2. Rekenen: 1.4, 1.5, 1.6, 1.1, 1.2, 1.3, 1.7, 1.9, 1.8.
3. Zinsbouw: 2.1, 2.2, 2.4, 2.5.
4. Spreken: 4.1 (eerst), 4.3, 4.2 (na uitproberen), 4.4, 4.5.
5. Spellen, telkens zodra de vorm eronder bestaat.

Elke vorm achter Proefonderdelen tot hij in een ijkmoment is bekeken; daarna standaard aan. Elke vorm krijgt een test in `tools/` die het nakijken controleert (goed, retry, fout, en een antwoord dat ook goed is), en een regel in de poort voor de velden in het pakket.
