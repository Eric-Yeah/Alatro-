/**
 * Katalog der Kosmetik (Pokalsystem): 69 Einträge in fünf Kategorien. Ids, Namen und Raritäten sind
 * verbindlich (docs/pokale-plan.md). Alles ist rein optisch und ändert nie die Spielregeln.
 * Die Darstellung steht in `src/ui/cosmeticFx.ts`, die Rücken Muster in `src/ui/cardArt/cardBackArt.ts`.
 *
 * Die 34 Titel stehen hier noch einmal als eigene Einträge (Ids und Namen müssen mit `ROAD_TITLES` in
 * `src/data/trophyRoad.ts` übereinstimmen, `src/cosmetics.test.ts` prüft das). Kein Import von dort,
 * damit es keine zirkuläre Abhängigkeit gibt.
 */
import type { CardPaletteId } from './cardArt/cardPalettes';
import { DECKS } from './decks';
import { NO_COSMETIC, type CosmeticBase, type CosmeticCategory, type CosmeticRarity } from './trophyTypes';

// ───────────────────────────────────────────── Parameter je Kategorie

/** Muster der Kartenrücken. 'wappen' ist das Siegel eines Decks (Motiv je Deck, siehe `deckId`). */
export type BackPattern =
  | 'sternenstaub' | 'kupferraute' | 'mondphasen' | 'retorte' | 'astrolabium'
  | 'tierkreis' | 'nebelwirbel' | 'goldadern' | 'sonnenfinsternis' | 'kometenbahn'
  | 'wappen';

export interface BackParams {
  pattern: BackPattern;
  /** 2 bis 4 Farben (0xRRGGBB), die erste ist der Grund, die übrigen die Zeichnung */
  colors: readonly number[];
  /** true: die erste Farbe ist die Deckfarbe des Decks `deckId` (nur Deck Siegel) */
  usesDeckColor: boolean;
  /** Deck, dessen Wappen gezeigt wird (nur Muster 'wappen') */
  deckId?: string;
}

export interface PaletteParams {
  /** Eintrag in `CARD_PALETTES` (und Wert von `settings.cardPalette`) */
  palette: CardPaletteId;
}

/** Farben des Himmels als RGB Tripel 0 bis 1 (wie `MoodDef`), optional wandert der Farbton */
export type Rgb = readonly [number, number, number];
export interface SkyParams {
  deep: Rgb;
  mid: Rgb;
  accent: Rgb;
  /** Farbton wandert als Pendel: Ausschlag in Grad und Dauer eines Umlaufs in Sekunden */
  hueDrift?: { deg: number; periodS: number };
}

/** fest: Töne einer Farbe, multi: mehrere feste Farben, spectrum: die Farben wandern durchs Spektrum */
export type SparkMode = 'fixed' | 'multi' | 'spectrum';
export interface SparkParams {
  /** Farben 0xRRGGBB, nie leer */
  colors: readonly number[];
  mode: SparkMode;
}

export type TitleParams = Record<string, never>;

export interface BackCosmetic extends CosmeticBase { category: 'back'; params: BackParams }
export interface PaletteCosmetic extends CosmeticBase { category: 'palette'; params: PaletteParams }
export interface SkyCosmetic extends CosmeticBase { category: 'sky'; params: SkyParams }
export interface SparkCosmetic extends CosmeticBase { category: 'spark'; params: SparkParams }
export interface TitleCosmetic extends CosmeticBase { category: 'title'; params: TitleParams }

export type Cosmetic = BackCosmetic | PaletteCosmetic | SkyCosmetic | SparkCosmetic | TitleCosmetic;

/** Standard je Kategorie (nichts ausgerüstet): Deckfarbe, Standard Palette, Standard Himmel und Funken, kein Titel */
export const COSMETIC_DEFAULTS: Readonly<Record<CosmeticCategory, string>> = {
  back: NO_COSMETIC, palette: NO_COSMETIC, sky: NO_COSMETIC, spark: NO_COSMETIC, title: NO_COSMETIC,
};

/** Erlaubte Länge eines Titels (freie Titel und Liga Titel). Deck Titel dürfen länger sein, weil der Deck Name dazugehört. */
export const TITLE_MAX_LEN = 24;
export const DECK_TITLE_MAX_LEN = 30;

// ───────────────────────────────────────────── Kartenrücken

const back = (id: string, name: string, rarity: CosmeticRarity, description: string, params: BackParams): BackCosmetic =>
  ({ id, category: 'back', rarity, name, description, params });

