# Übergabe: Stand nach dem Pokalsystem (Version 0.13.0)

Stand: 25.11.2026. Arbeitsbranch `claude/cool-babbage-xjdpyw` (zuvor `claude/clever-franklin-nytl3y`), live über den Deploy Branch `claude/funny-brahmagupta-ic0bpe`.

## Version 0.13.0: Pokalpfad und Wunderkammer

* **Was:** Pokale pro gespielter Runde (mehr bei höherer Ante), 8 Ligen mit 48 Meilensteinen, 7 Deck Pfade, 69 Kosmetik Stücke (Rücken, Kartenfarben, Himmel, Funken, Titel). Entwurf, Zahlen und Begründungen: `docs/pokale-plan.md`. Entscheidungen und offene Punkte: `AUDIT.md` O119 bis O130.
* **Wo:** Zahlen `src/data/trophies.ts` (Verdienst), `src/data/trophyRoad.ts` (Ligen, Pfad, Deck Stufen, Titel), `src/data/cosmetics.ts` (Katalog mit Parametern), Layout `src/data/trophyLayout.ts` und `wardrobeLayout.ts`. Logik ohne DOM `src/trophies.ts` (`observeTrophies`, `claimEntry`, `equip`, `mergeTrophyState`), Zustand `src/trophyState.ts` (Feld `profile.trophies`, keine neue `SAVE_VERSION`). Darstellung `src/ui/cosmeticFx.ts` (Rücken, Himmel, Funken, Paletten), Rücken Muster `src/ui/cardArt/cardBackArt.ts`, Ansichten `src/ui/TrophyView.ts` und `WardrobeView.ts`, reine Teile `trophyViewMath.ts` und `wardrobeMath.ts`. Verdrahtung in `Game.ts` (Suche nach `trackTrophies`) und `HomeView.ts`.
* **Neue Kosmetik anlegen:** Eintrag in `COSMETICS` (Id mit Präfix `back_`, `pal_`, `sky_`, `spark_` oder `title_`), Parameter je Kategorie, Platz am Pfad in `ROAD` oder `DECK_STAGES` (ein Test prüft, dass jedes Stück genau einmal belohnt wird), englischer Name und Beschreibung in `src/i18n/patch/cosmetics.ts`.
* **Pokale anders einstellen:** nur in `src/data/trophies.ts` und den Schwellen in `trophyRoad.ts`. Die Simulation in `src/trophies.test.ts` zeigt Runs je Liga und fängt Abweichungen ab.
* **Als Nächstes:** Auf dem iPad prüfen: Tempo des Pfads (O120), Wischen und Kachelgrößen (O130), Lesbarkeit der Himmel Farben und der Boss Stimmung (O127), Gefühl der Pokal Toasts und der Abrechnung in der Rückschau.

## Version 0.12.1: Supernova ruhiger, Menü Überarbeitung zusammengeführt

* Der Branch `claude/amazing-allen-o41jfv` (0.11.2 bis 0.11.5: Optionen als eigener Bildschirm, kein Tempo und kein Deck Knopf in der Seitenleiste, Layout Korrekturen) ist in den Arbeitsbranch gemerged. Die Optionen (`src/ui/OptionsView.ts`) bieten Grafik jetzt mit drei Stufen.
* Supernova: keine Ringe mehr beim Tippen, Wählen und Ziel erreicht, kein großer Kreis am Rundenende, keine Zeigerneigung der Karten, Schweben schwächer (0,6). Orbs, Funken, Konfetti, Callouts, Hintergrund und Staubwolke bleiben.

## Version 0.12.0: Grafikstufe Supernova

