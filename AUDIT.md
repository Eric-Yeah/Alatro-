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
| Vorhandene Unit Tests (`src/core/core.test.ts`) | `npm test` | 26 von 26 grün |
| Spezifikation 10.3 (`tests/spec/`) | `npm run test:spec` | vor M1: 50 grün, 37 rot. Nach M1: 87 von 87 grün |
| Patch Notes und Anleitung (`src/patchnotes.test.ts`) | `npm test` | 3 von 3 grün |
| M1 Unit Tests (`src/core/m1.test.ts`) | `npm test` | 15 von 15 grün |
| M2 Unit Tests (`src/core/m2.test.ts`) | `npm test` | 31 von 31 grün |
| M4 Unit Tests (`src/core/m4.test.ts`, `m4info.test.ts`) | `npm test` | 62 von 62 grün |
| M3 Unit Tests (`src/core/m3.test.ts`) | `npm test` | 97 von 97 grün |
| M5 und M6 Unit Tests (`src/m5.test.ts`: Einstellungen, Stufen, Tonleiter, Stimmungen, Tempo, Grafikstufe, FPS Messung) | `npm test` | 15 von 15 grün |
| Review 0.4.0 (`src/core/fuzz.test.ts` Zufallsläufe mit Bot und Eingabeprüfung, Viewport mit sicheren Rändern) | `npm test` | gesamt 266 von 266 grün in `src`, Spezifikation 87 von 87 |
| Version 0.6.2 (`src/homeTitle.test.ts` Titel Daten) | `npm test` | gesamt 303 von 303 grün in `src`, Spezifikation 87 von 87 |
| Version 0.7.1 (`src/music.test.ts` Musik Daten, Komposition, Mix Planer, Einstellungen) | `npm test` | gesamt 337 von 337 grün in `src` (15 Musik Tests), Spezifikation 87 von 87 |
| Version 0.5.0 (`src/progress.test.ts` Stakes, skalierende Stufen, Tageslauf, Speicherversion 5, Profil, Erfolge; `src/tutorial.test.ts` Einführung; erweiterter Zufallslauf) | `npm test` | gesamt 301 von 301 grün in `src`, Spezifikation 87 von 87 |
| Version 0.6.0 (`src/hook.test.ts` Beinahe und Überschuss, Tippen beschleunigt, Atlas Hinweise und Neu Marker, Siegel am Deck) | `npm test` | gesamt 315 von 315 grün in `src`, Spezifikation 87 von 87 |

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
| H1 | `containsHand(..., 'twoPair')` liefert true für Four of a Kind | Four of a Kind enthält kein Two Pair (2.3) | Zahl | klein | erledigt |
| H2 | Kein `containedHands` Set, Joker prüfen einzeln | Ein Set pro Kartenmenge, Handtyp = höchster Eintrag (2.3) | Architektur | klein | erledigt |
| H3 | Keine Erkennungsregeln | `detect(cards, rules)` mit Regeln für 4 Karten Flush und Straight, Lücken Straight, gleichfarbige Suits, alle Karten scoren, alle Karten Face (2.2, 8.2) | Feature | mittel | erledigt |
| H4 | Kein Anzeigename Royal Flush | Straight Flush 10 bis Ace wird als Royal Flush angezeigt, teilt Werte (2.1) | Feature | klein | erledigt |
| H5 | Keine ranglosen Karten, keine Joker Suit (jede Suit) | Ranglose Karte scort immer, Joker Suit zählt als jede Suit (2.2, 3.6) | Feature | mittel | erledigt |
| H6 | Kein Konzept "Secret Hand" | Secret Hands bis zum ersten Spielen in der Run Info versteckt (2.2) | Feature | klein | erledigt |
| H7 | Debuff fehlt | Debuffte Karten zählen für die Erkennung, liefern aber nichts (2.2, 3.2) | Feature | mittel | erledigt |

### Scoring Pipeline (3)

| ID | Ist | Soll | Schweregrad | Aufwand | Status |
|---|---|---|---|---|---|
| S1 | Phasen: Basis, Karten (Chips, dann Joker), Held (nur Joker), Joker | Before, Basis mit Boss Modifikatoren, Karten (Chips, Modifikator, Siegel, Edition, Joker), Held (Modifikator, Joker), Joker (Edition vor, Effekt, other joker, Edition nach), Consumable Phase, Balance, Floor, After (3.1 bis 3.4) | Reihenfolge | groß | erledigt |
| S2 | Keine Retrigger | Retrigger wiederholen die komplette Kartensequenz, Karten Retrigger zuerst, dann Jokers links nach rechts, additiv (3.2, 3.3) | Feature | mittel | erledigt |
| S3 | Keine Karten Modifikatoren, Siegel, Editions | Eigene Typen mit Effekten in der Reihenfolge aus 3.2 | Feature | groß | erledigt |
| S4 | Keine Boss Modifikatoren im Scoring | Level senken (min. 1), Basis halbieren mit Aufrunden, Hand wertlos (3.1 Schritt 0) | Feature | mittel | erledigt |
| S5 | Keine Balance Regel | Chips und Mult am Ende mitteln (Deck Regel, 3.1 Schritt 7) | Feature | klein | erledigt |
| S6 | `onHandPlayed` läuft vor dem Scoring, After Phase fehlt | Getrennte Before und After Phase (3.1 Schritte 1 und 9) | Reihenfolge | klein | erledigt |
| S7 | ScoreEvent Protokoll vorhanden, aber ohne Typ, Phase und Text | Event mit Typ, Quelle, Wert, laufenden Chips und Mult, Nachricht (8.2) | Architektur | klein | erledigt |

### Jokers (4.1, 8.2)

| ID | Ist | Soll | Schweregrad | Aufwand | Status |
|---|---|---|---|---|---|
| J1 | Mehrere Hook Funktionen pro Joker, Zahlen direkt im Code | `JokerDef` mit `config` (Zahlen als Daten) und einem `calculate(ctx)` Hook mit Phase im Kontext, Adapter für die 9 vorhandenen Jokers (8.2) | Architektur | mittel | erledigt |
| J2 | Keine Kompatibilitätsfelder | `copyCompat`, Sticker Kompatibilität, `spawnCondition` (4.2, 8.2) | Feature | klein | erledigt (`copyCompat` und `minAnte` als Spawn Bedingung, Sticker gibt es nicht, siehe O47) |
| J3 | 9 eigene Jokers | Eigener Katalog in Mechanik Gruppen analog 10.1 M3 (einfach, Karte, Held, Retrigger, Skalierend, Geld, Blind und Shop, Passiv, Spezial), jede Gruppe mit Tests | Feature | groß | erledigt (79 Jokers) |
| J4 | Joker Editions fehlen | Eigene Editions mit Phase vor bzw. nach dem Joker (3.4, 6.4) | Feature | mittel | erledigt |

### Consumables, Vouchers, Tags, Bosse, Decks, Stakes (4.3 bis 4.9)

| ID | Ist | Soll | Schweregrad | Aufwand | Status |
|---|---|---|---|---|---|
| K1 | Keine Consumables, Slot Anzeige ist Platzhalter | 3 eigene Consumable Typen (Hand Level, Karten verändern, riskante Effekte), 2 Slots, Benutzen aus Slot und Shop | Feature | groß | erledigt |
| K2 | Keine Vouchers | Eigene Voucher Paare (Basis und Upgrade), 1 Slot im Shop pro Ante | Feature | mittel | erledigt |
| K3 | Kein Skip, keine Tags | Skip für Small und Big Blind mit eigenem Tag Katalog (1.1) | Feature | mittel | erledigt |
| K4 | Boss Blind ohne Effekt | Eigene Bosse mit Regeln, Auswahlregel, Mindest Ante, eigene Showdown Bosse für Ante 8, 16 usw. | Feature | groß | erledigt |
| K5 | Ein Standarddeck | Eigene Start Decks mit Regeln | Feature | mittel | erledigt |
| K6 | Keine Stakes | Eigene kumulative Schwierigkeitsstufen inkl. Skalierung 1 bis 3 und Small Blind ohne Belohnung | Feature | mittel | erledigt |

### Blind Ziele und Belohnungen (5)

| ID | Ist | Soll | Schweregrad | Aufwand | Status |
|---|---|---|---|---|---|
| B1 | Nur Skalierung 1 | Tabellen für Skalierung 1, 2, 3 (5.1) | Zahl | klein | erledigt |
| B2 | Eigene Endless Formel | Formel aus 5.2, zwei signifikante Stellen abgerundet | Zahl | klein | erledigt |
| B3 | Faktoren 1, 1.5, 2 fest | Boss spezifischer Faktor und Deck Faktor (5.1) | Feature | klein | erledigt |
| B4 | Belohnung 3, 4, 5 | Zusätzlich Showdown Belohnung 8, Small Blind 0 auf höherem Stake (5.3) | Zahl | klein | erledigt |
| B5 | Zinsdeckel 5 fest im Code | Deckel konfigurierbar (Voucher), Zahlen aus `data/` (1.4) | Zahl | klein | erledigt |

### Shop (6)

| ID | Ist | Soll | Schweregrad | Aufwand | Status |
|---|---|---|---|---|---|
| P1 | Kein Shop, nur Auswahl 1 aus 3 Jokers als Platzhalter | 2 Karten Slots, 2 Pack Slots, 1 Voucher, Reroll 5 plus 1, Next Round (6.1) | Feature | groß | erledigt |
| P2 | Rarity Gewichte im UI Code | Gewichte 70, 25, 5 und Typgewichte aus Daten (6.2, 6.3) | Zahl | klein | erledigt |
| P3 | Keine Preisformel | (Basis plus Edition Aufschlag plus Inflation) mal Rabatt, halbe Beträge abrunden, min. 1 (6.5) | Feature | klein | erledigt |
| P4 | Keine Booster Packs | Eigene Pack Typen in Normal, Jumbo, Mega mit Gewichten und Pack Ansicht (6.6) | Feature | groß | erledigt |
| P5 | Sell Value aus Basispreis | Sell Value aus aktuellem Kaufpreis (1.4) | Zahl | klein | erledigt |

### Zufall (7)

| ID | Ist | Soll | Schweregrad | Aufwand | Status |
|---|---|---|---|---|---|
| R1 | Ein globaler Strom | Strom pro Key, initial `hash(seed + key)` (7.2) | Architektur | mittel | erledigt |
| R2 | Kein `chance()` | `chance(num, den, key)` mit Wahrscheinlichkeitsfaktor (7.2, 7.3) | Feature | klein | erledigt |
| R3 | Keine Seed Eingabe, Seeds ohne O, 0, 1, I | Seed Eingabe 0 bis 8 Zeichen, 0 und O gleich behandeln (7.1) | Feature | klein | erledigt |
| R4 | Kein Resample und Fallback bei leerem Pool | Resample Strom und Fallback Item pro Typ (7.1) | Feature | klein | erledigt |

