/** Gemeinsame Typen von Engine und Daten. Keine Logik. */

export type Suit = 'S' | 'H' | 'D' | 'C';
/** 2 bis 10, 11 = Jack, 12 = Queen, 13 = King, 14 = Ace */
export type Rank = 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9 | 10 | 11 | 12 | 13 | 14;

export interface Card {
  id: number;
  suit: Suit;
  rank: Rank;
  /** Schlüssel aus data/modifiers.ts */
  enhancement?: string;
  seal?: string;
  edition?: string;
  /** dauerhafte Zusatz Chips (z. B. durch Joker Effekte) */
  extraChips?: number;
  /** durch Boss Effekte geschwächt: zählt für die Erkennung, liefert aber nichts */
  debuffed?: boolean;
}

export type HandType =
  | 'highCard' | 'pair' | 'twoPair' | 'threeKind' | 'straight' | 'flush'
  | 'fullHouse' | 'fourKind' | 'straightFlush' | 'fiveKind' | 'flushHouse' | 'flushFive';

export type BlindKind = 'small' | 'big' | 'boss';

export type Rarity = 'common' | 'uncommon' | 'rare' | 'legendary';

/** Ergebnis eines Effekts. Die Engine wendet es an und protokolliert es als ScoreEvent. */
export interface Effect {
  chips?: number;
  mult?: number;
  xMult?: number;
  money?: number;
  /** zusätzliche Auswertungen einer Karte (nur in der Retrigger Phase) */
  retrigger?: number;
  message?: string;
  // Joker Effekte mit Folgen für den Run (werden von der Engine angewendet)
  /** Enhancement von Karten dauerhaft setzen */
  setEnhancement?: { cardId: number; enhancement: string }[];
  /** der Joker zerstört sich selbst (ignoriert bei Kopien) */
  destroySelf?: boolean;
  /** erzeugt einen zufälligen Joker dieser Rarity, wenn ein Slot frei ist */
  createJoker?: Rarity;
  /** Hands bzw. Discards der laufenden Runde */
  handsDelta?: number;
  discardsDelta?: number;
  /** gratis Rerolls im aktuellen Shop */
  freeRerolls?: number;
  /** verhindert die Niederlage (Phase rescue) */
  rescue?: boolean;
}

/** Regeln der Hand Erkennung, werden von Jokers gesetzt. */
export interface DetectRules {
  /** Flush und Straight brauchen nur 4 Karten */
  fourFingers?: boolean;
  /** Straights dürfen Lücken von je einem Rang haben */
  shortcut?: boolean;
  /** Herz und Karo bzw. Pik und Kreuz gelten als dieselbe Suit */
  smeared?: boolean;
  /** alle gespielten Karten scoren */
  splash?: boolean;
  /** jede Karte gilt als Face Card */
  allFace?: boolean;
}