* Dritte Grafikstufe in den Optionen (Sparsam, Voll, Supernova). Supernova ist Voll plus Spektakel: Orbs von Karte oder Joker zur Chips und Mult Anzeige, Schockwellen bei X Mult, Callout Wörter (Funke, Flamme, Komet, Supernova) und Feuerwerk bei großen Händen, Konfetti bei Ziel und gewonnener Runde, Sternenstaub Spur am Zeiger, Tipp Funken, Funken Aura um gewählte Karten, Glühwürmchen, Hintergrund mit Nebel, Polarlicht, Sternschnuppen, Zeigerleuchten und Schockwellen, Hitze Aufbau, Zoom Stoß und CRT Farbversatz.
* **Wo:** Plan `docs/supernova-plan.md`, Zahlen `src/data/spektakel.ts`, Rechnung `src/ui/spektakelMath.ts` (getestet), Partikel `src/ui/particles.ts`, Zeiger `src/ui/pointerFx.ts`, Fassade `src/ui/spektakel.ts`, Einbau in `Game.ts` (Suche nach `spektakel.`), Shader Zusatz in `Background.ts` (`uFx`), `crt.ts` (`setPunch`), Bühne `stageFx.ts` (`punch`, Behälter `world` in `Game`). Einzelheiten und offene Punkte: `AUDIT.md` O113 bis O118.
* **Neue Effekte anlegen:** Methode in `Spektakel` (Fassade) mit `if (!this.enabled()) return;`, Zahlen nach `data/spektakel.ts`, Aufruf im Spiel hinter `spektakel.enabled()`. Neue Texte mit `t()` und Eintrag in `src/i18n/en/`.
* **Als Nächstes:** Auf dem iPad prüfen: Bildrate mit FPS Anzeige in Supernova (Dichte Regler, siehe O113), ob der Zoom Stoß und der Farbversatz angenehm sind (`TOTAL_FX`), Lesbarkeit der Callouts, ob die Zeigerspur beim Spielen stört.

## Version 0.11.5: aufgeräumte Seitenleiste

* Der Deck Knopf der Seitenleiste ist entfernt (Deck Ansicht über Stapel, Blind Auswahl, Run Info). Die Felder links liegen mit festem Abstand von 20 Punkten, die Zahlen stehen in `SIDE` oben in `src/ui/Game.ts`. Im Shop gibt es keinen direkten Deck Zugang mehr außer über Run Info.

## Version 0.11.3: Optionen als eigener Bildschirm

* `src/ui/OptionsView.ts` (`buildOptions`): Vollbild anstelle des Home Bildschirms (`Game.showOptions` leert `homeLayer`, Zurück baut Home neu). Links Seitenleiste mit vier Bereichen (Anzeige, Ton, Spiel, Daten) und Astrolabium als Zierde, rechts Karten je Einstellung. Der gewählte Bereich bleibt in `lastTab` erhalten. Sichern und Koppeln öffnen weiter als Fenster darüber.
* Bedienelemente in `src/ui/optionWidgets.ts`: `switchToggle`, `slider` (Stufen `VOLUME_STEP`, Ziehen über `globalpointermove`), `segmented`. Zahlen in `src/data/optionsLayout.ts`. Neue Einstellung: im passenden Bereich in `renderTab` eine Zeile ergänzen, Texte mit `t()` und Eintrag in `src/i18n/en/ui-options.ts`.
* **Als Nächstes:** Auf dem iPad prüfen: Ziehen der Schieberegler (Touch), Größe der Knöpfe, ob die rechte Fläche bei Bereichen mit wenigen Zeilen zu leer wirkt.

## Version 0.11.2: Layout Korrekturen

* **Neuer Run:** Panel 950 hoch, Seed und Start mit Abstand (`showRunSetup` in `src/ui/Game.ts`).
* **Optionen:** in 0.11.3 durch einen eigenen Bildschirm ersetzt.
* **Geräte koppeln, Code eingeben:** Tasten und Aktionsreihe überlappten (`src/ui/SyncView.ts`), Fenster jetzt 790 hoch. Das Codefeld zeigte nur getippte Gruppen, weil `formatCode` Platzhalter verwirft, jetzt feste fünf Gruppen mit `_`.
* **Harte Kante bei breiten Fenstern:** Die Abdunklung (`overlay`, Home `blocker`) deckte nur 1440 mal 1000 ab. Sie reicht jetzt um `VIEW_BLEED` (`theme.ts`) darüber hinaus. Neue Vollbild Flächen immer mit `VIEW_BLEED` anlegen.
* **Als Nächstes:** Auf dem iPad prüfen: Optionen und Koppeln Tastatur, Treffsicherheit der Tasten (66 Punkte).

## Version 0.11.1: ein Sortierknopf

* Die zwei Knöpfe Rank und Suit unter den Handkarten sind ein Knopf (`sortBtn` in `src/ui/Game.ts`, `cycleSort`). Jeder Tipp wechselt zwischen Rank und Suit, die Beschriftung zeigt die aktive Sortierung. Auf dem iPad prüfen: Größe und Position (Mitte zwischen Play Hand und Discard).

## Version 0.11.0: 150 Jokers und 23 neue Consumables

