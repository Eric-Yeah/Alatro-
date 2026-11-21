import { LANGS, LANG_NAMES, getLang, t, type Lang } from '../i18n';
import { updateSettings } from '../settings';
import { C } from './theme';
import { Button } from './widgets';

/** Die Sprache nach `lang` in der Reihenfolge von LANGS (nach der letzten wieder die erste) */
export function nextLang(lang: Lang): Lang {
  return LANGS[(LANGS.indexOf(lang) + 1) % LANGS.length];
}

/**
 * Wechselt die Sprache: speichert sie in den Einstellungen und lädt die App neu, weil Inhalte aus
 * `src/data/` beim Start umgeschrieben werden. `reload` ist für Tests austauschbar.
 */
export function switchLanguage(lang: Lang, reload: () => void = () => location.reload()) {
  if (lang === getLang()) return;
  updateSettings({ lang });
  reload();
}

/** Texte der Options Zeile "Sprache" (zur Laufzeit übersetzt, passend zu den anderen Zeilen mit Name und Hinweis) */
export function languageRowTexts(): { name: string; desc: string } {
  return { name: t('Sprache'), desc: t('Deutsch oder English, das Spiel lädt neu') };
}

/**
 * Auswahl Knopf für die Options Zeile: zeigt die aktuelle Sprache in ihrer eigenen Sprache,
 * ein Tipp wechselt zur nächsten und lädt neu. Breite und Farbe wie bei "Kartenfarben".
 */
export function languageButton(width = 230, height = 56): Button {
  return new Button(LANG_NAMES[getLang()], width, height, C.chips, () => switchLanguage(nextLang(getLang())), 22);
}
