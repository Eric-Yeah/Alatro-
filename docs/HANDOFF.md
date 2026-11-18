# Übergabe: Stand nach M5, offen sind M3 und M6

Stand: 18.11.2026. Branch `claude/zealous-ptolemy-xm2a7i`.

## Wo wir stehen

| Meilenstein | Status |
|---|---|
| Schritt 1 Audit (`AUDIT.md`, `tests/spec/`) | erledigt |
| M1 Engine Kern (Daten, Erkennung, Scoring Pipeline, Blinds, Zinsen) | erledigt |
| M2 Spielfluss (Zustandsautomat, Skip und Tags, Bosse, Shop, Packs, Vouchers, Decks, Stakes) | erledigt |
| **M3 Eigener Joker Katalog** | **offen** (wurde übersprungen, M4 hängt nicht davon ab) |
| M4 Consumables, Pack Abläufe für Consumables, Collection, Run Info, Seed Eingabe | erledigt |
| M5 UI, UX, Juice (CRT, Farbstimmung pro Blind, Sound, Shake, Edition Shader, Joker Grafiken, Optionen) | erledigt |
| M6 Politur, Performance, Optionen | offen |

Teststand: `npm test` 146 von 146 grün, `npm run test:spec` 87 von 87 grün, `npm run build` grün.

Das Briefing `balatro_briefing.md` liegt **nicht** im Repo (es wurde nur im Chat hochgeladen). Für M3 braucht es nur die allgemeinen Teile (Abschnitt 3 Scoring Reihenfolge, 8.2 Joker Schema, 10.1 Gruppen). Diese sind hier zusammengefasst. Den Originalkatalog aus Abschnitt 4 nicht verwenden.

## Projektstruktur