* **Jokers (71 neu, gesamt 150):** Entwurf mit Balance Leitplanken und Motiv Anregungen in `docs/joker-design-150.md`. Logik in `src/data/jokersMore.ts`, gemeinsame Hilfen in `src/data/jokerHelpers.ts`, `jokers.ts` führt beide Listen zu `JOKER_DEFS` zusammen. Verteilung: 79 Common, 44 Uncommon, 20 Rare, 7 Legendary. Englisch in `src/i18n/patch/jokers.ts`, Tests in `src/core/jokersMore.test.ts` (inklusive Katalog Prüfung: Anzahl, Preise, keine unbedingten X Mult über 1,25 unterhalb Legendary). Das Scoring kennt jetzt `ante` und `blind` (`ScoreInput`, `JokerContext`).
* **Joker Grafiken:** `src/ui/jokerSpritesG.ts` bis `J.ts` (71 Motive), Vorschau `preview/jokers-new.png` und `preview/jokers-150.png`. Notizen und Feinschliff Kandidaten: `docs/joker-art.md`.
* **Consumables (23 neu, gesamt 65):** 13 Elixiere, 10 Omen, Sternbilder bleiben 12. Entwurf und Balance: `docs/consumable-design.md`. Neue Effekt Arten in `ConsumableEffect`, neues optionales Feld `weight` (starke Karten erscheinen seltener, `rollConsumable` zieht gewichtet). Grafiken `consumableSpritesElixierC.ts`, `consumableSpritesOmenB.ts`. Tests `src/core/consumablesNew.test.ts`. Keine neue `SAVE_VERSION`.
* **Als Nächstes:** Auf dem iPad prüfen: Lesbarkeit der neuen Motive (schwächere: Viererkette, Echokammer, Goldquelle, Meilenstein, Glücksspieler, Zwillingsflamme, Kometenschweif), Balance im Spiel (siehe `AUDIT.md` O103 bis O112), Dither Flächen der Texturen.

## Version 0.10.2: Münzklang als Aufnahme, einmalig

* Münzklang ist `src/assets/coin.mp3` (vom Eigentümer gelieferte Aufnahme, unverändert bis auf Mono und kurzen Ausklang). Die Synthese und die Kaskade sind entfernt. `sfx.coins(...)` spielt immer genau einen Klang (`src/ui/audio.ts`, `coin`, `loadCoin`), Lautstärke in `src/data/coinSound.ts`. Beim Auszahlungsbild gibt es keinen Klang je Zeile mehr, nur einen beim Einkassieren. Bitte auf dem iPad anhören.

## Version 0.10.0

* **Deutsch und Englisch:** Wechsel in den Optionen ("Sprache"), die App lädt neu. Konzept: der deutsche Text ist der Schlüssel, `t('Text')` aus `src/i18n/index.ts`, Wörterbücher in `src/i18n/en/*.ts` (werden automatisch geladen). Inhalte aus `src/data/` (Jokers, Consumables, Erfolge, Einführung, Patch Notes usw.) werden bei Englisch beim Start durch Dateien in `src/i18n/patch/*.ts` an Ort und Stelle umgeschrieben (`applyDataLanguage`, `boot.ts`). Tests: `i18n.test.ts` (jeder `t()` Aufruf hat einen Eintrag), `dups.test.ts`, `contentEnA.test.ts`, `contentEnB.test.ts`. **Neuer sichtbarer Text:** immer `t('...')` und Eintrag in `src/i18n/en/`, neue Inhalte mit ID in den passenden Patch ergänzen. Einzelheiten, Begriffe und offene Punkte: `AUDIT.md`, Abschnitte "Mehrsprachigkeit".
* **Karten schweben, Austeilen und Einziehen:** `src/ui/cardMotion.ts`, `cardMotionMath.ts`, `dealAnim.ts`, Zahlen `src/data/cardMotion.ts`. Feintuning auf dem iPad (siehe `AUDIT.md`, "Kartenbewegung").
* **Deck Ansicht und Level up Vorschau:** `src/ui/DeckView.ts`, `levelUpView.ts`, reine Daten `deckLayout` und `levelUpPreview` in `src/core/runInfo.ts`. Zugang: Stapel antippen, Blind Auswahl, Run Info (der Knopf in der Seitenleiste ist seit 0.11.5 entfernt).
* **Münzklang:** `sfx.coin` und `sfx.coins` (`audio.ts`, Zahlen `src/data/coinSound.ts`), beim Einkassieren, Auszahlungszeilen, Joker Geld und Verkaufen.
* **Joker Tausch im Pack:** bei vollen Slots bietet ein Joker Pack "Tauschen" (`canSwapJoker`, `swapJokerFromPack` in `core/game.ts`, Ansicht in `Game.showPack`). Der alte Joker wird verkauft.
* **Als Nächstes:** Auf dem iPad prüfen: Gefühl und Bildrate des Schwebens und der Austeil Animation, Lesbarkeit der englischen Texte, Münzklang Lautstärke. Offen: Kaufen im Shop bei vollen Joker Slots (dort muss man weiter erst verkaufen), Browsersprache als Standard.

