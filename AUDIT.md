# AUDIT

Abgleich der bestehenden Version mit `balatro_briefing.md` (Abschnittsnummern in Klammern).
Stand: Audit vor Beginn der Umbauten.

## Rahmen und Entscheidungen

* **Umfang:** Übernommen werden allgemeine Genre Mechaniken und Technik: Pokerhände, Scoring Reihenfolge, Retrigger, Blind Skalierung, Wirtschaft, Shop Regeln, Zufallsströme, Architektur, UI Konzept.
* **Kein Originalkatalog:** Der Datenkatalog aus Abschnitt 4 (Original Jokers, Tarot, Planet, Spectral, Vouchers, Tags, Bosse, Decks, Stakes mit Namen und Effekten) wird **nicht** nachgebaut. Stattdessen entsteht ein eigener Katalog mit eigenen Namen und eigenen Effekten in denselben Systemen (Consumable Typen, Vouchers, Tags, Bosse, Decks, Stakes). Tests aus 10.3, die Originalkarten nennen, prüfen dieselbe Mechanik mit neutralen Test Jokers und Test Modifikatoren.
* **Keine Originalassets, kein Originalcode.** Grafik, Sound und Schrift sind eigene Entwürfe.
* **Tech Stack bleibt:** TypeScript, Vite, PixiJS 8, Vitest, PWA (8.3 empfiehlt genau das für eine bestehende Web Version).

## Teststand

| Suite | Befehl | Ergebnis |
|---|---|---|
| Vorhandene Unit Tests (`src/**/*.test.ts`) | `npm test` | 26 von 26 grün |
| Spezifikation 10.3 (`tests/spec/`) | `npm run test:spec` | 50 grün, 37 rot (Messlatte) |

Die Spezifikationstests laufen über den Adapter `tests/spec/helpers.ts`. Fehlende Engine Funktionen werfen dort "Noch nicht implementiert". Beim Umbau wird nur der Adapter angepasst, die erwarteten Werte bleiben. Die CI (GitHub Pages Deploy) führt nur `npm test` aus, damit rote Spezifikationstests das Deployment nicht blockieren.

## Projektstruktur (Ist)

| Bereich | Ort |
|---|---|
| Karten, Deck, Sortierung | `src/core/cards.ts` |
| Pokerhände, Basiswerte, Level | `src/core/hands.ts`, Erkennung in `src/core/handEval.ts` |
| Scoring mit ScoreEvent Protokoll | `src/core/scoring.ts` |
| Jokers (Definition und Effekte gemischt) | `src/core/jokers.ts` |
| Blinds, Ziele, Belohnungen | `src/core/blinds.ts` |
| Run Ablauf, Geld, Zinsen | `src/core/run.ts` |
| Zufall | `src/core/rng.ts` (ein mulberry32 Strom) |
| Speichern | `src/save.ts` (localStorage, JSON) |
| UI | `src/ui/` (PixiJS, `Game.ts` enthält Szenen und Ablaufsteuerung) |
| Shop, Consumables, Vouchers, Tags, Bosse, Decks, Stakes | nicht vorhanden |

## Abweichungen

Schweregrad: **Zahl** (falsche Zahl), **Reihenfolge** (falsche Reihenfolge), **Feature** (fehlendes Feature), **Architektur** (Architekturproblem).

### Pokerhände (2)

| ID | Ist | Soll | Schweregrad | Aufwand | Status |
|---|---|---|---|---|---|
| H1 | `containsHand(..., 'twoPair')` liefert true für Four of a Kind | Four of a Kind enthält kein Two Pair (2.3) | Zahl | klein | offen |
| H2 | Kein `containedHands` Set, Joker prüfen einzeln | Ein Set pro Kartenmenge, Handtyp = höchster Eintrag (2.3) | Architektur | klein | offen |
| H3 | Keine Erkennungsregeln | `detect(cards, rules)` mit Regeln für 4 Karten Flush und Straight, Lücken Straight, gleichfarbige Suits, alle Karten scoren, alle Karten Face (2.2, 8.2) | Feature | mittel | offen |
| H4 | Kein Anzeigename Royal Flush | Straight Flush 10 bis Ace wird als Royal Flush angezeigt, teilt Werte (2.1) | Feature | klein | offen |
| H5 | Keine ranglosen Karten, keine Joker Suit (jede Suit) | Ranglose Karte scort immer, Joker Suit zählt als jede Suit (2.2, 3.6) | Feature | mittel | offen |
| H6 | Kein Konzept "Secret Hand" | Secret Hands bis zum ersten Spielen in der Run Info versteckt (2.2) | Feature | klein | offen |
| H7 | Debuff fehlt | Debuffte Karten zählen für die Erkennung, liefern aber nichts (2.2, 3.2) | Feature | mittel | offen |

