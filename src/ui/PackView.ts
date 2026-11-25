import { Container, Sprite, Text, type NineSliceSprite } from 'pixi.js';
import { PACK_DIMS, PACK_PALETTES, PACK_SCALE, PACK_SPARK_BONUS } from '../data/packArt';
import { PACK_GLOW, SHADOW_INSET, TILE_DEPTH } from '../data/tileDepth';
import { IDLE_FX } from '../data/artFx';
import type { PackDef } from '../data/packs';
import { hashString } from '../core/rng';
import { addShimmer, attachPop } from './artFx';
import { setShadowLift } from './depth';
import { packTexture } from './packArt';
import { liftTo, tileBody, tileBounds, tileGlow, tileShadow, tileSheen } from './tileDepth';
import { FONT_BODY } from './theme';

/** Schriftgröße des Namens im Band je Größe */
const NAME_SIZE = { normal: 12, jumbo: 13, mega: 14 };

/** Maße eines Packs in logischen Punkten (Normal, Jumbo und Mega sind unterschiedlich groß). */
export function packPixelSize(def: PackDef): { w: number; h: number } {
  const d = PACK_DIMS[def.size];
  return { w: d.w * PACK_SCALE, h: d.h * PACK_SCALE };
}

/** Ein Booster Pack als Siegelhülle (Pixel Art), mit Namen im Band, Funkeln und Aufprall beim Berühren. */
export class PackView extends Container {
  readonly body = new Container();
  readonly pxW: number;
  readonly pxH: number;
  private readonly shadow: NineSliceSprite;
  private _lift = 0;

  /** Abhebung 0 bis 1: der Schatten wächst, wenn der Beutel steigt (Maus darüber) */
  get lift() { return this._lift; }
  set lift(v: number) {
    this._lift = v;
    if (!this.destroyed) setShadowLift(this.shadow, v);
  }

  constructor(public readonly def: PackDef, interactive = true) {
    super();
    const d = PACK_DIMS[def.size];
    const { w, h } = packPixelSize(def);
    this.pxW = w;
    this.pxH = h;
    const tex = packTexture(def.kind, def.size);
    const pal = PACK_PALETTES[def.kind];
    // Weicher Schatten (Mega und Jumbo mit Leuchtkante in der Farbe der Art) unter dem Beutel, liegt außerhalb des Bodys
    this.shadow = tileShadow(w, h, { radius: 8, inset: SHADOW_INSET.pack });
    const glow = PACK_GLOW[def.size];
    if (glow) this.addChild(tileGlow(w - 2 * SHADOW_INSET.pack, h - 2 * SHADOW_INSET.pack, { ...glow, color: pal.light }, 8));
    this.addChild(this.shadow);
    // Körper: dunkler Streifen unter dem Beutel, folgt der gezackten Form
    const bodyStrip = tileBody(tex, PACK_SCALE);
    bodyStrip.tint = pal.deep;
    const bag = new Sprite(tex);
    bag.anchor.set(0.5);
    bag.scale.set(PACK_SCALE);
    const name = new Text({
      text: def.name,
      style: { fontFamily: FONT_BODY, fontSize: NAME_SIZE[def.size], fontWeight: '800', fill: 0xfff3d1, align: 'center', wordWrap: true, wordWrapWidth: w - 36, lineHeight: NAME_SIZE[def.size] + 1 },
    });
    name.anchor.set(0.5);
    name.y = -h / 2 + (d.bandY + d.bandH / 2) * PACK_SCALE;
    const maxH = (d.bandH - 3) * PACK_SCALE;
    if (name.height > maxH) name.scale.set(maxH / name.height);
    this.body.addChild(bodyStrip, bag, name);
    // Funkeln und Glanzstreifen über dem Bauch der Hülle (ohne die gezackten Kanten)
    const bodyH = (d.h - d.crimpTop - d.crimpBot - 2) * PACK_SCALE;
    const sh = addShimmer(this.body, w - 18, bodyH, IDLE_FX.sparksPack + PACK_SPARK_BONUS[def.size], hashString(def.id), true, 0xffffff, 6);
    if (sh) sh.y = ((d.crimpTop - d.crimpBot) / 2) * PACK_SCALE - h / 2 + h / 2;
    // Lichtband auf dem Bauch der Hülle (ohne die gezackten Kanten)
    const bandTop = d.crimpTop * PACK_SCALE - h / 2 + 4;
    this.body.addChild(tileSheen(-w / 2 + 12, bandTop, w - 24, bodyH * 0.22, 8, 1));
    this.addChild(this.body);
    this.boundsArea = tileBounds(w, h, TILE_DEPTH.bodyDy);
    if (interactive) {
      this.eventMode = 'static';
      this.cursor = 'pointer';
      attachPop(this, this.body, { onHover: (on) => liftTo(this, on ? 1 : 0) });
    }
  }
}
