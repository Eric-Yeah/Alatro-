import { Container, Sprite, Text, Ticker } from 'pixi.js';
import { QUALITY_PROFILE } from '../data/juice';
import {
  ABERRATION_MS, AURA, CALLOUTS, CALLOUT_FX, FIREWORK, FX_COLORS, HEAT, IMPACT, ORB, RAIN, POINTER, type Callout,
} from '../data/spektakel';
import { getSettings, onSettings, speedFactor } from '../settings';
import { t } from '../i18n';
import type { Background } from './Background';
import type { CrtFilter } from './crt';
import { Motes, Orbs, Particles, glowTexture } from './particles';
import { PointerFx, pointer, setPointerSpace } from './pointerFx';
import { addHeat, calloutFor, coolHeat, heatBoost, nextDensity, orbCount, totalFx } from './spektakelMath';
import { sfx } from './audio';
import { VIEW_H, VIEW_W, FONT } from './theme';
import { easeOutBack } from './tween';

// Fassade der Grafikstufe Supernova. Das Spiel ruft nur diese Methoden auf, alle tun nichts, solange die Stufe nicht gewählt ist.
// Koordinaten sind Spielfeld Koordinaten der Ebene `layer` (gleiche Ebene wie fxLayer im Spiel).

type P = { x: number; y: number };

interface Delayed { ms: number; fn: () => void }
interface Aura { view: Container; alive: () => boolean; acc: number }
interface Letter { text: Text; delay: number; baseX: number; dir: number }
interface CalloutAnim { box: Container; glow: Sprite; letters: Letter[]; t: number; total: number }

const rand = (a: number, b: number) => a + Math.random() * (b - a);

class Spektakel {
  /** Ebene für Punkte Effekte, liegt im Spielfeld unter den Popups */
  readonly layer = new Container();
  /** Ebene der Staubwolke, ganz unten im Spielfeld */
  readonly moteLayer = new Container();
  /** Ebene für Zeiger Effekte, über allem */
  readonly topLayer = new Container();

  private readonly fx = new Particles();
  private readonly top = new Particles();
  private readonly orbs = new Orbs(this.fx);
  private readonly motes = new Motes();
  private readonly pointerFx = new PointerFx(this.top, () => this.enabled(), (x, y, c, s) => this.ringAt(this.top, x, y, c, s));
  private readonly callouts: CalloutAnim[] = [];
  private readonly auras: Aura[] = [];
  private readonly delayed: Delayed[] = [];

  private bg: Background | null = null;
  private crt: CrtFilter | null = null;
  private heat = 0;
  private heatHold = 0;
  private aberration = 0;
  private density = 1;
  private frames = 0;
  private frameMs = 0;
  private wasOn = false;
  private started = false;

  constructor() {
    this.layer.eventMode = 'none';
    this.topLayer.eventMode = 'none';
    this.layer.addChild(this.fx.layer, this.orbs.layer);
    this.topLayer.addChild(this.top.layer);
    this.moteLayer.addChild(this.motes.layer);
    this.layer.visible = this.topLayer.visible = this.moteLayer.visible = false;
  }

  /** Ist die Stufe Supernova gewählt? */
  enabled(): boolean {
    return QUALITY_PROFILE[getSettings().quality].spektakel;
  }

  /** Hintergrund und CRT (aus main.ts) */
  attachStage(parts: { bg?: Background; crt?: CrtFilter }) {
    if (parts.bg) this.bg = parts.bg;
    if (parts.crt) this.crt = parts.crt;
    this.start();
  }

  /** Wandlung Bildschirm zu Spielfeld (vom Spiel, über die Ebene der Partikel) */
  attachSpace(toLocal: (x: number, y: number) => P) {
    setPointerSpace(toLocal);
    this.pointerFx.attach();
    this.start();
  }

  private start() {
    if (this.started) return;
    this.started = true;
    onSettings(() => this.sync());
    Ticker.shared.add((tk) => this.tick(tk.deltaMS));
  }

  /** Stufe an oder aus: Ebenen zeigen, Hintergrund umschalten, Reste wegräumen */
  private sync() {
    const on = this.enabled();
    if (on === this.wasOn) return;
    this.wasOn = on;
    this.layer.visible = this.topLayer.visible = this.moteLayer.visible = on;
    this.bg?.setFx(on);
    if (!on) this.clear();
  }