### Scoring Pipeline (3)

| ID | Ist | Soll | Schweregrad | Aufwand | Status |
|---|---|---|---|---|---|
| S1 | Phasen: Basis, Karten (Chips, dann Joker), Held (nur Joker), Joker | Before, Basis mit Boss Modifikatoren, Karten (Chips, Modifikator, Siegel, Edition, Joker), Held (Modifikator, Joker), Joker (Edition vor, Effekt, other joker, Edition nach), Consumable Phase, Balance, Floor, After (3.1 bis 3.4) | Reihenfolge | groß | offen |
| S2 | Keine Retrigger | Retrigger wiederholen die komplette Kartensequenz, Karten Retrigger zuerst, dann Jokers links nach rechts, additiv (3.2, 3.3) | Feature | mittel | offen |
| S3 | Keine Karten Modifikatoren, Siegel, Editions | Eigene Typen mit Effekten in der Reihenfolge aus 3.2 | Feature | groß | offen |
| S4 | Keine Boss Modifikatoren im Scoring | Level senken (min. 1), Basis halbieren mit Aufrunden, Hand wertlos (3.1 Schritt 0) | Feature | mittel | offen |
| S5 | Keine Balance Regel | Chips und Mult am Ende mitteln (Deck Regel, 3.1 Schritt 7) | Feature | klein | offen |
| S6 | `onHandPlayed` läuft vor dem Scoring, After Phase fehlt | Getrennte Before und After Phase (3.1 Schritte 1 und 9) | Reihenfolge | klein | offen |
| S7 | ScoreEvent Protokoll vorhanden, aber ohne Typ, Phase und Text | Event mit Typ, Quelle, Wert, laufenden Chips und Mult, Nachricht (8.2) | Architektur | klein | offen |

### Jokers (4.1, 8.2)

| ID | Ist | Soll | Schweregrad | Aufwand | Status |
|---|---|---|---|---|---|
| J1 | Mehrere Hook Funktionen pro Joker, Zahlen direkt im Code | `JokerDef` mit `config` (Zahlen als Daten) und einem `calculate(ctx)` Hook mit Phase im Kontext, Adapter für die 9 vorhandenen Jokers (8.2) | Architektur | mittel | offen |
| J2 | Keine Kompatibilitätsfelder | `copyCompat`, Sticker Kompatibilität, `spawnCondition` (4.2, 8.2) | Feature | klein | offen |
| J3 | 9 eigene Jokers | Eigener Katalog in Mechanik Gruppen analog 10.1 M3 (einfach, Karte, Held, Retrigger, Skalierend, Geld, Blind und Shop, Passiv, Spezial), jede Gruppe mit Tests | Feature | groß | offen |
| J4 | Joker Editions fehlen | Eigene Editions mit Phase vor bzw. nach dem Joker (3.4, 6.4) | Feature | mittel | offen |

### Consumables, Vouchers, Tags, Bosse, Decks, Stakes (4.3 bis 4.9)

| ID | Ist | Soll | Schweregrad | Aufwand | Status |
|---|---|---|---|---|---|
| K1 | Keine Consumables, Slot Anzeige ist Platzhalter | 3 eigene Consumable Typen (Hand Level, Karten verändern, riskante Effekte), 2 Slots, Benutzen aus Slot und Shop | Feature | groß | offen |
| K2 | Keine Vouchers | Eigene Voucher Paare (Basis und Upgrade), 1 Slot im Shop pro Ante | Feature | mittel | offen |
| K3 | Kein Skip, keine Tags | Skip für Small und Big Blind mit eigenem Tag Katalog (1.1) | Feature | mittel | offen |
| K4 | Boss Blind ohne Effekt | Eigene Bosse mit Regeln, Auswahlregel, Mindest Ante, eigene Showdown Bosse für Ante 8, 16 usw. | Feature | groß | offen |
| K5 | Ein Standarddeck | Eigene Start Decks mit Regeln | Feature | mittel | offen |
| K6 | Keine Stakes | Eigene kumulative Schwierigkeitsstufen inkl. Skalierung 1 bis 3 und Small Blind ohne Belohnung | Feature | mittel | offen |

### Blind Ziele und Belohnungen (5)

| ID | Ist | Soll | Schweregrad | Aufwand | Status |
|---|---|---|---|---|---|
| B1 | Nur Skalierung 1 | Tabellen für Skalierung 1, 2, 3 (5.1) | Zahl | klein | offen |
| B2 | Eigene Endless Formel | Formel aus 5.2, zwei signifikante Stellen abgerundet | Zahl | klein | offen |
| B3 | Faktoren 1, 1.5, 2 fest | Boss spezifischer Faktor und Deck Faktor (5.1) | Feature | klein | offen |
| B4 | Belohnung 3, 4, 5 | Zusätzlich Showdown Belohnung 8, Small Blind 0 auf höherem Stake (5.3) | Zahl | klein | offen |
| B5 | Zinsdeckel 5 fest im Code | Deckel konfigurierbar (Voucher), Zahlen aus `data/` (1.4) | Zahl | klein | offen |