const deckColor = (deckId: string): number => DECKS.find((d) => d.id === deckId)?.color ?? 0x5b3fa8;

/** Siegel eines Decks: Grund in Deckfarbe, dazu Heller Ton und ein Besatz Ton für das Wappen */
const seal = (deckId: string, name: string, description: string, light: number, metal: number): BackCosmetic =>
  back(`back_deck_${deckId}`, name, 'rare', description, {
    pattern: 'wappen', colors: [deckColor(deckId), light, metal], usesDeckColor: true, deckId,
  });

const BACKS: readonly BackCosmetic[] = [
  back('back_sternenstaub', 'Sternenstaub', 'common', 'Verstreute Sterne auf tiefem Indigo, wie ein Streifen Himmel.', {
    pattern: 'sternenstaub', colors: [0x1c1a4e, 0x4a4aa8, 0xdfe6ff, 0xffd37a], usesDeckColor: false,
  }),
  back('back_kupferraute', 'Kupferraute', 'common', 'Ein Rautengitter aus getriebenem Kupfer.', {
    pattern: 'kupferraute', colors: [0x4a2414, 0xb8652c, 0xf2b878], usesDeckColor: false,
  }),
  back('back_mondphasen', 'Mondphasen', 'rare', 'Acht Phasen des Mondes in Reihen auf Nachtblau.', {
    pattern: 'mondphasen', colors: [0x101a3e, 0x2e3f86, 0xf2e8b0, 0x8fa4e8], usesDeckColor: false,
  }),
  back('back_retorte', 'Retortenglas', 'rare', 'Ein Kolben mit türkisem Elixier, Blasen steigen auf.', {
    pattern: 'retorte', colors: [0x0b3a44, 0x2ecfc0, 0xbff4ee, 0x1f7f88], usesDeckColor: false,
  }),
  back('back_astrolabium', 'Astrolabium', 'rare', 'Messingringe mit Zeigern und Gradstrichen.', {
    pattern: 'astrolabium', colors: [0x1c2230, 0xd0a040, 0xf4dc90, 0x6a5020], usesDeckColor: false,
  }),
  back('back_tierkreis', 'Tierkreis', 'epic', 'Zwölf Zeichen im Ring um einen Stern.', {
    pattern: 'tierkreis', colors: [0x161233, 0xe0b050, 0xfff0c0, 0x5a3aa0], usesDeckColor: false,
  }),
  back('back_nebelwirbel', 'Nebelwirbel', 'epic', 'Eine Spirale aus Violett und Rosa, wie ein ferner Nebel.', {
    pattern: 'nebelwirbel', colors: [0x1a0f34, 0x6a3aa8, 0xe86ab8, 0xffc0e8], usesDeckColor: false,
  }),
  back('back_goldadern', 'Goldadern', 'epic', 'Verzweigte Goldadern im schwarzen Gestein.', {
    pattern: 'goldadern', colors: [0x08080c, 0xd8a838, 0xfff0a0], usesDeckColor: false,
  }),
  back('back_sonnenfinsternis', 'Sonnenfinsternis', 'legendary', 'Eine dunkle Scheibe, umgeben vom Strahlenkranz der Korona.', {
    pattern: 'sonnenfinsternis', colors: [0x07060c, 0xfff4d0, 0xf0b040, 0xc86020], usesDeckColor: false,
  }),
  back('back_kometenbahn', 'Kometenbahn', 'legendary', 'Schweife in Weiß und Blau ziehen quer über die Nacht.', {
    pattern: 'kometenbahn', colors: [0x0a1636, 0xffffff, 0x8fc8ff, 0x2a5ac8], usesDeckColor: false,
  }),
  seal('nachthimmel', 'Siegel des Nachthimmels', 'Sichelmond und drei Sterne, das Wappen des Nachthimmels.', 0xf4e8b0, 0xb8a8f0),
  seal('glut', 'Siegel der Glut', 'Eine Flamme im Ring, das Wappen des Glutdecks.', 0xffd060, 0xff8a2a),
  seal('tiefsee', 'Siegel der Tiefsee', 'Eine leuchtende Qualle über den Wellen der Tiefsee.', 0xbff4ee, 0x7fe9ff),
  seal('waage', 'Siegel der Waage', 'Die Goldene Waage im Gleichgewicht.', 0xfff0a0, 0x7a5a18),
  seal('alchemist', 'Siegel des Alchemisten', 'Dreieck im Kreis, das Zeichen der Kupferkunst.', 0xf2b878, 0x40d0c0),
  seal('sternenkind', 'Siegel des Sternenkinds', 'Ein strahlender Stern mit Hof und Funken.', 0xe8fff4, 0xffe27a),
  seal('halbmond', 'Siegel des Halbmonds', 'Ein Halbmond mit Kratern über stillem Silber.', 0xf4f6ff, 0x5a6490),
];

