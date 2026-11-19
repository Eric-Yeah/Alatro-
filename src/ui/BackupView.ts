import { Container } from 'pixi.js';
import { SYNC } from '../data/sync';
import { decodeBundle, describeRun, encodeBundle, type SyncBundle } from '../syncBundle';
import { applyBundle, currentBundle, previewRun } from '../syncStorage';
import { C } from './theme';
import { Button, label, wrapText } from './widgets';

export const BACKUP_W = 760;
export const BACKUP_H = 640;

/** Datei zum Speichern anbieten (auf dem iPad öffnet sich das Teilen Menü bzw. der Download) */
function downloadText(name: string, text: string) {
  const url = URL.createObjectURL(new Blob([text], { type: 'application/json' }));
  const a = document.createElement('a');
  a.href = url;
  a.download = name;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  setTimeout(() => URL.revokeObjectURL(url), 10000);
}

/** Öffnet die Dateiauswahl und liefert den Text der gewählten Datei (null bei Abbruch) */
function pickTextFile(): Promise<string | null> {
  return new Promise((resolve) => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.json,application/json,text/plain';
    input.onchange = async () => {
      const f = input.files?.[0];
      resolve(f ? await f.text().catch(() => null) : null);
    };
    input.oncancel = () => resolve(null);
    input.click();
  });
}

/**
 * Spielstand sichern und übertragen: Export als Datei oder Text, Import aus Datei oder Zwischenablage.
 * Profil und Sammlung werden zusammengeführt, bei zwei verschiedenen Runs fragt das Fenster nach.
 */
export function buildBackup(box: Container, onBack: () => void) {
  const W = BACKUP_W;
  const head = label('Spielstand sichern', 44, C.text);
  head.position.set(W / 2, 56);
  box.addChild(head);
  const dyn = new Container();
  box.addChild(dyn);
  let status = '';
  let statusColor: number = C.textDim;
  let pending: SyncBundle | null = null;

  const say = (text: string, color: number = C.textDim) => {
    status = text;
    statusColor = color;
    render();
  };

  const finish = (remote: SyncBundle, choice: 'local' | 'remote') => {
    applyBundle(remote, choice);
    say('Fertig. Das Spiel lädt neu.', C.green);
    setTimeout(() => location.reload(), 1200);
  };

  const importText = (text: string | null) => {
    if (text === null) return say('Nichts gelesen.', C.mult);
    const bundle = decodeBundle(text);
    if (!bundle) return say('Das ist kein Alatro Spielstand (oder aus einer neueren Version).', C.mult);
    if (previewRun(bundle).kind === 'conflict') {
      pending = bundle;
      return say('', C.textDim);
    }
    finish(bundle, 'local');
  };

  const render = () => {
    for (const c of [...dyn.children]) c.destroy({ children: true });
    if (pending) {
      const remote = pending;
      const mine = describeRun(currentBundle().run);
      const theirs = describeRun(remote.run);
      const fmt = (r: ReturnType<typeof describeRun>) => (r ? `Ante ${r.ante}, Blind ${r.blindIndex + 1}, $${r.money}` : 'kein Run');
      const t = wrapText(
        `Auf diesem Gerät läuft ein anderer Run als im Import. Profil und Sammlung werden in jedem Fall zusammengeführt.\n\nDieses Gerät: ${fmt(mine)}\nImport: ${fmt(theirs)}`,
        W - 100, 24, C.text, 'left',
      );
      t.position.set(50, 130);
      const keep = new Button('Run dieses Geräts behalten', 600, 70, C.chips, () => { pending = null; finish(remote, 'local'); }, 26);
      keep.position.set(W / 2, 400);
      const take = new Button('Importierten Run nehmen', 600, 70, C.mult, () => { pending = null; finish(remote, 'remote'); }, 26);
      take.position.set(W / 2, 490);
      const cancel = new Button('Abbrechen', 300, 62, 0x3b5068, () => { pending = null; say(''); }, 24);
      cancel.position.set(W / 2, 580);
      dyn.addChild(t, keep, take, cancel);
      return;
    }
    const intro = wrapText(
      'Sichere Profil, Sammlung und laufenden Run als Datei oder Text und lade ihn auf einem anderen Gerät wieder ein. Beim Laden wird nichts gelöscht, sondern zusammengeführt.',
      W - 100, 22, C.textDim, 'left',
    );
    intro.position.set(50, 110);
    const section = (y: number, text: string) => {
      const l = label(text, 28, C.text);
      l.anchor.set(0, 0.5);
      l.position.set(50, y);
      dyn.addChild(l);
    };
    section(250, 'Sichern');
    const file = new Button('Als Datei', 300, 64, C.chips, () => {
      downloadText(SYNC.exportFileName, JSON.stringify(currentBundle()));
      say('Datei erzeugt. Auf dem iPad im Teilen Menü sichern.', C.green);
    }, 24);
    file.position.set(W / 2 - 170, 310);
    const copy = new Button('Text kopieren', 300, 64, C.chips, async () => {
      try {
        await navigator.clipboard.writeText(encodeBundle(currentBundle()));
        say('Text kopiert. Auf dem anderen Gerät einfügen.', C.green);
      } catch {
        say('Kopieren nicht erlaubt. Nutze die Datei.', C.mult);
      }
    }, 24);
    copy.position.set(W / 2 + 170, 310);
    section(390, 'Laden');
    const open = new Button('Aus Datei', 300, 64, C.money, async () => importText(await pickTextFile()), 24);
    open.position.set(W / 2 - 170, 450);
    const paste = new Button('Text einfügen', 300, 64, C.money, async () => {
      try {
        importText(await navigator.clipboard.readText());
      } catch {
        say('Einfügen nicht erlaubt. Nutze die Datei.', C.mult);
      }
    }, 24);
    paste.position.set(W / 2 + 170, 450);
    const msg = wrapText(status || ' ', W - 100, 22, statusColor, 'center');
    msg.position.set(W / 2, 505);
    const back = new Button('Zurück', 300, 62, 0x3b5068, onBack, 26);
    back.position.set(W / 2, 580);
    dyn.addChild(intro, file, copy, open, paste, msg, back);
  };
  render();
}
