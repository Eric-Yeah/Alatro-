import { applyDataLanguage } from './applyData';
import { snapshotGerman } from './deSource';
import { getLang } from './index';

// Muss in main.ts direkt nach './core/index' und vor allen UI Modulen importiert werden:
// bei Englisch werden die Inhalte aus src/data/ umgeschrieben, bevor jemand sie liest.
snapshotGerman();
applyDataLanguage();
try { document.documentElement.lang = getLang(); } catch { /* ohne DOM */ }
