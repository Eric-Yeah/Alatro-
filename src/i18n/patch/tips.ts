// Englische Tipps für den Game Over Bildschirm. Gleiche Reihenfolge und Anzahl wie src/data/tips.ts.
import { TIPS } from '../../data/tips';
import { lazyProp, nameOf } from '../lazy';

const EN: (string | (() => string))[] = [
  'Interest is strong: for every $5 you hold, you get $1 extra at the end of the round, up to the cap.',
  'A Joker with X Mult at the far right of the row often hits harder than one on the left. Order matters.',
  'Constellations make a poker hand permanently better. Favor the hand you land most often.',
  'Discards cost no Hand. Discard boldly when you are only two cards short of a strong hand.',
  'The Boss shows its special rule on the Blind select screen. Plan your shop purchases around it.',
  'Skipping pays off when the Tag is strong and you do not need the Blind. A Boss can never be skipped.',
  'Sell weak Jokers early, before they take up room. The sell value is half the price.',
  'A small hand with Jokers often beats a big hand without them. Build around a Pair or a Flush.',
  'Run Info shows the levels of your poker hands. A hand you level up scores higher for good.',
  'With the seed you can replay a good run. The same Deck and the same seed give the same offers.',
  'On the scaling setting you can fine tune the difficulty. Levels 1 to 3 are ideal for practice.',
  'The Daily Run changes every day. Try to beat your best Ante from the day before.',
  'Leftover Hands earn money. Clear a Blind early and you keep Hands for the shop.',
  () => `Editions like ${nameOf.edition('schimmer')}, ${nameOf.edition('aura')} or ${nameOf.edition('prisma')} make a Joker special. Take a second look in the shop.`,
];

export default function patch() {
  EN.forEach((tip, i) => {
    if (typeof tip === 'string') (TIPS as string[])[i] = tip;
    else lazyProp(TIPS, i, tip);
  });
}
