# Hook Report: Wie Spiele Spieler binden und was Alatro daraus machen kann

Stand: 19.11.2026. Version 0.4.0 (Branch `claude/eager-brown-4vjfbc`). Reine Analyse, es wurde kein Code geändert.

## TL;DR

**Kernbefund:** Alatro hat einen sehr guten Moment zu Moment Loop (Auswahl, Vorschau, Scoring mit steigender Tonleiter, Shake, Shop mit echten Entscheidungen) und ungewöhnlich viel Inhalt (79 Jokers, 42 Consumables, 26 Vouchers, 7 Decks, 6 Stakes). Es fehlt fast vollständig die **Schicht zwischen den Runs**: kein Fortschritt, der einen Run überdauert, keine Statistik, keine Historie, keine Freischaltungen, keine Achievements, kein Daily. Alles ist ab Sekunde 1 offen. Damit gibt es nach einem Run (Game Over zeigt nur Ante, Punkte, Seed) keinen Grund, der über "Lust auf noch einen Run" hinausgeht, und kein sichtbares Ziel für den nächsten.

**Top 5 Empfehlungen:**

1. **Sternenlogbuch (Meta Statistik und Run Historie)**: neues Modul `src/meta.ts` (eigener Speicherschlüssel wie `collection.ts`), Bestwerte pro Deck und Stake, Siege, Lieblingshand. Sehr klein, Grundlage für alles Weitere. Aufwand S.
2. **Observationsbericht statt kargem Game Over**: Beinahe Anzeige ("Es fehlten nur 8 Prozent"), beste Hand, neu entdeckte Einträge, **ein Tipp "Sofort nochmal"** mit denselben Einstellungen. Aufwand S bis M.
3. **Freischaltpfad "Ausbau der Sternwarte"**: Teile von Jokers, Decks und Stakes werden durch Spielleistung freigeschaltet, mit sichtbarem Fortschrittsbalken und "???" Hinweisen in der Sammlung. Optionaler Schalter "Alles offen". Aufwand M.
4. **Stake Fortschritt pro Deck (Siegel am Deck)**: Gewinnen auf Stake N schaltet Stake N plus 1 für dieses Deck frei, Anzeige im Run Setup. Das gibt Mastery Ziele mit sehr geringem Aufwand. Aufwand S bis M.
5. **Tagessternbild (Daily Seed) ohne Streak Zwang**: Seed aus dem Datum, ein fester Modifikator ("Himmelsereignis"), persönliche Bestwerte lokal. Aufwand M.

Danach: Juice Feinschliff (Ziel erreicht Moment, Partikel, Overkill), Onboarding Run, Kurzlauf Modus fürs iPad. Haptik ist auf dem iPad im Browser nach heutigem Stand nicht sinnvoll machbar.

## Inhaltsverzeichnis

1. Methode und Kennzeichnung der Aussagen
2. Recherche
   * 2.1 Psychologie und Game Design der Retention
   * 2.2 Roguelike und Deckbuilder
   * 2.3 Juice und Game Feel
   * 2.4 Onboarding, Sessions, Frust und fairer Zufall
   * 2.5 Ethische Grenze
3. IST Stand von Alatro (aus dem Code ermittelt)
4. Vergleichsmatrix
5. Verbesserungsvorschläge (priorisiert)
6. Empfohlene Roadmap
7. Offene Fragen und Entscheidungen für den Eigentümer
8. Quellen

---

## 1. Methode und Kennzeichnung der Aussagen

* **IST Stand:** Gelesen wurden `CLAUDE.md`, `docs/HANDOFF.md`, `docs/PLAYTEST.md`, `AUDIT.md`, alle Dateien in `src/data/`, `src/save.ts`, `src/collection.ts`, `src/settings.ts`, relevante Teile von `src/ui/Game.ts`, `src/ui/audio.ts`, `src/ui/juiceMath.ts`, `src/ui/HomeView.ts`. Zahlen wurden per Zählung im Code geprüft. Es wurde nichts ausgeführt.
* **Kennzeichnung:**
  * **[Forschung]** peer reviewte Arbeit oder Standardreferenz, über Suchtreffer bestätigt (oft nur Abstract oder Sekundärquelle gelesen, das steht jeweils dabei).
  * **[Praxis]** Erfahrungswissen von Entwicklern, Vorträgen, Analysen. Plausibel, aber keine kontrollierte Studie.
  * **[Eigene Einschätzung]** meine Schlussfolgerung für Alatro.
* **Grenzen:** Die Websuche lieferte teils nur Sekundärquellen und Abstracts. Wo eine Zahl oder Zuschreibung nicht verifiziert werden konnte, steht das im Text. Konkrete Retention Zahlen für Roguelike Deckbuilder lagen nicht vor. Alle Annahmen zur Wirkung auf Alatro sind Hypothesen, getestet wird nur durch Spielen.
* **Besonderheit Alatro:** Ein einziger Spieler (der Eigentümer), keine Monetarisierung. "Retention" heißt hier: Das Spiel soll über viele Wochen Freude machen und neue Entdeckungen bieten, nicht Daten maximieren.

---

## 2. Recherche

### 2.1 Psychologie und Game Design der Retention

| Konzept | Kernaussage | Beleg | Nutzen für Alatro |
|---|---|---|---|
| **Self Determination Theory** (Competence, Autonomy, Relatedness) | Der Sog von Spielen erklärt sich wesentlich über Bedürfnisbefriedigung: Kompetenzerleben, Entscheidungsfreiheit, Bezug zu anderen. Spieler mit erfüllten Bedürfnissen berichten mehr Vitalität. | [Forschung] Ryan, Rigby, Przybylski 2006, Motivation and Emotion 30, 347 bis 363 (nur Abstracts und Pressetexte gelesen) | Competence und Autonomy sind in Alatro stark (Build Entscheidungen). Relatedness fehlt, wird bei einem Einzelspieler Projekt durch Daily Vergleich mit sich selbst und eine Lore Schicht ersetzt. |
| **Flow** | Klare Ziele, sofortiges Feedback, Balance von Anforderung und Können. GameFlow (Sweetser, Wyeth 2005) übersetzt das in acht Elemente. Es gibt Kritik, dass die Bedingungen nicht hinreichend belegt sind. | [Forschung] Csikszentmihalyi, GameFlow Modell, siehe Quellen | Klares Ziel (Blind Ziel), unmittelbares Feedback (Vorschau, Scoring Animation). Offen ist die Balance: Bot Läufe enden im Mittel bei Ante 3 bis 4 (`docs/PLAYTEST.md`). |
| **Variable Rewards** | Unvorhersehbare Belohnungen erzeugen anhaltendes Verhalten und starke Reaktionen im Belohnungssystem (Vorhersagefehler). Bei Loot Boxen wird das als Variable Ratio beschrieben, der Zusammenhang mit Problemspiel ist umstritten. | [Forschung] Schultz et al. als Referenz genannt, [Praxis] UBC Centre for Gaming Research. Primärquellen nicht gelesen. | Shop, Packs, Rerolls, Edition Würfe, Boss Auswahl liefern das bereits. Bei Alatro ist es eine **gesunde** Form, weil der Spieler Kontrolle hat (Kaufen, Skippen, Reroll). |
| **Near Miss** | Beinahe Treffer erhöhen den Wunsch weiterzuspielen und aktivieren Gewinn Schaltkreise im Gehirn, **aber nur bei Personal Control** (Spieler hat die Konstellation selbst gewählt). | [Forschung] Clark et al. 2009, Neuron (fMRI, 15 Personen, kleine Stichprobe) | Gamble Kontext, daher nur sehr vorsichtig nutzen. Ein ehrlicher "Es fehlten 8 Prozent" Hinweis ist Information, keine künstlich erzeugte Beinahe Illusion. Keine manipulierten Beinahe Ereignisse bauen. |
| **Goal Gradient / Endowed Progress** | Je näher am Ziel, desto mehr Anstrengung. Ein geschenkter Startfortschritt erhöht die Abschlussquote (Autowäsche Feldstudie: 34 Prozent gegen 19 Prozent). | [Forschung] Nunes und Drèze 2006, Kivetz, Urminsky, Zheng 2006 (nur Sekundärquellen, Einzelheiten zur Studiensituation widersprachen sich) | Fortschrittsbalken zu Freischaltungen, "3 von 5 Bedingungen erfüllt". |
| **Zeigarnik und Ovsiankina** | Der klassische Zeigarnik Effekt (bessere Erinnerung an Unerledigtes) ist laut Meta Analyse 2025 **nicht belegt**. Belegt ist die Tendenz, unterbrochene Aufgaben wieder aufzunehmen (Ovsiankina). | [Forschung] Ghibellini und Meier 2025, Palgrave Communications | Vorsicht mit dem Schlagwort "Zeigarnik". Der Fortsetzen Knopf mit Ante Anzeige ist gut begründet (Wiederaufnahme), man braucht keinen künstlichen Cliffhanger. |
| **Loss Aversion, Sunk Cost** | Verluste wiegen schwerer als gleich große Gewinne. Investierte Mittel erhöhen die Neigung, weiterzumachen. | [Forschung] Kahneman und Tversky 1979, Arkes und Blumer 1985 (Referenzen bestätigt, Volltext nicht gelesen) | Sunk Cost ist im Roguelike natürlich (Run Fortschritt). Nicht verstärken, etwa durch Strafen fürs Aufhören. Der Auto Save ist das gesunde Gegenstück. |
| **Collection Drive und Progress Anzeige** | Sammeln, Vervollständigen und sichtbarer Fortschritt motivieren, wirken aber kontextabhängig. Der Übersichtsartikel zur Gamification findet überwiegend positive, aber stark kontextabhängige Effekte. | [Forschung] Hamari, Koivisto, Sarsa 2014 (24 empirische Studien, Bildung als häufigster Kontext) | Die Sammlung existiert (`???` Platzhalter), fehlt aber als Ziel mit Belohnung. |
| **Mastery** | Dauerhafte Motivation entsteht, wenn Können sichtbar wächst. Meta Progression darf Können nicht ersetzen. | [Praxis] GMTK "Roguelikes, Persistency, and Progression", Foren und Analysen: Meta Progression kann Selbsteinschätzung verwischen | Bevorzugt **Inhalts Freischaltungen und Schwierigkeit** statt Stat Boni. Kein permanenter Power Creep. |

