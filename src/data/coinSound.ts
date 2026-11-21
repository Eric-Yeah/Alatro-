/**
 * Münzklang (Einkassieren, Geld verdienen). Hauptquelle ist die Aufnahme `src/assets/coin.mp3`
 * (eigene Aufnahme, um 14 Halbtöne abgesenkt, Höhen beschnitten, auf 0,84 s gekürzt).
 * Die Synthese darunter dient nur als Ersatz, solange die Aufnahme noch lädt oder nicht lesbar ist:
 * Ein Klirren besteht dort aus einem kurzen Anschlag (Rauschen) und drei unharmonischen Teiltönen
 * wie bei Metall. Bei mehreren Münzen rieseln die Klirren gestaffelt mit leicht schwankender Tonhöhe.
 */
export const COIN_SOUND = {
  /** Aufnahme: Lautstärke relativ zu den anderen Klängen */
  sampleGain: 0.9,
  /** Grundton eines Klirrens in Hz */
  baseHz: 880,
  /** Verhältnisse der Teiltöne zum Grundton (unharmonisch, klingt nach Metall) */
  partials: [1, 2.76, 5.4],
  /** Lautstärke je Teilton (leiser nach oben) */
  partialGain: [0.1, 0.06, 0.03],
  /** Ausklingzeit je Teilton in Sekunden (hohe Töne verklingen schneller) */
  partialDecay: [0.32, 0.18, 0.1],
  /** Anschlag: Rauschstoß */
  click: { freq: 7200, dur: 0.025, gain: 0.07 },
  /** Zweiter Ton leicht darüber, macht aus dem Klirren ein "Ching" (Verhältnis, Verzögerung in Sekunden) */
  ching: { ratio: 1.335, delay: 0.07, gain: 0.7 },
  /** Mehrere Münzen: Abstand in Sekunden, größte Anzahl hörbarer Klirren, zufällige Schwankung der Tonhöhe (Anteil) */
  burst: { spacing: 0.055, maxCoins: 7, pitchJitter: 0.05, fade: 0.8 },
  /** Anzahl Klirren je Dollar eines Betrags (gerundet, mindestens eins, höchstens `burst.maxCoins`) */
  coinsPerDollar: 0.5,
} as const;
