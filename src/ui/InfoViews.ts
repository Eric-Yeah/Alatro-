import { Container } from 'pixi.js';
import { PATCH_NOTES } from '../data/patchnotes';
import { TUTORIAL } from '../data/tutorial';
import { C } from './theme';
import { Button, label, tabBar, wrapText } from './widgets';

export const TUTORIAL_W = 1100;
export const TUTORIAL_H = 780;
export const PATCH_W = 900;
export const PATCH_H = 700;

function clear(c: Container) {
  for (const k of [...c.children]) k.destroy({ children: true });
}

/** Zeilen mit "* " am Anfang als Aufzählung, alle anderen als Absatz. Gibt die Endhöhe zurück. */
function addLines(parent: Container, lines: string[], x: number, y: number, width: number, size: number): number {
  for (const line of lines) {
    const bullet = line.startsWith('* ');
    const t = wrapText(bullet ? line.slice(2) : line, bullet ? width - 34 : width, size, C.text, 'left');
    t.position.set(bullet ? x + 34 : x, y);
    if (bullet) {
      const dot = label('•', size + 4, C.accent);
      dot.position.set(x + 12, y + size * 0.65);
      parent.addChild(dot);
    }
    parent.addChild(t);
    y += t.height + (bullet ? 8 : 14);
  }
  return y;
}

/** Anleitung: Reiter für die Themen, Pfeile blättern zur nächsten Seite. */
export function buildTutorial(box: Container, close: () => void, startId?: string) {
  const W = TUTORIAL_W;
  let idx = Math.max(0, TUTORIAL.findIndex((p) => p.id === startId));
  const head = label('Anleitung', 38);
  head.position.set(W / 2, 40);
  box.addChild(head);
  const dyn = new Container();
  box.addChild(dyn);

  const render = () => {
    clear(dyn);
    const page = TUTORIAL[idx];
    const bar = tabBar(TUTORIAL.map((p) => ({ id: p.id, name: p.tab })), W - 80, page.id, (id) => { idx = TUTORIAL.findIndex((p) => p.id === id); render(); }, 17);
    bar.position.set(40, 82);
    dyn.addChild(bar);
    const title = label(page.title, 32, C.money);
    title.position.set(W / 2, 168);
    dyn.addChild(title);
    addLines(dyn, page.lines, 70, 205, W - 140, 21);

    const prev = new Button('‹', 70, 56, 0x4a3f6b, () => { idx = (idx + TUTORIAL.length - 1) % TUTORIAL.length; render(); }, 30);
    prev.position.set(W / 2 - 150, TUTORIAL_H - 50);
    const next = new Button('›', 70, 56, 0x4a3f6b, () => { idx = (idx + 1) % TUTORIAL.length; render(); }, 30);
    next.position.set(W / 2 + 150, TUTORIAL_H - 50);
    const pl = label(`Seite ${idx + 1} von ${TUTORIAL.length}`, 20, C.text);
    pl.position.set(W / 2, TUTORIAL_H - 50);
    dyn.addChild(prev, next, pl);
  };
  render();

  const closeBtn = new Button('Schließen', 220, 60, 0x6b5a9e, close, 24);
  closeBtn.position.set(W - 150, TUTORIAL_H - 50);
  box.addChild(closeBtn);
}

/** Patch Notes: eine Version pro Seite, Pfeile blättern zu älteren Versionen. */
export function buildPatchNotes(box: Container, close: () => void) {
  const W = PATCH_W;
  let idx = 0;
  const head = label('Patch Notes', 38);
  head.position.set(W / 2, 40);
  box.addChild(head);
  const dyn = new Container();
  box.addChild(dyn);

  const render = () => {
    clear(dyn);
    const n = PATCH_NOTES[idx];
    const ver = label(`Version ${n.version}${idx === 0 ? ' (neu)' : ''}`, 30, C.money);
    ver.position.set(W / 2, 110);
    const sub = label(`${n.title} · ${n.date}`, 20, C.textDim);
    sub.position.set(W / 2, 148);
    dyn.addChild(ver, sub);
    addLines(dyn, n.items.map((i) => `* ${i}`), 60, 190, W - 120, 20);
    if (PATCH_NOTES.length > 1) {
      const newer = new Button('‹ Neuer', 150, 56, 0x4a3f6b, () => { idx = Math.max(0, idx - 1); render(); }, 22);
      newer.position.set(120, PATCH_H - 50);
      newer.enabled = idx > 0;
      const older = new Button('Älter ›', 150, 56, 0x4a3f6b, () => { idx = Math.min(PATCH_NOTES.length - 1, idx + 1); render(); }, 22);
      older.position.set(290, PATCH_H - 50);
      older.enabled = idx < PATCH_NOTES.length - 1;
      dyn.addChild(newer, older);
    }
  };
  render();

  const closeBtn = new Button('Schließen', 220, 60, 0x6b5a9e, close, 24);
  closeBtn.position.set(W - 150, PATCH_H - 50);
  box.addChild(closeBtn);
}
