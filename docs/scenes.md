# Scènes: formaat en tekencatalogus

Stand: 14 november 2026. Hoort bij `docs/concept-leerwereld.md` (stap 2). Een uitgewerkt voorbeeld staat in `docs/voorbeeld-scene.json` (scène 1 van het proefhoofdstuk); het tekenen staat in `scene.js`. De speler, de sectie in `pakketcheck`, de opslag en de tests bouwt de bouwsessie; dit document is de afspraak waar die zich aan houden.

## De sectie `scenes` in een pakket

Een pakket mag een lijst `scenes` hebben. Elke scène:

| Veld | Wat | Regel |
|---|---|---|
| `id` | naam van de scène | zoals alle id's: `^[A-Za-z0-9._-]+$`, uniek |
| `place` | de plek (het hoofdstuk) | id; vijf scènes per plek |
| `subject` | `nl`, `rk`, `en` of `kn` | bepaalt de kleur en de verdeling over de vakken |
| `level` | niveauband | zoals bij een pakket |
| `n` | volgnummer binnen de plek | 1 tot 5 |
| `title`, `intro`, `can` | Tekst | `can` is de vaardigheid uit het echte leven, geen score |
| `targets` | de doelonderdelen | elk id bestaat als herhaalitem; ongeveer vijf nieuwe per scène |
| `art` | de tekening | zie hieronder; gecontroleerd met `SceneVis.check` |
| `steps` | de stappen, in volgorde | zie hieronder |

Tekst is het type uit `docs/pakketformaat.md` (tekenreeks, of een object met `nl`, `th`, `en` en varianten). Elke tekst gaat in de speler langs precies één van `SAFE` of `esc()`.

## Stappen

| `type` | Wat de leerder doet | Velden | Herhaalmodel |
|---|---|---|---|
| `look` | de tekening verkennen; aantikken toont woord, klank en steunregel | `min` (hoeveel dingen minstens, standaard 1) | `introduce()` voor het `item` van elk aangetikt ding |
| `talk` | een gesprek met keuzes | `who`, `looks` (uitdrukking per persoon tijdens het gesprek), `turns[]` met `them`, `items`, `opts[]` (`t`, `r` = `ok`, `near` of `no`, `why`) | eerste keuze goed = `true`; goed na een fout = `'retry'`; `items[0]` is het doel |
| `read` | een korte tekst met tikbare woorden en vragen | `text`, `gloss[]`, `q[]` | per vraag |
| `listen` | een luistertekst, eerst de vragen | `audio` of `say`, `q[]` | per vraag |
| `slot` | een open plek: de samensteller kiest iets wat aan de beurt is | `n`, `kinds` | via `chooseEx`, zoals in de les |
| `explain` | een uitleg uit de catalogus | `id`, `when` (`first` = alleen de eerste keer) | geen |
| `do` | iets doen: een bestaande oefenvorm, een som met `gen`, of een vorm van de scène (`setclock`, `change`, `point`) | `form`, `items`, `ask`, `answer` of `gen`, `why` | `practiced(q,res,form)` |
| `make` | zelf maken: zin afmaken of bericht schrijven met een schrijfkader | `frame`, `model`, `checklist[]` | productief; telt voor bloei |
| `end` | het slot: wat je nu kunt, wat erbij kwam, drie wegen verder | `next`, `real` | geen |

Eisen (voor de scènetest):

- Elke `talk`-beurt heeft precies één `ok`, en elke keuze heeft een `why` die zegt waarom (ook de goede).
- Elke stap die iets vraagt heeft `items`, met het doel op de eerste plek.
- Een scène heeft minstens één stap waarin de leerder iets doet of maakt, niet alleen kiest.
- Een fout leidt nooit tot een dood spoor: de leerder kiest opnieuw, of krijgt het antwoord met uitleg.
- Scène 1 en 2 van een plek: kiezen. Scène 3 en 4: afmaken (`make` met een kader). Scène 5: mix zonder steuntaal bij de eerste poging, en samen raken de vijf scènes minstens 70 procent van de doelwoorden van de plek opnieuw.
- Namen van personen, plaatsen en bedrijven komen niet in een scène: rollen heten naar wat ze doen (de assistent, de verkoper).

## Diepte en diagnose

