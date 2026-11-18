# Plan: Roguelike-Poker-Deckbuilder für das iPad

Privates Projekt, nur für das eigene iPad. Spielprinzip angelehnt an das Genre von
Balatro (Poker-Hände + Joker-Synergien + Roguelike-Runs), aber mit **eigenem Thema,
eigenen Namen, eigener Grafik und eigenen Karten/Effekten**, also keine Kopie von
Balatros Inhalten.

---

## 1. Wie Balatro aufgebaut ist (Analyse)

### 1.1 Die Spielschleife

```
Run starten (Deck + Schwierigkeit wählen)
  └─ Ante 1 … 8  (danach optional Endlos-Modus)
       ├─ Small Blind  ─┐
       ├─ Big Blind     ├─ jeweils: spielen ODER überspringen (→ Belohnungs-Tag)
       └─ Boss Blind   ─┘   (Boss kann nicht übersprungen werden, hat Sonderregel)
            nach jedem gewonnenen Blind: Abrechnung ($) → Shop
Verloren, wenn alle Hände verbraucht sind und die Zielpunktzahl nicht erreicht ist.
Gewonnen nach dem Boss von Ante 8.
```

### 1.2 Eine Runde (ein Blind)

- Standard-Deck mit 52 Karten, **8 Karten auf der Hand**.
- Pro Runde **4 Hände** (Spielen) und **3 Abwürfe** (Discards).
- Man wählt **1–5 Karten** aus und spielt sie oder wirft sie ab (dann wird nachgezogen).
- Ziel: in der Summe aller gespielten Hände die **Zielpunktzahl** des Blinds erreichen.

### 1.3 Punkteformel: der Kern des Spiels

```
Punkte = Chips × Mult
```

1. Die **Pokerhand** bestimmt Basis-Chips und Basis-Mult (z. B. Paar = 10 × 2,
   Flush = 35 × 4). Hände haben **Level**, die man durch Verbrauchskarten erhöht.
2. Jede **gewertete Karte** (nur die Karten, die zur Hand gehören) addiert ihren
   Kartenwert in Chips (2–10 = Augenzahl, Bube/Dame/König = 10, Ass = 11) von links nach rechts.
   Dabei lösen Karten-Verbesserungen und Joker-Effekte „wenn Karte gewertet“ aus.
3. Effekte von Karten, die **auf der Hand bleiben**, lösen aus.
4. Die **Joker** lösen von **links nach rechts** aus: `+Chips`, `+Mult`, dann `×Mult`.
   Weil die Reihenfolge zählt (+Mult vor ×Mult ist viel stärker), ist das Anordnen der
   Joker eine eigene strategische Ebene.

Das Spiel ist im Kern ein **Multiplikations-Puzzle**: additive Boni sind schwach,
multiplikative Boni (×Mult) und Wiederauslösungen (Retrigger) skalieren exponentiell.
Das ist der Grund, warum es sich so gut anfühlt, wenn die Zahlen explodieren.

### 1.4 Die Bausteine

| Baustein | Funktion |
|---|---|
| **Joker** (5 Plätze) | Passive Effekte, das Herz der Synergien. Seltenheiten: gewöhnlich/ungewöhnlich/selten/legendär. Manche skalieren über den Run hinweg. |
| **Verbrauchskarten** (2 Plätze) | 3 Sorten: Hand-Level erhöhen · einzelne Spielkarten verändern · starke, riskante Effekte |
| **Karten-Modifikatoren** | Verbesserungen (z. B. +Mult-Karte, Glaskarte), Editionen (Folie = +Chips, Holo = +Mult, Polychrom = ×Mult, Negativ = +1 Platz), Siegel (z. B. Retrigger, Geld) |
| **Shop** | 2 Kartenplätze, 1 Gutschein (permanentes Upgrade), 2 Booster-Packs, Reroll für Geld (wird teurer) |
| **Wirtschaft** | Belohnung pro Blind, +$1 pro übriger Hand, **Zinsen** ($1 pro $5, max. $5): Sparen vs. Ausgeben |
| **Boss Blinds** | Sonderregeln, z. B. „alle Herz-Karten sind wirkungslos“, „nur 1 Hand“, „Karten werden verdeckt gezogen“ |
| **Tags** | Belohnung für das Überspringen eines Blinds |
| **Decks & Stakes** | Start-Varianten und Schwierigkeitsstufen → Wiederspielwert |

