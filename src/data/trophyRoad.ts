/**
 * Pokalpfad: Ligen, Hauptpfad (48 Einträge), Deck Pfade (7 mal 3 Stufen) und die Titel dazu.
 * Kosmetik Ids sind verbindlich (Tabelle in `docs/pokale-plan.md`), der Katalog dazu steht in `src/data/cosmetics.ts`.
 * Schwellen sind an einer Simulation kalibriert (siehe `src/trophies.test.ts`, Abschnitt Kalibrierung).
 */
import { DECKS } from './decks';
import { DECK_THRESHOLDS } from './trophies';
import type { CosmeticCategory, CosmeticRarity, DeckStage, LeagueDef, RoadEntry } from './trophyTypes';

/** Gesamtpokale je Eintrag, 6 je Liga. Der erste Eintrag einer Liga liegt genau auf dem Beginn der Liga. */
export const LEAGUE_THRESHOLDS: readonly (readonly number[])[] = [
  [0, 80, 160, 250, 350, 450],
  [550, 660, 780, 900, 1050, 1150],
  [1300, 1450, 1650, 1800, 2000, 2200],
  [2400, 2600, 2800, 3050, 3300, 3550],
  [3850, 4150, 4450, 4800, 5100, 5500],
  [5900, 6300, 6700, 7200, 7700, 8200],
  [8700, 9300, 9900, 10500, 11200, 11900],
  [12700, 13400, 14300, 15200, 16100, 17100],
];

const LEAGUE_META: { id: string; name: string; color: number; flavor: string }[] = [
  { id: 'liga_1', name: 'Funkenlehrling', color: 0xe8a05a, flavor: 'Die ersten Funken springen über, die Nacht ist noch jung.' },
  { id: 'liga_2', name: 'Retortengehilfe', color: 0x4fb3a5, flavor: 'Der Kolben blubbert, und du hältst ihn ruhig.' },
  { id: 'liga_3', name: 'Kupferadept', color: 0xc9703a, flavor: 'Kupfer läuft an, Wissen wird Handwerk.' },
  { id: 'liga_4', name: 'Silbermagister', color: 0xc8d0dc, flavor: 'Silberne Linien ziehen sich durch deine Sternkarten.' },
  { id: 'liga_5', name: 'Mondastronom', color: 0x8fb0e8, flavor: 'Der Mond hört zu, wenn du rechnest.' },
  { id: 'liga_6', name: 'Sternendeuter', color: 0xa87be0, flavor: 'Du liest Bilder in den Sternen, wo andere nur Punkte sehen.' },
  { id: 'liga_7', name: 'Himmelsmeister', color: 0xf0c27a, flavor: 'Die Himmel drehen sich nach deinem Zeiger.' },
  { id: 'liga_8', name: 'Weltenkartograf', color: 0xffd45e, flavor: 'Jede Karte der Nacht trägt jetzt deine Handschrift.' },
];

export const LEAGUES: LeagueDef[] = LEAGUE_META.map((m, i) => ({ ...m, from: LEAGUE_THRESHOLDS[i][0] }));

/**
 * Belohnungen des Hauptpfads je Liga (6 je Liga). Eintrag 1 ist der Liga Titel, der letzte Eintrag das beste Stück
 * der Liga. Der allerletzte Eintrag ist die Krone (Sonnenfinsternis mit Korona).
 */
const LEAGUE_REWARDS: readonly (readonly string[])[] = [
  ['title_liga_1', 'spark_gold', 'back_sternenstaub', 'title_funkenhueter', 'sky_smaragd', 'back_kupferraute'],
  ['title_liga_2', 'spark_eis', 'title_kolbenschwenker', 'sky_kupfer', 'pal_bernstein', 'back_mondphasen'],
  ['title_liga_3', 'spark_glut', 'title_goldkocher', 'sky_eisfeld', 'back_retorte', 'pal_tintenmeer'],
  ['title_liga_4', 'sky_blutmond', 'title_nachtwaechter', 'spark_smaragd', 'back_astrolabium', 'back_tierkreis'],
  ['title_liga_5', 'sky_polarlicht', 'title_sternzaehler', 'pal_mondsilber', 'back_nebelwirbel', 'spark_aether'],
  ['title_liga_6', 'sky_goldstunde', 'title_kometenjaeger', 'pal_glutkern', 'title_mondfluesterer', 'back_kometenbahn'],
  ['title_liga_7', 'sky_leere', 'title_glasblaeser', 'back_goldadern', 'title_schattenwaeger', 'spark_prisma'],
  ['title_liga_8', 'title_hueter_der_zeiger', 'sky_sonnenwende', 'title_sonnenzaehmer', 'title_letzter_alchemist', 'back_sonnenfinsternis'],
];

export const ROAD: RoadEntry[] = LEAGUE_REWARDS.flatMap((rewards, league) =>
  rewards.map((reward, i) => ({ id: `road_${league + 1}_${i + 1}`, league, threshold: LEAGUE_THRESHOLDS[league][i], reward })),
);

/** Wie viele Einträge eine Liga hat */
export const ENTRIES_PER_LEAGUE = 6;