### Architektur (8)

| ID | Ist | Soll | Schweregrad | Aufwand | Status |
|---|---|---|---|---|---|
| A1 | Kein `data/` Ordner, Zahlen verteilt im Code | Alle Spielzahlen in `src/data/` (8.2, 10.4) | Architektur | mittel | erledigt |
| A2 | Spielablauf steckt in `ui/Game.ts` | Expliziter Zustandsautomat in der Engine, UI reagiert nur (8.2) | Architektur | mittel | erledigt |
| A3 | Spielstand ohne Version | Versioniertes Save Format mit Migration, inkl. Strom Zuständen (10.4, M4) | Architektur | klein | erledigt |
| A4 | Engine ohne DOM | bleibt so (8.2) | keiner | | erledigt |

### UI und UX (9)

| ID | Ist | Soll | Schweregrad | Aufwand | Status |
|---|---|---|---|---|---|
| U1 | Layout entspricht weitgehend 9.1 | Zusätzlich Run Info und Options Buttons, Hand Level Übersicht | Feature | mittel | erledigt (Run Info mit Händen, Blinds, Vouchers und Deck, Optionen über Menü) |
| U2 | Hintergrund Shader fix | Farbstimmung pro Blind (Small ruhig, Big kräftiger, Boss dramatisch) (9.1, 9.4) | Feature | klein | erledigt |
| U3 | Kein CRT Effekt | Eigener CRT Post Processing Shader, abschaltbar (9.4) | Feature | mittel | erledigt |
| U4 | Kein Sound | Selbst erzeugte Sounds (WebAudio Synthese), steigende Tonhöhe beim Zählen (9.5) | Feature | mittel | erledigt |
| U5 | Kein Screen Shake, keine Stufen nach Score | Shake und Flash in Stufen (9.3) | Feature | klein | erledigt |
| U6 | Keine Edition Shader | Eigene Glanz Shader für Editions (9.4) | Feature | mittel | erledigt |
| U7 | Blind Auswahl ohne Skip | Skip Button mit Tag Vorschau (9.1) | Feature | klein | erledigt |
| U8 | Keine Optionen | Animationstempo, CRT an oder aus, Lautstärke (M6) | Feature | klein | erledigt (CRT, Screen Shake, Lautstärke, Tempo, Grafikstufe und FPS Anzeige in den Optionen) |
| U9 | Systemschrift | Eigene oder frei lizenzierte Pixelschrift (9.2) | Feature | klein | offen |

## Fortschritt

### M1 (abgeschlossen)

* `src/data/` enthält alle Spielzahlen: Hände, Karten, Wirtschaft, Blinds, Shop Gewichte, Modifikatoren, Jokers.
* Hand Erkennung `detectHand(cards, rules)` mit `contained` Set, Regeln für 4 Karten Flush und Straight, Lücken Straight, gleichfarbige Suits, Splash, ranglose Karten und Karten mit jeder Suit. Royal Flush als Anzeigename.
* Scoring Pipeline nach 3.1 bis 3.4: Before, Basis mit Boss Modifikatoren, Karten mit Enhancement, Seal, Edition und Jokers, Retrigger (Seal zuerst, dann Jokers, additiv, auch für gehaltene Karten), Held Phase, Joker Phase mit Edition vor und nach dem Effekt, Balance, Abrunden, After mit zerbrechlichen Karten. ScoreEvents tragen Phase und Nachricht.
* Eigene Modifikatoren als Daten: 8 Enhancements (Kupfer, Rubin, Mondstein, Kristall, Eisen, Obsidian, Quecksilber, Gold), 3 Seals (Echo, Münz, Stern), 4 Editions (Schimmer, Aura, Prisma, Schatten). Im Spiel tauchen sie erst mit Shop und Consumables auf.
* Jokers nach Schema 8.2: `config` plus `calculate(ctx)`, Registry, Beschreibungen mit Platzhaltern. Die 9 vorhandenen Jokers behalten ihre IDs, alte Spielstände laufen weiter (J1 aus M3 vorgezogen, weil die Pipeline darauf aufbaut).
* Blind Ziele mit Skalierung 1 bis 3, Endless Formel, Boss und Deck Faktor, Showdown Belohnung 8, Small Blind Belohnung per Regel, konfigurierbare Zinsen über `RunRules`.
* Aus M2 vorgezogen, weil klein und rein: Zufallsströme pro Key mit `chance()`, Seed Normalisierung, Rarity Wurf, Preisformel, Reroll Kosten.
* Spielstand Version 2 mit Migration von Version 1.
* UI: Spielbegriffe auf Englisch (Small Blind, Hands, Discards, Play Hand, Rank, Suit, Common usw.), Popups für Retrigger und Regel Events.

### M2 (abgeschlossen)

* **Zustandsautomat** in `src/core/game.ts` mit den Phasen blindSelect, round, roundWon, shop, pack, gameOver. Die UI ruft nur noch Aktionen auf (selectBlind, skipBlind, playHand, afterHand, cashOut, buyCard, reroll, buyPack, pickFromPack, leaveShop).
* **Eigene Bosse** (`data/bosses.ts`): 12 normale und 2 Showdown Bosse mit deklarativen Effekten (Suit, Face oder gerade Ränge geschwächt, Hand Size, Discards, Level senken, Basis halbieren, Handtyp nur einmal, Mindestkarten, Geldverlust, Joker geschwächt, eigener Ziel Faktor). Auswahl nach Mindest Ante, Showdown alle 8 Antes, keine Wiederholung bis alle gesehen.
* **Skip und eigene Tags** (`data/tags.ts`): 11 Tags mit Zeitpunkt sofort, nächster Shop, nächste Runde, nächster Boss oder nächster Tag.
* **Shop** nach Briefing 6: Karten Slots (Jokers mit Rarity 70, 25, 5 und Edition Wurf), 2 Packs, 1 Voucher pro Ante, Reroll 5 plus 1 mit Reset, erstes Pack garantiert Joker Pack, Preisformel mit Rabatten, Verkaufswert aus Kaufpreis, Schatten Edition gibt +1 Slot.
* **Booster Packs** (`data/packs.ts`): Joker Packs und Karten Packs in Normal, Jumbo, Mega. Karten Packs erzeugen Karten mit eigenen Enhancements, Seals und Editions.
* **Eigene Vouchers** (`data/vouchers.ts`): 8 Paare aus Basis und Upgrade, deklarative Regeländerungen.
* **Eigene Decks** (`data/decks.ts`): 7 Decks. **Eigene Stakes** (`data/stakes.ts`): 6 kumulative Stufen mit Skalierung 2 und 3.
* **UI**: Run Setup mit Deck und Stake Auswahl, Blind Auswahl mit Skip und Tag Vorschau, Boss Name und Effekt im Blind Panel, Shop Szene, Pack Ansicht, geschwächte Karten abgedunkelt, Modifikatoren auf Karten sichtbar, offene Tags in der linken Spalte.
* Spielstand Version 3 mit Migration.
* Consumable Packs und der Typ Wurf der Shop Slots folgen mit den Consumables in M4.

### M3 (abgeschlossen, nach M4 nachgeholt)

* **Katalog** (`data/jokers.ts`): 79 Jokers, 45 Common, 23 Uncommon, 8 Rare, 3 Legendary (59, 30 und 11 Prozent der normalen Jokers). Die 9 alten IDs sind unverändert.
* **Gruppen:** 1 Einfache MAIN (14), 2 SCORED und HELD (16), 3 Retrigger (6), 4 Skalierend (7), 5 Geld (9), 6 Blind und Shop (7), 7 Passiv (11), 8 Spezial (6 plus 3 Legendary). Jede Gruppe hat Tests in `src/core/m3.test.ts`, dazu Katalog Tests und ein Rauchtest, der jeden Joker durch Hand, Discard, Auszahlung und Shop schickt.
* **Engine Erweiterungen:**
  * neue Phasen `other`, `discard`, `blindSelected`, `roundEnd`, `sell`. Außerhalb des Scorings ruft `runJokerHook` (`core/run.ts`) die Jokers auf. `roundEnd` rechnet für die Anzeige auf Kopien, nur das Einkassieren verändert den Zustand.
  * Kopierende Jokers (`copies: 'right' | 'leftmost'`), wirksam in allen Phasen außer Before, After und Other, nie verkettet, nur bei `copyCompat`.
  * Passive (`passive(cfg)`): Hands, Discards, Hand Size, Joker und Consumable Slots, Zinsdeckel, Shop Slots, gratis Rerolls, Rabatt, Wahrscheinlichkeit verdoppeln. Dazu `rules` (4 Karten, Lücken, gleichfarbig, Splash, jede Karte Face Card).
  * Rettung (`rescue`): verhindert die Niederlage ab einem Anteil des Ziels und verbraucht sich.
  * After Effekte auf Karten und Jokers: dauerhafte Chips auf gewertete Karten, Enhancement auf die erste gewertete Karte, Joker zerstört sich selbst.
  * `init(cfg)` für Startwerte skalierender Jokers, damit die Beschreibung vor dem ersten Wachsen den Wert zeigt. `minAnte` als Spawn Bedingung.
  * `ctx.isFace(card)` berücksichtigt die Regel "jede Karte ist Face Card" (vorher unbeachtet).
* **Legendary:** nur über das neue Omen Ahnenruf (Omen Gesamtzahl 9), nie im Shop und nie in Packs.
* **UI:** Joker Zeile in der Auszahlung, Zinsdeckel mit Joker Anteil, Meldungen bei Blind Wahl (Geld, Consumables) und Rettung, Jokers rücken bei mehr als 5 Slots zusammen.
* **Browser Test:** Run mit 7 Jokers (Anordnung, Tooltip) und Auszahlung mit Münzquelle, Handarbeit und Zinsmeister, keine Konsolenfehler. Die Animation einzelner Joker Effekte wurde nicht Bild für Bild geprüft.

### M4 (abgeschlossen)

