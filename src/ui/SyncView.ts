import { Container, Graphics } from 'pixi.js';
import { SYNC } from '../data/sync';
import { t } from '../i18n';
import { formatCode, isValidCode, normalizeCode } from '../syncCrypto';
import type { RunSummary } from '../syncCloud';
import { syncManager } from './syncManager';
import { C } from './theme';
import { Button, label, wrapText } from './widgets';

export const SYNC_W = 800;
export const SYNC_H = 760;

type Screen = 'main' | 'enter' | 'show' | 'conflict';

function fmtRun(r: RunSummary | null): string {
  return r ? t('Ante {ante}, Blind {blind}, ${money}', { ante: r.ante, blind: r.blindIndex + 1, money: r.money }) : t('kein Run');
}

function ago(ts: number): string {
  if (!ts) return t('noch nie');
  const s = Math.max(0, Math.round((Date.now() - ts) / 1000));
  if (s < 60) return t('gerade eben');
  if (s < 3600) return t('vor {n} Minute|vor {n} Minuten', { n: Math.round(s / 60) });
  if (s < 86400) return t('vor {n} Stunde|vor {n} Stunden', { n: Math.round(s / 3600) });
  return t('vor {n} Tag|vor {n} Tagen', { n: Math.round(s / 86400) });
}

/** Status Texte je Phase (zur Laufzeit übersetzt) */
function phaseText(): Record<string, { text: string; color: number }> {
  return {
    aus: { text: '', color: C.textDim },
    ok: { text: t('Synchronisiert'), color: C.green },
    laeuft: { text: t('Gleiche ab …'), color: C.textDim },
    netz: { text: t('Offline, es wird später erneut versucht'), color: C.money },
    fehler: { text: t('Fehler beim Abgleich'), color: C.mult },
    konflikt: { text: t('Zwei verschiedene Runs'), color: C.money },
    wartet: { text: t('Neuerer Run in der Cloud'), color: C.money },
  };
}

