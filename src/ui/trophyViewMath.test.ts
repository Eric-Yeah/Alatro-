import { afterEach, describe, expect, it } from 'vitest';
import { setLang } from '../i18n';
import { TROPHY_LAYOUT } from '../data/trophyLayout';
import { DECK_THRESHOLDS } from '../data/trophies';
import { LEAGUES, ROAD } from '../data/trophyRoad';
import type { TrophyLine, TrophyLineKind } from '../data/trophyTypes';
import { roundTrophies } from '../trophies';
import {
  LINE_ORDER, clampScroll, focusIndex, focusScroll, inertiaStep, lastRoundAmount, markerX, pageCount, pageSlice, recentFirst,
  roadContentWidth, roadNodes, sectionWidth, sectionX, stageFill, sumAmounts, summarizeLines, trophyLineText,
} from './trophyViewMath';

afterEach(() => setLang('de'));

const line = (kind: TrophyLineKind, amount: number, extra: Partial<TrophyLine> = {}): TrophyLine => ({ kind, amount, ...extra });

describe('Text der Abrechnung', () => {
  it('jede der 11 Zeilenarten hat einen Text ohne offene Platzhalter', () => {
    expect(LINE_ORDER).toHaveLength(11);
    for (const kind of LINE_ORDER) {
      const txt = trophyLineText(line(kind, 5, { ante: 3, blind: 'boss', percent: 20 }));
      expect(txt.length, kind).toBeGreaterThan(3);
      expect(txt, kind).not.toMatch(/[{}]/);
    }
  });

  it('Runde nennt Ante und Blind in Englisch', () => {
    expect(trophyLineText(line('round', 6, { ante: 2, blind: 'small' }))).toBe('Runde gewonnen: Ante 2, Small Blind');
    expect(trophyLineText(line('round', 6, { ante: 5, blind: 'big' }))).toContain('Big Blind');
    expect(trophyLineText(line('lostRound', 1, { ante: 4, blind: 'boss' }))).toBe('Trost: Ante 4, Boss Blind');
  });

  it('Zuschläge zeigen den Prozentwert, ohne Wert nur den Namen', () => {
    expect(trophyLineText(line('streakBonus', 3, { percent: 8 }))).toBe('Siegesserie (+8 Prozent)');
    expect(trophyLineText(line('streakBonus', 3))).toBe('Siegesserie');
    expect(trophyLineText(line('newBestAnte', 8, { ante: 6 }))).toBe('Neuer Rekord: Ante 6');
  });

  it('Englisch ist vollständig übersetzt (kein deutscher Rest)', () => {
    setLang('en');
    const de = /Runde|Trost|übrige|Überschuss|Siegesserie|Tageslauf|Prämie|gewonnen|Rekord|Prozent|erster/;
    for (const kind of LINE_ORDER) {
      const txt = trophyLineText(line(kind, 5, { ante: 3, blind: 'boss', percent: 20 }));
      expect(txt, kind).not.toMatch(de);
    }
  });

  it('echte Zeilen aus der Rechnung ergeben Text', () => {
    const res = roundTrophies({ ante: 4, blind: 'boss', won: true, handsLeft: 3, score: 9000, target: 4000, stakeId: 'mitternacht', difficulty: null, daily: true, streakFactor: 1.12 });
    expect(res.lines.length).toBeGreaterThan(3);
    for (const l of res.lines) expect(trophyLineText(l)).not.toMatch(/[{}]/);
  });
});

describe('Zusammenfassung der Zeilen', () => {
  const lines: TrophyLine[] = [
    line('round', 3, { ante: 1, blind: 'small' }),
    line('reserve', 1, { percent: 30 }),
    line('round', 4, { ante: 1, blind: 'big' }),
    line('round', 6, { ante: 1, blind: 'boss' }),
    line('overkill', 2, { percent: 20 }),
    line('newBestAnte', 8, { ante: 1 }),
    line('winBonus', 120),
    line('deckFirstWin', 150),
    line('dailyFirst', 30),
  ];

  it('fasst gleiche Arten zusammen und behält die Summe', () => {
    const rows = summarizeLines(lines, 20);
    expect(rows.map((r) => r.kind)).toEqual(['round', 'reserve', 'overkill', 'winBonus', 'deckFirstWin', 'newBestAnte', 'dailyFirst']);
    expect(rows[0]).toMatchObject({ amount: 13, text: 'Runden gewonnen (3x)' });
    expect(rows.reduce((s, r) => s + r.amount, 0)).toBe(sumAmounts(lines));
  });

  it('kürzt auf die Höchstzahl, der Rest steht in einer Zeile und die Summe bleibt', () => {
    const rows = summarizeLines(lines, 4);
    expect(rows).toHaveLength(4);
    expect(rows[3].kind).toBe('rest');
    expect(rows[3].text).toBe('Weitere Zeilen (4)');
    expect(rows.reduce((s, r) => s + r.amount, 0)).toBe(sumAmounts(lines));
    // die größten Posten bleiben
    expect(rows.map((r) => r.kind)).toContain('deckFirstWin');
    expect(rows.map((r) => r.kind)).toContain('winBonus');
  });

  it('Zeilen mit Menge 0 und leere Listen fallen weg', () => {
    expect(summarizeLines([line('round', 0, { ante: 1, blind: 'small' })], 6)).toEqual([]);
    expect(summarizeLines([], 6)).toEqual([]);
  });

  it('eine einzelne Zeile behält ihren genauen Text', () => {
    const rows = summarizeLines([line('round', 3, { ante: 2, blind: 'small' })], 6);
    expect(rows[0].text).toBe('Runde gewonnen: Ante 2, Small Blind');
  });

  it('Pokale der letzten Runde ohne Run Boni', () => {
    expect(lastRoundAmount([])).toBe(0);
    const all: TrophyLine[] = [
      line('round', 3, { ante: 1, blind: 'small' }), line('reserve', 1),
      line('round', 4, { ante: 1, blind: 'big' }), line('overkill', 2), line('newBestAnte', 8),
      line('winBonus', 120), line('deckFirstWin', 150),
    ];
    expect(lastRoundAmount(all)).toBe(4 + 2 + 8);
  });
});

