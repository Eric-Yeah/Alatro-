import '../core/index';
import { describe, expect, it } from 'vitest';
import { createRun } from '../core/game';
import { consumableDescription, levelUpPreview } from '../core/runInfo';
import { levelUpSegments } from './levelUpTokens';

const text = (rows: ReturnType<typeof levelUpSegments>) => rows.map((r) => r.map((s) => s.text).join(''));
const kinds = (rows: ReturnType<typeof levelUpSegments>) => rows.map((r) => r.map((s) => s.kind));

describe('Level up Anzeige (Texte)', () => {
  it('Sternbild: Level, Chips und Mult mit konkreten Zahlen und Farbarten', () => {
    const run = createRun({ seed: 'LVTXT001' });
    run.handLevels.pair = 2;
    const rows = levelUpSegments(levelUpPreview(run, 'sternbild_pair')!);
    expect(text(rows)).toEqual(['Pair: Level 2 zu Level 3', 'Chips 25 zu 40 (+15)', 'Mult 3 zu 4 (+1)']);
    expect(kinds(rows)).toEqual([['hand', 'plain'], ['chips'], ['mult']]);
  });

  it('Slot: Fernrohr zeigt X Mult, ohne Slot nicht', () => {
    const run = createRun({ seed: 'LVTXT002' });
    run.rules.sternbildXMult = 1.5;
    const p = levelUpPreview(run, 'sternbild_flush')!;
    expect(levelUpSegments(p)).toHaveLength(3);
    const rows = levelUpSegments(p, { slot: true });
    expect(rows).toHaveLength(4);
    expect(text(rows)[3]).toBe('Im Slot: X1,5 Mult beim Spielen');
    expect(rows[3][1].kind).toBe('xmult');
  });

  it('schmale Spalte lässt den Handnamen der Kopfzeile weg', () => {
    const run = createRun({ seed: 'LVTXT003' });
    const rows = levelUpSegments(levelUpPreview(run, 'sternbild_straight')!, { narrow: true });
    expect(text(rows)[0]).toBe('Level 1 zu Level 2');
  });

  it('geheime Hand: weder Name noch Werte, Beschreibung ohne Handnamen', () => {
    const run = createRun({ seed: 'LVTXT004' });
    const rows = text(levelUpSegments(levelUpPreview(run, 'sternbild_flushFive')!));
    expect(rows.join('\n')).not.toContain('Flush Five');
    expect(rows[0]).toBe('???: Level 1 zu Level 2');
    expect(rows).toHaveLength(2);
    expect(consumableDescription(run, 'sternbild_flushFive')).toBe('??? erhält +1 Level');
    run.handsPlayed.flushFive = 1;
    expect(consumableDescription(run, 'sternbild_flushFive')).toBe('Flush Five erhält +1 Level');
    expect(consumableDescription(run, 'sternbild_pair')).toBe('Pair erhält +1 Level');
  });

  it('Omen: kurze Zusammenfassung statt zwölf Zeilen, Beispielzeile nur mit gespielter Hand', () => {
    const run = createRun({ seed: 'LVTXT005' });
    const rows = text(levelUpSegments(levelUpPreview(run, 'omen_aschenregen')!));
    expect(rows).toEqual(['Alle Hände: +1 Level', 'Chips +10 bis +40 je Hand', 'Mult +1 bis +4 je Hand']);
    run.handsPlayed.pair = 2;
    const full = text(levelUpSegments(levelUpPreview(run, 'omen_aschenregen')!));
    expect(full).toHaveLength(4);
    expect(full[3]).toBe('Pair: Chips 10 zu 25, Mult 2 zu 3');
    expect(text(levelUpSegments(levelUpPreview(run, 'omen_aschenregen')!, { narrow: true }))).toHaveLength(3);
  });
});
