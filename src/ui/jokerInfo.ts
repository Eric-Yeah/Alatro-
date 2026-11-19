import type { JokerDef } from '../core/jokers';

/** Wirkungsarten eines Jokers als Etikett. short steht auf der Karte, name im Tooltip. */
export type EffectTagId = 'chips' | 'mult' | 'xmult' | 'money' | 'retrigger' | 'grow' | 'passive' | 'copy' | 'rescue' | 'rule';

export interface EffectTag {
  id: EffectTagId;
  name: string;
  short: string;
  color: number;
}

export const EFFECT_TAGS: Record<EffectTagId, EffectTag> = {
  chips:     { id: 'chips',     name: 'Chips',      short: 'C',  color: 0x0a8cff },
  mult:      { id: 'mult',      name: 'Mult',       short: 'M',  color: 0xff4c40 },
  xmult:     { id: 'xmult',     name: 'X Mult',     short: 'X',  color: 0xc4271d },
  money:     { id: 'money',     name: 'Geld',       short: '$',  color: 0xf5b32b },
  retrigger: { id: 'retrigger', name: 'Retrigger',  short: 'R',  color: 0xff9a1f },
  grow:      { id: 'grow',      name: 'Wächst',     short: 'W',  color: 0x3fbf7f },
  passive:   { id: 'passive',   name: 'Passiv',     short: 'P',  color: 0x8a6ad8 },
  copy:      { id: 'copy',      name: 'Kopie',      short: 'K',  color: 0x5fe3ff },
  rescue:    { id: 'rescue',    name: 'Rettung',    short: '!',  color: 0xe0709c },
  rule:      { id: 'rule',      name: 'Regel',      short: 'G',  color: 0x8a6ad8 },
};

const ORDER: EffectTagId[] = ['xmult', 'mult', 'chips', 'money', 'retrigger', 'grow', 'passive', 'rule', 'copy', 'rescue'];

/** Leitet die Wirkungsarten aus Definition und Beschreibung ab. Jeder Joker bekommt mindestens eine. */
export function effectTags(def: JokerDef): EffectTag[] {
  const d = def.description;
  const ids = new Set<EffectTagId>();
  if (/\bX\{?\w*\}?\d*[.,]?\d* Mult|\bX\{\w+\}/.test(d)) ids.add('xmult');
  if (/(?:^|[^X\w])[+]\{?\w+\}? Mult|Mult/.test(d.replace(/X\{?[\w.]+\}? Mult/g, ''))) ids.add('mult');
  if (/Chips/.test(d)) ids.add('chips');
  if (/\$/.test(d)) ids.add('money');
  if (/erneut ausgewertet|Retrigger/.test(d)) ids.add('retrigger');
  if (def.init || /aktuell/.test(d)) ids.add('grow');
  if (def.passive) ids.add('passive');
  if (def.rules) ids.add('rule');
  if (def.copies) ids.add('copy');
  if (def.rescue) ids.add('rescue');
  if (!ids.size) ids.add('passive');
  return ORDER.filter((i) => ids.has(i)).map((i) => EFFECT_TAGS[i]);
}

/** Wann der Joker wirkt, aus der Beschreibung abgeleitet. */
export function triggerLabel(def: JokerDef): string {
  const d = def.description;
  if (def.passive || def.rules || def.copies) return def.copies ? 'Kopiert einen anderen Joker' : 'Dauerhaft, solange du ihn hast';
  if (def.rescue) return 'Einmalig beim drohenden Verlust';
  if (/in der Hand/.test(d)) return 'Pro Karte in der Hand';
  if (/gewertete|gewerteten|Jede Karte|Jedes Ace|Jeder/.test(d)) return 'Pro gewerteter Karte';
  if (/Ende jeder Runde|Runde/.test(d) && /\$/.test(d)) return 'Am Ende der Runde';
  if (/Blind/.test(d) && /\$|Wahl|geschafft/.test(d)) return 'Beim Blind';
  if (/Abwerfen|abgeworfen|Discard/.test(d)) return 'Beim Abwerfen';
  if (/verkauf/i.test(d)) return 'Beim Verkauf';
  return 'Bei jeder gespielten Hand';
}