### 2.2 Roguelike und Deckbuilder

* **Kurzer Weg zurück in den Run** ist ein häufig genannter Treiber für "noch ein Run". Je schneller nach einer Niederlage der nächste Run läuft, desto eher folgt er. [Praxis, Blog Analysen]
* **Unlocks strecken die Tiefe.** Freischaltbare Inhalte motivieren zu neuen Runs und dosieren zugleich die strategische Komplexität für Einsteiger. [Praxis]
* **Build Fantasy und Synergie Entdeckung:** Der Reiz liegt im Moment, in dem ein Build "kippt" und absurd stark wird, während man gerade noch überlebt (Analysen zu Survivor Spielen nennen Power Fantasy plus Kompetenz und Autonomie). [Praxis]
* **Niedrige Reibung:** Wer Erfolg erlebt, bevor die Strategie verstanden ist, bleibt. [Praxis, Analyse zu einem bekannten Survivor Spiel]
* **Schwierigkeitsstufen:** Ein progressiver Härtegrad (bei Deckbuildern oft "Ascension" oder "Stakes" genannt) gibt Meistern Ziele. Kritik: Stufen, die nur Zahlen ändern, wirken dünn, abwechslungsreiche Modifikatoren halten Runs frisch. Alatros 6 Stakes ändern teils nur Zahlen (Scaling, Discards). [Praxis]
* **Daily Seed:** Ein geteilter Seed pro Tag schafft Vergleichbarkeit ("gleiche Karten, gleiche Bosse") und Gesprächsstoff. Fairness Kritik: Bestenlisten messen teils Seed Glück. Belastbare Retention Zahlen fand die Recherche nicht, es sind Entwicklerberichte und Kommentare. [Praxis, Hypothese]
* **Tod als Fortschritt:** Narrative Meta Schichten (Hub, Dialog, Erinnerung) lassen Scheitern wie Fortschritt wirken. Aussage stammt von Kritikern und Essays, nicht von einem Designdokument des Studios. [Praxis]
* **Zahlenkonstellation Alatro:** Ein Run besteht aus 8 Antes mit je 3 Blinds, also 24 Runden. Das ist lang (siehe 3.4).

### 2.3 Juice und Game Feel

* Das Standardreferat "Juice it or Lose it" (Jonasson, Purho, GDC Europe 2012) zeigt an einem Breakout Klon, wie Flash, Shake, Partikel und Sound jede Aktion "lebendig" machen. [Praxis]
* Gegenposition: "Don't Juice It or Lose It" (GDC Europe 2014, Sprecher in den Suchtreffern nicht genannt): zu viel Polish kostet Immersion. [Praxis] Für Alatro heißt das: Wirkung **staffeln** (kleine Hände bleiben leise, große bekommen Aufwand). Alatro macht das bereits (`SCORE_TIERS`).
* **Steigende Tonhöhe** beim Zählen und Skalen ist verbreitete Praxis. Technische Warnung: `playbackRate` ändert bei Samples auch die Dauer, und Web Audio in installierten iOS Web Apps hatte zuletzt gemeldete Probleme (WebKit Bugs, Workarounds). Alatro synthetisiert Töne (kein Sample), das umgeht das Dauerproblem. [Praxis]
* **Haptik:** Die Vibration API (`navigator.vibrate`) wird laut Browser Kompatibilitätsquellen von iOS Safari nicht unterstützt (eine Fehlermeldung widerspricht, unbestätigt). Hacks existieren, gelten als fragil. Zudem hat nach meinem Wissen kein iPad eine Taptic Engine. [Praxis, Eigene Einschätzung]: nicht verfolgen.

### 2.4 Onboarding, Sessions, Frust und fairer Zufall

* **Onboarding:** Wert muss in den ersten 5 bis 15 Minuten klar werden, Onboarding sollte Freude vorführen statt nur zu erklären. Retention Benchmarks aus Mobile Berichten (Median D1 etwa 22 bis 27 Prozent je nach Jahr und Bericht) sind für ein Privatprojekt kaum relevant, nur als Hinweis, dass der erste Eindruck zählt. Die oft zitierte "bis zu 50 Prozent" Verbesserung ist nicht belegt. [Praxis, Sekundärquellen]
* **Session Struktur (iPad):** Sitzungen sind kurz und werden unterbrochen. Auto Save nach jedem Schritt und Fortsetzen sind Pflicht, Alatro erfüllt das. [Eigene Einschätzung]
* **Fairer Zufall:** Menschen unterschätzen Strähnen und deuten sie als Nicht Zufall, erwarten zu gleichmäßige Verteilung. Gegenmittel: Pseudo Random Distribution (steigende Chance nach Misserfolg), Bag Systeme, offene "Bad Luck Protection". [Forschung zur Fehlwahrnehmung, Praxis zu Design Lösungen, überwiegend Blogs]
* **Failure Feedback:** Scheitern sollte Lernen sichtbar machen (was hat gefehlt, was war mein bester Moment) und den Neustart erleichtern. [Praxis]

### 2.5 Ethische Grenze

* **Gesunde Motivatoren (empfohlen):** Mastery (Schwierigkeitsstufen, Bestwerte), Entdeckung (Synergien, Sammlung), Sammeln, narrative Belohnung, persönliche Ziele, Wahlfreiheit.
* **Bewusst nicht empfohlen (Dark Patterns):** Login Streaks mit Verlustandrohung, FOMO durch verfallende Inhalte, künstliche Wartezeiten, "Pay to skip", manipulierte Beinahe Gewinne, Sunk Cost Fallen, soziale Verpflichtung. Die Taxonomie temporaler, monetärer und sozialer Dark Patterns stammt von Zagal, Björk, Lewis (2013), sie wird von Deterding et al. (2020) als zu pauschal kritisiert, weil "dunkel" vom Kontext abhängt. [Forschung] Für Alatro ohne Monetarisierung entfallen diese Muster ohnehin, ein Daily darf **nie** Zwang erzeugen (kein Streak Zähler, keine verfallenden Belohnungen).

---

## 3. IST Stand von Alatro (aus dem Code ermittelt)

### 3.1 Inhalt in Zahlen

| Bereich | Anzahl | Fundort |
|---|---|---|
| Jokers | 79 (45 Common, 23 Uncommon, 8 Rare, 3 Legendary) | `src/data/jokers.ts` |
| Consumables | 42 (12 Sternbilder, 21 Elixiere, 9 Omen) | `src/data/consumables.ts` |
| Vouchers | 26 (Basis und Upgrade Paare) | `src/data/vouchers.ts` |
| Decks | 7 | `src/data/decks.ts` |
| Stakes | 6 (kumulativ) | `src/data/stakes.ts` |
| Boss Blinds | 14 (12 normal, 2 Showdown) | `src/data/bosses.ts` |
| Tags | 13 | `src/data/tags.ts` |
| Booster Packs | 15 (5 Arten mal 3 Größen) | `src/data/packs.ts` |
| Karten Modifikatoren | 15 (8 Enhancements, 3 Seals, 4 Editions) | `src/data/modifiers.ts` |
| Pokerhände | 12 (3 geheim: Five of a Kind, Flush House, Flush Five) | `src/data/hands.ts` |
| Sammlung Einträge insgesamt | 196 | `src/collection.ts` |
| Tutorial Seiten | 8 | `src/data/tutorial.ts` |

