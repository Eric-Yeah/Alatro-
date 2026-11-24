// Zahlen der Grafikstufe "Supernova" (Version 0.12.0): Partikel, Orbs, Hitze, Callouts, Zeiger Effekte, Staubwolke.
// Alle Zeiten in Millisekunden (Orbs und Callouts laufen mit dem Animationstempo, Partikel in Echtzeit),
// Strecken in Spielfeld Einheiten (1440 mal 1000), Winkel in Radiant, Farben als 0xRRGGBB.

/** Gesamtgrenzen und automatische Dichte Regelung */
export const PARTICLES = {
  /** gleichzeitig lebende Partikel, mehr werden nicht erzeugt */
  max: 700,
  /** Vorrat an fertigen Sprites beim ersten Gebrauch */
  warm: 120,
};

/** Dichte (0 bis 1) skaliert die Anzahl neuer Partikel. Sie sinkt, wenn die Bildzeit im Mittel zu lang ist, und erholt sich langsam. */
export const DENSITY = {
  min: 0.3,
  max: 1,
  /** mittlere Bildzeit in ms, ab der die Dichte fällt (etwa 40 FPS) beziehungsweise wieder steigen darf (etwa 52 FPS) */
  slowMs: 25,
  fastMs: 19.2,
  /** Faktor je Messfenster beim Senken und Erholen */
  down: 0.86,
  up: 1.04,
  /** Messfenster in Bildern */
  windowFrames: 30,
};

/** Partikelfarben */
export const FX_COLORS = {
  chips: 0x3db4ff,
  chipsCore: 0xbfe6ff,
  mult: 0xff5a4a,
  multCore: 0xffd2c2,
  xmult: 0xff9a1f,
  money: 0xffd23f,
  goal: 0x7dffb0,
  holo: 0x7fe9ff,
  violet: 0xb48cff,
  confetti: [0xff5a4a, 0xffd23f, 0x7fe9ff, 0xb48cff, 0x7dffb0, 0xffffff] as readonly number[],
};

/** Orbs: leuchtende Kugeln, die vom Auslöser zur Chips oder Mult Anzeige fliegen */
export const ORB = {
  /** Flugzeit vor dem Tempofaktor */
  flightMs: 300,
  /** Seitliche Ausbuchtung der Flugbahn als Anteil der Strecke */
  bow: 0.28,
  /** Größe der Leuchtkugel (Skalierung der 64 Punkt Textur) */
  size: 0.62,
  /** Abstand der Schweifpunkte in ms und deren Lebensdauer */
  trailEveryMs: 12,
  trailLife: [260, 420] as [number, number],
  /** Orbs je Ereignis: 1 plus eine je Zehnerpotenz des Werts, gedeckelt. Der Versatz streut die Start Zeitpunkte. */
  maxOrbs: 4,
  staggerMs: 55,
  /** Einschlag: Funken, Ring und kurzes Aufleuchten der Anzeige */
  hitSparks: 8,
  hitRing: 1.3,
  hitSparkSpeed: [120, 340] as [number, number],
  hitSparkLife: [260, 520] as [number, number],
};

/** Hitze: steigt mit jedem Zählschritt, kühlt nach der Hand ab. Wirkt auf Hintergrund, Staubwolke und Funken. */
export const HEAT = {
  perStep: 0.1,
  perXMult: 0.2,
  /** Nach dem letzten Anstieg bleibt die Hitze so lange stehen (ms), danach kühlt sie ab: je Sekunde um diesen Wert */
  holdMs: 1100,
  decayPerS: 0.5,
  /** Dichte der Funken pro Ereignis wächst mit der Hitze um bis zu diesen Faktor */
  sparkBoost: 1.8,
};

/** Schockwellen im Hintergrund (Verzerrung und Pixelring) */
export const IMPACT = {
  /** Dauer bis der Ring ausgelaufen ist (Sekunden) */
  seconds: 1.25,
  /** Stärke je Anlass */
  xmult: 0.8,
  total: [0, 0.35, 0.55, 0.8, 1] as readonly number[],
};

/** Wirkung der Gesamtpunkte nach Stufe (gleicher Index wie SCORE_TIERS in data/juice.ts) */
export interface TotalFx {
  /** Ringe, die aus der Gesamtpunkte Anzeige laufen */
  rings: number;
  /** Feuerwerk Salven (je mit Funken in mehreren Farben) */
  bursts: number;
  /** Zoom Stoß der Bühne (Anteil der Größe) und Farbversatz des CRT */
  punch: number;
  aberration: number;
  /** Konfetti Stücke aus der Mitte nach oben */
  confetti: number;
}
export const TOTAL_FX: readonly TotalFx[] = [
  { rings: 0, bursts: 0, punch: 0, aberration: 0, confetti: 0 },
  { rings: 1, bursts: 1, punch: 0.006, aberration: 0.0015, confetti: 0 },
  { rings: 2, bursts: 2, punch: 0.012, aberration: 0.003, confetti: 14 },
  { rings: 3, bursts: 3, punch: 0.02, aberration: 0.0045, confetti: 34 },
  { rings: 4, bursts: 5, punch: 0.032, aberration: 0.007, confetti: 70 },
];

