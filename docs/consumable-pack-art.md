# Consumable und Pack Grafiken (Pixel Art)

Alle 65 Consumables, alle 15 Booster Packs und der Voucher haben ein Pixel Art Aussehen im Stil der Joker Kacheln. Alles sind eigene Entwürfe im Thema Sternwarte der Alchemisten, es wurden keine Bilder als Vorlage eingelesen, nachgezeichnet oder kopiert. Namen und Effekte sind unverändert.

## Aufbau

| Datei | Inhalt |
|---|---|
| `src/data/consumableArt.ts` | Zahlen: Kachel 52 mal 70 Bildpunkte (Vergrößerung 2, also 104 mal 140 wie die Joker), Motivfläche 40 mal 40, Titelband, Fußleiste, Farbwelt je Art, Liste der seltenen Karten |
| `src/ui/consumableKit.ts` | Bauteile: Nachthimmel mit Nebelwolken, Sterne, Sternbild Linien, Blasen, Kartenzeichen, Schattierung `lit` |
| `src/ui/consumableSpritesStern.ts` | 12 Sternbilder, `...ElixierA.ts` 8 Essenzen und 3 Wachssiegel, `...ElixierB.ts` 4 Farbwandler und 6 weitere Elixiere, `...ElixierC.ts` 13 weitere Elixiere (Rang, Suit, Edition, Geld, Level, Tags, Ziehen), `...Omen.ts` 9 Omen, `...OmenB.ts` 10 weitere Omen |
| `src/ui/consumableSprites.ts` | Register aller Motive nach Consumable ID |
| `src/ui/consumableTile.ts` | Setzt Rahmen und Motiv zur ganzen Karte zusammen (rein, testbar) |
| `src/ui/consumableArt.ts` | Textur Cache (Canvas, `scaleMode = 'nearest'`) |
| `src/ui/ConsumableView.ts` | Zeigt die Kachel, Name im Titelband, Funkeln für seltene Karten, Aufprall |
| `src/data/packArt.ts` | Maße je Größe (Normal 44 mal 60, Jumbo 50 mal 68, Mega 56 mal 76, Vergrößerung 3), Farbwelt je Art |
| `src/ui/packArtSprites.ts` | 5 Fenster Motive (Joker Kappe, Kartenfächer, Sternbild, Kolben, Mondsichel mit Auge) und Siegel Zeichen |
| `src/ui/packTile.ts` | Siegelhülle: gezackte Quetschkanten, gewölbter Bauch, Glanzstreifen, Zierschienen, Fenster, Wachssiegel, Namensband |
| `src/ui/packArt.ts`, `src/ui/PackView.ts` | Textur Cache und Ansicht (Name im Band, Funkeln, Aufprall) |
| `src/data/voucherArt.ts`, `src/ui/voucherTile.ts`, `src/ui/VoucherView.ts` | Voucher als Ticket mit Kerben, Abrisslinie und Kristallkugel |
| `src/data/artFx.ts` | Alle Zahlen für Juice: Funkeln, Glanzstreifen, Aufprall, Öffnungsanimation |
| `src/ui/artFx.ts` | Pixel Textur Hilfe, Funkeln über einen gemeinsamen Ticker, Aufprall beim Berühren |
| `src/ui/packFx.ts` | Öffnungsanimation: Wackeln, Aufglühen, Platzen mit Funken, Karten fächern auf |
| `src/consumableArt.test.ts`, `src/packArt.test.ts` | Prüfen: jedes Motiv vorhanden, keine verwaisten, keine Lücken, genug Farben, keine zwei Motive zu mehr als 50 Prozent gleich, Größen und Rahmen, vernünftige Juice Zahlen |
| `tools/artsheet.ts`, `tools/artsheet-named.cjs`, `tools/ingameSave.ts`, `tools/ingameShot.cjs` | Vorschaublätter und Screenshots aus dem echten Spiel (siehe unten) |

Es gibt keine Bilddateien, die Grafik entsteht aus dem Zeichencode. Die Texturen entstehen erst beim ersten Zeigen und werden zwischengespeichert. Für die PWA ist nichts im Precache zu ergänzen.

## Unterscheidung der Arten

* **Consumables:** Hochformat mit Titelband oben, Fenster mit Goldrand, Fußleiste. Sternbild in Mitternachtsblau mit Gold und Sternen als Eckzeichen, Elixier in Smaragd mit Gold und Zahnrädern, Omen in Violett mit Silber und Mondsicheln. Eine Jokerkachel hat das Namensband unten und einen einfarbigen Rahmen, eine Consumable Karte ist daran sofort zu erkennen.
* **Packs:** Siegelhülle mit gezackten Kanten, kein Kartenformat. Joker karminrot mit violettem Siegel, Karten königsblau mit rotem Siegel, Sternbild mitternachtsblau mit goldenem Siegel, Elixier smaragd mit rotem Siegel, Omen violett mit silbernem Siegel.
* **Größen:** Jumbo ist größer, hat durchgehende Zierschienen mit Nieten und eine Sternreihe oben. Mega ist am größten, hat eine Goldkrone, Doppelring im Siegel und mehr Funken im Fenster.

## Juice

