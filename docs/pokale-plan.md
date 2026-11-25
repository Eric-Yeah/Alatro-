# Plan: Pokalsystem (Pokalpfad und Wunderkammer)

Stand: 25.11.2026. Verbindlich für alle, die daran arbeiten. Typen: `src/data/trophyTypes.ts`, Zustand: `src/trophyState.ts` (Feld `profile.trophies`).

## Idee in einem Absatz

Jede gespielte Runde (Blind) bringt **Pokale**, und zwar umso mehr, je höher die Ante ist. Die Pokale sammeln sich auf einem **Pokalpfad** aus 8 **Ligen** mit 48 Meilensteinen. Jeder Meilenstein schaltet einen Kosmetik Gegenstand frei, den man in der **Wunderkammer** ausrüstet. Dazu hat jedes der 7 Decks einen eigenen **Deck Pfad** mit 3 Stufen. Pokale sinken nie, Kosmetik ändert nie das Spiel. Der Pfad ist ein Dauerziel neben dem Atlas und den Erfolgen.

Begriffe: Pokale (Trophies), Liga, Pokalpfad, Wunderkammer (Kosmetik Bildschirm). Spielbegriffe bleiben Englisch (Ante, Blind, Round, Stake, Deck, Hands).

## Pokale verdienen

Verbucht wird über `observeTrophies(profile, run)` nach jedem Speichern des Runs (wie `observeRun`): rein, idempotent, rechnet nur nach, was noch nicht verbucht ist. Alle Zahlen stehen in `src/data/trophies.ts`, keine Magic Numbers im Code.

| Ereignis | Wirkung |
|---|---|
| Runde gewonnen (Phase `roundWon`) | Basis nach Blind (Small 3, Big 4, Boss 6) mal Ante Faktor |
| Ante Faktor | `[1, 1.5, 2, 2.75, 3.75, 5, 6.5, 8]` für Ante 1 bis 8, im Endless je weitere Ante +1,5 |
| Runde verloren (Run endet) | Trost: 25 Prozent der Basis dieser Runde (mindestens 1). "Pro Runde gespielt" zählt also auch bei Niederlage |
| Reserve | +10 Prozent der Rundenbasis je übrig gebliebener Hand, höchstens +30 Prozent |
| Überschuss | +20 Prozent, wenn der Rundenpunktestand mindestens das Doppelte des Ziels ist (`OVERKILL`) |
| Stake Zuschlag | Faktor nach Stake der Leiter und Stufe der skalierenden Schwierigkeit (`1 + 0,06 mal Stufe`), steht als eigene Zeile "Stake Bonus" |
| Siegesserie | Runs in Folge mit mindestens Ante 4 zählen die Serie. Faktor beim Start des Runs festgehalten, +4 Prozent je Serie, höchstens +20 Prozent. Ein Run darunter setzt die Serie auf 0 |
| Tageslauf | +25 Prozent auf alle Pokale des Runs, dazu einmal je Tag eine Prämie |
| Run gewonnen (Ante 8 besiegt) | Siegbonus 120 (mit Stake Zuschlag) |
| Premiere | Erster Sieg mit einem Deck: +150, einmal je Deck |
| Neuer Rekord Ante | +8 je Ante über der bisher höchsten Ante des Spielers, einmal je Ante |
| Einführungsrunde | zählt nichts (wird nicht gespeichert) |
| Abgebrochen | Wird ein neuer Run begonnen, ohne den alten zu beenden, wird der alte ohne Ende Bonus abgeschlossen (`end: 'abandoned'`) |

Richtwerte (Ante Faktor mal 13 Basis je Ante): ein Run bis Ante 3 etwa 60 bis 80, bis Ante 5 etwa 200, ein Sieg auf Dämmerung etwa 550 bis 650. Die Rechnung steht als reine Funktion `roundTrophies(...)` in `src/trophies.ts` und wird mit einer Simulation in den Tests kalibriert.

Verbucht wird pro Run in `profile.trophies.run` (siehe `TrophyRunSync`): bezahlte Runden, Zeilen der Abrechnung, Serienfaktor, Siegbonus, Rekord Stand. Jede Zeile ist eine `TrophyLine` (Art, Menge, Bezug). Die Oberfläche macht daraus Text.

## Der Pokalpfad

