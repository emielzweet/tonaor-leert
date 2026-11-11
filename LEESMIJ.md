# Tonaor leert: iPhone-app (versie 2)

Dit is de app zelf, klaar om op Tonaors iPhone te zetten. Dezelfde app staat ook als artifact in Claude, om te bekijken en te testen.

## Wat zit erin

| Bestand | Wat het doet |
|---|---|
| `index.html` | De hele app: lessen, tuin, route, Ik en de meekijk-weergave |
| `manifest.webmanifest` | Zorgt dat de iPhone het als app op het beginscherm zet, met naam en icoon |
| `sw.js` | Laat de app ook zonder internet werken |
| `icons/` | Het app-icoon (een bloem in de zon) |

## Op de iPhone zetten (snelste route, gratis)

De app moet op een https-adres staan. Dat kan het makkelijkst met GitHub Pages, want je hebt al een GitHub-account.

1. Maak op github.com een nieuwe repository, bijvoorbeeld `tonaor-leert`. Zet hem op **Private** als je dat wilt (GitHub Pages werkt dan alleen met een betaald account; kies anders Public, er staat geen persoonlijke informatie in de bestanden).
2. Sleep alle bestanden uit deze map (ook de map `icons`) naar de repository en klik op **Commit changes**.
3. Ga naar **Settings → Pages**, kies bij *Branch* `main` en `/ (root)`, en klik op **Save**.
4. Na een minuut staat de app op `https://<jouw-naam>.github.io/tonaor-leert/`.
5. Open dat adres op Tonaors iPhone in **Safari**, tik op het deel-icoon en kies **Zet op beginscherm**.

Daarna opent de app als een gewone app, zonder adresbalk, en werkt hij ook offline.

## Goed om te weten

- **Voortgang staat op de telefoon zelf.** Zolang de server er nog niet is, bewaart de app alles lokaal op de iPhone. Wis dus niet de websitegegevens van Safari.
- **Meekijken** gaat automatisch: voortgang en hulpvragen gaan versleuteld via ntfy.sh naar je EDGE. Vul daar één keer de koppelcode in die in de app onder *Ik* staat. Handmatig kan ook: *Nu versturen* of *Via WhatsApp*.
- **Bijwerken:** zet een nieuwe `index.html` in de repository. De app haalt de nieuwe versie op zodra de telefoon online is.
- **Voorlezen** gebruikt de stemmen van de iPhone. De mooiste Nederlandse stem zet je aan via Instellingen → Toegankelijkheid → Gesproken materiaal → Stemmen → Nederlands (bijvoorbeeld een *Verbeterde* stem downloaden).
- **Opnemen** (spraakdagboek, keukentafelgesprek met AI-feedback) komt met de server, zoals beschreven in het plan.

## Volgende stappen

1. Server (Docker met PocketBase, Caddy en Whisper) zodat voortgang veilig in de cloud staat en jij meekijkt vanaf de EDGE.
2. EDGE Masterplan 2.4 met de tegel voor Tonaor.
3. Volledige startmeting en thema 2 tot en met 4.