### 3.2 Was es an Bindung bereits gibt

* **Run Struktur:** 8 Antes (`FINAL_ANTE`), danach Endless mit Formel (`src/data/blinds.ts`, `ENDLESS`). Showdown Boss alle 8 Antes.
* **Seeds:** Seed Eingabe mit eigener Bildschirmtastatur im Run Setup, Strom pro Key (`src/core/rng.ts`). Seed wird im Game Over und Sieg Fenster angezeigt. Technisch ist ein Daily Seed damit fast fertig.
* **Speichern und Fortsetzen:** Run wird nach jedem Schritt gespeichert (`saveRun` in `src/save.ts`), Home Bildschirm zeigt "Fortsetzen" mit Ante, Geld, Deck, Stake (`src/ui/HomeView.ts`).
* **Sammlung:** `src/collection.ts`, Speicher `alatro.collection.v1`, Anzeige "x von y entdeckt" pro Reiter und `???` für Unentdecktes (`src/ui/CollectionView.ts`). Gefunden wird, was im Run sichtbar wurde (Shop, Packs, Deck, Slots).
* **Geheime Hände und Sternbilder:** Die drei geheimen Hände und deren Sternbilder erscheinen erst nach dem ersten Spielen (Entdeckungsmoment, `src/core/generate.ts`).
* **Schwierigkeit:** 6 Stakes und 7 Decks frei wählbar im Run Setup (Auswahl wird gemerkt, `alatro.setup`). Kein Gating.
* **Juice (stark):** Score Animation Schritt für Schritt (Karten springen, Popups je Beitrag), Tonleiter mit steigender Tonhöhe (`SCALE_STEPS`, `SCALE_MAX_STEPS = 14`), **Beschleunigtes Pacing** (`wait(max(90, 280 minus step mal 14))`), Aufschlag nach Handpunkten durch Ziel in 5 Stufen (`SCORE_TIERS`, Shake bis 16 Pixel, Flash bis 0,32), X Mult Shake, Edition Shader, Hintergrund Stimmung pro Blind und Boss, Tempo Knopf bis 10x, Grafikstufe, Optionen.
* **Sound:** Komplett synthetisiert (`src/ui/audio.ts`): Klick, Auswahl, Chips, Mult, X Mult Akkord, Retrigger, Geld, Gewinn, Verlust, Sieg, Blind Start, Kauf, Pack, Consumables. **Keine Musik, kein Ambient.**
* **Entscheidungsvorschau:** Pokerhand, Chips und Mult erscheinen schon beim Antippen der Karten. Shop zeigt in der Seitenleiste den nächsten Blind und die Boss Regel (`docs/PLAYTEST.md` P7).
* **Fairness Elemente:** Garantiertes Joker Pack im ersten Shop (`FIRST_SHOP_PACK`), Rettungs Joker (Schutzengel), Skip mit Tag Belohnung, Zufall nur über `RngStreams`.
* **Onboarding:** 8 Seiten Anleitung nur über Menü, ein Einführungshinweis in der Tischmitte der ersten Runde (`hintSeen`, `alatro.hints.v1`), Patch Notes beim Start.

### 3.3 Was fehlt (belegt durch Suche im Code)

* **Keine Statistiken, keine Run Historie, keine Bestwerte.** Eine Suche nach `best`, `record`, `highscore`, `wins`, `runsPlayed` in `src/` findet nichts außer der Sammlung. Es gibt nur `RunState.handsPlayed` (pro Run, wird bei Run Ende verworfen).
* **Keine Meta Progression und keine Unlocks.** Alle Decks, Stakes, Jokers sind sofort verfügbar. `showRunSetup` iteriert über `DECKS` und `STAKES` ohne Bedingung.
* **Keine Achievements.**
* **Kein Daily Run, keine Challenge Runs** (Seeds sind nur manuell eingebbar).
* **Keine Haptik** (keine Treffer für `vibrate`, `haptic`). Auf dem iPad technisch ohnehin kaum möglich (2.3).
* **Game Over** (`showGameOver` in `src/ui/Game.ts`): Ante, Round, Punkte gegen Ziel als Zahl, Meistgespielte Hand, Joker Liste, Seed. Keine Beinahe Prozent, keine beste Hand, keine neuen Entdeckungen, kein Vergleich mit früheren Runs. Der Knopf "Neuer Run" öffnet erst das Run Setup (zwei Antippen mehr bis zur ersten Hand).
* **Sieg:** `showRunWon` zeigt "Gewonnen!", Ante, Seed, Endless oder Neuer Run. Kein Stake Fortschritt, keine Belohnung.
* **Kein Overkill oder Ziel erreicht Moment** während des Hochzählens (nur die Gesamtanzeige und Tier Effekte).
* **Keine Partikel** (Suche nach `particle`, `spark`, `confetti`: keine Treffer in `src/ui`). Juice besteht aus Shake, Flash, Skalierung, Popups, Shader.
* **Keine Musik.**
* **Kein Mechanismus, den Score Ablauf per Tipp zu überspringen** (Tempo bis 10x existiert, ein Tipp zum Beschleunigen wurde nicht gefunden).

### 3.4 Run Länge und Schwierigkeit

* 24 Runden pro Sieg Run. Eine Hand mit Animation dauert bei 1x je nach Joker Zahl einige Sekunden, ein Run also nach **meiner Schätzung grob 45 bis 90 Minuten** (nicht gemessen). Bot Tests (`docs/PLAYTEST.md`) enden im Mittel bei Ante 3 bis 4 (Standard Deck), Spitze Ante 5 bis 7, Ewige Nacht unter Ante 2. Bots spielen deutlich schwächer als Menschen.
* Folge: Frühe Niederlagen enden nach grob 15 bis 30 Minuten, Siege sind selten und lang. Für iPad Sitzungen (kurze Zeitfenster) ist das eher zu lang, der Auto Save federt das ab.

---

## 4. Vergleichsmatrix

Bewertung: **stark / mittel / schwach / fehlt**. "Best Practice" beschreibt das Genre Niveau, nicht ein bestimmtes Spiel.

