// Englische Namen der Tempo Stufen und Grafikstufen (src/data/juice.ts).
import { QUALITY_NAMES, SPEED_STEPS } from '../../data/juice';

export default function patch() {
  // Dezimalpunkt statt Komma: "1,5x" wird "1.5x"
  for (const s of SPEED_STEPS) s.name = s.name.replace(',', '.');
  QUALITY_NAMES.voll = 'Full';
  QUALITY_NAMES.sparsam = 'Lite';
}
