import type { Suit } from '../../core/types';
import type { FaceKind } from './faceSprites';

// Zwölf eigene Figuren der Bildkarten im Thema Sternwarte der Alchemisten.
// Jede Figur besteht aus Kopfbedeckung (halbe Zeilen, 8 Zeichen), Gesicht (siehe faceSprites.ts, feine Auflösung),
// Oberkörper (halbe Zeilen, 10 Zeichen) und gehaltenen Gegenständen. Hut, Körper und Gegenstände sind im groben
// Entwurfsraster gezeichnet (ein Entwurfspixel = 2 mal 2 Kartenpixel), der Renderer vergrößert sie mit Glättung,
// legt Stofftexturen, Kontur und Schattierung darüber und setzt das feine Gesicht und das Brustzeichen dazu.
// Zeichen: a A b = Gewand (Kartenfarbe, hell, dunkel), c C e = zweite Stofffarbe (mittel, hell, dunkel),
// t T u = Gold oder Besatz (mittel, hell, dunkel), g Edelstein der Farbe, s S Haut (Schatten), w W Weiß (Bart, Pelz, Schatten),
// h H Haar, k Tinte, m Mund. Gegenstände: G F Stahl (hell, dunkel), v Glas, r Rot, y Leuchten, o Flamme,
// n N Holz (hell, dunkel), l L Blatt (hell, dunkel), d D Gold.
// Die untere Hälfte der Karte ist die um 180 Grad gedrehte obere Hälfte.

export type Court = 'J' | 'Q' | 'K';
export type CourtId = `${Suit}${Court}`;

export interface Held {
  rows: readonly string[];
  /** Position in der Figurenhälfte (21 mal 24 Pixel) */
  x: number;
  y: number;
}

/** Hauttöne der Figuren: Haut und Schatten */
export const SKIN_TONES = {
  pale: { skin: 0xf6d2b8, shade: 0xd8967e },
  tan: { skin: 0xe2ab7c, shade: 0xb87a52 },
  brown: { skin: 0xa86c46, shade: 0x7a442a },
} as const;
export type SkinTone = keyof typeof SKIN_TONES;

export interface Figure {
  /** Name der Figur (für Atlas und Test) */
  name: string;
  skin: SkinTone;
  /** Kopfbedeckung im Entwurfsraster (halbe Zeilen, höchstens 7 Zeilen) */
  hat: readonly string[];
  face: FaceKind;
  /** Oberkörper im Entwurfsraster (halbe Zeilen), das Brustzeichen kommt im Renderer dazu */
  body: readonly string[];
  /** Zeichen der Farbe des Brustzeichens */
  emblem: string;
  held: readonly Held[];
}

/** Maße des Figurenrasters (ohne Kontur): Kopf 15 breit und 15 hoch, Oberkörper 19 breit ab Zeile 12 */
export const FIGURE = { w: 19, h: 23, headW: 15, headH: 15, bodyY: 12, bodyRows: 11 };

/** Oberkörper aus Schulterzeilen (3), Stoffzeilen links (6 mal 5 Zeichen), Mittelfeld (2 Zeichen mit Brustfläche), Saum (2) */
function torso(top: string[], fabric: string[], panel: string, bottom: string[], emblem = 'T', bg = panel[1]): { body: string[]; emblem: string } {
  const mid = fabric.map((f) => f + panel + bg.repeat(3));
  return { body: [...top, ...mid, ...bottom], emblem };
}

