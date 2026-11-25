import { LEAGUES, ROAD_TITLES } from '../../data/trophyRoad';

/** Englische Ligen (Schlüssel ist die Liga Id): Name und Flair Text der Fanfare. */
export const LEAGUES_EN: Record<string, { name: string; flavor: string }> = {
  liga_1: { name: 'Spark Apprentice', flavor: 'The first sparks leap across, and the night is still young.' },
  liga_2: { name: 'Retort Assistant', flavor: 'The flask bubbles, and you keep it steady.' },
  liga_3: { name: 'Copper Adept', flavor: 'Copper tarnishes, and knowledge becomes craft.' },
  liga_4: { name: 'Silver Magister', flavor: 'Silver lines run through your star charts.' },
  liga_5: { name: 'Moon Astronomer', flavor: 'The moon listens when you calculate.' },
  liga_6: { name: 'Star Diviner', flavor: 'You read pictures in the stars where others see only dots.' },
  liga_7: { name: 'Heaven Master', flavor: 'The heavens turn at the sweep of your hand.' },
  liga_8: { name: 'World Cartographer', flavor: 'Every chart of the night now bears your handwriting.' },
};

/** Englische Titel des Pfads (Schlüssel ist die Titel Id): 8 Liga, 12 freie und 14 Deck Titel. */
export const TITLES_EN: Record<string, { name: string; description: string }> = {
  title_liga_1: { name: 'Spark Apprentice', description: 'Rank of the league Spark Apprentice.' },
  title_liga_2: { name: 'Retort Assistant', description: 'Rank of the league Retort Assistant.' },
  title_liga_3: { name: 'Copper Adept', description: 'Rank of the league Copper Adept.' },
  title_liga_4: { name: 'Silver Magister', description: 'Rank of the league Silver Magister.' },
  title_liga_5: { name: 'Moon Astronomer', description: 'Rank of the league Moon Astronomer.' },
  title_liga_6: { name: 'Star Diviner', description: 'Rank of the league Star Diviner.' },
  title_liga_7: { name: 'Heaven Master', description: 'Rank of the league Heaven Master.' },
  title_liga_8: { name: 'World Cartographer', description: 'Rank of the league World Cartographer.' },
  title_funkenhueter: { name: 'Spark Keeper', description: 'You never let a spark die out.' },
  title_kolbenschwenker: { name: 'Flask Swirler', description: 'Steady hand, clear solution.' },
  title_goldkocher: { name: 'Gold Boiler', description: 'Lead becomes gold, with patience and luck.' },
  title_nachtwaechter: { name: 'Night Watch', description: 'You are awake when the stars are.' },
  title_sternzaehler: { name: 'Star Counter', description: 'Every star is counted, none twice.' },
  title_kometenjaeger: { name: 'Comet Hunter', description: 'You follow the tail wherever it leads.' },
  title_mondfluesterer: { name: 'Moon Whisperer', description: 'The moon tells you its phases in advance.' },
  title_glasblaeser: { name: 'Glassblower of Spheres', description: 'You shape celestial spheres from liquid light.' },
  title_schattenwaeger: { name: 'Shadow Weigher', description: 'You weigh darkness on a gold scale.' },
  title_hueter_der_zeiger: { name: 'Keeper of the Hands', description: 'The clock of the stars runs by you.' },
  title_sonnenzaehmer: { name: 'Sun Tamer', description: 'Even the sun waits for your signal.' },
  title_letzter_alchemist: { name: 'Last Alchemist', description: 'Those who come after you read only your notes.' },
  title_deck_nachthimmel_1: { name: 'Night Sky Apprentice', description: 'First step of the deck path: Night Sky.' },
  title_deck_nachthimmel_3: { name: 'Night Sky Master', description: 'Top step of the deck path: Night Sky.' },
  title_deck_glut_1: { name: 'Ember Apprentice', description: 'First step of the deck path: Ember Deck.' },
  title_deck_glut_3: { name: 'Ember Master', description: 'Top step of the deck path: Ember Deck.' },
  title_deck_tiefsee_1: { name: 'Deep Sea Apprentice', description: 'First step of the deck path: Deep Sea Deck.' },
  title_deck_tiefsee_3: { name: 'Deep Sea Master', description: 'Top step of the deck path: Deep Sea Deck.' },
  title_deck_waage_1: { name: 'Golden Scales Apprentice', description: 'First step of the deck path: Golden Scales.' },
  title_deck_waage_3: { name: 'Golden Scales Master', description: 'Top step of the deck path: Golden Scales.' },
  title_deck_alchemist_1: { name: 'Alchemist Apprentice', description: 'First step of the deck path: Alchemist Deck.' },
  title_deck_alchemist_3: { name: 'Alchemist Master', description: 'Top step of the deck path: Alchemist Deck.' },
  title_deck_sternenkind_1: { name: 'Starchild Apprentice', description: 'First step of the deck path: Starchild.' },
  title_deck_sternenkind_3: { name: 'Starchild Master', description: 'Top step of the deck path: Starchild.' },
  title_deck_halbmond_1: { name: 'Half Moon Apprentice', description: 'First step of the deck path: Half Moon.' },
  title_deck_halbmond_3: { name: 'Half Moon Master', description: 'Top step of the deck path: Half Moon.' },
};

export default function patch() {
  for (const l of LEAGUES) {
    const e = LEAGUES_EN[l.id];
    if (!e) continue;
    l.name = e.name;
    l.flavor = e.flavor;
  }
  for (const t of ROAD_TITLES) {
    const e = TITLES_EN[t.id];
    if (!e) continue;
    t.name = e.name;
    t.description = e.description;
  }
}
