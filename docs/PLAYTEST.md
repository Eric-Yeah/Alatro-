# Playtest und Review (Version 0.4.0)

Stand: 19.11.2026. Branch `claude/eager-brown-4vjfbc`.

## Wie getestet wurde

* **Engine Prüfung:** `npm test`, `npm run test:spec`, `npm run build` sowie ein neuer Zufallslauf Test (`src/core/fuzz.test.ts`). Ein Bot spielt Runs mit allen 7 Decks, wählt jede Hand per Engine Vorschau, kauft, öffnet Packs, benutzt Consumables mit Zielen und prüft nach jedem Schritt Invarianten (keine doppelten Karten IDs, Kartenzahl in der Runde gleich Deckgröße, Slots nie überfüllt, Geld endlich). Jeder Lauf läuft zweimal, das zweite Mal mit Speichern und Laden (JSON und Migration) in jedem Schritt. Gleicher Seed und gleiche Entscheidungen ergeben denselben Ausgang. Ergebnis: keine Abstürze, keine Softlocks, kein Determinismus Bruch.
* **Spielen im Browser:** Vite Dev Server, Playwright mit Chromium und Gerätemodellen iPad (gen 7), iPad Pro 11, iPad Mini, iPhone 13 Pro Max, Quer und Hochformat. Ein Bot tippt per Koordinaten durch die echte Oberfläche (Blind Wahl, Karten antippen, Play Hand, Discard, Einkassieren, Shop mit Detail Karte und Kaufen, Packs). Zusätzlich Szenen per Engine erzeugt (Boss Runden, Endless Shop, Siegbildschirm, Packs, Editions, Tooltips, sehr hohe Punktzahlen) und als Screenshots geprüft.
* **Nicht möglich:** Klang hören, echte Bildrate auf dem iPad messen (Software Rendering im Container), Berührungsgefühl. Diese Punkte bleiben für die Messung auf dem Gerät offen.

## Spieler Feedback

**Was gut funktioniert:** Der Fluss ist klar (Blind wählen, Karten antippen, Play Hand, Einkassieren, Shop). Die Vorschau von Pokerhand, Chips und Mult beim Antippen der Karten ist hilfreich. Die Score Animation hat gutes Feedback: gewertete Karten springen hoch, Popups zeigen jeden Beitrag, das Chip Feld wackelt. Der Shop mit Preisfahnen, Detail Karte und Kaufen Knopf ist übersichtlich, die Hinweise "Kein freier Platz" erklären, warum etwas nicht geht. Boss Karten werden sichtbar durchgestrichen. Die Farbcodierung der Jokers (C, M, X, $) hilft beim Überfliegen.

**Befunde, Priorität und was daraufhin geändert wurde:**

| Nr | Befund | Priorität | Ergebnis |
|---|---|---|---|
| P1 | Die Sonderregel eines Bosses wurde im Blind Feld der Seitenleiste am unteren Rand abgeschnitten (zweite Zeile ragte aus dem Feld). | hoch | behoben, Ziel rückt bei Bossen nach oben, die Regel hat Platz für zwei Zeilen |
| P2 | Hohe Punktzahlen (ab etwa 9 Stellen) liefen im Round Score Feld über die Beschriftung "Round Score". | hoch | behoben, die Schrift passt sich der Länge an |
| P3 | Der Consumable Zähler zeigte die Grundslots, nicht die Slots mit Joker Boni (Gürteltasche). | mittel | behoben |
| P4 | Lange Consumable Namen (Alchemistentisch) wurden am Kartenrand abgeschnitten. Enhancement Namen (Quecksilber, Mondstein) auf Karten überdeckten die Eckmarke. | mittel | behoben (Namen schrumpfen, Beschriftung rückt weg von der Eckmarke) |
| P5 | Seals und Editions auf Karten waren nur an der Farbe zu erkennen. Ein roter Punkt sagt einem neuen Spieler nichts. | mittel | Seal zeigt jetzt E, M oder S im Kreis, Editions zeigen ihren Namen oben auf der Karte, die Anleitung erklärt es |
| P6 | Hehler (Common, $3) zahlte beim Verkauf $10 plus Verkaufswert: sicherer Gewinn von $8 pro Auftauchen, dazu gratis aus Packs. Eine "tote Entscheidung", kaufen war immer richtig. | mittel | Balance in `src/data/jokers.ts`: Kosten $7, Verkauf $8, netto kleiner Gewinn |
| P7 | Im Shop zeigten Round Score, Hand Feld und Hands und Discards nutzlose Nullen. Wichtige Information für Käufe fehlte: welcher Blind kommt, welcher Boss. | mittel | Seitenleiste zeigt im Shop eine Vorschau mit nächstem Blind, Ziel, Belohnung und der Sonderregel des Bosses |
| P8 | Neue Spieler sehen zum Start leere Mitte und wissen nicht, dass man Karten antippt. Die Anleitung ist nur über das Menü erreichbar. | mittel | Kurzer Hinweis in der Tischmitte in der ersten Runde bis zur ersten gespielten Hand (Speicher `alatro.hints.v1`) |
| P9 | Tippflächen in Detail Karten und Tooltips (Kaufen, Verkaufen, Benutzen, Wählen) waren etwa 35 CSS Pixel hoch, unter den 44 Punkt der iPad Richtlinie. | mittel | Höhe 56 im Spielfeld, bei Skalierung 0,8 etwa 45 Pixel |
| P10 | Game Over zeigte nur Ante, Punkte und Seed, einziger Knopf Neuer Run. | niedrig | Rückschau mit meistgespielter Hand und Jokers, zusätzlich Knopf Hauptmenü. Siegbildschirm zeigt den Seed |
| P12 | Auf iPads ohne Rand (iPad Pro 11 Querformat, kaum Letterbox) kann das Spielfeld unter Statusleiste und Home Indikator der installierten PWA liegen. | mittel | `computeView` berücksichtigt `env(safe-area-inset-*)`, Test ergänzt |
| P13 | Der Audio Kontext wurde nach einer iOS Unterbrechung (Anruf, Appwechsel) nur bei "suspended" fortgesetzt, nicht bei "interrupted". Klang konnte danach ausbleiben. | mittel | fortsetzen bei jedem Zustand außer "running" (nicht am Gerät prüfbar) |
| P14 | `playHand` und `discardHand` prüften nicht, ob die IDs in der Hand liegen und eindeutig sind. Eine ungültige Eingabe hätte eine Hand verbraucht. | niedrig | Prüfung mit Fehler, Test ergänzt |
| P15 | Teufelsmarkt setzte das Geld auf 0, auch wenn kein Joker erzeugt werden konnte (leerer Pool). | niedrig | Geld sinkt nur, wenn der Joker entsteht |
| P16 | Optionstext "leichte Wölbung" stimmte nicht mehr (Wölbung ist 0). | niedrig | Text angepasst |

