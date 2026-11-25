/**
 * Pokalsystem: gemeinsame Typen (Vertrag zwischen Logik, Katalog und Oberfläche).
 * Reine Typen und Konstanten ohne Logik. Entwurf und Begründung: `docs/pokale-plan.md`.
 */

/** Kategorien der Kosmetik. Alles ist rein optisch und ändert nie die Spielregeln. */
export type CosmeticCategory = 'back' | 'palette' | 'sky' | 'spark' | 'title';

export const COSMETIC_CATEGORIES: readonly CosmeticCategory[] = ['back', 'palette', 'sky', 'spark', 'title'];

export type CosmeticRarity = 'common' | 'rare' | 'epic' | 'legendary';

export const RARITY_ORDER: readonly CosmeticRarity[] = ['common', 'rare', 'epic', 'legendary'];

/** Kern eines Kosmetik Eintrags. Der Katalog (`src/data/cosmetics.ts`) ergänzt je Kategorie eigene Parameter. */
export interface CosmeticBase {
  id: string;
  category: CosmeticCategory;
  rarity: CosmeticRarity;
  name: string;
  description: string;
}

/** Kein Eintrag ausgerüstet: Standardaussehen (Deckfarbe, Standard Himmel, Standard Funken, kein Titel) */
export const NO_COSMETIC = '';

/** Liga des Pokalpfads (Stufe mit Namen, Farbe und Schwelle) */
export interface LeagueDef {
  id: string;
  name: string;
  /** Pokale, ab denen die Liga beginnt */
  from: number;
  color: number;
  /** Ein Satz Flair Text für die Liga Fanfare */
  flavor: string;
}

/** Ein Eintrag auf dem Hauptpfad: ab `threshold` Gesamtpokalen abholbar */
export interface RoadEntry {
  id: string;
  /** Index der Liga in `LEAGUES` */
  league: number;
  threshold: number;
  /** Kosmetik Id aus dem Katalog */
  reward: string;
}

/** Eine Stufe eines Deck Pfads: ab `threshold` Pokalen mit diesem Deck abholbar */
export interface DeckStage {
  id: string;
  deckId: string;
  /** 1 bis 3 */
  stage: number;
  threshold: number;
  reward: string;
}

/** Zeilenarten der Abrechnung. Der Text kommt aus der Oberfläche, die Logik kennt nur die Art. */
export type TrophyLineKind =
  | 'round'
  | 'lostRound'
  | 'reserve'
  | 'overkill'
  | 'stakeBonus'
  | 'streakBonus'
  | 'dailyBonus'
  | 'winBonus'
  | 'deckFirstWin'
  | 'newBestAnte'
  | 'dailyFirst';

/** Eine verbuchte Zeile: Menge in Pokalen, optional mit Bezug (Ante, Blind, Faktor in Prozent) */
export interface TrophyLine {
  kind: TrophyLineKind;
  amount: number;
  ante?: number;
  blind?: 'small' | 'big' | 'boss';
  /** Prozentwert für Zuschläge (zum Beispiel 25 für +25 Prozent) */
  percent?: number;
}

/** Eintrag im Verlauf abgeschlossener Runs */
export interface TrophyHistoryEntry {
  runId: string;
  at: number;
  deckId: string;
  ante: number;
  won: boolean;
  gained: number;
  /** 'finished' (gewonnen oder verloren) oder 'abandoned' (neuer Run begonnen, alter nicht beendet) */
  end: 'finished' | 'abandoned';
}

/** Buchführung des laufenden Runs (macht die Auswertung idempotent) */
export interface TrophyRunSync {
  runId: string;
  deckId: string;
  /** Schlüssel `ante:blindIndex` der Runden, die schon verbucht sind */
  credited: string[];
  /** Bisher verbuchte Pokale dieses Runs */
  gained: number;
  /** Zeilen der Abrechnung, in Reihenfolge der Verbuchung */
  lines: TrophyLine[];
  /** Faktor der Siegesserie, beim Start des Runs festgehalten (1 = keine) */
  streakFactor: number;
  winPaid: boolean;
  /** Run Ende (Sieg oder Niederlage) ist verbucht */
  ended: boolean;
  /** Höchste Ante, für die schon ein Rekord Zuschlag gezahlt wurde */
  bestAntePaid: number;
}

/** Zustand des Pokalsystems im Profil (`profile.trophies`). Pokale sinken nie. */
export interface TrophyState {
  /** Gesamtpokale über alle Runs */
  total: number;
  /** Pokale je Deck (Schlüssel Deck Id), Summe entspricht `total` */
  byDeck: Record<string, number>;
  /** Abgeholte Pfad Einträge (Id eines RoadEntry oder DeckStage) mit Zeitpunkt */
  claimed: Record<string, number>;
  /** Besessene Kosmetik (Id) mit Zeitpunkt der Freischaltung */
  owned: Record<string, number>;
  /** Ausgerüstet je Kategorie ('' = Standard). Paletten laufen über `settings.cardPalette`, siehe Plan. */
  equipped: Record<CosmeticCategory, string>;
  /** Zeitpunkt der letzten Änderung der Ausrüstung (für den Abgleich zwischen Geräten) */
  equippedAt: number;
  /** Anzahl Runs in Folge mit mindestens `streakMinAnte`, und der beste Wert */
  streak: number;
  bestStreak: number;
  /** Decks, mit denen schon einmal der Premieren Bonus für den ersten Sieg gezahlt wurde (Zeitpunkt) */
  deckFirstWin: Record<string, number>;
  /** Tage (Schlüssel `YYYY-MM-DD`), für die der Tageslauf Bonus gezahlt wurde */
  dailyPaid: Record<string, number>;
  /** Höchste Liga, deren Fanfare der Spieler schon gesehen hat (Index) */
  leagueSeen: number;
  /** Abgeschlossene Runs, neueste zuletzt, begrenzt auf `HISTORY_MAX` */
  history: TrophyHistoryEntry[];
  /** Buchführung des laufenden oder zuletzt beobachteten Runs */
  run: TrophyRunSync | null;
}

/** Wie viele Runs der Verlauf behält */
export const HISTORY_MAX = 30;
