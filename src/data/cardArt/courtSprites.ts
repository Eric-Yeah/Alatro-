import type { Suit } from '../../core/types';

// Zwölf eigene Figuren der Bildkarten im Thema Sternwarte der Alchemisten.
// Jede Figur besteht aus Kopf mit Kopfbedeckung (halbe Zeilen, 7 Zeichen, werden gespiegelt zu 13 Pixeln),
// Oberkörper (halbe Zeilen, 10 Zeichen, werden gespiegelt zu 19 Pixeln) und einem gehaltenen Gegenstand.
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

export interface Figure {
  /** Name der Figur (für Atlas und Test) */
  name: string;
  head: readonly string[];
  body: readonly string[];
  held: readonly Held[];
}

/** Maße des Figurenrasters (ohne Kontur): Kopf 15 breit und 15 hoch, Oberkörper 19 breit ab Zeile 12 */
export const FIGURE = { w: 19, h: 23, headW: 15, headH: 15, bodyY: 12, bodyRows: 11 };

// Gesichter (8 Zeilen, halbe Zeilen mit 8 Zeichen, die Gesichtsmitte ist Spalte 7)
const FACE_BOY = ['...sssss', '..hsHHss', '..hsskss', '...sssss', '...ssssS', '...ssmmm', '....ssss', '.....sss'];
const FACE_GIRL = ['..hhssss', '.hhsHHss', '.hhsskss', '.hhsssss', '.hhssssS', '.hhssmmm', '..hhssss', '..hhhsss'];
const FACE_KING_LONG = ['...sssss', '..wsHHss', '..wsskss', '..wwssss', '..wwwwwW', '..wwwwww', '...wwwww', '....WWWW'];
const FACE_KING_ROUND = ['...sssss', '..hsHHss', '..hsskss', '..hhssss', '..hhhhhH', '..hhhhhh', '...hhhhh', '....HHHH'];
const FACE_KING_MUST = ['...sssss', '...sHHss', '...sskss', '...ssssS', '.hhhhhhH', '...ssmmm', '....ssss', '.....shH'];
const FACE_KING_MUTTON = ['...sssss', '..hsHHss', '.hhsskss', '.hhhssss', '.hhhhhhH', '.hhhsmmm', '..hhhhhh', '...hhhHH'];
const FACE_HOOD = ['..asssss', '..asHHss', '..asskss', '..asssss', '..assssS', '..assmmm', '...assss', '....asss'];

// Farbsymbol als Brustzeichen (halbe Zeilen mit 3 Zeichen, Mitte rechts), 6 Zeilen
const EMBLEM: Record<Suit, readonly string[]> = {
  S: ['..#', '.##', '###', '###', '..#', '.##'],
  H: ['.#.', '###', '###', '.##', '..#', '...'],
  D: ['..#', '.##', '###', '.##', '..#', '...'],
  C: ['.##', '.##', '###', '##.', '..#', '.##'],
};

/** Oberkörper aus Schulterzeilen (3), Stoffzeilen links (6 mal 5 Zeichen), Mittelfeld (2 Zeichen), Saum (2) und Brustzeichen */
function torso(suit: Suit, top: string[], fabric: string[], panel: string, bottom: string[], emblem = 'T', bg = panel[1]): string[] {
  const mid = fabric.map((f, i) => f + panel + [...EMBLEM[suit][i]].map((c) => (c === '#' ? emblem : bg)).join(''));
  return [...top, ...mid, ...bottom];
}

