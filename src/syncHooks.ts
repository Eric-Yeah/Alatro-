/**
 * Kleiner Meldekanal: Speicher Module melden lokale Änderungen, der Sync hört zu.
 * Eigene Datei, damit `save.ts` und `profile.ts` den Sync nicht importieren müssen (keine Zyklen).
 */
export type ChangeKind = 'profile' | 'run';

let listener: ((kind: ChangeKind) => void) | null = null;

export function onLocalChange(fn: ((kind: ChangeKind) => void) | null) {
  listener = fn;
}

export function notifyChange(kind: ChangeKind) {
  listener?.(kind);
}
