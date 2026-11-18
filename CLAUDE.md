# Alatro: Regeln für Claude

Privates Roguelike Poker Deckbuilder Spiel als Web App (PWA) fürs iPad. Nur für den Eigentümer, keine Veröffentlichung.

**Zuerst lesen:** `docs/HANDOFF.md` (aktueller Stand und nächster Schritt), dann `AUDIT.md` (Abweichungsliste, Status, offene Punkte).

## Feste Regeln

* **Kein Nachbau eines bestimmten Spiels:** Genre Mechaniken ja (Pokerhände, Chips mal Mult, Scoring Reihenfolge, Blinds, Shop, Zufallsströme). Inhalte sind **eigene** Entwürfe mit eigenen Namen und Effekten (Jokers, Bosse, Tags, Vouchers, Decks, Stakes, Consumables, Modifikatoren). Keine Originalkataloge, keine Originalnamen von Karten.
* **Keine Originalassets, kein Originalcode, nichts dekompilieren.** Grafik, Sound und Schrift sind selbst erstellt.
* **Thema:** "Sternwarte der Alchemisten" (nächtliches Observatorium und Alchemielabor). Inhaltsnamen auf Deutsch im Thema.
* **Sprache:** Spielbegriffe Englisch (Joker, Blind, Ante, Chips, Mult, Hands, Discards, Small Blind, Common, Enhancement, Seal, Edition usw.). Kommentare, Doku und sonstige UI Texte Deutsch.
* **Keine Gedankenstriche** in geschriebenen Texten (weder Bindestrich als Satzzeichen noch lange Striche). Kommas oder Punkte nutzen.
* **Alle Spielzahlen in `src/data/`**, keine Magic Numbers in Engine Code.
* **Engine (`src/core/`) ohne DOM.** UI (`src/ui/`, PixiJS) ruft nur Aktionen aus `src/core/game.ts` auf und spielt ScoreEvents ab.
* **Zufall nur über `RngStreams`** (Strom pro Key, `chance()` mit `run.rules.probMult`).
* Unsichere oder eigene Regelentscheidungen in `AUDIT.md` unter "Offene Punkte" eintragen.
* Nach jedem Meilenstein: Tests grün, `AUDIT.md` Status aktualisieren, kleine Commits, kurze Zusammenfassung (geändert, getestet, offen).
* Spielstand Format ändern nur mit neuer `SAVE_VERSION` und Migration in `src/save.ts`.

## Befehle

```bash
npm install
npm test            # Unit Tests (src), läuft auch in der CI vor dem Deploy
npm run test:spec   # Spezifikations Testsuite (tests/spec)
npm run build       # tsc + vite build
npm run dev         # Dev Server (im WLAN erreichbar)
```

Deploy: GitHub Pages über `.github/workflows/deploy.yml` bei Push auf `main` oder `claude/funny-brahmagupta-ic0bpe`. URL: https://eric-yeah.github.io/Alatro-/