  clear() {
    this.fx.clear();
    this.top.clear();
    this.orbs.clear();
    for (const c of this.callouts.splice(0)) c.box.destroy({ children: true });
    this.auras.length = 0;
    this.delayed.length = 0;
    this.heat = 0;
    this.aberration = 0;
    this.bg?.setHeat(0);
    this.crt?.setPunch(0);
    pointer.active = false;
  }

  // ────────────────────────────────────────────────────────────── Takt

  private tick(dtMs: number) {
    this.sync();
    if (!this.wasOn) return;
    const dt = Math.min(100, dtMs);
    // Dichte regeln: mittlere Bildzeit über ein Messfenster
    this.frames++;
    this.frameMs += dtMs;
    if (this.frames >= 30) {
      this.density = nextDensity(this.density, this.frameMs / this.frames);
      this.fx.density = this.top.density = this.density;
      this.frames = 0;
      this.frameMs = 0;
    }
    // Hitze: bleibt kurz stehen, kühlt dann ab
    if (this.heatHold > 0) this.heatHold -= dt;
    else if (this.heat > 0) this.heat = coolHeat(this.heat, dt / 1000);
    this.bg?.setHeat(this.heat);
    // Farbversatz klingt ab
    if (this.aberration > 0) {
      this.aberration = Math.max(0, this.aberration - (this.aberration0 / ABERRATION_MS) * dt);
      this.crt?.setPunch(this.aberration);
    }
    for (let i = this.delayed.length - 1; i >= 0; i--) {
      const d = this.delayed[i];
      d.ms -= dt;
      if (d.ms <= 0) { this.delayed.splice(i, 1); d.fn(); }
    }
    this.pointerFx.frame();
    this.fx.update(dt);
    this.top.update(dt);
    this.orbs.update(dt, speedFactor());
    this.motes.update(dt, pointer, this.heat);
    this.bg?.setPointer(pointer.u, pointer.v, pointer.active ? 1 : 0);
    this.updateAuras(dt);
    this.updateCallouts(dt);
  }

  private aberration0 = 0.01;

  private later(ms: number, fn: () => void) {
    this.delayed.push({ ms, fn });
  }

  // ────────────────────────────────────────────────────────────── Bausteine

  private ringAt(sys: Particles, x: number, y: number, color: number, size: number) {
    if (sys.count(1) <= 0) return;
    sys.spawn('ring', { x, y, life: 520, fadeIn: 0, size0: 0.15 * size, size1: 1.7 * size, alpha: 0.9 }, color);
  }

  /** Ring und Funken ringsum (Einschlag, Auswahl, Ziel) */
  private burst(x: number, y: number, colors: readonly number[], n: number, speed: [number, number], life: [number, number], gravity = 0, size = 16) {
    const count = this.fx.count(Math.round(n * heatBoost(this.heat)));
    for (let i = 0; i < count; i++) {
      const a = (i / count) * Math.PI * 2 + Math.random() * 0.6;
      const v = rand(speed[0], speed[1]);
      this.fx.spawn(Math.random() < 0.5 ? 'spark' : 'glow', {
        x, y, vx: Math.cos(a) * v, vy: Math.sin(a) * v, drag: 3, gravity,
        life: rand(life[0], life[1]), rot: Math.random() * 6.28, vr: (Math.random() - 0.5) * 8,
      }, colors[i % colors.length], { from: size * rand(0.8, 1.6), to: 3 });
    }
  }

  private impact(at: P, amp: number) {
    if (!this.bg || amp <= 0) return;
    const g = this.layer.toGlobal(at);
    this.bg.impact(g.x, g.y, amp);
  }

  private warm(amount: number, hold = true) {
    this.heat = addHeat(this.heat, amount);
    if (hold) this.heatHold = HEAT.holdMs;
  }

  private kickAberration(a: number) {
    if (a <= 0) return;
    this.aberration0 = Math.max(this.aberration, a);
    this.aberration = this.aberration0;
    this.crt?.setPunch(this.aberration);
  }

  // ────────────────────────────────────────────────────────────── Aufrufe des Spiels

