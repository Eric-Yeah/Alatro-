import type { HandType } from '../core/types';

/**
 * Erfolge: eigene Entwürfe im Thema der Sternwarte. Jeder Erfolg hat eine Bedingung (`cond`),
 * die die Auswertung in `src/achievements.ts` prüft, und gibt 1 bis 3 Sterne. Aus den Sternen
 * ergibt sich der Rang des Spielers.
 */

/** Zähler über alle Runs (siehe Profil) */
export type ProfileNumStat =
  | 'runs' | 'wins' | 'losses' | 'hands' | 'discards' | 'blindsWon' | 'bossesBeaten' | 'skips' | 'bestHand' | 'bestAnte'
  | 'jokersBought' | 'rerolls' | 'vouchersBought' | 'moneyPeak';

/** Prüfungen am laufenden Run */
export type RunCheck =
  | 'jokers' | 'money' | 'rareJoker' | 'legendaryJoker' | 'editionJoker' | 'maxHandLevel' | 'skips' | 'rerolls'
  | 'jokersBought' | 'oneHandWins' | 'lastHandWin' | 'rescued' | 'vouchers' | 'consumables' | 'noDiscardWin';

export type Cond =
  | { kind: 'stat'; stat: ProfileNumStat; min: number }
  | { kind: 'handPlayed'; type: HandType }
  | { kind: 'allHands' }
  | { kind: 'winsDeck'; count: number }
  | { kind: 'winStake'; stakeId: string }
  | { kind: 'winScale'; level: number }
  | { kind: 'collection'; fraction: number }
  | { kind: 'daily'; what: 'played' | 'won' | 'days'; min: number }
  | { kind: 'flag'; flag: 'tutorial' }
  | { kind: 'run'; check: RunCheck; min: number };

export type AchievementCategory = 'einstieg' | 'fortschritt' | 'punkte' | 'haende' | 'sammlung' | 'wirtschaft' | 'meister' | 'besonders';

export interface AchievementDef {
  id: string;
  name: string;
  description: string;
  category: AchievementCategory;
  stars: 1 | 2 | 3;
  cond: Cond;
  /** Beschreibung bleibt bis zum Freischalten verborgen */
  secret?: boolean;
}

export const CATEGORY_NAMES: Record<AchievementCategory, string> = {
  einstieg: 'Einstieg',
  fortschritt: 'Fortschritt',
  punkte: 'Punkte',
  haende: 'Hände',
  sammlung: 'Sammlung',
  wirtschaft: 'Wirtschaft',
  meister: 'Meisterschaft',
  besonders: 'Besonderes',
};

export const CATEGORY_ORDER: readonly AchievementCategory[] = ['einstieg', 'fortschritt', 'punkte', 'haende', 'sammlung', 'wirtschaft', 'meister', 'besonders'];

const stat = (s: ProfileNumStat, min: number): Cond => ({ kind: 'stat', stat: s, min });
const run = (check: RunCheck, min = 1): Cond => ({ kind: 'run', check, min });

