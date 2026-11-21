// Englische Anleitung (neun Seiten). Überschreibt Reiter, Titel und Zeilen aus src/data/tutorial.ts per id.
// Zeilen mit "* " am Anfang bleiben Aufzählungspunkte. Seiten, die Namen anderer Inhalte nennen, bilden ihre Zeilen beim Lesen.
import { TUTORIAL } from '../../data/tutorial';
import { lazyProp, nameOf } from '../lazy';

interface EnPage {
  tab: string;
  title: string;
  lines: string[] | (() => string[]);
}

const ed = nameOf.edition;
const en = nameOf.enhancement;
const stake = nameOf.stake;

const EN: Record<string, EnPage> = {
  ziel: {
    tab: 'Goal',
    title: 'What is it about?',
    lines: [
      'Alatro is a roguelike built on poker hands. You play cards from your hand and collect points. Reach the target of a Blind and you move on.',
      '* A run consists of 8 Antes. Every Ante has three Blinds: Small Blind, Big Blind and Boss Blind.',
      '* The targets grow a lot with every Ante. You have to keep up with Jokers and upgrades.',
      '* After Ante 8 you have won. Then you can keep playing in Endless mode.',
      '* If you miss a target before your Hands run out, the run is over.',
      'The run is saved after every step. Through Menu and Continue you pick up right where you left off.',
    ],
  },
  runde: {
    tab: 'Round',
    title: 'Playing a round',
    lines: [
      'You start with 8 cards in hand, 4 Hands and 3 Discards per round.',
      '* Tap up to 5 cards to select them. Tap a card again to deselect it.',
      '* Play Hand plays the selected cards and counts the points.',
      '* Discard throws the selected cards away and you draw replacements. It costs a Discard, but no Hand.',
      '* The sort buttons arrange your hand by rank or suit.',
      'The round is won as soon as your Round Score reaches the target. Leftover Hands earn money later.',
      'At the top left you always see which poker hand your selection makes, with its Chips and Mult.',
    ],
  },
  punkte: {
    tab: 'Score',
    title: 'Chips times Mult',
    lines: [
      'Every poker hand has base values: Chips (blue) and Mult (red). The score of a hand is Chips times Mult.',
      '* First the base values of the hand count, for example Pair or Flush.',
      '* Then the scoring cards are counted from left to right. Each one adds Chips for its rank, plus any bonuses.',
      '* After that, cards you kept in your hand take effect, and last come the Jokers, from left to right.',
      'Order matters: a Joker with "plus Mult" before a Joker with "X Mult" gives more than the other way around. You can reorder Jokers by dragging.',
      'Not every card scores. With a Pair only the two cards of the pair count, the other cards add no Chips.',
      'You can find the levels of your hands under Run Info. A higher level means more Chips and more Mult.',
    ],
  },
  blinds: {
    tab: 'Blinds',
    title: 'Blinds, Skip and money',
    lines: [
      'Every Ante has three Blinds with a rising target.',
      '* Small Blind: the base target.',
      '* Big Blind: 1.5 times the target and a bit more reward.',
      '* Boss Blind: double the target and a special rule that gets in your way, for example weakened cards. A Boss cannot be skipped.',
      'You can skip the Small and Big Blind with Skip. In return you get a Tag with a bonus, but you give up the reward and the shop.',
      'After every round you won, you cash out: the Blind reward, plus $1 for every Hand left over and interest. For every full $5 you own, you get $1 of interest, up to a cap. So saving pays off.',
    ],
  },
  shop: {
    tab: 'Shop',
    title: 'The Shop',
    lines: [
      'After every round you win, the Shop opens. This is where you spend your money.',
      '* Jokers: permanent boosts. You start with 5 slots.',
      '* Consumables: Constellations, Elixirs and Omens. You start with 2 slots.',
      '* Playing cards: new cards for your deck.',
      '* Vouchers: one time, permanent upgrades. Some unlock a stronger counterpart.',
      '* Booster Packs: you see several cards and pick one or two of them.',
      'Reroll reshuffles the offer, but gets more expensive with every use. You can sell Jokers and Consumables for half their price.',
      'Next Round takes you to the next Blind. Money you do not spend earns interest.',
    ],
  },
  jokers: {
    tab: 'Jokers',
    title: 'Jokers and Editions',
    lines: () => [
      'Jokers sit in the tray at the top and fire on every hand you play. Some give Chips or Mult, some multiply, some earn money or change the rules.',
      '* Tap a Joker to read its description and to sell it.',
      '* Drag a Joker left or right to change the order.',
      '* Rarity: Common, Uncommon, Rare and Legendary. Rarer Jokers are usually stronger.',
      'An Edition is a shimmer on a card or a Joker:',
      `* ${ed('schimmer')}: plus Chips.`,
      `* ${ed('aura')}: plus Mult.`,
      `* ${ed('prisma')}: Mult times 1.5.`,
      `* ${ed('schatten')}: Jokers only, gives an extra slot.`,
    ],
  },
  karten: {
    tab: 'Cards',
    title: 'Improving cards',
    lines: () => [
      'Your deck does not stay the same. With Consumables you make your cards and hands stronger.',
      '* Constellation: raises a poker hand by one level. Worth it for the hand you play most often.',
      '* Elixir: works on selected cards. They gain a material or Seal, change suit or rank, get copied or destroyed.',
      '* Omen: powerful effects with a price, such as destroyed cards or money dropping to 0.',
      'Cards can also carry extras:',
      `* Enhancement (material): for example ${en('kupfer')}, ${en('rubin')} or ${en('gold')}, with Chips, Mult or money.`,
      `* Seal: a mark, such as the ${nameOf.seal('echo')} (card scores twice) or the ${nameOf.seal('muenze')} (money). On the card, a circle with E, M or S shows the Seal.`,
      `* Edition: ${ed('schimmer')}, ${ed('aura')} or ${ed('prisma')}. The name is shown at the top of the card.`,
      'In the Star Atlas (Atlas button in the main menu) you see everything you have discovered so far, with hints for the rest.',
    ],
  },
  tipps: {
    tab: 'Tips',
    title: 'Decks, difficulty and tips',
    lines: [
      'Before a run you choose a Deck and the difficulty. Decks bring small bonuses. With a seed you can replay a run.',
      'A few tips for the start:',
      '* Play the same poker hand more often and raise it with Constellations.',
      '* Do not spend everything. In the first Antes, interest is a reliable income.',
      '* Check the special rule before every Boss Blind and adapt your hand to it.',
      '* Order your Jokers sensibly: Mult bonuses first, multipliers after.',
      '* Use Discards to dig for strong hands instead of playing weak ones.',
      'If the animations take too long, switch to a faster speed in the options or with the speed button at the table.',
    ],
  },
  schwierigkeit: {
    tab: 'Difficulty',
    title: 'Difficulty, achievements and Daily Run',
    lines: () => [
      'You can choose the difficulty in two ways:',
      `* Fixed tiers: ${stake('morgenrot')} is a bit easier than the base game, followed by the ladder from ${stake('daemmerung')} up to ${stake('ewige_nacht')}. Every tier on the ladder includes all rules of the previous ones.`,
      '* Scaling: 20 levels that you pick by tapping the bar. The Blind target grows with every level, and from certain levels extra rules apply. Level 4 is the base game, levels 1 to 3 are easier.',
      'After a win, the game suggests the next harder level.',
      'Under Achievements you collect stars. They decide your rank. Your statistics across all runs are there too.',
      'The Daily Run offers a fixed run every day with a seed, Deck, difficulty and a twist that changes one rule. Your best Ante per day is remembered.',
      'You can start the guided tutorial round any time with the Tutorial button in the main menu.',
    ],
  },
};

export default function patch() {
  for (const page of TUTORIAL) {
    const p = EN[page.id];
    if (!p) continue;
    page.tab = p.tab;
    page.title = p.title;
    if (typeof p.lines === 'function') lazyProp(page, 'lines', p.lines);
    else page.lines = p.lines;
  }
}
