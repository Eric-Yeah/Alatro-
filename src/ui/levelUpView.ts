import { Container, Graphics, Text } from 'pixi.js';
import type { LevelUpPreview } from '../core/runInfo';
import { LEVEL_UP_VIEW } from '../data/deckView';
import { COLORS } from './richText';
import { levelUpSegments, type LevelSegKind } from './levelUpTokens';
import { drawPill } from './tileDepth';
import { C, FONT_BODY } from './theme';

export interface LevelUpBlockOptions {
  size?: number;
  theme?: 'light' | 'dark';
  align?: 'left' | 'center';
  slot?: boolean;
}

/** Level up Block mit farbigen Zahlen (Chips blau, Mult rot), jede Zeile schrumpft bei Bedarf auf die Breite. Anker oben. */
export function levelUpBlock(p: LevelUpPreview, width: number, opts: LevelUpBlockOptions = {}): Container {
  const size = opts.size ?? 17;
  const theme = opts.theme ?? 'dark';
  const palette = COLORS[theme];
  const align = opts.align ?? 'center';
  const color = (k: LevelSegKind): number => (k === 'dim' ? (theme === 'dark' ? C.textDim : 0x6a6a7a) : k === 'hand' ? palette.handType : palette[k]);
  const root = new Container();
  const lineH = size * LEVEL_UP_VIEW.lineFactor;
  const pad = 3;
  levelUpSegments(p, { slot: opts.slot, narrow: width < LEVEL_UP_VIEW.narrow }).forEach((segs, li) => {
    const line = new Container();
    let x = 0;
    for (const s of segs) {
      const text = new Text({ text: s.text, style: { fontFamily: FONT_BODY, fontSize: size, fontWeight: s.kind === 'plain' || s.kind === 'dim' ? '700' : '900', fill: color(s.kind) } });
      const pill = s.kind === 'xmult';
      if (pill) {
        line.addChild(drawPill(new Graphics(), x, 1, text.width + pad * 2, size * 1.22, 0xd8281c, 4, { light: 0.18, sheen: 0.22 }));
        x += pad;
      }
      text.position.set(x, 0);
      line.addChild(text);
      x += text.width + (pill ? pad : 0);
    }
    if (x > width) line.scale.set(width / x);
    const w = Math.min(x, width);
    line.position.set(align === 'center' ? -w / 2 : 0, li * lineH);
    root.addChild(line);
  });
  return root;
}
