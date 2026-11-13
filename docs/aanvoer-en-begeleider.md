# Aanvoer van lesmateriaal en het scherm van de begeleider

Status: **ontwerp, 14 november 2026, wacht op akkoord van de eigenaar.** Twee dingen die in de eerdere ontwerpen te licht zijn meegenomen: hoe er genoeg lesmateriaal komt zonder dat elke stap apart gevraagd moet worden, en wat de begeleider op zijn scherm ziet van het nieuwe concept en de route.

## Stand van nu, eerlijk

- **Lesmateriaal** wordt geschreven wanneer de eigenaar een stap vrijgeeft. Er is geen vaste aanvoer, geen voorraad en geen planning. De dekkingstabel in `docs/STATUS.md` laat zien dat de lesstof het grootste gat is; bij tien uur per week speelt de leerder ruim vier hoofdstukken per week (`docs/concept-leerwereld.md`).
- **De begeleider** ziet wat de koppeling nu stuurt (voortgang, het weekdoel als bericht). In de ontwerpen van het nieuwe concept en de route staat alleen dat het protocol niet verandert. Dat voorkomt dat er iets breekt, maar de begeleider ziet daardoor niets van de plek op de kaart, wat de leerder nu kan, of de verwachte examendatum.

## Deel 1: de aanvoer van lesmateriaal

### Het principe

Schrijven is lopend werk met een voorraad, geen losse opdrachten. De regel: **er ligt altijd minstens twee weken lesstof klaar vóór de plek waar de leerder is.** Zakt de voorraad daaronder, dan is schrijven de eerstvolgende taak, vóór nieuwe functies.

### De lijn, per hoofdstuk

| Stap | Wat | Wie |
|---|---|---|
| 1. Opdracht | Eén regel uit de productielijst: plek, vak, niveau, doelwoorden, grammaticapunt, vaardigheid ("kunnen"). De lijst volgt `docs/leerroute.md` | ontwerp (eenmalig per blok) |
| 2. Schrijven | Het hoofdstuk als pakket: vijf scènes, de bijbehorende reken- of kennisscène, woorden met omschrijving en voorbeeldzin, steunregels | een goedkoper model, met `docs/scenes.md`, `docs/kwaliteitskader.md` en het voorbeeld als sjabloon |
| 3. Automatische controle | `pakketcheck`, de scènetest, de vertaaltest, `SceneVis.check`; de dekkingstabel wordt bijgewerkt | de testreeks |
| 4. Onafhankelijke review | Een aparte reviewer die alleen het pakket en het kwaliteitskader krijgt: klopt het Nederlands, het niveau, de uitleg bij elke fout, geen namen of persoonlijke gegevens | een tweede model, niet de schrijver |
| 5. Steuntaal | Thaise regels krijgen de stand "niet nagekeken" tot een moedertaalspreker ze heeft gezien; de knop "vertaling klopt niet" vangt de rest | de leerder en de begeleider |
| 6. Klaarzetten | Lokaal committen; één regel in `docs/STATUS.md` | de bouwsessie |
| 7. Uitbrengen | In één keer per week, met akkoord van de eigenaar | de eigenaar |

Wat de lijn niet doet: feiten voor Wereld en kennis verzinnen. Die lessen krijgen bronnen en een eigen stramien, en gaan alleen met een bronvermelding door stap 4.

### Hoe automatisch

Drie mogelijkheden:

- **A. Op verzoek (zoals nu):** de eigenaar zegt per keer "schrijf het volgende hoofdstuk". Geen verrassingen, maar de voorraad hangt af van of er iemand aan denkt.
- **B. Vaste taak (advies):** een geplande taak op de pc draait een paar keer per week de stappen 2 tot en met 6 voor het volgende hoofdstuk op de lijst, en stopt bij een voorraad van twee weken. De eigenaar krijgt één keer per week een overzicht en geeft één akkoord voor de release. Niets gaat zonder dat akkoord naar buiten.
- **C. Volledig automatisch uitbrengen:** ook stap 7 zonder akkoord. Afgeraden: de repo is openbaar, en een fout in de lesstof of een persoonlijk gegeven staat dan direct online.

Kosten van B: elke run kost tokens van het abonnement (schrijven en review van één hoofdstuk); de voorraadgrens voorkomt dat er meer wordt geschreven dan nodig is.

### Waar de app de voorraad aan afmeet

De pc weet niet vanzelf waar de leerder is; dat staat op de telefoon. De koppeling stuurt al voortgang naar het scherm van de begeleider. Tot dat bericht ook de plek op de kaart bevat (deel 2), rekent de aanvoer met het tempo uit de route: vier hoofdstukken per week bij het weekdoel.

## Deel 2: het scherm van de begeleider

### Wat de begeleider erbij moet zien

| Wat | Waarom |
|---|---|
| Verwachte datum van de eerstvolgende poort, met de bandbreedte en de verschuiving sinds vorige maand | de begeleider stuurt mee op tempo |
| Uren deze week tegenover het weekdoel, en het tempo van de laatste vier weken | staat er deels; het doel zelf nog niet |
| Waar de leerder is: blok, plek, scène | om erover te kunnen praten |
| Wat de leerder deze week nieuw kan ("kunnen" van de afgeronde scènes) | gespreksstof aan tafel, en de opdracht "doe het echt" |
| Wat hardnekkig fout gaat | gericht helpen |
| De tikken "te makkelijk / goed / te moeilijk" en "leuk / saai" | bijsturen |
| Meldingen "vertaling klopt niet" | steuntaal verbeteren |
| Voorraad lesstof: hoeveel weken ligt er klaar | zien of de aanvoer loopt |

### Hoe, zonder iets te breken

De widget weigert berichten met onbekende velden. Daarom in deze volgorde:

1. **Protocol beschrijven** (hoort bij issue #9): welke berichten er zijn, en een versienummer per bericht.
2. **Eerst de widget:** een nieuwe versie die de nieuwe berichten kent en de oude blijft begrijpen. Installeren en iCUE herstarten zijn aparte stappen met eigen toestemming.
3. **Dan de app:** stuurt de nieuwe berichten pas nadat de widget heeft laten weten dat hij ze kent (zoals bij de overstap naar de nieuwe koppeling met het hello-bericht). Een oude widget krijgt de oude berichten.
4. De berichten bevatten geen namen of vrije tekst van de leerder; alleen id's, getallen en datums. De widget controleert vorm en tijd zoals nu.

Alles blijft versleuteld over dezelfde kanalen; er komt geen nieuw geheim bij.

## Besluiten voor de eigenaar

1. **Aanvoer:** een vaste taak met een voorraad van twee weken en één wekelijks akkoord voor de release (B, advies), of op verzoek blijven werken (A)?
2. **Het scherm van de begeleider:** de lijst hierboven in één keer ontwerpen en bouwen na de scènespeler (advies), of eerst alleen de verwachte datum en het weekdoel?
3. **Thaise steunregels:** uitbrengen met de stand "niet nagekeken" en de meldknop (advies, anders ligt alles stil), of wachten tot een moedertaalspreker elk hoofdstuk heeft gezien?
