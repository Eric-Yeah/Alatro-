import { PHONE_MAX_SHORT_SIDE, VIEW_H, VIEW_W } from './theme';

export interface ViewTransform {
  /** Drehung des Spielfelds in Radiant (0 oder Viertelkreis). */
  rotation: number;
  scale: number;
  x: number;
  y: number;
}

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
export function computeView(winW: number, winH: number, phone: boolean): ViewTransform {
  if (phone && winH > winW) {
    // Effektive Fläche im Querformat: Breite = Fensterhöhe, Höhe = Fensterbreite.
    const s = Math.min(winH / VIEW_W, winW / VIEW_H);
    const offX = (winH - VIEW_W * s) / 2;
    const offY = (winW - VIEW_H * s) / 2;
    // Drehung um +90 Grad: lokaler Punkt (x, y) landet auf Bildschirm (winW - y, x).
    return { rotation: Math.PI / 2, scale: s, x: winW - offY, y: offX };
  }
  const s = Math.min(winW / VIEW_W, winH / VIEW_H);
  return { rotation: 0, scale: s, x: (winW - VIEW_W * s) / 2, y: (winH - VIEW_H * s) / 2 };
}
