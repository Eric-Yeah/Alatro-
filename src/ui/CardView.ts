import { Container, Graphics, Sprite, Text } from 'pixi.js';
import { isRankless, type Card } from '../core/cards';
import { CARD_PX_H, CARD_PX_SCALE, CARD_PX_W } from '../data/cardArt/cardGlyphs';
import { CARD_BODY, SHADOW } from '../data/depth';
import { EDITIONS, ENHANCEMENTS, SEALS } from '../data/modifiers';
import { getSettings, onSettings } from '../settings';
import { cardBackTexture, cardTexture } from './cardArt/cardTextures';
import { attachFloat } from './cardMotion';
import { dropShadow, setShadowLift } from './depth';
import { editionOverlay } from './editionFx';
import { C, EDITION_COLORS, ENHANCEMENT_COLORS, FONT_BODY, SEAL_COLORS } from './theme';

/** Kartengröße in Bildschirm Einheiten: Pixel Textur (37 mal 51) dreifach vergrößert */
export const CARD_W = CARD_PX_W * CARD_PX_SCALE;
export const CARD_H = CARD_PX_H * CARD_PX_SCALE;

/** Alle lebenden Kartenansichten, damit ein Palettenwechsel in den Einstellungen sofort wirkt */
const live = new Set<CardView>();
let listening = false;
function ensureListener() {
  if (listening) return;
  listening = true;
  onSettings(() => { for (const v of live) v.refreshArt(); });
}

export class CardView extends Container {
  selected = false;
  homeX = 0;
  homeY = 0;
  homeRot = 0;
  readonly face = new Container();
  private debuffOverlay: Container | null = null;
  /** Rückseite, wird erst beim Austeilen und Einziehen gebraucht */
  private backSide: Container | null = null;
  private readonly art: Sprite;
  private readonly shadow: ReturnType<typeof dropShadow>;
  private _lift = 0;
  private readonly faceColor: number | undefined;

  private currentTexture() {
    const card = this.card;
    return cardTexture(card.suit, card.rank, getSettings().cardPalette, { face: this.faceColor, rankless: isRankless(card) });
  }

  /** Abhebung 0 bis 1: der Schatten bleibt auf dem Tisch, wenn die Karte steigt (gewählte Karte) */
  get lift() { return this._lift; }
  set lift(v: number) {
    this._lift = v;
    if (!this.destroyed) setShadowLift(this.shadow, v);
  }

  /** Textur neu setzen (nach Wechsel der Kartenpalette) */
  refreshArt() {
    if (this.destroyed) return;
    this.art.texture = this.currentTexture();
  }

  override destroy(options?: Parameters<Container['destroy']>[0]) {
    live.delete(this);
    super.destroy(options);
  }

