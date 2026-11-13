# Pakketformaat (versie 1)

Stand: 13 november 2026. Dit is de specificatie voor bouwplan fase 2: de inhoud gaat uit `index.html` naar inhoudspakketten, en de les wordt uit die pakketten samengesteld. De eisen aan de inhoud zelf staan in `docs/kwaliteitskader.md`.

## Uitgangspunten

1. **Een pakket is één JSON-bestand** in `content/`. Het bevat alles voor één thema of één leerlijn: woorden, regels, teksten, oefeningen, uitlegkaarten en het recept voor de les.
2. **Fase 2 verandert niets voor de leerder.** Zelfde les, zelfde volgorde, zelfde punten. De opslag verandert niet: `SCHEMA` blijft 2 en er is geen migratie nodig.
3. **Een onderdeel hoort bij de taal, niet bij een thema.** Een woord wordt in één pakket geïntroduceerd en mag in latere pakketten terugkomen. Daarom heeft elk onderdeel één id dat over alle pakketten heen uniek is, en houden de bestaande id's (`werk`, `en-work`, `r-geld`) precies hun naam. Dit vervangt het eerdere idee van een voorvoegsel per pakket met een aliastabel.
4. **Eén controle, twee keer gebruikt.** `pakketcheck.js` controleert een pakket. De test gebruikt hem voor de pakketten in de repo; de app gebruikt hem later (fase 4) als iemand een eigen pakket inlaadt.
5. **Inhoud is nooit code.** Tekst uit een pakket wordt altijd eerst onschadelijk gemaakt en dan pas getoond. Zie "Veilig tonen".

## Bestanden

| Bestand | Inhoud nu |
|---|---|
| `content/nl-t1.json` | Nederlands thema 1: `NL`, `SENT`, `PAIRS`, `DICTEE`, `STORY`, de startmeting en de vaste oefeningen uit `startLesson()` |
| `content/en-t1.json` | Engels thema 1: `EN` en de vaste oefeningen uit `startEnglish()` |
| `content/rk-1.json` | Rekenen: `REK` en de reken-oefeningen |
| `pakketcheck.js` | De controle (gewoon JavaScript, zonder afhankelijkheden, bruikbaar in de browser en in Node) |
| `tools/test-pakket.mjs` | Draait de controle over alle pakketten in `content/` |

De lijst met ingebouwde pakketten staat op één plek in `index.html` (`BUILTIN`) en dezelfde bestanden staan in `SHELL` van `sw.js`. De test controleert dat die twee gelijk zijn.

## Laden

- De app haalt bij de start de ingebouwde pakketten op, tegelijk, en wacht daarop voordat het eerste scherm verschijnt. De opslag wordt los daarvan geladen, zoals nu.
- Lukt een pakket niet (geen verbinding en niet in de cache, of ongeldig), dan start de app met wat er wel is en meldt dat op het startscherm. Er wordt niets uit de opslag verwijderd.
- **Onderdelen in de opslag waarvan het pakket ontbreekt, blijven staan.** Ze tellen alleen niet mee in de les en de tuin.
- Een onderdeel krijgt pas een plek in `S.items` als het voor het eerst aan bod komt. Bestaande opslag heeft alle huidige onderdelen al.
- Pakketten worden geordend op `order`. Een pakket mag onderdelen gebruiken uit de pakketten in `requires`.

## Tekst

Elke tekst die de leerder ziet is een **Tekst**:

- een gewone string: alleen Nederlands, geen vertaling nodig (bijvoorbeeld een Nederlands antwoord), of
- een object `{"nl": "...", "th": "...", "en": "..."}` met een vertaling per steuntaal.

Soms hangt de Nederlandse tekst af van de steuntaal, omdat hij naar die taal verwijst ("anders dan in het Engels"). Dan krijgt hij een variant: `{"nl": "...", "nl@en": "...", "th": "...", "en": "..."}`.

Bij Engels als leertaal is `en` de hoofdtekst en zijn `nl` en `th` de steun.

**Opmaak.** In een Tekst mogen alleen `<b>`, `<i>` en `<u>` staan. Niets anders: geen links, geen andere tags, geen attributen.

## Veilig tonen

Een pakket kan later van buiten komen (een eigen pakket in fase 4). Daarom, vanaf fase 2:

