// Englische Erfolge, Kategorien und Ränge. Überschreibt die Objekte aus src/data/achievements.ts an Ort und Stelle.
import { ACHIEVEMENTS, CATEGORY_NAMES, RANKS, type AchievementCategory } from '../../data/achievements';
import { lazyProp, nameOf } from '../lazy';

/** id: [Name, Beschreibung]. Beschreibungen mit Stufen Namen werden erst beim Lesen gebildet. */
const EN: Record<string, [string, string | (() => string)]> = {
  // Einstieg
  erster_lichtblick: ['First Light', 'Play your first hand.'],
  lehrling: ['Apprentice of the Stars', 'Finish the tutorial run.'],
  erste_huerde: ['First Hurdle', 'Win a Blind.'],
  kundschaft: ['Paying Customer', 'Buy a Joker in the shop.'],
  abkuerzung: ['Shortcut', 'Skip a Blind.'],
  erster_boss: ['The First Shadow', 'Defeat a Boss Blind.'],
  // Fortschritt
  dritter_himmel: ['Third Heaven', 'Reach Ante 3.'],
  fuenf_monde: ['Five Moons', 'Reach Ante 5.'],
  sternenmeister: ['Star Master', 'Win a run (beat Ante 8).'],
  jenseits: ['Beyond the Map', 'Reach Ante 10 in Endless mode.'],
  endlose_nacht: ['Endless Night', 'Reach Ante 14.'],
  stammgast: ['Regular', 'Start 10 runs.'],
  dauergast: ['Resident', 'Start 50 runs.'],
  bestaendig: ['Steadfast', 'Win 5 runs.'],
  legende: ['Observatory Legend', 'Win 20 runs.'],
  lehrgeld: ['Tuition Fee', 'Lose a run. It comes with the territory.'],
  // Punkte
  hell_leuchtend: ['Shining Bright', 'Score 1,000 points with a single hand.'],
  sternschnuppe: ['Shooting Star', 'Score 10,000 points with one hand.'],
  komet: ['Comet', 'Score 100,000 points with one hand.'],
  supernova: ['Supernova', 'Score 1,000,000 points with one hand.'],
  urknall: ['Big Bang', 'Score a billion points with one hand.'],
  ein_schlag: ['One Strike', 'Win a Blind with a single hand.'],
  letzter_druecker: ['Down to the Wire', 'Win a Blind with your very last hand.'],
  // Hände
  farbenspiel: ['Play of Colors', 'Play a Flush.'],
  volles_haus: ['House Party', 'Play a Full House.'],
  vierfach: ['Fourfold Glow', 'Play a Four of a Kind.'],
  leiter: ['Star Ladder', 'Play a Straight Flush.'],
  geheimnis: ['Mysterious', 'Play a secret hand (Five of a Kind, Flush House or Flush Five).'],
  alle_haende: ['Complete Catalog', 'Play every poker hand at least once, the secret ones too.'],
  kartenhai: ['Card Shark', 'Play 100 hands in total.'],
  kartenprofi: ['Card Pro', 'Play 1,000 hands in total.'],
  kartenlegende: ['Card Legend', 'Play 5,000 hands in total.'],
  aufgewertet: ['Higher Spheres', 'Raise a poker hand to level 5.'],
  grosse_sphaere: ['Grand Sphere', 'Raise a poker hand to level 10.'],
  // Sammlung
  volle_hand: ['Full Rack', 'Own 5 Jokers at the same time.'],
  seltene_beute: ['Rare Find', 'Own a Rare Joker.'],
  sagenhaft: ['Fabled', 'Own a Legendary Joker.'],
  glanzstueck: ['Showpiece', 'Own a Joker with an Edition.'],
  neugierig: ['Curious', 'Discover a quarter of the Star Atlas.'],
  forscher: ['Explorer', 'Discover half of the Star Atlas.'],
  archivar: ['Archivist of the Stars', 'Discover 90 percent of the Star Atlas.'],
  gutachter: ['Appraiser', 'Own 3 Vouchers in one run.'],
  // Wirtschaft
  sparfuchs: ['Penny Pincher', 'Hold $25 at the same time.'],
  goldgrube: ['Gold Mine', 'Hold $60 at the same time.'],
  gluecksucher: ['Luck Seeker', 'Reroll the shop 12 times in one run.'],
  kaufrausch: ['Shopping Spree', 'Buy 8 Jokers in one run.'],
  alchemist_tasche: ['Full Pockets', 'Hold 2 Consumables at the same time.'],
  // Meisterschaft
  deck_trio: ['Trio of Decks', 'Win with 3 different Decks.'],
  deck_alle: ['Deck Master', 'Win with every Deck.'],
  sieg_mitternacht: ['Midnight Victor', () => `Win on ${nameOf.stake('mitternacht')}.`],
  sieg_finsternis: ['Triumph in Shadow', () => `Win on ${nameOf.stake('finsternis')}.`],
  sieg_ewig: ['Night Everlasting', () => `Win on ${nameOf.stake('ewige_nacht')}.`],
  stufe_8: ['Climber', 'Win on level 8 of the scaling difficulty.'],
  stufe_12: ['High Flyer', 'Win on level 12 of the scaling difficulty.'],
  stufe_16: ['Edge Walker', 'Win on level 16 of the scaling difficulty.'],
  // Besonderes
  tagesgast: ['Daily Guest', 'Play a Daily Run.'],
  tagessieg: ['Daily Winner', 'Win a Daily Run.'],
  wochenserie: ['Weekly Streak', 'Play a Daily Run on 7 different days.'],
  knapp_entkommen: ['Narrow Escape', 'Let a Joker save your round.'],
  eilig: ['In a Hurry', 'Skip 4 Blinds in one run.'],
  ohne_netz: ['No Safety Net', 'Win a run without discarding even once.'],
};

const CATEGORIES: Record<AchievementCategory, string> = {
  einstieg: 'Getting Started',
  fortschritt: 'Progress',
  punkte: 'Score',
  haende: 'Hands',
  sammlung: 'Collection',
  wirtschaft: 'Economy',
  meister: 'Mastery',
  besonders: 'Special',
};

/** Rangnamen in Reihenfolge von RANKS */
const RANK_NAMES = [
  'Curious Guest', 'Lab Assistant', 'Star Reader', 'Alchemist', 'Master Alchemist', 'Astronomer', 'Keeper of the Observatory', 'Grand Master of the Stars',
];

export default function patch() {
  for (const a of ACHIEVEMENTS) {
    const en = EN[a.id];
    if (!en) continue;
    a.name = en[0];
    if (typeof en[1] === 'string') a.description = en[1];
    else lazyProp(a, 'description', en[1]);
  }
  Object.assign(CATEGORY_NAMES, CATEGORIES);
  RANKS.forEach((r, i) => { if (RANK_NAMES[i]) r.name = RANK_NAMES[i]; });
}
