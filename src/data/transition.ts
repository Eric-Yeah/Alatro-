// Zahlen für die Übergangsanimation zwischen den großen Screens (Kuppelblende). Reine Darstellung.

export const TRANSITION = {
  /** Die Kuppelhälften schließen sich (ms) */
  closeMs: 320,
  /** Pause bei geschlossener Kuppel: hier wird der Screen getauscht (ms) */
  holdMs: 140,
  /** Die Kuppel öffnet sich wieder (ms) */
  openMs: 460,
  /** Beim ersten Öffnen der App bleibt die Kuppel kurz zu, dann öffnet sie langsamer (ms) */
  introHoldMs: 380,
  introOpenMs: 760,
  /** Zusätzlicher Rand um das Spielfeld in logischen Pixeln, damit auch die Ränder des Fensters bedeckt sind */
  margin: 1000,
  /** Farben der Kuppel */
  body: 0x0a1330,
  rib: 0x16264f,
  ribGap: 110,
  seam: 0xf5b32b,
  glow: 0x5fe3ff,
  glowW: 30,
  glowAlpha: 0.22,
  seamW: 5,
  /** Ring in der Mitte (halb auf jeder Hälfte) */
  ringR: 96,
  ringInnerR: 70,
  ringTicks: 12,
  /** Sterne auf der Kuppel */
  stars: 70,
};
