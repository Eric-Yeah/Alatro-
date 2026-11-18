# Übergabe: Stand nach M5, M6 teilweise

Stand: 18.11.2026. Branch `claude/zealous-ptolemy-xm2a7i`.

## Wo wir stehen

| Meilenstein | Status |
|---|---|
| Schritt 1 Audit (`AUDIT.md`, `tests/spec/`) | erledigt |
| M1 Engine Kern (Daten, Erkennung, Scoring Pipeline, Blinds, Zinsen) | erledigt |
| M2 Spielfluss (Zustandsautomat, Skip und Tags, Bosse, Shop, Packs, Vouchers, Decks, Stakes) | erledigt |
| M3 Eigener Joker Katalog (79 Jokers, gruppenweise mit Tests) | erledigt |
| M4 Consumables, Pack Abläufe für Consumables, Collection, Run Info, Seed Eingabe | erledigt |
| M5 UI, UX, Juice (CRT, Farbstimmung pro Blind, Sound, Shake, Edition Shader, Joker Grafiken, Optionen) | erledigt |
| M6 Politur, Performance, Optionen | **teilweise**: Tempo, Grafikstufe, FPS Anzeige, Optionen fertig. Offen: iPad Messung, eigene Schrift (O55), Feinschliff nach Test |

Teststand: `npm test` 249 von 249 grün, `npm run test:spec` 87 von 87 grün, `npm run build` grün.

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
| `src/data/juice.ts` | Zahlen für Juice: `SCORE_TIERS` (Shake und Flash nach Handpunkten durch Ziel), Tonleiter, `MOODS` (Hintergrund pro Blind), `CRT`, Standard Einstellungen |
| `src/settings.ts` | Einstellungen (CRT, Shake, Lautstärke), `getSettings`, `updateSettings`, `onSettings`, Speicherort `alatro.settings.v1` |
| `src/ui/` Juice | `audio.ts` (WebAudio Synthese, `sfx.*`), `crt.ts` (Post Processing), `editionFx.ts` (Edition Overlays), `stageFx.ts` (Shake über Pivot der Wurzel, Flash), `juiceMath.ts` (rein, getestet), `jokerArt.ts` (Embleme), `glsl.ts` (gemeinsamer Vertex Shader), `Background.ts` (Stimmungen über `setMood`) |
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

* **Tempo Knopf:** In der Seitenleiste schaltet `cycleSpeed()` (`src/settings.ts`) die Stufen aus `SPEED_STEPS` (`src/data/juice.ts`, 1x bis 10x) weiter. Das Tempo selbst wirkt wie in M6 beschrieben in `tween` und `wait`.
* **Patch Notes:** `src/data/patchnotes.ts`. Bei jedem Release oben einen Eintrag ergänzen und `version` in `package.json` und `package-lock.json` anpassen, der Test in `src/patchnotes.test.ts` prüft das. Die Notes erscheinen beim Start einmal pro Version, danach über Neuigkeiten.
* **Anleitung:** `src/data/tutorial.ts`, Ansicht in `src/ui/InfoViews.ts` (zusammen mit den Patch Notes). Bei Regeländerungen die Texte mitpflegen.

## Hinweise für M6 (Rest)

* Fertig: Animationstempo (`SPEED_STEPS`, wirkt in `tween`/`wait`), Grafikstufe Voll oder Sparsam (`QUALITY_PROFILE`, in `main.ts` und `editionFx.ts` angewendet), FPS Anzeige (`ui/perf.ts`), Seed Tastatur ohne O. Einzelheiten in `AUDIT.md` Abschnitt M6, O56, O57.
* **Als Nächstes:** Auf dem iPad mit eingeschalteter FPS Anzeige prüfen, ob Voll flüssig läuft (Hintergrund Shader, CRT und Edition Overlays sind die Kandidaten). Wenn nicht, `QUALITY_PROFILE` anpassen oder Sparsam als Standard setzen. Danach Klang und Shake Stärke nachziehen (alle Zahlen in `data/juice.ts`, Klänge in `ui/audio.ts`).
* **U9 eigene Schrift** ist offen und bewusst nicht gebaut (O55), braucht eine Entscheidung.
* Neue Aktionen im Spielfluss sollten einen `sfx.*` Aufruf bekommen. Neue Szenen setzen die Stimmung über `updateMood` in `Game.refreshInfo`. Neue Animationen laufen über `tween` und `wait`, damit das Tempo greift.