// ───────────────────────────────────────────── Paletten

const palette = (id: string, name: string, rarity: CosmeticRarity, description: string, pal: CardPaletteId): PaletteCosmetic =>
  ({ id, category: 'palette', rarity, name, description, params: { palette: pal } });

const PALETTES: readonly PaletteCosmetic[] = [
  palette('pal_bernstein', 'Bernstein', 'rare', 'Honiggold und Harz, Herz und Karo in warmem Rot.', 'bernstein'),
  palette('pal_tintenmeer', 'Tintenmeer', 'rare', 'Tiefes Blau mit Korallenrot, ein nächtlicher Ozean.', 'tintenmeer'),
  palette('pal_mondsilber', 'Mondsilber', 'epic', 'Kühles Silber und Dämmerblau mit Rosenrot.', 'mondsilber'),
  palette('pal_glutkern', 'Glutkern', 'epic', 'Verkohltes Schwarz, durch das rote Glut scheint.', 'glutkern'),
];

// ───────────────────────────────────────────── Himmel

const sky = (id: string, name: string, rarity: CosmeticRarity, description: string, params: SkyParams): SkyCosmetic =>
  ({ id, category: 'sky', rarity, name, description, params });

const SKIES: readonly SkyCosmetic[] = [
  sky('sky_smaragd', 'Smaragdnebel', 'common', 'Grüner Nebel über dem Observatorium.', {
    deep: [0.02, 0.1, 0.09], mid: [0.06, 0.34, 0.26], accent: [0.28, 0.78, 0.52],
  }),
  sky('sky_kupfer', 'Kupferdämmerung', 'common', 'Das letzte Licht im Dach der Kuppel, warm wie Kupfer.', {
    deep: [0.12, 0.06, 0.04], mid: [0.42, 0.22, 0.12], accent: [0.82, 0.5, 0.28],
  }),
  sky('sky_eisfeld', 'Eisfeld', 'rare', 'Klare Frostnacht, eisblau und still.', {
    deep: [0.04, 0.09, 0.17], mid: [0.16, 0.34, 0.5], accent: [0.7, 0.88, 0.98],
  }),
  sky('sky_blutmond', 'Blutmond', 'rare', 'Ein roter Mond färbt den ganzen Himmel.', {
    deep: [0.14, 0.02, 0.04], mid: [0.42, 0.06, 0.08], accent: [0.82, 0.22, 0.14],
  }),
  sky('sky_polarlicht', 'Polarlichtnacht', 'epic', 'Grüne Schleier ziehen über schwarzblauem Grund.', {
    deep: [0.02, 0.06, 0.14], mid: [0.08, 0.36, 0.34], accent: [0.4, 0.95, 0.65],
  }),
  sky('sky_goldstunde', 'Goldene Stunde', 'epic', 'Der Himmel in flüssigem Gold, kurz vor Sonnenuntergang.', {
    deep: [0.14, 0.08, 0.04], mid: [0.52, 0.36, 0.12], accent: [1, 0.8, 0.34],
  }),
  sky('sky_leere', 'Violette Leere', 'epic', 'Tiefes Violett zwischen den Sternen.', {
    deep: [0.06, 0.02, 0.12], mid: [0.26, 0.08, 0.4], accent: [0.7, 0.3, 0.9],
  }),
  sky('sky_sonnenwende', 'Sonnenwende', 'legendary', 'Der Farbton wandert langsam mit der Sonne.', {
    deep: [0.16, 0.05, 0.1], mid: [0.55, 0.22, 0.18], accent: [0.98, 0.7, 0.3], hueDrift: { deg: 70, periodS: 90 },
  }),
];

// ───────────────────────────────────────────── Funken

const spark = (id: string, name: string, rarity: CosmeticRarity, description: string, params: SparkParams): SparkCosmetic =>
  ({ id, category: 'spark', rarity, name, description, params });