describe('Pfad: Positionen und Scrollen', () => {
  const nodes = roadNodes(ROAD);
  const W = roadContentWidth(LEAGUES.length);

  it('48 Knoten, streng steigend, innerhalb ihres Abschnitts', () => {
    expect(nodes).toHaveLength(ROAD.length);
    nodes.forEach((n, i) => {
      if (i > 0) expect(n.x).toBeGreaterThan(nodes[i - 1].x);
      expect(n.x).toBeGreaterThan(sectionX(n.league));
      expect(n.x).toBeLessThan(sectionX(n.league) + sectionWidth());
      expect(n.x).toBeLessThan(W);
    });
  });

  it('Knoten wechseln zwischen den Reihen und Abstand ist gleichmäßig', () => {
    const ys = new Set(nodes.map((n) => n.y));
    expect([...ys].sort()).toEqual([...TROPHY_LAYOUT.road.rowYs].sort());
    expect(nodes[0].y).not.toBe(nodes[1].y);
    expect(nodes[1].x - nodes[0].x).toBe(TROPHY_LAYOUT.road.pitch);
  });

  it('Kacheln liegen vollständig im Inhaltsbereich (mit Beschriftung)', () => {
    const R = TROPHY_LAYOUT.road;
    for (const n of nodes) {
      expect(n.y - R.tileH / 2).toBeGreaterThan(R.leagueRangeY);
      expect(n.y + R.thresholdDy + R.thresholdSize).toBeLessThan(R.barY);
    }
  });

  it('Scroll Grenzen', () => {
    expect(clampScroll(-50, 1000, 400)).toBe(0);
    expect(clampScroll(999, 1000, 400)).toBe(600);
    expect(clampScroll(300, 1000, 400)).toBe(300);
    expect(clampScroll(10, 200, 400)).toBe(0);
    expect(focusScroll(0, 1000, 400)).toBe(0);
    expect(focusScroll(500, 1000, 400)).toBe(300);
    expect(focusScroll(990, 1000, 400)).toBe(600);
  });

  it('Startposition: erster abholbarer, sonst erster gesperrter, sonst letzter', () => {
    expect(focusIndex(['claimed', 'ready', 'ready', 'locked'])).toBe(1);
    expect(focusIndex(['claimed', 'claimed', 'locked', 'locked'])).toBe(2);
    expect(focusIndex(['claimed', 'claimed'])).toBe(1);
    expect(focusIndex([])).toBe(0);
  });

  it('Zeiger liegt zwischen den Knoten', () => {
    const xs = [100, 250, 400];
    const th = [0, 100, 300];
    expect(markerX(0, xs, th)).toBe(100);
    expect(markerX(50, xs, th)).toBe(175);
    expect(markerX(200, xs, th)).toBe(325);
    expect(markerX(999, xs, th)).toBe(400);
    expect(markerX(5, [], [])).toBe(0);
  });

  it('Trägheit bremst ab und endet', () => {
    let v = 1000;
    let steps = 0;
    while (v !== 0 && steps < 1000) {
      const next = inertiaStep(v, 16, TROPHY_LAYOUT.road.friction, TROPHY_LAYOUT.road.minSpeed);
      expect(Math.abs(next)).toBeLessThan(Math.abs(v));
      v = next;
      steps++;
    }
    expect(v).toBe(0);
    expect(steps).toBeLessThan(200);
    expect(inertiaStep(-1000, 16, 0.04, 30)).toBeLessThan(0);
  });
});

describe('Deck Pfade und Verlauf', () => {
  it('Füllgrad je Abschnitt', () => {
    expect(stageFill(0, DECK_THRESHOLDS, 0)).toBe(0);
    expect(stageFill(30, DECK_THRESHOLDS, 0)).toBe(0.5);
    expect(stageFill(60, DECK_THRESHOLDS, 0)).toBe(1);
    expect(stageFill(60, DECK_THRESHOLDS, 1)).toBe(0);
    expect(stageFill(155, DECK_THRESHOLDS, 1)).toBeCloseTo(0.5, 5);
    expect(stageFill(9999, DECK_THRESHOLDS, 2)).toBe(1);
  });

  it('Seiten des Verlaufs, neueste zuerst', () => {
    expect(recentFirst([1, 2, 3])).toEqual([3, 2, 1]);
    expect(pageCount(0, 11)).toBe(1);
    expect(pageCount(11, 11)).toBe(1);
    expect(pageCount(12, 11)).toBe(2);
    const list = Array.from({ length: 25 }, (_, i) => i);
    expect(pageSlice(list, 0, 11)).toHaveLength(11);
    expect(pageSlice(list, 2, 11)).toEqual([22, 23, 24]);
    expect(pageSlice(list, 99, 11)).toEqual([22, 23, 24]);
    expect(pageSlice(list, -3, 11)[0]).toBe(0);
  });
});
