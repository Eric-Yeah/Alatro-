import { DECKS } from './decks';
import type { RunMods } from './modsSpec';
import { hashString } from '../core/rng';

/**
 * Tageslauf: jeden Tag gibt es einen festen Seed mit festem Deck, einer Stufe der skalierenden
 * Schwierigkeit und einer Tageswandlung (eine zusätzliche Regel). Alles wird aus dem Datum berechnet,
 * zwei Geräte am selben Tag spielen also denselben Run.
 */
export interface TwistDef {
  id: string;
  name: string;
  description: string;
  mods: RunMods;
}

export const TWISTS: readonly TwistDef[] = [
  { id: 'goldregen', name: 'Goldregen', description: 'Zinsdeckel $10, aber nur $2 Startgeld', mods: { interestCap: 10, moneyDelta: -2 } },
  { id: 'vollmond', name: 'Vollmond', description: '+2 Hand Size, Blind Ziele +25%', mods: { handSizeDelta: 2, blindTargetFactor: 1.25 } },
  { id: 'sparflamme', name: 'Sparflamme', description: '+2 Hands, -2 Discards pro Runde', mods: { handsDelta: 2, discardsDelta: -2 } },
  { id: 'luftig', name: 'Luftige Taschen', description: '+2 Consumable Slots, -1 Joker Slot', mods: { consumableSlotsDelta: 2, jokerSlotsDelta: -1 } },
  { id: 'raritaeten', name: 'Raritätenmarkt', description: 'Editions erscheinen dreimal so oft', mods: { editionRate: 3 } },
  { id: 'schnaeppchen', name: 'Schnäppchenjagd', description: 'Alles halb so teuer, aber ein Shop Slot weniger', mods: { discount: 0.5, shopSlotsDelta: -1 } },
  { id: 'wunderladen', name: 'Wunderladen', description: 'Spielkarten im Shop mit Modifikatoren, Reroll startet bei $3', mods: { typeWeights: { karte: 10 }, shopCardMods: true, rerollDelta: -2 } },
];

/** Stufe der skalierenden Schwierigkeit nach Wochentag (0 Sonntag bis 6 Samstag), das Wochenende ist härter */
export const DAILY_LEVELS: readonly number[] = [7, 4, 4, 5, 5, 6, 7];

/** Anzahl Tage, die der Verlauf der Tageslauf Ergebnisse behält */
export const DAILY_HISTORY = 30;

export interface DailySetup {
  /** Datum als JJJJ-MM-TT */
  date: string;
  seed: string;
  deckId: string;
  level: number;
  twistId: string;
}

const SEED_ALPHABET = 'ABCDEFGHIJKLMNPQRSTUVWXYZ123456789';

/** Datum als Schlüssel in lokaler Zeit */
export function dateKey(d: Date = new Date()): string {
  const p = (n: number) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}`;
}

/** Der Lauf eines Tages, rein aus dem Datumsschlüssel berechnet */
export function dailySetup(date: string): DailySetup {
  let seed = '';
  let h = hashString(`alatro-daily-${date}`);
  for (let i = 0; i < 8; i++) {
    seed += SEED_ALPHABET[h % SEED_ALPHABET.length];
    h = Math.floor(h / SEED_ALPHABET.length) || hashString(`${date}-${i}`);
  }
  const day = new Date(`${date}T12:00:00`).getDay();
  return {
    date,
    seed,
    deckId: DECKS[hashString(`deck-${date}`) % DECKS.length].id,
    level: DAILY_LEVELS[Number.isNaN(day) ? 1 : day],
    twistId: TWISTS[hashString(`twist-${date}`) % TWISTS.length].id,
  };
}

export const TWIST_BY_ID: Record<string, TwistDef> = Object.fromEntries(TWISTS.map((t) => [t.id, t]));