| Hook Aspekt | Alatro | Beleg im Code | Best Practice im Genre |
|---|---|---|---|
| Core Loop Dichte | **stark** | Blind, Runde, Shop in kurzen Schritten, Vorschau beim Antippen (`Game.ts`, `docs/PLAYTEST.md`) | Entscheidung alle paar Sekunden, Belohnung am Rundenende |
| Variable Belohnung | **stark** | Shop Rerolls, Packs (15 Arten), Editions Würfe, Boss Auswahl, Tags (`src/data/shop.ts`, `packs.ts`, `generate.ts`) | Zufall mit Wahlfreiheit des Spielers |
| Juice im Scoring | **stark** | `SCORE_TIERS`, X Mult Shake, Popups, beschleunigtes Pacing (`juice.ts`, `Game.ts` `play`) | Gestaffelte Eskalation, Partikel, Overkill Anzeige |
| Sound Eskalation | **stark** (Töne), **fehlt** (Musik) | `scaleFreq`, `chips/mult/xmult(step)` in `audio.ts` | Steigende Tonhöhe plus Musik, die auf Zustand reagiert |
| Haptik | **fehlt** (iPad Web: kaum möglich) | keine Treffer | Handy: Vibration bei großen Treffern. Web auf iOS nicht verfügbar |
| Build Vielfalt | **stark** | 79 Jokers, 26 Vouchers, 7 Decks, 15 Modifikatoren | Mehrere klar unterscheidbare Archetypen |
| Synergie Entdeckung | **mittel bis stark** | Joker Rarity, Rules, Retrigger, Copy; Lesbarkeit durch Wirkungs Marken (`jokerInfo.ts`) | Lehrreiche Kombos, Hinweise auf mögliche Partner |
| Sammeln und Codex | **mittel** | `CollectionView.ts` mit "???" und Zähler pro Reiter | Gesamtfortschritt, Neu Marker, Belohnung für Vervollständigung, Hinweise zum Freischalten |
| Meta Progression | **fehlt** | keine Persistenz außer Collection, Settings, Hints | Inhalts Unlocks, Hub, Bestwerte |
| Unlocks | **fehlt** | `showRunSetup` ohne Bedingungen | Sichtbare Freischaltziele mit Fortschritt |
| Schwierigkeitskurve (Stakes) | **mittel** | 6 Stakes, kumulativ, teils nur Zahlen (`stakes.ts`) | Stufenweise freigeschaltet, abwechslungsreiche Modifikatoren |
| Run Länge | **schwach bis mittel** | 8 Antes, 24 Runden, Endless (`blinds.ts`) | Run von 30 bis 60 Minuten, oft zusätzlich Kurzmodus |
| Onboarding | **mittel** | 8 Seiten Anleitung, ein Hinweis in Runde 1, Patch Notes (`tutorial.ts`, `settings.ts`) | Geführter erster Run, Hinweise im Moment des Bedarfs |
| Failure Feedback | **schwach** | `showGameOver`: Zahlen, Meistgespielt, Joker Liste | Warum verloren, wie knapp, nächstes Ziel, schneller Neustart |
| Replayability (Seeds und Daily) | **mittel** (Seed), **fehlt** (Daily) | Seed Eingabe (`Game.ts`), keine Datum Logik | Täglicher Seed, Challenge Runs |
| Statistiken | **fehlt** | keine Treffer | Lifetime Statistik, Bestwerte pro Deck und Stake |
| Run Historie | **fehlt** | `saveRun(null)` löscht beim Game Over | Liste der letzten Runs mit Seed, Ante, Build |
| Achievements | **fehlt** | keine Treffer | 20 bis 50 Ziele, die zu neuen Spielweisen anregen |
| Session Eignung iPad | **mittel bis stark** | Auto Save nach jedem Schritt, Fortsetzen, Insets, Audio Resume (`save.ts`, `viewport.ts`, `audio.ts`) | Kurze Einheiten, sauberer Wiedereinstieg |
| Spielzeit pro Run | **schwach bis mittel** | siehe 3.4 | Optionaler Kurzlauf |
| Ästhetik und Thema | **stark** | Nachtpalette, Stimmung pro Blind, eigene Pixel Schrift, Joker Grafiken | Wiedererkennbarer Stil |

**Ehrliche Stärken:** (1) Der Moment Loop ist sauber gebaut und gut lesbar (Vorschau, farbige Beschreibungen, Wirkungs Marken). (2) Die Eskalation im Scoring ist gestaffelt und technisch durchdacht (Tonleiter, Tiers, beschleunigtes Pacing, Tempo Knopf). (3) Der Inhalt ist breit und eigenständig im Thema, mit sinnvollen Systemen (Sternbilder, Elixiere, Omen). (4) Technische Grundlagen für Meta und Daily sind bereits da (Seed Ströme, versionierter Spielstand, Collection Speicher, Hint Speicher, getrennte Engine). Die Lücke liegt in der Schicht **zwischen** den Runs, nicht im Spiel selbst.

---

## 5. Verbesserungsvorschläge

Alle Namen sind eigene Entwürfe im Thema "Sternwarte der Alchemisten". Spielbegriffe bleiben Englisch. Zahlen gehören bei Umsetzung nach `src/data/`.

Aufwand: **S** unter einem Tag, **M** ein bis drei Tage, **L** mehr. Das sind grobe Schätzungen.

### Übersicht

| Nr | Vorschlag | Impact | Aufwand | Stufe |
|---|---|---|---|---|
| V1 | Sternenlogbuch (Statistik, Historie, Bestwerte) | hoch | S bis M | P1 |
| V2 | Observationsbericht und "Sofort nochmal" | hoch | S bis M | P1 |
| V3 | Stake Fortschritt pro Deck ("Siegel am Deck") | hoch | S bis M | P1 |
| V4 | Sammlung 2.0 (Gesamtfortschritt, Neu Marker, Hinweise) | mittel bis hoch | S | P1 |
| V5 | Ausbau der Sternwarte (Freischaltpfad) | hoch | M | P2 |
| V6 | Observationen (Achievements im Thema) | mittel bis hoch | M | P2 |
| V7 | Tagessternbild (Daily Seed) | mittel bis hoch | M | P2 |
| V8 | Juice Pass 2 (Ziel erreicht, Overkill, Partikel, Tipp zum Überspringen) | mittel | S bis M | P2 |
| V9 | Geführter erster Run und Hinweise im Moment des Bedarfs | mittel | S bis M | P2 |
| V10 | Prüfungen der Alchemisten (Challenge Runs) | mittel | M | P3 |
| V11 | Kurzlauf "Sternschnuppe" (4 Antes) | mittel | M | P3 |
| V12 | Ambient Klang und Musik | niedrig bis mittel | M | P3 |
| V13 | Lore Schicht (Tod als Fortschritt) | niedrig bis mittel | M | P3 |
| V14 | Fairness Schutz im Shop prüfen | niedrig bis mittel | S | P3 |

### V1 Sternenlogbuch (P1)

* **Idee:** Ein Statistik Modul, das jeden beendeten Run festhält: Datum, Seed, Deck, Stake, erreichte Ante, Sieg oder Niederlage, beste Hand (Punkte und Typ), Jokers am Ende, Dauer. Dazu Lifetime Zahlen (Runs, Siege, gespielte Hände, höchste Einzelhand). Ansicht "Logbuch" auf dem Home Bildschirm (Liste der letzten 20 Runs und Bestwerte pro Deck und Stake).
* **Warum es hookt:** Mastery und Kompetenzerleben brauchen sichtbaren Fortschritt (SDT). Eine eigene Bestmarke ist ein Ziel ohne jeden Fremdzwang. [Forschung, Eigene Einschätzung]
* **Umsetzung:**
  * Neues Modul `src/meta.ts` nach dem Muster von `src/collection.ts` (reine Funktionen plus load und save), eigener Schlüssel `alatro.meta.v1` **mit eigenem `version` Feld**. Das betrifft den Run Spielstand nicht, `SAVE_VERSION` bleibt.
  * Run Ende erkennen: in `showGameOver` und beim Sieg (`showRunWon`) `recordFinishedRun(run)` aufrufen (neben `saveRun(null)`).
  * Für "beste Hand" und "Dauer" fehlen Felder im `RunState`. **Dafür SAVE_VERSION 5 plus Migration in `src/save.ts`** (`stats: { bestHand, bestHandType, startedAt }`, Migration setzt Standardwerte). Wer keine Versionsänderung will, startet in V1 ohne diese zwei Felder und ergänzt sie in V2.
  * Neue Ansicht `src/ui/LogbookView.ts`, Knopf in `HomeView.ts`.
  * Tests: `src/meta.test.ts` (Merge, Bestwerte, kaputte Daten), Zufallslauf Test erweitern.
* **Risiko:** Speicher in `localStorage` kann leer sein (private Fenster, iOS räumt ungenutzte Web App Daten ggf. auf). Das gilt bereits für Collection und Run, daher ist ein **Export und Import** (JSON in Zwischenablage) zu erwägen.

### V2 Observationsbericht und "Sofort nochmal" (P1)

* **Idee:** Das Game Over Fenster wird zum Bericht ("Beobachtungsprotokoll"): erreichte Ante, **Beinahe Anzeige** ("Dir fehlten 1 240 Punkte, 8 Prozent"), beste Hand des Runs, wichtigster Joker (meiste Beiträge), neu entdeckte Sammlungseinträge, Fortschritt zur nächsten Freischaltung, Vergleich mit dem Bestwert. Zwei große Knöpfe: **"Sofort nochmal"** (gleiche Einstellungen, neuer Seed) und **"Gleicher Seed"** (andere Entscheidungen probieren). Das Run Setup bleibt für Änderungen erreichbar.
* **Warum es hookt:** Failure Feedback mit Lerninhalt statt nur Strafe, kurzer Weg zum nächsten Run (Praxis). Beinahe Information ist ehrlich, solange sie nur das Ergebnis des tatsächlichen Spiels zeigt, keine künstlich manipulierte Beinahe Situation. [Praxis, Forschung zu Near Miss mit Vorsicht, siehe 2.1]
* **Umsetzung:**
  * `showGameOver` und `showRunWon` in `src/ui/Game.ts` neu aufbauen (Fenster höher, ggf. eigene Datei `src/ui/RunReportView.ts`, weil `Game.ts` bereits über 1700 Zeilen hat).
  * Beinahe Prozent: `run.round.score / run.round.target` (bereits vorhanden). Rein berechnete Funktion in `src/core/runInfo.ts` oder `juiceMath.ts` (testbar).
  * "Sofort nochmal": `beginNewRun(deckId, stakeId)` direkt mit dem zuletzt gespielten Deck und Stake aufrufen, ohne Run Setup (`startNewRun` ruft heute `showRunSetup`).
  * Neu entdeckte Einträge: Diff von `loadDiscovered()` vor und nach dem Run (Schlüssel beim Run Start merken).
  * Beste Hand und wichtigster Joker brauchen Run Statistik Felder (SAVE_VERSION 5, siehe V1).