### 1.5 Technik von Balatro

- Geschrieben von einer einzelnen Person in **Lua mit dem Framework LÖVE (Love2D)**.
- Pixel-Art + **Shader** für den typischen Look (CRT-Effekt, wabernder Hintergrund,
  Folien-/Holo-Glanz auf Karten).
- Sehr viel „Juice“: Karten wackeln, Zahlen ploppen, Sounds werden mit steigender
  Punktzahl höher. Ein großer Teil des Spielgefühls kommt nur aus Animation und Sound.

### 1.6 Wichtige Zahlen als Ausgangspunkt fürs Balancing

Basiswerte der Hände (Chips × Mult), Level-Up in Klammern:

| Hand | Basis | pro Level |
|---|---|---|
| Höchste Karte | 5 × 1 | +10 / +1 |
| Paar | 10 × 2 | +15 / +1 |
| Zwei Paare | 20 × 2 | +20 / +1 |
| Drilling | 30 × 3 | +20 / +2 |
| Straße | 30 × 4 | +30 / +3 |
| Flush | 35 × 4 | +15 / +2 |
| Full House | 40 × 4 | +25 / +2 |
| Vierling | 60 × 7 | +30 / +3 |
| Straight Flush | 100 × 8 | +40 / +4 |

Zielpunktzahl (Small Blind) pro Ante etwa: 300 · 800 · 2.000 · 5.000 · 11.000 · 20.000 · 35.000 · 50.000.
Big Blind = ×1,5, Boss = ×2. Diese Werte nehmen wir nur als Startpunkt und tunen sie selbst.

---

## 2. Technologie-Entscheidung fürs iPad

| Option | Vorteile | Nachteile |
|---|---|---|
| **Web-App / PWA (TypeScript + PixiJS)** ⭐ | Kein Mac nötig, kein App Store, kein Ablaufen der App. Als Icon auf den Home-Bildschirm, läuft offline im Vollbild. Entwicklung im Browser, sofort testbar. | Keine Vibration (Safari), etwas weniger Performance als nativ (für ein Kartenspiel egal) |
| Swift + SpriteKit (nativ) | Beste Integration, Haptik | Braucht Mac + Xcode. Mit kostenloser Apple-ID läuft die App nur **7 Tage**, danach neu installieren. Sonst 99 $/Jahr. |
| Godot / LÖVE | Echte Game-Engines | iOS-Export braucht trotzdem Mac + Xcode + Signierung |

**Empfehlung: PWA mit TypeScript + Vite + PixiJS v8.**

- **TypeScript**: Typen helfen enorm bei vielen Jokern/Effekten.
- **PixiJS**: schnelles 2D-WebGL-Rendering, unterstützt eigene Shader (Holo-/Folien-Effekt, CRT-Look).
- **Vite**: Dev-Server, auch vom iPad im gleichen WLAN aufrufbar.
- **Vitest**: Tests für die Spiellogik (Hand-Erkennung, Punkteberechnung).
- **vite-plugin-pwa**: Manifest + Service Worker → offline + Home-Bildschirm.
- **Hosting**: GitHub Pages (Repo öffentlich oder GitHub Pro) oder kostenlos über
  Cloudflare Pages / Netlify aus dem privaten Repo. Einmal in Safari öffnen →
  „Zum Home-Bildschirm“ → fertig.

---

## 3. Architektur

Die wichtigste Regel: **Spiellogik und Darstellung strikt trennen.** Die Logik ist
reines TypeScript ohne Grafik, deterministisch (Seed-basiert) und voll testbar.

