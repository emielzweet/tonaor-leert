# Tonaor leert Nederlands

Leer-app (PWA) voor Tonaor: Nederlands, rekenen en Engels, met Thaise ondersteuning. Draait als "Zet op beginscherm"-app op Tonaors iPhone. Communiceer met Emiel in het Nederlands.

## Herkomst

- Gemaakt in een claude.ai-chat (10 nov 2026). Gepubliceerde versie: artifact "Tonaor leert Nederlands" — https://claude.ai/artifact/RtChvdCwPJnQwmC5eZHFQo
- Onderbouwd ontwerp (didactiek, thema's, roadmap): Claude Docs "Leeromgeving Nederlands en rekenen voor Tonaor – onderbouwd ontwerp" — https://claude.ai/artifact/8HcTBo2SRuYSvqzpNq7BZe
- Originele export stond in `C:\Users\emiel\Documents\Tonaor leert` (laten staan als back-up; dit project is nu de bron).
- **Deze map is leidend.** Werk de artifact alleen bij als Emiel daarom vraagt; dan de body van `index.html` publiceren zonder de PWA-kop (manifest, apple-meta's, sw-registratie), en `tlsync.js` inline zetten (de artifact kent geen losse bestanden).

## Bestanden

- `index.html` — de app (CSS + JS inline, geen build), behalve de koppeling.
- `tlsync.js` — **gebouwd bestand**, niet met de hand wijzigen. Bron `tools/tlsync.src.js`; bouwen met `node tools/build-tlsync.mjs` (plakt de vastgelegde noble-bundel `tools/noble-2.4.0.min.js` ervoor). Precies hetzelfde bestand staat in de EDGE-widget als `scripts/tlsync.js`: na een wijziging daar ook vervangen. Thema-1-inhoud staat bovenaan het script (`NL`, `EN`, `REK`, `SENT`, `PAIRS`, `STORY`).
- `sw.js` — offline-cache. **Verhoog `CACHE` (`tonaor-leert-v2-N`) bij elke release.**
- `manifest.webmanifest`, `icons/` — beginscherm-icoon.
- `LEESMIJ.md` — uitleg voor Emiel (publiceren via GitHub Pages, tips).

## Belangrijk bij wijzigen

- Voortgang staat in `localStorage` onder sleutel `tonaor-leert-v2` (`S.v===2`). Nooit de sleutel of structuur breken zonder migratie: anders verliest Tonaor zijn/haar voortgang. Nieuwe items worden bij laden automatisch aangevuld.
- TLSync 2 (issues #1 en #2, 11 nov 2026): versleutelde koppeling met het EDGE Masterplan via ntfy.sh, kanalen `<chan>-up` (app → EDGE) en `-down`. Het formaat volgt uit de code:
  - **TL2** (`S.code2`, 28 tekens Crockford-base32, 140 bits): scrypt (N=2^15, r=8, p=1) + HKDF-SHA256, AES-256-GCM-SIV met de richting als AAD. Nonce uit `crypto.getRandomValues`, zonder veilig toeval afgeleid via HMAC (nooit `Math.random`).
  - **TL1** (`S.code`, oud): alleen voor de overstap. De app stuurt via beide tot de EDGE een `{type:'hello',v:2}` op TL2-down stuurt; dan `S.v2ok=true` en stopt TL1. Wijzig de TL1-afleiding niet.
  - Nieuwe installaties krijgen alleen een TL2-code. Wissen (Ik → Alles wissen) bewaart de codes.
  - Kan een toestel geen code maken (geen veilig toeval), dan vult Emiel een code in (Ik → Een code van Emiel invullen); de EDGE toont dan een reservecode.
- EDGE-widget: `%APPDATA%\Corsair\CUE5\html_widgets\nl\emiel\edgeplan` (geïnstalleerd), pakketten en logboek in `Documents\EDGE` (`LEESMIJ-MASTERPLAN.txt`: altijd op de nieuwste versie verder bouwen). Scherm 19 = `scripts/tonaor.js`.
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
2. ~~EDGE-tegel voor Tonaor~~: bestaat (scherm 19, Masterplan 3.x).
3. Volledige startmeting en thema 2 t/m 4.