## Geräte Sync

Kopplungscode ohne Konto, Supabase als Speicher, Daten Ende zu Ende verschlüsselt. Fertig: S1 bis S4. Optionen, Zeile "Geräte koppeln" (`src/ui/SyncView.ts`) und Zeile "Spielstand" (Export, Import). Kern ohne Netz: `src/syncBundle.ts`, `src/syncCrypto.ts`, `src/syncStorage.ts`. Cloud: `src/syncCloud.ts` (Abgleich), `src/ui/syncManager.ts` (Hintergrund, Status), Meldekanal `src/syncHooks.ts`. Zahlen und Supabase Adresse: `src/data/sync.ts`. SQL: `docs/sync.sql` (ist im Projekt `Alatro` eingespielt). Tests: `src/sync.test.ts`, `src/syncCloud.test.ts`. Entscheidungen und Grenzen: `AUDIT.md` O95 bis O100.

* **Als Nächstes (S5):** Auf zwei echten Geräten prüfen: Code erzeugen, am anderen eingeben, Run mitnehmen, App im Hintergrund lassen. Dann Version hochsetzen und Patch Notes ergänzen (`src/data/patchnotes.ts`, Test prüft Gleichheit mit `package.json`).
* **Wichtig:** Das alte Supabase Projekt des Eigentümers (Manhunt) nicht anfassen. Den `service_role` Key nie ins Repo.

## Wo wir stehen

| Meilenstein | Status |
|---|---|
| Schritt 1 Audit (`AUDIT.md`, `tests/spec/`) | erledigt |
| M1 Engine Kern (Daten, Erkennung, Scoring Pipeline, Blinds, Zinsen) | erledigt |
| M2 Spielfluss (Zustandsautomat, Skip und Tags, Bosse, Shop, Packs, Vouchers, Decks, Stakes) | erledigt |
| M3 Eigener Joker Katalog (150 Jokers, gruppenweise mit Tests) | erledigt |
| M4 Consumables, Pack Abläufe für Consumables, Collection, Run Info, Seed Eingabe | erledigt |
| M5 UI, UX, Juice (CRT, Farbstimmung pro Blind, Sound, Shake, Edition Shader, Joker Grafiken, Optionen) | erledigt |
| M6 Politur, Performance, Optionen | **teilweise**: Tempo, Grafikstufe, FPS Anzeige, Optionen fertig. Offen: iPad Messung, eigene Schrift (O55), Feinschliff nach Test |

Teststand: `npm test` grün (siehe `AUDIT.md`), `npm run test:spec` 87 von 87 grün, `npm run build` grün.

Das Briefing `balatro_briefing.md` liegt **nicht** im Repo (es wurde nur im Chat hochgeladen). Den Originalkatalog aus Abschnitt 4 nicht verwenden, alle Inhalte sind eigene Entwürfe.

## Version 0.8.3: Ladekarte

Übergangsanimation zwischen den großen Screens: der Bildschirm blendet ins Nachtblau, eine Karte fällt in die Mitte und lädt (Balken), dahinter wird der Screen getauscht, die Karte dreht sich um, die Blende löst sich auf (`src/ui/ScreenTransition.ts`, Zahlen in `src/data/transition.ts`, Einbindung in `Game.transit`). Sie läuft beim Start der App und bei Home zu Spiel und zurück. Die Kuppelblende aus 0.8.1 wirkte wie ein Fehler und ist ersetzt. Details und offene Punkte: `AUDIT.md` O94.

* **Weitere Blende anlegen:** Wechsel in `Game.transit(() => ...)` einpacken, der Aufbau des neuen Screens gehört in den Rückruf.
* **Als Nächstes:** Auf dem iPad prüfen: Dauer (etwa 2,5 s) und Ruckeln beim Tausch.

## Version 0.7.1: Hintergrundmusik im Mix

