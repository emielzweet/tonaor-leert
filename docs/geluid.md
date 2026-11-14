# Ontwerp: geluid dat werkt met de stilteschakelaar aan

Stand: 15 november 2026. Eis van de eigenaar, letterlijk: "Silent is echt voor telefoon en bericht notificaties. Niet voor geluid in een app." en "Fix het op de juiste manier. Neem dit mee in de breedere ontwikkeling."

## Wat er is vastgesteld

Op de iPhone van de leerder (zie `STATUS.md`, "Open eis: geluid met de stilteschakelaar aan"):

- Voorlezen met de stem van het toestel (`speechSynthesis`) volgt de stilteschakelaar. Vier omwegen (een geluidje vlak ervoor, stil geluid in een lus, een tik via Web Audio, de audiosessie op afspelen) bleven stil en lieten muziek uit andere apps pauzeren. Ze zijn weer weg.
- **Een echt geluidsbestand via een audio-element speelt wél door de schakelaar heen.**

Dus: de app leest voor uit geluidsbestanden. De stem van het toestel blijft alleen als terugval, als er voor een tekst (nog) geen bestand is.

## De eis (masterplan F7)

Alles wat de app voorleest in het Nederlands, klinkt ook met de stilteschakelaar aan. Ook wat er nieuw bijkomt: geen lesstof zonder geluid voor wat voorgelezen wordt.

## Waar de bestanden vandaan komen

Drie bronnen, van beste naar terugval. De app kiest per tekst de beste die er is.

1. **Ingesproken door een mens** (de inspreekhulp, `aanbevelingen.md` 6.1): voor klankparen, dictee en de kernzinnen van een hoofdstuk, en voor afwisseling in stemmen. Gratis, maar handwerk.
2. **Gemaakt door een spraakprogramma, vooraf, op de computer**, en als bestand in de repo gezet. Dit is de hoofdbron.
3. **De stem van het toestel**, live, als terugval.

Voor bron 2 zijn er twee wegen:

| | A. Een open spraakprogramma, lokaal (aanbevolen om mee te beginnen) | B. Een spraakdienst in de cloud |
|---|---|---|
| Wat | een open-source programma dat op de computer draait en Nederlandse stemmen heeft (bijvoorbeeld Piper) | een betaalde dienst met natuurlijker stemmen, ook in het Thais |
| Kosten | geen | per teken; voor de huidige lesstof (75.000 tekens) en de aanvoer daarna een klein bedrag per maand |
| Sleutel, account | geen | ja |
| Kwaliteit | goed verstaanbaar, minder natuurlijk dan een dienst | natuurlijk |
| Thais | waarschijnlijk niet | ja |
| Wie beslist | valt binnen de werkorder | **de eigenaar** (geld en sleutel) |

**Standaardkeuze:** nu A, zodat het geluid deze week werkt zonder op een besluit te wachten. B blijft een keuze van de eigenaar; kiest hij die, dan worden de bestanden opnieuw gemaakt met dezelfde lijn, zonder dat de app verandert. Voordat een stem wordt gebruikt: de licentie van het stemmodel nakijken (sommige vragen een bronvermelding; die komt dan op Ik onder "Over de app").

Het installeren van het spraakprogramma op de computer van de eigenaar is een download; dat vraagt de bouwsessie eenmalig aan de eigenaar in haar eigen sessie.

## Hoe het werkt

**Per tekst één bestand.** De sleutel is een korte hash van de genormaliseerde tekst (zonder opmaak, met gewone spaties) plus de stem. Zo heeft dezelfde zin in twee pakketten maar één bestand, en ziet de lijn meteen wat nieuw is.

