/**
 * Zahlen für Geräte koppeln, Export und Import. Der Kopplungscode ist ein Zufallscode ohne Konto,
 * der Server sieht nur einen Hash davon und verschlüsselte Daten.
 */
export const SYNC = {
  /** Alphabet ohne leicht verwechselbare Zeichen (kein I, O, 0, 1): 32 Zeichen, also 5 Bit je Zeichen */
  codeAlphabet: 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789',
  /** Länge des Codes: 20 Zeichen sind 100 Bit Zufall */
  codeLength: 20,
  /** Gruppengröße bei der Anzeige (XXXX-XXXX-XXXX-XXXX-XXXX) */
  codeGroup: 4,
  /** Rechenaufwand der Schlüsselableitung (PBKDF2), der Code selbst hat genug Zufall */
  kdfIterations: 100000,
  /** Trennt die Ableitung der Server ID von der des Datenschlüssels */
  idDomain: 'alatro.sync.id.v1',
  keyDomain: 'alatro.sync.key.v1',
  /** Format des Pakets (Export, Import, Cloud Inhalt) */
  bundleFormat: 1,
  /** Kennung vor einem Export Text, damit Fremdtext sofort auffällt */
  exportPrefix: 'ALATRO1.',
  /** Dateiname beim Export */
  exportFileName: 'alatro-spielstand.json',
  /** Obergrenze für einen eingelesenen Text, schützt vor versehentlich riesigen Einfügungen (Zeichen) */
  importMaxChars: 4_000_000,
} as const;