export const FIGURES: Record<CourtId, Figure> = {
  // ───────────────────────── Pik: Beobachter des Himmels
  SJ: {
    skin: 'pale',
    name: 'Fernrohr Gehilfe',
    hat: ['.......g', '......aa', '.....Aaa', '....Aaaa', '...Aaaaa', '..Aaaaaa', '.tTtTtTt'], face: 'boy',
    ...torso(['......wwww', '....wwWWww', '..bbaaaaww'], ['.ccaA', 'ccaaA', 'ccyaA', 'ccaaA', 'ccaya', 'ccaaA'], 'ww', ['bbtTtTtTtT', 'bcaCaCaCaC'], 'a'),
    held: [{ x: 0, y: 10, rows: ['.....GG', '....GvG', '...nnG.', '..nnN..', '.nnN...', 'nnN....', 'GG.....'] }],
  },
  SQ: {
    skin: 'pale',
    name: 'Mondpriesterin',
    hat: ['.yy....g', '.yyy..tT', '..yyytTt', '...yttTt', '..tTtTtT', '..hhhhhh', '.hhhhhhh'], face: 'girl',
    ...torso(['......ssss', '....hhssss', '..hhhbsttT'], ['.hhaa', 'hhaaA', 'hhaaa', 'hhaaA', 'hhaaa', 'hhaaA'], 'cC', ['hhatTtTtTt', 'hbaCcCcCcC'], 'T', 'a'),
    held: [{ x: 15, y: 8, rows: ['.yyy.', 'yy...', 'y....', 'yy...', '.yyy.', '..N..', '..N..', '..N..', '..N..', '..N..', '..N..', '..N..'] }],
  },
  SK: {
    skin: 'pale',
    name: 'Sternenkönig',
    hat: ['.......y', '.....yyy', '......yy', '.t..t..t', '.tTtTtTt', '.uttgtgt', '.uuuuuuu'], face: 'kingLong',
    ...torso(['......wwww', '...wwwwwww', '..wkwwwkww'], ['.bbcc', 'bbccy', 'bbcCc', 'bbccy', 'bbcCc', 'bbccy'], 'aa', ['bbtttttttT', 'bbcCcaaAaa']),
    held: [{ x: 0, y: 4, rows: ['..y..', '.yyy.', 'yyyyy', '.yyy.', '.y.y.', '..d..', '..d..', '..d..', '..d..', '..d..', '..d..', '..d..', '..d..', '..d..', '..d..'] }],
  },
  // ───────────────────────── Herz: Alchemisten
  HJ: {
    skin: 'tan',
    name: 'Kolben Lehrling',
    hat: ['....hhhh', '..hhhhhh', '.aAaaaaa', '.bbbbbbb', '.GvvvGGG'], face: 'boy',
    ...torso(['......ssss', '....wwssss', '..bbawwwww'], ['.bbaA', 'bbaaA', 'bbaAt', 'bbaaa', 'bbaAt', 'bbaaa'], 'cc', ['bbtttttttt', 'bbacacacac']),
    held: [{ x: 15, y: 10, rows: ['.GG..', '..v..', '.vvv.', 'vrrrv', 'vrrrv', '.vvv.'] }],
  },
  HQ: {
    skin: 'pale',
    name: 'Alchemistin',
    hat: ['.......g', '......aa', '..w...Aa', '..w..Aaa', '..wwaaaa', '.tTtTtTt', '.hhhhhhh'], face: 'girl',
    ...torso(['......ssss', '....wwssss', '..bbwwsttT'], ['.bbaA', 'bbaAa', 'bbaaA', 'bbaAa', 'bbaaA', 'bbaAa'], 'tT', ['bbtTtTtTtT', 'bbaaaccaac'], 'a'),
    held: [{ x: 15, y: 11, rows: ['yyyyy', 'yrrry', '.yry.', '..y..', '..y..', '.yyy.'] }],
  },
  HK: {
    skin: 'brown',
    name: 'Großalchemist',
    hat: ['..o..o.y', '.ooyooyy', '.tTtTtTt', '.utgtgtg', '.uuuuuuu'], face: 'kingRound',
    ...torso(['......wwww', '...wwwwwww', '..wwkwwwkw'], ['.bbta', 'bbtaA', 'bbtaa', 'bbtaA', 'bbtaa', 'bbtaA'], 'ww', ['bbtttttttT', 'bbcaaaaaaa'], 'a'),
    held: [{ x: 15, y: 7, rows: ['.ooo.', 'oyyyo', 'oyyyo', 'oyyyo', '.ooo.', '..N..', '..N..', '..N..', '..N..', '..N..', '..N..', '..N..'] }],
  },
  // ───────────────────────── Karo: Goldmacher
  DJ: {
    skin: 'tan',
    name: 'Münzjunge',
    hat: ['.....ccC', '....cCcc', '...aAaaa', '..Aaaaaa', '.aaaaaaa', '.bbbbbbb'], face: 'boy',
    ...torso(['......ssss', '....wwssss', '..bbacacww'], ['.bcac', 'bcaca', 'bacac', 'bcaca', 'bacac', 'bcaca'], 'tt', ['bbtTtTtTtT', 'bbaaaaabbb'], 'a'),
    held: [{ x: 14, y: 13, rows: ['.dddd.', 'dyddDd', 'dydDDd', 'dddDDd', '.DDDD.'] }],
  },
  DQ: {
    skin: 'pale',
    name: 'Goldschmiedin',
    hat: ['.......g', '......tT', '....tTtT', '..hhhhhh', '.hhhhhhh'], face: 'girl',
    ...torso(['......ssss', '....hhssss', '..hhhbsttt'], ['.hhba', 'hhbaA', 'hhbaa', 'hhbaA', 'hhbaa', 'hhbaA'], 'tT', ['hhbcccccct', 'hbaAcacacT'], 'c', 'a'),
    held: [{ x: 15, y: 9, rows: ['..g..', '.gwg.', 'ggggg', '.ggg.', '..g..', '..d..', '..d..', '..d..'] }],
  },
  DK: {
    skin: 'brown',
    name: 'Goldkönig',
    hat: ['.g.g...g', '.t.t...t', '.tTtTtTt', '.tgtgtgt', '.uuuuuuu'], face: 'kingMust',
    ...torso(['......ssss', '...tTtTtTt', '..tTtttTtt'], ['.tuaa', 'ttuaA', 'ttuaa', 'ttuaA', 'ttuaa', 'ttuaA'], 'cc', ['bbtttttttT', 'bbaaaaaaaa']),
    held: [{ x: 14, y: 7, rows: ['GGGGGG', 'GFFFFG', 'GGGGGG', '..nn..', '..nn..', '..nn..', '..nn..', '..nn..', '..nn..', '..nn..'] }],
  },
  // ───────────────────────── Kreuz: Kräuterkundige
  CJ: {
    skin: 'pale',
    name: 'Kräutersammler',
    hat: ['.......a', '......aA', '.....aaa', '....aAaa', '...aAaaa', '..aaAaaa', '..alLlLl'], face: 'hood',
    ...torso(['......ssss', '....aaAAaa', '..bbaaaAAa'], ['.bbaA', 'ccaaA', 'ccaAa', 'ccaaa', 'ccaAa', 'ccaaa'], 'nn', ['bbnnnnnnnT', 'bbaaaaabbb']),
    held: [{ x: 15, y: 13, rows: ['l.l.l', 'lLlLl', '.lLl.', '..n..', '..n..', '..n..'] }],
  },
  CQ: {
    skin: 'brown',
    name: 'Kräuterfrau',
    hat: ['....l..l', '...l.l.r', '.lLlLlLr', '..hhhhhh', '.hhhhhhh'], face: 'girl',
    ...torso(['......ssss', '....hhssss', '..hhhbsLlL'], ['.hhba', 'hhbaA', 'hhbaa', 'hhbaA', 'hhbaa', 'hhbaA'], 'll', ['hhblLlLlLl', 'hbcCcCcCcc'], 'T', 'a'),
    held: [{ x: 15, y: 13, rows: ['..G..', '.GGG.', 'GyyyG', 'GyoyG', 'GyyyG', '.GGG.'] }],
  },
  CK: {
    skin: 'tan',
    name: 'Waldkönig',
    hat: ['n..n...y', 'nn.nn.yy', '.nnnn.yy', '..nnntTt', '..tTtTtT', '..uuguug'], face: 'kingMutton',
    ...torso(['......ssss', '...lLlLlLl', '..lLlllLll'], ['.bbcc', 'bbccc', 'bbcCc', 'bbccc', 'bbcCc', 'bbccc'], 'aa', ['bbtttttttT', 'bbcccaaaaa']),
    held: [
      { x: 0, y: 10, rows: ['n...n', 'nnnnn', 'wkwkw', 'nnynn', 'nNnNn', '.n.n.'] },
      { x: 16, y: 8, rows: ['.lll.', 'lLlLl', '..N..', '..N..', '..N..', '..N..', '..N..', '..N..', '..N..'] },
    ],
  },
};

/** Muster im Hintergrund der Bildkarten pro Farbe */
export const COURT_PATTERN: Record<Suit, 'stars' | 'bubbles' | 'diamonds' | 'leaves'> = {
  S: 'stars',
  H: 'bubbles',
  D: 'diamonds',
  C: 'leaves',
};