* **Consumables** (`data/consumables.ts`, `core/consumables.ts`): 12 Sternbilder (je eine Hand, +1 Level, geheime Hände erst nach dem ersten Spielen), 21 Elixiere (8 Enhancements, 3 Seals, 4 Suits, Rang +1, Doppelgänger, Auflösung, Erntemond, Sternkarte, Alchemistentisch), 8 Omen mit Risiko (Blutmond, Aschenregen, Teufelsmarkt, Hexenkessel, Kometenstaub, Siegelsturm, Nachtpakt, Spiegelsaal), mit M3 kam Ahnenruf als 9. Omen dazu. Effekte sind deklarativ, die Engine wendet sie an.
* **Slots und Benutzen:** 2 Slots (Voucher Beutel und Rucksack erhöhen), Benutzen aus dem Slot, Verkauf aus dem Kaufpreis. Karten Ziele kommen aus der Hand der Runde, Elixiere und Omen mit Zufallsziel brauchen eine Hand.
* **Shop:** Typ Wurf über `rules.typeWeights` (Joker, Sternbild, Elixier, Spielkarte, Omen), Kaufen in den Slot oder Kaufen und Benutzen (nur ohne Karten Ziel).
* **Packs:** 9 neue Packs (Sternbild, Elixier, Omen je Normal, Jumbo, Mega). Eine Wahl wird sofort benutzt. Elixier und Omen Packs zeigen eine Hand aus 8 Deck Karten für die Ziele. 2 neue Tags (Sternschnuppe, Alchemistenkiste).
* **Vouchers:** 5 neue Paare: Beutel und Rucksack (Slots), Sternenhändler und Sternenmagnat, Kräuterhändler und Apotheker (Typ Gewichte), Fernrohr und Großfernrohr (Consumable Phase im Scoring), Kartentisch und Veredlertisch (Spielkarten im Shop).
* **Scoring:** Consumable Phase (Schritt 6): Sternbild im Slot gibt X1,5 oder X2 Mult auf seine Hand. Event Phase `consumable`.
* **Stern Seal:** erzeugt beim Einkassieren das Sternbild der zuletzt gespielten Hand pro gehaltener Karte, solange Slots frei sind.
* **Run Info** (`core/runInfo.ts`, `ui/RunInfoView.ts`): Hände mit Level, Chips mal Mult und Anzahl (geheime Hände versteckt), Blinds und Ziele aller Antes, Vouchers und offene Tags, Deck Übersicht.
* **Collection** (`collection.ts`, `ui/CollectionView.ts`): 9 Reiter, Einträge erscheinen, sobald sie gesehen wurden (Besitz, Shop, Pack, Blind Auswahl). Speicherort `alatro.collection.v1`.
* **Seed Eingabe:** Bildschirmtastatur im Run Setup, 0 bis 8 Zeichen, O gilt als 0, leer bedeutet zufällig.
* **Spielstand Version 4** mit Migration von Version 3 (Consumables, Typ Gewichte, neue Regeln).
* **Refactor:** Zufallsziehungen (Joker, Editions, Spielkarten, Consumables) in `core/generate.ts`, `ShopItem` ist eine Union aus Joker, Consumable und Spielkarte.
* **Browser Test:** Runde mit Slots, Elixier auf zwei Zielkarten, Pair mit Fernrohr (78 Punkte wie berechnet), Shop mit allen Karten Arten, Elixier Pack mit Zielwahl, Run Info, Sammlung, Seed Eingabe. Keine Konsolenfehler.

### M5 (abgeschlossen)

* **Farbstimmung pro Blind** (`ui/Background.ts`, `data/juice.ts`): Der Hintergrund Shader bekommt Farben, Kontrast, Randabdunklung und Atmen als Uniforms und blendet in 1,2 Sekunden weich um. Small ruhig und blau, Big kräftig in Bernstein, Boss dramatisch in Rot mit Atmen und schnellerem Fluss (die Bossfarbe färbt leicht mit), Shop und Packs gedämpft, Menü wie vorher.
* **CRT Filter** (`ui/crt.ts`): Eigener Post Processing Shader über der ganzen Szene mit leichter Wölbung, Scanlines in Bildschirmpixeln, Farbversatz am Rand, Randabdunklung und feinem Rauschen. Abschaltbar.
* **Sound** (`ui/audio.ts`): Alles per WebAudio Synthese, keine Audiodateien. Der AudioContext startet erst nach der ersten Berührung (iPad). Eigene Klänge für Bedienung, Karten, Zählen (Chips, Mult, X Mult, Geld, Retrigger mit steigender Tonhöhe auf einer pentatonischen Leiter), Aufschlag der Gesamtpunkte, Blind Start (Boss tief), Sieg, Niederlage, Shop (Kaufen, Verkaufen, Reroll, Pack öffnen, Wählen) und Consumables (Sternbild, Elixier, Omen).
* **Shake und Flash in Stufen** (`ui/stageFx.ts`, `ui/juiceMath.ts`): Die Stufe richtet sich nach Handpunkten geteilt durch Blind Ziel (5 Stufen in `SCORE_TIERS`). X Mult Effekte erschüttern zusätzlich nach Faktor. Sieg, Niederlage, Omen und Voucher haben eigene Effekte. Der Shake läuft über den Pivot der Wurzel und stört die Skalierung nicht.
* **Edition Shader** (`ui/editionFx.ts`): Schimmer (Folienstreifen mit Funkeln), Aura (rosa Wellen), Prisma (wandernder Regenbogen), Schatten (wabernde Dunkelheit mit hellem Rand). Ein Overlay über Karten und Jokers, ein gemeinsamer Filter pro Edition, additive Ausgabe über premultiplied Alpha.
* **Joker Grafiken** (`ui/jokerArt.ts`): Eigene Embleme (Stern, Sichel, Kolben, Auge, Sonne, Sanduhr, Orbit, Rune) über Sternenhimmel, aus der Joker ID abgeleitet. Neue Jokers aus M3 bekommen damit automatisch ein Bild.
* **Optionen** (`settings.ts`, Hauptmenü): CRT, Screen Shake, Lautstärke in Zehnerschritten, gespeichert unter `alatro.settings.v1`.
* **Browser Test** (Playwright, Chromium mit WebGL): Menü, Optionen, Runde mit allen vier Editions auf Karten und Jokers in Small, Big und Boss, eine gespielte Hand mit Animation. Keine Konsolenfehler. Der Klang selbst lässt sich ohne Audiogerät nicht hören, geprüft ist nur, dass kein Fehler auftritt. Bitte auf dem iPad anhören.

### M6 (in Arbeit, Stand: Optionen und Performance Schalter fertig)

* **Animationstempo** (`data/juice.ts` `SPEED_STEPS`, `settings.ts` `speedFactor`): Normal, Schnell (1,6), Sehr schnell (2,5), Blitz (5). Wirkt zentral in `tween()` und `wait()`, also auf Zählen, Karten, Übergänge und Zwischenpausen. Der wackelnde Titel im Menü bleibt im Takt (`ambient`).
* **Grafikstufe** (`QUALITY_PROFILE`): Voll oder Sparsam. Sparsam deckelt die Bildrate auf 30, die Auflösung auf 1, schaltet den CRT Filter ab und blendet die Edition Shader aus (`renderable`, kein Filter Durchlauf pro Karte). Wechsel gilt sofort ohne Neustart.
* **FPS Anzeige** (`ui/perf.ts` `FpsMeter`): kleine Anzeige oben rechts mit Bildrate und längstem Frame, abschaltbar. Gedacht für die Prüfung auf dem iPad.
* **Optionen** (Menü): jetzt CRT, Screen Shake, Lautstärke, Tempo, Grafik, FPS Anzeige. Gespeichert unter `alatro.settings.v2` (früher v1), fehlende Felder alter Spielstände werden mit Standardwerten ergänzt.
* **Seed Tastatur:** Die Taste O entfällt (O gilt ohnehin als 0). Damit ist O40 in der Praxis gelöst, ohne eigene Schrift.
* **Browser Test** (Chromium, Software WebGL): Optionen mit allen Schaltern, Wechsel auf Sparsam und Blitz zur Laufzeit, FPS Anzeige, Seed Tastatur, Run mit Blitz bis zur gespielten Hand. Keine Konsolenfehler. Die FPS Werte der Software Darstellung (10 FPS) sagen nichts über das iPad. **Die echte Leistung muss auf dem iPad gemessen werden** (Option FPS Anzeige an).

### Neuer Shop (Version 0.3.2)

* **Layout** in `src/ui/ShopView.ts` (Zahlen oben in `L`): links Next Round und Reroll, oben Ablage mit den Karten Slots, unten Voucher Fach (senkrechte Aufschrift "Ante N Voucher") und Pack Fach. Preise hängen als Fahne über dem Artikel.
* **Bedienung:** Ein Tipp auf einen Artikel hebt ihn an und öffnet eine Detail Karte mit Name, Beschreibung und Aktionen (Kaufen, Nutzen, Einlösen, Öffnen). Der Grund für ein gesperrtes Kaufen steht als Hinweis dabei (Zu wenig Geld, Kein freier Platz). Die Beschreibungen stehen nicht mehr dauerhaft unter den Karten.
* **Grafik:** Packs als Folienbeutel (`packArt`, Farbe je Typ), Voucher als Eintrittskarte (`voucherArt`), Leuchtschild `buildShopSign` in der Seitenleiste ersetzt im Shop und in Packs die Blind Anzeige.
* **Geprüft:** Browser (Chromium, 1440 mal 1000) mit 2 und 5 Karten Slots, Auswahl von Karte, Voucher und Pack, Kaufen eines Consumables. Keine Konsolenfehler. Auf dem iPad noch nicht angesehen.

### Klarer Grafikstil (nach M6)