Drei mystische Stücke ohne Beat und Bass (Sternenglas, Mondlabor, Sphärenklang), live synthetisiert. Standard ist **Mix**: die Stücke wechseln sich ab (je etwa zwei Minuten, weiche Überblendung), in den Optionen auch einzeln wählbar, mit eigener Lautstärke. Große Effekte ziehen die Musik kurz leiser (Ducking), Sparsam spielt eine leichtere Variante. Daten `src/data/music.ts`, Komposition `src/ui/musicScore.ts`, Klang und Player `src/ui/music.ts`, Einbindung in `src/ui/audio.ts` (`syncMusic`). Einzelheiten und offene Punkte: `AUDIT.md`, Abschnitt "Hintergrundmusik" und O88.

* **Neues Stück anlegen:** Eintrag in `TRACKS` (Akkorde, Pad, Glocken, Hall), Kurzbeschreibung höchstens `MUSIC.infoMax` Zeichen. Danach `level` so einstellen, dass alle Stücke etwa gleich laut sind (Hörprobe mit `scheduleMusic` im `OfflineAudioContext` rendern und Lautheit messen). Ein neues Stück kommt automatisch in den Mix.
* **Als Nächstes:** Auf dem iPad anhören: Gefällt der Mix, ist das Ducking zu stark oder zu schwach (`MUSIC.duck`), ist zwei Minuten pro Stück gut (`MUSIC.mixChords`). Akku und Bildrate mit Musik prüfen.

## Version 0.6.2: Titel aus Karten

Der Titel ALATRO im Home Bildschirm besteht aus sechs Karten (`src/ui/TitleCards.ts`, Zahlen in `src/data/homeTitle.ts`): Hinwerfen beim Öffnen, Anheben beim Berühren, Umdrehen per Tipp. Die Buchstaben stehen in der eigenen Schrift `Alatro Karte` (`tools/titlefont.py`, nur A L T R O). Auf dem iPad prüfen: Tippgefühl der Karten, Abstand zum Untertitel. Siehe `AUDIT.md` O86.

## Version 0.8.0: Pixel Art für Karten, Jokers, Consumables und Packs

Neues Kartendesign (Details und offene Punkte O88 bis O92 in `AUDIT.md`). Karten sind Pixel Raster im Code: Daten in `src/data/cardArt/`, Renderer ohne DOM in `src/ui/cardArt/`, `CardView` zeigt sie als Sprite mit nearest Skalierung. Zwei Paletten (Standard, Hoher Kontrast), Wahl in den Optionen, gespeichert in `settings.cardPalette` (keine Save Migration).

* **Karten ändern:** Pips und Symbole in `cardGlyphs.ts`, Figuren in `courtSprites.ts` (zwölf Einträge in `FIGURES`: Hut und Körper als halbe Zeilen im Entwurfsraster, dazu Gegenstand, Hautton und Gesichtsart), feine Gesichter in `faceSprites.ts`. Die Karte ist 82 mal 114 Pixel groß und wird mit 1,5 dargestellt, Farben in `cardPalettes.ts`. Vorschau neu erzeugen: `node tools/cardPreview.cjs` (Playwright nötig), Ergebnis in `preview/`.
* **Weitere Grafiken:** Jokers (`src/ui/jokerSprites*.ts`, `docs/joker-art.md`), Consumables und Packs (`src/ui/consumable*.ts`, `src/ui/packArt*.ts`, `src/ui/consumableTray.ts`, Zahlen in `src/data/consumableArt.ts`, `packArt.ts`, `voucherArt.ts`, `artFx.ts`, Notizen in `docs/consumable-pack-art.md`). Vorschau Bilder liegen in `preview/`.
* **Als Nächstes:** Auf dem iPad prüfen: Lesbarkeit von Rang und Farbe bei dreifacher Vergrößerung, Schärfe der Karten im Hand Fächer (leichte Drehung, Skalierung 1,5).

## Version 0.6.0: Sternenatlas, Siegel, Rückschau

Grundlage ist der Bericht `docs/HOOK_REPORT.md` (Recherche, Vergleich, 14 Vorschläge). Was umgesetzt wurde und die Entscheidungen: `AUDIT.md`, Abschnitt "Sternenatlas, Siegel und Rückschau" und O79 bis O84.