* **8 Ligen** (Namen im Thema, Schwellen werden kalibriert): Funkenlehrling, Retortengehilfe, Kupferadept, Silbermagister, Mondastronom, Sternendeuter, Himmelsmeister, Weltenkartograf. Jede Liga hat eine Farbe und einen Satz Flair Text. Die erste beginnt bei 0.
* **48 Meilensteine** (`RoadEntry`), 6 je Liga. Eintrag 1 jeder Liga gibt den Titel der Liga. Der letzte Eintrag jeder Liga ist ihr bestes Stück (Rarität steigt mit der Liga, Legendary ab Liga 6, der letzte Eintrag des ganzen Pfads ist die Krone).
* **Dichte:** früh alle 40 bis 80 Pokale ein Eintrag, später weiter auseinander. Gesamtweg etwa 120 bis 160 durchschnittliche Runs, Endschwelle 17100 Pokale (gemessen: 134 bis 149 Runs für den ganzen Pfad, die ursprünglich geschätzten 9000 hätten nur etwa 80 Runs ergeben).
* **Abholen:** Ein erreichter Eintrag ist "bereit" und wird von Hand abgeholt (Zeremonie, nicht automatisch). "Alle abholen" gibt es auch. Abgeholt heißt besitzen (`owned`), ausrüsten ist ein eigener Schritt.
* **Liga Aufstieg:** Fanfare und Banner, sobald die Gesamtpokale eine neue Liga erreichen (`leagueSeen` merkt, was gezeigt wurde).
* **Deck Pfade** (`DeckStage`): je Deck 3 Stufen bei 60, 250 und 700 Pokalen mit diesem Deck. Stufe 1: Titel "Lehrling des X". Stufe 2: Kartenrücken mit dem Wappen des Decks (rare). Stufe 3: Titel "Meister des X" (epic). Pokale zählen immer für `total` und für das gespielte Deck.
* **Serie:** Sie ist Teil des Verdienstes, kein eigener Pfad. Die Wunderkammer und der Pfad zeigen die aktuelle Serie.

## Kosmetik (alle IDs sind verbindlich)

Fünf Kategorien. Standard ist je Kategorie immer vorhanden und gehört nicht zum Pfad: Rücken folgt der Deckfarbe, Paletten Standard und Hoher Kontrast, Himmel Standard, Funken Standard, kein Titel (dann steht der Rang aus den Erfolgen da).

**Kartenrücken (`back`, 17):** Muster aus Code erzeugt (Pixel Raster, wie die Karten), je Rücken 2 bis 4 Farben, kein Bild Asset.

| Id | Name | Rarität | Motiv |
|---|---|---|---|
| back_sternenstaub | Sternenstaub | common | verstreute Pixel Sterne auf Indigo |
| back_kupferraute | Kupferraute | common | Rauten Gitter in Kupfer |
| back_mondphasen | Mondphasen | rare | Reihe von Mondphasen auf Nachtblau |
| back_retorte | Retortenglas | rare | Kolben und aufsteigende Blasen in Türkis |
| back_astrolabium | Astrolabium | rare | Ringe mit Zeigern und Gradstrichen |
| back_tierkreis | Tierkreis | epic | Ring aus zwölf Zeichen um einen Stern |
| back_nebelwirbel | Nebelwirbel | epic | Spirale in Violett und Rosa |
| back_goldadern | Goldadern | epic | verzweigte Goldadern auf Schwarz |
| back_sonnenfinsternis | Sonnenfinsternis | legendary | dunkle Scheibe mit Korona |
| back_kometenbahn | Kometenbahn | legendary | diagonale Schweife in Weiß und Blau |
| back_deck_nachthimmel | Siegel des Nachthimmels | rare | Wappen des Decks |
| back_deck_glut | Siegel der Glut | rare | Wappen des Decks |
| back_deck_tiefsee | Siegel der Tiefsee | rare | Wappen des Decks |
| back_deck_waage | Siegel der Waage | rare | Wappen des Decks |
| back_deck_alchemist | Siegel des Alchemisten | rare | Wappen des Decks |
| back_deck_sternenkind | Siegel des Sternenkinds | rare | Wappen des Decks |
| back_deck_halbmond | Siegel des Halbmonds | rare | Wappen des Decks |

**Kartenpaletten (`palette`, 4):** zusätzliche Farbwelten der Kartenfarben, ausgerüstet über `settings.cardPalette` (eine Wahrheit, siehe unten).