| Ort | Inhalt |
|---|---|
| `src/data/` | alle Zahlen und Inhalte: `hands`, `cards`, `economy`, `blinds`, `shop`, `modifiers` (eigene Enhancements, Seals, Editions), `jokers`, `consumables` (Sternbild, Elixier, Omen), `bosses`, `tags`, `vouchers`, `decks`, `stakes`, `packs`, `modsSpec` (RunMods) |
| `src/core/types.ts` | gemeinsame Typen (Card, HandType, Effect, DetectRules) |
| `src/core/handEval.ts` | `detectHand(cards, rules)` mit `contained` Set |
| `src/core/scoring.ts` | `scoreHand()`: Before, Basis mit Boss Mods, Karten (Rang, Enhancement, Seal, Edition, Jokers scored, Retrigger), Held, Jokers main mit Edition vor und nach, **Consumable Phase (Sternbilder im Slot)**, Balance, Floor, After. Liefert ScoreEvents |
| `src/core/jokers.ts` | Joker Schema: `JokerDef { id, name, rarity, cost, config, description mit {platzhaltern}, copyCompat, rules?, calculate(ctx, self, cfg) }`, Registry (`registerJokers`, `getJoker`, `allJokers`), `jokerDescription`, `jokerRules` |
| `src/core/consumables.ts` | Slots (`addConsumable`, `freeConsumableSlots`, `sellConsumable`), `canUseConsumable(run, defId, targetIds, where)`, `applyConsumable`, `useConsumable` (aus dem Slot), `useDirect` (Pack, Kaufen und Benutzen), `poolCards` (Hand der Runde oder Pack Hand), `createStarSealConsumables` |
| `src/core/generate.ts` | Zufallsziehungen: `rollJoker`, `rollJokerEdition`, `rollPlayingCard`, `rollEnhancedCard`, `rollConsumable` (geheime Sternbilder erst nach dem ersten Spielen) |
| `src/core/runInfo.ts` | reine Daten für die Run Info: `handRows`, `blindRows`, `deckStats` |
| `src/core/run.ts` | RunState (Version 4), RunRules (inkl. `typeWeights`, `sternbildXMult`, `shopCardMods`), Runde, Boss Effekte, Auszahlung, `addJoker`, `ShopItem` (Union Joker, Consumable, Spielkarte), `PackOption`, `PackState.handIds` |
| `src/core/game.ts` | Zustandsautomat und Aktionen: `createRun`, `enterAnte`, `selectBlind`, `skipBlind`, `playHand`, `discardHand`, `afterHand`, `cashOut` (liefert zusätzlich `starSealCreated`), `openShop`, `reroll`, `buyCard`, `buyAndUse`, `buyVoucher`, `buyPack`, `pickFromPack(run, index, targetIds)`, `closePack`, `sellJoker`, `useConsumable`, `sellConsumable`, `leaveShop`, `applyMods` |
| `src/core/index.ts` | registriert `JOKER_DEFS` (muss vor Engine Nutzung importiert sein, auch in Tests) |
| `src/save.ts` | localStorage, Migration Version 1 zu 2 zu 3 zu 4, `saveRun` trägt die Collection nach |
| `src/collection.ts` | Collection: Einträge pro Reiter, `discoveredKeys(run)`, Speicherung unter `alatro.collection.v1` |
| `src/ui/Game.ts` | Szenen und Ablauf, Consumable Slots mit Tooltip (Benutzen, Verkaufen), Pack Ansicht mit Zielwahl, Run Info, Sammlung, Seed Eingabe |
| `src/data/juice.ts` | Zahlen für Juice: `SCORE_TIERS` (Shake und Flash nach Handpunkten durch Ziel), Tonleiter, `MOODS` (Hintergrund pro Blind), `CRT`, Standard Einstellungen |
| `src/settings.ts` | Einstellungen (CRT, Shake, Lautstärke), `getSettings`, `updateSettings`, `onSettings`, Speicherort `alatro.settings.v1` |
| `src/ui/` Juice | `audio.ts` (WebAudio Synthese, `sfx.*`), `crt.ts` (Post Processing), `editionFx.ts` (Edition Overlays), `stageFx.ts` (Shake über Pivot der Wurzel, Flash), `juiceMath.ts` (rein, getestet), `jokerArt.ts` (Embleme), `glsl.ts` (gemeinsamer Vertex Shader), `Background.ts` (Stimmungen über `setMood`) |
| `src/ui/` weitere | `ShopView.ts`, `CardView.ts`, `JokerView.ts`, `ConsumableView.ts`, `RunInfoView.ts`, `CollectionView.ts`, `Background.ts` (Shader), `widgets.ts` (`tabBar`, `wrapText`), `theme.ts` |
| `tests/spec/` | Testfälle aus Briefing 10.3 mit Adapter `helpers.ts` (neutrale Test Jokers) |
| `src/core/*.test.ts` | Unit Tests (`core`, `m1`, `m2`, `m4`, `m4info`) |

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
* Neu seit M4: Omen können Jokers erzeugen (`Teufelsmarkt`) und zerstören (`Hexenkessel`). Beide nutzen `rollJoker` und `run.jokers` direkt, neue Joker Hooks (z. B. `sell`) müssen dort nicht beachtet werden, solange Zerstörung kein Verkauf ist.

### Gruppen (eigene Inhalte, Beispiele nur als Richtung)

1. **Einfache MAIN Jokers:** +Mult, +Chips, X Mult, "Hand enthält Pair, Two Pair, Three of a Kind, Straight, Flush" (über `ctx.contained`).
2. **SCORED und HELD Jokers:** Suit, Rang, Face Card, gerade und ungerade Ränge, Karten in der Hand.
3. **Retrigger Jokers:** z. B. Face Cards erneut, erste Karte zweimal, niedrige Ränge, letzte Hand, Held Effekte wiederholen.
4. **Skalierende Jokers:** wachsen pro Hand, pro Discard, pro bestimmtem Handtyp, pro Runde, verlieren Wert pro Hand (Zustand in `self.vars`).
5. **Geld Jokers:** Geld am Rundenende, pro gewerteter Karte mit Chance, pro Discard, Zinsen erhöhen.
6. **Blind und Shop Jokers:** Effekt bei Blind Auswahl, gratis Reroll, Rabatt, Joker beim Verkauf.
7. **Passive Jokers:** Erkennungsregeln, +Hand Size, +Discards, Wahrscheinlichkeit verdoppeln.
8. **Spezialfälle:** Kopie des rechten Nachbarn, Rettung vor Game Over einmalig, Joker die Karten verändern (Enhancement vergeben), Legendary (nicht im Shop).