* **Risiko:** Zu viel Text im Fenster. Auf drei Kerninformationen beschränken (Beinahe, beste Hand, Neues). Ein Beinahe Hinweis bei klaren Niederlagen kann entmutigen, deshalb statt "weit weg" lieber neutral formulieren oder bei unter 30 Prozent weglassen.

### V3 Stake Fortschritt pro Deck, "Siegel am Deck" (P1)

* **Idee:** Jedes Deck hat pro Stake einen Status: nie gewonnen, gewonnen. Der nächste Stake wird für das Deck erst nach einem Sieg auf dem vorherigen freigeschaltet. Im Run Setup zeigt jedes Deck sein höchstes Siegel (kleines Sternbild Symbol mit Stake Farbe) und die Stufe, die als Nächstes ansteht. Optionale Spielart: Ein Sieg mit **jedem** Deck schaltet den nächsten Stake global frei (weniger Gating).
* **Warum es hookt:** Klare Mastery Leiter, Goal Gradient ("noch eine Stufe bis zur Finsternis"), jedes Deck bekommt ein eigenes Ziel (Collection Drive). Praxis in Genre: progressive Schwierigkeitsstufen geben Meistern Ziele. [Praxis]
* **Umsetzung:**
  * Daten: `winsByDeckStake` im Meta Speicher (V1). Keine Änderung im Run Spielstand.
  * `showRunSetup` (`Game.ts`) und die Auswahlpfeile: gesperrte Stakes grau mit Hinweistext "Gewinne mit diesem Deck auf Abend". Regeln in `src/data/progression.ts` (Zahlen und Schwellen nach `src/data/`).
  * Sieg auslösen: `showRunWon` (bei erstmaligem Erreichen des Sieg Zustands, `winShown`).
  * Einstellung "Alles offen" in `settings.ts` (damit Test und Experimente nicht blockiert werden).
* **Risiko:** Gating zwingt den Eigentümer, schwächere Stufen zu spielen. Daher der Schalter und eine klare Entscheidung (siehe Offene Fragen).

### V4 Sammlung 2.0 (P1)

* **Idee:** Home zeigt "Sternenatlas: 74 von 196". In der Sammlung: Gesamtfortschritt oben, "Neu" Marker an erstmals entdeckten Einträgen, **Hinweistext statt nackter ???** ("Taucht ab Ante 4 auf", "Erscheint nach einem Sieg mit dem Glutdeck"), ein Toast im Run bei Erstentdeckung ("Neu im Atlas: Hofecho"). Meilenstein Belohnungen (z. B. alle Sternbilder entdeckt schaltet einen Hintergrund oder Titel frei).
* **Warum es hookt:** Collection Drive und Progress Anzeige (Goal Gradient). Platzhalter mit Hinweis wecken Neugier, ohne zu spoilern. [Forschung zu Goal Gradient, Praxis]
* **Umsetzung:**
  * `src/collection.ts`: Funktion `collectionProgress()` (reine Zählung über `collectionEntries` aller Reiter) und `newlyDiscovered(before, after)`.
  * Hinweistexte pro Eintrag als Feld in den Daten (z. B. `hint?: string` in `JokerDef`, `BossDef`, ... oder zentrale Tabelle `src/data/collectionHints.ts`, um die Registry nicht aufzublasen).
  * `CollectionView.ts` zeigt Hinweis in der ???-Karte. Toast in `Game.ts` nach `saveRun` (Diff mit Speicher).
  * Neu Marker braucht ein zweites Feld "gesehen" (`alatro.collection.v1` bekommt ein neues Objekt `{keys, seen}` oder neuen Schlüssel `alatro.collection.seen.v1`, Migration im Lader, kein SAVE_VERSION Thema).
* **Risiko:** Gering. Daran denken, dass neue Joker dieselbe ID Politik haben müssen (IDs nie ändern, `HANDOFF.md`).

### V5 Ausbau der Sternwarte, der Freischaltpfad (P2)

* **Idee:** Die Sternwarte ist das Meta Hub. Sie wächst in Ausbaustufen. Jede Stufe hat eine **sichtbare Bedingung** und schaltet ein Paket frei. Das Home Bild zeigt die Sternwarte mit leuchtenden und noch dunklen Gebäuden (Kuppel, Laborflügel, Bibliothek, Dachterrasse, Archiv). So bleibt Alatros Thema der Kern der Meta Schicht.
* **Beispiel Pfad (Entwurf, Zahlen zu balancieren):**

| Stufe | Name | Bedingung | Schaltet frei |
|---|---|---|---|
| 1 | Die Kuppel | gleich zu Beginn offen | Nachthimmel, Glutdeck, Tiefseedeck, Stakes Dämmerung und Abend, Grundkatalog Jokers |
| 2 | Der Laborflügel | Ante 4 erreicht | Alchemistendeck, 10 weitere Jokers (Uncommon), Omen Packs |
| 3 | Die Bibliothek | 5 Hände Level 5 oder höher in einem Run | Sternenkind, Mitternacht Stake, Rare Jokers |
| 4 | Die Dachterrasse | ersten Sieg erringen | Goldene Waage, Halbmond, Showdown Boss Varianten |
| 5 | Das Archiv | 100 Einträge im Sternenatlas | Prüfungen (V10), Legendary Jokers im Pool |

* **Warum es hookt:** Unlocks strecken Tiefe und dosieren Komplexität, Fortschrittsanzeige nutzt Goal Gradient, ein Hub gibt Meta einen Ort (Hades Beispiel: Hub und Erzählung machen Scheitern zum Fortschritt, laut Kritik Essays). Wichtig: **kein permanenter Stat Bonus**, nur Inhalt. [Praxis, Eigene Einschätzung]
* **Umsetzung:**
  * Daten: `src/data/progression.ts` (Stufen, Bedingungen als deklarative Objekte, z. B. `{ kind: 'reachAnte', value: 4 }`) und Freigabe Listen (Joker IDs, Deck IDs, Stake IDs).
  * Auswertung: reine Funktionen in `src/meta.ts` (`unlockedIds(meta)`), Bedingungsprüfung bei Run Ende und bei bestimmten Ereignissen (Hand Level).
  * Engine: `rollJoker` (`src/core/generate.ts`) bekommt einen **Pool Filter** (`run.rules.jokerPool` oder Parameter in `createRun`). **Wichtig:** Der Pool darf nicht vom Meta Zustand abhängen, ohne dass er im Run gespeichert wird, sonst brechen Seeds und Save Load Gleichheit. Lösung: Beim Run Start wird die freigeschaltete Pool Liste als Feld in den `RunState` geschrieben (**SAVE_VERSION 5, Migration setzt "alles offen"**). Der Fuzz Test (`fuzz.test.ts`) prüft das Laden pro Schritt und fängt Fehler.
  * Seeds: Ein Seed ergibt mit anderem Pool einen anderen Run. Das gehört in `AUDIT.md` Offene Punkte (wie O42).
  * UI: `HomeView.ts` zeigt die Sternwarte als Grafik aus Primitiven (Pixi `Graphics`), Run Setup zeigt gesperrte Decks mit Bedingung.
* **Risiko:** Der Eigentümer hat Inhalte gebaut, die dann zunächst verborgen sind. Mit Schalter "Alles offen" (nur ein Test und Experimentiermodus, der keine Statistik zählt) entschärfbar. Gating zu streng macht den Anfang zäh, zu locker macht es wirkungslos. Frühe Stufen eher großzügig.

### V6 Observationen, Achievements im Thema (P2)

* **Idee:** Etwa 30 Ziele, die zu **neuen Spielweisen** anregen statt zum Grinden. Im Thema "Beobachtungen im Logbuch der Sternwarte". Sichtbar im Logbuch (V1) mit Fortschritt ("3 von 5"), geheime Einträge als "???" bis zur Erfüllung.
* **Beispiele (Entwurf):**

