# Tonaor leert Nederlands

Leer-app (PWA) voor Tonaor: Nederlands, rekenen en Engels, met Thaise ondersteuning. Draait als "Zet op beginscherm"-app op Tonaors iPhone. Communiceer met Emiel in het Nederlands.

## Herkomst

- Gemaakt in een claude.ai-chat (10 nov 2026). Gepubliceerde versie: artifact "Tonaor leert Nederlands" — https://claude.ai/artifact/RtChvdCwPJnQwmC5eZHFQo
- Onderbouwd ontwerp (didactiek, thema's, roadmap): Claude Docs "Leeromgeving Nederlands en rekenen voor Tonaor – onderbouwd ontwerp" — https://claude.ai/artifact/8HcTBo2SRuYSvqzpNq7BZe
- Originele export stond in `C:\Users\emiel\Documents\Tonaor leert` (laten staan als back-up; dit project is nu de bron).
- **Deze map is leidend.** Werk de artifact alleen bij als Emiel daarom vraagt; dan de body van `index.html` publiceren zonder de PWA-kop (manifest, apple-meta's, sw-registratie).

## Bestanden

- `index.html` — de hele app (CSS + JS inline, geen build). Thema-1-inhoud staat bovenaan het script (`NL`, `EN`, `REK`, `SENT`, `PAIRS`, `STORY`).
- `sw.js` — offline-cache. **Verhoog `CACHE` (`tonaor-leert-v2-N`) bij elke release.**
- `manifest.webmanifest`, `icons/` — beginscherm-icoon.
- `LEESMIJ.md` — uitleg voor Emiel (publiceren via GitHub Pages, tips).

## Belangrijk bij wijzigen

- Voortgang staat in `localStorage` onder sleutel `tonaor-leert-v2` (`S.v===2`). Nooit de sleutel of structuur breken zonder migratie: anders verliest Tonaor zijn/haar voortgang. Nieuwe items worden bij laden automatisch aangevuld.
- TLSync: versleutelde koppeling met het EDGE Masterplan (iCUE-widget) via ntfy.sh. Koppelcode in `S.code`; kanalen `<chan>-up` (app → EDGE) en `-down`. Formaat `TL1.`; wijzig de afleiding (`tonaor-leert|`, 4000 rondes) niet, anders breekt de koppeling met de EDGE-kant.
- Alles tweetalig via `bi(nl, th)`. Kleurpalet: pastels, geen rood (bewuste keuze).
- Doelapparaat is iPhone/Safari: test op 375px breed.

## Lokaal testen

```
python -m http.server 8765 --bind 127.0.0.1
```
Open http://127.0.0.1:8765/. De service worker registreert niet in de browser-pane van de Claude-app (beperking van de pane); in Safari/Chrome wel.

## Publiceren

Live op GitHub Pages: https://emielzweet.github.io/tonaor-leert/ (publieke repo `emielzweet/tonaor-leert`, branch `main`, root; `.nojekyll` aanwezig). Op 10 nov 2026 via de website geüpload; op 11 nov lokaal samengevoegd en als `origin` gekoppeld. `gh` is ingelogd als `emielzweet`.

Release: wijzigen → `CACHE` in `sw.js` verhogen → commit → `git push`. De iPhone haalt de nieuwe versie op zodra hij online is.

## Roadmap (uit LEESMIJ)

1. Server (Docker: PocketBase, Caddy, Whisper) voor cloud-voortgang en opnemen.
2. EDGE Masterplan 2.4 met tegel voor Tonaor.
3. Volledige startmeting en thema 2 t/m 4.