* **Anlass:** Das Bild wirkte unscharf. Ursachen: CRT Filter (Wölbung, Scanlines, Rauschen, Farbversatz, schwarzer Rand), verlaufender Shader Hintergrund mit Randabdunklung, halbtransparente Panels mit weichen Schatten, Text wird mit Renderer Auflösung gerendert, das Spielfeld aber auf das Fenster herunterskaliert.
* **Neu:** Flacher Stil mit harten Kanten (`STYLE` und `shade` in `ui/theme.ts`): feste dunkle Kontur, versetzter voller Schatten, keine Glanzlichter, kleinere Radien, blaue Nachtpalette mit Orange, Rot und Gold als Akzent. Hintergrund `Background.ts` in fünf harten Farbstufen auf grobem Raster mit scharfen Sternen, ohne Vignette. Textauflösung wird mit der Spielfeld Skalierung multipliziert (`ui/textRes.ts`).
* **Mischung nach Rückmeldung:** Der rein flache Stil gefiel nicht. Jetzt: flache, scharfe Flächen (Stil 2), weiche Leuchtanteile und indigo bis türkise Stimmung im Hintergrund (Stil 1) und ein dezenter Hologramm Look. Hologramm: Panels leicht durchscheinend mit dünner Leuchtlinie (`C.holo`), CRT Shader ohne Wölbung und Rauschen, mit kühlem Farbton, feinem Farbsaum, schwachen Scanlines und wanderndem Lichtband (`CRT` in `data/juice.ts`). CRT ist wieder standardmäßig an, schaltbar in den Optionen. Einstellungen liegen unter `alatro.settings.v2`, vorhandene v1 Werte werden einmal übernommen.
* **Karten im alten Design:** Spielkarten, Joker, Consumables und Kartenrücken (`CardView`, `JokerView`, `ConsumableView`, `jokerArt`, Kartenfarben in `theme.ts`) sind auf den Stand vor dem Stilwechsel zurückgesetzt, mit Systemschrift (`FONT_BODY`). Lange Jokernamen werden verkleinert, damit sie nicht über den Kartenrand laufen.
* **Pixel Schrift wie bei Pixel Spielen:** helle Labels bekommen einen harten dunklen Schatten von einem Schriftpixel (`hardShadow` in `ui/widgets.ts`). Die Originalschrift eines anderen Spiels wird nicht nachgebaut (CLAUDE.md), `Alatro Pixel` ist ein Eigenentwurf in diesem Stil.
* **Schrift:** Pixel Schrift für Titel, Zahlen, Knöpfe und Namen. Längere Beschreibungen (Wortumbruch) nutzen `FONT_BODY` (Systemschrift), weil 1 Pixel Striche bei langen Texten schwer lesbar sind.
* **Geprüft:** Menü, Run Setup, Blind Auswahl, Tisch mit Handkarten im Browser (Chromium, iPad Seitenverhältnis). Shop, Packs, Boss Stimmungen und Edition Shader nur im Code angepasst, nicht Bild für Bild geprüft.
* **Weiche Schrift (0.3.1):** `tools/pixelfont.py` zeichnet die Pixelraster beim Erzeugen weich (Diagonalen verbunden, Ecken gerundet und abgeschrägt, Striche etwas dicker, Buchstaben auf 86 Prozent Breite, festes Zittern der Eckpunkte von höchstens 4 Einheiten). Parameter oben in der Datei (`FILL_R`, `ROUND_R`, `JITTER`, `BOLD`, `XS`). Benötigt zusätzlich `pip install shapely`. Zu starkes Verdicken (ab etwa 16) lässt a, e und s zulaufen.
* **Pixel Schrift (O55):** Skalierung ist nicht ganzzahlig, die Pixel der Schrift sind deshalb auf dem Bildschirm leicht unterschiedlich breit. Wenn das stört, wäre der nächste Schritt, Schriftgrößen auf ganze Vielfache zu runden.
* **Stilvorbild:** Nur die Anmutung (klare Flächen, harte Konturen). Farben, Formen und Inhalte sind eigene Entwürfe.

### Lesbarkeit der Jokers (Version 0.3.1)

* **Anlass:** Rückmeldung, dass auf einen Blick schwer zu erkennen ist, was welcher Joker macht.
* **Farbige Beschreibungen:** `ui/richText.ts` (Layout) und `ui/richTokens.ts` (reine Auszeichnung, getestet). Chips blau, Mult rot, X Mult als rote Pille, Geld gold, Hands grün, Discards orange, Suits in Rot und Dunkelblau, Handnamen orange, Bedingungen ("wenn ...", "Jede gewertete Karte") violett, aktuelle Werte skalierender Jokers grün. Zwei Paletten, hell für Tooltips auf Karten, dunkel für Panels. Genutzt in Joker Tooltip, Consumable Tooltip, Shop, Pack Auswahl, Sammlung und Run Info (Vouchers).
* **Wirkungs Marken:** `ui/jokerInfo.ts` leitet aus Definition und Beschreibung Marken ab (Chips C, Mult M, X Mult X, Geld $, Retrigger R, Wächst W, Passiv P, Regel G, Kopie K, Rettung !). Auf der Joker Karte als kleine farbige Marken unter der Grafik, im Tooltip mit Namen. Dazu eine Zeile, wann der Joker wirkt (`triggerLabel`, aus dem Beschreibungstext abgeleitet).
* **O62 (Auslöser Zeile):** Der Auslöser wird aus dem deutschen Beschreibungstext geraten (kein eigenes Datenfeld). Bei einem neuen Joker mit ungewöhnlichem Text prüfen, ob die Zeile passt, sonst das Muster in `triggerLabel` ergänzen. Ein Test stellt sicher, dass jeder Joker mindestens eine Marke und eine Zeile hat.
* **Geprüft:** Joker Karten und Beschreibungen in beiden Paletten im Browser gerendert (Chromium). Tooltip im laufenden Spiel und die Pack Ansicht nur im Code angepasst, App startet ohne Fehler.

### Review und Playtest (Version 0.4.0)

* Ausführliche Befunde mit Priorität und Ergebnis stehen in `docs/PLAYTEST.md`.
* Engine: Zufallsläufe mit Bot über alle Decks (Invarianten, Speichern und Laden in jedem Schritt, Determinismus) ohne Fehler. Eingabeprüfung, Teufelsmarkt, Hehler Balance (O62 bis O64).
* UI: Boss Regel im Blind Feld, Round Score passt sich an, Consumable Zähler, Namen auf Karten, Seal und Edition lesbar, Shop Vorschau, Einführungshinweis, Game Over Rückschau, größere Tippflächen, sichere Ränder, Audio nach Unterbrechung (O65 bis O70).
* Design: tiefere Nachtpalette, warmer Shop Ton, mehr Sterne. Alle Zahlen weiter in `src/data/juice.ts`.
* Offen: Hochformat Layout am iPad (O68), Klang und Bildrate auf dem Gerät, leere Tischmitte im Ruhezustand.

### Titel aus Karten (Version 0.6.2)

* **Home Titel:** Der Schriftzug ALATRO ist kein Text mehr, sondern sechs Karten (`src/ui/TitleCards.ts`, Zahlen in `src/data/homeTitle.ts`). Beim Öffnen werden sie nacheinander hingeworfen und wiegen danach leicht. Berühren hebt eine Karte an, Antippen dreht alle auf den Rücken mit Stern und wieder zurück. Entwurf war die Variante "Kartenwurf" aus der Designstudie. Die Buchstaben nutzen die eigene Schrift `Alatro Karte` (`tools/titlefont.py` erzeugt `src/assets/alatro-karte.ttf`, nur A, L, T, R, O). `loop` liegt jetzt in `src/ui/tween.ts` und wird von Titel und Home Bildschirm genutzt.

### Hintergrundmusik (Version 0.7.0)

* **Aufbau:** Alles per WebAudio Synthese, keine Audiodateien (wie die Effekte). Zahlen und die drei Stücke in `src/data/music.ts` (`TRACKS`, `MUSIC`, `BELLS`), reine Komposition in `src/ui/musicScore.ts` (deterministisch pro Stück, Akkord Index und Seed), Klang und Player in `src/ui/music.ts`. Ein Stück ist ein Akkord Kreislauf: weiche Fläche (Pad), Glocken zu zufälligen Zeitpunkten (bewusst kein Raster, kein Beat), leiser Hauch, eigener Hall und Echo. Kein Ton unter `MUSIC.minFreq` (kein Bass).
* **Einbindung:** `Sfx` in `src/ui/audio.ts` legt nach der ersten Berührung einen Musik Player an (Ausgang über den Master, also wirkt die Lautstärke auf beides). Optionen `music` (ID oder `aus`) und `musicVolume` in den Einstellungen, ohne neue SAVE_VERSION. Wechsel überblendet, im Hintergrund wird der Kontext pausiert.
* **Mix (0.7.1, Standard):** `MusicPlanner` (`src/ui/musicScore.ts`, rein und getestet) plant der Reihe nach alle Akkorde. Beim Mix bleibt jedes Stück `MUSIC.mixChords` Akkorde (8, also gut zwei Minuten), dann übernimmt das nächste, Reihenfolge fest, Startstück zufällig, pro Aufenthalt ein anderer Seed. `Conductor` (`src/ui/music.ts`) erzeugt pro Aufenthalt einen Bus. **Überblendung:** Die Flächen überblenden sich über ihre eigenen Hüllkurven, der Bus blendet nur den Rand. Die erste Fassung blendete doppelt und riss ein Loch von etwa 9 dB in den Pegel, jetzt sind es etwa 3 dB.
* **Feinschliff (0.7.1):** Pad Stimmen links und rechts verteilt (`pad.width`), ruhige Akkorde mit halb so vielen Glocken (`melody.rest`), Melodie startet in der Mitte des Tonraums, Hochpass `MUSIC.highpass`, Hall und Rauschen werden pro Kontext einmal berechnet. **Ducking:** `Sfx.duck()` zieht die Musik bei Aufschlag, X Mult, Fanfaren, Ziel, Niederlage, Sieg, Erfolg und Pack öffnen um `MUSIC.duck.amount` herunter. **Sparsam:** eine Stimme pro Ton und kürzerer Hall (`MUSIC.lite`).
* **Hörproben:** `scheduleMusic` rendert Stücke oder den Mix im `OfflineAudioContext`, daraus entstanden die MP3 Proben und die Pegelmessung. Die Pegel der Stücke sind auf etwa minus 30 LUFS angeglichen (`level` pro Stück).

### Erfolge, Einführung und Schwierigkeit (Version 0.5.0)

* **Erfolge:** 61 eigene Erfolge in acht Kategorien (`src/data/achievements.ts`), jeder mit 1 bis 3 Sternen, daraus ergibt sich der Rang (acht Ränge im Thema der Sternwarte). Bedingungen sind deklarativ (`Cond`), die Auswertung steht in `src/achievements.ts` (rein, getestet). Das Profil (`src/profile.ts`, Speicherort `alatro.profile.v1`) zählt Statistik über alle Runs. `observeRun` ist idempotent und rechnet nur Differenzen eines Runs (über `RunState.runId`) dazu, deshalb genügt ein Aufruf nach jedem Speichern (`Game.persist`). Ansicht: `src/ui/AchievementsView.ts` mit Rang, Kategorien, Fortschrittsbalken und Statistik. Freischaltungen erscheinen als Banner (`Game.showAchievementBanner`).
* **Einführungsrunde:** Geführter Ablauf mit festem Szenario (`src/data/tutorialRun.ts`, `src/core/tutorialRun.ts`). Die Engine bleibt unverändert, nur Hand, Nachziehstapel und Shop Inhalt sind vorbereitet. Der Ablauf (`src/data/guide.ts` Schritte, `src/core/tutorialFlow.ts` Zustandsautomat, rein und getestet) sperrt alle Eingaben außer dem aktuellen Schritt. Hinweisfeld und Zeiger: `src/ui/Guide.ts` (Astra, leuchtender Rahmen folgt dem Ziel). Die Einführung speichert nichts (`persist` ist gesperrt, kein Eintrag in Sammlung oder Profil außer dem Erfolg "Lehrling der Sterne"). Beim ersten Start wird sie angeboten (nicht, wenn schon Spielstand, Sammlung oder gesehene Patch Notes existieren), später über den Knopf Einführung im Hauptmenü.
* **Schwierigkeit:** Neue Stufe Morgenrot (Ziele 25% niedriger, 1 Discard mehr), steht außerhalb der kumulativen Leiter (`StakeDef.cumulative: false`). Neue skalierende Schwierigkeit mit 20 Stufen (`src/data/difficulty.ts`): Ziel Faktor 0,7 bis etwa 2,1 plus Regeln ab bestimmten Stufen, Stufe 4 ist das Grundspiel. Im Run Setup wählbar (Feste Stufen oder Skalierend) mit Vorschau von Startwerten und Zielen. Die Leiter der Stakes bleibt wie bisher. Zielfaktoren verschiedener Quellen werden jetzt multipliziert (vorher überschrieb das Deck "Goldene Waage" den Faktor).
* **Tageslauf:** `src/data/daily.ts`, Seed, Deck, Stufe (nach Wochentag) und Tageswandlung (7 Wandlungen als `RunMods`) aus dem Datum berechnet, bestes Ante pro Tag im Profil.
* **Unterhaltung:** Rückschau mit Rekorden (Beste Hand, Ante) gegen den Stand vor Beginn des Runs, Meldung "Neuer Bestwert!" bei einer Hand über dem bisherigen Rekord, Tipps auf dem Game Over, Knöpfe "Gleicher Seed" und nach einem Sieg "Härter: nächste Stufe".
* **Spielstand:** `SAVE_VERSION` 5 (neu: `runId`, `difficulty`, `daily`, `twistId`, `stats`), Migration von Version 4 in `src/save.ts`.
* **Gemessen:** Ein einfacher Test Bot (beste Hand, keine Käufe außer Jokers) kommt im Mittel auf Ante 3,9 (Stufe 1), 3,1 (Morgenrot), 2,8 (Stufe 2), 1,9 (Dämmerung und Stufe 4), 1,5 (Stufe 6), 1,2 (Stufe 8 und 11), 1,0 (ab Stufe 14). Der Bot spielt weit schwächer als ein Mensch, aussagekräftig ist nur die Reihenfolge: sie steigt gleichmäßig und Morgenrot liegt zwischen Stufe 1 und 2.

