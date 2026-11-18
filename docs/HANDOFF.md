# Übergabe: Stand nach M3 und M4, nächster Schritt M5

Stand: 18.11.2026. Branch `claude/wonderful-brahmagupta-nby5o4`.

## Wo wir stehen

| Meilenstein | Status |
|---|---|
| Schritt 1 Audit (`AUDIT.md`, `tests/spec/`) | erledigt |
| M1 Engine Kern (Daten, Erkennung, Scoring Pipeline, Blinds, Zinsen) | erledigt |
| M2 Spielfluss (Zustandsautomat, Skip und Tags, Bosse, Shop, Packs, Vouchers, Decks, Stakes) | erledigt |
| M3 Eigener Joker Katalog (79 Jokers, gruppenweise mit Tests) | erledigt |
| M4 Consumables, Pack Abläufe für Consumables, Collection, Run Info, Seed Eingabe | erledigt |
| **M5 UI, UX, Juice** (CRT, Farbstimmung pro Blind, Sound, Shake, Edition Shader, Joker Grafiken) | **als Nächstes** |
| M6 Politur, Performance, Optionen | offen |

Teststand: `npm test` 231 von 231 grün, `npm run test:spec` 87 von 87 grün, `npm run build` grün.

Das Briefing `balatro_briefing.md` liegt **nicht** im Repo (es wurde nur im Chat hochgeladen). Den Originalkatalog aus Abschnitt 4 nicht verwenden, alle Inhalte sind eigene Entwürfe.

## Projektstruktur

| Ort | Inhalt |
|---|---|
| `src/data/` | alle Zahlen und Inhalte: `hands`, `cards`, `economy`, `blinds`, `shop`, `modifiers` (eigene Enhancements, Seals, Editions), `jokers`, `consumables` (Sternbild, Elixier, Omen), `bosses`, `tags`, `vouchers`, `decks`, `stakes`, `packs`, `modsSpec` (RunMods) |
| `src/core/types.ts` | gemeinsame Typen (Card, HandType, Effect, DetectRules) |
| `src/core/handEval.ts` | `detectHand(cards, rules)` mit `contained` Set |
| `src/core/scoring.ts` | `scoreHand()`: Before, Basis mit Boss Mods, Karten (Rang, Enhancement, Seal, Edition, Jokers scored, Retrigger), Held, Jokers main mit Edition vor und nach, **Consumable Phase (Sternbilder im Slot)**, Balance, Floor, After. Liefert ScoreEvents |
| `src/core/jokers.ts` | Joker Schema: `JokerDef { id, name, rarity, cost, config, description mit {platzhaltern}, copyCompat, rules?, init?, passive?, copies?, rescue?, minAnte?, calculate(ctx, self, cfg) }`, Registry (`registerJokers`, `getJoker`, `allJokers`), `jokerDescription`, `jokerRules`, `copyTarget`, `sumPassives` |
| `src/core/consumables.ts` | Slots (`addConsumable`, `freeConsumableSlots`, `sellConsumable`), `canUseConsumable(run, defId, targetIds, where)`, `applyConsumable`, `useConsumable` (aus dem Slot), `useDirect` (Pack, Kaufen und Benutzen), `poolCards` (Hand der Runde oder Pack Hand), `createStarSealConsumables` |
| `src/core/generate.ts` | Zufallsziehungen: `rollJoker`, `rollJokerEdition`, `rollPlayingCard`, `rollEnhancedCard`, `rollConsumable` (geheime Sternbilder erst nach dem ersten Spielen) |
| `src/core/runInfo.ts` | reine Daten für die Run Info: `handRows`, `blindRows`, `deckStats` |
| `src/core/run.ts` | `runJokerHook` (Phasen außerhalb des Scorings), `jokerPassive`, `effectiveProbMult`, RunState (Version 4), RunRules (inkl. `typeWeights`, `sternbildXMult`, `shopCardMods`), Runde, Boss Effekte, Auszahlung, `addJoker`, `ShopItem` (Union Joker, Consumable, Spielkarte), `PackOption`, `PackState.handIds` |
| `src/core/game.ts` | Zustandsautomat und Aktionen: `createRun`, `enterAnte`, `selectBlind`, `skipBlind`, `playHand`, `discardHand`, `afterHand`, `cashOut` (liefert zusätzlich `starSealCreated`), `openShop`, `reroll`, `buyCard`, `buyAndUse`, `buyVoucher`, `buyPack`, `pickFromPack(run, index, targetIds)`, `closePack`, `sellJoker`, `useConsumable`, `sellConsumable`, `leaveShop`, `applyMods` |
| `src/core/index.ts` | registriert `JOKER_DEFS` (muss vor Engine Nutzung importiert sein, auch in Tests) |
| `src/save.ts` | localStorage, Migration Version 1 zu 2 zu 3 zu 4, `saveRun` trägt die Collection nach |
| `src/collection.ts` | Collection: Einträge pro Reiter, `discoveredKeys(run)`, Speicherung unter `alatro.collection.v1` |
| `src/ui/Game.ts` | Szenen und Ablauf, Consumable Slots mit Tooltip (Benutzen, Verkaufen), Pack Ansicht mit Zielwahl, Run Info, Sammlung, Seed Eingabe |
| `src/ui/` weitere | `ShopView.ts`, `CardView.ts`, `JokerView.ts`, `ConsumableView.ts`, `RunInfoView.ts`, `CollectionView.ts`, `Background.ts` (Shader), `widgets.ts` (`tabBar`, `wrapText`), `theme.ts` |
| `tests/spec/` | Testfälle aus Briefing 10.3 mit Adapter `helpers.ts` (neutrale Test Jokers) |
| `src/core/*.test.ts` | Unit Tests (`core`, `m1`, `m2`, `m4`, `m4info`) |

