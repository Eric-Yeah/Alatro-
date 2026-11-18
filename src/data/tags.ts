/** Eigene Tags, die man für das Überspringen eines Small oder Big Blinds bekommt. */
export type TagEffect =
  | { kind: 'money'; amount: number }
  | { kind: 'moneyPerSkip'; amount: number }
  | { kind: 'freeRerolls'; count: number }
  | { kind: 'shopDiscount'; factor: number }
  | { kind: 'freeJoker'; rarity: 'uncommon' | 'rare' }
  | { kind: 'openPack'; pack: string }
  | { kind: 'extraHands'; amount: number }
  | { kind: 'disableBoss' }
  | { kind: 'duplicateNext' };

export interface TagDef {
  id: string;
  name: string;
  description: string;
  /** frühestens ab dieser Ante als Skip Belohnung */
  minAnte: number;
  effect: TagEffect;
  /** sofort oder beim nächsten passenden Ereignis */
  when: 'immediate' | 'nextShop' | 'nextRound' | 'nextBoss' | 'nextTag';
}

export const TAGS: TagDef[] = [
  { id: 'goldstaub', name: 'Goldstaub', description: '+$8 sofort', minAnte: 1, when: 'immediate', effect: { kind: 'money', amount: 8 } },
  { id: 'wanderer', name: 'Wanderer', description: '+$3 pro bisher übersprungenem Blind', minAnte: 1, when: 'immediate', effect: { kind: 'moneyPerSkip', amount: 3 } },
  { id: 'wuerfelglueck', name: 'Würfelglück', description: 'Die ersten 2 Rerolls im nächsten Shop sind gratis', minAnte: 1, when: 'nextShop', effect: { kind: 'freeRerolls', count: 2 } },
  { id: 'sternenrabatt', name: 'Sternenrabatt', description: 'Im nächsten Shop kostet alles die Hälfte', minAnte: 1, when: 'nextShop', effect: { kind: 'shopDiscount', factor: 0.5 } },
  { id: 'komet', name: 'Komet', description: 'Der nächste Shop enthält einen gratis Uncommon Joker', minAnte: 1, when: 'nextShop', effect: { kind: 'freeJoker', rarity: 'uncommon' } },
  { id: 'supernova', name: 'Supernova', description: 'Der nächste Shop enthält einen gratis Rare Joker', minAnte: 2, when: 'nextShop', effect: { kind: 'freeJoker', rarity: 'rare' } },
  { id: 'gauklerkiste', name: 'Gauklerkiste', description: 'Öffnet sofort ein gratis Mega Joker Pack', minAnte: 2, when: 'immediate', effect: { kind: 'openPack', pack: 'joker_mega' } },
  { id: 'kartenregen', name: 'Kartenregen', description: 'Öffnet sofort ein gratis Mega Karten Pack', minAnte: 1, when: 'immediate', effect: { kind: 'openPack', pack: 'karten_mega' } },
  { id: 'nachtwache', name: 'Nachtwache', description: '+1 Hand in der nächsten Runde', minAnte: 1, when: 'nextRound', effect: { kind: 'extraHands', amount: 1 } },
  { id: 'schutzzauber', name: 'Schutzzauber', description: 'Deaktiviert den Effekt des nächsten Boss Blinds', minAnte: 1, when: 'nextBoss', effect: { kind: 'disableBoss' } },
  { id: 'doppelstern', name: 'Doppelstern', description: 'Der nächste Tag zählt doppelt', minAnte: 1, when: 'nextTag', effect: { kind: 'duplicateNext' } },
];