### Sternenatlas, Siegel und Rückschau (Version 0.6.0)

Umsetzung der Vorschläge V2, V3, V4 und V8 (teilweise) aus `docs/HOOK_REPORT.md`. V1, V6, V7 und V9 deckt Version 0.5.0 bereits ab (Profil, Erfolge, Tageslauf, Einführung).

* **Sternenatlas (V4):** `src/collection.ts` hat jetzt `tabProgress`, `collectionHint` (Hinweis aus den Daten abgeleitet, nennt nie den Namen, getestet), Neu Marker über den eigenen Speicher `alatro.collection.seen.v1` (`unseenKeys`, `markAllSeen`) und `entryName`. Ansicht: Gesamtfortschritt oben, "NEU" Schild, Sternchen am Reiter mit neuen Funden, Hinweistext in verdeckten Karten. Hauptmenü: Knopf "Atlas" mit Fortschritt, leuchtet bei neuen Funden. Im Run meldet `Game.announceDiscoveries` neue Funde als Toast.
* **Siegel am Deck (V3):** `Profile.winsByDeckStake` (Schlüssel `deck|stake`), `deckSeal`, `nextSealGoal` in `src/profile.ts`, Anzeige im Run Setup (nur feste Stufen). Nichts ist gesperrt. Profilversion bleibt 1, `parseProfile` ergänzt das Feld.
* **Rückschau (V2):** `src/report.ts` (rein: `nearMiss`, `overkill`, `newKeys`), Zahlen in `src/data/report.ts`. Game Over zeigt "Dir fehlten X Punkte" ab 30 Prozent des Ziels, die Rückschau zeigt "Neu im Atlas". Neuer Knopf "Sofort nochmal" (gleiche Einstellungen, neuer Seed), im Tageslauf nicht angeboten.
* **Juice (V8, teilweise):** Ziel erreicht beim Hochzählen (Ton `sfx.goal`, Flash), Überschuss Zeile im Blind geschafft Fenster ab 125 Prozent, Fanfare je Blind Art und größer ab 250 Prozent, Tippen beschleunigt die Animation (`tapBoost` in `settings.ts`, Faktor und Dauer in `data/report.ts`). **Nicht gebaut:** Partikel, solange die Bildrate auf dem iPad nicht gemessen ist.
* **Behoben:** Der Atlas zeigte bei Jokers rohe Platzhalter wie `{mult}` (jetzt `jokerDescription`). `Game.modal` verkleinert zu hohe Fenster auf die Bildschirmhöhe.
* **Spielstand:** `SAVE_VERSION` bleibt 5, kein neues Feld im Run.
* **Bewusst nicht gebaut:** V5 (Joker Pool freischalten), V10 bis V14. Gating von Inhalten ist eine Entscheidung des Eigentümers (O79).

### Pixel Art Spielkarten (nach Version 0.6.0, Branch `claude/confident-hawking-9wzkrq`)

Neues Kartendesign für das 52er Deck als farbiges Pixel Art, komplett im Code gezeichnet (keine Bilddateien, keine fremden Assets, die Stilreferenzen wurden nicht eingelesen oder nachgezeichnet). Die Joker Grafiken sind nicht Teil dieses Schritts.

* **System:** Karte 82 mal 114 Pixel (feine Auflösung), auf dem Bildschirm mit 1,5 dargestellt (123 mal 171 Punkte, `CARD_PX_SCALE`). Raster und Maße in `src/data/cardArt/` (`cardGlyphs.ts`: Index Schrift 5 mal 7, Farbsymbole für Index und Pips, Pip Anordnung, Ass, Bildkarten Rahmen; `faceSprites.ts`: feine Gesichter; `courtSprites.ts`: Hüte, Körper und Gegenstände der Figuren im Entwurfsraster; `cardPalettes.ts`: Farben). Renderer ohne DOM in `src/ui/cardArt/` (`pixelBuffer.ts`, `gridOps.ts` mit Scale2x und Verlaufsraster, `cardRender.ts`), Pixi Texturen mit `scaleMode` nearest in `cardTextures.ts`, Cache pro Karte und Palette.
* **Inhalt:** weißer Rand mit weich gerundeten Ecken (Abstandsfunktion, Radius 6), Index oben links und um 180 Grad gedreht unten rechts (Ziffern 5 mal 7, Farbsymbol 9 mal 9), Pips 2 bis 10 klassisch (16 mal 16 Pixel, von Hand gezeichnet, mit Licht, Schatten und Glanzpixel, ohne Überlappung per Test geprüft).
* **Bildkarten und Asse:** Zwölf eigene Doppelfiguren (obere Hälfte, untere um 180 Grad gedreht) im Thema: Pik Sternbeobachter (Fernrohr Gehilfe, Mondpriesterin, Sternenkönig), Herz Alchemisten (Kolben Lehrling, Alchemistin, Großalchemist), Karo Goldmacher (Münzjunge, Goldschmiedin, Goldkönig), Kreuz Kräuterkundige (Kräutersammler, Kräuterfrau, Waldkönig). Aufbau: Hut, Körper und Gegenstände sind im groben Entwurfsraster gezeichnet und werden mit Scale2x verdoppelt und geglättet. Darauf kommen Stofftexturen (Falten, Brokat, Goldglanz, Hermelin), dunkle 1 Pixel Kontur, Kantenlicht und Kantenschatten. Gesichter (Augen mit Weiß und Pupille, Brauen, Nase, Lippen, Haar, Bärte) sind in feiner Auflösung gezeichnet, dazu kommen drei Hauttöne, das Brustzeichen der Farbe, ein Heiligenschein hinter dem Kopf, Zierrahmen und Hintergrundmuster pro Farbe. Asse: großes Symbol (35 mal 37) mit Farbverlauf in Rasterstufen, Kontur, Glanzbogen, getönte Scheibe, Punktringe, Funken und feines Rautenmuster.
* **Kartenrücken, Kristall:** Rücken in der Farbe des Decks mit feinem Rautengitter, drei Rändern, Ecksternen und Medaillon mit sechzehnzackigem Stern. Karten ohne Rang zeigen einen Kristall mit Verlauf und Facetten.
* **Paletten:** "Standard" (Pik dunkelblau, Herz pink, Kreuz dunkelgrün, Karo orange) und "Hoher Kontrast" (Pik dunkel, Herz rot, Kreuz blau, Karo gold). Wahl in den Optionen ("Kartenfarben"), wirkt sofort auch auf Karten im Bild.
* **Einstellung:** Neues Feld `cardPalette` in `Settings` (Schlüssel `alatro.settings.v2`). `parseSettings` setzt bei fehlendem oder ungültigem Wert Standard, deshalb ist keine Migration nötig. **`SAVE_VERSION` bleibt 5**, der Run Spielstand ändert sich nicht.
* **UI Eingriffe:** `CardView` (Sprite statt Text und Formen, Enhancement Fläche als Texturfarbe, Name, Siegel und Edition bleiben Overlays), `cardBack`, `ShopView` (Kartenmaß aus `CARD_H`), Optionen in `Game.ts`. Die Engine ist unberührt.
* **Tests:** `src/cardArt.test.ts` (alle 104 Karten rendern, sind verschieden, Pips ohne Überlappung, gedrehter Index, zwölf verschiedene Figuren mit gültigen Rastern und Farben, Mehrfarbigkeit, gedrehte Figurenhälfte, Ass, Einstellung). Vorschau: `preview/cards-standard.png`, `preview/cards-contrast.png`, `preview/cards-faces-zoom.png` (erzeugt mit `node tools/cardPreview.cjs`; einzelne Karten vergrößert mit `npx vite-node tools/cardZoom.ts`).

### Mehrsprachigkeit (Deutsch und Englisch, Teil Oberfläche und Engine)

Das Spiel bekommt eine deutsche und eine englische Fassung. Dieser Teil betrifft Oberfläche (`src/ui/**` ohne `Game.ts`, das folgt in Phase 2) und Engine Texte. Die Inhalte aus `src/data/` und den Dateien direkt unter `src/*.ts` übersetzen Patch Dateien in `src/i18n/patch/` (anderer Arbeitsstrang).