### Shop (6)

| ID | Ist | Soll | Schweregrad | Aufwand | Status |
|---|---|---|---|---|---|
| P1 | Kein Shop, nur Auswahl 1 aus 3 Jokers als Platzhalter | 2 Karten Slots, 2 Pack Slots, 1 Voucher, Reroll 5 plus 1, Next Round (6.1) | Feature | groß | offen |
| P2 | Rarity Gewichte im UI Code | Gewichte 70, 25, 5 und Typgewichte aus Daten (6.2, 6.3) | Zahl | klein | offen |
| P3 | Keine Preisformel | (Basis plus Edition Aufschlag plus Inflation) mal Rabatt, halbe Beträge abrunden, min. 1 (6.5) | Feature | klein | offen |
| P4 | Keine Booster Packs | Eigene Pack Typen in Normal, Jumbo, Mega mit Gewichten und Pack Ansicht (6.6) | Feature | groß | offen |
| P5 | Sell Value aus Basispreis | Sell Value aus aktuellem Kaufpreis (1.4) | Zahl | klein | offen |

### Zufall (7)

| ID | Ist | Soll | Schweregrad | Aufwand | Status |
|---|---|---|---|---|---|
| R1 | Ein globaler Strom | Strom pro Key, initial `hash(seed + key)` (7.2) | Architektur | mittel | offen |
| R2 | Kein `chance()` | `chance(num, den, key)` mit Wahrscheinlichkeitsfaktor (7.2, 7.3) | Feature | klein | offen |
| R3 | Keine Seed Eingabe, Seeds ohne O, 0, 1, I | Seed Eingabe 0 bis 8 Zeichen, 0 und O gleich behandeln (7.1) | Feature | klein | offen |
| R4 | Kein Resample und Fallback bei leerem Pool | Resample Strom und Fallback Item pro Typ (7.1) | Feature | klein | offen |

### Architektur (8)

| ID | Ist | Soll | Schweregrad | Aufwand | Status |
|---|---|---|---|---|---|
| A1 | Kein `data/` Ordner, Zahlen verteilt im Code | Alle Spielzahlen in `src/data/` (8.2, 10.4) | Architektur | mittel | offen |
| A2 | Spielablauf steckt in `ui/Game.ts` | Expliziter Zustandsautomat in der Engine, UI reagiert nur (8.2) | Architektur | mittel | offen |
| A3 | Spielstand ohne Version | Versioniertes Save Format mit Migration, inkl. Strom Zuständen (10.4, M4) | Architektur | klein | offen |
| A4 | Engine ohne DOM | bleibt so (8.2) | keiner | | erledigt |

### UI und UX (9)

| ID | Ist | Soll | Schweregrad | Aufwand | Status |
|---|---|---|---|---|---|
| U1 | Layout entspricht weitgehend 9.1 | Zusätzlich Run Info und Options Buttons, Hand Level Übersicht | Feature | mittel | offen |
| U2 | Hintergrund Shader fix | Farbstimmung pro Blind (Small ruhig, Big kräftiger, Boss dramatisch) (9.1, 9.4) | Feature | klein | offen |
| U3 | Kein CRT Effekt | Eigener CRT Post Processing Shader, abschaltbar (9.4) | Feature | mittel | offen |
| U4 | Kein Sound | Selbst erzeugte Sounds (WebAudio Synthese), steigende Tonhöhe beim Zählen (9.5) | Feature | mittel | offen |
| U5 | Kein Screen Shake, keine Stufen nach Score | Shake und Flash in Stufen (9.3) | Feature | klein | offen |
| U6 | Keine Edition Shader | Eigene Glanz Shader für Editions (9.4) | Feature | mittel | offen |
| U7 | Blind Auswahl ohne Skip | Skip Button mit Tag Vorschau (9.1) | Feature | klein | offen |
| U8 | Keine Optionen | Animationstempo, CRT an oder aus, Lautstärke (M6) | Feature | klein | offen |
| U9 | Systemschrift | Eigene oder frei lizenzierte Pixelschrift (9.2) | Feature | klein | offen |

## Behalten