export const ACHIEVEMENTS: readonly AchievementDef[] = [
  // Einstieg
  { id: 'erster_lichtblick', name: 'Erster Lichtblick', description: 'Spiele deine erste Hand.', category: 'einstieg', stars: 1, cond: stat('hands', 1) },
  { id: 'lehrling', name: 'Lehrling der Sterne', description: 'Schließe die Einführungsrunde ab.', category: 'einstieg', stars: 1, cond: { kind: 'flag', flag: 'tutorial' } },
  { id: 'erste_huerde', name: 'Erste Hürde', description: 'Gewinne einen Blind.', category: 'einstieg', stars: 1, cond: stat('blindsWon', 1) },
  { id: 'kundschaft', name: 'Kundschaft', description: 'Kaufe einen Joker im Shop.', category: 'einstieg', stars: 1, cond: stat('jokersBought', 1) },
  { id: 'abkuerzung', name: 'Abkürzung', description: 'Überspringe einen Blind.', category: 'einstieg', stars: 1, cond: stat('skips', 1) },
  { id: 'erster_boss', name: 'Der erste Schatten', description: 'Besiege einen Boss Blind.', category: 'einstieg', stars: 1, cond: stat('bossesBeaten', 1) },

  // Fortschritt
  { id: 'dritter_himmel', name: 'Dritter Himmel', description: 'Erreiche Ante 3.', category: 'fortschritt', stars: 1, cond: stat('bestAnte', 3) },
  { id: 'fuenf_monde', name: 'Fünf Monde', description: 'Erreiche Ante 5.', category: 'fortschritt', stars: 2, cond: stat('bestAnte', 5) },
  { id: 'sternenmeister', name: 'Sternenmeister', description: 'Gewinne einen Run (Ante 8 besiegt).', category: 'fortschritt', stars: 2, cond: stat('wins', 1) },
  { id: 'jenseits', name: 'Jenseits der Karte', description: 'Erreiche Ante 10 im Endless Modus.', category: 'fortschritt', stars: 2, cond: stat('bestAnte', 10) },
  { id: 'endlose_nacht', name: 'Endlose Nacht', description: 'Erreiche Ante 14.', category: 'fortschritt', stars: 3, cond: stat('bestAnte', 14) },
  { id: 'stammgast', name: 'Stammgast', description: 'Starte 10 Runs.', category: 'fortschritt', stars: 1, cond: stat('runs', 10) },
  { id: 'dauergast', name: 'Dauergast', description: 'Starte 50 Runs.', category: 'fortschritt', stars: 2, cond: stat('runs', 50) },
  { id: 'bestaendig', name: 'Beständig', description: 'Gewinne 5 Runs.', category: 'fortschritt', stars: 2, cond: stat('wins', 5) },
  { id: 'legende', name: 'Legende des Observatoriums', description: 'Gewinne 20 Runs.', category: 'fortschritt', stars: 3, cond: stat('wins', 20) },
  { id: 'lehrgeld', name: 'Lehrgeld', description: 'Verliere einen Run. Es gehört dazu.', category: 'fortschritt', stars: 1, cond: stat('losses', 1) },

  // Punkte
  { id: 'hell_leuchtend', name: 'Hell leuchtend', description: 'Erreiche 1.000 Punkte mit einer einzigen Hand.', category: 'punkte', stars: 1, cond: stat('bestHand', 1_000) },
  { id: 'sternschnuppe', name: 'Sternschnuppe', description: 'Erreiche 10.000 Punkte mit einer Hand.', category: 'punkte', stars: 1, cond: stat('bestHand', 10_000) },
  { id: 'komet', name: 'Komet', description: 'Erreiche 100.000 Punkte mit einer Hand.', category: 'punkte', stars: 2, cond: stat('bestHand', 100_000) },
  { id: 'supernova', name: 'Supernova', description: 'Erreiche 1.000.000 Punkte mit einer Hand.', category: 'punkte', stars: 2, cond: stat('bestHand', 1_000_000) },
  { id: 'urknall', name: 'Urknall', description: 'Erreiche eine Milliarde Punkte mit einer Hand.', category: 'punkte', stars: 3, cond: stat('bestHand', 1_000_000_000) },
  { id: 'ein_schlag', name: 'Ein Schlag', description: 'Gewinne einen Blind mit einer einzigen Hand.', category: 'punkte', stars: 1, cond: run('oneHandWins') },
  { id: 'letzter_druecker', name: 'Auf den letzten Drücker', description: 'Gewinne einen Blind mit deiner allerletzten Hand.', category: 'punkte', stars: 1, cond: run('lastHandWin') },

  // Hände
  { id: 'farbenspiel', name: 'Farbenspiel', description: 'Spiele einen Flush.', category: 'haende', stars: 1, cond: { kind: 'handPlayed', type: 'flush' } },
  { id: 'volles_haus', name: 'Volles Haus', description: 'Spiele ein Full House.', category: 'haende', stars: 1, cond: { kind: 'handPlayed', type: 'fullHouse' } },
  { id: 'vierfach', name: 'Vierfacher Glanz', description: 'Spiele ein Four of a Kind.', category: 'haende', stars: 1, cond: { kind: 'handPlayed', type: 'fourKind' } },
  { id: 'leiter', name: 'Sternenleiter', description: 'Spiele einen Straight Flush.', category: 'haende', stars: 2, cond: { kind: 'handPlayed', type: 'straightFlush' } },
  { id: 'geheimnis', name: 'Geheimnisvoll', description: 'Spiele eine geheime Hand (Five of a Kind, Flush House oder Flush Five).', category: 'haende', stars: 3, cond: { kind: 'handPlayed', type: 'fiveKind' }, secret: true },
  { id: 'alle_haende', name: 'Vollständiger Katalog', description: 'Spiele jede Pokerhand mindestens einmal, auch die geheimen.', category: 'haende', stars: 3, cond: { kind: 'allHands' } },
  { id: 'kartenhai', name: 'Kartenhai', description: 'Spiele insgesamt 100 Hands.', category: 'haende', stars: 1, cond: stat('hands', 100) },
  { id: 'kartenprofi', name: 'Kartenprofi', description: 'Spiele insgesamt 1.000 Hands.', category: 'haende', stars: 2, cond: stat('hands', 1_000) },
  { id: 'kartenlegende', name: 'Kartenlegende', description: 'Spiele insgesamt 5.000 Hands.', category: 'haende', stars: 3, cond: stat('hands', 5_000) },
  { id: 'aufgewertet', name: 'Höhere Sphären', description: 'Bringe eine Pokerhand auf Level 5.', category: 'haende', stars: 1, cond: run('maxHandLevel', 5) },
  { id: 'grosse_sphaere', name: 'Große Sphäre', description: 'Bringe eine Pokerhand auf Level 10.', category: 'haende', stars: 2, cond: run('maxHandLevel', 10) },

  // Sammlung
  { id: 'volle_hand', name: 'Volle Leiste', description: 'Besitze 5 Jokers gleichzeitig.', category: 'sammlung', stars: 1, cond: run('jokers', 5) },
  { id: 'seltene_beute', name: 'Seltene Beute', description: 'Besitze einen Rare Joker.', category: 'sammlung', stars: 1, cond: run('rareJoker') },
  { id: 'sagenhaft', name: 'Sagenhaft', description: 'Besitze einen Legendary Joker.', category: 'sammlung', stars: 2, cond: run('legendaryJoker') },
  { id: 'glanzstueck', name: 'Glanzstück', description: 'Besitze einen Joker mit Edition.', category: 'sammlung', stars: 1, cond: run('editionJoker') },
  { id: 'neugierig', name: 'Neugierig', description: 'Entdecke ein Viertel der Sammlung.', category: 'sammlung', stars: 1, cond: { kind: 'collection', fraction: 0.25 } },
  { id: 'forscher', name: 'Forscher', description: 'Entdecke die Hälfte der Sammlung.', category: 'sammlung', stars: 2, cond: { kind: 'collection', fraction: 0.5 } },
  { id: 'archivar', name: 'Archivar der Sterne', description: 'Entdecke 90 Prozent der Sammlung.', category: 'sammlung', stars: 3, cond: { kind: 'collection', fraction: 0.9 } },
  { id: 'gutachter', name: 'Gutachter', description: 'Besitze 3 Vouchers in einem Run.', category: 'sammlung', stars: 1, cond: run('vouchers', 3) },

  // Wirtschaft
  { id: 'sparfuchs', name: 'Sparfuchs', description: 'Habe 25 Geld gleichzeitig.', category: 'wirtschaft', stars: 1, cond: stat('moneyPeak', 25) },
  { id: 'goldgrube', name: 'Goldgrube', description: 'Habe 60 Geld gleichzeitig.', category: 'wirtschaft', stars: 2, cond: stat('moneyPeak', 60) },
  { id: 'gluecksucher', name: 'Glückssucher', description: 'Würfle den Shop in einem Run 12 Mal neu.', category: 'wirtschaft', stars: 1, cond: run('rerolls', 12) },
  { id: 'kaufrausch', name: 'Kaufrausch', description: 'Kaufe in einem Run 8 Jokers.', category: 'wirtschaft', stars: 1, cond: run('jokersBought', 8) },
  { id: 'alchemist_tasche', name: 'Volle Taschen', description: 'Halte 2 Consumables gleichzeitig.', category: 'wirtschaft', stars: 1, cond: run('consumables', 2) },

  // Meisterschaft
  { id: 'deck_trio', name: 'Dreierlei', description: 'Gewinne mit 3 verschiedenen Decks.', category: 'meister', stars: 2, cond: { kind: 'winsDeck', count: 3 } },
  { id: 'deck_alle', name: 'Deck Meister', description: 'Gewinne mit allen Decks.', category: 'meister', stars: 3, cond: { kind: 'winsDeck', count: 7 } },
  { id: 'sieg_mitternacht', name: 'Mitternachtssieger', description: 'Gewinne auf Mitternacht.', category: 'meister', stars: 2, cond: { kind: 'winStake', stakeId: 'mitternacht' } },
  { id: 'sieg_finsternis', name: 'Finsterer Triumph', description: 'Gewinne auf Finsternis.', category: 'meister', stars: 3, cond: { kind: 'winStake', stakeId: 'finsternis' } },
  { id: 'sieg_ewig', name: 'Ewige Nacht gemeistert', description: 'Gewinne auf Ewige Nacht.', category: 'meister', stars: 3, cond: { kind: 'winStake', stakeId: 'ewige_nacht' } },
  { id: 'stufe_8', name: 'Aufsteiger', description: 'Gewinne auf Stufe 8 der skalierenden Schwierigkeit.', category: 'meister', stars: 2, cond: { kind: 'winScale', level: 8 } },
  { id: 'stufe_12', name: 'Höhenflug', description: 'Gewinne auf Stufe 12 der skalierenden Schwierigkeit.', category: 'meister', stars: 3, cond: { kind: 'winScale', level: 12 } },
  { id: 'stufe_16', name: 'Grenzgänger', description: 'Gewinne auf Stufe 16 der skalierenden Schwierigkeit.', category: 'meister', stars: 3, cond: { kind: 'winScale', level: 16 } },

  // Besonderes
  { id: 'tagesgast', name: 'Tagesgast', description: 'Spiele einen Tageslauf.', category: 'besonders', stars: 1, cond: { kind: 'daily', what: 'played', min: 1 } },
  { id: 'tagessieg', name: 'Tagessieger', description: 'Gewinne einen Tageslauf.', category: 'besonders', stars: 2, cond: { kind: 'daily', what: 'won', min: 1 } },
  { id: 'wochenserie', name: 'Wochenserie', description: 'Spiele an 7 verschiedenen Tagen einen Tageslauf.', category: 'besonders', stars: 2, cond: { kind: 'daily', what: 'days', min: 7 } },
  { id: 'knapp_entkommen', name: 'Knapp entkommen', description: 'Lass einen Joker deine Runde retten.', category: 'besonders', stars: 1, cond: run('rescued'), secret: true },
  { id: 'eilig', name: 'Eilig unterwegs', description: 'Überspringe in einem Run 4 Blinds.', category: 'besonders', stars: 1, cond: run('skips', 4) },
  { id: 'ohne_netz', name: 'Ohne Netz', description: 'Gewinne einen Run, ohne ein einziges Mal abzuwerfen.', category: 'besonders', stars: 3, cond: run('noDiscardWin'), secret: true },
];

/** Gesamtzahl Sterne */
export const TOTAL_STARS = ACHIEVEMENTS.reduce((s, a) => s + a.stars, 0);

/** Ränge nach Anteil der erreichten Sterne, aufsteigend */
export const RANKS: readonly { from: number; name: string; color: number }[] = [
  { from: 0, name: 'Neugieriger Gast', color: 0x9fb4cc },
  { from: 0.06, name: 'Laborhilfe', color: 0xb8d9a8 },
  { from: 0.15, name: 'Sterndeuter', color: 0x7fd0ff },
  { from: 0.28, name: 'Alchemist', color: 0x7fe3b0 },
  { from: 0.42, name: 'Meisteralchemist', color: 0xf5b32b },
  { from: 0.58, name: 'Sternwart', color: 0xff9a1f },
  { from: 0.75, name: 'Hüter des Observatoriums', color: 0xff6aa8 },
  { from: 0.92, name: 'Großmeister der Sterne', color: 0xb26bff },
];

export const ACHIEVEMENT_BY_ID: Record<string, AchievementDef> = Object.fromEntries(ACHIEVEMENTS.map((a) => [a.id, a]));