Verteilung grob: 60 Prozent Common, 30 Prozent Uncommon, 10 Prozent Rare, dazu wenige Legendary. Mit vielen Jokers lohnt sich ein Blick auf die Collection (`src/collection.ts`): sie listet Jokers automatisch aus der Registry, 12 Einträge pro Seite, Seitenwechsel ist eingebaut.

### Danach

* `AUDIT.md`: J2, J3 auf erledigt bzw. in Arbeit setzen, M3 Abschnitt unter "Fortschritt", neue Entscheidungen unter "Offene Punkte" (ab O43).
* UI: Jokers haben bisher nur Farbkreis mit Initiale. Für M3 reicht das, bessere eigene Joker Grafiken in M5.

## Hinweise für M6 (nach M5)

* Offen aus der UI Liste: **U8** Animationstempo (Optionen gibt es seit M5 im Hauptmenü, `settings.ts` erweitern), **U9** eigene Schrift (löst auch O40, O und 0 in der Seed Eingabe), Performance auf dem iPad prüfen (CRT Filter plus Hintergrund Shader laufen beide als Vollbild Filter, die Edition Overlays kosten pro Karte einen Filter Durchlauf).
* Sound und Shake sind nur im Browser geprüft, nicht auf dem iPad. Klang, Lautstärke Verhältnisse und die Stärke der Shake Stufen müssen dort gehört und gefühlt werden. Alle Zahlen stehen in `data/juice.ts`, Klänge in `ui/audio.ts`.
* Neue Jokers aus M3 brauchen keine Grafik, `jokerArt.ts` leitet das Emblem aus der ID ab (O45).
* Neue Aktionen im Spielfluss sollten einen `sfx.*` Aufruf bekommen. Neue Szenen setzen die Stimmung über `updateMood` in `Game.refreshInfo`.

## Hinweise zu M5 (erledigt, zur Referenz)

* Consumables haben ein eigenes Kartenbild (`ConsumableView.ts`, Symbole aus Grafikprimitiven: Stern, Kolben, Mond). Eigene Grafiken und Sounds für Benutzen und Elixier Effekte gehören zu M5.
* Die Score Animation kennt jetzt `source.kind === 'consumable'` (Fernrohr). Das Popup erscheint unter dem Slot, ob der Zeitpunkt gut wirkt, wurde nur im Code geprüft, nicht Bild für Bild.
* Seed Eingabe: O und 0 sehen in der Systemschrift fast gleich aus (AUDIT O40).

## Browser Test

Build, `npx vite preview --port 4173`, Playwright Skript mit Tap Koordinaten. Viewport 1440 mal 1000 entspricht 1:1 der logischen Auflösung. Koordinaten im Modal: Bildschirm Position gleich Modal Offset plus Box Koordinate.

* Spielstände für Szenen (Shop, Pack, Runde mit Slots) lassen sich mit einem kleinen Skript erzeugen: `npx vite-node` lädt nur Dateien unter dem Projektordner, das Skript also kurz im Projektordner anlegen (z. B. `m4gen.tmp.ts`, danach wieder entfernen), `createRun` und die Engine Aktionen aufrufen und das JSON in `localStorage['alatro.run.v1']` setzen. Dann im Hauptmenü auf Fortsetzen tippen.
* Screenshots während der Animation: `page.screenshot` ist mit WebGL langsam (mehrere Sekunden), einzelne Animationsschritte lassen sich so nicht fangen. `page.clock` ist sehr langsam, Video Frames lassen sich mit dem mitgelieferten ffmpeg nicht dekodieren.
