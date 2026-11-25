/**
 * Pokalpfad Oberfläche: reine Teile ohne Pixi (Texte der Abrechnung, Knoten Positionen, Scroll Grenzen,
 * Fortschritt der Deck Stufen, Seiten des Verlaufs). Getestet in `trophyViewMath.test.ts`.
 */
import { BLIND_NAMES } from '../data/blinds';
import { ENTRIES_PER_LEAGUE } from '../data/trophyRoad';
import { TROPHY_LAYOUT } from '../data/trophyLayout';
import type { TrophyLine, TrophyLineKind } from '../data/trophyTypes';
import { t } from '../i18n';

// ───────────────────────────────────────────── Texte der Abrechnung

/** Reihenfolge der Zeilenarten in zusammengefassten Abrechnungen */
export const LINE_ORDER: readonly TrophyLineKind[] = [
  'round', 'lostRound', 'reserve', 'overkill', 'stakeBonus', 'streakBonus', 'dailyBonus', 'winBonus', 'deckFirstWin', 'newBestAnte', 'dailyFirst',
];

const blindName = (b: TrophyLine['blind']) => (b ? BLIND_NAMES[b] : '');

/** Text einer einzelnen verbuchten Zeile (Spielbegriffe Englisch: Ante, Small Blind, Big Blind, Boss Blind, Stake) */
export function trophyLineText(line: TrophyLine): string {
  const ante = line.ante ?? 0;
  const blind = blindName(line.blind);
  const pct = line.percent ?? 0;
  switch (line.kind) {
    case 'round':
      return ante && blind ? t('Runde gewonnen: Ante {ante}, {blind}', { ante, blind }) : t('Runde gewonnen');
    case 'lostRound':
      return ante && blind ? t('Trost: Ante {ante}, {blind}', { ante, blind }) : t('Trost für die verlorene Runde');
    case 'reserve':
      return pct ? t('Reserve: übrige Hands (+{pct} Prozent)', { pct }) : t('Reserve: übrige Hands');
    case 'overkill':
      return pct ? t('Überschuss (+{pct} Prozent)', { pct }) : t('Überschuss');
    case 'stakeBonus':
      return pct ? t('Stake Bonus (+{pct} Prozent)', { pct }) : t('Stake Bonus');
    case 'streakBonus':
      return pct ? t('Siegesserie (+{pct} Prozent)', { pct }) : t('Siegesserie');
    case 'dailyBonus':
      return pct ? t('Tageslauf (+{pct} Prozent)', { pct }) : t('Tageslauf');
    case 'winBonus':
      return t('Run gewonnen');
    case 'deckFirstWin':
      return t('Premiere: erster Sieg mit dem Deck');
    case 'newBestAnte':
      return ante ? t('Neuer Rekord: Ante {ante}', { ante }) : t('Neuer Rekord');
    case 'dailyFirst':
      return t('Prämie des Tageslaufs');
  }
}

/** Kurzname einer Zeilenart, für zusammengefasste Zeilen */
function kindName(kind: TrophyLineKind): string {
  switch (kind) {
    case 'round': return t('Runden gewonnen');
    case 'lostRound': return t('Trost');
    case 'reserve': return t('Reserve');
    case 'overkill': return t('Überschuss');
    case 'stakeBonus': return t('Stake Bonus');
    case 'streakBonus': return t('Siegesserie');
    case 'dailyBonus': return t('Tageslauf');
    case 'winBonus': return t('Run gewonnen');
    case 'deckFirstWin': return t('Premiere');
    case 'newBestAnte': return t('Neuer Rekord');
    case 'dailyFirst': return t('Prämie des Tageslaufs');
  }
}

export interface TrophyRow {
  kind: TrophyLineKind | 'rest';
  text: string;
  amount: number;
}

/**
 * Fasst die Zeilen eines Runs nach Art zusammen (Summe je Art, mehrfach vorkommende mit Anzahl) und kürzt auf
 * höchstens `maxRows` Zeilen: die größten Posten bleiben, der Rest steht als eine Zeile "Weitere Zeilen".
 * Zeilen mit Menge 0 fallen weg. Reihenfolge der Ausgabe nach `LINE_ORDER`, "Weitere" ganz unten.
 */
export function summarizeLines(lines: readonly TrophyLine[], maxRows: number): TrophyRow[] {
  const groups = new Map<TrophyLineKind, { count: number; amount: number; first: TrophyLine }>();
  for (const l of lines) {
    if (l.amount === 0) continue;
    const g = groups.get(l.kind);
    if (g) {
      g.count++;
      g.amount += l.amount;
    } else {
      groups.set(l.kind, { count: 1, amount: l.amount, first: l });
    }
  }
  const rows: TrophyRow[] = [...groups.entries()]
    .sort((a, b) => LINE_ORDER.indexOf(a[0]) - LINE_ORDER.indexOf(b[0]))
    .map(([kind, g]) => ({
      kind,
      amount: g.amount,
      text: g.count === 1 ? trophyLineText(g.first) : t('{name} ({n}x)', { name: kindName(kind), n: g.count }),
    }));
  const max = Math.max(1, Math.floor(maxRows));
  if (rows.length <= max) return rows;
  // Die größten max-1 Posten behalten, den Rest zusammenfassen
  const keep = new Set([...rows].sort((a, b) => b.amount - a.amount).slice(0, max - 1));
  const rest = rows.filter((r) => !keep.has(r));
  const shown = rows.filter((r) => keep.has(r));
  shown.push({ kind: 'rest', amount: rest.reduce((s, r) => s + r.amount, 0), text: t('Weitere Zeilen ({n})', { n: rest.length }) });
  return shown;
}