| Thema | Wo |
|---|---|
| Atlas mit Fortschritt, Hinweisen, Neu Markern | `src/collection.ts`, `src/ui/CollectionView.ts`, Knopf in `src/ui/HomeView.ts`, Toast `Game.announceDiscoveries` |
| Siegel am Deck | `src/profile.ts` (`winsByDeckStake`, `deckSeal`, `nextSealGoal`), Anzeige in `Game.showRunSetup` |
| Rückschau, Sofort nochmal | `src/report.ts` (rein), `src/data/report.ts` (Zahlen), `Game.showGameOver`, `Game.runSummary` |
| Juice | Ziel erreicht und Überschuss in `Game.play` und `Game.showRoundWon`, Fanfare und `sfx.goal` in `src/ui/audio.ts`, Tippen beschleunigt über `tapBoost` in `src/settings.ts` |

* **Live stellen:** Der Deploy (GitHub Pages) läuft nur durch, wenn der Commit auf dem Branch `claude/funny-brahmagupta-ic0bpe` liegt. Ein Push nur auf `main` scheiterte beim Schritt "deploy" (Version 0.6.0, Lauf 21), derselbe Commit auf dem Deploy Branch ging durch (Lauf 22). Vermutlich erlaubt die Umgebung `github-pages` nur diesen Branch, die Einstellung selbst wurde nicht eingesehen. Vorgehen: Tests und Build lokal, Commit auf dem Arbeitsbranch, dann Fast Forward des Deploy Branches (`git push origin HEAD:claude/funny-brahmagupta-ic0bpe`), danach den Lauf unter Actions prüfen.
* **Als Nächstes:** Auf dem iPad prüfen: Tippgefühl von Sofort nochmal, ob der Tipp Schub stört (Faktor `TAP_BOOST`), Lesbarkeit der Atlas Hinweise. Danach Bildrate messen und erst dann Partikel (V8) bauen.
* **Offene Entscheidungen aus dem Bericht (Abschnitt 7):** Soll es Gating von Inhalten geben (V5)? Export und Import des Spielstands? Kurzlauf (V11)? Challenge Runs (V10)? Hochformat Layout (O68)?
* **Nicht umgesetzt:** V5, V10 bis V14 aus dem Bericht.

## Version 0.5.0: Erfolge, Einführung, Schwierigkeit

Einzelheiten und Entscheidungen: `AUDIT.md`, Abschnitt "Erfolge, Einführung und Schwierigkeit" und O71 bis O78.

| Thema | Wo |
|---|---|
| Erfolge (Daten, 61 Stück) | `src/data/achievements.ts`, Auswertung `src/achievements.ts`, Ansicht `src/ui/AchievementsView.ts` |
| Profil und Statistik über Runs | `src/profile.ts` (`observeRun` idempotent, Speicherort `alatro.profile.v1`), Anbindung in `Game.persist` und `Game.trackProgress` |
| Einführungsrunde | Szenario `src/data/tutorialRun.ts` und `src/core/tutorialRun.ts`, Schritte `src/data/guide.ts`, Zustandsautomat `src/core/tutorialFlow.ts`, Oberfläche `src/ui/Guide.ts`, Einbau in `Game.ts` (`startGuide`, `exitGuide`, `updateGuide`, `guardGuide`) |
| Schwierigkeit | `src/data/stakes.ts` (Morgenrot, `stakeChain`), `src/data/difficulty.ts` (20 Stufen), `createRun({ level })` in `src/core/game.ts`, Run Setup in `Game.showRunSetup` |
| Tageslauf | `src/data/daily.ts`, Ansicht `Game.showDaily`, Verlauf im Profil |
| Spielstand | `SAVE_VERSION` 5, Migration in `src/save.ts` |

* **Neue Schritte der Einführung anlegen:** Eintrag in `GUIDE_STEPS` (Text, Ereignis auf das gewartet wird, Ziel für den Zeiger), das Ziel in `Game.guideTargets` einem Objekt zuordnen, Ereignisse mit `notifyGuide` melden. Der Test `src/tutorial.test.ts` läuft alle Schritte durch.
* **Neuen Erfolg anlegen:** Eintrag in `ACHIEVEMENTS` mit vorhandener Bedingungsart. Eine neue Bedingungsart braucht einen Zweig in `condProgress` und `condMet` in `src/achievements.ts`.
* **Als Nächstes:** Auf dem iPad prüfen: Lesbarkeit und Tippgefühl von Hinweisfeld und Zeiger der Einführung, Schwierigkeit der Stufen 4 bis 12 im echten Spiel (Zahlen in `data/difficulty.ts`), Erfolgs Banner im laufenden Spiel. Ideen: Erfolge mit Belohnung (freischaltbare Decks), Tageslauf Rangliste lokal, weitere Tageswandlungen, Joker Katalog erweitern.

