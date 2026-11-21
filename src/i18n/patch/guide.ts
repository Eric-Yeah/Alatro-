// Englische Einführungsrunde (Astra). Überschreibt Titel und Text der Schritte aus src/data/guide.ts per id.
import { GUIDE_STEPS } from '../../data/guide';
import { lazyProp, nameOf } from '../lazy';

const SELECT_HINT = 'Tap a card again to deselect it.';
const spark = () => nameOf.joker('funke');

/** id: [Titel, Text]. Der Text darf eine Funktion sein, wenn er den Namen eines Inhalts nennt. */
const EN: Record<string, [string, string | (() => string)]> = {
  willkommen: ['Welcome to the Observatory', "I'm Astra, and in one short round I'll show you how Alatro works. You play real hands, and I tell you what to do. It only takes a few minutes."],
  blinds: ['Antes and Blinds', 'A run is made of Antes. Every Ante has three Blinds: Small Blind, Big Blind and a Boss. In each Blind you need to reach a score target. The Small Blind is only 210 points here, to keep the start easy.'],
  start1: ['The First Blind', 'Tap Play to start the Small Blind.'],
  hand: ['Your Hand', 'These are your 8 cards. You may play up to 5 of them. The better the poker hand, the more points you get. Your deck sits at the bottom right, and your Jokers will show up at the top later.'],
  pickPair: ['Play a Pair', `Start with something simple: tap the two Kings. Two cards of the same rank make a Pair. ${SELECT_HINT}`],
  preview: ['Chips times Mult', 'Here you see what your selection makes: a Pair. The blue number is Chips, the red number is Mult. Chips times Mult gives your points. Every played card adds a few Chips on top.'],
  playPair: ['Play the Hand', 'Tap Play Hand.'],
  afterPair: ['Your Score', 'The points land in your Round Score. Your target is 210. A Pair alone is not enough, you need a stronger hand. That is what Discards are for.'],
  discardIntro: ['Discarding Cards', 'You are holding four Hearts (♥). Five cards of the same suit make a Flush. A Discard throws cards away and draws new ones. It costs no Hand, but Discards are limited.'],
  pickDiscard: ['Keep the Right Cards', `Select the three cards that are not Hearts: 2♣, 6♦ and 9♠. ${SELECT_HINT}`],
  doDiscard: ['Discard', 'Tap Discard.'],
  afterDiscard: ['Nicely Drawn', 'You drew the Q♥. Now you have five Hearts, a Flush. In a real run you have to count on luck, here I helped a little.'],
  pickFlush: ['Select the Flush', `Select the five Hearts: 4, 8, 10, J and Q. ${SELECT_HINT}`],
  playFlush: ['Play the Flush', 'A Flush gives far more Chips and Mult than a Pair. Tap Play Hand.'],
  cashout: ['Blind Cleared', 'The target is reached. You get money for the Blind, for every Hand left over, and interest on your savings. Save wisely, because interest is a strong bonus. Tap Cash Out.'],
  shop: ['The Shop', 'After every Blind you visit the Shop. Spend your money on Jokers, Consumables, Packs and Vouchers. Jokers are the heart of your strategy: they change how your points are made.'],
  buy: ['Buy a Joker', () => `Tap ${spark()}, then Buy. It costs $2 and gives +4 Mult on every hand.`],
  bought: ['Your First Joker', () => `${spark()} now sits at the top in your Joker row. Jokers fire from left to right, after the cards have been counted. You only have 5 slots, and a Joker can be sold or reordered later. You will try Reroll, Packs and Vouchers in a real run.`],
  next: ['On We Go', 'Tap Next Round.'],
  skipInfo: ['Skip and Boss', 'You can skip the Small and Big Blind. In return you get a Tag with a bonus, but you give up the reward and the shop. The Boss has a special rule and cannot be skipped. We will play the Big Blind.'],
  start2: ['The Big Blind', 'Tap Play. The target is higher now: 315 points.'],
  pickFull: ['Full House', `Three Queens and two Jacks make a Full House. Select these five cards. ${SELECT_HINT}`],
  playFull: ['Play with a Joker', () => `Tap Play Hand and watch for the moment ${spark()} adds its Mult.`],
  ende: ['All Done', 'That covers the basics.'],
};

export default function patch() {
  for (const step of GUIDE_STEPS) {
    const en = EN[step.id];
    if (!en) continue;
    step.title = en[0];
    if (typeof en[1] === 'string') step.text = en[1];
    else lazyProp(step, 'text', en[1]);
  }
}
