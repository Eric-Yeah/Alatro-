/** Startwerte und Wirtschaft (Briefing 1.2, 1.4). */

export const START = {
  hands: 4,
  discards: 3,
  handSize: 8,
  jokerSlots: 5,
  consumableSlots: 2,
  money: 4,
  maxPlay: 5,
  maxDiscard: 5,
};

export const INTEREST = {
  /** 1 Dollar Zinsen pro vollen ... Dollar */
  per: 5,
  amount: 1,
  /** Standard Deckel */
  cap: 5,
};

export const PAYOUT = {
  perHandLeft: 1,
  perDiscardLeft: 0,
};

export const SELL = {
  divisor: 2,
  min: 1,
};

export const REROLL = {
  base: 5,
  step: 1,
};
