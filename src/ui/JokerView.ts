import { Container, Graphics, Sprite, Text, type NineSliceSprite } from 'pixi.js';
import { getJoker, type JokerInstance } from '../core/jokers';
import { EDITIONS } from '../data/modifiers';
import { hashString } from '../core/rng';
import { attachFloat } from './cardMotion';
import { editionOverlay } from './editionFx';
import { ART_H, ART_Y, BAND_H, BAND_TEXT, BAND_Y, RARITY_FRAME, TILE_CORNER, TILE_H, TILE_SCALE, TILE_W } from '../data/jokerArt';
import { RARITY_GLOSS, RARITY_GLOW, SHADOW_INSET, TILE_DEPTH } from '../data/tileDepth';
import { fxMode } from './artFx';
import { setShadowLift } from './depth';
import { jokerTexture } from './jokerArt';
import { effectTags } from './jokerInfo';
import { drawPill, liftTo, tileBody, tileBounds, tileGlow, tileGloss, tileShadow } from './tileDepth';
import { C, EDITION_COLORS, FONT_BODY } from './theme';
import { label } from './widgets';

export const JOKER_W = TILE_W * TILE_SCALE;
export const JOKER_H = TILE_H * TILE_SCALE;
/** Eckenradius der Kachel in Spielfeld Einheiten */
const JOKER_R = TILE_CORNER * TILE_SCALE;

export class JokerView extends Container {
  /** Innerer Container mit allem Sichtbaren (Aufprall beim Berühren, Phase der Edition), schwebt in `floater` */
  readonly body = new Container();
  /** Schwebe Hülle um body, der Schatten liegt außerhalb und bleibt auf dem Tisch */
  private readonly floater = new Container();
  private readonly shadow: NineSliceSprite;
  private _lift = 0;

  /** Abhebung 0 bis 1: der Schatten bleibt liegen, wenn die Kachel steigt (gehaltene Kachel beim Ordnen) */
  get lift() { return this._lift; }
  set lift(v: number) {
    this._lift = v;
    if (!this.destroyed) setShadowLift(this.shadow, v);
  }

  /** float: leichtes Schweben, 'shop': etwas ruhiger (Shop und Pack Auswahl) */
  constructor(public readonly joker: JokerInstance, float: boolean | 'shop' = true) {
    super();
    const def = getJoker(joker.defId)!;
    const w = JOKER_W, h = JOKER_H;
    // Weicher Schatten und Leuchtkante der Seltenheit liegen unter der schwebenden Kachel
    this.shadow = tileShadow(w, h, { radius: JOKER_R, inset: SHADOW_INSET.joker });
    const glowSpec = RARITY_GLOW[def.rarity];
    if (glowSpec) this.addChild(tileGlow(w, h, glowSpec, JOKER_R));
    this.addChild(this.shadow);
    // ganze Kachel als Pixel Art: Rahmen in Farbe der Seltenheit, Motiv, dunkles Namensband
    const tex = jokerTexture(joker.defId, def.rarity);
    const tile = new Sprite(tex);
    tile.anchor.set(0.5);
    tile.scale.set(TILE_SCALE);
    // Körper: dunkler Streifen unter der Kachel, in der Farbe der Seltenheit
    const body = tileBody(tex, TILE_SCALE);
    body.tint = RARITY_FRAME[def.rarity]?.dark ?? TILE_DEPTH.bodyTint;
    const name = new Text({
      text: def.name,
      style: { fontFamily: FONT_BODY, fontSize: 14, fontWeight: '800', fill: BAND_TEXT, align: 'center' },
    });
    name.anchor.set(0.5);
    name.y = -h / 2 + (BAND_Y + BAND_H / 2) * TILE_SCALE;
    // lange einzelne Wörter (z. B. Kartenhändler) verkleinern statt über den Kartenrand laufen
    if (name.width > w - 14) name.scale.set((w - 14) / name.width);
    this.floater.addChild(this.body);
    this.addChild(this.floater);
    // Glanz liegt über dem Rahmen und dem Motiv, unter Namen und Marken
    this.body.addChild(body, tile, tileGloss(w, h, JOKER_R, RARITY_GLOSS[def.rarity] ?? 1), name);
    // Wirkungs Marken am unteren Rand des Motivs: Farbe und Buchstabe zeigen auf einen Blick, was der Joker tut
    const tags = effectTags(def).slice(0, 5);
    const pw = 18, ph = 14, gap = 2;
    const rowW = tags.length * pw + (tags.length - 1) * gap;
    tags.forEach((tg, i) => {
      const px = -rowW / 2 + i * (pw + gap);
      const py = -h / 2 + (ART_Y + ART_H) * TILE_SCALE - ph - 5;
      const pill = new Graphics().roundRect(px - 2, py - 2, pw + 4, ph + 4, 6).fill(C.cardEdge);
      drawPill(pill, px, py, pw, ph, tg.color);
      const t = label(tg.short, 11, 0xffffff);
      t.position.set(px + pw / 2, py + ph / 2);
      this.body.addChild(pill, t);
    });
    if (joker.edition && EDITIONS[joker.edition]) {
      const ec = EDITION_COLORS[joker.edition] ?? C.accent;
      const glow = new Graphics()
        .roundRect(-w / 2 - 3, -h / 2 - 3, w + 6, h + 6, 12).stroke({ width: 5, color: ec, alpha: 0.95 });
      const ed = new Text({ text: EDITIONS[joker.edition].name, style: { fontFamily: FONT_BODY, fontSize: 12, fontWeight: '900', fill: 0xffffff, stroke: { color: 0x1b1530, width: 4 } } });
      ed.anchor.set(0.5);
      ed.y = -h / 2 + 14;
      this.body.addChild(glow);
      const fx = editionOverlay(joker.edition, w, h, 10);
      if (fx) this.body.addChild(fx);
      this.body.addChild(ed);
    }
    // Grenzen ohne Schatten und Leuchtkante (Einführung und Hit Tests nutzen getBounds)
    this.boundsArea = tileBounds(w, h, TILE_DEPTH.bodyDy);
    this.eventMode = 'static';
    this.cursor = 'pointer';
    // Halten hebt die Kachel (Schatten wächst), Maus darüber hebt sie leicht
    let held = false;
    let hover = false;
    const rest = () => liftTo(this, held ? 1 : hover && fxMode().pop ? TILE_DEPTH.hoverLift : 0);
    this.on('pointerdown', () => { held = true; rest(); });
    const release = () => { held = false; rest(); };
    this.on('pointerup', release);
    this.on('pointerupoutside', release);
    this.on('pointerover', () => { hover = true; rest(); });
    this.on('pointerout', () => { hover = false; rest(); });
    // Phase aus der Joker UID, Vorschau Karten (UID -1) aus dem Namen der Vorlage
    if (float) attachFloat(this.floater, joker.uid >= 0 ? joker.uid : hashString(joker.defId), float === 'shop' ? 'shop' : 'joker');
  }
}
