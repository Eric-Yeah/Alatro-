import type { JokerDef } from '../core/jokers';
import { germanJokerText } from '../i18n/deSource';
import { getLang, t } from '../i18n';

/** Wirkungsarten eines Jokers als Etikett. short steht auf der Karte, name im Tooltip. */
export type EffectTagId = 'chips' | 'mult' | 'xmult' | 'money' | 'retrigger' | 'grow' | 'passive' | 'copy' | 'rescue' | 'rule';

export interface EffectTag {
  id: EffectTagId;
  /** Name im Tooltip (übersetzt zur Laufzeit) */
  readonly name: string;
  /** Buchstabe auf der Karte (Anfangsbuchstabe des Namens in der gewählten Sprache) */
  readonly short: string;
  color: number;
}

/** Kurzzeichen je Sprache: Deutsch nach den deutschen Namen, Englisch nach den englischen (ohne Doppelungen) */
const SHORTS: Record<EffectTagId, [de: string, en: string]> = {
  chips: ['C', 'C'], mult: ['M', 'M'], xmult: ['X', 'X'], money: ['$', '$'], retrigger: ['R', 'R'],
  grow: ['W', 'G'], passive: ['P', 'P'], copy: ['K', '2'], rescue: ['!', '!'], rule: ['G', 'U'],
};

const tag = (id: EffectTagId, color: number, name: () => string): EffectTag => ({
  id,
  color,
  get name() { return name(); },
  get short() { return SHORTS[id][getLang() === 'en' ? 1 : 0]; },
});

export const EFFECT_TAGS: Record<EffectTagId, EffectTag> = {
  chips:     tag('chips', 0x0a8cff, () => t('Chips')),
  mult:      tag('mult', 0xff4c40, () => t('Mult')),
  xmult:     tag('xmult', 0xc4271d, () => t('X Mult')),
  money:     tag('money', 0xf5b32b, () => t('Geld')),
  retrigger: tag('retrigger', 0xff9a1f, () => t('Retrigger')),
  grow:      tag('grow', 0x3fbf7f, () => t('Wächst')),
  passive:   tag('passive', 0x8a6ad8, () => t('Passiv')),
  copy:      tag('copy', 0x5fe3ff, () => t('Kopie')),
  rescue:    tag('rescue', 0xe0709c, () => t('Rettung')),
  rule:      tag('rule', 0x8a6ad8, () => t('Regel')),
};

const ORDER: EffectTagId[] = ['xmult', 'mult', 'chips', 'money', 'retrigger', 'grow', 'passive', 'rule', 'copy', 'rescue'];

/** Leitet die Wirkungsarten aus Definition und Beschreibung ab. Jeder Joker bekommt mindestens eine. */
export function effectTags(def: JokerDef): EffectTag[] {
  // Das deutsche Original (siehe deSource.ts) ist die Quelle, die englischen Muster dienen als Rückfall
  const d = germanJokerText(def);
  const ids = new Set<EffectTagId>();
  if (/\bX\{?\w*\}?\d*[.,]?\d* Mult|\bX\{\w+\}/.test(d)) ids.add('xmult');
  if (/(?:^|[^X\w])[+]\{?\w+\}? Mult|Mult/.test(d.replace(/X\{?[\w.]+\}? Mult/g, ''))) ids.add('mult');
  if (/Chips/.test(d)) ids.add('chips');
  if (/\$/.test(d)) ids.add('money');
  if (/erneut ausgewertet|Retrigger|retrigger|scored again|trigger again|triggers again/.test(d)) ids.add('retrigger');
  if (def.init || /aktuell|currently|\(current/.test(d)) ids.add('grow');
  if (def.passive) ids.add('passive');
  if (def.rules) ids.add('rule');
  if (def.copies) ids.add('copy');
  if (def.rescue) ids.add('rescue');
  if (!ids.size) ids.add('passive');
  return ORDER.filter((i) => ids.has(i)).map((i) => EFFECT_TAGS[i]);
}

/** Wann der Joker wirkt, aus der Beschreibung abgeleitet. */
export function triggerLabel(def: JokerDef): string {
  const d = germanJokerText(def);
  if (def.passive || def.rules || def.copies) return def.copies ? t('Kopiert einen anderen Joker') : t('Dauerhaft, solange du ihn hast');
  if (def.rescue) return t('Einmalig beim drohenden Verlust');
  if (/in der Hand|held in hand|in hand/.test(d)) return t('Pro Karte in der Hand');
  if (/gewertete|gewerteten|Jede Karte|Jedes Ace|Jeder|[Ss]cored|[Ee]ach card/.test(d)) return t('Pro gewerteter Karte');
  if (/Ende jeder Runde|Runde|end of (?:each |the )?round/.test(d) && /\$/.test(d)) return t('Am Ende der Runde');
  if (/Blind/.test(d) && /\$|Wahl|geschafft|[Ss]elect|[Cc]hoos|[Bb]eat|[Dd]efeat/.test(d)) return t('Beim Blind');
  if (/Abwerfen|abgeworfen|Discard|discard/.test(d)) return t('Beim Abwerfen');
  if (/verkauf|[Ss]ell|[Ss]old/i.test(d)) return t('Beim Verkauf');
  return t('Bei jeder gespielten Hand');
}