## Version 0.6.1: Vibration

`src/ui/haptics.ts` (`haptics.tap()`, `select`, `total(boom)`, `impact(shake)` usw.), Muster in `HAPTICS` in `src/data/juice.ts`, Rechnung in `juiceMath.ts` (`impactMs`, `totalPattern`), Option "Vibration" in den Optionen. Aufrufe stehen neben den `sfx` Aufrufen in `Game.ts`, `widgets.ts` (Button) und `ShopView.ts`. Einzelheiten und Grenzen auf iOS: `AUDIT.md` O85.

* **Als Nächstes:** Auf einem Android Handy und einem iPhone spüren, ob Stärke und Dauer der Muster passen (Zahlen in `HAPTICS`), vor allem die leichten Zählschritte.

## Review 0.4.0: was neu ist und wie man testet

* **Zufallslauf Test:** `src/core/fuzz.test.ts` spielt Runs mit allen Decks per Bot (beste Hand per Engine Vorschau, Shop, Packs, Consumables), prüft Invarianten und wiederholt jeden Run mit Speichern und Laden in jedem Schritt. Läuft in `npm test` (etwa 5 Sekunden). Neue Mechaniken, die Zustand verändern, sollten hier keine Invariante brechen.
* **Browser Tests per Playwright:** `main.ts` setzt `globalThis.__PIXI_APP__`. Ein Skript kann über `__PIXI_APP__.stage` alle Objekte mit `eventMode` `static` durchlaufen (Text und `getBounds()`), daraus Tippkoordinaten bilden und Szenen prüfen. Szenen lassen sich im Dev Server per `await import('/src/core/game.ts')` in der Seite erzeugen, als JSON nach `localStorage['alatro.run.v1']` schreiben, neu laden und Fortsetzen antippen (siehe Abschnitt Browser Test). Der Vite Dev Server lädt bei Dateiänderungen neu: für lange Bot Läufe eine Kopie des Projekts mit eigenem Port nutzen. Headless läuft WebGL per Software, ein Bildschirmfoto braucht dann Sekunden, die Bildrate sagt nichts über das iPad.
* **Neue UI Bausteine:** Shop Vorschau in der Seitenleiste (`buildNextPanel`, `updateNextPanel` in `Game.ts`), Einführungshinweise (`hintSeen`, `markHintSeen` in `settings.ts`), sichere Ränder (`Insets` in `viewport.ts`), Game Over Rückschau (`showGameOver`).
* **Werte im Blick:** Hehler kostet 7 und zahlt 8 (O62). Palette der Stimmungen in `data/juice.ts` (`MOODS`), Sternfarben im Shader in `Background.ts`.
* **Als Nächstes:** Auf dem iPad prüfen: Klang nach Appwechsel (Audio Kontext), Statusleiste und Home Indikator in der installierten PWA (Insets), Bildrate mit FPS Anzeige, Tippgefühl der größeren Knöpfe. Entscheidung offen: Hochformat Layout (O68). Ideen: weitere Einführungshinweise für Shop und Joker Reihenfolge, leere Tischmitte füllen, Joker Karten im Tisch Fach etwas größer zeichnen.

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
| `src/ui/` Lesbarkeit | `richText.ts` und `richTokens.ts` (farbige Beschreibungen, `richText(text, breite, {size, align, theme})`), `jokerInfo.ts` (Wirkungs Marken `effectTags`, Auslöser `triggerLabel`). Neue Schlüsselwörter in `KEYWORD_PATTERNS` und `COLORS` ergänzen |
| `src/ui/` weitere | `ShopView.ts`, `CardView.ts`, `JokerView.ts`, `ConsumableView.ts`, `RunInfoView.ts`, `CollectionView.ts`, `Background.ts` (Shader), `widgets.ts` (`tabBar`, `wrapText`), `theme.ts` |
| `tests/spec/` | Testfälle aus Briefing 10.3 mit Adapter `helpers.ts` (neutrale Test Jokers) |
| `src/core/*.test.ts` | Unit Tests (`core`, `m1`, `m2`, `m4`, `m4info`) |

## Joker Katalog (M3, erledigt)

150 Jokers (79 in `src/data/jokers.ts`, 71 in `src/data/jokersMore.ts`), gruppiert nach Mechanik, Tests in `src/core/m3.test.ts` und `src/core/jokersMore.test.ts`. Einzelheiten und Entscheidungen stehen in `AUDIT.md` (Abschnitt M3, O43 bis O50).