```
src/
├─ core/                    # reine Spiellogik, kein Pixi
│  ├─ rng.ts                # Seeded RNG (gleicher Seed = gleicher Run)
│  ├─ cards.ts              # Spielkarte: Rang, Farbe, Verbesserung, Edition, Siegel
│  ├─ deck.ts               # Mischen, Ziehen, Ablagestapel
│  ├─ handEval.ts           # Pokerhand erkennen + welche Karten gewertet werden
│  ├─ scoring.ts            # Punkte-Pipeline → liefert Liste von ScoreEvents
│  ├─ jokers/               # Joker-Definitionen (Daten + Effekt-Funktionen)
│  ├─ consumables/          # Verbrauchskarten
│  ├─ blinds.ts             # Blinds, Zielwerte, Boss-Regeln
│  ├─ shop.ts               # Angebot generieren, kaufen, verkaufen, rerollen
│  ├─ economy.ts            # Belohnungen, Zinsen
│  └─ run.ts                # Zustandsmaschine des ganzen Runs
├─ ui/                      # Darstellung mit PixiJS
│  ├─ scenes/               # Menü, Blind-Auswahl, Spieltisch, Shop, Game Over
│  ├─ components/           # CardSprite, JokerSprite, Buttons, Zahlen-Anzeigen
│  ├─ animation/            # Tweens, Wackeln, Zahlen-Popups
│  ├─ shaders/              # Hintergrund, Holo, Folie
│  └─ input.ts              # Tippen, Ziehen zum Sortieren
├─ audio/
├─ save/                    # Spielstand in IndexedDB/localStorage + JSON-Export
└─ main.ts
```

### 3.1 Spielzustand als Zustandsmaschine

```
MainMenu → BlindSelect → Playing → RoundWon → Shop → BlindSelect …
                            └──→ GameOver
```

Der gesamte Run-Zustand ist ein serialisierbares Objekt → Speichern/Fortsetzen ist trivial.

### 3.2 Joker-System über Hooks

Jeder Joker ist ein Datenobjekt mit optionalen Hook-Funktionen:

```ts
interface JokerDef {
  id: string;
  name: string;
  rarity: 'common' | 'uncommon' | 'rare' | 'legendary';
  cost: number;
  description: string;
  onCardScored?(ctx: ScoreContext, card: Card): Effect | void;
  onHeldInHand?(ctx: ScoreContext, card: Card): Effect | void;
  onIndependent?(ctx: ScoreContext): Effect | void;   // nach den Karten
  onHandPlayed?(ctx: RunContext): void;               // z. B. für skalierende Joker
  onDiscard?(ctx: RunContext, cards: Card[]): void;
  onRoundEnd?(ctx: RunContext): Effect | void;        // z. B. Geld
}

type Effect = { chips?: number; mult?: number; xMult?: number; money?: number; retrigger?: number };
```

Neue Joker hinzuzufügen heißt dann nur: eine neue Definition schreiben. Kein Umbau nötig.

### 3.3 Punkteberechnung als Event-Liste

`scoring.ts` berechnet das Ergebnis sofort, liefert aber zusätzlich eine
**Liste von Events** (`{source: 'card' | 'joker', index, chips?, mult?, xMult?}`).
Die UI spielt diese Liste danach Schritt für Schritt mit Animationen ab (Karte hüpft,
Zahl ploppt, Sound wird höher). So bleibt die Logik einfach testbar und die Animation
kann beliebig aufwendig werden.

---

## 4. Grafikstil (Entscheidung)

Gleiches *Genre-Gefühl*, aber eigener Look. Die Techniken sind allgemein üblich, Farben,
Karten und Figuren sind eigene Entwürfe:

- **Animierter Shader-Hintergrund**: eigene „Tinte im Wasser“-Schlieren in Indigo/Pflaume/Petrol,
  grob gepixelt, mit Vignette (`src/ui/Background.ts`)
- **Vierfarben-Deck**: Pik Indigo, Herz Rot, Karo Orange, Kreuz Grün; cremefarbene Karten
- **Juice**: Karten wackeln und springen beim Werten, Zahlen-Popups, Zähler laufen hoch
- **Später**: eigene Pixel-Art für Joker, Holo-/Folien-Shader auf Karten, CRT-Overlay,
  Sound mit steigender Tonhöhe, eigene Pixel-Schrift

## 4b. Joker-Design

Eigene Joker, geordnet nach **Mechanik-Familien**, damit der Pool systematisch wächst:

| Familie | Beispiele (bereits drin) |
|---|---|
| Flache Boni | Funke (+4 Mult) |
| Farb-/Rang-Synergien | Glut (rote Karten +2 Mult), Frost (schwarze +15 Chips), Kleinvieh (2–5 +3 Mult) |
| Hand-Synergien | Treppe (+60 Chips bei Straße) |
| Skalierend | Schneeball (+1 Mult pro gespielter Hand, dauerhaft) |
| Bedingungen | Einzelgänger (×3 bei 1 Karte), Letzte Chance (×2,5 bei letzter Hand) |
| Wirtschaft | Sparschwein (×Mult abhängig vom Geld) |

