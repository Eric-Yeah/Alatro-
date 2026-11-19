/** Patch Notes. Neueste Version zuerst. Bei jedem Release einen Eintrag oben ergänzen und package.json anpassen. */
export interface PatchNote {
  version: string;
  date: string;
  title: string;
  items: string[];
}

export const PATCH_NOTES: readonly PatchNote[] = [
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