| Name | Bedingung |
|---|---|
| Erste Dämmerung | einen Boss Blind besiegen |
| Zwillingsgestirn | in einem Run 10 Pairs mit je einem Rubin spielen |
| Leere Taschen | einen Blind mit $0 Geld abschließen |
| Spätzünder | eine Hand mit über 100 000 Punkten spielen |
| Hexenwerk | Hexenkessel benutzen und den Run trotzdem bis Ante 5 bringen |
| Kein Entkommen | zweimal in einem Run ein Boss Blind per Tag deaktivieren |
| Sparfuchs | mit mindestens $25 in Ante 3 einsteigen |
| Siegel Sammler | alle drei Seals in einem Run besitzen |
| Nebelwandler | mit dem Halbmond Deck einen Blind gewinnen |
| Himmelsbuch | alle Sternbilder entdecken |

* **Warum es hookt:** Achievements geben Nebenziele, die zu Experimenten anregen (Autonomie und Kompetenz). Die Gamification Forschung zeigt überwiegend positive, aber kontextabhängige Effekte. Bedingungen, die nur Zeit kosten, vermeiden. [Forschung, Eigene Einschätzung]
* **Umsetzung:**
  * Daten: `src/data/observations.ts` (ID, Name, Beschreibung, Bedingung als deklarativer Typ, geheim ja oder nein).
  * Auswertung: reine Funktion `evaluateObservations(runSummary, meta)` in `src/meta.ts`, **Ereignisse** (Hand gespielt, Blind geschafft, Run Ende) aus `core/game.ts` als kleine Rückgabewerte oder Callback `onEvent` (Engine bleibt ohne DOM).
  * Toast beim Freischalten (`Game.toast`).
  * Speicher im Meta Objekt (V1), kein SAVE_VERSION Thema.
  * Tests: pro Bedingung ein Unit Test.
* **Risiko:** Zufallslauf Test darf nicht von Ereignissen abhängen. Bedingungen, die Run Zustand brauchen (z. B. "alle drei Seals"), müssen aus `RunState` ableitbar sein.

### V7 Tagessternbild, Daily Seed (P2)

* **Idee:** Ein Run pro Kalendertag mit festem Seed (Hash aus Datum), festem Deck, festem Stake und **einem Himmelsereignis** (Modifikator). Lokale Bestwerte, keine Online Bestenliste (privat, kein Server). Vergleich mit sich selbst ("Heute Ante 5, Bestwert Ante 7"). **Kein Streak Zähler, keine verfallende Belohnung**, verpasste Tage kosten nichts.
* **Himmelsereignisse (Entwurf als RunMods Kombinationen):**
  * *Sonnenfinsternis*: Blind Ziele X0,8, aber 1 Hand weniger.
  * *Meteorschauer*: erster Reroll jedes Shops gratis, Hand Size 1 kleiner.
  * *Konjunktion*: Jokers der Rarity Common kosten die Hälfte, Boss Blinds haben Ziel X1,3.
  * *Neumond*: keine Editions im Shop, Karten Packs kosten $2 weniger.
  * *Sternenregen*: Sternbilder erscheinen dreimal so oft, Consumable Slots minus 1.
* **Warum es hookt:** Variable, aber fair vergleichbare Ausgangslage, Neugier auf den Modifikator, geteilte Vergleichbarkeit mit dem eigenen Ich. Daily Modi gelten in der Praxis als Rückkehr Anreiz, belastbare Zahlen fehlen (Hypothese). Streaks bewusst weggelassen (2.5). [Praxis, Hypothese]
* **Umsetzung:**
  * Seed: `dailySeed(date)` als reine Funktion in `src/core/rng.ts` oder `src/daily.ts` (UI Schicht liefert das Datum, die Engine bleibt zeitfrei). Lokale Zeit nehmen, Tageswechsel um Mitternacht lokal.
  * Daten: `src/data/daily.ts` mit Liste der Ereignisse und der Auswahlregel (z. B. `index = hash(datum) % n`). Modifikator als `RunMods` aus `src/data/modsSpec.ts` (bestehendes System, kaum neue Engine Logik).
  * Run Zustand: Feld `challengeId` im `RunState` (**SAVE_VERSION 5**, siehe V5, gleiche Migration).
  * UI: Eintrag auf dem Home Bildschirm, im Logbuch ein Abschnitt "Tagessternbilder".
* **Risiko:** Gerätedatum kann manipuliert werden (egal, es ist privat). Zeitzone, Datumswechsel mitten im Run: Der Run behält seinen Seed (steht im Run Zustand). Zu viele Daily Modifikatoren ergeben Balance Aufwand.

### V8 Juice Pass 2 (P2)

* **Idee (kleine Bausteine, einzeln wählbar):**
  1. **Ziel erreicht Moment:** Beim Hochzählen des Round Score blitzt der Balken oder die Zahl, sobald das Blind Ziel überschritten wird (Ton, kleiner Flash). Heute gibt es nur die Gesamtstufe nach der Hand.
  2. **Overkill Anzeige:** Beim Blind geschafft Fenster eine Zeile "Überschuss: 4 200 Punkte (180 Prozent)". Bei hohem Überschuss kleine Fanfare.
  3. **Partikel:** Ein kleiner Funkenschwarm (Pixi `Graphics` oder Sprite Pool) bei X Mult und Tier 4 und 5, Sterne in Blind Farbe bei Blind geschafft. Begrenzte Anzahl (30 bis 60) wegen iPad Leistung, mit `QUALITY_PROFILE` abschaltbar.
  4. **Tipp zum Beschleunigen:** Tippen während der Score Animation setzt das Tempo kurzzeitig auf Faktor 3 (wirkt über `tween` und `wait`, die den Tempo Faktor bereits kennen).
  5. **Gestaffelte Gesamttöne:** Beim Aufschlag Tonhöhe oder Akkord aus Verhältnis Punkte zu Ziel (`sfx.total(boom)` kennt `boom`, ein Akkord ab 0,6 existiert).
  6. **Blind Sieg Fanfare nach Blind Art** (Small, Big, Boss unterschiedlich).
* **Warum es hookt:** Gestaffelte Eskalation, unmittelbares Feedback (Flow, Juice Praxis). Die Gegenposition (zu viel Juice kostet Immersion) spricht für Staffelung und für den Tempo Knopf, den Alatro schon hat. [Praxis]
* **Umsetzung:** `src/ui/stageFx.ts`, `src/ui/audio.ts`, `src/data/juice.ts` (neue Zahlen dort), `Game.ts` `play` und `showRoundWon`. Keine Änderung am Spielstand.
* **Risiko:** Bildrate auf dem iPad (noch nicht gemessen, `HANDOFF.md`). Deshalb zuerst die iPad Messung, dann Partikel dosieren. Der Test beschränkt sich auf reine Funktionen in `juiceMath.ts`.

### V9 Geführter erster Run und Hinweise im Moment des Bedarfs (P2)

* **Idee:** Ein erster Run "Lehrling der Sternwarte" mit festem Seed und festen Ante 1 Ergebnissen, der **Spaß zeigt statt Regeln aufzusagen**: erste Hand gelingt sicher, erster Shop bietet einen leicht verständlichen Joker, der erste Boss ist freundlich. Kontextuelle Hinweise (Shop, Joker Reihenfolge, Boss Regel, Sternbild, Skip Tag) erscheinen einmalig im Moment, in dem sie relevant werden.
* **Warum es hookt:** Wert muss in den ersten Minuten klar werden (Onboarding Praxis, Mobile Berichte). Kompetenzerleben entsteht früh. Für einen Einzelspieler (der Eigentümer kennt das Spiel schon) vor allem für **spätere Mitspieler** oder Wiedereinsteiger nach Pausen relevant. [Praxis, Eigene Einschätzung]
* **Umsetzung:** `hintSeen` und `markHintSeen` (`src/settings.ts`) bestehen bereits und sind generisch. Neue Hinweis IDs in `Game.ts` bei `showShop`, `renderShop`, `showBlindSelect`. Texte in `src/data/tutorial.ts` oder neue `src/data/hints.ts`. Der Lehrling Run: ein fester Seed plus ein `challengeId` (siehe V7), Skript für Hinweise.
* **Risiko:** Gering bis mittel. Wenn nur der Eigentümer spielt, lieber zurückstellen und nur Hinweise bauen.

### V10 Prüfungen der Alchemisten, Challenge Runs (P3)

* **Idee:** Handgebaute Regelkombinationen als eigene Ziele, freigeschaltet über V5.
  * *Bleikammer*: nur Common Jokers im Pool, Ante 8 muss erreicht werden.
  * *Eine Flamme*: nur 1 Joker Slot, Joker Preise halbiert.
  * *Der Geizige*: Zinsen maximal, Verkauf von Jokers verboten.
  * *Sternenstaub*: Start mit allen Sternbildern auf Level 3, keine Sternbilder im Shop.
