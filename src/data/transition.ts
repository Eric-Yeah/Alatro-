// Zahlen für die Übergangsanimation zwischen den großen Screens (Ladekarte). Reine Darstellung.

export const TRANSITION = {
  /** Der Bildschirm blendet ins Nachtblau (ms) */
  fadeInMs: 320,
  /** Die Karte fällt in die Mitte (ms) */
  cardInMs: 420,
  /** Ladebalken füllt sich, dahinter wird der Screen getauscht (ms) */
  loadMs: 900,
  /** Umdrehen der Karte, je Hälfte (ms) */
  flipMs: 150,
  /** Die Vorderseite bleibt kurz stehen (ms) */
  revealMs: 240,
  /** Die Blende löst sich auf (ms) */
  fadeOutMs: 520,
  /** Beim Öffnen der App steht die Karte schon, danach wie oben (ms) */
  introHoldMs: 250,
  introLoadMs: 1100,
  introFadeOutMs: 800,
  /** Zusätzlicher Rand um das Spielfeld in logischen Pixeln, damit auch die Fensterränder bedeckt sind */
  margin: 1000,
  /** Farben und Maße */
  body: 0x0a1330,
  /** weicher Schein hinter der Karte: Ringe mit je kleiner Deckkraft ergeben einen Verlauf */
  halo: 0x7a5cff,
  haloSteps: 8,
  haloStepAlpha: 0.03,
  haloR: 230,
  stars: 70,
  /** Karte: Startversatz nach oben, Startgröße, Wiegen (Bogenmaß), Höhe der Kartenmitte */
  cardDropY: -70,
  cardStartScale: 0.8,
  sway: 0.045,
  cardY: 470,
  /** Ladebalken unter der Karte */
  barW: 240,
  barH: 12,
  barGap: 46,
  /** Kartenvorderseite: Buchstabe und Suit */
  faceChar: 'A',
  faceSuit: 'H' as const,
};
