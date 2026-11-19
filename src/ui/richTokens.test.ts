import { describe, expect, it } from 'vitest';
import '../core/index';
import { allJokers, jokerDescription } from '../core/jokers';
import { effectTags, triggerLabel } from './jokerInfo';
import { toWords, tokenizeRich } from './richTokens';

const kindOf = (text: string, part: string) => tokenizeRich(text).find((r) => r.text.includes(part))?.kind;

describe('Rich Text Auszeichnung', () => {
  it('färbt Chips, Mult, X Mult und Geld', () => {
    const t = '+30 Chips und +4 Mult, X2 Mult, +$3';
    expect(kindOf(t, '+30 Chips')).toBe('chips');
    expect(kindOf(t, '+4 Mult')).toBe('mult');
    expect(kindOf(t, 'X2 Mult')).toBe('xmult');
    expect(kindOf(t, '+$3')).toBe('money');
  });

  it('erkennt Suits, Handnamen, Hands und Discards', () => {
    const t = 'Jede Karte in Hearts oder Spades, Full House, +1 Hand, +2 Discards, Hand Size';
    expect(kindOf(t, 'Hearts')).toBe('suitRed');
    expect(kindOf(t, 'Spades')).toBe('suitDark');
    expect(kindOf(t, 'Full House')).toBe('handType');
    expect(kindOf(t, '+1 Hand')).toBe('hands');
    expect(kindOf(t, '+2 Discards')).toBe('discards');
    expect(kindOf(t, 'Hand Size')).toBe('hands');
  });

  it('"die Hand" als gespielte Hand bleibt neutral', () => {
    expect(tokenizeRich('wenn die Hand ein Pair enthält').some((r) => r.kind === 'hands')).toBe(false);
  });

  it('Bedingung violett, Wirkung nicht, aktueller Wert grün', () => {
    const t = 'Erhält +3 Mult, wenn die Hand einen Flush enthält (aktuell +6 Mult)';
    expect(kindOf(t, 'wenn die Hand')).toBe('cond');
    expect(kindOf(t, '(aktuell')).toBe('now');
    const g = 'Jede gewertete Karte gibt +2 Mult';
    expect(kindOf(g, 'Jede gewertete')).toBe('cond');
    expect(kindOf(g, 'gibt')).toBe('plain');
  });

  it('der Text bleibt beim Zusammensetzen unverändert', () => {
    for (const d of allJokers()) {
      const text = jokerDescription(d);
      expect(tokenizeRich(text).map((r) => r.text).join('')).toBe(text);
    }
  });

  it('toWords trennt an Leerzeichen und Zeilenumbrüchen', () => {
    const words = toWords(tokenizeRich('+4 Mult\nbei X2'));
    expect(words.filter((w) => 'br' in w)).toHaveLength(1);
    // "+4 Mult" und "X2" bleiben je ein Wort, "bei" ein weiteres
    expect(words.filter((w) => 'runs' in w)).toHaveLength(3);
  });

  it('Schlüsselwörter mit Leerzeichen werden nicht getrennt', () => {
    const words = toWords(tokenizeRich('gibt X3 Mult, wenn Full House'));
    const texts = words.map((w) => ('runs' in w ? w.runs.map((r) => r.text).join('') : '\n'));
    expect(texts).toContain('X3 Mult,');
    expect(texts).toContain('Full House');
  });
});

describe('Joker Wirkungs Marken', () => {
  it('jeder Joker hat mindestens eine Marke und einen Auslöser', () => {
    for (const d of allJokers()) {
      expect(effectTags(d).length, d.id).toBeGreaterThan(0);
      expect(triggerLabel(d), d.id).toBeTruthy();
    }
  });

  it('ordnet Marken passend zu', () => {
    const by = (id: string) => effectTags(allJokers().find((d) => d.id === id)!).map((t) => t.id);
    const mult = allJokers().find((d) => d.config.mult && !d.config.xMult && /^\+\{mult\} Mult$/.test(d.description));
    expect(mult).toBeTruthy();
    expect(by(mult!.id)).toEqual(['mult']);
    const x = allJokers().find((d) => /^X\{xMult\} Mult/.test(d.description))!;
    expect(by(x.id)).toContain('xmult');
    expect(by(x.id)).not.toContain('mult');
    const hand = allJokers().find((d) => d.passive?.({ ...d.config })?.hands)!;
    expect(by(hand.id)).toContain('passive');
  });

  it('Texte enthalten keine Gedankenstriche', () => {
    for (const d of allJokers()) expect(triggerLabel(d)).not.toMatch(/[—–]| - /);
  });
});
