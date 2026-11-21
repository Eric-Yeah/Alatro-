// Englische Namen und Kurzbeschreibungen der Musikstücke (src/data/music.ts). Kurzbeschreibung höchstens MUSIC.infoMax Zeichen.
import { TRACKS } from '../../data/music';

const EN: Record<string, { name: string; info: string }> = {
  sternenglas: { name: 'Star Glass', info: 'Bright glass tones, calm and wide' },
  mondlabor: { name: 'Moon Lab', info: 'Distant music box, dark, mysterious' },
  sphaerenklang: { name: 'Sphere Chime', info: 'Deep fifths and singing bowls' },
};

export default function patch() {
  for (const t of TRACKS) {
    const en = EN[t.id];
    if (!en) continue;
    t.name = en.name;
    t.info = en.info;
  }
}