/** Pokale der zuletzt verbuchten Runde (von der letzten Zeile "Runde gewonnen" an), ohne Run Boni (Sieg, Premiere) */
export function lastRoundAmount(lines: readonly TrophyLine[]): number {
  let start = -1;
  lines.forEach((l, i) => { if (l.kind === 'round') start = i; });
  if (start < 0) return 0;
  return lines.slice(start).filter((l) => l.kind !== 'winBonus' && l.kind !== 'deckFirstWin').reduce((s, l) => s + l.amount, 0);
}

/** Summe aller Zeilen */
export function sumAmounts(lines: readonly TrophyLine[]): number {
  return lines.reduce((s, l) => s + l.amount, 0);
}

// ───────────────────────────────────────────── Pfad: Positionen und Scrollen

const R = TROPHY_LAYOUT.road;

export interface RoadNode {
  index: number;
  league: number;
  /** Platz innerhalb der Liga (0 bis 5) */
  slot: number;
  x: number;
  y: number;
}

/** Breite eines Liga Abschnitts */
export function sectionWidth(): number {
  return ENTRIES_PER_LEAGUE * R.pitch + 2 * R.sectionPad;
}

/** Linke Kante des Abschnitts einer Liga */
export function sectionX(league: number): number {
  return league * sectionWidth();
}

/** Gesamtbreite des Pfads */
export function roadContentWidth(leagueCount: number): number {
  return leagueCount * sectionWidth();
}

/** Positionen der Knoten (Mitte der Kachel) in Inhalts Koordinaten, Kacheln wechseln zwischen oberer und unterer Reihe */
export function roadNodes(entries: readonly { league: number }[]): RoadNode[] {
  const slots = new Map<number, number>();
  return entries.map((e, index) => {
    const slot = slots.get(e.league) ?? 0;
    slots.set(e.league, slot + 1);
    return {
      index,
      league: e.league,
      slot,
      x: sectionX(e.league) + R.sectionPad + (slot + 0.5) * R.pitch,
      y: R.rowYs[index % R.rowYs.length],
    };
  });
}

/** Scroll Wert (0 = ganz links) in die gültigen Grenzen bringen */
export function clampScroll(scroll: number, contentW: number, viewW: number): number {
  return Math.max(0, Math.min(Math.max(0, contentW - viewW), scroll));
}

/** Scroll Wert, der die Stelle `centerX` in die Mitte des Ausschnitts bringt */
export function focusScroll(centerX: number, contentW: number, viewW: number): number {
  return clampScroll(centerX - viewW / 2, contentW, viewW);
}

/** Welcher Eintrag zuerst ins Bild gehört: der erste abholbare, sonst der erste gesperrte, sonst der letzte */
export function focusIndex(states: readonly ('locked' | 'ready' | 'claimed')[]): number {
  const ready = states.indexOf('ready');
  if (ready >= 0) return ready;
  const locked = states.indexOf('locked');
  if (locked >= 0) return locked;
  return Math.max(0, states.length - 1);
}

/** Waagerechte Stelle der Gesamtpokale auf dem Pfad: zwischen den Knoten linear verteilt, am Ende auf dem letzten */
export function markerX(total: number, xs: readonly number[], thresholds: readonly number[]): number {
  if (!xs.length) return 0;
  if (total <= thresholds[0]) return xs[0];
  for (let i = 0; i < xs.length - 1; i++) {
    if (total < thresholds[i + 1]) {
      const span = Math.max(1, thresholds[i + 1] - thresholds[i]);
      return xs[i] + ((total - thresholds[i]) / span) * (xs[i + 1] - xs[i]);
    }
  }
  return xs[xs.length - 1];
}

/** Geschwindigkeit nach Trägheit: je Sekunde bleibt `friction` übrig. Unter `minSpeed` Stillstand (0). */
export function inertiaStep(speed: number, dtMs: number, friction: number, minSpeed: number): number {
  const next = speed * Math.pow(friction, dtMs / 1000);
  return Math.abs(next) < minSpeed ? 0 : next;
}

// ───────────────────────────────────────────── Deck Pfade und Verlauf

/** Füllgrad (0 bis 1) des Abschnitts `k` der Deck Leiste: Abschnitt k reicht von der vorigen Schwelle bis zur eigenen */
export function stageFill(have: number, thresholds: readonly number[], k: number): number {
  const lo = k === 0 ? 0 : thresholds[k - 1];
  const hi = thresholds[k];
  if (hi <= lo) return have >= hi ? 1 : 0;
  return Math.max(0, Math.min(1, (have - lo) / (hi - lo)));
}

/** Neueste zuerst */
export function recentFirst<T>(list: readonly T[]): T[] {
  return [...list].reverse();
}

export function pageCount(n: number, perPage: number): number {
  return Math.max(1, Math.ceil(n / Math.max(1, perPage)));
}

export function pageSlice<T>(list: readonly T[], page: number, perPage: number): T[] {
  const p = Math.max(0, Math.min(pageCount(list.length, perPage) - 1, page));
  return list.slice(p * perPage, (p + 1) * perPage);
}