  /**
   * Ein Zählschritt der Wertung. `from` ist der Auslöser (Karte, Joker), `targets` die Mitten der Chips und Mult Anzeige.
   * `onHit` meldet jeden Einschlag (zum Beispiel für das Pulsieren der Anzeige).
   */
  scoreEvent(ev: { chips?: number; mult?: number; xMult?: number; money?: number }, from: P, targets: { chips: P; mult: P }, onHit?: (kind: 'chips' | 'mult' | 'xmult') => void) {
    if (!this.enabled()) return;
    this.warm(ev.xMult ? HEAT.perXMult : HEAT.perStep);
    const launch = (value: number, kind: 'chips' | 'mult' | 'xmult') => {
      const to = kind === 'chips' ? targets.chips : targets.mult;
      const color = kind === 'chips' ? FX_COLORS.chips : kind === 'mult' ? FX_COLORS.mult : FX_COLORS.xmult;
      const core = kind === 'chips' ? FX_COLORS.chipsCore : FX_COLORS.multCore;
      const n = kind === 'xmult' ? 1 : orbCount(value);
      for (let i = 0; i < n; i++) {
        this.orbs.launch({
          from, to, color, core, delay: i * ORB.staggerMs, scale: kind === 'xmult' ? 1.9 : 1,
          onArrive: () => this.hit(to, kind, color, onHit),
        });
      }
      // Abschuss: kleine Funkengarbe am Auslöser
      this.burst(from.x, from.y, [color, core], kind === 'xmult' ? 12 : 6, [60, 200], [260, 480], 0, 14);
    };
    if (ev.chips) launch(ev.chips, 'chips');
    if (ev.mult) launch(ev.mult, 'mult');
    if (ev.xMult) launch(ev.xMult * 10, 'xmult');
    if (ev.money) this.coins(from, Math.min(14, 3 + ev.money));
  }

  private hit(at: P, kind: 'chips' | 'mult' | 'xmult', color: number, onHit?: (kind: 'chips' | 'mult' | 'xmult') => void) {
    const big = kind === 'xmult';
    this.ringAt(this.fx, at.x, at.y, color, big ? 1.9 : ORB.hitRing * 0.7);
    if (big) {
      this.ringAt(this.fx, at.x, at.y, FX_COLORS.money, 1.2);
      this.impact(at, IMPACT.xmult);
      this.kickAberration(0.004);
    }
    this.burst(at.x, at.y, [color, 0xffffff], big ? ORB.hitSparks * 3 : ORB.hitSparks, ORB.hitSparkSpeed, ORB.hitSparkLife, big ? 120 : 0, big ? 22 : 15);
    onHit?.(kind);
  }

  /** Münzen: Fontäne goldener Funken, die zurückfallen */
  coins(at: P, n: number) {
    if (!this.enabled()) return;
    const count = this.fx.count(n);
    for (let i = 0; i < count; i++) {
      this.fx.spawn('spark', {
        x: at.x + rand(-14, 14), y: at.y, vx: rand(-110, 110), vy: rand(-380, -200), gravity: 760, drag: 0.4,
        life: rand(700, 1100), rot: Math.random() * 6.28, vr: rand(-9, 9),
      }, i % 3 === 0 ? 0xffffff : FX_COLORS.money, { from: 26, to: 10 });
    }
  }

  /** Gesamtpunkte der Hand: Ringe, Feuerwerk, Konfetti, Schockwelle, Farbversatz, Callout. Gibt den Zoom Stoß für die Bühne zurück. */
  total(tierIndex: number, ratio: number, at: P): { punch: number } {
    if (!this.enabled()) return { punch: 0 };
    const fx = totalFx(tierIndex);
    for (let i = 0; i < fx.rings; i++) {
      this.later(i * 90, () => this.ringAt(this.fx, at.x, at.y, [FX_COLORS.holo, FX_COLORS.money, FX_COLORS.violet, 0xffffff][i % 4], 1.8 + i * 0.7));
    }
    for (let i = 0; i < fx.bursts; i++) {
      this.later(i * FIREWORK.gapMs, () => this.firework({ x: at.x + rand(-FIREWORK.spread[0], FIREWORK.spread[0]), y: at.y + rand(-FIREWORK.spread[1], FIREWORK.spread[1]) - 40 }, i));
    }
    this.confetti(at, fx.confetti);
    this.impact(at, IMPACT.total[Math.min(tierIndex, IMPACT.total.length - 1)] ?? 0);
    this.kickAberration(fx.aberration);
    this.warm(fx.punch * 3, true);
    const c = calloutFor(ratio);
    if (c) this.callout(c);
    return { punch: fx.punch };
  }

  /** Feuerwerk Salve in einer Farbfamilie je Nummer */
  private firework(at: P, n: number) {
    const families = [
      [FX_COLORS.holo, 0xffffff], [FX_COLORS.money, 0xfff2b0], [FX_COLORS.violet, 0xe6d6ff], [FX_COLORS.mult, FX_COLORS.multCore], [FX_COLORS.goal, 0xffffff],
    ];
    const col = families[n % families.length];
    this.burst(at.x, at.y, col, FIREWORK.sparks, FIREWORK.speed, FIREWORK.life, FIREWORK.gravity, 20);
    this.ringAt(this.fx, at.x, at.y, col[0], 0.9);
  }