* **Warum es hookt:** Autonomie und Mastery, neue Baupläne für das Wissen über Synergien. [Eigene Einschätzung]
* **Umsetzung:** Wie V7 (`challengeId`, `RunMods` plus eventuell neue Felder in `src/data/modsSpec.ts` und Engine Auswertung), eigene Datei `src/data/challenges.ts`.
* **Risiko:** Neue RunMods Felder brauchen Engine Code und Tests. Daher erst, wenn V7 steht.

### V11 Kurzlauf "Sternschnuppe" (P3)

* **Idee:** Optionaler Modus mit 4 statt 8 Antes (etwa halbe Spielzeit), Blind Skalierung entsprechend angepasst. Passt zu kurzen iPad Sitzungen.
* **Warum es hookt:** Kurze Runs senken die Einstiegshürde, mehr Run Starts pro Zeit (Praxis zu "one more run"). [Praxis]
* **Umsetzung:** `FINAL_ANTE` ist heute eine Konstante in `src/data/blinds.ts`. Sie muss aus `run.rules.finalAnte` kommen (**SAVE_VERSION 5**), Skalierungstabelle `BASE_BY_SCALING` anpassen (Ziele sollten schneller steigen). Siege im Kurzlauf zählen im Meta getrennt.
* **Risiko:** Balance (Ziele müssen mit weniger Antes dieselbe Spannung aufbauen), Doppelter Testaufwand. Erst nach Messung der echten Run Zeit (Logbuch V1 liefert die Dauer).

### V12 Ambient Klang und Musik (P3)

* **Idee:** Ein ruhiger synthetischer Drone pro Stimmung (Menu, Small, Big, Boss, Shop), der leicht mit der Score Eskalation anwächst (Boss Pulsieren passt zu `MOODS.boss.pulse`).
* **Warum es hookt:** Atmosphäre und Immersion, Sound als Zustandsanzeige. [Eigene Einschätzung]
* **Umsetzung:** `src/ui/audio.ts` (Oszillatoren, bereits Synthese Basis), Zahlen in `data/juice.ts`, Schalter in `settings.ts` (Musik an oder aus, getrennte Lautstärke).
* **Risiko:** iOS Audio in installierten Web Apps ist fehleranfällig (gemeldete WebKit Probleme, siehe 2.3). Zuerst den bestehenden Klang auf dem Gerät prüfen (offen laut `HANDOFF.md`). Dauerton kann Akku und Leistung kosten.

### V13 Lore Schicht, Tod als Fortschritt (P3)

* **Idee:** Jedes Ende eines Runs schaltet einen kurzen Eintrag im "Tagebuch der Sternwarte" frei (3 bis 4 Sätze, Alchemisten Geschichte, nur Text). Nach 12 Einträgen ein Querverweis.
* **Warum es hookt:** Scheitern fühlt sich wie Fortschritt an, wenn Erzählung weiterkommt (laut Kritik Essays zu Hub basierten Roguelikes). Schwach belegt. [Praxis, Eigene Einschätzung]
* **Umsetzung:** `src/data/lore.ts`, Anzeige im Logbuch, Zähler im Meta Speicher. Deutscher Text im Thema.
* **Risiko:** Textaufwand. Qualität entscheidet, ansonsten verzichtbar.

### V14 Fairness Schutz im Shop prüfen (P3)

