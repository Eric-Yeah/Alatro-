// Wörterbuch Englisch: Texte aus den Dateien direkt unter src (Sammlung) und aus src/data/music.ts.
const dict: Record<string, string> = {
  // Reiter der Sammlung (Star Atlas)
  Jokers: 'Jokers',
  Sternbilder: 'Constellations',
  Elixiere: 'Elixirs',
  Omen: 'Omens',
  Vouchers: 'Vouchers',
  Tags: 'Tags',
  Bosse: 'Bosses',
  Decks: 'Decks',
  Modifikatoren: 'Modifiers',

  // Hinweise für noch nicht entdeckte Einträge
  'Sehr selten. Kommt nur über ein Omen ins Spiel.': 'Very rare. Only enters the game through an Omen.',
  'Häufig im Shop.': 'Common in the shop.',
  'Häufig im Shop, erst ab Ante {min}.': 'Common in the shop, from Ante {min} on.',
  'Gelegentlich im Shop.': 'Shows up in the shop now and then.',
  'Gelegentlich im Shop, erst ab Ante {min}.': 'Shows up in the shop now and then, from Ante {min} on.',
  'Selten im Shop.': 'Rare in the shop.',
  'Selten im Shop, erst ab Ante {min}.': 'Rare in the shop, from Ante {min} on.',
  'Ein Sternbild. Kauf Sternbild Packs oder spiele Hände seltener Art.': 'A Constellation. Buy Constellation Packs or play rarer hands.',
  'Ein Elixier. Es steckt in Elixier Packs und im Shop.': 'An Elixir. It is found in Elixir Packs and in the shop.',
  'Ein Omen. Es steckt in Omen Packs und im Shop.': 'An Omen. It is found in Omen Packs and in the shop.',
  'Ein Upgrade. Der Basis Voucher dazu muss zuerst gekauft sein.': 'An upgrade. Its base Voucher must be bought first.',
  'Wird im Shop als Voucher des Antes angeboten.': 'Offered in the shop as the Voucher of the Ante.',
  'Eine Skip Belohnung, erst ab Ante {min}.': 'A Skip reward, from Ante {min} on.',
  'Eine Skip Belohnung. Überspringe einen Blind.': 'A Skip reward. Skip a Blind to get it.',
  'Ein Showdown Boss. Er wartet am Ende des Runs.': 'A Showdown Boss. It waits at the end of the run.',
  'Ein Boss Blind. Er erwartet dich am Ende eines Antes.': 'A Boss Blind. It awaits you at the end of an Ante.',
  'Starte einen Run mit diesem Deck.': 'Start a run with this Deck.',
  'Eine Edition auf Jokers und Karten.': 'An Edition on Jokers and cards.',
  'Ein Seal auf einer Karte.': 'A Seal on a card.',
  'Ein Enhancement auf einer Karte.': 'An Enhancement on a card.',

  // Musik: der Mix Eintrag steht als Konstante in src/data/music.ts
  Mix: 'Mix',
  'Alle drei Stücke im Wechsel': 'All three pieces in rotation',
};
export default dict;