  /** float: leichtes Schweben, 'shop': etwas ruhiger (Shop und Pack Auswahl) */
  constructor(public readonly card: Card, float: boolean | 'shop' = true) {
    super();
    const w = CARD_W, h = CARD_H;
    const rankless = isRankless(card);
    const faceColor = card.enhancement ? ENHANCEMENT_COLORS[card.enhancement] : undefined;
    this.faceColor = faceColor;

    this.shadow = cardShadow(w, h);
    // Kartendicke: ein dunkler Streifen unter der Karte macht sie zum Körper
    const body = new Graphics().roundRect(-w / 2, -h / 2 + CARD_BODY.dy, w, h, 8).fill(CARD_BODY.color);
    this.art = new Sprite(this.currentTexture());
    this.art.anchor.set(0.5);
    this.art.scale.set(CARD_PX_SCALE);
    this.face.addChild(this.shadow, body, this.art);
    live.add(this);
    ensureListener();

    // Enhancement Name unten
    if (card.enhancement && ENHANCEMENTS[card.enhancement]) {
      const tag = new Text({
        text: ENHANCEMENTS[card.enhancement].name,
        style: { fontFamily: FONT_BODY, fontSize: 13, fontWeight: '800', fill: rankless ? 0xe8e0f8 : C.cardEdge },
      });
      tag.anchor.set(0.5);
      // links von der Eckmarke unten rechts halten und lange Namen (Quecksilber) schrumpfen
      tag.x = -8;
      tag.y = h / 2 - 30;
      if (tag.width > 72) tag.scale.set(72 / tag.width);
      this.face.addChild(tag);
    }
    // Seal als Siegelkreis rechts
    if (card.seal && SEALS[card.seal]) {
      const sc = SEAL_COLORS[card.seal] ?? C.accent;
      const seal = new Graphics().circle(w / 2 - 16, 4, 12).fill(sc).stroke({ width: 2, color: 0xffffff, alpha: 0.8 });
      // Anfangsbuchstabe im Siegel (E Echo, M Münze, S Stern), damit die Farbe allein nicht erraten werden muss
      const sl = new Text({ text: SEALS[card.seal].name.charAt(0), style: { fontFamily: FONT_BODY, fontSize: 14, fontWeight: '900', fill: 0xffffff, stroke: { color: 0x1b1530, width: 3 } } });
      sl.anchor.set(0.5);
      sl.position.set(w / 2 - 16, 4);
      this.face.addChild(seal, sl);
    }
    // Edition als leuchtender Rahmen
    if (card.edition && EDITIONS[card.edition]) {
      const ec = EDITION_COLORS[card.edition] ?? C.accent;
      const glow = new Graphics()
        .roundRect(-w / 2 - 3, -h / 2 - 3, w + 6, h + 6, 12).stroke({ width: 5, color: ec, alpha: 0.9 })
        .roundRect(-w / 2 + 3, -h / 2 + 3, w - 6, h - 6, 8).stroke({ width: 2, color: 0xffffff, alpha: 0.6 });
      this.face.addChild(glow);
      const fx = editionOverlay(card.edition, w, h, 8);
      if (fx) this.face.addChild(fx);
      // Name der Edition oben, rechts von der Eckmarke
      const en = new Text({ text: EDITIONS[card.edition].name, style: { fontFamily: FONT_BODY, fontSize: 12, fontWeight: '900', fill: 0xffffff, stroke: { color: 0x1b1530, width: 4 } } });
      en.anchor.set(0.5);
      en.position.set(14, -h / 2 + 13);
      if (en.width > 56) en.scale.set(56 / en.width);
      this.face.addChild(en);
    }

    this.addChild(this.face);
    this.eventMode = 'static';
    this.cursor = 'pointer';
    // Schweben nur auf face, so stören Tweens auf der Karte selbst nicht (Phase aus der Karten ID)
    if (float) attachFloat(this.face, card.id, float === 'shop' ? 'shop' : 'hand');
  }

  /** Zeigt die Rückseite statt der Vorderseite (Austeilen und Einziehen mit Umdrehen) */
  setBackShown(on: boolean) {
    if (this.destroyed) return;
    if (on && !this.backSide) {
      this.backSide = cardBack();
      this.addChild(this.backSide);
    }
    if (this.backSide) this.backSide.visible = on;
    this.face.visible = !on;
  }

  /** Geschwächte Karten (Boss) werden abgedunkelt und durchgestrichen. */
  setDebuffed(v: boolean) {
    if (v === !!this.debuffOverlay) return;
    if (!v) {
      this.debuffOverlay?.destroy({ children: true });
      this.debuffOverlay = null;
      return;
    }
    const o = new Container();
    o.addChild(new Graphics().roundRect(-CARD_W / 2, -CARD_H / 2, CARD_W, CARD_H, 8).fill({ color: 0x1b1530, alpha: 0.55 }));
    const x = new Text({ text: '✕', style: { fontFamily: FONT_BODY, fontSize: 64, fontWeight: '900', fill: 0xff4d5e } });
    x.anchor.set(0.5);
    x.alpha = 0.85;
    o.addChild(x);
    this.face.addChild(o);
    this.debuffOverlay = o;
  }
}

/** Weicher Schatten einer Karte (Mitte als Ursprung) */
function cardShadow(w: number, h: number) {
  const s = dropShadow(w, h, SHADOW.card, { radius: 8 });
  s.x -= w / 2;
  s.y -= h / 2;
  return s;
}

export function cardBack(color: number = C.cardBack): Container {
  const c = new Container();
  const w = CARD_W, h = CARD_H;
  const body = new Graphics().roundRect(-w / 2, -h / 2 + CARD_BODY.dy, w, h, 8).fill(CARD_BODY.color);
  const art = new Sprite(cardBackTexture(color));
  art.anchor.set(0.5);
  art.scale.set(CARD_PX_SCALE);
  c.addChild(cardShadow(w, h), body, art);
  return c;
}