/** Deck Pfad: Stufe 1 Titel, Stufe 2 Kartenrücken mit dem Wappen des Decks, Stufe 3 Titel */
export const DECK_STAGES: DeckStage[] = DECKS.flatMap((d) => [
  { id: `deck_${d.id}_1`, deckId: d.id, stage: 1, threshold: DECK_THRESHOLDS[0], reward: `title_deck_${d.id}_1` },
  { id: `deck_${d.id}_2`, deckId: d.id, stage: 2, threshold: DECK_THRESHOLDS[1], reward: `back_deck_${d.id}` },
  { id: `deck_${d.id}_3`, deckId: d.id, stage: 3, threshold: DECK_THRESHOLDS[2], reward: `title_deck_${d.id}_3` },
]);

// ─────────────────────────────────────────────── Titel (für den Katalog von Agent B)

export interface RoadTitle {
  id: string;
  name: string;
  rarity: CosmeticRarity;
  description: string;
}

/** Liga Titel: Name wie die Liga, Rarität steigt mit der Liga */
const LEAGUE_TITLE_RARITY: CosmeticRarity[] = ['common', 'common', 'rare', 'rare', 'epic', 'epic', 'epic', 'legendary'];

export const LEAGUE_TITLES: RoadTitle[] = LEAGUES.map((l, i) => ({
  id: `title_liga_${i + 1}`,
  name: l.name,
  rarity: LEAGUE_TITLE_RARITY[i],
  description: `Rang der Liga ${l.name}.`,
}));

/** 12 freie Titel am Hauptpfad (Name höchstens 24 Zeichen), Rarität steigt mit der Liga */
export const FREE_TITLES: RoadTitle[] = [
  { id: 'title_funkenhueter', name: 'Funkenhüter', rarity: 'common', description: 'Du lässt keinen Funken verglühen.' },
  { id: 'title_kolbenschwenker', name: 'Kolbenschwenker', rarity: 'common', description: 'Ruhige Hand, klare Lösung.' },
  { id: 'title_goldkocher', name: 'Goldkocher', rarity: 'rare', description: 'Aus Blei wird Gold, mit Geduld und Glück.' },
  { id: 'title_nachtwaechter', name: 'Nachtwächter', rarity: 'rare', description: 'Du bist wach, wenn die Sterne es sind.' },
  { id: 'title_sternzaehler', name: 'Sternzähler', rarity: 'epic', description: 'Jeder Stern ist erfasst, keiner doppelt.' },
  { id: 'title_kometenjaeger', name: 'Kometenjäger', rarity: 'epic', description: 'Du folgst dem Schweif, wohin er auch führt.' },
  { id: 'title_mondfluesterer', name: 'Mondflüsterer', rarity: 'epic', description: 'Der Mond verrät dir seine Phasen im Voraus.' },
  { id: 'title_glasblaeser', name: 'Glasbläser der Sphären', rarity: 'epic', description: 'Du formst Himmelskugeln aus flüssigem Licht.' },
  { id: 'title_schattenwaeger', name: 'Schattenwäger', rarity: 'epic', description: 'Du wiegst Dunkelheit auf der Goldwaage.' },
  { id: 'title_hueter_der_zeiger', name: 'Hüter der Zeiger', rarity: 'epic', description: 'Die Uhr der Sterne geht nach dir.' },
  { id: 'title_sonnenzaehmer', name: 'Sonnenzähmer', rarity: 'legendary', description: 'Selbst die Sonne wartet auf deinen Wink.' },
  { id: 'title_letzter_alchemist', name: 'Letzter Alchemist', rarity: 'legendary', description: 'Wer nach dir kommt, liest nur noch deine Notizen.' },
];

/** Deck Titel: Name im Genitiv, Stufe 1 Lehrling (common), Stufe 3 Meister (epic) */
const DECK_GENITIVE: Record<string, string> = {
  nachthimmel: 'des Nachthimmels',
  glut: 'des Glutdecks',
  tiefsee: 'des Tiefseedecks',
  waage: 'der Goldenen Waage',
  alchemist: 'des Alchemistendecks',
  sternenkind: 'des Sternenkinds',
  halbmond: 'des Halbmonds',
};

export const DECK_TITLES: RoadTitle[] = DECKS.flatMap((d) => [
  { id: `title_deck_${d.id}_1`, name: `Lehrling ${DECK_GENITIVE[d.id]}`, rarity: 'common' as const, description: `Erste Stufe des Deck Pfads: ${d.name}.` },
  { id: `title_deck_${d.id}_3`, name: `Meister ${DECK_GENITIVE[d.id]}`, rarity: 'epic' as const, description: `Höchste Stufe des Deck Pfads: ${d.name}.` },
]);

/** Alle 34 Titel (8 Liga, 12 frei, 14 Deck): Grundlage für den Katalog und für `activeTitle` */
export const ROAD_TITLES: RoadTitle[] = [...LEAGUE_TITLES, ...FREE_TITLES, ...DECK_TITLES];

/** Kategorie einer Kosmetik Id aus ihrem Präfix (null bei unbekannter Id) */
export const COSMETIC_PREFIX: readonly [string, CosmeticCategory][] = [
  ['back_', 'back'],
  ['pal_', 'palette'],
  ['sky_', 'sky'],
  ['spark_', 'spark'],
  ['title_', 'title'],
];

export function categoryOfCosmetic(id: string): CosmeticCategory | null {
  for (const [prefix, cat] of COSMETIC_PREFIX) if (id.startsWith(prefix)) return cat;
  return null;
}
