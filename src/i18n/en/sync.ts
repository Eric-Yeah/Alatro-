// Wörterbuch Englisch: Fehlermeldungen des Cloud Abgleichs (src/syncCloud.ts).
const dict: Record<string, string> = {
  'Server antwortet mit {status}': 'Server responded with {status}',
  'Keine Verbindung': 'No connection',
  'Server hat den Stand abgelehnt': 'The server rejected the save',
  'Der Code passt nicht zu den Daten': 'The code does not match the data',
  'Cloud Daten sind beschädigt': 'Cloud data is corrupted',
  'Nicht gekoppelt': 'Not paired',
  'Zu viele gleichzeitige Änderungen, bitte später erneut versuchen': 'Too many changes at once, please try again later',
};
export default dict;
