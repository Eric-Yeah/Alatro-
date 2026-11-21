import type { LevelUpPreview } from '../core/runInfo';
import { t } from '../i18n';
import { fmt, fmtMult } from './theme';

/** Reine Texte der Level up Anzeige (ohne Pixi, getestet). Die Darstellung steht in levelUpView.ts. */

/** Art eines Abschnitts: Fließtext, gedämpft, Handname, Chips (blau), Mult (rot), X Mult (rote Pille) */
export type LevelSegKind = 'plain' | 'dim' | 'hand' | 'chips' | 'mult' | 'xmult';
export interface LevelSeg {
  text: string;
  kind: LevelSegKind;
}

const plain = (text: string): LevelSeg => ({ text, kind: 'plain' });

/** Eine Zeile "Chips 25 zu 40 (+15)", die Zahlen kommen aus der Vorschau */
function gainLine(kind: 'chips' | 'mult', d: { from: number; to: number; diff: number }): LevelSeg[] {
  const f = kind === 'chips' ? fmt : fmtMult;
  const params = { from: f(d.from), to: f(d.to), diff: f(d.diff) };
  return [{ text: kind === 'chips' ? t('Chips {from} zu {to} (+{diff})', params) : t('Mult {from} zu {to} (+{diff})', params), kind }];
}

function levelText(from: number, to: number, amount: number): string {
  return amount > 1 ? t('Level {from} zu Level {to} (+{n})', { from, to, n: amount }) : t('Level {from} zu Level {to}', { from, to });
}

function rangeText(kind: 'chips' | 'mult', [lo, hi]: [number, number]): string {
  const f = kind === 'chips' ? fmt : fmtMult;
  if (lo === hi) return kind === 'chips' ? t('Chips +{a} je Hand', { a: f(lo) }) : t('Mult +{a} je Hand', { a: f(lo) });
  return kind === 'chips' ? t('Chips +{a} bis +{b} je Hand', { a: f(lo), b: f(hi) }) : t('Mult +{a} bis +{b} je Hand', { a: f(lo), b: f(hi) });
}

/**
 * Zeilen der Level up Anzeige als Abschnitte (rein, ohne Pixi). `slot`: das Sternbild liegt im Consumable Slot,
 * dann steht dort auch, was das Fernrohr bringt. `narrow`: schmale Spalte, die Beispielzeile des Omens entfällt.
 */
export function levelUpSegments(p: LevelUpPreview, opts: { slot?: boolean; narrow?: boolean } = {}): LevelSeg[][] {
  if (p.kind === 'hand') {
    const level = levelText(p.level.from, p.level.to, p.amount);
    // schmale Spalte (Pack): der Handname steht schon in der Beschreibung darüber
    const head: LevelSeg[] = p.row && opts.narrow ? [plain(level)] : [{ text: p.row ? p.row.name : '???', kind: 'hand' }, plain(': ' + level)];
    if (!p.row) return [head, [{ text: t('Werte noch geheim'), kind: 'dim' }]];
    const rows: LevelSeg[][] = [head, gainLine('chips', p.row.chips), gainLine('mult', p.row.mult)];
    if (opts.slot && p.heldXMult) rows.push([plain(t('Im Slot:') + ' '), { text: `X${fmtMult(p.heldXMult)} Mult`, kind: 'xmult' }, plain(' ' + t('beim Spielen'))]);
    return rows;
  }
  const rows: LevelSeg[][] = [
    [plain(t('Alle Hände: +{n} Level', { n: p.amount }))],
    [{ text: rangeText('chips', p.chipsGain), kind: 'chips' }],
    [{ text: rangeText('mult', p.multGain), kind: 'mult' }],
  ];
  if (p.focus && !opts.narrow) {
    const f = p.focus;
    rows.push([
      { text: f.name, kind: 'hand' }, plain(': '),
      { text: t('Chips {from} zu {to}', { from: fmt(f.chips.from), to: fmt(f.chips.to) }), kind: 'chips' }, plain(', '),
      { text: t('Mult {from} zu {to}', { from: fmtMult(f.mult.from), to: fmtMult(f.mult.to) }), kind: 'mult' },
    ]);
  }
  return rows;
}

