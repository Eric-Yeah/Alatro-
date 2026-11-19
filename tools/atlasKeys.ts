// Schreibt die Schlüssel aller Atlas Einträge als JSON (für tools/atlasShot.cjs). Jeder siebte bleibt unentdeckt.
// Aufruf: npx vite-node tools/atlasKeys.ts <ausgabedatei>
import { writeFileSync } from 'node:fs';
import '../src/core/index';
import { COLLECTION_TABS, collectionEntries } from '../src/collection';

const keys: string[] = [];
let n = 0;
for (const t of COLLECTION_TABS) for (const e of collectionEntries(t.id)) if (n++ % 7 !== 3) keys.push(e.key);
writeFileSync(process.argv[2] ?? 'atlas-keys.json', JSON.stringify(keys));
console.log(keys.length, 'Schlüssel');