| Id | Name | Rarität |
|---|---|---|
| pal_bernstein | Bernstein | rare |
| pal_tintenmeer | Tintenmeer | rare |
| pal_mondsilber | Mondsilber | epic |
| pal_glutkern | Glutkern | epic |

**Himmel (`sky`, 8):** färbt den Hintergrund aller Stimmungen (Menü, Small, Big, Boss, Shop) um. Boss Stimmung bleibt erkennbar.

| Id | Name | Rarität |
|---|---|---|
| sky_smaragd | Smaragdnebel | common |
| sky_kupfer | Kupferdämmerung | common |
| sky_eisfeld | Eisfeld | rare |
| sky_blutmond | Blutmond | rare |
| sky_polarlicht | Polarlichtnacht | epic |
| sky_goldstunde | Goldene Stunde | epic |
| sky_leere | Violette Leere | epic |
| sky_sonnenwende | Sonnenwende | legendary (Farbton wandert langsam) |

**Funken (`spark`, 6):** Farben der Zeigerspur, der Tipp Funken und des Konfettis der Grafikstufe Supernova. In Sparsam und Voll wirken sie nicht (die Wunderkammer sagt das).

| Id | Name | Rarität |
|---|---|---|
| spark_gold | Goldfunken | common |
| spark_eis | Eiskristalle | common |
| spark_glut | Glutregen | rare |
| spark_smaragd | Smaragdglanz | rare |
| spark_aether | Ätherschweif | epic (mehrfarbig) |
| spark_prisma | Prisma | legendary (Farben wechseln im Spektrum) |

**Titel (`title`, 34):** reiner Text, erscheint im Home Bildschirm unter dem Namen des Rangs, in der Rückschau und im Pfad. 8 Liga Titel plus 12 freie Titel am Pfad, 14 Deck Titel.

* Liga Titel (Id `title_liga_1` bis `title_liga_8`): Name wie die Liga.
* Freie Titel (Id `title_*`, Rarität steigt mit der Liga, Name im Thema, kurz, höchstens 24 Zeichen): zum Beispiel Funkenhüter, Kolbenschwenker, Goldkocher, Nachtwächter, Sternzähler, Kometenjäger, Mondflüsterer, Glasbläser der Sphären, Schattenwäger, Hüter der Zeiger, Sonnenzähmer, Letzter Alchemist.
* Deck Titel: `title_deck_<deck>_1` ("Lehrling des Glutdecks" und so weiter) und `title_deck_<deck>_3` ("Meister ..."), Deck Namen aus `src/data/decks.ts`.

Verteilung am Hauptpfad (48): 10 Rücken, 4 Paletten, 8 Himmel, 6 Funken, 20 Titel (8 Liga Titel plus 12 freie). Rarität nach Liga: Liga 1 und 2 vor allem common, 3 und 4 rare, 5 und 6 epic, 7 und 8 epic und legendary. Die 7 Deck Rücken und 14 Deck Titel kommen nur über die Deck Pfade.

## Ausrüsten und Anzeige

* `profile.trophies.equipped[cat]` hält die Wahl, `''` ist Standard. **Paletten sind die Ausnahme:** die Wunderkammer schreibt `settings.cardPalette` (eine Wahrheit, weil die Optionen die Auswahl schon kennen). Die Optionen listen nur Paletten, die besessen werden.
* **Rücken:** `cardBack()` in `src/ui/CardView.ts` und alle Aufrufer (Stapel, Home Fächer, Ladekarte, Run Setup) nutzen den ausgerüsteten Rücken, sonst die Deckfarbe.
* **Himmel:** `Background` löst die Stimmung über eine Funktion auf, die den ausgerüsteten Himmel einmischt.
* **Funken:** `POINTER.trailColors` und die Konfetti und Funken Farben der Supernova Fassade lesen die ausgerüstete Palette.
* **Titel:** Home Bildschirm (Rang Zeile), Rückschau, Pfad Ansicht.

## Oberfläche

