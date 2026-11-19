/**
 * Sammlung (Collection): Inhalte, die man im Spiel gesehen hat. Die Ermittlung aus einem Run
 * ist rein, nur load und save berühren den Browser Speicher.
 */
import { BOSSES } from './data/bosses';
import { CONSUMABLES } from './data/consumables';
import { DECKS } from './data/decks';
import { EDITIONS, ENHANCEMENTS, SEALS } from './data/modifiers';
import { TAGS } from './data/tags';
import { VOUCHERS } from './data/vouchers';
import { allJokers, getJoker, jokerDescription } from './core/jokers';
import type { RunState } from './core/run';

const KEY = 'alatro.collection.v1';
/** Einträge, die der Spieler in der Sammlung schon gesehen hat (für die Neu Marker) */
const SEEN_KEY = 'alatro.collection.seen.v1';

export type CollectionTab = 'jokers' | 'sternbild' | 'elixier' | 'omen' | 'vouchers' | 'tags' | 'bosses' | 'decks' | 'mods';

export const COLLECTION_TABS: { id: CollectionTab; name: string }[] = [
  { id: 'jokers', name: 'Jokers' },
  { id: 'sternbild', name: 'Sternbilder' },
  { id: 'elixier', name: 'Elixiere' },
  { id: 'omen', name: 'Omen' },
  { id: 'vouchers', name: 'Vouchers' },
  { id: 'tags', name: 'Tags' },
  { id: 'bosses', name: 'Bosse' },
  { id: 'decks', name: 'Decks' },
  { id: 'mods', name: 'Modifikatoren' },
];

export interface CollectionEntry {
  /** eindeutiger Schlüssel, z. B. joker:funke */
  key: string;
  name: string;
  description: string;
  /** Untergruppe, z. B. Rarity oder Modifikator Art */
  group: string;
  /** Farbe für die Anzeige, falls die Daten eine kennen */
  color?: number;
}

/** Alle Einträge eines Reiters (unabhängig davon, ob entdeckt) */
export function collectionEntries(tab: CollectionTab): CollectionEntry[] {
  switch (tab) {
    case 'jokers':
      return allJokers().map((j) => ({ key: `joker:${j.id}`, name: j.name, description: jokerDescription(j), group: j.rarity }));
    case 'sternbild':
    case 'elixier':
    case 'omen':
      return CONSUMABLES.filter((c) => c.type === tab).map((c) => ({ key: `consumable:${c.id}`, name: c.name, description: c.description, group: c.type }));
    case 'vouchers':
      return VOUCHERS.map((v) => ({ key: `voucher:${v.id}`, name: v.name, description: v.description, group: v.requires ? 'Upgrade' : 'Basis' }));
    case 'tags':
      return TAGS.map((t) => ({ key: `tag:${t.id}`, name: t.name, description: t.description, group: 'tag' }));
    case 'bosses':
      return BOSSES.map((b) => ({ key: `boss:${b.id}`, name: b.name, description: b.description, group: b.showdown ? 'Showdown' : 'Boss', color: b.color }));
    case 'decks':
      return DECKS.map((d) => ({ key: `deck:${d.id}`, name: d.name, description: d.description, group: 'deck', color: d.color }));
    case 'mods':
      return [
        ...Object.values(ENHANCEMENTS).map((e) => ({ key: `enhancement:${e.id}`, name: e.name, description: e.description, group: 'Enhancement' })),
        ...Object.values(SEALS).map((s) => ({ key: `seal:${s.id}`, name: s.name, description: s.description, group: 'Seal' })),
        ...Object.values(EDITIONS).map((e) => ({ key: `edition:${e.id}`, name: e.name, description: e.description, group: 'Edition' })),
      ];
  }
}

/** Schlüssel aller Inhalte, die im Zustand des Runs sichtbar sind */
export function discoveredKeys(run: RunState): string[] {
  const keys = new Set<string>();
  const add = (kind: string, id?: string | null) => { if (id) keys.add(`${kind}:${id}`); };
  const addCard = (c: { enhancement?: string; seal?: string; edition?: string }) => {
    add('enhancement', c.enhancement);
    add('seal', c.seal);
    add('edition', c.edition);
  };
  add('deck', run.deckId);
  for (const j of run.jokers) { add('joker', j.defId); add('edition', j.edition); }
  for (const c of run.consumables) add('consumable', c.defId);
  for (const v of run.vouchers) add('voucher', v);
  for (const t of run.pendingTags) add('tag', t);
  if (run.anteTags) { add('tag', run.anteTags.small); add('tag', run.anteTags.big); }
  add('boss', run.anteBoss);
  add('boss', run.round?.bossId);
  run.deck.forEach(addCard);
  for (const item of run.shop?.cards ?? []) {
    if (!item) continue;
    if (item.kind === 'joker') { add('joker', item.defId); add('edition', item.edition); }
    else if (item.kind === 'consumable') add('consumable', item.defId);
    else addCard(item.card);
  }
  add('voucher', run.shop?.voucher?.voucherId);
  for (const o of run.pack?.options ?? []) {
    if (!o) continue;
    if (o.kind === 'joker') { add('joker', o.defId); add('edition', o.edition); }
    else if (o.kind === 'consumable') add('consumable', o.defId);
    else addCard(o.card);
  }
  return [...keys];
}

/** Vereinigung ohne Duplikate, Reihenfolge der ersten Funde bleibt */
export function mergeDiscovered(existing: string[], found: string[]): string[] {
  const set = new Set(existing);
  for (const k of found) set.add(k);
  return set.size === existing.length ? existing : [...set];
}