* **Idee:** Messen (Bot, Simulation), wie oft Shops über mehrere Antes keinen kaufbaren Joker anbieten. Falls auffällig, eine **offene** Absicherung einbauen: nach 2 Shops ohne Joker wird im dritten einer garantiert (Bad Luck Protection, transparent in der Anleitung).
* **Warum es hookt:** Fairer Zufall, weil Spieler Strähnen als unfair wahrnehmen (Gambler's Fallacy). Pseudo Random und Bag Systeme sind verbreitete Lösungen. [Forschung zur Wahrnehmung, Praxis zu Lösungen]
* **Umsetzung:** `src/core/shop.ts` und `src/data/shop.ts` (Joker Gewicht ist 20), Zähler `shopsWithoutJoker` im `RunState` (**SAVE_VERSION 5**). Erst messen, dann entscheiden.
* **Risiko:** Verändert Seeds und Balance. In `AUDIT.md` unter Offene Punkte dokumentieren.

### Bewusst nicht empfohlen

* **Login Streaks, tägliche Pflicht Belohnungen, verfallende Daily Inhalte (FOMO).** Verstoßen gegen den gesunden Rahmen (2.5) und haben bei einem Privatspiel keinen Nutzen.
* **Künstlich erzeugte Beinahe Treffer** (manipuliertes Ziehen, "fast gewonnen" Meldung ohne Substanz). Der Near Miss Effekt ist ein Glücksspiel Mechanismus (Clark et al. 2009) und wäre hier manipulativ.
* **Verluststrafen fürs Aufhören**, Wartezeiten, Energie Systeme.
* **Permanente Stat Boni als Meta Fortschritt.** Sie machen Siege weniger aussagekräftig (Kritik in Entwicklerdiskussionen). Inhalts Unlocks bevorzugen.
* **Online Bestenlisten.** Kein Server, kein Zweck, und Seed Glück verzerrt Vergleiche.

---

## 6. Empfohlene Roadmap

| Meilenstein | Inhalt | Warum jetzt | Schätzung |
|---|---|---|---|
| **M7 Logbuch und Bericht** | V1, V2 (mit Run Statistik Feldern), V4, SAVE_VERSION 5 mit Migration, Tests | Grundlage für alle späteren Schichten, sofort spürbar nach jedem Run, risikoarm | 3 bis 5 Tage |
| **M8 Mastery Leiter** | V3 (Siegel pro Deck und Stake), erste Hälfte von V5 (Decks und Stakes freischalten, noch ohne Joker Pool) | Gibt Ziele ohne Engine Eingriff in den Zufall (Pool bleibt unberührt) | 2 bis 4 Tage |
| **M9 Entdeckung und Freischaltungen** | zweite Hälfte V5 (Joker Pool pro Run), V6 (Observationen) | Größter Eingriff, benötigt Fuzz Test und Seed Dokumentation | 4 bis 6 Tage |
| **M10 Wiederkehr** | V7 (Tagessternbild), V8 (Juice Pass 2 nach iPad Messung) | Daily nutzt Seeds und RunMods, Juice braucht Leistungsdaten | 3 bis 5 Tage |
| **M11 Tiefe und Feinschliff** | V9, V10, V11, V12 je nach Spielgefühl und Messung der Run Dauer | Erst entscheiden, wenn echte Daten aus dem Logbuch vorliegen | offen |

**Reihenfolge Begründung:** Erst messen und anzeigen (M7), dann Ziele geben (M8), dann Inhalt freischalten (M9), dann Wiederkehr (M10). So fließen die Messwerte aus M7 in die Balance der späteren Meilensteine ein. SAVE_VERSION 5 wird **einmal gebündelt** in M7 eingeführt (Statistik Felder, `challengeId`, `finalAnte`, `jokerPool` können gleich als optionale Felder vorgesehen werden), damit nicht mehrere Migrationen nacheinander entstehen. Pro Meilenstein gilt weiter: Tests grün, `AUDIT.md` Status, Patch Notes, kleine Commits.

---

## 7. Offene Fragen und Entscheidungen für den Eigentümer

1. **Wie viel Gating ist erwünscht?** Soll alles ab Start offen bleiben (Vorschläge V1, V2, V4, V6, V7 funktionieren trotzdem) oder darf V5 Inhalte verbergen? Bevorzugte Variante: Gating nur für Decks und Stakes, Jokers erst später.
2. **Wer spielt?** Nur der Eigentümer (dann Onboarding V9 niedrig priorisieren) oder auch Familie und Freunde auf dem iPad (dann V9 höher)?
3. **Wie lang sollen Runs sein?** Echte Run Dauer ist bisher nicht gemessen. Reicht das Logbuch als Messung, oder ist ein Kurzlauf (V11) ein Ziel an sich?
4. **Daily Modifikatoren:** Eigenständige Mechaniken oder nur Kombinationen bestehender `RunMods`? Zweites ist deutlich billiger.
5. **Sicherung des Spielstands:** Soll ein Export und Import (JSON) des Meta Speichers gebaut werden, damit Logbuch und Freischaltungen nicht durch Browser Aufräumen verloren gehen? Bei Meta Progression ist Datenverlust ärgerlicher als bei einem einzelnen Run.
6. **Stakes Inhalt:** Sollen Stakes mehr als Zahlen ändern (Modifikatoren wie neue Boss Regeln statt nur Scaling)? Das würde V3 deutlich aufwerten, braucht aber neue Engine Regeln.
7. **Musik:** Soll es überhaupt Musik geben, oder ist die Stille zwischen den Effekten gewollt?
8. **Beinahe Anzeige:** Soll sie immer erscheinen oder erst ab 50 Prozent des Ziels? (Ehrlichkeit gegen Entmutigung.)
9. **Hochformat und Handy Layout** (`AUDIT.md` O68) beeinflussen alle neuen Ansichten (Logbuch, Observationen). Soll das zuerst entschieden werden?
10. **Leistung:** Bildrate auf dem iPad ist weiter ungemessen. Sollte vor V8 und V12 erst die FPS Anzeige ausgewertet werden?

---

## 8. Quellen

Die Quellen wurden über Websuche gefunden. Wo nur Abstracts oder Sekundärtexte gelesen wurden, steht das im Text oder hier in Klammern.

**Psychologie und Motivation**

* Ryan, Rigby, Przybylski: The Motivational Pull of Video Games, A Self Determination Theory Approach (2006). https://www.rochester.edu/warner/lida/wp-content/uploads/2022/11/02bfe513dd59366750000000.pdf (zusammen mit https://www.rochester.edu/news/printable.php?id=2719 und https://acuresearchbank.acu.edu.au/item/8q128/the-motivational-pull-of-video-games-a-self-determination-theory-approach)
* Przybylski, Ryan, Rigby: The Motivating Role of Violence in Video Games (2009). https://selfdeterminationtheory.org/wp-content/uploads/2014/04/2009_PrzbylskiRyanRigby_PSPB-1.pdf
* Clark et al.: Gambling Near Misses Enhance Motivation to Gamble and Recruit Win Related Brain Circuitry, Neuron (2009). https://pmc.ncbi.nlm.nih.gov/articles/PMC2658737 (ergänzend https://www.sciencenews.org/article/gamblers-brains-almost-counts)
* Sweetser, Wyeth: GameFlow, A Model for Evaluating Player Enjoyment in Games (2005). https://ntnu.no/wiki/download/attachments/112986425/GameFlow.pdf?api=v2 (ergänzend https://www.gamedeveloper.com/design/gameplay-flow-designing-for-player-immersion und https://cacmb4.acm.org/magazines/2007/4/5692-flow-in-games-and-everything-else/fulltext)
* Nunes, Drèze (2006) und Kivetz, Urminsky, Zheng (2006) zu Endowed Progress und Goal Gradient (nur Sekundärquellen): https://en.wikipedia.org/wiki/Goal_pursuit
* Ghibellini, Meier: Interruption, recall and resumption, a meta analysis of the Zeigarnik and Ovsiankina effects, Palgrave Communications (2025). https://ideas.repec.org/a/pal/palcom/v12y2025i1d10.1057_s41599-025-05000-w.html
* Arkes, Blumer: The Psychology of Sunk Cost (1985). https://cognition.aau.at/bg/BA/Arkes%20%26%20Blumer%201985.pdf
* Kahneman, Tversky: Prospect Theory, Econometrica (1979), nur als Zitat in den Suchtreffern bestätigt, Volltext nicht gelesen. Verweis über https://www.coglode.com/nuggets/sunk-cost-bias
* Hamari, Koivisto, Sarsa: Does Gamification Work? A Literature Review of Empirical Studies on Gamification (2014). https://research.aalto.fi/fi/publications/does-gamification-work-a-literature-review-of-empirical-studies-o/
* Variable Ratio und Loot Boxen (Sekundärquelle): https://cgr.psych.ubc.ca/?p=990 und https://en.wikipedia.org/wiki/Compulsion_loop
* Wahrnehmung von Zufall und Strähnen, Gegenmaßnahmen (Sekundärquellen): https://www.unsw.edu.au/newsroom/news/2025/01/the-hot-hand-and-the-gamblers-fallacy-why-our-brains-struggle-to-believe-in-randomness und https://nerdbot.com/2026/09/22/every-game-you-play-is-lying-about-its-randomness-and-that-is-usually-the-right-call/

**Roguelike, Deckbuilder, Meta, Daily**

* Game Maker's Toolkit: Roguelikes, Persistency, and Progression. https://amara.org/v/C3BEW
* Analysen zu Roguelite Meta Progression: https://www.feedme.design/why-we-cant-stop-playing-these-roguelites und https://bugnet.io/blog/how-to-design-a-roguelite-meta-progression und https://jboger.substack.com/p/the-emotions-of-rogue-lites
* Analysen zu einem Survivor Spiel (Power Fantasy, niedrige Reibung, Variable Rewards): https://jboger.substack.com/p/the-secret-sauce-of-vampire-survivors und https://birdor-blog.pages.dev/vampire-survivors-low-friction-success-case-study/ und https://csd.docstore.port.ac.uk/news-events-and-blogs/blogs/popular-culture/vampire-survivors-how-developers-used-gambling-psychology-to-create-a-bafta-winning-game
* Schwierigkeitsstufen und Daily Runs in Deckbuildern: https://killtenrats.com/2018/04/01/slay-the-spire-ascension und https://saschb2b.github.io/game-mechanics/games/slay-the-spire/daily-climb
* Daily Runs allgemein: https://gamedeveloper.com/design/the-24-hour-ticket-examining-daily-runs- und https://kotaku.com/more-games-need-daily-challenge-modes-1740109783 und https://dev.to/yurukusa/5-lines-of-code-that-made-my-roguelike-worth-playing-every-day-3klj
* Tod als Fortschritt: https://www.avclub.com/hades-and-failure und https://criticalvideogamestudies.com/what-roguelikes-roguelites-teach-us-about-failure/

**Juice, Sound, Haptik**

* Jonasson, Purho: Juice it or Lose it (GDC Europe 2012). https://gdcvault.com/play/1016487/contactUs und https://roblog.co.uk/2024/03/juicy-games/
* Don't Juice It or Lose It (GDC Europe 2014). https://gdcvault.com/play/1020861/Don-t-Juice-It-or
* Game Feel Überblick: https://Www.wikipedia.org/wiki/Game_feel und https://brkeogh.com/2017/03/31/an-incomplete-game-feel-reader/
* Web Audio auf iOS: https://bugs.webkit.org/show_bug.cgi?id=291892 und https://dev.to/sharminsirajudeen/how-a-web-worker-fixed-my-dying-battery-audio-and-what-i-learned-about-pwas-the-hard-way-3e0n und https://developer.mozilla.org/en-US/docs/Games/Techniques/Audio_for_Web_Games
* Vibration API Unterstützung: https://caniuse.com/mdn-api_navigator_vibrate und https://www.mintlify.com/lochie/web-haptics/advanced/browser-support und https://github.com/mdn/browser-compat-data/issues/29166

**Onboarding und Retention (Mobile)**

* Mobile Retention Benchmarks (Sekundärquellen, GameAnalytics Zahlen nicht direkt gelesen): https://appfollow.io/blog/mobile-game-retention und https://blog.playio.co/mobile-game-onboarding-retention und https://investgame.net/wp-content/uploads/2026/01/2026-01-20-Mobile_retention_benchmarks_2026.pdf

**Ethik und Dark Patterns**

* Zagal, Björk, Lewis: Dark Game Design Patterns (2013), Kritik von Deterding, Stenros, Montola (2020). https://eprints.whiterose.ac.uk/156460/1/DiGRA_2020_paper_189.pdf und https://arxiv.org/pdf/2412.05039
* Streaks, FOMO und Loss Aversion in Spielen (Praxisartikel): https://bugnet.io/blog/how-to-design-daily-rewards-that-arent-manipulative und https://uxmag.com/articles/gamification-or-manipulation-understanding-the-ethics-of-engagement-loops und https://uxdesign.cc/beyond-streaks-and-nudges-ethical-gamification-ai-design-1c4f6e8ef2cc

**Interne Quellen (Repo)**

* `CLAUDE.md`, `docs/HANDOFF.md`, `docs/PLAYTEST.md`, `docs/PLAN.md`, `AUDIT.md`, `src/data/*`, `src/save.ts`, `src/collection.ts`, `src/settings.ts`, `src/ui/Game.ts`, `src/ui/audio.ts`, `src/ui/HomeView.ts`, `src/ui/juiceMath.ts`