Einen neuen Joker anlegen:

* Eintrag in `JOKER_DEFS_BASE` (`jokers.ts`) oder `JOKER_DEFS_MORE` (`jokersMore.ts`) mit eindeutiger ID (nie ändern), `config` für alle Zahlen und `description` mit Platzhaltern wie `{mult}`. Skalierende Jokers legen ihre Startwerte in `init(cfg)` ab (veränderliche Werte stehen in `self.vars`, config bleibt fest, die Namen dürfen sich nicht überschneiden).
* Phasen für `calculate(ctx, self, cfg)`: Scoring `before`, `scored`, `held`, `retrigger`, `main`, `after`, `other`. Außerhalb des Scorings `discard`, `blindSelected`, `roundEnd` (ohne Zufall, die Anzeige rechnet vorab), `sell`. Rückgabe ist ein `Effect` (chips, mult, xMult, money, retrigger, consumables, destroySelf, cardChips, enhanceFirst).
* Dauerhafte Wirkungen über `passive(cfg)` (Hands, Discards, Hand Size, Slots, Zinsdeckel, Shop Slots, gratis Rerolls, Rabatt, Wahrscheinlichkeit), Erkennungsregeln über `rules`, Kopien über `copies`, Rettung über `rescue` (mit `config.fraction`), Spawn Bedingung über `minAnte`.
* `copyCompat: false` für alles, was sich nicht sinnvoll kopieren lässt.
* Face Card Prüfungen immer über `ctx.isFace(card)`, damit der Maskenball wirkt. Ranglose Karten (Obsidian) lösen Rang Bedingungen nicht aus.
* Tests: Gruppen Tests ergänzen, der Katalog Rauchtest und die Beschreibungs Prüfung laufen automatisch über alle Jokers.

Offen und möglich: eigene Joker Grafiken (M5, bisher Farbkreis mit Initiale), Sticker (gibt es nicht), weitere Jokers.

## Tempo, Anleitung und Patch Notes (Version 0.2.0)

* **Tempo:** Seit 0.11.4 nur in den Optionen (Bereich Spiel, Stufen aus `SPEED_STEPS` in `src/data/juice.ts`, 1x bis 10x), der Tempo Knopf am Tisch ist entfernt. Das Tempo selbst wirkt wie in M6 beschrieben in `tween` und `wait`.
* **Patch Notes:** `src/data/patchnotes.ts`. Bei jedem Release oben einen Eintrag ergänzen und `version` in `package.json` und `package-lock.json` anpassen, der Test in `src/patchnotes.test.ts` prüft das. Die Notes erscheinen beim Start einmal pro Version, danach über Neuigkeiten.
* **Anleitung:** `src/data/tutorial.ts`, Ansicht in `src/ui/InfoViews.ts` (zusammen mit den Patch Notes). Bei Regeländerungen die Texte mitpflegen.

## Klarer Grafikstil

Die UI wurde auf einen flachen, scharfen Stil umgestellt (Einzelheiten in `AUDIT.md`, Abschnitt "Klarer Grafikstil"). Neue Panels und Knöpfe immer über `panel()` und `Button` bauen, Farben und Konturen aus `C` und `STYLE` in `ui/theme.ts`, keine halbtransparenten Weichzeichner Flächen. Der Look ist eine Mischung aus flach und scharf, weichem Leuchten im Hintergrund und dezentem Hologramm (CRT Shader ohne Wölbung, `data/juice.ts` `CRT`). Beschreibungstexte mit Wortumbruch nutzen `FONT_BODY`. Die Schrift ist eine eigene Pixel Schrift (`tools/pixelfont.py` erzeugt `src/assets/alatro-pixel.ttf`, geladen in `main.ts` vor dem ersten Text, `FONT` in `ui/theme.ts`). Neue Sonderzeichen in der UI zuerst in `tools/pixelfont.py` als Glyphe zeichnen (`pip install fonttools shapely`, `python3 tools/pixelfont.py`). Die Raster werden beim Erzeugen weich gezeichnet (siehe AUDIT.md, Weiche Schrift). **Als Nächstes:** Shop, Packs und Boss Stimmungen auf dem iPad ansehen und Feinschliff nachziehen. **Neuer Shop (0.3.2):** `ShopView.ts` mit Fächern, Preisfahnen, Detail Karte beim Antippen und Leuchtschild `buildShopSign` (Einzelheiten in `AUDIT.md`).

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