**Offen und bewusst nicht geändert:**

* **Hochformat am iPad:** Das Spielfeld ist 1440 mal 1000 und wird nur eingepasst. Im Hochformat sind Karten etwa halb so groß wie im Querformat, oben und unten bleibt viel leere Fläche. Ein eigenes Hochformat Layout wäre ein eigener Schritt (siehe AUDIT.md, O68).
* **Leere Tischmitte:** Zwischen Jokers und Hand liegt eine große freie Fläche. Sie gehört der Score Animation, ist aber im Ruhezustand leer. Idee für später: Mitte mit Hand Referenz oder Sternbild Dekoration füllen.
* **Schwierigkeit:** Siehe Balance unten, bewusst nicht verändert.
* **Klang und Bildrate:** nur auf dem Gerät zu beurteilen.

## Balance Eindrücke

Gemessen mit Bots, die deutlich schwächer spielen als ein Mensch (Bot 1: Hand per Vorschau, wenig Wirtschaft. Bot 2: kauft Jokers und Packs, nutzt Sternbilder, hebt auf $25 an).

* Ante 1 Small Blind (Ziel 300) schafft der Vorschau Bot in etwa 97 Prozent der Fälle. Das Sternenkind Deck (Hand Size 7) schafft es in etwa 84 Prozent.
* Bot 2 erreicht im Mittel Ante 3 bis 4 (Standard Deck), im besten Fall Ante 5 bis 7. Bei Stake Ewige Nacht im Mittel unter Ante 2. Das passt zu Zielen und Jokers auf dem Niveau, das für Genre Spiele üblich ist: Ante 2 und 3 verlangen echte Joker Synergien, reine Kartenstärke reicht dort nicht.
* **Goldene Waage:** Ziele mal 2, aber Mitteln von Chips und Mult macht frühe Hände sehr stark (Ante 1 im Mittel etwa 1100 Punkte gegen Ziel 600). Das Deck erreicht im Bot Test klar die größte Tiefe (Mittel Ante 4 bis 5, Spitze Ante 7). Es ist das Deck für Einsteiger, später gleicht sich das durch hohe Mult Jokers aus. Keine Änderung, im Auge behalten.
* **Geldfluss:** Etwa $20 pro Ante plus Zinsen. Zwei Shop Slots und Reroll ab $5 machen Rerolls früh teuer. Der Skip Tag Goldstaub ($8 sofort) ist ein starker Start.
* **Dominante Entscheidungen:** Hehler (siehe P6), sonst keine auffällige. Der Elixier Doppelgänger (Karte kopieren, $3) ist ein starkes Werkzeug, aber das ist im Genre so gewollt.
* **Tempo:** Bei Normaltempo ist die Score Animation einer Hand kurz, wird mit fünf Jokers und Retriggern aber spürbar länger. Der Tempo Knopf in der Seitenleiste löst das, der Standard 1x ist für den ersten Eindruck passend (genaues Gefühl nur auf dem Gerät zu beurteilen).

## Design Überarbeitung

* **Palette:** Tiefere Nachtfarben (Indigo statt Mittelblau), der Shop bekommt einen warmen Messing Ton (Laterne im Alchemielabor), Boss und Big Blind behalten ihre dramatischen Stimmungen. Mehr Sterne, ein Teil leuchtet warm wie Kerzenlicht.
* **Lesbarkeit:** Nebenbeschriftungen (Joker Zähler, Seed, Sortieren) von 16 auf 18, Beschreibungen in Packs von 15 auf 17, Boss Regeln passen ins Feld, Namen auf Karten überlappen nicht mehr.
* **Konsistenz:** Seals und Editions haben jetzt auf Karten dieselbe Lesbarkeit wie bei Jokers (Name sichtbar).
* **Hierarchie im Shop:** Die Seitenleiste zeigt dort nützliche Information statt toter Zahlen.
* Vorher und Nachher Screenshots wurden mit Playwright erstellt und verglichen (Start, Blind Wahl, Runde, Boss, Shop, Pack, Optionen, Anleitung, Patch Notes, Game Over, Sieg). Es wurden keine Regressionen festgestellt.
