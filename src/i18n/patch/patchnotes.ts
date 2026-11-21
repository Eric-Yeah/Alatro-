// Englische Patch Notes. Überschreibt Titel, Datum und Punkte je Version aus src/data/patchnotes.ts.
// Gleiche Versionen und gleiche Anzahl Punkte je Version wie im Deutschen (der Test prüft das).
import { PATCH_NOTES } from '../../data/patchnotes';
import { lazyProp, nameOf } from '../lazy';

type Item = string | (() => string);
const ed = nameOf.edition;
const track = nameOf.track;

const EN: Record<string, { title: string; items: Item[] }> = {
  '0.9.0': {
    title: 'Pairing Devices',
    items: [
      'New: You can now play on several devices with the same progress. In the options under "Pair devices" you create a pairing code on the first device and enter it on the others. You do not need an account.',
      'New: Profile, collection and the current run travel along. The data sits encrypted in the cloud, and nobody can read it without your code. Write the code down, because without it you cannot get back to the cloud save.',
      'New: A run from the cloud is only loaded on the home screen, never in the middle of a round. If two devices are running different runs, the game asks which one should count.',
      'New: In the options under "Save data" you can back up profile, collection and run as a file or as text, and load them again. This also works as a backup.',
    ],
  },
  '0.8.3': {
    title: 'Loading Card',
    items: [
      'New: The transition between screens is now a loading card. The screen fades to night blue, a card drops in at the center and loads with a golden bar, then it flips over and the fade dissolves. This applies when opening the app and when switching between the home screen and the game. The dome wipe from 0.8.1 is gone.',
      'Improved: The transition is calmer, a switch takes about two and a half seconds. Touch is locked during it, and the animation speed from the options applies here too.',
    ],
  },
  '0.8.2': {
    title: 'Bolder Numbers and Symbols',
    items: [
      'Improved: Numbers and letters in the corners of the cards are larger and have thicker strokes, so you can spot rank and suit at a glance.',
      'Improved: The symbols in the middle of the number cards have a dark outline and stand out more clearly.',
    ],
  },
  '0.8.1': {
    title: 'Dome Wipe',
    items: [
      'New: Transition animation between the big screens. When opening the app and when switching between the home screen and the game (new run, continue, tutorial, menu), two halves of the observatory dome close and open again. Touch is locked during the wipe. The animation speed from the options applies here too.',
    ],
  },
  '0.8.0': {
    title: 'Pixel Art for Everything',
    items: [
      'New: All 52 playing cards in pixel art style. Jack, Queen and King are twelve unique figures from the Observatory of the Alchemists, the Aces glow with shine and sparks, and the pips are bigger. In the options you choose the card colors: Standard or High Contrast.',
      () => `New: All 79 Jokers have their own pixel art image. The Editions ${ed('schimmer')}, ${ed('prisma')}, ${ed('aura')} and ${ed('schatten')} stay visible.`,
      'New: All 42 Consumables are proper cards with a frame and a title band, Constellations in midnight blue, Elixirs in emerald, Omens in violet.',
      'New: New Booster Packs as sealed wrappers, five kinds in Normal, Jumbo and Mega, plus a Voucher ticket. Packs and rare cards sparkle, pop up when tapped, and opening a Pack bursts with a flash and sparks. The Lite option and Screen Shake off tone the effects down.',
      'Improved: With three or more cards, the Consumable row shows all pictures and names, in two rows. The Star Atlas now shows discovered entries with their image.',
    ],
  },
  '0.7.1': {
    title: 'Music in Rotation',
    items: [
      'New: Mix is now the default music. The three pieces take turns, each lasts about two minutes and is gently blended into the next. You can still pick a single piece in the options.',
      'New: During big effects (score impact, fanfares, achievements, opening a Pack) the music is briefly pulled down so the effect stands clear.',
      'Improved: The pads sound wider in the stereo image, there are calmer chords with fewer bells, and a high pass removes any rumble from reverb and echo. All pieces are equally loud.',
      'Improved: On the Lite graphics setting the music plays in a lighter variant, which saves battery and processing power.',
    ],
  },
  '0.7.0': {
    title: 'Background Music',
    items: [
      'New: Calm, mystical background music with no beat and no bass. Soft pads, scattered bell tones and a quiet breath of air, all generated live in the game and endless.',
      () => `Three pieces to choose from in the options: ${track('sternenglas')} (bright, glass tones), ${track('mondlabor')} (dark, distant music box) and ${track('sphaerenklang')} (deep, singing bowls). The music has its own volume and can be switched off.`,
      'The music pauses when the app is in the background.',
    ],
  },
  '0.6.2': {
    title: 'New Title',
    items: [
      'New: The ALATRO title in the main menu is now made of six playing cards that are thrown down one after another when you open it. Touch a card and it lifts. A tap on the title flips all cards, a second tap flips them back.',
      'New: A custom title font for the letters on the cards, angular and heavy, with a four pointed star in the A and the O.',
    ],
  },
  '0.6.1': {
    title: 'Vibration',
    items: [
      'New: Vibration on touches, counting steps, X Mult, the impact of the total score, shop, Consumables, victory and defeat. The bigger the hit, the stronger the buzz. Can be switched off in the options.',
      'Note: Android devices vibrate fully. On the iPhone there is only a light tap on touches, and the iPad has no vibration motor.',
    ],
  },
  '0.6.0': {
    title: 'Star Atlas, Seals and Recap',
    items: [
      'New: The collection is now called the Star Atlas. The overall progress is at the top, new finds carry a NEW badge, and entries you do not know yet show a hint where to find them. On the main menu the Atlas button shows the progress and glows when there are new finds.',
      'New: During a run, a notice appears as soon as something new enters the Atlas.',
      'New: Seals on the Deck. In the run setup you see, for each Deck, the highest ladder tier you have won on, and the next goal. Nothing is locked, it is just a target.',
      'New: Instant retry after a run starts with the same settings and a new seed. The recap shows how many points were missing to the target (from 30 percent) and what is new in the Atlas.',
      'New: While counting up, a bright tone rings as soon as the Blind target is reached. If you beat the target by a wide margin, you see the overshoot and hear a bigger fanfare. The fanfare sounds different for Small, Big and Boss Blind.',
      'New: Tapping during the score animation briefly speeds it up.',
      'Fixed: The collection showed raw placeholders like {mult} on Jokers. Windows that are too tall are now fitted to the screen.',
    ],
  },
  '0.5.0': {
    title: 'Achievements, Tutorial and Difficulty',
    items: [
      'New: Achievements with stars and rank. Over 60 achievements in eight categories, with progress bars and statistics across all runs. A banner appears at the top when you unlock one.',
      'New: Guided tutorial round. On first launch, Astra offers a short round in which you really play a Pair, a Discard, a Flush, the shop and a Joker. Repeatable from the main menu.',
      'New: Scaling difficulty with 20 levels. The Blind target grows in fine steps, and from certain levels extra rules apply. The fixed ladder of Stakes stays selectable.',
      () => `New: The ${nameOf.stake('morgenrot')} tier is a bit easier than the base game (targets 25% lower, 1 extra Discard) and is the default for new players.`,
      'New: Daily Run with a fixed seed, Deck, difficulty and a Daily Twist. Your best Ante per day is remembered.',
      'New: Recap after every run with records, achievements and a tip. After a win there is a button for the next harder level, after a defeat a restart with the same seed. A new personal best per hand is announced right away.',
      'Changed: Target factors from different sources (level, Deck, twist) multiply. Saves are carried over to version 5 automatically.',
    ],
  },
  '0.4.0': {
    title: 'Reviewed and Tidied Up',
    items: [
      'New: The shop shows the next Blind and the Boss rule in the sidebar. A hint in the first round explains how to select cards.',
      'New: Cards show the name of their Edition and a letter in the Seal. Game Over shows most played hands and Jokers.',
      'New: Darker night palette with more stars, with a warm brass tone in the shop. The playfield respects the status bar and the home indicator.',
      'Fixed: Cut off Boss rule, scores and card names that were too long, wrong Consumable counter, buttons that were too small in detail cards.',
      () => `Balance: ${nameOf.joker('hehler')} costs $7 and pays $8 when sold (before, a guaranteed profit).`,
    ],
  },
  '0.3.3': {
    title: 'Jokers at a Glance',
    items: [
      'New: Colored descriptions. Chips are blue, Mult red, X Mult a red pill, money gold, and Hands, Discards, suits and hand names have colors of their own.',
      'New: Conditions ("if the hand ...", "Each scoring card") are set off in violet, current values of growing Jokers in green.',
      'New: Small colored marks on every Joker card show its effect: C Chips, M Mult, X X Mult, $ money, R retrigger, W grows, P passive.',
      'New: The Joker tooltip names the effects and says when the Joker fires.',
      'This also applies in the shop, in Packs, for Consumables, in the collection and in Run Info.',
    ],
  },
  '0.3.2': {
    title: 'New Shop',
    items: [
      'New: The shop has its own layout. Next Round and Reroll on the left, the card slots at the top, the Voucher in its own compartment at the bottom, and the Booster Packs as foil bags.',
      'New: Neon SHOP sign with blinking light bulbs in the sidebar.',
      'New: Prices hang as a flag above every item. A tap on an item lifts it and shows name, description and the buttons Buy, Use, Redeem or Open. A tap on empty space closes the card again.',
      'Items drop into their slots one after another when you enter the shop.',
    ],
  },
  '0.3.1': {
    title: 'Softer Font',
    items: [
      'Changed: The font is bolder, narrower and has rounded corners. It no longer looks stepped and pixelated, but not smooth and perfect either, more like slightly handmade.',
    ],
  },
  '0.3.0': {
    title: 'Pixel Font and Hologram Look',
    items: [
      'New: Custom pixel font for titles, numbers, buttons and names, including umlauts and card symbols. Longer descriptions stay easy to read.',
      'New: Clear, flat surfaces with hard outlines and thin glow lines like a hologram.',
      'New: Background made of hard color steps with a soft glow and small stars.',
      'New: Hologram effect with a cool tint, a fine color fringe, light scanlines and a band of light that slowly drifts across the picture. No curvature and no noise, the picture stays sharp. Can be switched off in the options.',
      'Cards (playing cards, Jokers, Consumables) keep their previous design.',
      'Text is drawn sharp at every window size.',
    ],
  },
  '0.2.1': {
    title: 'Home Screen',
    items: [
      'New: Fullscreen home screen at launch with Continue, New Run, Collection, How to Play, Options and What\'s New.',
      'Continue shows Ante, money, Deck and Stake of the saved run.',
      'New Run now has a Back button to the home screen.',
    ],
  },
  '0.2.0': {
    title: 'Speed, Guide and Patch Notes',
    items: [
      'New: Animation speed up to 10x. Steps of 1x, 1.5x, 2x, 3x, 5x and 10x, adjustable in the options and with the speed button at the table, even in the middle of a run.',
      'New: How to Play in the main menu with all the basics: goal, round, Chips times Mult, Blinds, shop, Jokers and upgrades.',
      'New: Patch Notes. After an update they appear once automatically, afterwards under What\'s New in the main menu.',
      'New: Mood per Blind, CRT effect, screen shake and flashes in steps by score.',
      'New: Sound with rising pitch while counting, adjustable volume.',
      'New: Shine for Editions and custom emblems for Jokers.',
      'Options: CRT, screen shake, volume, Lite graphics for older devices, and an FPS display.',
      'Seed input without mixing up O and 0.',
    ],
  },
  '0.1.0': {
    title: 'First Playable Build',
    items: [
      'Complete game flow: Blind select with Skip and Tags, rounds, Boss Blinds, shop, Booster Packs and Vouchers.',
      '79 original Jokers, plus Constellations, Elixirs and Omens as Consumables.',
      'Seven Decks and six Stakes, seeds for reproducible runs.',
      'Run Info with hands, Blinds, Vouchers and Deck, plus the collection of all discovered content.',
      'Saving and continuing, installable as an app on the iPad.',
    ],
  },
};

const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

/** "19.11.2026" wird zu "Nov 19, 2026"; alles andere bleibt unverändert */
export function englishDate(de: string): string {
  const m = /^(\d{1,2})\.(\d{1,2})\.(\d{4})$/.exec(de);
  if (!m) return de;
  const month = MONTHS[Number(m[2]) - 1];
  return month ? `${month} ${Number(m[1])}, ${m[3]}` : de;
}

export default function patch() {
  for (const n of PATCH_NOTES) {
    const en = EN[n.version];
    if (!en) continue;
    n.title = en.title;
    n.date = englishDate(n.date);
    n.items = en.items.map((it) => (typeof it === 'string' ? it : ''));
    en.items.forEach((it, i) => { if (typeof it !== 'string') lazyProp(n.items, i, it); });
  }
}