* **Konzept:** `t('Deutscher Text')` aus `src/i18n`, der deutsche Text ist der Schlüssel und bleibt im Code stehen. Englisch kommt aus den Wörterbüchern `src/i18n/en/*.ts` (`ui-menu.ts`, `ui-sync.ts`, `ui-shop.ts`, `ui-widgets.ts`). Platzhalter `{n}`, Mehrzahl `'{n} Karte|{n} Karten'` (Form vor dem Strich für n gleich 1). Der Test `src/i18n/i18n.test.ts` verlangt für jedes `t('...')` im Quelltext einen englischen Eintrag mit gleichen Platzhaltern und ohne Gedankenstriche. Sprachwechsel lädt die App neu.
* **Laufzeit statt Modulstart:** Texte in Konstanten auf Modulebene wurden zu Funktionen oder Getter (`tabs()` in `RunInfoView`, `groupName()` in `CollectionView`, `phaseText()` in `SyncView`, `EFFECT_TAGS` mit Gettern, Wertungsmeldungen `RETRIGGER_MESSAGE()`, `DEBUFF_MESSAGE()`, `BALANCE_MESSAGE()` in `core/scoring.ts`, `BLIND_INFO` mit Gettern), weil die Sprache beim Laden der Module noch nicht feststeht und Daten erst später umgeschrieben werden.
* **Zahlen und Datum:** `fmt` und `fmtMult` (`src/ui/theme.ts`) nutzen `numLocale()`: Deutsch Tausenderpunkt und Dezimalkomma, Englisch Tausenderkomma und Dezimalpunkt. Das Datum bei Erfolgen ebenso.
* **Rich Text:** `src/ui/richTokens.ts` wählt die Muster für Bedingungen ("wenn", "pro", "jede" gegen "if", "when", "per", "each", "on the last") und "aktuell" Hinweise nach Sprache. Schlüsselwörter (Chips, Mult, X Mult, `$`, Handnamen, Suits, Hands, Discards, Hand Size) wirken in beiden Sprachen, Dezimalkomma und Punkt werden erkannt. Tests in `src/ui/richTokens.test.ts`.
* **Joker Marken und Auslöser:** `effectTags` und `triggerLabel` (`src/ui/jokerInfo.ts`) leiten aus dem Wortlaut der Beschreibung ab. Damit sie nicht vom englischen Wortlaut abhängen, merkt `src/i18n/deSource.ts` die deutschen Beschreibungen, bevor `applyDataLanguage()` sie umschreibt (Aufruf in `src/i18n/boot.ts`). Die Marken sind so in beiden Sprachen gleich. Fehlt der Merkzettel (Tests), greifen englische Rückfallmuster. Kurzzeichen auf der Karte folgen der Sprache (`SHORTS`), je Sprache ohne Doppelungen.
* **Knopf Beschriftungen:** `Button` schrumpft die Beschriftung, wenn sie breiter als der Knopf ist (englische Texte sind oft länger). Titel und Hinweise im Shop und Atlas schrumpfen oder brechen bereits um.
* **Sprachwahl Baustein:** `src/ui/langSwitch.ts` (`switchLanguage`, `nextLang`, `languageButton`, `languageRowTexts`), gespeichert über `updateSettings({ lang })`, danach `location.reload()`. Der Einbau als Zeile "Sprache" in `Game.showOptions` folgt in Phase 2.

