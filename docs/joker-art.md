# Joker Grafiken (Pixel Art)

Alle 79 Jokers haben ein eigenes, von Hand im Code gezeichnetes Pixel Art Motiv. Die Motive sind eigene Entwürfe im Thema Sternwarte der Alchemisten und passen zu Namen und Effekt des Jokers. Es wurden keine Bilder als Vorlage eingelesen, nachgezeichnet oder kopiert, die Referenzbilder dienten nur als Stilanregung (kleine Hochformat Kacheln mit farbigen, detailreichen Szenen).

## Aufbau

| Datei | Inhalt |
|---|---|
| `src/data/jokerArt.ts` | Zahlen: Kachelmaße (52 mal 70 Bildpunkte, Vergrößerung 2 auf 104 mal 140), Motivfläche 46 mal 52, Namensband, Rahmenfarben je Seltenheit |
| `src/ui/jokerPix.ts` | Pixel Zeichenbibliothek ohne DOM: Raster, Linien, Kreise, Ellipsen, Polygone, Kugeln mit Licht von links oben, Farbverläufe mit geordnetem Dithering, Konturen, 3x5 Ziffern. Farbleitern (`ramp`) mit kühlen Schatten und warmem Licht |
| `src/ui/jokerKit.ts` | Gemeinsame Bauteile: Farbleitern `PAL`, Himmel, Leuchten, Hügel, Mond, Flamme, Sternform. Das sind nur Kulissen und Werkzeuge, kein Motiv wird eingefärbt wiederverwendet |
| `src/ui/jokerSpritesA.ts` bis `F.ts` | Die 79 Motive, je eine eigene Zeichenfunktion pro Joker ID (A einfache Hand Bedingungen, B Farben und Ränge, C Echo und wachsend, D Geld und Shop, E Regeln und Passive, F Handwerk, Gefolge, Legendäre) |
| `src/ui/jokerSprites.ts` | Register aller Motive nach Joker ID |
| `src/ui/jokerTile.ts` | Setzt Motiv, Rahmen in Farbe der Seltenheit, abgerundete Ecken und Namensband zur ganzen Kachel zusammen (rein, testbar). Jokers ohne Motiv bekommen eine Platzhalter Sternkarte |
| `src/ui/jokerArt.ts` | Baut daraus je Joker einmal eine Textur (Canvas, `scaleMode = 'nearest'`) und speichert sie zwischen |
| `src/ui/JokerView.ts` | Zeigt die Kachel als Sprite, Name im Band, Wirkungs Marken am unteren Motivrand, Edition Rahmen und Shader wie bisher |
| `src/jokerArt.test.ts` | Prüft: jeder Joker hat ein Motiv, keine verwaisten Motive, keine Lücken im Bild, mindestens 10 Farben, keine zwei Motive zu mehr als 50 Prozent gleich, Rahmen und Ecken |
| `tools/jokersheet.ts`, `tools/jokersheet-named.cjs` | Vorschaublätter (`preview/jokers.png`, `preview/jokers-named.png`) |

Es gibt keine Bilddateien, die Grafik entsteht beim Start aus dem Zeichencode. Deshalb ist für die PWA nichts im Precache zu ergänzen, Offline funktioniert wie bisher. Die Gesamtgröße im Bundle ist klein, die Texturen entstehen erst, wenn ein Joker zum ersten Mal gezeigt wird.

## Neuen Joker zeichnen

1. Joker in `src/data/jokers.ts` anlegen.
2. In einer der Dateien `jokerSprites*.ts` einen Eintrag mit derselben ID ergänzen. Die Funktion bekommt eine Fläche `p` (46 mal 52) und muss sie ganz füllen (zuerst `sky`, `vgrad` oder `wall` als Hintergrund). Wichtige Teile in die oberen zwei Drittel setzen, im unteren Streifen liegen die Wirkungs Marken.
3. Vorschau erzeugen: `npx vite-node tools/jokersheet.ts --ids meine_id --scale 6`, Test `npm test` läuft über alle Jokers.

## Editions

Die Edition Overlays (Schimmer, Aura, Prisma, Schatten) liegen weiter als Shader über der Kachel (`editionFx.ts`), ihr Eckenradius passt zur Kachel. Rahmen, Namensschild der Edition und Leuchtkontur bleiben unverändert und sind im Shop und in der Joker Leiste getestet (Bild `preview/jokers-ingame-shop.png`).

## Entscheidungen

* Ein "JOKER" Schriftzug wurde weggelassen: Er würde Motiv und Namensband doppeln und ginge zwischen Wirkungs Marken und Edition Schild unter.
* Der Name steht weiter als Text (Systemschrift) im dunklen Namensband, damit er scharf und lesbar bleibt. Sehr lange Namen werden verkleinert.
* Die Seltenheit zeigt jetzt der Kartenrahmen (Blau, Grün, Rot, Violett wie bisher), nicht mehr die ganze Fläche.

## Offene Punkte

* **O-J1:** Auf dem iPad prüfen, ob die 2 fache Vergrößerung (ein Bildpunkt ist 2 logische Punkte, auf dem iPad nicht immer ganzzahlig) scharf genug aussieht. Falls nicht, Auflösung der Kachel anpassen oder Vergrößerung ganzzahlig auf die Anzeigegröße abstimmen.
* **O-J2:** Einige Motive sind schlicht geblieben (Haltegriff, Schleifstein, Gefolgschaft, Adlerauge). Feinschliff nach dem Test auf dem Gerät.
* **O-J3:** Jokers im Sammlungs Atlas und in Packs nutzen `JokerView` und zeigen damit automatisch die neue Grafik. Die Atlas Ansicht selbst wurde nicht angefasst.
* **O-J4:** Der Eintrag O53 in `AUDIT.md` (Embleme aus Hash) ist überholt, jeder Joker hat jetzt ein eigenes Motiv. Bitte beim nächsten Pflegen von `AUDIT.md` übernehmen, ebenso den Abschnitt "Joker Grafiken" in `docs/HANDOFF.md`.
