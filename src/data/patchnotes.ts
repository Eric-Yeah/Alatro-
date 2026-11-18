/** Patch Notes. Neueste Version zuerst. Bei jedem Release einen Eintrag oben ergänzen und package.json anpassen. */
export interface PatchNote {
  version: string;
  date: string;
  title: string;
  items: string[];
}

export const PATCH_NOTES: readonly PatchNote[] = [
  {
    version: '0.2.0',
    date: '18.11.2026',
    title: 'Tempo, Anleitung und Patch Notes',
    items: [
      'Neu: Animationstempo. Das Spiel lässt sich auf 1,5x, 2x, 3x, 5x oder 10x beschleunigen. Das gilt für Kartenbewegungen, die Score Animation, Shop und Menüs.',
      'Neu: Tempo Knopf am Tisch. Ein Tipp schaltet das Tempo weiter, auch mitten im Run.',
      'Neu: Optionen im Hauptmenü mit Tempo Auswahl. Die Einstellung bleibt gespeichert.',
      'Neu: Anleitung mit allen Grundlagen: Ziel, Runde, Chips mal Mult, Blinds, Shop, Jokers und Verbesserungen.',
      'Neu: Patch Notes. Nach einem Update erscheinen sie einmal automatisch, danach über den Neuigkeiten Knopf im Hauptmenü.',
      'Die Version steht klein im Hauptmenü.',
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