export function loadDiscovered(): string[] {
  try {
    const raw = JSON.parse(localStorage.getItem(KEY) ?? '[]');
    return Array.isArray(raw) ? raw.filter((k): k is string => typeof k === 'string') : [];
  } catch {
    return [];
  }
}

export function saveDiscovered(keys: string[]) {
  try {
    localStorage.setItem(KEY, JSON.stringify(keys));
  } catch {
    /* Speicher nicht verfügbar */
  }
}

/** Trägt neue Funde des Runs in die Sammlung ein */
export function recordRun(run: RunState) {
  const before = loadDiscovered();
  const after = mergeDiscovered(before, discoveredKeys(run));
  if (after !== before) saveDiscovered(after);
}

/** Anteil der entdeckten Einträge über alle Reiter (für Erfolge und Anzeige) */
export function collectionProgress(discovered: string[] = loadDiscovered()): { found: number; total: number; fraction: number } {
  const all = COLLECTION_TABS.flatMap((t) => collectionEntries(t.id).map((e) => e.key));
  const set = new Set(discovered);
  const found = all.filter((k) => set.has(k)).length;
  return { found, total: all.length, fraction: all.length ? found / all.length : 0 };
}

/** Fortschritt eines einzelnen Reiters */
export function tabProgress(tab: CollectionTab, discovered: string[] = loadDiscovered()): { found: number; total: number } {
  const set = new Set(discovered);
  const entries = collectionEntries(tab);
  return { found: entries.filter((e) => set.has(e.key)).length, total: entries.length };
}

/**
 * Hinweis für einen noch nicht entdeckten Eintrag. Er nennt, wo man ihn findet, ohne den Namen zu verraten.
 * Rein aus den Daten abgeleitet, damit neue Inhalte automatisch einen Hinweis bekommen.
 */
export function collectionHint(e: CollectionEntry): string {
  const [kind, id] = e.key.split(':');
  switch (kind) {
    case 'joker': {
      if (e.group === 'legendary') return 'Sehr selten. Kommt nur über ein Omen ins Spiel.';
      const min = getJoker(id)?.minAnte ?? 1;
      const rar = e.group === 'common' ? 'Häufig im Shop' : e.group === 'uncommon' ? 'Gelegentlich im Shop' : 'Selten im Shop';
      return min > 1 ? `${rar}, erst ab Ante ${min}.` : `${rar}.`;
    }
    case 'consumable':
      return e.group === 'sternbild' ? 'Ein Sternbild. Kauf Sternbild Packs oder spiele Hände seltener Art.'
        : e.group === 'elixier' ? 'Ein Elixier. Es steckt in Elixier Packs und im Shop.' : 'Ein Omen. Es steckt in Omen Packs und im Shop.';
    case 'voucher':
      return e.group === 'Upgrade' ? 'Ein Upgrade. Der Basis Voucher dazu muss zuerst gekauft sein.' : 'Wird im Shop als Voucher des Antes angeboten.';
    case 'tag': {
      const min = TAGS.find((t) => t.id === id)?.minAnte ?? 1;
      return min > 1 ? `Eine Skip Belohnung, erst ab Ante ${min}.` : 'Eine Skip Belohnung. Überspringe einen Blind.';
    }
    case 'boss':
      return e.group === 'Showdown' ? 'Ein Showdown Boss. Er wartet am Ende des Runs.' : 'Ein Boss Blind. Er erwartet dich am Ende eines Antes.';
    case 'deck':
      return 'Starte einen Run mit diesem Deck.';
    default:
      return e.group === 'Edition' ? 'Eine Edition auf Jokers und Karten.' : e.group === 'Seal' ? 'Ein Seal auf einer Karte.' : 'Ein Enhancement auf einer Karte.';
  }
}

export function loadSeen(): string[] {
  try {
    const raw = JSON.parse(localStorage.getItem(SEEN_KEY) ?? 'null');
    return Array.isArray(raw) ? raw.filter((k): k is string => typeof k === 'string') : [];
  } catch {
    return [];
  }
}

export function saveSeen(keys: string[]) {
  try {
    localStorage.setItem(SEEN_KEY, JSON.stringify(keys));
  } catch {
    /* Speicher nicht verfügbar */
  }
}

/**
 * Entdeckte Einträge, die noch nicht angesehen wurden. Gibt es noch keinen Seen Speicher (Update von
 * einer älteren Version), gilt alles Bisherige als gesehen, damit nicht die ganze Sammlung "Neu" trägt.
 */
export function unseenKeys(discovered: string[] = loadDiscovered()): string[] {
  let seen: string[] | null = null;
  try {
    seen = localStorage.getItem(SEEN_KEY) === null ? null : loadSeen();
  } catch {
    seen = null;
  }
  if (seen === null) {
    saveSeen(discovered);
    return [];
  }
  const set = new Set(seen);
  return discovered.filter((k) => !set.has(k));
}

/** Alle entdeckten Einträge als gesehen markieren */
export function markAllSeen() {
  saveSeen(loadDiscovered());
}

/** Anzeigename eines Eintrags anhand des Schlüssels, oder null */
export function entryName(key: string): string | null {
  for (const t of COLLECTION_TABS) {
    const hit = collectionEntries(t.id).find((e) => e.key === key);
    if (hit) return hit.name;
  }
  return null;
}