| Nr | Thema | Entscheidung, Stand |
|---|---|---|
| O-L1 | Kleine Korrekturen im deutschen Text | In `SyncView` stand bei der Konfliktfrage ein wörtliches `\n` (Backslash n) statt eines Zeilenumbruchs, jetzt Zeilenumbruch. Zeitangaben "vor 1 Minute" statt "vor 1 Minuten" (Mehrzahl Muster). Sonst bleibt der deutsche Text exakt gleich. |
| O-L2 | Standardsprache | Ohne gespeicherte Einstellung startet das Spiel Deutsch. Eine Erkennung der Browsersprache (`navigator.language`) gibt es nicht, weil das Spiel nur dem Eigentümer gehört. Offen, falls gewünscht. |
| O-L3 | Zeitangaben in Patch Notes | Das Datum in `PATCH_NOTES` (`n.date`) ist ein fester Text aus den Daten und wird nicht umformatiert (Aufgabe der Daten Übersetzung). |
| O-L4 | Englische Begriffe | Thema Namen: Sternbild gleich Constellation, Elixier gleich Elixir, Omen bleibt Omen, Sternenatlas gleich Star Atlas, Einführung gleich Tutorial, Anleitung gleich How to Play, Neuigkeiten gleich What's New. Spielbegriffe (Joker, Blind, Ante, Chips, Mult, Hands, Discards, Voucher, Tag, Pack, Reroll) bleiben. Das Wörterbuch ist auf diese Wörter abgestimmt, die Daten Übersetzung sollte sie ebenso verwenden. |
| O-L5 | Noch offen (Phase 2) | `src/ui/Game.ts` (Optionen mit Sprachzeile, Spieltisch, Tooltips, Game Over, Toasts) und Prüfung der englischen Oberfläche im Browser über alle Szenen. |

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
| M5 | UI und Juice nach Abschnitt 9: Skip Button, Shop Szene, Pack Ansicht, CRT, Farbstimmung pro Blind, Sound, Shake (erledigt) | Sichtprüfung |
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
| O18 | Straight Flush mit 4 Karten Regel (2.2) | Straight und Flush müssen beide erfüllt sein, Scoring Cards sind die Vereinigung beider Kartenmengen |
| O19 | Flush House mit 4 Karten Regel (2.2) | Full House plus 4 Karten gleicher Suit |
| O20 | Nur ranglose Karten gespielt | High Card ohne Rang Karte, die ranglosen Karten scoren trotzdem |
| O21 | Zerbrechen eines Enhancements (eigener Kristall) | läuft über `chance()` und ist damit vom Wahrscheinlichkeitsfaktor betroffen |
| O22 | Boss Auswahl (eigene Regel) | zufällig unter passenden Bossen, keine Wiederholung, bis alle einer Kategorie gesehen sind |
| O23 | Reroll und gratis Tag Jokers (eigene Regel) | Reroll ersetzt nur die normalen Karten Slots, gratis Jokers aus Tags bleiben |
| O24 | Shop Typ Wurf (6.2) | bis M4 nur Jokers in den Karten Slots, die Gewichte für Consumables stehen schon in `data/shop.ts` |
| O25 | Geld durch Boss Effekte | darf negativ werden, Käufe sind dann nicht möglich |
| O26 | Suit Debuff bei Karten mit jeder Suit | Quecksilber Karten sind von jedem Suit Debuff betroffen. "Gerade Ränge" meint nur 2, 4, 6, 8, 10 |
| O27 | Showdown Ziel Faktor | eigene Showdown Bosse nutzen ihren Faktor (z. B. X5), sonst gilt der Standard Boss Faktor 2 |
| O28 | Consumables aus Packs (6.6) | Die Wahl wird sofort benutzt und belegt keinen Slot. Erzeugende Elixiere brauchen trotzdem einen freien Slot |
| O29 | Karten Ziele (4.3) | In der Runde ist die Hand das Ziel Feld. In Elixier und Omen Packs zeigt das Pack eine Hand aus 8 zufälligen Deck Karten. Zufallsziele der Omen kommen aus derselben Hand. Ohne Hand (Shop, Blind Auswahl) sind solche Consumables nicht benutzbar |
| O30 | Preise der Consumables (6.5) | Sternbild 3, Elixier 3, Omen 4, Spielkarte 1, Verkauf wie bei Jokers aus dem Kaufpreis |
| O31 | Omen im Shop (6.2) | Omen erscheinen nur in Packs (Gewicht 0 in den Karten Slots) |
| O32 | Spielkarten im Shop (6.2) | Erst mit dem Voucher Kartentisch (Gewicht 4). Veredlertisch gibt ihnen Modifikatoren, sonst sind sie schlicht |
| O33 | Fernrohr (3.1 Schritt 6) | Sternbild im Slot gibt X1,5 (Großfernrohr X2) nur, wenn genau seine Hand gespielt wird. Mehrere Sternbilder derselben Hand zählen einzeln |
| O34 | Stern Seal (Rundenende) | Beim Einkassieren erzeugt jede gehaltene Karte mit dem Seal das Sternbild der zuletzt gespielten Hand dieser Runde, nur in freie Slots, ohne gespielte Hand nichts |
| O35 | Rang plus 1 bei Elixier Aufstieg | Ace wird zu 2, wie bei O17 |
| O36 | Hexenkessel, Teufelsmarkt, Nachtpakt (eigene Omen) | Hexenkessel überschreibt eine vorhandene Edition des behaltenen Jokers. Teufelsmarkt setzt Geld auf $0 (negatives Geld bleibt). Nachtpakt wirkt sofort auch in der laufenden Runde |
| O37 | Zerstörte Karten | Werden aus Deck, Hand, Nachziehstapel und Ablage entfernt. Ist die Hand danach leer und der Stapel leer, ist die Runde verloren. Neue Karten kommen ins Deck und in der Runde zusätzlich in die Hand (Hand darf dabei über die Hand Size wachsen) |
| O38 | Geheime Hände bei Sternbildern (2.2) | Das Sternbild einer geheimen Hand erscheint erst nach dem ersten Spielen dieser Hand |
| O39 | Collection (9.1) | Ein Eintrag zählt als entdeckt, sobald er im Besitz, im Shop, in einem Pack oder in der Blind Auswahl sichtbar war. Gespeichert in `alatro.collection.v1`, unabhängig vom Spielstand |
| O40 | Seed Eingabe (7.1) | Eigene Bildschirmtastatur. Die Schrift stellt O und 0 sehr ähnlich dar, deshalb soll U9 (eigene Schrift) das lösen |
| O41 | Editions auf Consumables (3.4) | Nicht in M4. Schatten Slots gelten nur für Jokers |
| O42 | Seeds nach M4 | Neue Tags und Vouchers verändern die Auswahl aus dem Tag und Voucher Pool, alte Seeds ergeben damit andere Ante Tags und Vouchers als vor M4. Laufende Spielstände behalten ihre Werte |
| O43 | Ungerade Ränge (Joker Kauz) | 3, 5, 7, 9 und Ace sind ungerade, gerade sind 2, 4, 6, 8, 10. Face Cards sind weder gerade noch ungerade |
| O44 | Ranglose Karten bei Joker Bedingungen | Karten mit Obsidian (ohne Rang und Suit) lösen keine Rang und Suit Bedingungen aus. Ausnahme ist der ursprüngliche Joker Kleinvieh, dessen Verhalten unverändert blieb |
| O45 | Kopierende Jokers | Kopien werden nicht verkettet. Ein Kopierer wirkt in allen Phasen des Ziels außer Before, After und Other (kein doppeltes Wachsen). Passive Wirkungen werden nicht kopiert |
| O46 | Rettung (Schutzengel) | Zählt als geschafft: Einkassieren wie bei einem gewonnenen Blind. Schutzengel erscheint erst ab Ante 2 und verbraucht sich. Bei mehreren Rettern verbraucht der erste in der Reihenfolge |
| O47 | Sticker Kompatibilität (4.2) | Entfällt, solange es keine Sticker gibt. Das Schema hat nur `copyCompat` und `minAnte` |
| O48 | Hooks außerhalb des Scorings | `roundEnd` darf keinen Zufall nutzen (Anzeige und Auszahlung müssen gleich sein). Wachstum bei `roundEnd` passiert beim Einkassieren, nicht in der Vorschau |
| O49 | Joker Passive bei Boss Schwächung | Der vom Boss geschwächte Joker ganz rechts bleibt für Passive, Rettung und Hooks außerhalb des Scorings aktiv, nur das Scoring ignoriert ihn |
| O50 | Legendary Jokers (4.1) | Nur über das Omen Ahnenruf, 3 Stück in M3 |
| O51 | Wölbung des CRT Filters (9.4) | Nur 1,2 Prozent, weil Berührungen nicht mit verzerrt werden und am Rand sonst Tippfehler entstehen. Wert in `data/juice.ts` (`CRT.curvature`), im Zweifel in den Optionen abschalten |
| O52 | Stufen für Shake und Flash (9.3) | Nach Handpunkten geteilt durch Blind Ziel, Schwellen 0, 0,1, 0,3, 0,7, 1,5. Alle Zahlen in `data/juice.ts` und auf dem iPad zu fühlen |
| O53 | Joker Embleme (9.2) | Aus der Joker ID per Hash gewählt, nicht pro Joker von Hand gezeichnet. Zwei Jokers können dasselbe Symbol haben (Funke und Einzelgänger zeigen beide ein Auge). Eine Zuordnung pro Joker wäre ein Feld in `JokerDef` |
| O54 | Edition Shader auf Consumables | Nicht umgesetzt, weil Consumables keine Editions haben (O41) |
| O55 | Schrift (U9) | **Gelöst:** eigene Pixel Schrift `Alatro Pixel` (`tools/pixelfont.py` erzeugt `src/assets/alatro-pixel.ttf`, 120 Glyphen, proportional, Pixel gleich Schriftgröße geteilt durch 9). Ein Schnitt für alle Stärken, damit der Browser keine unscharfe Fettschrift nachbaut. Eine fette Variante wurde probiert und verworfen, weil M, N, W, m und w zulaufen. Zeichen, die die Schrift nicht kennt, fallen auf die Systemschrift zurück (neue Sonderzeichen in `tools/pixelfont.py` ergänzen und die Schrift neu erzeugen). Frühere Einschätzung: Bleibt offen. Eine selbst gezeichnete Pixelschrift (CLAUDE.md verlangt eigene Schrift) wäre mit dem Raster nur bei ganzzahligen Schriftgrößen scharf, die UI nutzt viele Größen (16 bis 110), und lange Beschreibungen würden schwer lesbar. Das Problem O und 0 ist über die Seed Tastatur gelöst. Wenn eine eigene Schrift gewünscht ist, ist das ein eigener Meilenstein mit Glyph Tabelle, Font Erzeugung und Umstellung aller Labels |
| O56 | Tempo Faktor (M6) | Der Faktor teilt alle Tween und Wartezeiten, auch die Pausen zwischen Score Schritten. Auf Blitz laufen Sounds weiter im selben Rhythmus der Schritte, nur dichter. Die Zahlen stehen in `data/juice.ts` und sind auf dem iPad zu fühlen |
| O57 | Grafikstufe Sparsam (M6) | Wird nicht automatisch gewählt, nur von Hand. Eine automatische Erkennung (FPS unter Schwelle) wäre möglich, wurde nicht gebaut, weil ohne iPad Messung keine sinnvolle Schwelle bekannt ist |
| O58 | Tempo Knopf am Tisch | Zusätzlich zur Option gibt es in der Seitenleiste einen Knopf, der `SPEED_STEPS` (1x, 1,5x, 2x, 3x, 5x, 10x) durchschaltet, auch während Animationen |
| O59 | Patch Notes | Einträge in `src/data/patchnotes.ts`, Version steht dort und in `package.json` (ein Test prüft Gleichheit). Nach einem Update erscheinen sie einmal automatisch, gemerkt unter `alatro.patchSeen.v1`. Bei jedem Release einen Eintrag ergänzen |
| O60 | Anleitung | Texte in `src/data/tutorial.ts`. Bei Regeländerungen (Startwerte, Blinds, Shop) die Seiten mit anpassen |
| O61 | Home Bildschirm | Eigene Gestaltung (Sterne, Kartenfächer, Titel), keine Vorlage. Der Spieltisch wird dahinter ausgeblendet statt nur abgedunkelt. Der Menü Knopf im Spiel ist bei offenen Fenstern (z. B. Blind Auswahl) nicht erreichbar, wie bisher |
| O62 | Hehler (Balance, Review 0.4.0) | Kosten 7 statt 3, Verkauf plus $8 statt plus $10. Vorher war Kaufen und Verkaufen ein sicherer Gewinn von $8 (aus Packs sogar $11 gratis). Neu bleibt ein kleiner Gewinn, der einen Slot kostet |
| O63 | Eingabeprüfung Spielen und Abwerfen | `playCards` und `discardCards` werfen bei IDs, die nicht in der Hand liegen, oder bei Duplikaten, bevor eine Hand verbraucht wird. Die UI sendet nur gültige Auswahlen, die Prüfung schützt die Engine |
| O64 | Teufelsmarkt ohne Joker | Das Geld sinkt nur auf $0, wenn ein Joker erzeugt wurde (leerer Pool lässt das Geld unberührt) |
| O65 | Shop Vorschau | Im Shop und in Packs zeigt die Seitenleiste statt Round Score und Hand Feld eine Vorschau: nächster Blind mit Ziel und Belohnung, dazu die Boss Regel der Ante. Ist der nächste Blind der Boss, steht die Regel direkt unter seinem Namen |
| O66 | Einführungshinweis | In der Tischmitte steht in der ersten Runde ein Hinweis zum Antippen der Karten, bis die erste Hand gespielt wurde. Gemerkt unter `alatro.hints.v1` (unabhängig vom Spielstand). Weitere Hinweise (Shop, Joker Reihenfolge) wären mit `hintSeen` und `markHintSeen` in `src/settings.ts` leicht zu ergänzen |
| O67 | Sichere Ränder | `computeView` kennt Insets, `main.ts` liest `env(safe-area-inset-*)` über ein verstecktes Element. Gilt nur für das Querformat und iPad. Beim Handy im gedrehten Hochformat bleiben die Ränder unberücksichtigt |
| O68 | Hochformat am iPad | Weiterhin nur eingepasst (Karten etwa halb so groß wie im Querformat). Ein eigenes Layout wäre ein größerer Schritt. Alternative: wie beim Handy um 90 Grad drehen, was den Faktor von 0,56 auf 0,75 hebt, aber Kopf neigen verlangt. Offen, Entscheidung beim Eigentümer |
| O69 | Seal und Edition auf Karten | Seal zeigt einen Buchstaben im Kreis (E, M, S aus dem Namen), Editions zeigen ihren Namen oben rechts von der Eckmarke. Neue Seals sollten einen eindeutigen Anfangsbuchstaben haben, sonst wäre ein eigenes Feld in `SealDef` nötig |
| O70 | Test Hook | `main.ts` setzt `globalThis.__PIXI_APP__` (Standard der Pixi Devtools). Automatisierte Browser Tests lesen darüber Texte und Tippflächen aus der Szene. Kein Einfluss auf das Spiel |
| O71 | Morgenrot außerhalb der Leiter | Die Einsteigerstufe wirkt nur für sich (`cumulative: false`) und ist keine Stufe der Leiter. Erfolge "auf Stufe X gewinnen" zählen nur Leiter Stufen, Siege auf Morgenrot und auf skalierenden Stufen nicht. Skalierende Siege zählen für `bestScale` |
| O72 | Skalierende Stufen | Stufe 4 entspricht dem Grundspiel, Stufe 1 bis 3 geben 10, 20 und 30 Prozent niedrigere Ziele (Stufe 1 und 2 zusätzlich einen Discard, Stufe 1 drei Geld). Alle Zahlen in `data/difficulty.ts` und mit dem Bot nur der Reihenfolge nach geprüft, nicht gegen echtes Spielgefühl. Stufe 14 bis 20 sind ausdrücklich Grenzbereich |
| O73 | Erfolg "Archivar der Sterne" | Verlangt 90 Prozent der Sammlung statt 100, weil nicht sicher ist, dass jeder Eintrag (Legendary Jokers, Showdown Bosse, seltene Editions) in jedem Fall erreichbar ist. Die Prozentzahl steht in `data/achievements.ts` |
| O74 | Statistik zählt aus dem Run Zustand | `observeRun` leitet Blinds, Bosse und Käufe aus Run Zählern ab (`blindIndex` und `ante`, `stats`). Spielstände aus Version 4 beginnen mit Zählern bei 0, ihre Vorgeschichte wird nicht nachgetragen. Bereits freigeschaltete Erfolge verlieren sich nie |
| O75 | Einführung speichert nichts | Weder Run noch Sammlung noch Profil Zähler (Hands, Runs) werden aus der Einführung übernommen. Nur der Abschluss wird vermerkt (`tutorialDone`). Wer abbricht, kann sie jederzeit neu starten |
| O76 | Einführung mit gelenkten Karten | Hand, Nachziehstapel und Shop sind festgelegt (Seed LERNEN01). Das ist bewusst keine Zufallsrunde, damit jeder Schritt gelingt. Zahlen und Karten in `data/tutorialRun.ts`, Texte in `data/guide.ts`. Ändern sich Basiswerte der Hände, müssen die Zielwerte der Tests in `src/tutorial.test.ts` (60, 308, 720) angepasst werden |
| O77 | Tageswandlungen | Wandlungen sind reine `RunMods`. Das Datum zählt in lokaler Zeit, zwei Geräte in verschiedenen Zeitzonen können am selben Moment verschiedene Tage haben. Der Verlauf behält 30 Tage |
| O78 | Banner Dauer | Erfolgs Banner bleiben 2,8 Sekunden stehen, unabhängig vom Animationstempo (`setTimeout`), damit sie auch auf Blitz lesbar bleiben. Mehrere Erfolge laufen nacheinander durch eine Warteschlange |
| O79 | Kein Gating | Siegel am Deck sind nur ein Ziel, keine Freischaltung. Alle Decks, Stufen und Jokers bleiben von Beginn an offen. Ob Inhalte erst verdient werden sollen (V5), ist offen |
| O80 | Beinahe Schwelle | Die Beinahe Zeile erscheint erst ab 30 Prozent des Ziels (`NEAR_MISS_MIN`), damit sie bei klaren Niederlagen nicht entmutigt. Sie zeigt nur das echte Ergebnis |
| O81 | Neu Marker für Altbestand | Gibt es noch keinen Seen Speicher (Update von 0.5.0), gilt alles bisher Entdeckte als gesehen. Erst neue Funde tragen NEU |
| O82 | Siegel nur für feste Stufen | Siege auf skalierenden Stufen zählen weiter für `bestScale`, nicht für das Siegel. Siege vor Version 0.6.0 sind nicht nachgetragen (die Daten fehlten) |
| O83 | Tippen beschleunigt | Ein Tippen während `busy` gibt für 1,2 Sekunden Faktor 3 auf das Tempo (`TAP_BOOST`). Es wirkt von der nächsten Animationsstufe an, laufende Tweens behalten ihre Dauer |
| O84 | Hinweise abgeleitet | Atlas Hinweise sind aus Rarity, `minAnte` und Art abgeleitet, nicht handgeschrieben. Sie sind allgemein gehalten (zum Beispiel "Häufig im Shop"), konkrete Fundorte stehen nicht drin |
| O85 | Vibration | Eigene Schicht `src/ui/haptics.ts`, Muster in `data/juice.ts` (`HAPTICS`), Option `haptics` in den Einstellungen (Standard an, ohne neue SAVE_VERSION). Android: `navigator.vibrate`. iPhone: Safari hat kein `vibrate`, ein verstecktes `input switch` (iOS 17.4 und neuer) löst nur ein einzelnes Tippen aus und nur im Rahmen einer Berührung, Zählschritte spüren dort also eventuell nichts. iPad: kein Taptic Motor, die Option meldet das. Nur im Code und per Test geprüft, **nicht auf einem echten Gerät** |
| O86 | Home Titel aus Karten | Der Titel wird bei jedem Öffnen des Home Bildschirms neu hingeworfen (auch beim Zurückkehren aus dem Spiel). Das Umdrehen ist reine Spielerei ohne Wirkung. Suits und Neigung der Karten sind festgelegt, nicht zufällig, damit der Titel immer gleich aussieht. Die Schrift der Buchstaben ist `Alatro Pixel`, Karten und Rücken nutzen Maße und Farben der Spielkarten (`CARD_W`, `CARD_H`). Ist die Einführung noch offen, liegt das Willkommensfenster über dem Titel |
| O87 | Titelschrift Alatro Karte | Eigene zweite Schrift, nur für die Titelkarten (`FONT_TITLE` in `src/ui/theme.ts`), mit Rückfall auf Alatro Pixel. Sie enthält nur die Zeichen A, L, T, R und O. Soll der Titel anders heißen oder die Schrift anderswo erscheinen, müssen die Glyphen in `tools/titlefont.py` ergänzt und die Datei neu erzeugt werden (`pip install fonttools shapely`). Die Datei wird wie die Pixel Schrift mit eingecheckt |
| O88 | Kartenmaß | Die Karte ist 82 mal 114 Pixel groß und wird mit 1,5 dargestellt (123 mal 171 Punkte, wie zuvor), ein Kartenpixel ist also 1,5 Punkte. Auf einem Retina Bildschirm (Faktor 2) sind das genau 3 Gerätepixel. Weil das Spiel ohnehin auf die Bildschirmgröße skaliert wird und Karten im Fächer gedreht sind, bleibt nearest bei krummen Faktoren, die feinen Pixel machen die Ungleichheit kaum sichtbar. Das Hand Layout rückt dafür enger (`spacing` 108, Breite 780). Auf dem iPad prüfen: Schärfe im Fächer, Lesbarkeit von Rang und Farbe |
| O89 | Index unten rechts | Der gedrehte Index liegt unten rechts, wie bei echten Karten (der Auftrag nannte "unten links"). Falls wirklich links gewünscht, ist es eine Zeile in `renderCard` |
| O90 | Figuren Eigenentwürfe | Die zwölf Bildkarten sind je eine eigene Zeichnung (`FIGURES` in `src/data/cardArt/courtSprites.ts`: Hut, Körper, Gegenstand, Hautton, Gesichtsart). Gesichter kommen aus sieben Vorlagen mit Überlagen (`src/data/cardArt/faceSprites.ts`), die sich pro Figur durch Hut, Haar, Bart, Hautton und Gewand unterscheiden. Hut, Körper und Gegenstände sind Entwurfsraster, die der Renderer verdoppelt und glättet. Das wirkt feiner, bleibt aber eine Ableitung, keine Pixel für Pixel gezeichnete Figur. Keine Vorlage, keine Referenzpixel. Mehr Einzelheiten pro Figur (Hände, Faltenwurf von Hand) sind möglich und kosten jeweils eigene Raster |
| O91 | Palette nur in den Optionen | Die Kartenpalette gilt für alle Karten gleichzeitig, auch Atlas und Shop. Sie ist keine Run Einstellung. Der Kartenrücken ist von der Palette unabhängig (Deckfarbe) |
| O92 | Release 0.8.0 | Pixel Art für Karten, Jokers, Consumables und Packs ist mit Version 0.8.0 und Patch Notes Eintrag live gestellt. Offene Punkte der Grafik: `docs/joker-art.md` (O-J1 bis O-J4) und `docs/consumable-pack-art.md` (O-C1 bis O-C6). **Nicht auf einem iPad geprüft:** Schärfe, Lesbarkeit der kleinen Namen, Tippgefühl, Leistung der Funken. O53 (Embleme aus Hash) ist durch die Joker Pixel Art überholt |
| O93 | Hintergrundmusik | **Nicht gehört, nur gemessen:** Pegel, Spektrum und Fehlerfreiheit sind im Browser geprüft (Lautheit, kein Bass, kein Clipping, keine Konsolenfehler), der Klang selbst ist nicht von einem Menschen beurteilt. Standard ist Mix bei 50 Prozent. Die Musik läuft über das ganze Spiel ohne Anpassung an Blinds, nur das Ducking reagiert auf große Effekte. Die Stärke des Duckings (`MUSIC.duck`) und die Aufenthaltsdauer im Mix sind Schätzwerte, die man hören muss. Akku und Bildrate mit Musik auf dem iPad sind nicht gemessen. |
| O94 | Ladekarte | Übergang zwischen Home und Spiel (`src/ui/ScreenTransition.ts`, Zahlen `src/data/transition.ts`): der Bildschirm blendet in 320 ms ins Nachtblau, eine Karte (Kartenrücken) fällt in 420 ms in die Mitte, ein goldener Balken füllt sich in 900 ms (dabei wird der Screen getauscht), die Karte dreht sich auf die Vorderseite (2 mal 150 ms, steht 240 ms), dann löst sich die Blende in 520 ms auf. Zusammen etwa 2,5 s. Beim Start steht die Karte schon, Laden 1,1 s, Ausblenden 0,8 s, Angebote und Patch Notes erscheinen erst danach. Die erste Fassung (Kuppelhälften, 0.8.1) wirkte wie ein Darstellungsfehler und wurde ersetzt. Blende nur bei Home zu Spiel und Spiel zu Home (Menü, Hauptmenü, Einführung beenden). **Ohne Blende** bleiben: Blind Auswahl, Shop und Runde, Nebenmenüs (Fenster), "Nochmal" nach einem Run. Der Ladebalken ist reine Darstellung (feste Dauer), kein echter Ladefortschritt. Auf dem iPad prüfen: ob 2,5 s bei häufigem Menü zu lang sind, Ruckeln beim Tausch des Screens (er läuft bei vollständig verdecktem Bild, ein Ruckeln verzögert nur den Balken). Kein eigener Sound. |
| O95 | Zusammenführen von Ständen (Sync, Import) | `src/syncBundle.ts`: Profil Zähler und Rekorde gelten je Wert als Maximum, Entdeckungen und Siege als Vereinigung, Zeitstempel (`unlocked`) als früherer Fund. Haben zwei Geräte unabhängig voneinander gezählt (zum Beispiel beide offline je 10 Hands), geht ein Teil der Zählung verloren, es wird aber nie doppelt gezählt. `sync` (Stand der letzten Run Auswertung) kommt vom Profil mit mehr Hands. Der Run lässt sich nicht zusammenführen: gleicher Run gilt nach Zeitstempel, verschiedene Runs fragen nach (Standard lokal). Ein Run aus neuerer `SAVE_VERSION` wird nie überschrieben |
| O96 | Kopplungscode und Cloud Sync | **Umgesetzt (0.8.4 Entwicklung):** 20 Zeichen aus 32 (100 Bit), `src/syncCrypto.ts`. Der Server sieht nur `syncId` (SHA-256 mit Domäne) und AES-GCM Chiffretext, der Schlüssel kommt per PBKDF2 aus dem Code. Verlorener Code heißt verlorener Cloud Stand, deshalb bleibt Export als Backup. Eigenes Supabase Projekt `Alatro` (getrennt vom alten Projekt), Tabelle `saves` ohne Zugriff für den Browser, Zugriff nur über `sync_pull` und `sync_push` (`docs/sync.sql`). URL und publishable Key stehen in `src/data/sync.ts` und sind öffentlich gedacht. Der Supabase Advisor meldet für beide Funktionen die Warnung "anon kann SECURITY DEFINER ausführen", das ist gewollt. Kein Rate Limit auf Funktionsebene: ein Angreifer kann Zeilen unter erfundenen Kennungen anlegen (je Zeile höchstens 2 MB), geraten werden kann ein Code praktisch nicht |
| O97 | Export und Import | Optionen, Zeile "Spielstand" (`src/ui/BackupView.ts`): Datei oder Text, Import aus Datei oder Zwischenablage, danach Neuladen. Die Zwischenablage kann auf dem iPad eine Rückfrage zeigen oder verweigert sein, dann hilft die Datei. Die Optionen Einstellungen werden bewusst nicht übertragen (pro Gerät verschieden). Auf dem iPad noch nicht geprüft |
| O98 | Zeitstempel des Runs | `alatro.run.at.v1` hält den Zeitpunkt der letzten Run Speicherung, ohne neue `SAVE_VERSION`. Fehlt er (Stand vor dieser Version), gilt 0, ein Import des gleichen Runs gewinnt dann |
| O99 | Abgleich Zeitpunkte und Run Ersatz | `src/syncCloud.ts`, `src/ui/syncManager.ts`. Abgleich nach lokalen Änderungen (8 s verzögert, `SYNC.pushDebounceMs`), beim Verlassen und beim Zurückkehren zur App, und von Hand. Ein Cloud Run ersetzt den lokalen **nur bei offenem Home Bildschirm**, nie mitten in einer Runde (sonst würde der Speicherstand des Spiels den fremden Run wieder überschreiben). Dann zeigt der Status "Neuerer Run in der Cloud" und der Run kommt beim nächsten Abgleich am Home Bildschirm. Ein beendeter Run wird als Zeitstempel (`alatro.run.at.v1`) hochgeladen, damit er auf dem anderen Gerät nicht wieder auftaucht. Beim Verlassen der App ist der Upload nur ein Versuch (kein `keepalive`, wegen der Größe), der nächste Start holt es nach |
| O100 | Grenzen des Sync | Nicht getestet gegen den echten Server aus dem Container (Netzwerk gesperrt), stattdessen: SQL Logik direkt in der Datenbank, Protokoll mit Server Nachbau (`src/syncCloud.test.ts`), und Ende zu Ende im Browser mit abgefangenen Anfragen. Ungeprüft: CORS Antwort von Supabase im Browser (üblicherweise offen), Verhalten der Home Screen PWA im Hintergrund auf dem iPad. Das Supabase Gratis Projekt wird nach etwa einer Woche Inaktivität pausiert, der lokale Stand bleibt dabei die Wahrheit, Wiederherstellen per Klick im Dashboard |