## Joker Katalog (M3, erledigt)

79 Jokers in `src/data/jokers.ts`, gruppiert nach Mechanik, Tests in `src/core/m3.test.ts`. Einzelheiten und Entscheidungen stehen in `AUDIT.md` (Abschnitt M3, O43 bis O50).

Einen neuen Joker anlegen:

* Eintrag in `JOKER_DEFS` mit eindeutiger ID (nie ändern), `config` für alle Zahlen und `description` mit Platzhaltern wie `{mult}`. Skalierende Jokers legen ihre Startwerte in `init(cfg)` ab (veränderliche Werte stehen in `self.vars`, config bleibt fest, die Namen dürfen sich nicht überschneiden).
* Phasen für `calculate(ctx, self, cfg)`: Scoring `before`, `scored`, `held`, `retrigger`, `main`, `after`, `other`. Außerhalb des Scorings `discard`, `blindSelected`, `roundEnd` (ohne Zufall, die Anzeige rechnet vorab), `sell`. Rückgabe ist ein `Effect` (chips, mult, xMult, money, retrigger, consumables, destroySelf, cardChips, enhanceFirst).
* Dauerhafte Wirkungen über `passive(cfg)` (Hands, Discards, Hand Size, Slots, Zinsdeckel, Shop Slots, gratis Rerolls, Rabatt, Wahrscheinlichkeit), Erkennungsregeln über `rules`, Kopien über `copies`, Rettung über `rescue` (mit `config.fraction`), Spawn Bedingung über `minAnte`.
* `copyCompat: false` für alles, was sich nicht sinnvoll kopieren lässt.
* Face Card Prüfungen immer über `ctx.isFace(card)`, damit der Maskenball wirkt. Ranglose Karten (Obsidian) lösen Rang Bedingungen nicht aus.
* Tests: Gruppen Tests ergänzen, der Katalog Rauchtest und die Beschreibungs Prüfung laufen automatisch über alle Jokers.

Offen und möglich: eigene Joker Grafiken (M5, bisher Farbkreis mit Initiale), Sticker (gibt es nicht), weitere Jokers.

## Tempo, Anleitung und Patch Notes (Version 0.2.0)

* **Animationstempo:** `src/settings.ts` (Einstellung, localStorage `alatro.settings.v1`), Stufen in `src/data/options.ts`. `tween` und `wait` in `src/ui/tween.ts` multiplizieren die Zeit mit `getSpeed()`. Wer eine Animation vom Tempo ausnehmen will, übergibt `scaled = false`. Bedienung über Optionen im Hauptmenü und den Tempo Knopf in der Seitenleiste.
* **Patch Notes:** `src/data/patchnotes.ts`. Bei jedem Release oben einen Eintrag ergänzen und `version` in `package.json` und `package-lock.json` anpassen, der Test in `src/settings.test.ts` prüft das. Die Notes erscheinen beim Start einmal pro Version, danach über Neuigkeiten.
* **Anleitung:** `src/data/tutorial.ts`, Ansicht in `src/ui/InfoViews.ts` (zusammen mit Optionen und Patch Notes). Bei Regeländerungen die Texte mitpflegen.

## Hinweise für M5

* Consumables haben ein eigenes Kartenbild (`ConsumableView.ts`, Symbole aus Grafikprimitiven: Stern, Kolben, Mond). Eigene Grafiken und Sounds für Benutzen und Elixier Effekte gehören zu M5.
* Die Score Animation kennt jetzt `source.kind === 'consumable'` (Fernrohr). Das Popup erscheint unter dem Slot, ob der Zeitpunkt gut wirkt, wurde nur im Code geprüft, nicht Bild für Bild.
* Seed Eingabe: O und 0 sehen in der Systemschrift fast gleich aus (AUDIT O40).

## Browser Test

Build, `npx vite preview --port 4173`, Playwright Skript mit Tap Koordinaten. Viewport 1440 mal 1000 entspricht 1:1 der logischen Auflösung. Koordinaten im Modal: Bildschirm Position gleich Modal Offset plus Box Koordinate.

* Spielstände für Szenen (Shop, Pack, Runde mit Slots) lassen sich mit einem kleinen Skript erzeugen: `npx vite-node` lädt nur Dateien unter dem Projektordner, das Skript also kurz im Projektordner anlegen (z. B. `m4gen.tmp.ts`, danach wieder entfernen), `createRun` und die Engine Aktionen aufrufen und das JSON in `localStorage['alatro.run.v1']` setzen. Dann im Hauptmenü auf Fortsetzen tippen.
* Screenshots während der Animation: `page.screenshot` ist mit WebGL langsam (mehrere Sekunden), einzelne Animationsschritte lassen sich so nicht fangen. `page.clock` ist sehr langsam, Video Frames lassen sich mit dem mitgelieferten ffmpeg nicht dekodieren.