  /** Konfetti aus einem Punkt nach oben, fällt zurück */
  confetti(at: P, n: number) {
    const count = this.fx.count(n);
    for (let i = 0; i < count; i++) {
      const a = -Math.PI / 2 + rand(-0.9, 0.9);
      const v = rand(260, 760);
      this.fx.spawn('dot', {
        x: at.x, y: at.y, vx: Math.cos(a) * v, vy: Math.sin(a) * v, gravity: 620, drag: 1.4,
        life: rand(1100, 1900), rot: Math.random() * 6.28, vr: rand(-10, 10), fadeIn: 0,
      }, FX_COLORS.confetti[i % FX_COLORS.confetti.length], { from: rand(5, 9), to: rand(4, 7), flutter: true, normal: true });
    }
  }

  /** Ziel des Blinds erreicht */
  goal(at: P) {
    if (!this.enabled()) return;
    this.ringAt(this.fx, at.x, at.y, FX_COLORS.goal, 2.4);
    this.ringAt(this.fx, at.x, at.y, 0xffffff, 1.4);
    this.burst(at.x, at.y, [FX_COLORS.goal, 0xffffff, FX_COLORS.money], 30, [160, 420], [500, 900], 200, 18);
    this.confetti(at, 36);
    this.impact(at, IMPACT.goal);
    this.kickAberration(0.003);
    this.warm(0.2, true);
  }

  /** Runde gewonnen: Konfettiregen von oben und Schockwelle. big bei großem Überschuss. */
  roundWon(big: boolean) {
    if (!this.enabled()) return;
    const n = big ? RAIN.piecesBig : RAIN.pieces;
    const waves = 6;
    for (let w = 0; w < waves; w++) {
      this.later((w / waves) * RAIN.spreadMs, () => this.rain(Math.round(n / waves)));
    }
    this.impact({ x: VIEW_W / 2, y: VIEW_H / 2 }, IMPACT.won);
    this.kickAberration(0.005);
    this.warm(0.5, true);
  }

  /** Regen läuft in der obersten Ebene, damit er auch über dem Fenster der gewonnenen Runde fällt */
  private rain(n: number) {
    const count = this.top.count(n);
    for (let i = 0; i < count; i++) {
      this.top.spawn('dot', {
        x: rand(-40, VIEW_W + 40), y: rand(-60, -10), vx: rand(-RAIN.sway, RAIN.sway), vy: rand(RAIN.fall[0], RAIN.fall[1]),
        drag: 0.2, life: rand(RAIN.life[0], RAIN.life[1]), rot: Math.random() * 6.28, vr: rand(-7, 7), fadeIn: 0,
      }, FX_COLORS.confetti[i % FX_COLORS.confetti.length], { from: rand(6, 11), to: rand(5, 9), flutter: true, normal: true });
    }
  }

  /** Karte gewählt oder abgewählt */
  select(at: P, on: boolean) {
    if (!this.enabled()) return;
    if (on) {
      this.ringAt(this.fx, at.x, at.y, FX_COLORS.holo, AURA.select.ring);
      this.burst(at.x, at.y - 30, [FX_COLORS.holo, 0xffffff, FX_COLORS.money], AURA.select.sparks, [80, 240], [280, 520], 0, 14);
    } else {
      this.burst(at.x, at.y, [FX_COLORS.violet], 5, [40, 120], [220, 380], 0, 10);
    }
  }

  /** Staubwölkchen (Ablegen, Verkaufen) */
  puff(at: P, color: number = FX_COLORS.holo) {
    if (!this.enabled()) return;
    this.burst(at.x, at.y, [color, 0xffffff], AURA.discard.puff, [50, 180], [300, 560], 0, 14);
  }

  /** Funken Aura um ein Objekt, solange `alive` wahr ist */
  aura(view: Container, alive: () => boolean) {
    if (!this.enabled()) return;
    if (this.auras.some((a) => a.view === view)) return;
    this.auras.push({ view, alive, acc: 0 });
  }

