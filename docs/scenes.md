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

Dingen: `person`, `clock` (`value` als `u:mm`), `window`, `door`, `table`, `counter`, `chair`, `bench`, `bed`, `plant`, `phone` (`on` = gaat over), `agenda`, `letter`, `card`, `bag`, `medicine`, `sign`, `screen`, `shelf`, `stall`, `apples`, `bread`, `train`, `ticket`, en `spot` (onzichtbaar aantikbaar gebied met straal `r`, bijvoorbeeld een lichaamsdeel op een persoon).

Een persoon heeft `who` (de rol), `look` (`neutral`, `happy`, `worried`, `talk`, `think`), `hair` (`short`, `long`, `bun`, `none`), `hairTone` (`dark`, `brown`, `grey`, `fair`), `skin` (`a`, `b`, `c`) en `arm` (`wave`, `phone`). De speler kan de uitdrukking per rol wisselen zonder het pakket te wijzigen: `SceneVis.render(art, SAFE, { looks: { assistent: 'happy' }, text: L })`. Zo kijkt iemand blij na een goed antwoord en praat hij tijdens zijn beurt.

## Gebruik in de app

- `SceneVis.render(art, safe, ctx)` geeft HTML; `ctx.text` zet een Tekst om naar de taal van het scherm, `ctx.looks` wisselt uitdrukkingen.
- `SceneVis.CSS` één keer in de pagina zetten. Met "minder beweging" staat alles er meteen.
- Een aantikbaar ding heeft de klasse `s-hot` en `data-i` (de plek in `art.things`); de speler toont het label, leest het voor en zet de klasse `on`.
- `SceneVis.check(art)` geeft een lijst meldingen; `pakketcheck` roept hem aan per scène.
- Kleuren: de variabelen van de app. Nieuw en met een terugvalwaarde in `scene.js`, dus pas nodig bij een donker thema: `--wood`, `--sun`, `--skin-a/b/c`, `--hair-dark/brown/grey/fair` en per kleur `--…-deep` (een tint tussen `-fill` en `-ink`).
- Een bouwsteen toevoegen: een functie in `THING`, een regel in `HALO`, een regel in dit document, en een plaatje in de controle in de browser.