- De app toont tekst uit een pakket alleen via één functie die eerst alles onschadelijk maakt en daarna precies `<b>`, `</b>`, `<i>`, `</i>`, `<u>` en `</u>` terugzet.
- Geen enkel veld uit een pakket wordt als HTML, als attribuut of als adres gebruikt zonder die stap. Adressen (latere kijkopdrachten) moeten met `https://` beginnen en worden als tekst getoond voordat ze openen.
- `pakketcheck.js` weigert een pakket met andere tags of met `<` of `>` buiten de toegestane tags.

De veiligheid hangt hier niet af van wie het pakket schreef: ook de ingebouwde pakketten gaan door dezelfde stap.

## Opbouw van een pakket

```json
{
  "format": 1,
  "id": "nl-t1",
  "version": 1,
  "learn": "nl",
  "level": "A2-B1",
  "order": 10,
  "quality": "legacy",
  "requires": [],
  "title": {"nl": "...", "th": "...", "en": "..."},
  "items": [],
  "texts": [],
  "cards": [],
  "exercises": [],
  "lesson": {},
  "lessonShort": {},
  "tests": {}
}
```

- `quality`: `"strict"` = alle automatische eisen uit het kwaliteitskader zijn verplicht (elk nieuw thema). `"legacy"` = de eisen worden gemeld maar blokkeren niet (thema 1 tot fase 4).
- `version` gaat omhoog bij elke inhoudelijke wijziging.
- Later komen erbij, zonder het formaat te breken: `route` (fase 5), `modules` voor extra's (fase 4), `watch` voor kijkopdrachten en `audio` (fase 6), `games` (fase 8). Onbekende velden op het bovenste niveau geven een waarschuwing, geen fout.

### `items`: wat herhaald wordt

Vier soorten. Elk item heeft `id` en `kind`.

**`word`**

| Veld | Verplicht | Betekenis |
|---|---|---|
| `w` | ja | Het woord of de combinatie |
| `art` | bij een zelfstandig naamwoord | `de` of `het` |
| `forms` | nee | Andere vormen waarin het in teksten voorkomt (meervoud, vervoeging) |
| `tr` | ja | Vertaling per steuntaal: `{"th": "...", "en": "..."}` |
| `def` | strict | Omschrijving in eenvoudig Nederlands |
| `ex` | ja | Voorbeeldzin |
| `gap` | ja | Oefenzin met precies één `___` |
| `askArt` | nee | `true` als het lidwoord apart gevraagd wordt |
| `also` | nee | Id's van woorden die ook in het gat zouden passen (niet als foute keuze gebruiken) |

Bij Engels als leertaal: `w` is het Engelse woord, `tr` heeft `nl` en `th`.

**`rule`** (grammaticapunt)

| Veld | Verplicht | Betekenis |
|---|---|---|
| `title` | ja | Tekst |
| `rule` | strict | De regel in hooguit twee zinnen (Tekst) |
| `watch` | strict | "Let op" voor de valkuil van de moedertaal (Tekst, meestal met een variant per steuntaal) |
| `examples` | strict | Minstens drie: `{"s": Tekst, "from": "<tekst-id>"}`; `from` alleen als de zin uit een tekst komt |

**`sound`** (klank of klankpaar): `title` (Tekst), `pair` (twee woorden).

**`skill`** (rekenvaardigheid): `title` (Tekst).

### `texts`

```json
{"id": "t1.txt.1", "kind": "lees", "sort": "bericht", "title": {"nl": "...", "th": "...", "en": "..."},
 "paras": [[{"nl": "Eerste zin.", "th": "...", "en": "..."}, {"nl": "Tweede zin.", "th": "...", "en": "..."}],
           [{"nl": "Zin in de tweede alinea.", "th": "...", "en": "..."}]],
 "words": ["werk", "pauze"]}
```

- `kind`: `lees`, `luister` of `verhaal`. `sort`: bericht, portret, tips, voorlichting, procedure, brief, folder, tabel, dialoog, verhaal.
- `paras`: alinea's, elk een rij zinnen. Zo kan de app per zin voorlezen en vertalen, en kan een vraag naar een alinea wijzen.
- `words`: de doelwoorden die erin voorkomen. De controle kijkt of `w` of een van de `forms` echt in de tekst staat.
- De lengte in woorden rekent de controle zelf uit.