/** Geräte koppeln: Code erzeugen oder eingeben, Status, Abgleich von Hand, Trennen. */
export function buildSync(box: Container, onBack: () => void) {
  const W = SYNC_W;
  const head = label(t('Geräte koppeln'), 44, C.text);
  head.position.set(W / 2, 56);
  box.addChild(head);
  const dyn = new Container();
  box.addChild(dyn);

  let screen: Screen = 'main';
  let entry = '';
  let reveal = false;
  let confirmUncouple = false;
  let notice = '';
  let noticeColor: number = C.textDim;
  let conflict: { local: RunSummary | null; remote: RunSummary | null } | null = null;
  let busy = false;

  const unsub = syncManager.subscribe(() => {
    if (dyn.destroyed) return unsub();
    render();
  });
  box.on('destroyed', unsub);

  const say = (text: string, color: number = C.textDim) => {
    notice = text;
    noticeColor = color;
    render();
  };

  const codeRow = (code: string, y: number, size = 36) => {
    const groups = formatCode(code).split('-');
    groups.forEach((g, i) => {
      const tx = label(g, size, C.text);
      tx.position.set(W / 2 + (i - (groups.length - 1) / 2) * 150, y);
      dyn.addChild(tx);
    });
  };

  const run = async (fn: () => Promise<unknown>) => {
    if (busy) return;
    busy = true;
    render();
    try {
      await fn();
    } finally {
      busy = false;
      render();
    }
  };

  const render = () => {
    if (dyn.destroyed) return;
    for (const c of [...dyn.children]) c.destroy({ children: true });
    const coupled = syncManager.isCoupled();

    if (screen === 'conflict' && conflict) {
      const tx = wrapText(
        t('Auf diesem Gerät läuft ein anderer Run als in der Cloud. Profil und Sammlung sind in jedem Fall zusammengeführt.\n\nDieses Gerät: {mine}\nCloud: {theirs}', { mine: fmtRun(conflict.local), theirs: fmtRun(conflict.remote) }),
        W - 100, 24, C.text, 'left',
      );
      tx.position.set(50, 130);
      const choose = (pick: 'local' | 'remote') => run(async () => {
        await syncManager.syncNow(pick);
        screen = 'main';
        conflict = null;
        say(pick === 'remote' ? t('Run aus der Cloud geladen.') : t('Run dieses Geräts gilt jetzt.'), C.green);
      });
      const keep = new Button(t('Run dieses Geräts behalten'), 640, 70, C.chips, () => choose('local'), 26);
      keep.position.set(W / 2, 430);
      const take = new Button(t('Run aus der Cloud nehmen'), 640, 70, C.mult, () => choose('remote'), 26);
      take.position.set(W / 2, 520);
      dyn.addChild(tx, keep, take);
      return;
    }

    if (screen === 'enter') {
      const hint = wrapText(t('Gib den Code ein, der auf dem anderen Gerät unter "Geräte koppeln" steht.'), W - 100, 22, C.textDim, 'center');
      hint.position.set(W / 2, 110);
      dyn.addChild(hint);
      const shown = entry.padEnd(SYNC.codeLength, '·');
      const g = new Graphics().roundRect(40, 170, W - 80, 90, 12).fill(0x141d29).stroke({ width: 3, color: C.panelLine });
      dyn.addChild(g);
      const groups = formatCode(shown.replace(/·/g, '_')).split('-');
      groups.forEach((gr, i) => {
        const tx = label(gr.replace(/_/g, '·'), 36, entry.length >= i * SYNC.codeGroup && entry.length > 0 ? C.text : C.textDim);
        tx.position.set(W / 2 + (i - (groups.length - 1) / 2) * 140, 215);
        dyn.addChild(tx);
      });
      [...SYNC.codeAlphabet].forEach((ch, i) => {
        const b = new Button(ch, 70, 70, 0x3b5068, () => { entry = normalizeCode(entry + ch).slice(0, SYNC.codeLength); render(); }, 30);
        b.position.set(W / 2 + ((i % 8) - 3.5) * 84, 330 + Math.floor(i / 8) * 84);
        b.enabled = entry.length < SYNC.codeLength && !busy;
        dyn.addChild(b);
      });
      const del = new Button(t('Löschen'), 180, 62, C.mult, () => { entry = entry.slice(0, -1); render(); }, 24);
      del.position.set(W / 2 - 220, 690 - 70);
      del.enabled = entry.length > 0;
      const paste = new Button(t('Einfügen'), 180, 62, 0x3b5068, async () => {
        try {
          entry = normalizeCode(await navigator.clipboard.readText()).slice(0, SYNC.codeLength);
        } catch {
          say(t('Einfügen nicht erlaubt, bitte eintippen.'), C.mult);
          return;
        }
        render();
      }, 24);
      paste.position.set(W / 2, 690 - 70);
      const ok = new Button(busy ? t('Moment …') : t('Koppeln'), 180, 62, C.green, () => run(async () => {
        const r = await syncManager.joinCode(entry);
        if (r?.status === 'conflict') {
          conflict = { local: r.local, remote: r.remote };
          screen = 'conflict';
        } else if (syncManager.isCoupled() && syncManager.phase !== 'fehler' && syncManager.phase !== 'netz') {
          screen = 'main';
          entry = '';
          say(t('Gekoppelt. Profil und Sammlung sind abgeglichen.'), C.green);
        } else {
          say(syncManager.phase === 'netz' ? t('Keine Verbindung. Der Code wurde nicht gespeichert.') : syncManager.message || t('Das hat nicht geklappt.'), C.mult);
          if (syncManager.phase === 'netz') syncManager.uncouple();
        }
      }), 24);
      ok.position.set(W / 2 + 220, 690 - 70);
      ok.enabled = isValidCode(entry) && !busy;
      const back = new Button(t('Abbrechen'), 260, 56, 0x3b5068, () => { screen = 'main'; entry = ''; render(); }, 22);
      back.position.set(W / 2, 700);
      const msg = wrapText(notice || ' ', W - 100, 20, noticeColor, 'center');
      msg.position.set(W / 2, 285);
      dyn.addChild(del, paste, ok, back, msg);
      return;
    }

    if (screen === 'show') {
      const code = syncManager.code() ?? '';
      const tx = wrapText(t('Dein Kopplungscode. Gib ihn auf dem anderen Gerät unter "Geräte koppeln" und "Code eingeben" ein. Schreib ihn Dir auf, ohne ihn gibt es keinen Zugriff auf den Cloud Stand.'), W - 100, 22, C.text, 'center');
      tx.position.set(W / 2, 130);
      dyn.addChild(tx);
      const g = new Graphics().roundRect(40, 290, W - 80, 110, 12).fill(0x141d29).stroke({ width: 3, color: C.accent });
      dyn.addChild(g);
      codeRow(code, 345, 40);
      const copy = new Button(t('Kopieren'), 260, 62, C.chips, async () => {
        try {
          await navigator.clipboard.writeText(formatCode(code));
          say(t('Kopiert.'), C.green);
        } catch {
          say(t('Kopieren nicht erlaubt, bitte abschreiben.'), C.mult);
        }
      }, 24);
      copy.position.set(W / 2, 470);
      const done = new Button(t('Fertig'), 260, 62, C.green, () => { screen = 'main'; notice = ''; render(); }, 24);
      done.position.set(W / 2, 560);
      const msg = wrapText(notice || ' ', W - 100, 20, noticeColor, 'center');
      msg.position.set(W / 2, 620);
      dyn.addChild(copy, done, msg);
      return;
    }

    // Hauptansicht
    if (!coupled) {
      const tx = wrapText(
        t('Spiele auf mehreren Geräten mit demselben Stand. Es gibt kein Konto: ein Kopplungscode verbindet die Geräte. Profil, Sammlung und der laufende Run werden verschlüsselt in der Cloud abgelegt.'),
        W - 100, 22, C.textDim, 'left',
      );
      tx.position.set(50, 120);
      const create = new Button(t('Neuen Code erzeugen'), 560, 74, C.chips, () => run(async () => {
        await syncManager.createCode();
        if (syncManager.isCoupled() && (syncManager.phase === 'ok' || syncManager.phase === 'laeuft')) {
          screen = 'show';
          reveal = true;
          say('');
        } else {
          const why = syncManager.phase === 'netz' ? t('Keine Verbindung, bitte später erneut versuchen.') : syncManager.message || t('Das hat nicht geklappt.');
          syncManager.uncouple();
          say(why, C.mult);
        }
      }), 28);
      create.position.set(W / 2, 330);
      const join = new Button(t('Code eingeben'), 560, 74, C.money, () => { screen = 'enter'; entry = ''; notice = ''; render(); }, 28);
      join.position.set(W / 2, 430);
      create.enabled = !busy;
      const how = wrapText(t('Erstes Gerät: Code erzeugen. Weitere Geräte: Code eingeben.'), W - 100, 20, C.textDim, 'center');
      how.position.set(W / 2, 500);
      const msg = wrapText(notice || ' ', W - 100, 22, noticeColor, 'center');
      msg.position.set(W / 2, 560);
      const back = new Button(t('Zurück'), 300, 62, 0x3b5068, onBack, 26);
      back.position.set(W / 2, 680);
      dyn.addChild(tx, create, join, how, msg, back);
      return;
    }

    const phases = phaseText();
    const ph = phases[syncManager.phase] ?? phases.ok;
    const status = label(ph.text, 30, ph.color);
    status.position.set(W / 2, 140);
    const sub = wrapText(syncManager.message || t('Zuletzt abgeglichen: {when}', { when: ago(syncManager.lastSync()) }), W - 100, 20, C.textDim, 'center');
    sub.position.set(W / 2, 180);
    dyn.addChild(status, sub);
    const code = syncManager.code() ?? '';
    const g = new Graphics().roundRect(40, 250, W - 80, 100, 12).fill(0x141d29).stroke({ width: 3, color: C.panelLine });
    dyn.addChild(g);
    if (reveal) codeRow(code, 300, 34);
    else {
      const dots = label('•••• •••• •••• •••• ••••', 34, C.textDim);
      dots.position.set(W / 2, 300);
      dyn.addChild(dots);
    }
    const eye = new Button(reveal ? t('Verbergen') : t('Anzeigen'), 260, 56, 0x3b5068, () => { reveal = !reveal; render(); }, 22);
    eye.position.set(W / 2 - 150, 400);
    const now = new Button(busy || syncManager.phase === 'laeuft' ? t('Moment …') : t('Jetzt abgleichen'), 260, 56, C.chips, () => run(async () => {
      const r = await syncManager.syncNow();
      if (r?.status === 'conflict') {
        conflict = { local: r.local, remote: r.remote };
        screen = 'conflict';
      } else if (syncManager.phase === 'ok') say(t('Abgeglichen.'), C.green);
    }), 22);
    now.position.set(W / 2 + 150, 400);
    now.enabled = !busy && syncManager.phase !== 'laeuft';
    const un = new Button(confirmUncouple ? t('Wirklich trennen?') : t('Kopplung trennen'), 360, 56, confirmUncouple ? C.mult : 0x3b5068, () => {
      if (!confirmUncouple) {
        confirmUncouple = true;
        render();
        return;
      }
      confirmUncouple = false;
      syncManager.uncouple();
      screen = 'main';
      say(t('Getrennt. Die Daten auf diesem Gerät bleiben, der Cloud Stand auch.'), C.textDim);
    }, 22);
    un.position.set(W / 2, 490);
    const note = wrapText(t('Trennen löscht nichts. Mit demselben Code kannst Du später wieder koppeln.'), W - 100, 18, C.textDim, 'center');
    note.position.set(W / 2, 540);
    const msg = wrapText(notice || ' ', W - 100, 20, noticeColor, 'center');
    msg.position.set(W / 2, 590);
    const back = new Button(t('Zurück'), 300, 62, 0x3b5068, onBack, 26);
    back.position.set(W / 2, 680);
    dyn.addChild(eye, now, un, note, msg, back);
  };
  render();
}
