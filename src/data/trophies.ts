/**
 * Pokalsystem: alle Zahlen des Verdienstes. Die Rechnung steht in `src/trophies.ts`, Entwurf in `docs/pokale-plan.md`.
 * Reihenfolge der Zuschläge je Runde: Basis, Reserve und Überschuss (additiv auf die Basis), dann Stake,
 * Serie und Tageslauf (jeweils als Faktor auf den bisherigen Stand).
 */

export const TROPHY = {
  /** Basis je Blind Art, bevor der Ante Faktor wirkt */
  baseByBlind: { small: 3, big: 4, boss: 6 } as Record<'small' | 'big' | 'boss', number>,
  /** Ante Faktor für Ante 1 bis 8 (Index 0 ist Ante 1) */
  anteFactors: [1, 1.5, 2, 2.75, 3.75, 5, 6.5, 8] as readonly number[],
  /** Endless: Zuwachs des Ante Faktors je Ante über der letzten Tabellenstufe */
  endlessAnteStep: 1.5,

  /** Trost bei verlorener Runde: Anteil der Basis dieser Runde, mindestens `lostMin` */
  lostShare: 0.25,
  lostMin: 1,

  /** Reserve: Anteil der Rundenbasis je übrig gebliebener Hand, höchstens `reserveMax` */
  reservePerHand: 0.1,
  reserveMax: 0.3,

  /**
   * Überschuss: Zuschlag auf die Rundenbasis, wenn der Rundenpunktestand mindestens `overkillRatio` mal
   * das Ziel erreicht. Eigene Zahl statt `OVERKILL_MIN` (1,25) aus `report.ts`: Die Rückschau zeigt den
   * Überschuss schon bei einem Viertel mehr, das wäre für eine Prämie zu häufig. Das Doppelte ist selten genug.
   */
  overkillRatio: 2,
  overkillBonus: 0.2,

  /**
   * Stake Faktoren der Leiter (Schlüssel Stake Id). Einsteigerstufe und unbekannte Ids zählen 1:
   * Der Zuschlag ist nie negativ, auch wenn die Einsteigerstufe leichter ist.
   */
  stakeFactors: {
    morgenrot: 1,
    daemmerung: 1,
    abend: 1.08,
    mitternacht: 1.2,
    tiefe_nacht: 1.35,
    finsternis: 1.55,
    ewige_nacht: 1.8,
  } as Record<string, number>,
  defaultStakeFactor: 1,
  /** Skalierende Schwierigkeit: Faktor `1 + scaleStep * Stufe` */
  scaleStep: 0.06,

  /** Siegesserie: ab dieser Ante zählt ein Run für die Serie */
  streakMinAnte: 4,
  /** Zuschlag je Serie, Deckel */
  streakStep: 0.04,
  streakCap: 0.2,

  /** Tageslauf: Zuschlag auf alle Pokale des Runs, dazu einmal je Tag diese Prämie */
  dailyShare: 0.25,
  dailyFirst: 30,
  /** Wie viele Tage die Liste der gezahlten Tages Prämien behält (wie der Tageslauf Verlauf) */
  dailyPaidKeep: 30,

  /** Run gewonnen (Ante 8 besiegt), mit Stake Zuschlag */
  winBonus: 120,
  /** Premiere: erster Sieg mit einem Deck, einmal je Deck */
  deckFirstWin: 150,
  /** Neuer Rekord: Pokale je Ante über der bisher höchsten Ante des Spielers, einmal je Ante */
  bestAnteBonus: 8,

  /** Schlüssel in `byDeck` für Pokale, die sich keinem Deck zuordnen lassen (nur zur Heilung kaputter Daten) */
  unknownDeck: 'andere',
};

/** Pokale mit einem Deck, ab denen die Stufen des Deck Pfads abholbar sind (Stufe 1 bis 3) */
export const DECK_THRESHOLDS: readonly number[] = [60, 250, 700];