* **Tech Stack und PWA Setup** inkl. GitHub Pages Deploy und iPad Bedienung (Querformat, Touch, Vollbild).
* **Engine ohne DOM** in `src/core`, UI getrennt in `src/ui`.
* **Hand Erkennung** für alle 12 Typen inkl. Scoring Cards, Ace hoch und niedrig, kein Wraparound (Block A und Property Test grün).
* **Basiswerte und Level Formel** der Hände (2.1).
* **Blind Ziele Skalierung 1 für Ante 1 bis 8**, Faktoren 1, 1.5, 2, Belohnungen 3, 4, 5, Zinsen auf dem Vorab Bestand, 1 Dollar pro übriger Hand.
* **Startwerte** 4 Hands, 3 Discards, Hand Size 8, 5 Joker Slots, 4 Dollar.
* **ScoreEvent Protokoll** mit laufenden Chips und Mult, die UI spielt es Schritt für Schritt ab.
* **Deterministischer Seed Run** mit serialisierbarem Zustand, Speichern und Fortsetzen.
* **Joker Reihenfolge per Ziehen, Verkaufen, Tooltip** und der vorhandene Look (Shader Hintergrund, Kartenstil, Animationen).

## Plan

| Meilenstein | Inhalt | Tests, die grün werden |
|---|---|---|
| M1 | `src/data/` anlegen. Hand Erkennung mit `containedHands` und Regeln, Royal Flush Anzeige, Scoring Pipeline nach 3.1 bis 3.4 inkl. Retrigger, Karten Modifikatoren als Daten, Boss Modifikatoren, Balance, Blind Ziele mit 3 Skalierungen und Endless Formel, Boss und Deck Faktoren, Belohnungen, konfigurierbarer Zinsdeckel | A, B, C, D1 bis D4, D6, E, G |
| M2 | Zustandsautomat in der Engine, Skip und Tags, Bosse mit Effekten, Shop mit Reroll, Preisformel, Packs, Vouchers, Decks, Stakes, Zufallsströme pro Key mit `chance()` | D5, D7, F |
| M3 | `JokerDef` mit `config` und `calculate`, Adapter für die vorhandenen Jokers, danach eigener Katalog gruppenweise mit Tests | neue Gruppentests |
| M4 | Consumables, Modifikatoren, Siegel, Editions, Pack Abläufe, Collection, Run Info, Seed Eingabe, versioniertes Speichern | neue Tests |
| M5 | UI und Juice nach Abschnitt 9: Skip Button, Shop Szene, Pack Ansicht, CRT, Farbstimmung pro Blind, Sound, Shake | Sichtprüfung |
| M6 | Politur, Performance, Optionen | |

## Offene Punkte

Stellen aus dem Briefing, die als [UNSICHER] markiert sind. Umgesetzt wird jeweils die Empfehlung, bitte im Original prüfen.

| Nr | Thema | Umgesetzte Empfehlung |
|---|---|---|
| O1 | Startwerte (Anhang A 2) | 4 Hands, 3 Discards, Hand Size 8, 5 Joker Slots, 2 Consumable Slots, 4 Dollar |
| O2 | Rundung (3.1 Schritt 8) | Chips und Mult als Gleitkommazahl führen, Hand Score am Ende abrunden. Halbieren durch Boss rundet auf |
| O3 | Balance Regel bei ungerader Summe (3.1 Schritt 7) | Durchschnitt abrunden |
| O4 | Edition Reihenfolge (3.2, 3.4) | Karte: Modifikator vor Edition. Joker: additive Editions vor, multiplikative nach dem Joker Effekt |
| O5 | Karten Retrigger auf gehaltene Karten (3.3) | Wirkt auch auf Held Effekte |
| O6 | Boss Effekt "Hand scort nichts" (3.1 Schritt 0) | Score der Hand ist 0, die Hand wird verbraucht |
| O7 | Ranglose Karte zählt immer als Scoring Card (3.6) | Ja |
| O8 | Debuffte Karten in der Hand Erkennung (2.2) | Zählen für die Erkennung, liefern keine Chips und keine Effekte |
| O9 | contains Three of a Kind bei Four of a Kind (2.3) | Ja, enthalten |
| O10 | Zinsen auf Vorab Bestand oder nach Auszahlung (1.4) | Vorab Bestand |
| O11 | Wahrscheinlichkeitsfaktor bei mehreren Quellen (7.3) | Faktor 2 hoch Anzahl der Quellen |
| O12 | Negative Edition im Shop (6.4) | Erlaubt mit 0.3 Prozent |
| O13 | Edition Wurfschema (6.4) | Ein Wurf, Schwellen von oben nach unten, Rate Faktor für Voucher |
| O14 | Gewichte der Händler Vouchers für den Planet Typ (6.2) | Analog zum Tarot Typ |
| O15 | Booster Aufpreis auf höherem Stake (6.5) | Nicht umsetzen |
| O16 | Endless Rundung (5.2, Test E9) | Zwei signifikante Stellen abrunden, Test E9 erwartet 4.7e10 |
| O17 | Rang plus 1 bei Ace (3.8) | Ace wird zu 2 |
