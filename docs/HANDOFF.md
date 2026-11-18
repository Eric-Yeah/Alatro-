# Übergabe: Stand nach M2, nächster Schritt M3

Stand: 18.11.2026. Branch `claude/funny-brahmagupta-ic0bpe`, alles gepusht.

## Wo wir stehen

| Meilenstein | Status |
|---|---|
| Schritt 1 Audit (`AUDIT.md`, `tests/spec/`) | erledigt |
| M1 Engine Kern (Daten, Erkennung, Scoring Pipeline, Blinds, Zinsen) | erledigt |
| M2 Spielfluss (Zustandsautomat, Skip und Tags, Bosse, Shop, Packs, Vouchers, Decks, Stakes) | erledigt |
| **M3 Eigener Joker Katalog** | **als Nächstes** |
| M4 Consumables, Pack Abläufe für Consumables, Collection, Run Info, Seed Eingabe | offen |
| M5 UI, UX, Juice (CRT, Farbstimmung pro Blind, Sound, Shake, Edition Shader) | offen |
| M6 Politur, Performance, Optionen | offen |

Teststand: `npm test` 72 von 72 grün, `npm run test:spec` 87 von 87 grün.

Das Briefing `balatro_briefing.md` liegt **nicht** im Repo (es wurde nur im Chat hochgeladen). Für M3 braucht es nur die allgemeinen Teile (Abschnitt 3 Scoring Reihenfolge, 8.2 Joker Schema, 10.1 Gruppen). Diese sind hier zusammengefasst. Den Originalkatalog aus Abschnitt 4 nicht verwenden.

## Projektstruktur

| Ort | Inhalt |
|---|---|
| `src/data/` | alle Zahlen und Inhalte: `hands`, `cards`, `economy`, `blinds`, `shop`, `modifiers` (eigene Enhancements, Seals, Editions), `jokers`, `bosses`, `tags`, `vouchers`, `decks`, `stakes`, `packs`, `modsSpec` (RunMods) |
| `src/core/types.ts` | gemeinsame Typen (Card, HandType, Effect, DetectRules) |
| `src/core/handEval.ts` | `detectHand(cards, rules)` mit `contained` Set |
| `src/core/scoring.ts` | `scoreHand()`: Before, Basis mit Boss Mods, Karten (Rang, Enhancement, Seal, Edition, Jokers scored, Retrigger), Held, Jokers main mit Edition vor und nach, Balance, Floor, After. Liefert ScoreEvents |
| `src/core/jokers.ts` | Joker Schema: `JokerDef { id, name, rarity, cost, config, description mit {platzhaltern}, copyCompat, rules?, calculate(ctx, self, cfg) }`, Registry (`registerJokers`, `getJoker`, `allJokers`), `jokerDescription`, `jokerRules` |
| `src/core/run.ts` | RunState (Version 3), RunRules, Runde, Boss Effekte (`activeBoss`, `isCardDebuffed`, `activeJokers`), Auszahlung, `addJoker`, `canAddJoker`, `jokerSellValue` |
| `src/core/game.ts` | Zustandsautomat und Aktionen: `createRun`, `enterAnte`, `selectBlind`, `skipBlind`, `playHand`, `discardHand`, `afterHand`, `cashOut`, `openShop`, `reroll`, `buyCard`, `buyVoucher`, `buyPack`, `pickFromPack`, `closePack`, `sellJoker`, `leaveShop`, `applyMods` |
| `src/core/index.ts` | registriert `JOKER_DEFS` (muss vor Engine Nutzung importiert sein, auch in Tests) |
| `src/save.ts` | localStorage, Migration Version 1 zu 2 zu 3 |
| `src/ui/Game.ts` | Szenen und Ablauf, `ShopView.ts`, `CardView.ts`, `JokerView.ts`, `Background.ts` (Shader), `theme.ts` |
| `tests/spec/` | Testfälle aus Briefing 10.3 mit Adapter `helpers.ts` (neutrale Test Jokers) |
| `src/core/*.test.ts` | Unit Tests (`core`, `m1`, `m2`) |

## Aufgabe M3: eigener Joker Katalog