export const FIGURES: Record<CourtId, Figure> = {
  // ───────────────────────── Pik: Beobachter des Himmels
  SJ: {
    name: 'Fernrohr Gehilfe',
    head: ['.......g', '......aa', '.....Aaa', '....Aaaa', '...Aaaaa', '..Aaaaaa', '.tTtTtTt', ...FACE_BOY],
    body: torso('S', ['......wwww', '....wwWWww', '..bbaaaaww'], ['.bbaA', 'bbaaA', 'bbaAa', 'bbaaa', 'bbaAa', 'bbaaa'], 'cc', ['bbtTtTtTtT', 'bbaaaaabbb']),
    held: [{ x: 0, y: 10, rows: ['.....GG', '....GvG', '...nnG.', '..nnN..', '.nnN...', 'nnN....', 'GG.....'] }],
  },
  SQ: {
    name: 'Mondpriesterin',
    head: ['.yy....g', '.yyy..tT', '..yyytTt', '...yttTt', '..tTtTtT', '..hhhhhh', '.hhhhhhh', ...FACE_GIRL],
    body: torso('S', ['......ssss', '....hhssss', '..hhhbsttT'], ['.hhaa', 'hhaaA', 'hhaaa', 'hhaaA', 'hhaaa', 'hhaaA'], 'cC', ['hhatTtTtTt', 'hbaCcCcCcC'], 'T', 'a'),
    held: [{ x: 15, y: 8, rows: ['.yyy.', 'yy...', 'y....', 'yy...', '.yyy.', '..N..', '..N..', '..N..', '..N..', '..N..', '..N..', '..N..'] }],
  },
  SK: {
    name: 'Sternenkönig',
    head: ['.......y', '.....yyy', '......yy', '.t..t..t', '.tTtTtTt', '.uttgtgt', '.uuuuuuu', ...FACE_KING_LONG],
    body: torso('S', ['......wwww', '...wwwwwww', '..wkwwwkww'], ['.bbcc', 'bbccc', 'bbcCc', 'bbccc', 'bbcCc', 'bbccc'], 'aa', ['bbtttttttT', 'bbcccaaaaa']),
    held: [{ x: 0, y: 4, rows: ['..y..', '.yyy.', 'yyyyy', '.yyy.', '.y.y.', '..d..', '..d..', '..d..', '..d..', '..d..', '..d..', '..d..', '..d..', '..d..', '..d..'] }],
  },
  // ───────────────────────── Herz: Alchemisten
  HJ: {
    name: 'Kolben Lehrling',
    head: ['....hhhh', '..hhhhhh', '.aAaaaaa', '.bbbbbbb', '.GvvvGGG', ...FACE_BOY],
    body: torso('H', ['......ssss', '....wwssss', '..bbawwwww'], ['.bbaA', 'bbaaA', 'bbaAa', 'bbaaa', 'bbaAa', 'bbaaa'], 'cc', ['bbtttttttt', 'bbaaaaaccc']),
    held: [{ x: 15, y: 10, rows: ['.GG..', '..v..', '.vvv.', 'vrrrv', 'vrrrv', '.vvv.'] }],
  },
  HQ: {
    name: 'Alchemistin',
    head: ['.......g', '......aa', '..w...Aa', '..w..Aaa', '..wwaaaa', '.tTtTtTt', '.hhhhhhh', ...FACE_GIRL],
    body: torso('H', ['......ssss', '....wwssss', '..bbwwsttT'], ['.bbaA', 'bbaAa', 'bbaaA', 'bbaAa', 'bbaaA', 'bbaAa'], 'tT', ['bbtTtTtTtT', 'bbaaaccaac'], 'a'),
    held: [{ x: 15, y: 11, rows: ['yyyyy', 'yrrry', '.yry.', '..y..', '..y..', '.yyy.'] }],
  },
  HK: {
    name: 'Großalchemist',
    head: ['..o..o.y', '.ooyooyy', '.tTtTtTt', '.utgtgtg', '.uuuuuuu', ...FACE_KING_ROUND],
    body: torso('H', ['......wwww', '...wwwwwww', '..wwkwwwkw'], ['.bbta', 'bbtaA', 'bbtaa', 'bbtaA', 'bbtaa', 'bbtaA'], 'ww', ['bbtttttttT', 'bbcaaaaaaa'], 'a'),
    held: [{ x: 15, y: 7, rows: ['.ooo.', 'oyyyo', 'oyyyo', 'oyyyo', '.ooo.', '..N..', '..N..', '..N..', '..N..', '..N..', '..N..', '..N..'] }],
  },
  // ───────────────────────── Karo: Goldmacher
  DJ: {
    name: 'Münzjunge',
    head: ['.....ccC', '....cCcc', '...aAaaa', '..Aaaaaa', '.aaaaaaa', '.bbbbbbb', ...FACE_BOY],
    body: torso('D', ['......ssss', '....wwssss', '..bbacacww'], ['.bcac', 'bcaca', 'bacac', 'bcaca', 'bacac', 'bcaca'], 'tt', ['bbtTtTtTtT', 'bbaaaaabbb'], 'a'),
    held: [{ x: 14, y: 13, rows: ['.dddd.', 'dyddDd', 'dydDDd', 'dddDDd', '.DDDD.'] }],
  },
  DQ: {
    name: 'Goldschmiedin',
    head: ['.......g', '......tT', '....tTtT', '..hhhhhh', '.hhhhhhh', ...FACE_GIRL],
    body: torso('D', ['......ssss', '....hhssss', '..hhhbsttt'], ['.hhba', 'hhbaA', 'hhbaa', 'hhbaA', 'hhbaa', 'hhbaA'], 'tT', ['hhbcccccct', 'hbaAcacacT'], 'c', 'a'),
    held: [{ x: 15, y: 9, rows: ['..g..', '.gwg.', 'ggggg', '.ggg.', '..g..', '..d..', '..d..', '..d..'] }],
  },
  DK: {
    name: 'Goldkönig',
    head: ['.g.g...g', '.t.t...t', '.tTtTtTt', '.tgtgtgt', '.uuuuuuu', ...FACE_KING_MUST],
    body: torso('D', ['......ssss', '...tTtTtTt', '..tTtttTtt'], ['.tuaa', 'ttuaA', 'ttuaa', 'ttuaA', 'ttuaa', 'ttuaA'], 'cc', ['bbtttttttT', 'bbaaaaaaaa']),
    held: [{ x: 14, y: 7, rows: ['GGGGGG', 'GFFFFG', 'GGGGGG', '..nn..', '..nn..', '..nn..', '..nn..', '..nn..', '..nn..', '..nn..'] }],
  },
  // ───────────────────────── Kreuz: Kräuterkundige
  CJ: {
    name: 'Kräutersammler',
    head: ['.......a', '......aA', '.....aaa', '....aAaa', '...aAaaa', '..aaAaaa', '..alLlLl', ...FACE_HOOD],
    body: torso('C', ['......ssss', '....aaAAaa', '..bbaaaAAa'], ['.bbaA', 'ccaaA', 'ccaAa', 'ccaaa', 'ccaAa', 'ccaaa'], 'nn', ['bbnnnnnnnT', 'bbaaaaabbb']),
    held: [{ x: 15, y: 13, rows: ['l.l.l', 'lLlLl', '.lLl.', '..n..', '..n..', '..n..'] }],
  },
  CQ: {
    name: 'Kräuterfrau',
    head: ['....l..l', '...l.l.r', '.lLlLlLr', '..hhhhhh', '.hhhhhhh', ...FACE_GIRL],
    body: torso('C', ['......ssss', '....hhssss', '..hhhbsLlL'], ['.hhba', 'hhbaA', 'hhbaa', 'hhbaA', 'hhbaa', 'hhbaA'], 'll', ['hhblLlLlLl', 'hbcCcCcCcc'], 'T', 'a'),
    held: [{ x: 15, y: 13, rows: ['..G..', '.GGG.', 'GyyyG', 'GyoyG', 'GyyyG', '.GGG.'] }],
  },
  CK: {
    name: 'Waldkönig',
    head: ['n..n...y', 'nn.nn.yy', '.nnnn.yy', '..nnntTt', '..tTtTtT', '..uuguug', ...FACE_KING_MUTTON],
    body: torso('C', ['......ssss', '...lLlLlLl', '..lLlllLll'], ['.bbcc', 'bbccc', 'bbcCc', 'bbccc', 'bbcCc', 'bbccc'], 'aa', ['bbtttttttT', 'bbcccaaaaa']),
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
