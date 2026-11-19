import { TUTORIAL_PICKS } from './tutorialRun';

/** Wohin der Zeiger der Einführung deutet (die Oberfläche ordnet jedem Ziel ein Objekt zu) */
export type GuideTarget =
  | 'blindPlay' | 'blindSkip' | 'blindBoss' | 'blindTarget' | 'pickCards' | 'handPanel' | 'scorePanel' | 'playBtn' | 'discardBtn'
  | 'counters' | 'cashoutBtn' | 'shopJoker' | 'shopBuy' | 'nextRound' | 'jokerTray' | 'targetPanel' | 'moneyPanel';

/** Ereignisse, auf die ein Schritt warten kann. `tap` heißt: der Spieler tippt auf Weiter. */
export type GuideEvent = 'tap' | 'blindStarted' | 'selection' | 'played' | 'discarded' | 'cashedOut' | 'bought' | 'leftShop';

export interface GuideStep {
  id: string;
  title: string;
  text: string;
  wait: GuideEvent;
  target?: GuideTarget;
  /** Auswahlschritt: genau diese Karten (Schlüssel) müssen gewählt werden, nur sie sind antippbar */
  select?: readonly string[];
  /** Sprechfeld: ganz oben (Blind Auswahl), unter den Jokers (in der Runde) oder unten (Auszahlung und Shop) */
  dock: 'high' | 'top' | 'bottom';
}

const SELECT_HINT = 'Tippe eine Karte erneut an, um sie wieder abzuwählen.';

/**
 * Ablauf der Einführungsrunde. Spielbegriffe auf Englisch, sonst Deutsch, keine Gedankenstriche.
 */
