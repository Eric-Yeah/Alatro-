/** Patch Notes. Neueste Version zuerst. Bei jedem Release einen Eintrag oben ergänzen und package.json anpassen. */
export interface PatchNote {
  version: string;
  date: string;
  title: string;
  items: string[];
}

export const PATCH_NOTES: readonly PatchNote[] = [
  {
    version: '0.14.0',
    date: '25.11.2026',
    title: 'Tiefen Look',
    items: [
      'Neu: Das ganze Spiel wirkt räumlicher, im Stil eines Comics. Platten, Felder, Knöpfe, Karten, Jokers, Packs und der Shop haben kräftige flache Farben, dunkle Konturen, einen harten Unterrand, scharfe Schatten und einen kleinen Lichtstreifen oben.',
      'Neu: Knöpfe haben einen dicken Unterrand und drücken sich beim Antippen ein. Anzeigen für Werte sind vertieft, Knöpfe und Platten erhaben, so sieht man auf einen Blick, was man antippen kann.',
      'Neu: Eine gewählte Karte steigt, ihr Schatten bleibt auf dem Tisch und wird weicher. Karten haben eine sichtbare Dicke.',
      'Neu: Der Spieltisch hat eine dezente Filzfläche mit Kartenplätzen, die Fächer für Jokers und Consumables sind vertieft, der Stapel hat Dicke.',
      'Hinweis: Die Schatten sind kleine Texturen ohne Filter und laufen in allen drei Grafikstufen flüssig. Die Pixel Art der Karten und Jokers bleibt scharf.',
    ],
  },
  {
    version: '0.13.0',
    date: '25.11.2026',
    title: 'Pokalpfad und Wunderkammer',
    items: [
      'Neu: Jede gespielte Runde bringt Pokale, umso mehr, je höher die Ante. Zuschläge gibt es für übrige Hands, Überschuss, höhere Stakes, Tageslauf und Siegesserie.',
      'Neu: Der Pokalpfad hat 8 Ligen mit 48 Meilensteinen, dazu je Deck einen Pfad mit 3 Stufen. Belohnungen holst du von Hand ab. Pokale sinken nie.',
      'Neu: In der Wunderkammer rüstest du 69 Stücke aus: Kartenrücken, Kartenfarben, Himmel, Funken (Supernova) und Titel. Alles ist rein optisch.',
      'Neu: Nach jeder gewonnenen Runde siehst du die Pokale, am Run Ende die Abrechnung mit Liga Aufstieg. Die Pokale werden zwischen Geräten abgeglichen.',
    ],
  },
  {
    version: '0.12.1',
    date: '24.11.2026',
    title: 'Supernova ruhiger, neue Optionen',
    items: [
      'Änderung: Supernova ist ruhiger. Tippen wirft keine Ringe mehr, nur noch Funken. Auch beim Wählen einer Karte und beim Erreichen des Ziels gibt es keine Kreise mehr, und am Ende einer Runde keinen großen Kreis.',
      'Änderung: Die Karten wackeln weniger. Sie neigen sich nicht mehr zum Zeiger, und das leichte Schweben ist in Supernova schwächer. Die Extra Effekte (Orbs, Funken, Konfetti, Callouts, Hintergrund) bleiben.',
      'Neu: In den neuen Optionen steht Supernova als dritte Auswahl bei Grafik (Sparsam, Voll, Supernova).',
      'Dazu kommen die Änderungen der Versionen 0.11.2 bis 0.11.5: neue Optionen als eigener Bildschirm, kein Tempo Knopf und kein Deck Knopf mehr in der Seitenleiste, Layout Korrekturen.',
    ],
  },
  {
    version: '0.12.0',
    date: '24.11.2026',
    title: 'Grafikstufe Supernova',
    items: [
      'Neu: Dritte Grafikstufe "Supernova" in den Optionen unter Grafik (Sparsam, Voll, Supernova). Sie ist Voll plus ein ganzes Feuerwerk an Effekten und reagiert auf Berührung.',
      'Neu: Beim Zählen fliegen leuchtende Kugeln von der Karte oder dem Joker zur Chips und Mult Anzeige. Der Einschlag lässt die Anzeige pulsieren, X Mult löst eine Schockwelle aus. Je länger die Kette, desto heißer wird das Bild.',
      'Neu: Große Hände zünden ein Callout Wort (Funke, Flamme, Komet, Supernova) mit Ringen, Feuerwerk, Konfetti, Zoom Stoß und Farbversatz. Ziel erreicht und gewonnene Runde bekommen Konfetti.',
      'Neu: Das Bild spielt mit. Finger und Maus hinterlassen Sternenstaub, Tippen wirft Ringe, Karten in der Nähe heben sich und neigen sich zum Zeiger, gewählte Karten funkeln, Glühwürmchen weichen dem Zeiger aus.',
      'Neu: Der Hintergrund bekommt Nebelschleier, Polarlicht, Sternschnuppen, ein Leuchten am Zeiger und Schockwellen mit Verzerrung.',
      'Hinweis: Supernova braucht mehr Leistung. Sinkt die Bildrate, nimmt die Zahl der Partikel automatisch ab. Auf älteren Geräten bleibt Voll oder Sparsam die bessere Wahl. Zoom Stoß und Blitz folgen der Option Screen Shake.',
    ],
  },
  {
    version: '0.11.5',
    date: '24.11.2026',
    title: 'Aufgeräumte Seitenleiste',
    items: [
      'Änderung: Der Deck Knopf in der Seitenleiste ist weg. Das Deck öffnest Du über den Stapel am Tisch, in der Blind Auswahl oder in der Run Info.',
      'Besser: Die Felder der linken Seitenleiste haben gleichmäßige Abstände, Menü und Run Info sitzen mit Luft darunter.',
    ],
  },
  {
    version: '0.11.4',
    date: '24.11.2026',
    title: 'Tempo nur in den Optionen',
    items: [
      'Änderung: Der Tempo Knopf am Spieltisch ist weg. Das Animationstempo stellst Du jetzt nur noch in den Optionen unter Spiel ein.',
    ],
  },
  {
    version: '0.11.3',
    date: '24.11.2026',
    title: 'Neue Optionen',
    items: [
      'Neu: Die Optionen sind ein eigener Bildschirm statt eines Fensters. Links vier Bereiche (Anzeige, Ton, Spiel, Daten), rechts die Einstellungen als übersichtliche Karten.',
      'Neu: Echte Schalter für An und Aus, Schieberegler für Lautstärke und Musiklautstärke (ziehen oder antippen) und Auswahlleisten für Grafik, Kartenfarben, Musik, Tempo und Sprache.',
    ],
  },
  {
    version: '0.11.2',
    date: '24.11.2026',
    title: 'Layout Korrekturen',
    items: [
      'Fix: Neuer Run: Seed und Start Knopf überlappen nicht mehr, der Start Knopf liegt im Fenster.',
      'Fix: Die Optionen haben mehr Abstand zwischen den Zeilen, Knöpfe und Texte stoßen nicht mehr aneinander.',
      'Fix: Geräte koppeln: Die Tasten überdecken die Knöpfe Löschen, Einfügen und Koppeln nicht mehr, das Codefeld zeigt immer alle fünf Gruppen und springt beim Tippen nicht.',
      'Fix: Bei breiten Fenstern (Mac, iPad quer) endet die Abdunklung hinter Fenstern nicht mehr an einer harten Kante.',
    ],
  },
  {
    version: '0.11.1',
    date: '22.11.2026',
    title: 'Ein Sortierknopf',
    items: [
      'Besser: Rank und Suit sind jetzt ein Knopf. Jeder Tipp wechselt die Sortierung der Hand, die Beschriftung zeigt die aktive.',
    ],
  },
  {
    version: '0.11.0',
    date: '21.11.2026',
    title: '150 Jokers, mehr Consumables',
    items: [
      'Neu: 71 neue Jokers, jetzt gibt es 150. Sie haben eigene Bilder und decken neue Ideen ab: Handarten, Suits, Geld, Boss Blinds, wachsende Werte, Echo und vier neue Legendary.',
      'Neu: 23 neue Consumables, 13 Elixiere und 10 Omen. Sie verändern Ränge, Suits, Editions, Jokers, Tags und mehr. Starke Karten erscheinen etwas seltener.',
      'Neu: Einige Jokers kennen jetzt die Ante und den Blind, etwa Mutprobe, Gezeitenkalender und Weltenwanderer.',
    ],
  },
  {
    version: '0.10.2',
    date: '21.11.2026',
    title: 'Münzklang, neu gewählt',
    items: [
      'Besser: Neuer Münzklang. Er erklingt jetzt immer genau einmal, wenn Du Geld einsammelst, ohne Kaskade und ohne einzelne Klänge je Auszahlungszeile.',
    ],
  },
  {
    version: '0.10.1',
    date: '21.11.2026',
    title: 'Neuer Münzklang',
    items: [
      'Besser: Der Münzklang ist jetzt eine echte Aufnahme und viel tiefer und wärmer als vorher, nicht mehr so schrill. Bei mehreren Münzen rieseln sie weiter nacheinander.',
    ],
  },
  {
    version: '0.10.0',
    date: '21.11.2026',
    title: 'Schwebende Karten, Deck, Englisch',
    items: [
      'Neu: Das Spiel gibt es jetzt komplett auf Deutsch und auf Englisch. In den Optionen unter "Sprache" wechseln, das Spiel lädt dabei neu. Das gilt auch für alle Jokers, Consumables, Erfolge, die Einführung und die Patch Notes.',
      'Neu: Die Karten schweben ganz leicht auf dem Tisch. In der Grafikstufe Sparsam ist das abgeschaltet.',
      'Besser: Karten werden mit einem Bogenflug und Umdrehen ausgeteilt und beim Rundenende, Spielen und Verwerfen wieder eingezogen. Der Stapel zuckt dabei mit.',
      'Neu: Deck ansehen. Tippe auf den Stapel, auf den Knopf "Deck" in der Seitenleiste oder in der Run Info. Du siehst alle Karten mit Modifikatoren und, was noch im Nachziehstapel liegt.',
      'Neu: Sternbilder zeigen, was das Level up bringt: neues Level, Chips und Mult davor und danach. Im Slot, im Pack, im Shop und im Atlas.',
      'Neu: Münzklang beim Einkassieren, bei Auszahlungen, Geld von Jokers und beim Verkaufen.',
      'Neu: Ein Joker Pack bei vollen Joker Slots bietet jetzt "Tauschen". Du ersetzt einen eigenen Joker, der alte wird verkauft.',
    ],
  },
  {
    version: '0.9.0',
    date: '19.11.2026',
    title: 'Geräte koppeln',
    items: [
      'Neu: Du kannst jetzt auf mehreren Geräten mit demselben Stand spielen. In den Optionen unter "Geräte koppeln" erzeugst Du auf dem ersten Gerät einen Kopplungscode und gibst ihn auf den anderen Geräten ein. Ein Konto brauchst Du dafür nicht.',
      'Neu: Profil, Sammlung und der laufende Run wandern mit. Die Daten liegen verschlüsselt in der Cloud, ohne Deinen Code kann sie niemand lesen. Schreib Dir den Code auf, ohne ihn kommst Du nicht mehr an den Cloud Stand.',
      'Neu: Ein Run aus der Cloud wird nur am Home Bildschirm geladen, nie mitten in einer Runde. Laufen auf zwei Geräten verschiedene Runs, fragt das Spiel, welcher gelten soll.',
      'Neu: In den Optionen unter "Spielstand" kannst Du Profil, Sammlung und Run als Datei oder Text sichern und wieder einlesen. Das dient auch als Backup.',
    ],
  },
  {
    version: '0.8.3',
    date: '19.11.2026',
    title: 'Ladekarte',
    items: [
      'Neu: Der Übergang zwischen den Screens ist jetzt eine Ladekarte. Der Bildschirm blendet ins Nachtblau, in der Mitte fällt eine Karte ein und lädt mit einem goldenen Balken, dann dreht sie sich um und die Blende löst sich auf. Das gilt beim Öffnen der App und beim Wechsel zwischen Home Bildschirm und Spiel. Die Kuppelblende aus 0.8.1 ist entfernt.',
      'Besser: Der Übergang läuft ruhiger, ein Wechsel dauert etwa zweieinhalb Sekunden. Berührungen sind währenddessen gesperrt, das Animationstempo aus den Optionen gilt auch hier.',
    ],
  },
  {
    version: '0.8.2',
    date: '19.11.2026',
    title: 'Kräftigere Zahlen und Symbole',
    items: [
      'Besser: Zahlen und Buchstaben in den Ecken der Karten sind größer und haben dickere Striche, damit man Rang und Farbe auf einen Blick erkennt.',
      'Besser: Die Symbole in der Mitte der Zahlenkarten haben eine dunkle Kontur und heben sich klarer ab.',
    ],
  },
  {
    version: '0.8.1',
    date: '19.11.2026',
    title: 'Kuppelblende',
    items: [
      'Neu: Übergangsanimation zwischen den großen Screens. Beim Öffnen der App und beim Wechsel zwischen Home Bildschirm und Spiel (neuer Run, Fortsetzen, Einführung, Menü) schließen sich zwei Hälften der Sternwarten Kuppel und öffnen sich wieder. Während der Blende sind Berührungen gesperrt. Das Animationstempo aus den Optionen gilt auch hier.',
    ],
  },
  {
    version: '0.8.0',
    date: '19.11.2026',
    title: 'Pixel Art für alles',
    items: [
      'Neu: Alle 52 Spielkarten im Pixel Art Stil. Bube, Dame und König sind zwölf eigene Figuren aus der Sternwarte der Alchemisten, die Asse leuchten mit Glanz und Funken, die Pips sind größer. In den Optionen wählst du die Kartenfarben: Standard oder Hoher Kontrast.',
      'Neu: Alle 79 Jokers haben ein eigenes Pixel Art Bild. Die Editionen Schimmer, Prisma, Aura und Schatten bleiben sichtbar.',
      'Neu: Alle 42 Consumables sind eigene Karten mit Rahmen und Titelband, Sternbilder in Mitternachtsblau, Elixiere in Smaragd, Omen in Violett.',
      'Neu: Neue Booster Packs als Siegelhüllen, fünf Arten in Normal, Jumbo und Mega, dazu ein Voucher Ticket. Packs und seltene Karten funkeln, beim Antippen springen sie auf, und das Öffnen eines Packs platzt mit Blitz und Funken auf. Die Option Sparsam und Screen Shake aus dämpfen die Effekte.',
      'Besser: Die Consumable Leiste zeigt bei drei oder mehr Karten alle Motive und Namen, in zwei Reihen. Der Sternenatlas zeigt entdeckte Einträge jetzt mit ihrem Bild.',
    ],
  },
  {
    version: '0.7.1',
    date: '19.11.2026',
    title: 'Musik im Wechsel',
    items: [
      'Neu: Mix ist jetzt die Standard Musik. Die drei Stücke wechseln sich ab, jedes bleibt etwa zwei Minuten und wird weich ins nächste überblendet. Du kannst in den Optionen weiterhin ein einzelnes Stück wählen.',
      'Neu: Bei großen Effekten (Aufschlag der Punkte, Fanfaren, Erfolge, Pack öffnen) wird die Musik kurz leiser gezogen, damit der Effekt frei steht.',
      'Besser: Die Flächen klingen breiter im Stereobild, es gibt ruhigere Akkorde mit wenigen Glocken, und ein Hochpass nimmt jedes Dröhnen aus Hall und Echo. Alle Stücke sind gleich laut.',
      'Besser: In der Grafikstufe Sparsam läuft die Musik in einer leichteren Variante, das schont Akku und Rechenleistung.',
    ],
  },
  {
    version: '0.7.0',
    date: '19.11.2026',
    title: 'Hintergrundmusik',
    items: [
      'Neu: Ruhige, mystische Hintergrundmusik ohne Beat und ohne Bass. Weiche Flächen, vereinzelte Glockenklänge und ein leiser Hauch, alles live im Spiel erzeugt und endlos.',
      'Drei Stücke zur Wahl in den Optionen: Sternenglas (hell, Glasklänge), Mondlabor (dunkel, ferne Spieluhr) und Sphärenklang (tief, Klangschalen). Die Musik hat eine eigene Lautstärke und lässt sich ausschalten.',
      'Die Musik pausiert, wenn die App im Hintergrund ist.',
    ],
  },
  {
    version: '0.6.2',
    date: '19.11.2026',
    title: 'Neuer Titel',
    items: [
      'Neu: Der Titel ALATRO im Hauptmenü besteht jetzt aus sechs Spielkarten, die beim Öffnen nacheinander hingeworfen werden. Berühr eine Karte, dann hebt sie sich. Tipp auf den Titel dreht alle Karten um, ein zweiter Tipp dreht sie zurück.',
      'Neu: Eigene Titelschrift für die Buchstaben auf den Karten, kantig und schwer, mit Vierzackstern im A und im O.',
    ],
  },
  {
    version: '0.6.1',
    date: '19.11.2026',
    title: 'Vibration',
    items: [
      'Neu: Vibration bei Berührungen, Zählschritten, X Mult, dem Aufschlag der Gesamtpunkte, Shop, Consumables, Sieg und Niederlage. Je höher der Treffer, desto kräftiger. In den Optionen abschaltbar.',
      'Hinweis: Android Geräte vibrieren voll. Auf dem iPhone gibt es nur ein leichtes Tippen bei Berührungen, das iPad hat keinen Vibrationsmotor.',
    ],
  },
  {
    version: '0.6.0',
    date: '19.11.2026',
    title: 'Sternenatlas, Siegel und Rückschau',
    items: [
      'Neu: Die Sammlung heißt jetzt Sternenatlas. Oben steht der Gesamtfortschritt, neue Funde tragen ein NEU Schild, und noch unbekannte Einträge zeigen einen Hinweis, wo man sie findet. Auf dem Hauptmenü zeigt der Atlas Knopf den Fortschritt und leuchtet bei neuen Funden.',
      'Neu: Im Run erscheint ein Hinweis, sobald etwas Neues in den Atlas kommt.',
      'Neu: Siegel am Deck. Im Run Setup siehst du pro Deck die höchste Stufe der Leiter, auf der du gewonnen hast, und das nächste Ziel. Nichts ist gesperrt, es ist nur ein Ziel.',
      'Neu: Sofort nochmal nach einem Run startet mit denselben Einstellungen und einem neuen Seed. Die Rückschau zeigt, wie viele Punkte bis zum Ziel fehlten (ab 30 Prozent) und was neu im Atlas ist.',
      'Neu: Beim Hochzählen klingt ein heller Ton, sobald das Ziel des Blinds erreicht ist. Wer das Ziel deutlich übertrifft, sieht den Überschuss und hört eine größere Fanfare. Die Fanfare klingt für Small, Big und Boss Blind verschieden.',
      'Neu: Tippen während der Punkte Animation beschleunigt sie kurz.',
      'Behoben: Die Sammlung zeigte bei Jokers rohe Platzhalter wie {mult}. Zu hohe Fenster werden nun auf den Bildschirm eingepasst.',
    ],
  },
  {
    version: '0.5.0',
    date: '19.11.2026',
    title: 'Erfolge, Einführung und Schwierigkeit',
    items: [
      'Neu: Erfolge mit Sternen und Rang. Über 60 Erfolge in acht Kategorien, mit Fortschrittsbalken und einer Statistik über alle Runs. Beim Freischalten erscheint oben ein Banner.',
      'Neu: Geführte Einführungsrunde. Beim ersten Start bietet Astra eine kurze Runde an, in der du Pair, Discard, Flush, Shop und Joker echt spielst. Wiederholbar über das Hauptmenü.',
      'Neu: Skalierende Schwierigkeit mit 20 Stufen. Das Blind Ziel wächst fein, ab bestimmten Stufen kommen Regeln dazu. Die feste Leiter der Stakes bleibt wählbar.',
      'Neu: Die Stufe Morgenrot ist etwas leichter als das Grundspiel (Ziele 25% niedriger, 1 Discard mehr) und die Vorbelegung für neue Spieler.',
      'Neu: Tageslauf mit festem Seed, Deck, Stufe und einer Tageswandlung. Dein bestes Ante pro Tag wird gemerkt.',
      'Neu: Rückschau nach jedem Run mit Rekorden, Erfolgen und einem Tipp. Nach einem Sieg gibt es einen Knopf für die nächsthärtere Stufe, nach einer Niederlage den Neustart mit gleichem Seed. Ein neuer Bestwert pro Hand wird sofort gemeldet.',
      'Geändert: Ziel Faktoren verschiedener Quellen (Stufe, Deck, Wandlung) multiplizieren sich. Spielstände werden automatisch auf Version 5 übernommen.',
    ],
  },
  {
    version: '0.4.0',
    date: '19.11.2026',
    title: 'Durchgesehen und aufgeräumt',
    items: [
      'Neu: Der Shop zeigt in der Seitenleiste den nächsten Blind und die Regel des Bosses. Ein Hinweis in der ersten Runde erklärt das Auswählen der Karten.',
      'Neu: Karten zeigen den Namen ihrer Edition und einen Buchstaben im Seal. Das Game Over zeigt Meistgespieltes und Jokers.',
      'Neu: Dunklere Nachtpalette mit mehr Sternen, im Shop mit warmem Messing Ton. Das Spielfeld achtet auf Statusleiste und Home Indikator.',
      'Behoben: Abgeschnittene Boss Regel, zu lange Punktzahlen und Kartennamen, falscher Consumable Zähler, zu kleine Knöpfe in Detail Karten.',
      'Balance: Hehler kostet $7 und zahlt $8 beim Verkauf (vorher ein sicherer Gewinn).',
    ],
  },
  {
    version: '0.3.3',
    date: '19.11.2026',
    title: 'Jokers auf einen Blick',
    items: [
      'Neu: Farbige Beschreibungen. Chips sind blau, Mult rot, X Mult als rote Pille, Geld gold, dazu Hands, Discards, Suits und Handnamen in eigenen Farben.',
      'Neu: Bedingungen ("wenn die Hand ...", "Jede gewertete Karte") sind violett abgesetzt, aktuelle Werte wachsender Jokers grün.',
      'Neu: Kleine farbige Marken auf jeder Joker Karte zeigen die Wirkung: C Chips, M Mult, X X Mult, $ Geld, R Retrigger, W wächst, P passiv.',
      'Neu: Der Joker Tooltip nennt die Wirkungen mit Namen und sagt, wann der Joker wirkt.',
      'Gilt auch im Shop, in Packs, bei Consumables, in der Sammlung und in der Run Info.',
    ],
  },
  {
    version: '0.3.2',
    date: '19.11.2026',
    title: 'Neuer Shop',
    items: [
      'Neu: Der Shop hat ein eigenes Layout. Links Next Round und Reroll, oben die Karten Slots, unten der Voucher im eigenen Fach und die Booster Packs als Folienbeutel.',
      'Neu: Leuchtschild SHOP mit blinkenden Glühbirnen in der Seitenleiste.',
      'Neu: Preise hängen als Fahne über jedem Artikel. Ein Tipp auf einen Artikel hebt ihn an und zeigt Name, Beschreibung und die Knöpfe Kaufen, Nutzen, Einlösen oder Öffnen. Ein Tipp ins Leere schließt die Karte wieder.',
      'Artikel fallen beim Betreten des Shops nacheinander in ihre Fächer.',
    ],
  },
  {
    version: '0.3.1',
    date: '19.11.2026',
    title: 'Weichere Schrift',
    items: [
      'Geändert: Die Schrift ist kräftiger, schmaler und hat abgerundete Ecken. Sie wirkt nicht mehr stufig gepixelt, aber auch nicht glatt und perfekt, sondern leicht handgemacht.',
    ],
  },
  {
    version: '0.3.0',
    date: '18.11.2026',
    title: 'Pixel Schrift und Hologramm Look',
    items: [
      'Neu: Eigene Pixel Schrift für Titel, Zahlen, Knöpfe und Namen, inklusive Umlauten und Kartensymbolen. Längere Beschreibungen bleiben gut lesbar.',
      'Neu: Klare, flache Flächen mit harten Konturen und dünnen Leuchtlinien wie bei einem Hologramm.',
      'Neu: Hintergrund aus harten Farbstufen mit weichem Leuchten und kleinen Sternen.',
      'Neu: Hologramm Effekt mit kühlem Farbton, feinem Farbsaum, leichten Scanlines und einem Lichtband, das langsam über das Bild wandert. Ohne Wölbung und Rauschen, das Bild bleibt scharf. Abschaltbar in den Optionen.',
      'Karten (Spielkarten, Joker, Consumables) behalten ihr bisheriges Design.',
      'Text wird bei jeder Fenstergröße scharf gezeichnet.',
    ],
  },
  {
    version: '0.2.1',
    date: '18.11.2026',
    title: 'Home Bildschirm',
    items: [
      'Neu: Vollbild Home Bildschirm beim Start mit Fortsetzen, Neuer Run, Sammlung, Anleitung, Optionen und Neuigkeiten.',
      'Fortsetzen zeigt Ante, Geld, Deck und Stake des gespeicherten Runs.',
      'Neuer Run hat jetzt einen Zurück Knopf zum Home Bildschirm.',
    ],
  },
  {
    version: '0.2.0',
    date: '18.11.2026',
    title: 'Tempo, Anleitung und Patch Notes',
    items: [
      'Neu: Animationstempo bis 10x. Stufen 1x, 1,5x, 2x, 3x, 5x und 10x, einstellbar in den Optionen und mit dem Tempo Knopf am Tisch, auch mitten im Run.',
      'Neu: Anleitung im Hauptmenü mit allen Grundlagen: Ziel, Runde, Chips mal Mult, Blinds, Shop, Jokers und Verbesserungen.',
      'Neu: Patch Notes. Nach einem Update erscheinen sie einmal automatisch, danach über Neuigkeiten im Hauptmenü.',
      'Neu: Stimmung pro Blind, CRT Effekt, Screen Shake und Aufblitzen in Stufen nach Score.',
      'Neu: Sound mit steigender Tonhöhe beim Zählen, Lautstärke einstellbar.',
      'Neu: Glanz für Editions und eigene Embleme für Jokers.',
      'Optionen: CRT, Screen Shake, Lautstärke, Grafikstufe Sparsam für ältere Geräte und FPS Anzeige.',
      'Seed Eingabe ohne Verwechslung von O und 0.',
    ],
  },
  {
    version: '0.1.0',
    date: '18.11.2026',
    title: 'Erster spielbarer Stand',
    items: [
      'Kompletter Spielablauf: Blind Auswahl mit Skip und Tags, Runden, Boss Blinds, Shop, Booster Packs und Vouchers.',
      '79 eigene Jokers, dazu Sternbilder, Elixiere und Omen als Consumables.',
      'Sieben Decks und sechs Stakes, Seeds für reproduzierbare Runs.',
      'Run Info mit Händen, Blinds, Vouchers und Deck, dazu die Sammlung aller entdeckten Inhalte.',
      'Speichern und Fortsetzen, als App auf dem iPad installierbar.',
    ],
  },
];

export const APP_VERSION = PATCH_NOTES[0].version;