### `cards`: uitleg

```json
{"id": "t1.kaart.plek2", "items": ["t1.regel.plek2"], "title": Tekst, "body": Tekst,
 "examples": [{"parts": [{"t": "Morgen", "slot": 3}, {"t": "werk", "slot": 2}, {"t": "ik", "slot": 1}, {"t": "thuis."}], "tr": {"th": "...", "en": "..."}}],
 "note": Tekst, "say": "Morgen werk ik thuis."}
```

`slot` 1, 2 of 3 geeft de kleur van het zinsdeel. `say` is wat de luisterknop voorleest.

### `exercises`

Elke oefening:

| Veld | Verplicht | Betekenis |
|---|---|---|
| `id` | ja | Uniek over alle pakketten |
| `form` | ja | De oefenvorm, zie de tabel hieronder |
| `items` | ja | De items die de oefening raakt; hun stand wordt bijgewerkt |
| `data` | ja | De gegevens voor deze vorm |
| `pool` | nee | Naam van een groep waaruit het recept willekeurig kiest |
| `text`, `para`, `qtype` | bij een tekstvraag | Welke tekst, welke alinea, en `geheel`, `detail`, `waarom`, `toepassen` of `woord` |
| `fb` | strict | `{"ok": Tekst, "no": Tekst}`: de reden bij goed en bij fout |
| `hint` | strict bij gesloten productie | Twee Teksten: eerst een kleine, dan een grotere aanwijzing |
| `model`, `check` | bij open productie | Voorbeelduitwerking en een checklist om zelf na te kijken |
| `skill`, `mode`, `open`, `tier` | nee | Alleen als ze afwijken van de standaard van de vorm |

**Oefenvormen en hun standaardlabels**

| `form` | `data` | Vaardigheid | Receptief of productief | Trede |
|---|---|---|---|---|
| `learn` | – (uit het woord) | woorden | aanbieding | 0 |
| `recog` | – (uit het woord) | woorden | receptief, gesloten | 1 |
| `recall` | – (uit het woord) | woorden | productief, gesloten | 2 |
| `build` | `parts`, `verb`, `tr` | grammatica | productief, gesloten | 1 |
| `gap` | `s`, `o`, `a`, `tr` | grammatica | receptief, gesloten | 1 |
| `listen` | `say`, `opts`, `tr` | uitspraak | receptief, gesloten | 1 |
| `dictee` | `t`, `tr` | luisteren | productief, gesloten | 2 |
| `mc` | `q`, `o` (drie), `a`, soms `say` | lezen of luisteren | receptief, gesloten | 1 |
| `clock` | `q`, `h`, `m`, `o`, `a` | rekenen | receptief, gesloten | 1 |
| `money` | `coins` (in centen), `o`, `a` | rekenen | receptief, gesloten | 1 |
| `discount` | `mode` (`worked`, `part`, `own`), `thing`, `price`, `pct` | rekenen | voorbeeld, daarna productief | 0, 2, 3 |

`learn`, `recog` en `recall` hoeven niet als oefening in het pakket te staan: de app maakt ze voor elk woord. Ze tellen wel mee als ontmoeting en als vorm.

Gereserveerd voor latere fasen, nu nog niet te gebruiken: `hear-type` (horen en typen, fase 3), `complete` (zin afmaken), `own` (eigen zin), `write` (schrijfopdracht met model), `situation` (wat zeg je, met opnemen), `match`, `spot` (fout zoeken).

### `lesson` en `lessonShort`: het recept

Een recept is een rij plekken. De samensteller loopt ze af en vult elke plek.

| Plek | Betekenis |
|---|---|
| `{"step": 1, "card": "<id>"}` | Toon een uitlegkaart |
| `{"step": 3, "ex": "<id>"}` | Precies deze oefening |
| `{"step": 3, "pool": "<naam>", "n": 3, "n2": 2}` | Kies willekeurig `n` oefeningen uit de groep; `n2` geldt op een dag met een tweede taal |
| `{"step": 1, "words": "due", "forms": ["recall"], "max": 4, "ifNone": {"words": "first", "n": 2, "forms": ["learn", "recog"]}}` | Woorden die aan de beurt zijn, het oudst eerst; `ifNone` als er geen zijn |
| `{"step": 2, "words": "new", "forms": ["learn"], "then": ["recog"], "max": 4, "max2": 3, "maxBusy": 1}` | Nieuwe woorden: eerst allemaal leren, dan gehusseld herkennen; `maxBusy` geldt bij meer dan 25 herhalingen |
| `{"step": 5, "end": true}` | Afsluiten (zeker of twijfel, eindscherm) |