* **Home:** Knopf "Pokalpfad" mit Gesamtpokalen, Liga Farbe und einem Marker, wenn Einträge abholbereit sind. Knopf "Wunderkammer". Platz im bestehenden Layout schaffen.
* **Pokalpfad Ansicht:** Kopf mit Liga, Fortschrittsbalken zur nächsten Liga, Serie, Gesamtpokale. Darunter der waagerecht scrollbare Pfad (Knoten je Eintrag, Ligen als farbige Abschnitte, abgeholt, bereit, gesperrt). Zweiter Reiter "Decks" mit den 7 Deck Pfaden. Dritter Reiter "Verlauf" mit den letzten Runs und ihren Pokalen. Tippen auf einen Knoten zeigt die Belohnung mit Vorschau, "Abholen" und danach "Ausrüsten".
* **Wunderkammer Ansicht:** Reiter je Kategorie, Raster mit Seltenheit Rahmen, gesperrte Stücke mit Hinweis, wie man sie bekommt ("Pfad, Liga 3, 450 Pokale"). Vorschau je Kategorie (Karte mit Rücken, Beispielkarten der Palette, Farbleiste des Himmels, Funken Animation, Titel Text), Ausrüsten Knopf.
* **Im Spiel:** nach jeder gewonnenen Runde ein Toast "+N Pokale". Im Rundensieg Bild eine Zeile. Beim Run Ende (Verloren und Gewonnen) ein Block mit der Abrechnung (Zeilen), Gesamtpokalen, Liga Aufstieg, neuen abholbereiten Einträgen und Knopf "Pokalpfad". Liga Aufstieg als Banner (wie der Erfolgs Banner).
* Alle Fenster mit `VIEW_BLEED` (Vollbild Flächen), Zahlen in `src/data/trophyLayout.ts`, Texte mit `t()` und englischem Eintrag.

## Technischer Vertrag (Signaturen)

Rein, ohne DOM, in `src/trophies.ts` (Logik) und `src/data/trophies.ts`, `src/data/trophyRoad.ts` (Zahlen, Pfad):

```ts
// Verdienst
export function roundTrophies(input: { ante: number; blind: 'small'|'big'|'boss'; won: boolean; handsLeft: number; score: number; target: number; stakeId: string; difficulty: number|null; daily: boolean; streakFactor: number }): { lines: TrophyLine[]; total: number };
export interface TrophyGain { lines: TrophyLine[]; amount: number; total: number; leagueFrom: number; leagueTo: number; newlyReady: string[]; runEnded: boolean }
export function observeTrophies(p: Profile, run: RunState, now?: number): TrophyGain | null; // null: nichts Neues. Ändert p.trophies. Danach saveProfile().

// Liga und Pfad
export function leagueIndexOf(total: number): number;
export function leagueProgress(total: number): { index: number; def: LeagueDef; next: LeagueDef | null; into: number; span: number };
export type RoadState = 'locked' | 'ready' | 'claimed';
export function roadStatus(p: Profile): { entry: RoadEntry; state: RoadState }[];
export function deckStatus(p: Profile, deckId: string): { stage: DeckStage; state: RoadState }[];
export function claimableCount(p: Profile): number;           // Hauptpfad plus Deck Pfade
export function claimEntry(p: Profile, entryId: string, now?: number): string | null; // gibt die Kosmetik Id zurück oder null
export function claimAll(p: Profile, now?: number): string[];

// Besitz und Ausrüstung
export function isOwned(p: Profile, cosmeticId: string): boolean;
export function equippedId(p: Profile, cat: CosmeticCategory): string;
export function equip(p: Profile, cat: CosmeticCategory, id: string, now?: number): boolean; // false, wenn nicht besessen
export function activeTitle(p: Profile): string | null;       // Name des ausgerüsteten Titels
export function unlockHint(cosmeticId: string): { source: 'road'|'deck'; label: string; threshold: number } | null;

// Zusammenführen (Sync)
export function mergeTrophyState(a: TrophyState, b: TrophyState): TrophyState;
```

Katalog in `src/data/cosmetics.ts`: `COSMETICS: readonly Cosmetic[]` (jeder Eintrag erweitert `CosmeticBase` um `params` je Kategorie), `getCosmetic(id)`, `cosmeticsOf(cat)`. Anwendung in `src/ui/cosmeticFx.ts`:

```ts
export function activeBack(): { id: string; ... } | null;   // aus getProfile().trophies.equipped
export function applySkyToMood(mood: MoodDef, bossTint?: ...): MoodDef;
export function sparkColors(): readonly number[];            // ausgerüstete Funkenfarben, sonst Standard
```

