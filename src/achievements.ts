/**
 * Auswertung der Erfolge. Rein: liest Profil und (falls vorhanden) den laufenden Run und markiert
 * neu erreichte Erfolge im Profil.
 */
import { ACHIEVEMENTS, RANKS, TOTAL_STARS, type AchievementDef, type Cond, type RunCheck } from './data/achievements';
import { DECKS } from './data/decks';
import { HAND_ORDER } from './data/hands';
import { getJoker } from './core/jokers';
import type { RunState } from './core/run';
import { stakeRank, type Profile } from './profile';

/** Wert einer Prüfung am laufenden Run */
export function runCheckValue(run: RunState | null, check: RunCheck): number {
  if (!run) return 0;
  const rarity = (r: string) => run.jokers.filter((j) => getJoker(j.defId)?.rarity === r).length;
  switch (check) {
    case 'jokers': return run.jokers.length;
    case 'money': return run.money;
    case 'rareJoker': return rarity('rare');
    case 'legendaryJoker': return rarity('legendary');
    case 'editionJoker': return run.jokers.filter((j) => !!j.edition).length;
    case 'maxHandLevel': return Math.max(0, ...Object.values(run.handLevels));
    case 'skips': return run.skips;
    case 'rerolls': return run.stats.rerolls;
    case 'jokersBought': return run.stats.jokersBought;
    case 'oneHandWins': return run.stats.oneHandWins;
    case 'lastHandWin': return run.phase === 'roundWon' && run.round && run.round.handsLeft === 0 && !run.round.rescuedBy ? 1 : 0;
    case 'rescued': return run.phase === 'roundWon' && run.round?.rescuedBy ? 1 : 0;
    case 'vouchers': return run.vouchers.length;
    case 'consumables': return run.consumables.length;
    case 'noDiscardWin': return run.won && run.stats.discardsUsed === 0 ? 1 : 0;
  }
}

export interface EvalContext {
  /** Anteil entdeckter Inhalte der Sammlung (0 bis 1) */
  collection: number;
}

/** Aktueller und benötigter Wert einer Bedingung, für Fortschrittsbalken (null bei Ja Nein Bedingungen) */
export function condProgress(cond: Cond, p: Profile, run: RunState | null, ctx: EvalContext): { cur: number; max: number } | null {
  switch (cond.kind) {
    case 'stat': return { cur: Math.min(p.stats[cond.stat], cond.min), max: cond.min };
    case 'handPlayed': return null;
    case 'allHands': return { cur: HAND_ORDER.filter((t) => (p.handCounts[t] ?? 0) > 0).length, max: HAND_ORDER.length };
    case 'winsDeck': return { cur: Math.min(DECKS.filter((d) => (p.winsByDeck[d.id] ?? 0) > 0).length, cond.count), max: cond.count };
    case 'winStake': return null;
    case 'winScale': return { cur: Math.min(p.bestScale, cond.level), max: cond.level };
    case 'collection': return { cur: Math.round(Math.min(ctx.collection, cond.fraction) * 100), max: Math.round(cond.fraction * 100) };
    case 'daily': {
      const entries = Object.values(p.daily);
      const cur = cond.what === 'won' ? entries.filter((e) => e.won).length : entries.length;
      return { cur: Math.min(cur, cond.min), max: cond.min };
    }
    case 'flag': return null;
    case 'run': return { cur: Math.min(runCheckValue(run, cond.check), cond.min), max: cond.min };
  }
}

export function condMet(cond: Cond, p: Profile, run: RunState | null, ctx: EvalContext): boolean {
  switch (cond.kind) {
    case 'handPlayed':
      // geheime Hände gelten gemeinsam: jede der drei löst den Erfolg "Geheimnisvoll" aus
      if (cond.type === 'fiveKind') return ['fiveKind', 'flushHouse', 'flushFive'].some((t) => (p.handCounts[t] ?? 0) > 0);
      return (p.handCounts[cond.type] ?? 0) > 0;
    case 'winStake': {
      const need = stakeRank(cond.stakeId);
      return Object.entries(p.winsByStake).some(([id, n]) => n > 0 && stakeRank(id) >= need && stakeRank(id) >= 0);
    }
    case 'winScale': return p.bestScale >= cond.level;
    case 'flag': return p.tutorialDone;
    case 'collection': return ctx.collection >= cond.fraction - 1e-9;
    default: {
      const pr = condProgress(cond, p, run, ctx);
      return !!pr && pr.cur >= pr.max;
    }
  }
}

/**
 * Prüft alle noch gesperrten Erfolge und schaltet erreichte frei. Gibt die neu freigeschalteten zurück
 * (leer, wenn nichts Neues). Das Profil wird verändert, das Speichern übernimmt der Aufrufer.
 */
export function evaluateAchievements(p: Profile, run: RunState | null, ctx: EvalContext, now = Date.now()): AchievementDef[] {
  const fresh: AchievementDef[] = [];
  for (const a of ACHIEVEMENTS) {
    if (p.unlocked[a.id] !== undefined) continue;
    if (condMet(a.cond, p, run, ctx)) {
      p.unlocked[a.id] = now;
      fresh.push(a);
    }
  }
  return fresh;
}

export function unlockedCount(p: Profile): number {
  return ACHIEVEMENTS.filter((a) => p.unlocked[a.id] !== undefined).length;
}

export function earnedStars(p: Profile): number {
  return ACHIEVEMENTS.reduce((s, a) => s + (p.unlocked[a.id] !== undefined ? a.stars : 0), 0);
}

export interface RankInfo {
  name: string;
  color: number;
  index: number;
  /** Sterne bis zum nächsten Rang, null beim höchsten */
  starsToNext: number | null;
  next: string | null;
}

export function rankOf(p: Profile): RankInfo {
  const frac = TOTAL_STARS === 0 ? 0 : earnedStars(p) / TOTAL_STARS;
  let idx = 0;
  RANKS.forEach((r, i) => { if (frac >= r.from - 1e-9) idx = i; });
  const next = RANKS[idx + 1];
  return {
    name: RANKS[idx].name,
    color: RANKS[idx].color,
    index: idx,
    starsToNext: next ? Math.max(1, Math.ceil(next.from * TOTAL_STARS - 1e-9) - earnedStars(p)) : null,
    next: next?.name ?? null,
  };
}