const SPARKS: readonly SparkCosmetic[] = [
  spark('spark_gold', 'Goldfunken', 'common', 'Funken in warmem Gold, wie Goldstaub im Kerzenlicht.', {
    mode: 'fixed', colors: [0xffd23f, 0xffe27a, 0xfff0b0, 0xffb830],
  }),
  spark('spark_eis', 'Eiskristalle', 'common', 'Kalte Funken aus Eis und Frost.', {
    mode: 'fixed', colors: [0xbfefff, 0x7fe9ff, 0xe8fbff, 0x9ad0ff],
  }),
  spark('spark_glut', 'Glutregen', 'rare', 'Glühende Funken aus der Esse.', {
    mode: 'fixed', colors: [0xff5a2a, 0xff8a2a, 0xffd060, 0xff3a1a],
  }),
  spark('spark_smaragd', 'Smaragdglanz', 'rare', 'Grüne Funken, kühl wie ein geschliffener Smaragd.', {
    mode: 'fixed', colors: [0x58e89a, 0x7dffb0, 0xb8ffd8, 0x2fc07a],
  }),
  spark('spark_aether', 'Ätherschweif', 'epic', 'Mehrfarbiger Schweif aus reinem Äther.', {
    mode: 'multi', colors: [0xff8ad8, 0x7fe9ff, 0xb48cff, 0xffd37a, 0x7dffb0],
  }),
  spark('spark_prisma', 'Prisma', 'legendary', 'Die Farben wandern im Kreis durchs ganze Spektrum.', {
    mode: 'spectrum', colors: [0xff5a4a, 0xffd23f, 0x7dffb0, 0x7fe9ff, 0xb48cff],
  }),
];

// ───────────────────────────────────────────── Titel

const title = (id: string, name: string, rarity: CosmeticRarity, description: string): TitleCosmetic =>
  ({ id, category: 'title', rarity, name, description, params: {} });

/**
 * Liga Titel, Name wie die Liga (8 Ligen des Pokalpfads). Wortlaut, Ids und Raritäten stimmen mit `ROAD_TITLES`
 * in `src/data/trophyRoad.ts` überein (der Test in `src/cosmetics.test.ts` prüft das).
 */
const LEAGUE_TITLES: readonly TitleCosmetic[] = [
  title('title_liga_1', 'Funkenlehrling', 'common', 'Rang der Liga Funkenlehrling.'),
  title('title_liga_2', 'Retortengehilfe', 'common', 'Rang der Liga Retortengehilfe.'),
  title('title_liga_3', 'Kupferadept', 'rare', 'Rang der Liga Kupferadept.'),
  title('title_liga_4', 'Silbermagister', 'rare', 'Rang der Liga Silbermagister.'),
  title('title_liga_5', 'Mondastronom', 'epic', 'Rang der Liga Mondastronom.'),
  title('title_liga_6', 'Sternendeuter', 'epic', 'Rang der Liga Sternendeuter.'),
  title('title_liga_7', 'Himmelsmeister', 'epic', 'Rang der Liga Himmelsmeister.'),
  title('title_liga_8', 'Weltenkartograf', 'legendary', 'Rang der Liga Weltenkartograf.'),
];

/** Zwölf freie Titel am Pfad, Rarität steigt mit der Liga */
const FREE_TITLES: readonly TitleCosmetic[] = [
  title('title_funkenhueter', 'Funkenhüter', 'common', 'Du lässt keinen Funken verglühen.'),
  title('title_kolbenschwenker', 'Kolbenschwenker', 'common', 'Ruhige Hand, klare Lösung.'),
  title('title_goldkocher', 'Goldkocher', 'rare', 'Aus Blei wird Gold, mit Geduld und Glück.'),
  title('title_nachtwaechter', 'Nachtwächter', 'rare', 'Du bist wach, wenn die Sterne es sind.'),
  title('title_sternzaehler', 'Sternzähler', 'epic', 'Jeder Stern ist erfasst, keiner doppelt.'),
  title('title_kometenjaeger', 'Kometenjäger', 'epic', 'Du folgst dem Schweif, wohin er auch führt.'),
  title('title_mondfluesterer', 'Mondflüsterer', 'epic', 'Der Mond verrät dir seine Phasen im Voraus.'),
  title('title_glasblaeser', 'Glasbläser der Sphären', 'epic', 'Du formst Himmelskugeln aus flüssigem Licht.'),
  title('title_schattenwaeger', 'Schattenwäger', 'epic', 'Du wiegst Dunkelheit auf der Goldwaage.'),
  title('title_hueter_der_zeiger', 'Hüter der Zeiger', 'epic', 'Die Uhr der Sterne geht nach dir.'),
  title('title_sonnenzaehmer', 'Sonnenzähmer', 'legendary', 'Selbst die Sonne wartet auf deinen Wink.'),
  title('title_letzter_alchemist', 'Letzter Alchemist', 'legendary', 'Wer nach dir kommt, liest nur noch deine Notizen.'),
];