## Hinweise zu M5 (erledigt, zur Referenz)

* Consumables haben ein eigenes Kartenbild (`ConsumableView.ts`, Symbole aus Grafikprimitiven: Stern, Kolben, Mond). Eigene Grafiken und Sounds für Benutzen und Elixier Effekte gehören zu M5.
* Die Score Animation kennt jetzt `source.kind === 'consumable'` (Fernrohr). Das Popup erscheint unter dem Slot, ob der Zeitpunkt gut wirkt, wurde nur im Code geprüft, nicht Bild für Bild.
* Seed Eingabe: O und 0 sehen in der Systemschrift fast gleich aus (AUDIT O40).

## Home Bildschirm (Version 0.2.1)

`src/ui/HomeView.ts` baut den Vollbild Home Bildschirm (`buildHome`), Zahlen und Layout stehen oben in der Datei (`HOME`). `Game.showMainMenu()` legt ihn in `homeLayer` (über dem Tisch, unter den Fenstern) und blendet den Spieltisch aus (`setTableVisible`). Nebenmenüs (Optionen, Anleitung, Sammlung, Neuigkeiten, Run Setup) öffnen als Fenster darüber, ihr Zurück ruft wieder `showMainMenu()`. `resume` und `beginNewRun` rufen `hideHome()`. Der Menü Knopf im Spiel führt ebenfalls hierher.

## Handy Version

Gleiche App und gleiche URL wie auf dem iPad. Das Spielfeld bleibt 1440 mal 1000 und wird eingepasst. Auf dem Handy (kürzere Bildschirmseite bis `PHONE_MAX_SHORT_SIDE`) wird das Spielfeld im Hochformat um 90 Grad gedreht, damit es standardmäßig im Querformat erscheint (iOS erlaubt keine feste Ausrichtung, Manifest `orientation: landscape` gilt nur auf Android). Dreht man das Handy ins Querformat, wird nicht mehr gedreht. Die Berechnung steht in `src/ui/viewport.ts` (mit Test), der Einbau in `src/main.ts`. Auf Android wird zusätzlich beim ersten Tippen `screen.orientation.lock('landscape')` versucht. Das iPad verhält sich wie vorher.

Offen: Auf dem Handy ist das Spielfeld klein (Höhe etwa 390 Pixel entspricht Faktor 0,39). Ein eigenes Handy Layout mit größeren Elementen wäre ein eigener Schritt.

## Browser Test

Build, `npx vite preview --port 4173`, Playwright Skript mit Tap Koordinaten. Viewport 1440 mal 1000 entspricht 1:1 der logischen Auflösung. Koordinaten im Modal: Bildschirm Position gleich Modal Offset plus Box Koordinate.

* Spielstände für Szenen (Shop, Pack, Runde mit Slots) lassen sich mit einem kleinen Skript erzeugen: `npx vite-node` lädt nur Dateien unter dem Projektordner, das Skript also kurz im Projektordner anlegen (z. B. `m4gen.tmp.ts`, danach wieder entfernen), `createRun` und die Engine Aktionen aufrufen und das JSON in `localStorage['alatro.run.v1']` setzen. Dann im Hauptmenü auf Fortsetzen tippen.
* Screenshots während der Animation: `page.screenshot` ist mit WebGL langsam (mehrere Sekunden), einzelne Animationsschritte lassen sich so nicht fangen. `page.clock` ist sehr langsam, Video Frames lassen sich mit dem mitgelieferten ffmpeg nicht dekodieren.
