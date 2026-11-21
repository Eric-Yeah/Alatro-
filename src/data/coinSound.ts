/**
 * Münzklang (Einkassieren, Geld verdienen). Quelle ist die Aufnahme `src/assets/coin.mp3`
 * (vom Eigentümer gelieferte Aufnahme, unverändert bis auf Mono und kurzen Ausklang).
 * Sie spielt immer genau einmal, auch bei großen Beträgen, keine Kaskade.
 */
export const COIN_SOUND = {
  /** Lautstärke der Aufnahme relativ zu den anderen Klängen */
  sampleGain: 0.6,
} as const;