Ansichten: `buildTrophyRoad(box, close)` mit `TROPHY_W` und `TROPHY_H` in `src/ui/TrophyView.ts`, `buildWardrobe(box, close)` mit `WARDROBE_W` und `WARDROBE_H` in `src/ui/WardrobeView.ts`, genau wie `buildAchievements`.

## Sync

`mergeProfiles` (`src/syncBundle.ts`) führt `trophies` mit `mergeTrophyState` zusammen: `total` und `byDeck` Maximum, `claimed` und `owned` Vereinigung (früherer Zeitpunkt), `equipped` vom Gerät mit dem späteren `equippedAt`, `streak` aus dem Stand mit mehr Gesamtpokalen, `bestStreak` Maximum, `deckFirstWin` und `dailyPaid` Vereinigung, `history` nach Run Id vereinigt, `run` aus dem Stand mit mehr Hands (wie `sync`). Bekannte Grenze: Spielen zwei Geräte gleichzeitig verschiedene Runs, gilt das Maximum, nicht die Summe (wie bei den anderen Zählern).

## Aufgabenteilung (Agenten)

Gemeinsame Regeln für alle: `CLAUDE.md` beachten (keine Gedankenstriche in Texten, Zahlen in `src/data/`, Engine ohne DOM, Texte mit `t()` und Eintrag in einer eigenen Datei unter `src/i18n/en/`, Inhalte aus `src/data/` mit Patch in `src/i18n/patch/`). `src/core/` bleibt unberührt, `SAVE_VERSION` bleibt (das Pokalsystem liegt im Profil, nicht im Run). Keine Commits, keine Änderungen an `AUDIT.md`, `HANDOFF.md`, `patchnotes.ts`, `package.json` (das macht die Leitung). Offene Punkte und Entscheidungen im Abschlussbericht nennen.

| Agent | Besitzt | Abhängigkeit |
|---|---|---|
| A Kern | `src/trophies.ts`, `src/data/trophies.ts`, `src/data/trophyRoad.ts`, Sync Merge in `src/syncBundle.ts`, `src/trophies.test.ts` | keine (Katalog IDs aus diesem Plan) |
| B Kosmetik | `src/data/cosmetics.ts`, `src/ui/cosmeticFx.ts`, Rücken Renderer in `src/ui/cardArt/`, neue Paletten in `src/data/cardArt/cardPalettes.ts`, Einbau in `CardView`, `Background`, `pointerFx`, `spektakel`, `settings.ts`, Optionen (nur besessene Paletten), Tests, Vorschau Bilder | keine (liest `profile.trophies.equipped`) |
| C Pokalpfad Oberfläche | `src/ui/TrophyView.ts`, `src/data/trophyLayout.ts`, `src/ui/Game.ts` und `src/ui/HomeView.ts` (Verdrahtung beider Ansichten, Toasts, Rückschau Block, Liga Banner) | A fertig, Namen der Wunderkammer aus diesem Plan |
| D Wunderkammer Oberfläche | `src/ui/WardrobeView.ts`, `src/data/wardrobeLayout.ts` | A und B fertig |
| Leitung | Plan, Vertrag, Integration, Versionssprung, Doku, Gesamttests | nach allen |

Reihenfolge: Welle 1 A und B parallel, Welle 2 C und D parallel (C besitzt als Einziger `Game.ts` und `HomeView.ts`), dann Integration und Abschluss.

## Tests (Ziel)

* Verdienst: steigt mit der Ante, Boss mehr als Small, Verlustrunde 25 Prozent, Zuschläge, Deckel, Stake Faktor, Serie, Tageslauf.
* Idempotenz: zweimal `observeTrophies` mit demselben Run ändert nichts, Reihenfolge der Schritte egal, Neuladen mitten im Run, Abbruch, Wiederaufnahme.
* Einmal Bonus: Sieg, Premiere, Rekord Ante, Tages Prämie.
* Pfad: Schwellen streng steigend, jede Belohnung existiert im Katalog und kommt genau einmal vor, Verteilung der Raritäten, Abholen nur wenn erreicht und nur einmal, Ausrüsten nur wenn besessen, Gesamtlänge in Runs (Simulation).
* Einlesen kaputter Daten, Merge (kommutativ bis auf Run Stand, keine Verluste).
* Kosmetik: Rücken Muster deterministisch und innerhalb des Rasters, alle Kategorien vollständig, Himmel Farben gültig, Funken Palette nie leer.
* i18n: `i18n.test.ts` und die Inhalts Tests bleiben grün.
