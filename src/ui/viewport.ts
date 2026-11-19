import { PHONE_MAX_SHORT_SIDE, VIEW_H, VIEW_W } from './theme';

export interface ViewTransform {
  /** Drehung des Spielfelds in Radiant (0 oder Viertelkreis). */
  rotation: number;
  scale: number;
  x: number;
  y: number;
}

/** Unsichere Ränder des Bildschirms in CSS Pixeln (env(safe-area-inset-*)) */
export interface Insets { top: number; right: number; bottom: number; left: number }
export const NO_INSETS: Insets = { top: 0, right: 0, bottom: 0, left: 0 };

/** Handy erkennen: die kürzere Seite des Geräts ist klein (unabhängig von der Drehung). */
export function isPhone(screenW: number, screenH: number): boolean {
  return Math.min(screenW, screenH) <= PHONE_MAX_SHORT_SIDE;
}

/**
 * Berechnet, wie das logische Spielfeld (VIEW_W mal VIEW_H) in das Fenster passt.
 * Auf dem Handy im Hochformat wird das Spielfeld um 90 Grad gedreht, damit das Spiel
 * standardmäßig im Querformat erscheint (iOS erlaubt keine feste Ausrichtung).
 * Auf dem iPad bleibt alles wie bisher, das Spielfeld wird nur eingepasst.
 */
export function computeView(winW: number, winH: number, phone: boolean, insets: Insets = NO_INSETS): ViewTransform {
  if (phone && winH > winW) {
    // Effektive Fläche im Querformat: Breite = Fensterhöhe, Höhe = Fensterbreite.
    const s = Math.min(winH / VIEW_W, winW / VIEW_H);
    const offX = (winH - VIEW_W * s) / 2;
    const offY = (winW - VIEW_H * s) / 2;
    // Drehung um +90 Grad: lokaler Punkt (x, y) landet auf Bildschirm (winW - y, x).
    return { rotation: Math.PI / 2, scale: s, x: winW - offY, y: offX };
  }
  // Sichere Ränder (Statusleiste, Home Indikator, Notch): das Spielfeld bleibt innerhalb
  const aw = Math.max(1, winW - insets.left - insets.right);
  const ah = Math.max(1, winH - insets.top - insets.bottom);
  const s = Math.min(aw / VIEW_W, ah / VIEW_H);
  return { rotation: 0, scale: s, x: insets.left + (aw - VIEW_W * s) / 2, y: insets.top + (ah - VIEW_H * s) / 2 };
}