/** Genitiv Wendungen der Deck Titel, je Deck Id */
const DECK_GENITIVE: Readonly<Record<string, string>> = {
  nachthimmel: 'des Nachthimmels',
  glut: 'des Glutdecks',
  tiefsee: 'des Tiefseedecks',
  waage: 'der Goldenen Waage',
  alchemist: 'des Alchemistendecks',
  sternenkind: 'des Sternenkinds',
  halbmond: 'des Halbmonds',
};

/** Deck Titel: Stufe 1 "Lehrling ..." (common) und Stufe 3 "Meister ..." (epic) für jedes der Decks */
const DECK_TITLES: readonly TitleCosmetic[] = DECKS.flatMap((d) => [
  title(`title_deck_${d.id}_1`, `Lehrling ${DECK_GENITIVE[d.id] ?? `des ${d.name}`}`, 'common', `Erste Stufe des Deck Pfads: ${d.name}.`),
  title(`title_deck_${d.id}_3`, `Meister ${DECK_GENITIVE[d.id] ?? `des ${d.name}`}`, 'epic', `Höchste Stufe des Deck Pfads: ${d.name}.`),
]);

// ───────────────────────────────────────────── Abläufe der Anzeige (Zahlen)

/**
 * Wie stark der ausgerüstete Himmel die Farben einer Stimmung ersetzt (0 = Stimmung bleibt, 1 = nur Himmel).
 * Die Boss Stimmung nimmt weniger vom Himmel an und behält Tempo, Kontrast, Randabdunklung und Pulsieren,
 * damit sie auch unter jedem Himmel erkennbar bleibt.
 */
export const SKY_MIX: Readonly<Record<'menu' | 'small' | 'big' | 'boss' | 'shop', { deep: number; mid: number; accent: number }>> = {
  menu: { deep: 0.85, mid: 0.85, accent: 0.85 },
  small: { deep: 0.82, mid: 0.8, accent: 0.8 },
  big: { deep: 0.82, mid: 0.8, accent: 0.8 },
  boss: { deep: 0.55, mid: 0.4, accent: 0.3 },
  shop: { deep: 0.85, mid: 0.85, accent: 0.85 },
};

/** Dauer eines Umlaufs der Farben beim Funkenmodus 'spectrum' (Sekunden) */
export const SPARK_SPECTRUM_PERIOD_S = 6;

/** Beispielkarten der Paletten Vorschau: Farbe und Rang, so dass alle vier Farben und eine Bildkarte zu sehen sind */
export const PALETTE_PREVIEW_CARDS: readonly { suit: 'S' | 'H' | 'C' | 'D'; rank: 7 | 12 | 14 }[] = [
  { suit: 'S', rank: 14 }, { suit: 'H', rank: 12 }, { suit: 'C', rank: 7 }, { suit: 'D', rank: 14 },
];

// ───────────────────────────────────────────── Zugriff

export const COSMETICS: readonly Cosmetic[] = [
  ...BACKS, ...PALETTES, ...SKIES, ...SPARKS, ...LEAGUE_TITLES, ...FREE_TITLES, ...DECK_TITLES,
];

const BY_ID = new Map<string, Cosmetic>(COSMETICS.map((c) => [c.id, c]));

/** Eintrag zur Id, `undefined` bei unbekannter oder leerer Id (Standard) */
export function getCosmetic(id: string): Cosmetic | undefined {
  return BY_ID.get(id);
}

/** Alle Einträge einer Kategorie in Katalog Reihenfolge */
export function cosmeticsOf(cat: 'back'): readonly BackCosmetic[];
export function cosmeticsOf(cat: 'palette'): readonly PaletteCosmetic[];
export function cosmeticsOf(cat: 'sky'): readonly SkyCosmetic[];
export function cosmeticsOf(cat: 'spark'): readonly SparkCosmetic[];
export function cosmeticsOf(cat: 'title'): readonly TitleCosmetic[];
export function cosmeticsOf(cat: CosmeticCategory): readonly Cosmetic[];
export function cosmeticsOf(cat: CosmeticCategory): readonly Cosmetic[] {
  return COSMETICS.filter((c) => c.category === cat);
}

/** Kosmetik Id einer Karten Palette (null bei Standard und Hoher Kontrast, die immer frei sind) */
export function paletteCosmeticId(pal: CardPaletteId): string | null {
  const c = PALETTES.find((p) => p.params.palette === pal);
  return c ? c.id : null;
}
