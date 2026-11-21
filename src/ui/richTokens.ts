/** Reine Textauszeichnung für Beschreibungen (ohne Pixi, getestet). Zerlegt Text in farbige Abschnitte. */
import { getLang } from '../i18n';

export type RichKind =
  | 'plain' | 'chips' | 'mult' | 'xmult' | 'money' | 'hands' | 'discards'
  | 'suitRed' | 'suitDark' | 'handType' | 'cond' | 'now' | 'rank';

export interface RichRun {
  text: string;
  kind: RichKind;
}

/**
 * Reihenfolge: spätere Muster überschreiben frühere (Schlüsselwörter schlagen Bedingungen).
 * Bedingungen und "aktuell" Hinweise hängen von der Sprache der Beschreibung ab, die Schlüsselwörter
 * (Chips, Mult, Handnamen, Suits, $) sind in beiden Sprachen gleich.
 */
const BASE_PATTERNS_DE: [RichKind, RegExp][] = [
  ['cond', /\b(?:wenn|Wenn|bei|Bei|pro|Pro|jede|Jede|jedes|Jedes|jeder|Jeder|die erste|Die erste|die letzte|Die letzte)\b[^,.;:\n(]*?(?=\s+(?:gibt|geben|erhält)\b|[,.;:\n(]|$)/g],
  ['now', /\(aktuell[^)]*\)/g],
];

const BASE_PATTERNS_EN: [RichKind, RegExp][] = [
  ['cond', /\b(?:if|If|when|When|whenever|Whenever|per|Per|each|Each|every|Every|for each|For each|for every|For every|the first|The first|the last|The last|on the first|On the first|on the last|On the last|at the start of|At the start of|at the end of|At the end of|after|After|before|Before)\b[^,.;:\n(]*?(?=\s+(?:gives?|grants?|earns?|gains?|adds?|scores?|creates?|retriggers?|becomes?|turns?|permanently)\b|[,.;:\n(]|$)/g],
  ['now', /\((?:currently|current|now)[^)]*\)/g],
];

const basePatterns = () => (getLang() === 'en' ? BASE_PATTERNS_EN : BASE_PATTERNS_DE);

const KEYWORD_PATTERNS: [RichKind, RegExp][] = [
  ['handType', /\b(?:Straight Flush|Five of a Kind|Four of a Kind|Three of a Kind|Flush House|Flush Five|Full House|Two Pair|High Card|Flush|Straight|Pair)\b/g],
  ['rank', /\b(?:Face Cards?|Aces?|Kings?|Queens?|Jacks?)\b/g],
  ['suitRed', /\b(?:Hearts|Diamonds)\b/g],
  ['suitDark', /\b(?:Spades|Clubs)\b/g],
  ['hands', /(?:[+-]?\d+ )?\bHands\b|[+-]\d+ Hand\b|\bHand Size\b/g],
  ['discards', /(?:[+-]?\d+ )?\bDiscards?\b/g],
  ['money', /[+-]?\$\d+/g],
  ['chips', /(?:[+-]?\d+(?:[.,]\d+)? )?\bChips\b/g],
  ['mult', /(?:[+-]?\d+(?:[.,]\d+)? )?\bMult\b/g],
  ['xmult', /\bX\d+(?:[.,]\d+)?(?: Mult\b)?/g],
];

export function tokenizeRich(text: string): RichRun[] {
  const kinds: RichKind[] = new Array(text.length).fill('plain');
  const mark = (re: RegExp, kind: RichKind) => {
    re.lastIndex = 0;
    let m: RegExpExecArray | null;
    while ((m = re.exec(text))) {
      if (!m[0]) { re.lastIndex++; continue; }
      for (let i = m.index; i < m.index + m[0].length; i++) kinds[i] = kind;
    }
  };
  for (const [k, re] of basePatterns()) mark(re, k);
  for (const [k, re] of KEYWORD_PATTERNS) mark(re, k);
  const runs: RichRun[] = [];
  for (let i = 0; i < text.length; i++) {
    const last = runs[runs.length - 1];
    if (last && last.kind === kinds[i]) last.text += text[i];
    else runs.push({ text: text[i], kind: kinds[i] });
  }
  return runs;
}

/** Wörter (durch Leerzeichen getrennt) aus Abschnitten, ein Wort kann mehrere Abschnitte haben. '\n' ist ein Zeilenumbruch. */
export type RichWord = { runs: RichRun[] } | { br: true };

export function toWords(runs: RichRun[]): RichWord[] {
  const out: RichWord[] = [];
  let cur: RichRun[] = [];
  const flush = () => { if (cur.length) { out.push({ runs: cur }); cur = []; } };
  for (const r of runs) {
    // Schlüsselwörter (z. B. "X3 Mult", "Full House") bleiben ungeteilt, nur Fließtext bricht an Leerzeichen
    if (r.kind !== 'plain' && r.kind !== 'cond' && r.kind !== 'now') {
      const lead = r.text.match(/^ +/)?.[0] ?? '';
      if (lead) flush();
      cur.push({ text: r.text.trim(), kind: r.kind });
      if (/ $/.test(r.text)) flush();
      continue;
    }
    // Teile nach Leerraum und Zeilenumbruch, die Art des Abschnitts bleibt erhalten
    const parts = r.text.split(/( |\n)/);
    for (const p of parts) {
      if (p === ' ') flush();
      else if (p === '\n') { flush(); out.push({ br: true }); }
      else if (p) cur.push({ text: p, kind: r.kind });
    }
  }
  flush();
  return out;
}