Besluit na het proefscherm (14 november 2026): een scène met twee gespreksbeurten en één opdracht is te dun. Het proefscherm liet alleen de vorm zien. Een echte scène vraagt 20 tot 30 keer iets van de leerder, duurt zes tot negen minuten, en stuurt op wat er fout gaat.

### Vaste opbouw van een scène Nederlands

| # | Deel | Wat | Omvang |
|---|---|---|---|
| 1 | Instap | weet je het al? Korte vragen over de doelwoorden, zonder steun. Wat goed gaat, maakt de grote sprong en wordt verderop overgeslagen | 3 tot 5 vragen |
| 2 | Kijken | de tekening verkennen: woord, klank, steunregel | 4 tot 6 dingen |
| 3 | Meteen ophalen | de woorden van zojuist, in een andere vorm (horen en kiezen, betekenis kiezen, typen) | 4 tot 6 vragen |
| 4 | Meemaken | gesprek, leestekst of luistertekst | 4 tot 6 beurten of vragen |
| 5 | Taal uit de tekst | het grammaticapunt: een uitgewerkt voorbeeld, daarna oefeningen waarin de hulp afbouwt | 1 voorbeeld, 3 tot 4 oefeningen |
| 6 | Herhalen | open plekken, gevuld door de samensteller | 3 tot 5 onderdelen |
| 7 | Doen | de opdracht van de situatie | 1 tot 2 |
| 8 | Maken | zin afmaken of bericht schrijven (vanaf scène 3) | 1 |
| 9 | Controle | twee vragen zonder hint over de kern van de scène; bepalen of de scène als beheerst telt | 2 |
| 10 | Slot | wat je nu kunt, drie wegen verder | – |

De lengte past zich aan: wie de instap goed maakt, slaat delen van 2, 3 en 5 over; wie fouten maakt, krijgt extra stappen (zie hieronder). Een rekenscène en een kennisles hebben dezelfde gedachte (eerst proberen, dan uitleg, dan afbouwend oefenen, dan controle), met eigen vormen.

### Het diagnostische model

Vier lagen. De eerste bestaat en is uitgebracht; de andere drie zijn nieuw.

1. **Per onderdeel: het herhaalmodel** (`docs/herhaalmodel.md`). Hoe stevig zit dit woord, deze regel, deze som; wanneer komt het terug; in welke vormen is het al gelukt.
2. **Per fout: het soort fout.** Elke foute keuze en elk fout antwoord krijgt een soort uit een vaste lijst: `lidwoord`, `woordvolgorde`, `werkwoordsvorm`, `tijd`, `voorzetsel`, `spelling`, `klank`, `betekenis`, `beleefdheid`, `getal`, `rekenstap`, `lezen` (de vraag niet goed gelezen). In het pakket staat dat bij de keuze als `err`. De app telt per soort, met meer gewicht voor recente fouten: het foutprofiel.
3. **Direct gevolg, in de scène.** Bij een fout: de reden. Bij een tweede fout van dezelfde soort in dezelfde scène: de korte uitleg die bij die soort hoort, en twee extra oefeningen op precies dat punt (stap `extra`, met `err` en een lijst oefeningen). Wie het daarna goed doet, gaat verder; de scène wordt dus langer voor wie het nodig heeft.
4. **Gevolg daarna.** De samensteller vult een deel van de open plekken met oefeningen voor de soort fout die het vaakst voorkomt, niet alleen met wat aan de beurt is. Elk hoofdstuk eindigt met een toets zonder hints (de mix van scène 5): de uitkomst is *door*, *gericht extra* (een korte herstelscène op het zwakke punt) of *sneller* (de instap van het volgende hoofdstuk telt zwaarder). De uitkomst stelt ook de schatting van de route bij (`docs/route-en-prognose.md`), en de begeleider ziet het foutprofiel.

Onderbouwing: eerst zelf ophalen, uitgewerkte voorbeelden die afbouwen, een slagingskans van 80 tot 90 procent, en toetsen die het vervolg bepalen (`docs/kwaliteitskader.md`, `docs/onderzoek-beloning.md`). De drempels (tweede fout van dezelfde soort, twee extra oefeningen, twee controlevragen) zijn aannames, te toetsen in de proefweek.

### De stappen voor diepte en diagnose

Drie soorten stappen naast die in de tabel hierboven. Een **vraag** heeft overal dezelfde vorm:

```json
{ "items": ["doel-id"], "form": "choose" | "hear" | "type" | "number",
  "ask": Tekst,
  "opts": [ { "t": "…", "r": "ok" | "near" | "no", "err": "soort fout", "why": Tekst } ],
  "answer": "…", "why": Tekst, "help": 0 | 1 | 2 }
```

`choose` en `hear` (eerst horen, dan kiezen) hebben `opts` met precies één `ok`; `type` en `number` hebben `answer` en één `why`. `help` zegt hoeveel hulp de vraag geeft (2 = half ingevuld, 0 = geen), voor de afbouw. Bij `hear` staat in `say` wat de leerder hoort; de tekst blijft verborgen tot na het antwoord. Bij `type` en `number` mag `accept` een lijst zijn met andere schrijfwijzen die ook goed zijn (bijvoorbeeld `"2,50"`, `"€ 2,50"`, `"2.50"`); hoofdletters en spaties aan het begin en eind tellen niet. Een afleider bij `hear` is een bestaand woord dat erop lijkt, geen verzonnen woord. Ook vragen bij een tekst (`read`, `listen`) hebben deze vorm, met een reden bij elke keuze.

| `type` | Wat | Velden |
|---|---|---|
| `quiz` | een rij korte vragen | `role`: `instap` (weet je het al, zonder steun), `ophalen` (meteen na het kijken) of `controle` (twee vragen aan het eind, zonder hint en zonder steuntaal); `q[]` |
| `rule` | taal uit de tekst: een uitgewerkt voorbeeld en oefeningen die afbouwen | `items` (de regel), `example` (Tekst: het voorbeeld met de regel in één zin), `q[]` met `help` 2, 1, 0 |
| `extra` | alleen getoond na een tweede fout van dezelfde soort | `err`, `explain` (Tekst, kort), `q[]` (minstens twee) |

Ook de keuzes in een gesprek (`talk`) krijgen bij `near` en `no` een `err`. Een scène kan `"nosup": true` hebben: de steuntaal verschijnt dan pas na de eerste poging (scène 5). Rekenen gebruikt `quiz` met `form: "number"` voor uitrekenen, en `do` voor het handelen (geld leggen, de klok zetten). Een rekenscène en een kennisles hebben geen `n`.

### Werkvormen, hints en de zwaardere vorm (masterplan C2, C3, A6, B2, B4)

- **Elke werkvorm uit de catalogus mag een vraag zijn.** Naast `choose`, `hear`, `type` en `number` kan `form` elke oefenvorm uit `docs/pakketformaat.md` zijn (`build`, `gap`, `dictee`, `mc`, `clock`, `money`, `discount`, `hear-type`, `complete`, `own`, `match`, `spot`), met de `data` van die vorm. Zo blijft alles wat al gebouwd is bruikbaar in een scène, en komt een nieuwe werkvorm er op één plek bij.
- **Spreken:** stap `speak` met `items`, `ask` (de situatie), `model` (wat je kunt zeggen, tekst en klank) en `checklist`. De leerder neemt op en luistert terug naast het voorbeeld; de opname blijft op het toestel. Tot opnemen gebouwd is, toont de speler het voorbeeld en de checklist.
- **Hint in twee stappen:** een vraag waarbij de leerder zelf typt (`type`, `hear-type`, `complete`, `dictee`) heeft `hint`: twee Teksten, eerst een kleine, dan een grotere aanwijzing. Een antwoord na een hint telt als `'retry'`.
- **Spel:** stap `game` met `kind` (uit de catalogus van het masterplan) en `items`; de speler kiest de onderdelen die erbij horen en die aan de beurt zijn.
- **Zwaardere vorm:** een scène die af is, is opnieuw te spelen als `replay`: zonder steuntaal, met typen waar eerst kiezen stond, en op eigen record. Het pakket hoeft daar niets voor te bevatten behalve vragen met zowel `opts` als `answer`.
- **Per hoofdstuk** (de vijf scènes samen): minstens één leestekst met vijf tot tien vragen in tekstvolgorde (geheel, detail, waarom, toepassen of woord), één luistertekst met de vragen vooraf, één stap `speak`, één stap `game`, en minstens twaalf verschillende werkvormen. Per scène minstens zes verschillende werkvormen, en nooit dezelfde vorm meer dan twee keer achter elkaar.

### Een woord aantikken is een keuze (`onderbouwing-nederlands.md`, 2.1)