export const GUIDE_STEPS: readonly GuideStep[] = [
  {
    id: 'willkommen', title: 'Willkommen in der Sternwarte', wait: 'tap', dock: 'high',
    text: 'Ich bin Astra und zeige dir in einer kurzen Runde, wie Alatro funktioniert. Du spielst echte Hände, ich sage dir, was zu tun ist. Dauert nur ein paar Minuten.',
  },
  {
    id: 'blinds', title: 'Antes und Blinds', wait: 'tap', dock: 'high', target: 'blindTarget',
    text: 'Ein Run besteht aus Antes. Jedes Ante hat drei Blinds: Small Blind, Big Blind und einen Boss. Bei jedem Blind musst du ein Punkteziel erreichen. Beim Small Blind sind es hier nur 210 Punkte, damit der Einstieg leicht ist.',
  },
  {
    id: 'start1', title: 'Der erste Blind', wait: 'blindStarted', dock: 'high', target: 'blindPlay',
    text: 'Tippe auf Spielen, um den Small Blind zu beginnen.',
  },
  {
    id: 'hand', title: 'Deine Hand', wait: 'tap', dock: 'top', target: 'pickCards',
    text: 'Das sind deine 8 Karten. Du darfst bis zu 5 davon spielen. Je besser die Pokerhand, desto mehr Punkte bekommst du. Rechts unten liegt dein Stapel, oben siehst du später deine Jokers.',
  },
  {
    id: 'pickPair', title: 'Ein Pair spielen', wait: 'selection', dock: 'top', target: 'pickCards', select: TUTORIAL_PICKS.pair,
    text: `Fang mit etwas Einfachem an: Tippe die beiden Könige an. Zwei gleiche Karten sind ein Pair. ${SELECT_HINT}`,
  },
  {
    id: 'preview', title: 'Chips mal Mult', wait: 'tap', dock: 'top', target: 'handPanel',
    text: 'Hier siehst du, was deine Auswahl ergibt: ein Pair. Die blaue Zahl sind Chips, die rote Zahl ist der Mult. Chips mal Mult ergibt die Punkte. Jede gespielte Karte bringt noch Chips dazu.',
  },
  {
    id: 'playPair', title: 'Hand spielen', wait: 'played', dock: 'top', target: 'playBtn',
    text: 'Tippe auf Play Hand.',
  },
  {
    id: 'afterPair', title: 'Dein Score', wait: 'tap', dock: 'top', target: 'scorePanel',
    text: 'Die Punkte landen im Round Score. Dein Ziel sind 210. Ein Pair allein reicht nicht, du brauchst eine stärkere Hand. Dafür gibt es Discards.',
  },
  {
    id: 'discardIntro', title: 'Karten abwerfen', wait: 'tap', dock: 'top', target: 'counters',
    text: 'Du hast vier Herzen (♥) auf der Hand. Fünf Karten derselben Suit sind ein Flush. Mit einem Discard wirfst du Karten ab und ziehst neue nach. Das kostet keine Hand, aber Discards sind begrenzt.',
  },
  {
    id: 'pickDiscard', title: 'Passende Karten behalten', wait: 'selection', dock: 'top', target: 'pickCards', select: TUTORIAL_PICKS.discard,
    text: `Wähle die drei Karten, die keine Herzen sind: 2♣, 6♦ und 9♠. ${SELECT_HINT}`,
  },
  {
    id: 'doDiscard', title: 'Abwerfen', wait: 'discarded', dock: 'top', target: 'discardBtn',
    text: 'Tippe auf Discard.',
  },
  {
    id: 'afterDiscard', title: 'Gut gezogen', wait: 'tap', dock: 'top', target: 'pickCards',
    text: 'Du hast die Q♥ nachgezogen. Jetzt hast du fünf Herzen, einen Flush. In einem echten Run musst du auf dein Glück hoffen, hier habe ich etwas nachgeholfen.',
  },
  {
    id: 'pickFlush', title: 'Den Flush wählen', wait: 'selection', dock: 'top', target: 'pickCards', select: TUTORIAL_PICKS.flush,
    text: `Wähle die fünf Herzen: 4, 8, 10, J und Q. ${SELECT_HINT}`,
  },
  {
    id: 'playFlush', title: 'Flush spielen', wait: 'played', dock: 'top', target: 'playBtn',
    text: 'Ein Flush bringt viel mehr Chips und Mult als ein Pair. Tippe auf Play Hand.',
  },
  {
    id: 'cashout', title: 'Blind geschafft', wait: 'cashedOut', dock: 'bottom', target: 'cashoutBtn',
    text: 'Das Ziel ist erreicht. Du bekommst Geld für den Blind, für jede übrige Hand und Zinsen auf dein Erspartes. Spare klug, denn Zinsen sind ein starker Bonus. Tippe auf Einkassieren.',
  },
  {
    id: 'shop', title: 'Der Shop', wait: 'tap', dock: 'bottom',
    text: 'Nach jedem Blind kommst du in den Shop. Mit deinem Geld kaufst du Jokers, Consumables, Packs und Vouchers. Jokers sind das Herz deiner Strategie: Sie verändern, wie deine Punkte entstehen.',
  },
  {
    id: 'buy', title: 'Einen Joker kaufen', wait: 'bought', dock: 'bottom', target: 'shopJoker',
    text: 'Tippe auf den Funke und dann auf Kaufen. Er kostet 2 und gibt bei jeder Hand +4 Mult.',
  },
  {
    id: 'bought', title: 'Dein erster Joker', wait: 'tap', dock: 'bottom', target: 'jokerTray',
    text: 'Der Funke sitzt jetzt oben in deiner Joker Leiste. Jokers wirken von links nach rechts, nachdem die Karten gezählt wurden. Du hast nur 5 Slots, ein Joker lässt sich später verkaufen und umsortieren. Reroll, Packs und Vouchers probierst du im echten Run aus.',
  },
  {
    id: 'next', title: 'Weiter geht es', wait: 'leftShop', dock: 'bottom', target: 'nextRound',
    text: 'Tippe auf Next Round.',
  },
  {
    id: 'skipInfo', title: 'Skip und Boss', wait: 'tap', dock: 'high', target: 'blindSkip',
    text: 'Small und Big Blind kannst du überspringen. Dafür bekommst du einen Tag mit einem Bonus, verzichtest aber auf Belohnung und Chancen. Der Boss hat eine Sonderregel und lässt sich nicht überspringen. Wir spielen den Big Blind.',
  },
  {
    id: 'start2', title: 'Der Big Blind', wait: 'blindStarted', dock: 'high', target: 'blindPlay',
    text: 'Tippe auf Spielen. Das Ziel ist jetzt höher: 315 Punkte.',
  },
  {
    id: 'pickFull', title: 'Full House', wait: 'selection', dock: 'top', target: 'pickCards', select: TUTORIAL_PICKS.full,
    text: `Drei Damen und zwei Buben sind ein Full House. Wähle diese fünf Karten. ${SELECT_HINT}`,
  },
  {
    id: 'playFull', title: 'Mit Joker spielen', wait: 'played', dock: 'top', target: 'playBtn',
    text: 'Tippe auf Play Hand und achte darauf, wann der Funke seinen Mult dazugibt.',
  },
  {
    id: 'ende', title: 'Geschafft', wait: 'tap', dock: 'bottom',
    text: 'Das waren die Grundlagen.',
  },
];

export const GUIDE_STEP_IDS = GUIDE_STEPS.map((s) => s.id);
