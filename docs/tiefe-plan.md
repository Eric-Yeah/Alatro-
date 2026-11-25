# Plan: Tiefen Look (Version 0.13.0)

Ziel: das ganze Spiel wirkt räumlicher. Nicht 3D, aber weiche Schatten, Verläufe, Kanten, Glanz und Körper statt flacher Flächen. Vorbild ist ein Spieltisch mit Platten, vertieften Anzeigen, Karten mit Schatten und dicken Knöpfen. Die Pixel Art der Karten, Jokers und Consumables bleibt scharf, die Umgebung (Platten, Knöpfe, Felder, Schatten) wird weich und plastisch. Das ersetzt den bisherigen "klaren, flachen" Stil aus dem Abschnitt "Klarer Grafikstil" in `docs/HANDOFF.md` (harte Schatten, keine Verläufe).

## Leitgedanken

* **Licht kommt von oben.** Obere Kanten sind heller (feine Lichtlinie, Glanzband), untere dunkler (Unterrand, Schattenlinie). Schatten fallen nach unten.
* **Fünf Ebenen:** Hintergrund, Platten (Seitenleiste, Fenster), Felder (vertieft: Werte, Fächer, Plätze), Kacheln (Karten, Jokers, Packs schweben mit Schatten), Knöpfe (erhaben, beim Drücken eindrücken).
* **Wert Felder sind vertieft**, Knöpfe und Platten erhaben. Das macht auf einen Blick klar, was man antippen kann.
* **Höhe zeigt Zustand:** eine gewählte Karte steigt, ihr Schatten bleibt auf dem Tisch, wird weicher und tiefer. Gleiches gilt für gehaltene Kacheln.
* **Bleibt schnell:** Schatten sind eine kleine Textur pro Radius und Unschärfe, als neun Teile Sprite gedehnt (keine Filter, keine Weichzeichner). Verläufe sind zwischengespeichert. Alles läuft auch in Sparsam.
* **Eigener Stil, keine Fremd Assets.** Alle Zahlen in `src/data/depth.ts`.

## Werkzeug (fertig, Grundlage für alles)

| Baustein | Datei | Zweck |
|---|---|---|
| `dropShadow(w, h, preset, opts)` | `ui/depth.ts` | weicher Schatten als NineSliceSprite, Form liegt bei (dx, dy), Presets in `SHADOW` (`plate`, `panel`, `button`, `card`, `tile`) |
| `setShadowLift(shadow, t)` | `ui/depth.ts` | Schatten wächst beim Abheben (t 0 bis 1) |
| `drawPlate(g, x, y, w, h, color, opts)` | `ui/depth.ts` | erhabene Platte in ein Graphics: Kontur, Unterrand, Verlauf, Lichtkante, Glanzband, optional Hologramm Linie |
| `drawInset(g, x, y, w, h, color, opts)` | `ui/depth.ts` | vertieftes Feld: dunkler Verlauf, Innenschatten oben, helle Lippe unten |
| `raised(w, h, color, opts)` / `sunken(w, h, color)` | `ui/depth.ts` | dasselbe als fertiger Container (`raised` mit Schatten), `boundsArea` ohne Schatten |
| `gloss(w, h, radius, strength)` | `ui/depth.ts` | Glanz und Kante für Kacheln (Jokers, Packs, Vouchers) |
| `vignette(w, h, alpha)` | `ui/depth.ts` | dunkle Ränder |
| `vGradient`, `vGradient3`, `radialGradient` | `ui/depth.ts` | zwischengespeicherte Verläufe (Zahl oder `rgba(...)` Farben) |
| `lighten`, `mixColor` | `ui/depthMath.ts` | Farben (rein, getestet) |
| `panel()`, `Button` | `ui/widgets.ts` | bauen schon auf dem Werkzeug auf, Signatur unverändert |
| `CardView.lift` | `ui/CardView.ts` | Abhebung 0 bis 1 (Schatten bleibt liegen), `Game.toggleCard` tweent sie |

Regeln für alle: neue Platten und Knöpfe immer über diese Bausteine. Keine hart codierten Magic Numbers, Zahlen in `data/depth.ts` oder in den Layout Dateien. Texte weiter mit `t()`. Nach Schatten Sprites die `getBounds` Abfragen (Einführung, `Guide.ts`) prüfen: Container mit Schatten setzen `boundsArea`, wie `raised` und `Button` es tun.

## Aufteilung

| Teil | Dateien | Inhalt |
|---|---|---|
| A Spieltisch | `ui/Game.ts`, `ui/Guide.ts`, `ui/tableSurface.ts` (neu) | Seitenleiste als Platte mit Feldern, Wert Felder vertieft, Chips und Mult Kacheln, Joker und Consumable Fach vertieft, Stapel mit Körper, Spielknöpfe, Blind Auswahl, Rundengewinn, Game Over, Run Setup, Tooltips, Fenster |
| B Kacheln und Shop | `ui/JokerView.ts`, `ConsumableView.ts`, `ShopView.ts`, `PackView.ts`, `VoucherView.ts`, `consumableTray.ts`, `jokerArt.ts`, `consumableArt.ts`, `packArt.ts`, `RunInfoView.ts`, `DeckView.ts`, `CollectionView.ts`, `levelUpView.ts` | Schatten, Glanz, Körper und Abheben für Jokers, Consumables, Packs, Vouchers; Shop Fächer und Preisfahnen; Run Info, Deck und Atlas Ansichten |
| C Menüs | `ui/HomeView.ts`, `TitleCards.ts`, `OptionsView.ts`, `optionWidgets.ts`, `InfoViews.ts`, `AchievementsView.ts`, `SyncView.ts`, `BackupView.ts`, `ScreenTransition.ts` | Home Bildschirm, Optionen, Schalter, Schieberegler, Auswahlleisten, Erfolge, Anleitung, Koppeln, Sichern, Ladekarte |

## Prüfen

* `npx tsc --noEmit`, `npm test`, `npm run test:spec`, `npm run build`.
* Bildschirmfotos mit Playwright (Dev Server, Spieltisch, Shop, Packs, Menüs) vorher und nachher vergleichen.
* Auf dem iPad prüfen: Bildrate (FPS Anzeige), Lesbarkeit der Zahlen auf Verläufen, Tippgefühl der Knöpfe (Eindrücken), ob Schatten zu schwer wirken.
