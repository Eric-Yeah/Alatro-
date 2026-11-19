// Erzeugt einen Spielstand (JSON) für Vorschau Screenshots im echten Spiel: Shop mit Packs und Consumables.
// Aufruf: npx vite-node tools/ingameSave.ts <shop|pack|round> <ausgabedatei>
// Der Spielstand wird in Playwright in localStorage (alatro.run.v1) gelegt und über "Fortsetzen" geladen.
import { writeFileSync } from 'node:fs';
import '../src/core/index';
import { addConsumable } from '../src/core/consumables';
import { afterHand, cashOut, createRun, openPack, selectBlind } from '../src/core/game';

const mode = process.argv[2] ?? 'shop';
const out = process.argv[3] ?? 'ingame-save.json';

const run = createRun({ seed: 'POLISH' });
selectBlind(run);
if (mode !== 'round') {
  run.round!.score = run.round!.target;
  afterHand(run);
  cashOut(run);
}
run.money = 60;
run.consumableSlots = 5;
for (const id of ['sternbild_flush', 'elixier_gold', 'omen_hexenkessel', 'elixier_stern', 'sternbild_fiveKind']) addConsumable(run, id);
if (mode === 'round') {
  // Runde läuft, nur die Consumable Leiste füllen
} else if (mode === 'shop') {
  run.shop!.packs = [
    { packId: 'sternbild_normal', price: 4 },
    { packId: 'omen_jumbo', price: 6 },
    { packId: 'joker_mega', price: 8 },
  ];
  run.shop!.cards = [
    { kind: 'consumable', defId: 'omen_blutmond', price: 4 } as never,
    { kind: 'consumable', defId: 'elixier_kupfer', price: 3 } as never,
    { kind: 'consumable', defId: 'sternbild_straight', price: 3 } as never,
  ];
} else {
  run.shop!.packs = [null, null];
  openPack(run, mode === 'pack' ? 'omen_mega' : mode, 'shop');
}
writeFileSync(out, JSON.stringify(run));
console.log('Spielstand', out, run.phase);
