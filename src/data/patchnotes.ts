/** Patch Notes. Neueste Version zuerst. Bei jedem Release einen Eintrag oben ergänzen und package.json anpassen. */
export interface PatchNote {
  version: string;
  date: string;
  title: string;
  items: string[];
}

export const PATCH_NOTES: readonly PatchNote[] = [
  {
    version: '0.3.1',
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