* **Funkeln:** Seltene Consumables (alle Omen, Fünfgestirn, Nebelhaus, Urnebel, Alchemistentisch, Erntemond, Flammenfirnis, Bannwasser, Leitstern), alle Packs (Jumbo und Mega mehr Funken) und der Voucher haben kleine Funkelkreuze und einen Glanzstreifen, der alle paar Sekunden über die Fläche läuft. Ein einziger Ticker bedient alle Objekte, nicht sichtbare werden übersprungen.
* **Aufprall:** Bei Maus über der Karte hebt sie sich (Faktor 1,12, 8 Punkte) und wird größer, beim Antippen sinkt sie ein und federt zurück. Im Shop fängt das Fach die Berührung auf (`addSlot` ruft `attachPop` mit dem `body` der Ansicht), die Preisfahne liegt darüber. Das wirkt nur auf einen inneren Container, Verschiebungen von außen (Shop, Leiste) bleiben unberührt.
* **Pack öffnen:** Der Beutel erscheint, wackelt, glüht auf, bläht sich auf und platzt (Blitz, kleine Erschütterung, 28 Funken). Die Auswahlkarten fächern sich aus der Mitte auf, Texte und Knöpfe blenden danach ein. Bedienen ist erst danach möglich. Die Animation läuft nur einmal je Pack, nicht nach jeder Wahl.
* **Optionen:** Grafikstufe Sparsam schaltet das Funkeln ab und halbiert die Funken beim Platzen. Ohne die Option Shake gibt es keinen Aufprall, kein Wackeln, keinen Blitz und keine Funken, die Karten erscheinen nur mit kurzem Einblenden. Das Tempo aus den Optionen wirkt auf Tweens und Funken.

## Neues Consumable oder Pack zeichnen

1. Consumable in `src/data/consumables.ts` anlegen, dann in einer der Dateien `consumableSprites*.ts` einen Eintrag mit derselben ID ergänzen. Die Funktion bekommt eine Fläche `p` (40 mal 40) und muss sie ganz füllen (zuerst `cosmos`, `vgrad` oder `wall`). Der Test läuft automatisch über alle Consumables.
2. Neue Packart: Eintrag in `PACK_PALETTES` (`src/data/packArt.ts`), Motiv in `PACK_MOTIFS` und Siegel Zeichen in `SEAL_GLYPHS` (`src/ui/packArtSprites.ts`). Das Motiv zeichnet in eine Fläche zwischen 28 mal 24 und 40 mal 32.
3. Vorschau: `npx vite-node tools/artsheet.ts --kind consumables --scale 4 --cols 8 --out /tmp/roh`, danach `node tools/artsheet-named.cjs consumables /tmp/roh` (ebenso `packs`). Screenshot aus dem Spiel: Spielstand mit `npx vite-node tools/ingameSave.ts shop save.json` (oder `pack`), Dev Server starten, dann `node tools/ingameShot.cjs save.json bild.png http://127.0.0.1:5173/ 2500`.

## Entscheidungen

* Der Name steht weiter als Text im Titelband (Consumable) bzw. Namensband (Pack, Voucher), damit er scharf bleibt. Lange Namen werden verkleinert.
* Die Consumable Karte hat dieselbe Größe wie die Joker Kachel, damit Layout, Tooltips und Leiste unverändert bleiben.
* Pack Größen werden über die Maße unterschieden, nicht über Skalierung. Das Shop Fach bleibt gleich, Jumbo und Mega ragen leicht über das Normal Maß hinaus.
* Der Voucher hat ein gemeinsames Ticket für alle 26 Vouchers (kein eigenes Motiv je Voucher, optional laut Auftrag).

## Offene Punkte

* **O-C1:** Auf dem iPad prüfen: Schärfe bei Vergrößerung 2 (Consumables) und 3 (Packs), Lesbarkeit der Namen im Titelband (Quecksilbertrank und Alchemistentisch werden verkleinert), Tippgefühl des Aufpralls.
* **O-C2:** Leistung der Funken auf dem iPad messen. Es laufen höchstens etwa 30 kleine Sprites und ein Ticker, sollte es ruckeln, `sparksCard` und `sparksPack` in `src/data/artFx.ts` senken oder Sparsam wählen.
* **O-C3:** Einige Motive sind schlichter geblieben (Nachtschwarz, Sternwachs, Obsidiansalbe, Blutmond). Feinschliff nach dem Test auf dem Gerät.
* **O-C4 (erledigt):** Die Consumable Leiste legt ab drei Karten verkleinerte Karten (Maßstab 0,62) nebeneinander, ab vier in zwei Reihen (`src/ui/consumableTray.ts`, Zahlen `CONS_TRAY` in `src/data/consumableArt.ts`, Test `src/consumableTray.test.ts`). Der Name wird erst bis zur kleinsten Schrift verkleinert, dann gekürzt. Berührt man eine Karte, springt sie nach vorn und zeigt sich fast in voller Größe mit ganzem Namen. Tippen öffnet wie bisher die Karte mit Benutzen und Verkaufen. Gilt im Kampf und im Shop gleich.
* **O-C5 (erledigt):** Der Sternenatlas zeigt entdeckte Jokers, Sternbilder, Elixiere, Omen und Vouchers mit den Pixel Art Kacheln (`tileFor` in `CollectionView.ts`, vorher gab es dort gar keine Bilder). Unentdeckte Einträge behalten das alte Aussehen (`???` mit Hinweis). Packs kommen im Atlas nicht vor. Screenshots entstehen mit `tools/atlasKeys.ts` und `tools/atlasShot.cjs`.
* **O-C6:** `AUDIT.md` und `docs/HANDOFF.md` wurden auftragsgemäß nicht angefasst. Bitte beim nächsten Pflegen einen Abschnitt zu diesen Grafiken übernehmen.
* **O-C7:** Die 23 Motive der Consumable Erweiterung (siehe `docs/consumable-design.md`) liegen in `consumableSpritesElixierC.ts` und `consumableSpritesOmenB.ts`. Schwächer geblieben: Zwillingsflamme (zwei kleine Narrenkappen, die rechte nur als Geisterbild), Lichtschleifer (Kappe am Schleifstein, wirkt gedrängt), Abendruhe (die gleitenden Karten sind klein) und Kometenschweif (die halbe Münze liest sich zuerst als Mondsichel). Auf dem iPad prüfen.
