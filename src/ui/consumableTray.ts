import { CONS_TRAY } from '../data/consumableArt';

// Anordnung der Consumable Karten in der Leiste. Rein und ohne DOM, damit sie getestet werden kann.
// Ein oder zwei Karten stehen in voller Größe in einer Reihe, ab drei Karten werden sie verkleinert,
// bei mehr als drei legen sie sich in zwei Reihen (obere Reihe zuerst gefüllt).

export interface TraySlot { x: number; y: number; scale: number }

/** Plätze für n Karten im Fach mit Mitte cx und Breite trayW, Mittellinie cy der einreihigen Anordnung. */
export function trayLayout(n: number, cx: number, trayW: number, cy: number): TraySlot[] {
  if (n <= 0) return [];
  if (n < CONS_TRAY.compactFrom) {
    const sp = Math.min(CONS_TRAY.fullSpacing, (trayW - CONS_TRAY.margin) / n);
    return Array.from({ length: n }, (_, i) => ({ x: cx + (i - (n - 1) / 2) * sp, y: cy, scale: 1 }));
  }
  const s = CONS_TRAY.compactScale;
  const rows = n <= 3 ? 1 : 2;
  const perRow = rows === 1 ? n : Math.ceil(n / 2);
  const out: TraySlot[] = [];
  for (let i = 0; i < n; i++) {
    const r = Math.floor(i / perRow);
    const inRow = r === 0 ? Math.min(perRow, n) : n - perRow;
    const c = i - r * perRow;
    const y = rows === 1 ? cy : cy + (r - 0.5) * CONS_TRAY.rowSpacing;
    out.push({ x: cx + (c - (inRow - 1) / 2) * CONS_TRAY.colSpacing, y, scale: s });
  }
  return out;
}
