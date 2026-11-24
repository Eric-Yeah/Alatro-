# Plan: Grafikstufe "Supernova" (Version 0.12.0)

Ziel: eine dritte Grafikstufe über "Voll". Sie soll komplexer und interaktiver sein, mehr Aufmerksamkeit ziehen und bei jedem Punktegewinn spürbar belohnen. "Sparsam" und "Voll" bleiben unverändert.

## Leitgedanken

* **Belohnung in Schichten:** jeder Zählschritt bekommt Sicht, Klang (schon da) und Bewegung. Kleine Gewinne glitzern, große lösen Schockwellen, Zoom Stoß und ein Callout Wort aus.
* **Das Bild antwortet auf die Hand:** Finger und Maus hinterlassen Sternenstaub, Tippen wirft Ringe, Karten neigen sich zum Finger, der Hintergrund reagiert auf Zeiger und Treffer.
* **Aufbau statt Dauerfeuer:** eine "Hitze" steigt mit jedem Zählschritt einer Hand und lässt Hintergrund, Staubwolke und Funken dichter werden. Nach der Hand kühlt sie ab.
* **Bleibt spielbar:** gedeckelte Partikelzahl, automatische Dichte Regelung nach Bildrate, Rücksicht auf die Option Screen Shake (ohne Shake kein Zoom Stoß, kein Blitz).
* **Eigener Stil:** Pixel Schockwellen im 6 Pixel Raster des Hintergrunds, Funkenkreuze, additive Leuchtpunkte. Keine fremden Assets.

## Bausteine

| Nr. | Baustein | Inhalt | Datei |
|---|---|---|---|
| 1 | Stufe | `Quality` bekommt `supernova`, Profil mit Flag `spektakel`, Optionen wechseln Sparsam, Voll, Supernova | `data/juice.ts`, `settings.ts`, `Game.showOptions` |
| 2 | Zahlen | alle Werte (Partikel, Orbs, Hitze, Callouts, Zeiger) | `data/spektakel.ts` |
| 3 | Rechnung | Partikelphysik, Dichte Regler, Bezier, Orb Anzahl, Callout Wahl, Nähe Neigung (rein, getestet) | `ui/spektakelMath.ts` |
| 4 | Partikelsystem | Sprite Pool mit einem Ticker, additiv: Burst, Ring, Konfetti, Münzen, Orbs mit Schweif, Staubwolke | `ui/particles.ts` |
| 5 | Punktefluss | Orbs fliegen von Karte oder Joker zur Chips oder Mult Anzeige, Einschlag mit Ring und Funken, X Mult mit Schockwelle | `ui/spektakel.ts`, `Game.animateEvent` |
| 6 | Gesamtpunkte | Stufen nach Ziel: Ringe, Feuerwerk, Zoom Stoß, Farbversatz, Callout Wort (Funke, Flamme, Komet, Supernova) | `ui/spektakel.ts`, `Game.play` |
| 7 | Ziel erreicht, Runde gewonnen | Konfettiregen, Ringe, Münzfontäne | `Game.play`, `Game.showRoundWon` |
| 8 | Zeiger Effekte | Sternenstaub Spur, Tipp Ringe, Karten neigen sich und heben sich in Zeigernähe | `ui/pointerFx.ts`, `ui/cardMotion.ts` |
| 9 | Auswahl | Funken Aura um gewählte Karten, Burst beim Wählen | `Game.toggleCard` |
| 10 | Hintergrund Shader | Parallax Nebel, Polarlicht Bänder, Sternschnuppen, Zeigerleuchten, Schockwellen mit Verzerrung, Hitze | `ui/Background.ts` |
| 11 | CRT | Farbversatz Impuls bei Treffern | `ui/crt.ts` |
| 12 | Bühne | Zoom Stoß über einen Wrapper um den Spielfeld Inhalt | `ui/stageFx.ts`, `Game` |
| 13 | Staubwolke | Glühwürmchen im Observatorium, weichen dem Zeiger aus | `ui/particles.ts` |

## Schritte

1. Stufe und Zahlen anlegen (Settings, Profil, Optionen, Englisch).
2. Rechnung mit Tests.
3. Partikelsystem, Zeiger Effekte, Fassade `spektakel`.
4. Hintergrund und CRT Shader erweitern, Bühnen Zoom.
5. In `Game.ts` einhängen (Punktefluss, Total, Ziel, Runde, Auswahl, Optionen).
6. Tests, Build, Browser Test mit Bildschirmfotos (WebGL Software, Bildrate nicht aussagekräftig).
7. Version 0.12.0, Patch Notes (Deutsch und Englisch), `HANDOFF.md`, `AUDIT.md`.
8. Commit auf dem Arbeitsbranch, Fast Forward auf den Deploy Branch, Actions Lauf prüfen.

## Risiken und Entscheidungen

* Leistung auf dem iPad ist im Container nicht messbar. Gegenmaßnahmen: Deckel `maxParticles`, Dichte Regler, Shader Zusatz hinter Uniform Schalter, Stufe bleibt freiwillig.
* Der Zoom Stoß braucht einen Wrapper Container (`world`) im Spielfeld, damit Skalierung und Drehung des Handy Layouts unberührt bleiben.
* Callout Wörter sind Oberflächentext und deutsch mit englischer Übersetzung (`t()`).
* Keine neue `SAVE_VERSION`: nur `settings.quality` bekommt einen weiteren erlaubten Wert.
