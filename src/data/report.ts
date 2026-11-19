// Zahlen für Rückschau, Entdeckungen und Zielmoment. Reine Darstellung, keine Spielregeln.

/** Die Beinahe Zeile erscheint erst ab diesem Anteil des Blind Ziels (darunter wäre sie nur entmutigend) */
export const NEAR_MISS_MIN = 0.3;

/** Überschuss Zeile beim Blind geschafft erscheint ab diesem Verhältnis Punkte durch Ziel */
export const OVERKILL_MIN = 1.25;
/** ab diesem Verhältnis klingt die Fanfare des Überschusses größer */
export const OVERKILL_BIG = 2.5;

/** Tempofaktor, solange man während der Punkte Animation auf den Tisch tippt */
export const TAP_BOOST = 3;
/** So lange wirkt ein Tippen in ms, danach läuft das Tempo wieder normal */
export const TAP_BOOST_MS = 1200;

/** Wie viele neu entdeckte Namen die Rückschau höchstens aufzählt */
export const REPORT_NEW_MAX = 6;

/** Tonhöhen Abstand (Halbtöne über dem Grundton) der Fanfare je Blind Art */
export const BLIND_FANFARE: Record<'small' | 'big' | 'boss', number[]> = {
  small: [0, 4, 7, 12],
  big: [0, 4, 7, 12, 16],
  boss: [0, 3, 7, 12, 15, 19],
};