  private updateAuras(dt: number) {
    for (let i = this.auras.length - 1; i >= 0; i--) {
      const a = this.auras[i];
      if (a.view.destroyed || !a.alive()) { this.auras.splice(i, 1); continue; }
      a.acc += dt;
      if (a.acc < AURA.everyMs / heatBoost(this.heat)) continue;
      a.acc = 0;
      if (this.fx.count(1) <= 0) continue;
      const c = this.layer.toLocal(a.view.getGlobalPosition());
      const [l0, l1] = AURA.life;
      this.fx.spawn(Math.random() < 0.5 ? 'spark' : 'glow', {
        x: c.x + rand(-54, 54), y: c.y + rand(-76, 70), vx: rand(-14, 14), vy: rand(-46, -16), drag: 0.8,
        life: rand(l0, l1), rot: Math.random() * 6.28, vr: rand(-3, 3),
      }, Math.random() < 0.3 ? FX_COLORS.money : FX_COLORS.holo, { from: rand(12, 22), to: 4 });
    }
  }

  // ────────────────────────────────────────────────────────────── Callout

  /** Großes Wort über der Spielfläche, Buchstaben springen nacheinander herein */
  callout(c: Callout) {
    const word = t(c.word);
    const box = new Container();
    box.position.set(this.calloutX, CALLOUT_FX.y);
    const glow = new Sprite(glowTexture());
    glow.anchor.set(0.5);
    glow.tint = c.edge;
    glow.blendMode = 'add';
    glow.alpha = 0;
    box.addChild(glow);
    const letters: Letter[] = [];
    const texts = [...word].map((ch) => new Text({
      text: ch,
      style: { fontFamily: FONT, fontSize: c.size, fontWeight: '900', fill: c.color, stroke: { color: c.edge, width: Math.round(c.size / 7) }, dropShadow: { color: 0x070b11, alpha: 1, blur: 0, angle: Math.PI / 2, distance: Math.round(c.size / 11) } },
    }));
    const widths = texts.map((x) => x.width);
    const total = widths.reduce((a, b) => a + b, 0);
    let x = -total / 2;
    texts.forEach((tx, i) => {
      tx.anchor.set(0.5);
      tx.position.set(x + widths[i] / 2, 0);
      tx.scale.set(0);
      tx.alpha = 0;
      box.addChild(tx);
      letters.push({ text: tx, delay: i * CALLOUT_FX.letterGapMs, baseX: tx.x, dir: i % 2 ? 1 : -1 });
      x += widths[i];
    });
    glow.scale.set(total / 40, c.size / 36);
    this.layer.addChild(box);
    this.callouts.push({ box, glow, letters, t: 0, total });
    sfx.callout(Math.max(0, CALLOUTS.indexOf(c)));
  }

  /** Mitte der Spielfläche, in der das Callout erscheint (vom Spiel gesetzt) */
  calloutX = 850;

  private updateCallouts(dt: number) {
    const sp = speedFactor();
    for (let i = this.callouts.length - 1; i >= 0; i--) {
      const c = this.callouts[i];
      c.t += dt * sp;
      const enterEnd = c.letters.length * CALLOUT_FX.letterGapMs + CALLOUT_FX.popMs;
      const holdEnd = enterEnd + CALLOUT_FX.holdMs;
      const fadeK = Math.min(1, Math.max(0, (c.t - holdEnd) / CALLOUT_FX.fadeMs));
      for (const l of c.letters) {
        const k = Math.min(1, Math.max(0, (c.t - l.delay) / CALLOUT_FX.popMs));
        const s = easeOutBack(k);
        l.text.scale.set(s * (1 - fadeK * 0.25));
        l.text.alpha = Math.min(1, k * 2) * (1 - fadeK);
        l.text.rotation = (1 - k) * 0.6 * l.dir;
        const wave = k >= 1 ? Math.sin((c.t / CALLOUT_FX.waveMs) * Math.PI * 2 + l.baseX * 0.012) * CALLOUT_FX.waveAmp : 0;
        l.text.y = wave - (1 - k) * 30;
      }
      c.glow.alpha = Math.min(0.9, (c.t / enterEnd) * 0.9) * (1 - fadeK);
      c.box.y = CALLOUT_FX.y - fadeK * CALLOUT_FX.rise;
      if (fadeK >= 1) {
        c.box.destroy({ children: true });
        this.callouts.splice(i, 1);
      }
    }
  }

  // ────────────────────────────────────────────────────────────── Hitze von außen

  /** Hitze zurücksetzen (neue Hand, neuer Bildschirm) */
  cool() {
    this.heatHold = 0;
  }

  /** Pegel der Hitze (für Prüfungen) */
  get heatLevel(): number {
    return this.heat;
  }

  get tapRing(): number {
    return POINTER.tapRing;
  }
}

export const spektakel = new Spektakel();