Ziel: etwa 60 eigene Jokers im Thema, gruppenweise, **jede Gruppe mit Tests** (neue Datei `src/core/m3.test.ts` oder pro Gruppe). Vorhanden sind 9: Funke, Treppe, Glut, Frost, Kleinvieh, Einzelgänger, Letzte Chance, Schneeball, Sparschwein (`src/data/jokers.ts`). IDs nicht ändern (Spielstände).

### Engine Erweiterungen, die M3 braucht

Die Phasen in `JokerPhase` reichen bisher für das Scoring (`before`, `scored`, `held`, `retrigger`, `main`, `after`). Für die Gruppen 5 bis 8 fehlen Hooks außerhalb des Scorings. Vorschlag:

* Neue Phasen: `discard` (beim Abwerfen, mit den Karten), `blindSelected` (bei `selectBlind`), `roundEnd` (bei `cashOut`, Rückgabe `money` fließt in die Auszahlung als eigene Zeile), `shopReroll`, `shopOpen`, `sell` (beim Verkauf des Jokers selbst).
* Aufrufstellen in `src/core/game.ts` bzw. `run.ts` ergänzen, Kontext dafür erweitern (Run Zugriff über einen schmalen Kontext, nicht ganzer RunState, wo möglich).
* `other` Phase für Jokers, die auf andere Jokers reagieren (Briefing 3.4 Schritt 3).
* Kopierender Joker: ruft `calculate` des rechten Nachbarn mit dessen `self` und `config` auf, nur wenn `copyCompat`.
* Joker, die Erkennungsregeln setzen: Feld `rules` existiert schon (4 Karten Flush und Straight, Lücken Straight, gleichfarbige Suits, Splash, allFace). `allFace` wird in `isFace` Prüfungen der Jokers noch nicht berücksichtigt.
* Joker, die `probMult` erhöhen: in `playCards` bzw. `runChance` aus den Jokers ableiten.
* Erweiterung der Rundenwerte durch Jokers (Hands, Discards, Hand Size): beim `selectBlind` anwenden.
* Spawn Bedingungen (`spawnCondition`) und Sticker Kompatibilität sind im Schema noch nicht vorhanden (AUDIT J2).

### Gruppen (eigene Inhalte, Beispiele nur als Richtung)

1. **Einfache MAIN Jokers:** +Mult, +Chips, X Mult, "Hand enthält Pair, Two Pair, Three of a Kind, Straight, Flush" (über `ctx.contained`).
2. **SCORED und HELD Jokers:** Suit, Rang, Face Card, gerade und ungerade Ränge, Karten in der Hand.
3. **Retrigger Jokers:** z. B. Face Cards erneut, erste Karte zweimal, niedrige Ränge, letzte Hand, Held Effekte wiederholen.
4. **Skalierende Jokers:** wachsen pro Hand, pro Discard, pro bestimmtem Handtyp, pro Runde, verlieren Wert pro Hand (Zustand in `self.vars`).
5. **Geld Jokers:** Geld am Rundenende, pro gewerteter Karte mit Chance, pro Discard, Zinsen erhöhen.
6. **Blind und Shop Jokers:** Effekt bei Blind Auswahl, gratis Reroll, Rabatt, Joker beim Verkauf.
7. **Passive Jokers:** Erkennungsregeln, +Hand Size, +Discards, Wahrscheinlichkeit verdoppeln.
8. **Spezialfälle:** Kopie des rechten Nachbarn, Rettung vor Game Over einmalig, Joker die Karten verändern (Enhancement vergeben), Legendary (nicht im Shop).

Verteilung grob: 60 Prozent Common, 30 Prozent Uncommon, 10 Prozent Rare, dazu wenige Legendary.

### Danach

* `AUDIT.md`: J2, J3 auf erledigt bzw. in Arbeit setzen, M3 Abschnitt unter "Fortschritt", neue Entscheidungen unter "Offene Punkte" (ab O28).
* UI: Jokers haben bisher nur Farbkreis mit Initiale. Für M3 reicht das, bessere eigene Joker Grafiken in M5.
* Browser Test: Build, `npx vite preview --port 4173`, Playwright Skript mit Tap Koordinaten (logische Auflösung 1440 mal 1000, skaliert auf 1180 mal 820).