Tikt de leerder in een tekst of gesprek een onbekend woord aan, dan toont de speler niet meteen de vertaling maar drie mogelijke betekenissen in de steuntaal; de leerder kiest, en ziet daarna de juiste met de omschrijving. Een juiste keuze telt als ontmoeting. In een tekening (`look`) blijft aantikken tonen en voorlezen: daar is het woord nog niet aangeboden. Het pakket hoeft hiervoor niets extra's te bevatten: de speler neemt de twee andere betekenissen uit woorden van hetzelfde hoofdstuk.

### Extra eisen voor de scènetest

- Een scène Nederlands heeft minstens 18 momenten waarop de leerder antwoordt (zonder de open plekken).
- Elke foute keuze heeft een `err` uit de lijst.
- Bij elk grammaticapunt van het hoofdstuk hoort een stap `extra` met minstens twee oefeningen.
- Een gesprek heeft minstens vier beurten.
- De controle heeft twee vragen zonder hint en zonder steuntaal.

## De tekening (`art`)

Een tekening is 340 bij 214. Het pakket kiest een achtergrond en zet er dingen op; het brengt nooit eigen SVG mee.

- `bg`: `room`, `clinic`, `shop`, `market`, `station`, `street`. `tone`: `mint`, `apricot`, `sky`, `lilac`.
- `alt`: beschrijving voor wie de tekening niet ziet (verplicht).
- `things[]`, hooguit 24, getekend in de volgorde van de lijst (later ligt bovenop):

| Veld | Wat |
|---|---|
| `kind` | zie de lijst hieronder |
| `x`, `y` | plek. Staande dingen: midden onder (de vloer ligt op y = 156). Hangende dingen (klok, raam, bord, scherm): het midden |
| `s` | grootte, 0,4 tot 2,6 (standaard 1) |
| `flip` | gespiegeld |
| `tone` | kleur, waar het ding er een heeft |
| `hot`, `label`, `item` | aantikbaar: `label` is de Tekst die getoond en voorgelezen wordt, `item` het herhaalitem |
| `text` | korte tekst in de tekening (bord, scherm, prijskaartje), hooguit 14 tekens |

Dingen: `person`, `clock` (`value` als `u:mm`), `window`, `door`, `table`, `counter`, `chair`, `bench`, `bed`, `plant`, `phone` (`on` = gaat over), `agenda`, `letter`, `card`, `bag`, `medicine`, `sign`, `screen`, `shelf`, `stall`, `apples`, `bread`, `train`, `ticket`, `figure` (een heel lichaam van voren, of met `back: true` van achteren voor rug en nek, om lichaamsdelen op aan te wijzen met `spot`), en `spot` (onzichtbaar aantikbaar gebied met straal `r`, bijvoorbeeld een lichaamsdeel op een persoon).

Een persoon heeft `who` (de rol), `look` (`neutral`, `happy`, `worried`, `talk`, `think`), `hair` (`short`, `long`, `bun`, `none`), `hairTone` (`dark`, `brown`, `grey`, `fair`), `skin` (`a`, `b`, `c`) en `arm` (`wave`, `phone`). De speler kan de uitdrukking per rol wisselen zonder het pakket te wijzigen: `SceneVis.render(art, SAFE, { looks: { assistent: 'happy' }, text: L })`. Zo kijkt iemand blij na een goed antwoord en praat hij tijdens zijn beurt.

## Gebruik in de app

- `SceneVis.render(art, safe, ctx)` geeft HTML; `ctx.text` zet een Tekst om naar de taal van het scherm, `ctx.looks` wisselt uitdrukkingen.
- `SceneVis.CSS` één keer in de pagina zetten. Met "minder beweging" staat alles er meteen.
- Een aantikbaar ding heeft de klasse `s-hot` en `data-i` (de plek in `art.things`); de speler toont het label, leest het voor en zet de klasse `on`.
- `SceneVis.check(art)` geeft een lijst meldingen; `pakketcheck` roept hem aan per scène.
- Kleuren: de variabelen van de app. Nieuw en met een terugvalwaarde in `scene.js`, dus pas nodig bij een donker thema: `--wood`, `--sun`, `--skin-a/b/c`, `--hair-dark/brown/grey/fair` en per kleur `--…-deep` (een tint tussen `-fill` en `-ink`).
- Een bouwsteen toevoegen: een functie in `THING`, een regel in `HALO`, een regel in dit document, en een plaatje in de controle in de browser.