Geplant: Retrigger-Joker, Joker die auf Abwürfe reagieren, Joker die andere Joker kopieren,
Joker die Karten im Deck verändern, Geld-Joker am Rundenende.

## 4c. Thema (noch offen)

Damit es ein eigenes Spiel wird, brauchen Joker, Verbrauchskarten und Blinds eigene Namen und Bilder:

- **Weltraum-Casino**: Joker = „Crew-Mitglieder“, Hand-Level = „Sternkarten“, Bosse = „Sektoren“
- **Hexen-Tarot / Alchemie**: Joker = „Vertraute“, Verbesserungen = „Tränke“
- **Unterwasser / Piraten**: Joker = „Crew“, Geld = Dublonen, Bosse = Seeungeheuer
- **Retro-Arcade / Synthwave**: Neon-Optik, Joker = „Power-Ups“

Grafik: einfache Pixel-Art (selbst gezeichnet, z. B. mit Aseprite/Pixquare auf dem iPad)
oder bewusst minimalistischer Vektor-Stil. Anfangs reichen Platzhalter-Rechtecke mit Text.

---

## 5. Meilensteine

| # | Ziel | Ergebnis |
|---|---|---|
| **M0** | Projekt-Setup | Vite + TS + Pixi + Vitest, PWA-Manifest, Deployment. Leere App läuft als Icon auf dem iPad im Querformat. |
| **M1** | Kern-Logik | Deck, Ziehen, Auswählen, Hand-Erkennung, Punkteformel, mit Tests. |
| **M2** | Erster spielbarer Blind | Spieltisch-UI: Karten antippen, Spielen/Abwerfen, Punkte-Anzeige, Sieg/Niederlage. |
| **M3** | Run-Schleife | Antes 1–8, Small/Big/Boss, Geld, Zinsen, Game Over / Sieg. |
| **M4** | Joker | Joker-System + ~15 eigene Joker, Reihenfolge per Drag & Drop. |
| **M5** | Shop | Kaufen, Verkaufen, Reroll, Booster-Packs. |
| **M6** | Verbrauchskarten & Modifikatoren | Hand-Level, Karten-Verbesserungen, Editionen. |
| **M7** | Boss Blinds | ~8 Bosse mit Sonderregeln. |
| **M8** | Juice | Animationen, Shader, Sound, Musik. |
| **M9** | Meta | Speichern/Fortsetzen, mehrere Start-Decks, Schwierigkeitsstufen, Statistiken. |
| **M10+** | Ausbau | Mehr Joker (Ziel 50–100), Gutscheine, Tags, Endlos-Modus. |

Ab **M3** ist es ein vollständig spielbares Spiel; alles danach macht es tiefer und schöner.

---

## 6. iPad-spezifische Punkte

- **Querformat erzwingen** (Manifest `orientation: landscape`), Safe Areas beachten.
- **Touch**: große Tippflächen, kein Hover. Karten antippen = auswählen, ziehen = sortieren.
- Zoom, Doppeltipp-Zoom, Scroll-Bounce und Text-Auswahl per CSS/Meta deaktivieren.
- **Audio** startet in Safari erst nach der ersten Berührung → beim „Start“-Button entsperren.
- **ProMotion (120 Hz)**: Animationen über Delta-Zeit, nicht über feste Frames.
- **Spielstand**: IndexedDB; zusätzlich Export/Import als JSON-Datei als Backup.
- Entwickeln: Vite-Dev-Server mit `--host`, im WLAN direkt auf dem iPad testen.

---

## 7. Stand

- [x] M0 Setup: Vite + TS + Pixi + Vitest, PWA, GitHub-Pages-Workflow
- [x] M1 Kern-Logik mit Tests
- [x] M2 Spielbarer Blind (Auswählen, Spielen, Abwerfen, Sortieren, Punkte-Animation)
- [x] M3 Run-Schleife (Antes, Blinds, Geld, Zinsen, Sieg/Niederlage, Speichern/Fortsetzen)
- [~] M4 Joker: System + 9 Joker, Umsortieren per Ziehen, Verkaufen; vorläufige Joker-Auswahl statt Shop
- [ ] M5 Shop …
