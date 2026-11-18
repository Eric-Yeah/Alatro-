# Übergabe: Stand nach M3, nächster Schritt M4

Stand: 18.11.2026. Branch `claude/focused-brown-gvwmxq` (baut auf `claude/funny-brahmagupta-ic0bpe` auf), alles gepusht.

## Wo wir stehen

| Meilenstein | Status |
|---|---|
| Schritt 1 Audit (`AUDIT.md`, `tests/spec/`) | erledigt |
| M1 Engine Kern (Daten, Erkennung, Scoring Pipeline, Blinds, Zinsen) | erledigt |
| M2 Spielfluss (Zustandsautomat, Skip und Tags, Bosse, Shop, Packs, Vouchers, Decks, Stakes) | erledigt |
| M3 Eigener Joker Katalog (65 Jokers, Ereignis Phasen, Passive, Kopie, Rettung) | erledigt |
| **M4 Consumables, Pack Abläufe für Consumables, Collection, Run Info, Seed Eingabe** | **als Nächstes** |
| M5 UI, UX, Juice (CRT, Farbstimmung pro Blind, Sound, Shake, Edition Shader, Joker Grafiken) | offen |
| M6 Politur, Performance, Optionen | offen |

Teststand: `npm test` 125 von 125 grün, `npm run test:spec` 87 von 87 grün, `npm run build` ohne Fehler.

Deploy Hinweis: `.github/workflows/deploy.yml` deployt bei Push auf `main` oder `claude/funny-brahmagupta-ic0bpe`. Der M3 Stand liegt auf `claude/focused-brown-gvwmxq` und ist deshalb noch nicht live, bis er dorthin oder nach `main` gemergt wird.

Das Briefing `balatro_briefing.md` liegt **nicht** im Repo. Den Originalkatalog aus Abschnitt 4 nicht verwenden.

## Projektstruktur

| Ort | Inhalt |
|---|---|
| `src/data/` | alle Zahlen und Inhalte: `hands`, `cards`, `economy`, `blinds`, `shop`, `modifiers` (Enhancements, Seals, Editions), `jokers` (65 Jokers in 8 Gruppen), `bosses`, `tags`, `vouchers`, `decks`, `stakes`, `packs`, `modsSpec` |
| `src/core/types.ts` | gemeinsame Typen (Card, HandType, Effect mit Run Folgen, DetectRules) |
| `src/core/jokers.ts` | Joker Schema: Phasen (Scoring und Ereignisse), `JokerContext`, `JokerDef` mit `config`, `passive`, `rules`, `copies`, `spawn`, `stickers`, `startVars`, `calculate`. Helfer `invokeJoker` (Kopien), `jokerPassives`, `jokerRules`, `isFaceCard`, `jokerDescription` |
| `src/core/scoring.ts` | `scoreHand()`: Before (mit Karten Veränderung), Basis, Karten, Held, Jokers mit Edition und `other` Phase, Balance, Floor, After. Liefert ScoreEvents, `modified`, `destroyedJokers` |
| `src/core/run.ts` | RunState (Version 3), Runde mit Joker Passiven, `probMultOf`, `computeEarnings` mit Joker Zeilen, `runJokerEvent` und `applyJokerEvents`, `rollJoker` mit Spawn Bedingungen |
| `src/core/game.ts` | Zustandsautomat und Aktionen. `selectBlind` und `discardHand` geben Joker Ereignisse für die UI zurück, `afterHand` prüft die Rettung |
| `src/core/index.ts` | registriert `JOKER_DEFS` (vor Engine Nutzung importieren, auch in Tests) |
| `src/save.ts` | localStorage, Migration Version 1 zu 2 zu 3 |
| `src/ui/Game.ts` | Szenen und Ablauf, `showJokerEvents` für Popups, `ShopView.ts`, `CardView.ts`, `JokerView.ts`, `Background.ts`, `theme.ts` |
| `src/core/*.test.ts` | Unit Tests (`core`, `m1`, `m2`, `m3`) |

## Wie ein neuer Joker entsteht

1. Eintrag in `src/data/jokers.ts` in der passenden Gruppe: `id` (nie wieder ändern), deutscher Name im Thema, Rarity, Preis, `copyCompat`, Zahlen in `config`.
2. Wirkung über `calculate(ctx, self, cfg)` mit `ctx.phase`, oder deklarativ über `rules` bzw. `passive`.
3. Zustand nur in `self.vars` und nur ändern, wenn `!ctx.copied`. `payout` muss rein sein (wird auch für die Vorschau aufgerufen).
4. Test in `src/core/m3.test.ts` ergänzen. Der Katalog Test prüft Platzhalter und Gedankenstriche automatisch.

## Aufgabe M4: Consumables und Run Werkzeuge

Ziel nach AUDIT K1, H6, R3, U1, P4:

* **Drei eigene Consumable Typen** (Namen stehen schon in `SHOP_TYPE_WEIGHTS` in `src/data/shop.ts`): `sternbild` (Hand Level erhöhen), `elixier` (Karten verändern: Enhancement, Seal, Suit, Rang, Karten zerstören oder kopieren), `omen` (riskante Effekte, z. B. Legendary Joker erzeugen, Edition vergeben, dafür Nachteil). Eigene Namen und Effekte, Daten in neuer Datei `src/data/consumables.ts`.
* **Slots:** 2 Consumable Slots (`run.consumableSlots`), Benutzen aus dem Slot (mit Kartenauswahl wo nötig) und Kaufen im Shop. Consumable Phase im Scoring (Schritt 6 in `scoring.ts`) für Effekte, die beim Scoring wirken.
* **Shop Typ Wurf:** Karten Slots nach `SHOP_TYPE_WEIGHTS` würfeln (Offener Punkt O24 auflösen).
* **Packs:** Consumable Packs in Normal, Jumbo, Mega (`src/data/packs.ts`), Pack Ansicht mit sofortigem Benutzen bei Elixier Packs (Hand wird dafür gezogen).
* **Stern Seal:** erzeugt am Rundenende das Sternbild der zuletzt gespielten Hand (Beschreibung existiert in `modifiers.ts`, Wirkung fehlt).
* **Legendary Quelle:** ein Omen erzeugt einen zufälligen Legendary Joker (Offener Punkt O33).
* **Run Info:** Hand Level Übersicht mit Secret Hands (H6), Bosse und Vouchers des Runs. **Collection:** alle Jokers, Bosse, Tags, Vouchers, Consumables mit Beschreibung. **Seed Eingabe** im Run Setup (R3, `normalizeSeed` existiert).
* Spielstand: Consumables im RunState brauchen eine neue `SAVE_VERSION` 4 mit Migration in `src/save.ts`.

### Danach

* `AUDIT.md`: K1, H6, R3, P4, U1 aktualisieren, M4 Abschnitt unter "Fortschritt", neue Entscheidungen ab O36.
* Browser Test: Build, `npx vite preview --port 4173`, Playwright Skript. Logische Auflösung 1440 mal 1000, bei 1180 mal 820 Skalierung 0.8194. Zuerst "Fortsetzen" bei (590, 451) Bildschirmkoordinaten tippen. Spielstände lassen sich mit `npx vite-node` und `createRun` erzeugen und per `localStorage.setItem('alatro.run.v1', json)` einspielen.