`step` is het stapnummer dat de leerder ziet (1 tot 5).

**Het recept voor fase 2 moet de huidige les precies opleveren.** Dat is, voor de gewone les:

1. kaart "ophalen"; woorden die aan de beurt zijn, hooguit vier (zijn er geen, dan de eerste twee woorden leren en herkennen);
2. nieuwe woorden, hooguit vier (drie op een dag met Engels, één bij meer dan 25 herhalingen), daarna gehusseld herkennen; kaart "werkwoord op plek twee";
3. drie zinnen bouwen uit de groep (twee op een dag met Engels); de gatzin; twee klankparen uit de groep; het dictee;
4. geld tellen; de klok; het voorbeeld van de korting; de kortingssom;
5. afsluiten.

De korte les: kaart, hooguit drie woorden die aan de beurt zijn, de kloksom van half vier, afsluiten.

In fase 3 komen er plekken bij die kiezen op wat bijna vergeten is, voor alle soorten items.

### `tests`

`{"placement": ["<oefening-id>", ...]}`: de startmeting, als rij `mc`-oefeningen met elk een `skill`. In fase 9 komen `entry` (instaptoets) en `theme` (themaoefentoets) erbij. Een oefening die in `tests` staat, mag niet in een recept of groep voorkomen.

## Wat `pakketcheck.js` controleert

`checkPack(pakket, anderePakketten)` geeft `{errors: [], quality: []}`.

**Fouten** (altijd blokkerend):
- `format`, `id`, `learn`, `order` aanwezig en geldig;
- elk id uniek, ook ten opzichte van de andere pakketten;
- elke verwijzing bestaat (items, teksten, kaarten, oefeningen, groepen in het recept), in dit pakket of in een pakket uit `requires`;
- elke Tekst heeft elke steuntaal; geen andere opmaak dan toegestaan;
- elke vorm heeft de juiste `data`; het goede antwoord staat tussen de keuzes; een gatzin heeft precies één `___`;
- de bestaande regels uit `tools/test-oefeningen.mjs` voor woorden (lidwoord zichtbaar of gevraagd, genoeg foute keuzes, `also` verwijst naar andere woorden);
- een toetsvraag staat niet ook in een recept.

**Kwaliteit** (blokkerend bij `"quality": "strict"`, anders alleen gemeld): elke eis met een A in `docs/kwaliteitskader.md`. De melding noemt het onderdeel en de eis, zodat een schrijver weet wat er ontbreekt.

## Tests voor fase 2

1. `tools/test-pakket.mjs`: alle pakketten zonder fouten; kwaliteitsmeldingen voor thema 1 als lijst.
2. **Zelfde les.** Met een vaste opslag en een vaste zaadwaarde voor het husselen levert de samensteller dezelfde rij op als `startLesson()` en `startEnglish()` vóór fase 2: zelfde vormen, zelfde woorden, zelfde volgorde. Leg de rij van vóór de ombouw eerst vast als verwachte uitkomst.
3. **Veilig tonen.** Een pakket met een verboden tag of een script in een tekst wordt geweigerd, en de toonfunctie laat het niet door.
4. **Ontbrekend pakket.** De app start, meldt het, en de opslag is daarna ongewijzigd.
5. `BUILTIN` en `SHELL` noemen dezelfde bestanden.
6. De bestaande vier tests blijven groen; `test-oefeningen.mjs` leest de woorden uit het pakket.

## Wat fase 2 niet doet

- Geen nieuwe inhoud, geen andere teksten, geen neutrale plaatsnamen (fase 4).
- Geen ander herhaalmodel en geen derde oefenvorm (fase 3).
- De vertaaltabel van de interface (`I18N`) blijft in `index.html`. De kortingssommen houden hun teksten daar tot ze in fase 3 uit een recept met getallen komen.
