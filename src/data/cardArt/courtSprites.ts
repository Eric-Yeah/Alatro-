import type { Suit } from '../../core/types';

// Eigene Figuren der Bildkarten im Thema Sternwarte der Alchemisten.
// Jede Figur ist als halbe Zeile gezeichnet (Spalte 0 bis zur Mitte) und wird gespiegelt.
// Zeichen: a A b = Gewand (Hauptton, hell, dunkel), t T u = Besatz (mittel, hell, dunkel),
// g Edelstein, s S Haut, w W Bart und Kragen, h H Haar und zweiter Stoff, k Tinte, m Mund.
// Die untere Hälfte der Karte ist die um 180 Grad gedrehte obere Hälfte.

export type Court = 'J' | 'Q' | 'K';

/** Obere Hälfte (15 mal 20), halbe Zeilen mit 8 Zeichen */
export const COURT_HALF_ROWS: Record<Court, readonly string[]> = {
  // Bube: junger Gehilfe mit spitzer Sternenkappe und weißem Schal
  J: [
    '.......g',
    '......aA',
    '......aa',
    '.....aaA',
    '.....aaa',
    '....aaaA',
    '...aaaaa',
    '..tTtTtT',
    '....ssss',
    '....sksS',
    '....ssSs',
    '....sskm',
    '.....ssS',
    '..wwwwww',
    '.bbaaAaa',
    'bbaaAAaa',
    'bbaaaaat',
    'bbtttttt',
    'bbaaAaaa',
    'bbbbbbbb',
  ],
  // Dame: Alchemistin mit Diadem, langem Haar und Edelstein Kette
  Q: [
    '.....t.t',
    '....ttTg',
    '...hhhhh',
    '..hhssss',
    '..hhsksS',
    '..hhssSs',
    '..hhssmm',
    '..hhhssS',
    '..hhhhss',
    '.hhhbsss',
    'hhbaaAss',
    'hhbaAtTg',
    'hbbaaaaa',
    'hbaaAaaa',
    'hbaaaaat',
    'hbtttttt',
    'hbaaaaaa',
    'hbaAaaaa',
    'hbaaaaaa',
    'hbbbbbbb',
  ],
  // König: weißer Bart, Sternenkrone, Hermelin Kragen
  K: [
    '...t...t',
    '...tt.tT',
    '...tTtTt',
    '...utttg',
    '....ssss',
    '...wsksS',
    '...wwssS',
    '...wwWWW',
    '...wwwww',
    '..bbwwww',
    '.bbawwww',
    'bbaAAwww',
    'bbaaAAww',
    'bbaaaAAw',
    'bbaaaAAt',
    'bbtttttt',
    'bbaaaaaa',
    'bbaAaaaa',
    'bbaaaaaa',
    'bbbbbbbb',
  ],
};

/** Gehaltener Gegenstand pro Farbe und Rang: Raster und Position (x, y) in der Figurenhälfte (17 mal 21) */
export interface Held {
  rows: readonly string[];
  x: number;
  y: number;
}

// Zusatzzeichen: G Stahl, c Glas, r rote Flüssigkeit, y Leuchten, o Flamme, d Gold, D dunkles Gold,
// n Holz, N dunkles Holz, l Blatt, L dunkles Blatt, p Violett.
export const COURT_HELD: Record<Suit, Record<Court, Held>> = {
  // Pik: Beobachter des Himmels
  S: {
    J: { x: 13, y: 8, rows: ['.GG.', 'GccG', '.nn.', '.nn.', '.nN.', '.nN.', '.GG.', '.GG.', '.GG.', '.GG.'] },
    Q: { x: 12, y: 5, rows: ['.yyy.', 'yy...', 'y....', 'yy...', '.yyy.', '..n..', '..n..', '..n..', '..n..', '..n..', '..n..', '..n..'] },
    K: { x: 12, y: 3, rows: ['..y..', '.yyy.', 'yyyyy', '.yyy.', '.y.y.', '..n..', '..n..', '..n..', '..n..', '..n..', '..n..', '..n..'] },
  },
  // Herz: Alchemisten mit Kolben und Flammen
  H: {
    J: { x: 12, y: 9, rows: ['.GG..', '..c..', '.ccc.', 'crrrc', 'crrrc', '.ccc.', '.....', '.....'] },
    Q: { x: 12, y: 9, rows: ['yyyyy', 'yrrry', '.yyy.', '..y..', '..y..', '.yyy.'] },
    K: { x: 12, y: 4, rows: ['..o..', '.oyo.', 'oyyyo', '.ooo.', '..n..', '..n..', '..n..', '..n..', '..n..', '..n..', '..n..'] },
  },
  // Karo: Goldmacher
  D: {
    J: { x: 12, y: 8, rows: ['.ddd.', 'dyddD', 'ddddD', '.DDD.', '.ddd.', 'dyddD', 'ddddD', '.DDD.'] },
    Q: { x: 12, y: 5, rows: ['..c..', '.cwc.', 'ccccc', '.ccc.', '..c..', '..d..', '..d..', '..d..', '..d..', '..d..'] },
    K: { x: 12, y: 5, rows: ['GGGGG', 'GgggG', 'GGGGG', '..n..', '..n..', '..n..', '..n..', '..n..', '..n..', '..n..', '..n..'] },
  },
  // Kreuz: Kräuterkundige
  C: {
    J: { x: 12, y: 8, rows: ['l..l.', 'lLlLl', '.lLl.', '..n..', '..n..', '..n..', '..n..', '..n..'] },
    Q: { x: 12, y: 7, rows: ['..G..', '.GGG.', 'GyyyG', 'GyyyG', '.GGG.'] },
    K: { x: 12, y: 4, rows: ['.lll.', 'lLlLl', '.lll.', '..n..', '..n..', '..n..', '..n..', '..n..', '..n..', '..n..', '..n..'] },
  },
};

/** Muster im Hintergrund der Bildkarten pro Farbe */
export const COURT_PATTERN: Record<Suit, 'stars' | 'bubbles' | 'diamonds' | 'leaves'> = {
  S: 'stars',
  H: 'bubbles',
  D: 'diamonds',
  C: 'leaves',
};
