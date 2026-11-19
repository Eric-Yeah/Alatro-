import { Container, Graphics, Text } from 'pixi.js';
import { toWords, tokenizeRich, type RichKind } from './richTokens';
import { C, FONT_BODY } from './theme';

/** Textfarben pro Art, getrennt für hellen (Karten, Tooltips) und dunklen Untergrund (Panels, Shop). */
const COLORS: Record<'light' | 'dark', Record<RichKind, number>> = {
  dark: {
    plain: C.text, chips: 0x5cb8ff, mult: 0xff7a6e, xmult: 0xffffff, money: 0xffc94d, hands: 0x58e0b4, discards: 0xff9a5c,
    suitRed: 0xff6b7a, suitDark: 0x9aa8ff, handType: 0xffb347, cond: 0xc7b2ff, now: 0x6fe39c, rank: 0xffe08a,
  },
  light: {
    plain: C.cardEdge, chips: 0x0a62c0, mult: 0xc4271d, xmult: 0xffffff, money: 0x9a5d00, hands: 0x0f7a5c, discards: 0xb84a10,
    suitRed: 0xc42a3a, suitDark: 0x2b2f9b, handType: 0xa85500, cond: 0x6a3fb0, now: 0x12803f, rank: 0x7a5a00,
  },
};

/** Kinds, die eine gefüllte Pille bekommen (multiplikativ, damit sie sofort auffallen). */
const PILL: Partial<Record<RichKind, number>> = { xmult: 0xd8281c };

export interface RichOptions {
  size?: number;
  align?: 'left' | 'center';
  theme?: 'light' | 'dark';
}

/**
 * Mehrzeiliger Text mit farbigen Schlüsselwörtern (Chips blau, Mult rot, X Mult als rote Pille, Geld gold,
 * Suits, Handnamen, Bedingungen violett, aktuelle Werte grün). Anker oben, mittig oder links wie wrapText.
 */
export function richText(text: string, width: number, opts: RichOptions = {}): Container {
  const size = opts.size ?? 16;
  const align = opts.align ?? 'center';
  const palette = COLORS[opts.theme ?? 'dark'];
  const root = new Container();
  const space = size * 0.3;
  const lineH = size * 1.32;
  const pad = 3;

  type Placed = { run: { text: string; kind: RichKind }; t: Text; w: number };
  /** gapBefore: erste Abschnitte der Wörter, vor denen ein Leerzeichen steht */
  type Line = { items: Placed[]; gapBefore: Set<Placed>; w: number };
  const newLine = (): Line => ({ items: [], gapBefore: new Set(), w: 0 });
  const lines: Line[] = [newLine()];
  const measure = (run: { text: string; kind: RichKind }): Placed => {
    const t = new Text({
      text: run.text,
      style: { fontFamily: FONT_BODY, fontSize: size, fontWeight: run.kind === 'plain' || run.kind === 'cond' ? '700' : '900', fill: palette[run.kind] },
    });
    return { run, t, w: t.width + (PILL[run.kind] ? pad * 2 : 0) };
  };

  for (const word of toWords(tokenizeRich(text))) {
    if ('br' in word) { lines.push(newLine()); continue; }
    const placed = word.runs.map(measure);
    const ww = placed.reduce((a, p) => a + p.w, 0);
    let line = lines[lines.length - 1];
    if (line.items.length && line.w + space + ww > width) {
      line = newLine();
      lines.push(line);
    }
    if (line.items.length) { line.gapBefore.add(placed[0]); line.w += space; }
    line.items.push(...placed);
    line.w += ww;
  }

  lines.forEach((line, li) => {
    let x = align === 'center' ? -line.w / 2 : 0;
    const y = li * lineH;
    for (const p of line.items) {
      if (line.gapBefore.has(p)) x += space;
      const bg = PILL[p.run.kind];
      if (bg !== undefined) {
        const g = new Graphics().roundRect(x, y + 1, p.w, size * 1.22, 4).fill(bg);
        root.addChild(g);
        p.t.position.set(x + pad, y);
      } else {
        p.t.position.set(x, y);
      }
      root.addChild(p.t);
      x += p.w;
    }
  });
  return root;
}
