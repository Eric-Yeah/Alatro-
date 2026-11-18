import { Text } from 'pixi.js';

// Scharfer Text: Pixi rendert Text mit der Auflösung des Renderers, das Spielfeld wird aber
// auf das Fenster skaliert (z. B. 0,77 auf dem iPad). Der Text würde dann herunterskaliert
// und wirkt weich. Hier wird die Textauflösung mit dem Skalierfaktor multipliziert.
let current = 1;

const proto = Text.prototype as any;
Object.defineProperty(proto, '_autoResolution', { get: () => false, set: () => {}, configurable: true });
Object.defineProperty(proto, 'resolution', {
  get: () => current,
  set: () => {},
  configurable: true,
});

/** Setzt die Textauflösung (Renderer Auflösung mal Spielfeld Skalierung) und erneuert vorhandene Texte. */
export function setTextResolution(res: number, root: { children: any[] }) {
  const next = Math.max(1, Math.round(res * 4) / 4);
  if (next === current) return;
  current = next;
  const walk = (c: any) => {
    if (c instanceof Text) c.onViewUpdate();
    for (const ch of c.children ?? []) walk(ch);
  };
  walk(root);
}