- **Opslag in de repo:** `audio/nl/<stem>/<hash>.m4a` (AAC, mono, ongeveer 24 tot 32 kbit/s; dat speelt overal op iOS). Per pakket een lijst `audio/<pakket>.json` met de hashes die het nodig heeft.
- **Omvang:** 75.000 tekens is ongeveer 80 tot 90 minuten spraak, bij 24 kbit/s ongeveer 15 MB. Dat is te veel om in één keer bij de installatie te laden, maar prima per pakket.
- **Offline:** de service worker laadt de geluiden van een pakket de eerste keer dat het pakket gebruikt wordt, en houdt ze in een eigen cache (los van de app-cache, zodat een nieuwe versie ze niet opnieuw hoeft te halen). Een cache die te groot wordt, gooit de geluiden weg van pakketten die lang niet gebruikt zijn.
- **Afspelen:** één audio-element, ontgrendeld bij de eerste tik. Snelheid gewoon en langzaam via `playbackRate` (0,8), zonder nieuwe bestanden.
- **Sommen met wisselende getallen:** gemaakt uit losse stukken die achter elkaar spelen: de getallen 0 tot en met 100 als woord, *honderd*, *duizend*, *euro*, *cent*, *komma*, *procent*, *uur*, *half*, *kwart over*, *kwart voor*, en de vaste zinsdelen van elke som. De app speelt de stukken na elkaar via hetzelfde element. Klinkt dat te hakkerig, dan krijgen de vaak gebruikte bedragen en tijden een eigen bestand.
- **Terugval:** geen bestand gevonden → de stem van het toestel, en een regel in een lijst (zoals bij "Mijn antwoord is ook goed"), zodat de lijn het bestand alsnog maakt.

**Wat er nooit gebeurt:** geen stil geluid in een lus, geen trucs met de audiosessie die andere apps pauzeren.

## De redactielijn

- De schrijver levert lesstof zoals nu. Een nieuwe stap in de lijn verzamelt alle teksten die de app kan voorlezen (woorden, voorbeeldzinnen, wat de ander zegt in een gesprek, luisterteksten, vragen die voorgelezen worden), maakt de ontbrekende bestanden, en werkt de lijst per pakket bij.
- **De poort:** een pakket zonder geluid voor een tekst die wordt voorgelezen, gaat niet uit. `pakketcheck` meldt het, de test faalt.
- **De reviewer** luistert een steekproef van tien zinnen per hoofdstuk: klopt de uitspraak, de klemtoon, de getallen? Een fout in de uitspraak is blokkerend (de app leert iets verkeerds).

## De Thaise steunregel

Met bron A is er waarschijnlijk geen goede Thaise stem. Tot de eigenaar over B beslist: de Thaise steunregel wordt voorgelezen met de stem van het toestel (en is dus stil met de schakelaar aan). Dat is een beperking die op Ik bij Voorlezen in één zin wordt uitgelegd.

## Raakvlak met opnemen en de inspreekhulp

`werkvormen.md` 4.1 (opnemen en terugluisteren) en de inspreekhulp gebruiken hetzelfde audio-element en dezelfde ontgrendeling. Een opname van een mens voor een tekst krijgt dezelfde hash en wint van het gemaakte bestand.

## Wat kan breken

- **Omvang van de repo en de download:** per pakket laden en een cache met grens.
- **Een stem die een woord verkeerd uitspreekt:** de steekproef van de reviewer, en een uitzonderingslijst met de schrijfwijze die het programma goed uitspreekt.
- **Een nieuwe versie van de stem:** andere hash, dus alles opnieuw; de stem staat in het pad, zodat de oude bestanden blijven tot alles over is.
- **iOS pauzeert muziek van andere apps zolang er geluid speelt.** Dat is gewoon gedrag bij afspelen; het stopt zodra het voorlezen klaar is.

## Volgorde

1. Een proef op de iPhone met tien bestanden uit bron A: spelen ze met de schakelaar aan, ook na elkaar (voor sommen)?
2. Het afspelen in de app met terugval, en de lijst van teksten zonder bestand.
3. De lijnstap die de bestanden maakt, en de poort.
4. Alle bestaande lesstof (ongeveer 1.800 teksten), in delen per pakket.
5. De service worker met de eigen geluidscache.
6. Getallen uit stukken.
7. De inspreekhulp en opnemen (`werkvormen.md` 4.1) op hetzelfde afspelen.
