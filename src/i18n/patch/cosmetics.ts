// Englische Namen und Beschreibungen der Kosmetik (src/data/cosmetics.ts). Schlüssel ist die Kosmetik Id.
// Die Titel übernehmen den Wortlaut aus patch/trophies.ts (Agent A), damit Pfad und Katalog gleich heißen.
import { COSMETICS } from '../../data/cosmetics';
import { TITLES_EN } from './trophies';

export const EN: Record<string, { name: string; description: string }> = {
  // Kartenrücken
  back_sternenstaub: { name: 'Stardust', description: 'Scattered stars on deep indigo, like a strip of sky.' },
  back_kupferraute: { name: 'Copper Lozenge', description: 'A lozenge lattice of hammered copper.' },
  back_mondphasen: { name: 'Moon Phases', description: 'Eight phases of the moon in rows on night blue.' },
  back_retorte: { name: 'Retort Glass', description: 'A flask of turquoise elixir, bubbles rising.' },
  back_astrolabium: { name: 'Astrolabe', description: 'Brass rings with pointers and degree marks.' },
  back_tierkreis: { name: 'Zodiac', description: 'Twelve signs in a ring around a star.' },
  back_nebelwirbel: { name: 'Nebula Swirl', description: 'A spiral of violet and pink, like a distant nebula.' },
  back_goldadern: { name: 'Gold Veins', description: 'Branching veins of gold in black rock.' },
  back_sonnenfinsternis: { name: 'Solar Eclipse', description: 'A dark disc wreathed in the rays of the corona.' },
  back_kometenbahn: { name: 'Comet Trail', description: 'Tails of white and blue streak across the night.' },
  back_deck_nachthimmel: { name: 'Seal of the Night Sky', description: 'A crescent moon and three stars, the crest of the Night Sky.' },
  back_deck_glut: { name: 'Seal of Embers', description: 'A flame in a ring, the crest of the Ember Deck.' },
  back_deck_tiefsee: { name: 'Seal of the Deep Sea', description: 'A glowing jellyfish above the waves of the deep.' },
  back_deck_waage: { name: 'Seal of the Scales', description: 'The Golden Scales in perfect balance.' },
  back_deck_alchemist: { name: 'Seal of the Alchemist', description: 'A triangle in a circle, the mark of copper craft.' },
  back_deck_sternenkind: { name: 'Seal of the Starchild', description: 'A radiant star with a halo and sparks.' },
  back_deck_halbmond: { name: 'Seal of the Half Moon', description: 'A half moon with craters above quiet silver.' },
  // Paletten
  pal_bernstein: { name: 'Amber', description: 'Honey gold and resin, hearts and diamonds in warm red.' },
  pal_tintenmeer: { name: 'Ink Sea', description: 'Deep blue with coral red, an ocean at night.' },
  pal_mondsilber: { name: 'Moon Silver', description: 'Cool silver and dusk blue with rose red.' },
  pal_glutkern: { name: 'Ember Core', description: 'Charred black with red glow shining through.' },
  // Himmel
  sky_smaragd: { name: 'Emerald Nebula', description: 'Green nebula above the observatory.' },
  sky_kupfer: { name: 'Copper Dusk', description: 'The last light in the dome, warm as copper.' },
  sky_eisfeld: { name: 'Ice Field', description: 'A clear frosty night, ice blue and still.' },
  sky_blutmond: { name: 'Blood Moon', description: 'A red moon tints the whole sky.' },
  sky_polarlicht: { name: 'Aurora Night', description: 'Green veils drift over a black blue ground.' },
  sky_goldstunde: { name: 'Golden Hour', description: 'The sky in liquid gold, just before sunset.' },
  sky_leere: { name: 'Violet Void', description: 'Deep violet between the stars.' },
  sky_sonnenwende: { name: 'Solstice', description: 'The hue drifts slowly with the sun.' },
  // Funken
  spark_gold: { name: 'Gold Sparks', description: 'Sparks of warm gold, like gold dust in candlelight.' },
  spark_eis: { name: 'Ice Crystals', description: 'Cold sparks of ice and frost.' },
  spark_glut: { name: 'Ember Rain', description: 'Glowing sparks from the forge.' },
  spark_smaragd: { name: 'Emerald Gleam', description: 'Green sparks, cool as a cut emerald.' },
  spark_aether: { name: 'Aether Trail', description: 'A multicolored trail of pure aether.' },
  spark_prisma: { name: 'Prism', description: 'The colors circle through the whole spectrum.' },
};

export default function patch() {
  for (const c of COSMETICS) {
    const e = c.category === 'title' ? TITLES_EN[c.id] : EN[c.id];
    if (!e) continue;
    c.name = e.name;
    c.description = e.description;
  }
}
