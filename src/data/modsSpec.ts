import type { Scaling } from './blinds';
import type { ShopType } from './shop';

/**
 * Deklarative Regeländerungen, gemeinsam genutzt von Vouchers, Decks und Stakes.
 * Zahlen mit "Delta" werden addiert, alle anderen gesetzt.
 */
export interface RunMods {
  handsDelta?: number;
  discardsDelta?: number;
  handSizeDelta?: number;
  jokerSlotsDelta?: number;
  consumableSlotsDelta?: number;
  moneyDelta?: number;
  shopSlotsDelta?: number;
  rerollDelta?: number;
  /** Rabatt Faktor im Shop, z. B. 0.75 */
  discount?: number;
  interestCap?: number;
  /** Faktor für Editions Chancen */
  editionRate?: number;
  scaling?: Scaling;
  smallBlindReward?: number;
  blindTargetFactor?: number;
  balance?: boolean;
  noInterest?: boolean;
  perHandLeft?: number;
  perDiscardLeft?: number;
  /** setzt Gewichte der Kartentypen im Shop */
  typeWeights?: Partial<Record<ShopType, number>>;
  /** Faktor auf Sternbilder in den Consumable Slots, deren Hand gespielt wird */
  sternbildXMult?: number;
  /** Spielkarten im Shop kommen mit Modifikatoren */
  shopCardMods?: boolean;
}