/** Feuerwerk Salve: Funken je Salve, Geschwindigkeit, Schwerkraft, Lebensdauer */
export const FIREWORK = {
  sparks: 26,
  speed: [140, 460] as [number, number],
  gravity: 380,
  life: [600, 1100] as [number, number],
  /** Streuung des Ortes der Salven um die Mitte */
  spread: [230, 120] as [number, number],
  gapMs: 110,
};

/** Callout Wörter nach Verhältnis Gesamtpunkte durch Ziel. Die Wörter stehen in src/i18n/en/ui-game.ts. */
export interface Callout {
  minRatio: number;
  word: string;
  color: number;
  edge: number;
  size: number;
}
export const CALLOUTS: readonly Callout[] = [
  { minRatio: 0.3, word: 'Funke', color: 0xbff4ff, edge: 0x1b6c8f, size: 78 },
  { minRatio: 0.7, word: 'Flamme', color: 0xffd08a, edge: 0xa84a12, size: 88 },
  { minRatio: 1.5, word: 'Komet', color: 0xff9e8f, edge: 0x9c1e2e, size: 100 },
  { minRatio: 3, word: 'Supernova', color: 0xe6c8ff, edge: 0x5a2a9c, size: 112 },
];
export const CALLOUT_FX = {
  /** Buchstaben erscheinen nacheinander: Abstand, Einblenddauer, Stehzeit, Ausblenden */
  letterGapMs: 45,
  popMs: 240,
  holdMs: 650,
  fadeMs: 320,
  /** Aufstieg beim Ausblenden und Höhe über der Spielfläche (Mittelpunkt) */
  rise: 60,
  y: 270,
  /** Wellenbewegung der Buchstaben während das Wort steht */
  waveAmp: 7,
  waveMs: 520,
};

/** Konfettiregen bei gewonnener Runde: Stücke (gesamt), Fallgeschwindigkeit, Dauer des Regens */
export const RAIN = {
  pieces: 120,
  piecesBig: 220,
  fall: [220, 520] as [number, number],
  sway: 90,
  life: [1700, 2800] as [number, number],
  spreadMs: 900,
  /** Münzen in der Fontäne beim Auszahlungsbild */
  coins: 18,
};

/** Zeiger Effekte: Spur und Tipp Funken (keine Ringe) */
export const POINTER = {
  /** Abstand der Spurpunkte in Spielfeld Einheiten */
  trailEveryPx: 11,
  /** höchstens so viele Spurpunkte pro Bild */
  trailPerFrame: 4,
  trailLife: [380, 700] as [number, number],
  trailSize: [0.45, 1.05] as [number, number],
  trailColors: [0x7fe9ff, 0xb48cff, 0xffd37a, 0xffffff] as readonly number[],
  /** Tipp: Funken */
  tapSparks: 9,
  tapSpeed: [90, 260] as [number, number],
  /** Wie lange der Zeiger nach dem Loslassen (Finger) noch als aktiv gilt */
  holdMs: 450,
};

/** Funken Aura um gewählte Karten und Burst beim Wählen */
export const AURA = {
  everyMs: 70,
  life: [420, 760] as [number, number],
  select: { sparks: 12 },
  discard: { puff: 8 },
};

/** Staubwolke (Glühwürmchen) im Hintergrund des Spielfelds */
export const MOTES = {
  count: 38,
  /** Aufstiegsgeschwindigkeit in Einheiten pro Sekunde und seitliches Treiben */
  rise: [5, 17] as [number, number],
  drift: 14,
  size: [0.35, 0.95] as [number, number],
  alpha: [0.25, 0.7] as [number, number],
  /** Ausweichen vor dem Zeiger: Reichweite und Schub */
  pointerRadius: 170,
  pointerPush: 150,
  /** Mit voller Hitze steigen sie um diesen Faktor schneller und leuchten stärker */
  heatSpeed: 2.6,
  heatAlpha: 0.5,
  colors: [0x7fe9ff, 0xffd37a, 0xb48cff] as readonly number[],
};

/** Zoom Stoß der Bühne: Abklingen in ms */
export const PUNCH = { ms: 380 };

/** Farbversatz des CRT klingt in dieser Zeit ab (ms) */
export const ABERRATION_MS = 420;
