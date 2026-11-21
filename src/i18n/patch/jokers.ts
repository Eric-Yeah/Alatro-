import { allJokers } from '../../core/jokers';

/**
 * Englische Namen und Beschreibungen der Jokers (Schlüssel ist die Joker Id).
 * Platzhalter wie {mult} sind exakt dieselben wie im deutschen Text, nur die Satzstellung ändert sich.
 * Eigene Namen im Thema "Sternwarte der Alchemisten", keine Originalnamen.
 */
export const EN: Record<string, { name: string; description: string }> = {
  // Gruppe 1: Einfache MAIN Jokers
  funke: { name: 'Spark', description: '+{mult} Mult' },
  treppe: { name: 'Stairway', description: '+{chips} Chips if the hand contains a Straight' },
  kiesel: { name: 'Pebble', description: '+{chips} Chips' },
  blasebalg: { name: 'Bellows', description: '+{mult} Mult and +{chips} Chips' },
  kerzenlicht: { name: 'Candlelight', description: '+{mult} Mult if the hand contains a Pair' },
  doppelflamme: { name: 'Twin Flame', description: '+{mult} Mult if the hand contains Two Pair' },
  milchglas: { name: 'Milk Glass', description: '+{chips} Chips if the hand contains a Flush' },
  fuenfklang: { name: 'Quintet', description: '+{mult} Mult if exactly {cards} cards are played' },
  leisetreter: { name: 'Tiptoe', description: '+{chips} Chips if at most {maxCards} cards are played' },
  hochstapler: { name: 'Charlatan', description: 'X{xMult} Mult if the hand is only a High Card' },
  dreifuss: { name: 'Tripod', description: 'X{xMult} Mult if the hand contains Three of a Kind' },
  gaestehaus: { name: 'Guesthouse', description: 'X{xMult} Mult if the hand contains a Full House' },
  einzelgaenger: { name: 'Lone Wolf', description: 'X{xMult} Mult if exactly {cards} card is played' },
  letzte_chance: { name: 'Last Chance', description: 'X{xMult} Mult on the last hand of the round' },

  // Gruppe 2: SCORED und HELD Jokers
  glut: { name: 'Ember', description: 'Each scored Hearts or Diamonds card gives +{mult} Mult' },
  frost: { name: 'Frost', description: 'Each scored Spades or Clubs card gives +{chips} Chips' },
  kleinvieh: { name: 'Small Fry', description: 'Each scored card of rank 2 to {maxRank} gives +{mult} Mult' },
  herzblut: { name: 'Heartblood', description: 'Each scored Hearts card gives +{mult} Mult' },
  diamantstaub: { name: 'Diamond Dust', description: 'Each scored Diamonds card gives +{chips} Chips' },
  nachtschatten: { name: 'Nightshade', description: 'Each scored Spades card gives +{mult} Mult' },
  efeu: { name: 'Ivy', description: 'Each scored Clubs card gives +{chips} Chips' },
  hofstaat: { name: 'Royal Court', description: 'Each scored Face Card gives +{mult} Mult' },
  gleichmut: { name: 'Even Keel', description: 'Each scored card with an even rank (2, 4, 6, 8, 10) gives +{mult} Mult' },
  kauz: { name: 'Little Owl', description: 'Each scored card with an odd rank (3, 5, 7, 9, Ace) gives +{chips} Chips' },
  adlerauge: { name: 'Eagle Eye', description: 'Each scored Ace gives +{chips} Chips' },
  fruehaufsteher: { name: 'Early Riser', description: 'The first scored card gives +{mult} Mult' },
  schlussakkord: { name: 'Final Chord', description: 'The last scored card gives +{chips} Chips' },
  wachposten: { name: 'Sentry', description: 'Each Face Card held in hand gives +{mult} Mult' },
  ruhekissen: { name: 'Cushion', description: 'Each card held in hand with rank 2 to {maxRank} gives +{chips} Chips' },
  vorrat: { name: 'Stockpile', description: 'Each card held in hand gives +{chips} Chips' },

  // Gruppe 3: Retrigger
  kleines_echo: { name: 'Little Echo', description: 'Scored cards of rank 2 to {maxRank} are retriggered {retrigger}x' },
  hofecho: { name: 'Court Echo', description: 'Scored Face Cards are retriggered {retrigger}x' },
  adlerecho: { name: 'Eagle Echo', description: 'Scored Aces are retriggered {retrigger}x' },
  erstschlag: { name: 'First Strike', description: 'The first scored card is retriggered {retrigger}x' },
  schlussecho: { name: 'Final Echo', description: 'On the last hand of the round, all scored cards are retriggered {retrigger}x' },
  haltegriff: { name: 'Firm Grip', description: 'Effects of cards held in hand are retriggered {retrigger}x' },

  // Gruppe 4: Skalierend
  schneeball: { name: 'Snowball', description: 'Gains +{gain} Mult per hand played (currently +{mult} Mult)' },
  lawine: { name: 'Avalanche', description: 'Gains +{gain} Chips per discard (currently +{chips} Chips)' },
  glimmer: { name: 'Glimmer', description: 'Gains +{gain} Mult if the hand contains a Flush (currently +{mult} Mult)' },
  pfadfinder: { name: 'Pathfinder', description: 'Gains +{gain} Chips if the hand contains a Straight (currently +{chips} Chips)' },
  gezeiten: { name: 'Tides', description: 'Gains +{gain} Mult per Blind cleared (currently +{mult} Mult)' },
  wachskerze: { name: 'Wax Taper', description: 'X{x} Mult, loses X{loss} per hand played and burns out at X1' },
  zwillingsring: { name: 'Twin Ring', description: 'Gains X{gain} Mult if the hand contains a Pair (currently X{x} Mult)' },
  sparschwein: { name: 'Piggy Bank', description: 'X{xPerStep} extra Mult for every ${step} you hold' },

  // Gruppe 5: Geld
  muenzquelle: { name: 'Coin Spring', description: '+${money} at the end of each round' },
  handarbeit: { name: 'Handiwork', description: '+${money} per remaining hand at the end of the round' },
  zinsmeister: { name: 'Usurer', description: 'The interest cap rises by ${cap}' },
  goldwaescher: { name: 'Gold Panner', description: 'Each scored card: {num} in {den} chance for +${money}' },
  glueckstaler: { name: 'Lucky Taler', description: 'Each scored {rank}: {num} in {den} chance for +${money}' },
  kartenhaendler: { name: 'Card Trader', description: '+${money} per discarded Face Card' },
  beutezug: { name: 'Plunder', description: '+${money} when a Boss Blind is cleared' },
  rentner: { name: 'Pensioner', description: '+$1 per {every} Antes at the end of each round (minimum $1)' },

  // Gruppe 6: Blind und Shop
  wuerfelhand: { name: 'Dice Hand', description: '{count} free Reroll per Shop' },
  marktschreier: { name: 'Market Crier', description: '+{slots} card slot in the Shop' },
  kundenkarte: { name: 'Patron Card', description: 'Cards and Packs in the Shop cost 15% less' },
  hehler: { name: 'Fence', description: 'When this Joker is sold: +${money}' },
  lagerfeuer: { name: 'Hearthfire', description: 'When the Small Blind is selected: +${money}' },
  sternwart: { name: 'Stargazer', description: 'Each time a Blind is selected, a Constellation is created (if a slot is free)' },
  lehrling: { name: 'Apprentice', description: 'When a Boss Blind is selected, an Elixir is created (if a slot is free)' },

  // Gruppe 7: Regeln und Passiv
  schnellgriff: { name: 'Quick Grip', description: 'Flush and Straight need only 4 cards' },
  sprungbrett: { name: 'Springboard', description: 'Straights may have gaps of one rank' },
  farbwechsel: { name: 'Color Shift', description: 'Hearts and Diamonds count as the same suit, as do Spades and Clubs' },
  streuguss: { name: 'Scattershot', description: 'All played cards are scored' },
  maskenball: { name: 'Masquerade', description: 'Every card counts as a Face Card' },
  uhrwerk: { name: 'Clockwork', description: '+{amount} Hand per round' },
  pendel: { name: 'Pendulum', description: '+{amount} Discard per round' },
  falttasche: { name: 'Satchel', description: '+{amount} Hand Size' },
  gluecksklee: { name: 'Lucky Clover', description: 'All "X in Y" chances are doubled' },
  guerteltasche: { name: 'Belt Pouch', description: '+{amount} Consumable Slot' },
  lastkarren: { name: 'Cargo Cart', description: '+{amount} Joker Slot' },

  // Gruppe 8: Spezial
  spiegelbild: { name: 'Reflection', description: 'Copies the Joker to its right' },
  urbild: { name: 'Archetype', description: 'Copies the leftmost Joker' },
  schutzengel: { name: 'Guardian Angel', description: 'Saves you once from losing a round if you reach at least a quarter of the target, then is used up' },
  kupferschmied: { name: 'Coppersmith', description: 'The first scored card without an Enhancement permanently becomes Copper' },
  schleifstein: { name: 'Whetstone', description: 'Each scored card permanently gains +{gain} Chips' },
  gefolgschaft: { name: 'Retinue', description: 'Each other Common Joker that triggers in the Joker phase gives +{mult} Mult' },
  sternenkoenig: { name: 'Star King', description: 'X{xMult} Mult' },
  ewiges_licht: { name: 'Eternal Light', description: '+{amount} Hand, +{amount} Discard and +{amount} Hand Size' },
  meister_der_tinkturen: { name: 'Tincture Master', description: 'When a Blind is selected, an Elixir and a Constellation are created (if slots are free)' },
};

/** Schreibt die registrierten Joker Definitionen (dieselben Objekte, die das Spiel nutzt) auf Englisch um */
export default function patch() {
  for (const def of allJokers()) {
    const e = EN[def.id];
    if (!e) continue;
    def.name = e.name;
    def.description = e.description;
  }
}
