import { Container, Graphics } from 'pixi.js';
import { SYNC } from '../data/sync';
import { decodeBundle, describeRun, encodeBundle, type SyncBundle } from '../syncBundle';
import { applyBundle, currentBundle, previewRun } from '../syncStorage';
import { t } from '../i18n';
import { drawInset } from './depth';
import { C } from './theme';
import { Button, label, wrapText } from './widgets';

export const BACKUP_W = 760;
export const BACKUP_H = 720;

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
  const head = label(t('Spielstand sichern'), 44, C.text);
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
    say(t('Fertig. Das Spiel lädt neu.'), C.green);
    setTimeout(() => location.reload(), 1200);
  };

  const importText = (text: string | null) => {
    if (text === null) return say(t('Nichts gelesen.'), C.mult);
    const bundle = decodeBundle(text);
    if (!bundle) return say(t('Das ist kein Alatro Spielstand (oder aus einer neueren Version).'), C.mult);
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
      const fmt = (r: ReturnType<typeof describeRun>) => (r ? t('Ante {ante}, Blind {blind}, ${money}', { ante: r.ante, blind: r.blindIndex + 1, money: r.money }) : t('kein Run'));
      const info = wrapText(
        t('Auf diesem Gerät läuft ein anderer Run als im Import. Profil und Sammlung werden in jedem Fall zusammengeführt.\n\nDieses Gerät: {mine}\nImport: {theirs}', { mine: fmt(mine), theirs: fmt(theirs) }),
        W - 100, 24, C.text, 'left',
      );
      info.position.set(50, 130);
      const keep = new Button(t('Run dieses Geräts behalten'), 600, 70, C.chips, () => { pending = null; finish(remote, 'local'); }, 26);
      keep.position.set(W / 2, 400);
      const take = new Button(t('Importierten Run nehmen'), 600, 70, C.mult, () => { pending = null; finish(remote, 'remote'); }, 26);
      take.position.set(W / 2, 490);
      const cancel = new Button(t('Abbrechen'), 300, 62, 0x3b5068, () => { pending = null; say(''); }, 24);
      cancel.position.set(W / 2, 580);
      dyn.addChild(info, keep, take, cancel);
      return;
    }
    const intro = wrapText(
      t('Sichere Profil, Sammlung und laufenden Run als Datei oder Text und lade ihn auf einem anderen Gerät wieder ein. Beim Laden wird nichts gelöscht, sondern zusammengeführt.'),
      W - 100, 22, C.textDim, 'left',
    );
    intro.position.set(50, 110);
    // Zwei Gruppen (Sichern, Laden) als vertiefte Felder mit Überschrift und zwei Knöpfen
    const group = (y: number, text: string) => {
      dyn.addChild(drawInset(new Graphics(), 40, y, W - 80, 150, 0x24344a, { radius: 14 }));
      const l = label(text, 28, C.text);
      l.anchor.set(0, 0.5);
      l.position.set(66, y + 32);
      dyn.addChild(l);
    };
    group(222, t('Sichern'));
    const file = new Button(t('Als Datei'), 300, 64, C.chips, () => {
      downloadText(SYNC.exportFileName, JSON.stringify(currentBundle()));
      say(t('Datei erzeugt. Auf dem iPad im Teilen Menü sichern.'), C.green);
    }, 24);
    file.position.set(W / 2 - 170, 222 + 96);
    const copy = new Button(t('Text kopieren'), 300, 64, C.chips, async () => {
      try {
        await navigator.clipboard.writeText(encodeBundle(currentBundle()));
        say(t('Text kopiert. Auf dem anderen Gerät einfügen.'), C.green);
      } catch {
        say(t('Kopieren nicht erlaubt. Nutze die Datei.'), C.mult);
      }
    }, 24);
    copy.position.set(W / 2 + 170, 222 + 96);
    group(398, t('Laden'));
    const open = new Button(t('Aus Datei'), 300, 64, C.money, async () => importText(await pickTextFile()), 24);
    open.position.set(W / 2 - 170, 398 + 96);
    const paste = new Button(t('Text einfügen'), 300, 64, C.money, async () => {
      try {
        importText(await navigator.clipboard.readText());
      } catch {
        say(t('Einfügen nicht erlaubt. Nutze die Datei.'), C.mult);
      }
    }, 24);
    paste.position.set(W / 2 + 170, 398 + 96);
    const msg = wrapText(status || ' ', W - 100, 22, statusColor, 'center');
    msg.position.set(W / 2, 590);
    const back = new Button(t('Zurück'), 300, 62, 0x3b5068, onBack, 26);
    back.position.set(W / 2, 650);
    dyn.addChild(intro, file, copy, open, paste, msg, back);
  };
  render();
}
