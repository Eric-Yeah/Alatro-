/** Anleitung: Seiten mit Überschrift und Absätzen. Zeilen, die mit "* " beginnen, werden als Aufzählung gezeigt. */
export interface TutorialPage {
  id: string;
  /** kurzer Name für die Reiter */
  tab: string;
  title: string;
  lines: string[];
}

export const TUTORIAL: readonly TutorialPage[] = [
  {
    id: 'ziel',
    tab: 'Ziel',
    title: 'Worum geht es?',
    lines: [
      'Alatro ist ein Roguelike mit Pokerhänden. Du spielst Karten aus deiner Hand und sammelst Punkte. Erreichst du das Ziel eines Blinds, geht es weiter.',
      '* Ein Run besteht aus 8 Antes. Jedes Ante hat drei Blinds: Small Blind, Big Blind und Boss Blind.',
      '* Die Ziele werden mit jedem Ante deutlich höher. Mit Jokers und Verbesserungen musst du mithalten.',
      '* Nach Ante 8 hast du gewonnen. Danach kannst du im Endless Modus weiterspielen.',
      '* Schaffst du ein Ziel nicht, bevor deine Hands aufgebraucht sind, ist der Run vorbei.',
      'Der Run wird nach jedem Schritt gespeichert. Über Menü und Fortsetzen geht es dort weiter, wo du aufgehört hast.',
    ],
  },
  {
    id: 'runde',
    tab: 'Runde',
    title: 'Eine Runde spielen',
    lines: [
      'Du startest mit 8 Karten in der Hand, 4 Hands und 3 Discards pro Runde.',
      '* Tippe bis zu 5 Karten an, um sie auszuwählen. Tippe eine Karte erneut an, um sie abzuwählen.',
      '* Play Hand spielt die gewählten Karten aus und rechnet die Punkte.',
      '* Discard wirft die gewählten Karten ab, du ziehst Ersatz nach. Das kostet einen Discard, aber keine Hand.',
      '* Mit den Sortier Knöpfen ordnest du die Hand nach Rang oder Suit.',
      'Die Runde ist gewonnen, sobald dein Round Score das Ziel erreicht. Übrige Hands bringen später Geld.',
      'Oben links siehst du immer, welche Pokerhand deine Auswahl ergibt, mit ihren Chips und ihrem Mult.',
    ],
  },
  {
    id: 'punkte',
    tab: 'Punkte',
    title: 'Chips mal Mult',
    lines: [
      'Jede Pokerhand hat Basiswerte: Chips (blau) und Mult (rot). Der Score einer Hand ist Chips mal Mult.',
      '* Zuerst gelten die Basiswerte der Hand, zum Beispiel Pair oder Flush.',
      '* Dann werden die gewerteten Karten von links nach rechts ausgewertet. Jede bringt Chips nach ihrem Rang, dazu eventuelle Boni.',
      '* Danach wirken Karten, die du in der Hand behalten hast, und zuletzt die Jokers von links nach rechts.',
      'Die Reihenfolge zählt: Ein Joker mit "plus Mult" vor einem Joker mit "X Mult" bringt mehr als umgekehrt. Du kannst Jokers per Ziehen umsortieren.',
      'Nicht alle Karten werden gewertet. Bei einem Pair zählen nur die zwei Karten des Paars, die übrigen Karten liefern keine Chips.',
      'Die Level deiner Hände findest du unter Run Info. Höheres Level heißt mehr Chips und mehr Mult.',
    ],
  },
  {
    id: 'blinds',
    tab: 'Blinds',
    title: 'Blinds, Skip und Geld',
    lines: [
      'Jedes Ante hat drei Blinds mit steigendem Ziel.',
      '* Small Blind: das Grundziel.',
      '* Big Blind: das 1,5fache Ziel und etwas mehr Belohnung.',
      '* Boss Blind: das doppelte Ziel und eine Sonderregel, die dich stört, zum Beispiel geschwächte Karten. Der Boss lässt sich nicht überspringen.',
      'Small und Big Blind kannst du per Skip überspringen. Du bekommst dafür einen Tag mit einem Bonus, verzichtest aber auf Belohnung und Shop.',
      'Nach jeder gewonnenen Runde kassierst du ein: die Belohnung des Blinds, dazu 1 Dollar je übrige Hand und Zinsen. Pro volle 5 Dollar, die du besitzt, gibt es 1 Dollar Zinsen, bis zu einem Deckel. Sparen lohnt sich also.',
    ],
  },
  {
    id: 'shop',
    tab: 'Shop',
    title: 'Der Shop',
    lines: [
      'Nach jeder gewonnenen Runde öffnet sich der Shop. Hier gibst du dein Geld aus.',
      '* Jokers: dauerhafte Verstärker. Du hast zunächst 5 Slots.',
      '* Consumables: Sternbilder, Elixiere und Omen. Du hast zunächst 2 Slots.',
      '* Spielkarten: neue Karten für dein Deck.',
      '* Vouchers: einmalige, dauerhafte Verbesserungen. Manche schalten ein stärkeres Gegenstück frei.',
      '* Booster Packs: du siehst mehrere Karten und wählst eine oder zwei davon.',
      'Reroll mischt das Angebot neu, wird aber bei jeder Nutzung teurer. Jokers und Consumables kannst du für die Hälfte ihres Preises wieder verkaufen.',
      'Mit Next Round geht es zum nächsten Blind. Geld, das du nicht ausgibst, bringt Zinsen.',
    ],
  },
  {
    id: 'jokers',
    tab: 'Jokers',
    title: 'Jokers und Editions',
    lines: [
      'Jokers liegen oben im Fach und wirken bei jeder gespielten Hand. Manche geben Chips oder Mult, manche multiplizieren, manche verdienen Geld oder verändern die Regeln.',
      '* Tippe einen Joker an, um seine Beschreibung zu lesen und ihn zu verkaufen.',
      '* Ziehe einen Joker nach links oder rechts, um die Reihenfolge zu ändern.',
      '* Seltenheit: Common, Uncommon, Rare und Legendary. Seltene Jokers sind meist stärker.',
      'Eine Edition ist ein Schimmer auf einer Karte oder einem Joker:',
      '* Schimmer: plus Chips.',
      '* Aura: plus Mult.',
      '* Prisma: Mult mal 1,5.',
      '* Schatten: nur auf Jokers, gibt einen zusätzlichen Slot.',
    ],
  },
  {
    id: 'karten',
    tab: 'Karten',
    title: 'Karten verbessern',
    lines: [
      'Dein Deck bleibt nicht gleich. Mit Consumables machst du deine Karten und Hände stärker.',
      '* Sternbild: hebt eine Pokerhand um ein Level an. Das lohnt sich für die Hand, die du am häufigsten spielst.',
      '* Elixier: wirkt auf ausgewählte Karten. Sie erhalten ein Material oder Seal, ändern Suit oder Rang, werden kopiert oder zerstört.',
      '* Omen: mächtige Effekte mit einem Preis, etwa zerstörte Karten oder Geld, das auf 0 sinkt.',
      'Karten können außerdem Zusätze tragen:',
      '* Enhancement (Material): zum Beispiel Kupfer, Rubin oder Gold mit Chips, Mult oder Geld.',
      '* Seal: ein Zeichen, etwa Echo Seal (Karte zählt zweimal) oder Münz Seal (Geld). Auf der Karte zeigt ein Kreis mit E, M oder S das Seal an.',
      '* Edition: Schimmer, Aura oder Prisma. Der Name steht oben auf der Karte.',
      'In der Sammlung siehst du alle Inhalte, die du schon entdeckt hast.',
    ],
  },
  {
    id: 'tipps',
    tab: 'Tipps',
    title: 'Decks, Schwierigkeit und Tipps',
    lines: [
      'Vor dem Run wählst du ein Deck und die Schwierigkeit. Decks bringen kleine Boni. Mit einem Seed lässt sich ein Run wiederholen.',
      'Ein paar Tipps für den Anfang:',
      '* Spiele öfter dieselbe Pokerhand und hebe sie mit Sternbildern an.',
      '* Gib nicht alles aus. Zinsen sind in den ersten Antes eine verlässliche Einnahme.',
      '* Prüfe vor jedem Boss Blind seine Sonderregel und passe deine Hand darauf an.',
      '* Ordne Jokers sinnvoll: Mult Boni zuerst, Multiplikatoren danach.',
      '* Nutze Discards, um nach starken Händen zu suchen, statt schwache Hände zu spielen.',
      'Wenn dir die Animationen zu lang dauern, schalte in den Optionen oder mit dem Tempo Knopf am Tisch auf ein schnelleres Tempo.',
    ],
  },
  {
    id: 'schwierigkeit',
    tab: 'Schwierigkeit',
    title: 'Schwierigkeit, Erfolge und Tageslauf',
    lines: [
      'Du kannst die Schwierigkeit auf zwei Arten wählen:',
      '* Feste Stufen: Morgenrot ist etwas leichter als das Grundspiel, danach folgt die Leiter von Dämmerung bis Ewige Nacht. Jede Stufe der Leiter enthält alle Regeln der vorherigen.',
      '* Skalierend: 20 Stufen, die du per Antippen der Leiste wählst. Das Ziel der Blinds wächst mit jeder Stufe, ab bestimmten Stufen kommen Regeln dazu. Stufe 4 ist das Grundspiel, Stufe 1 bis 3 ist leichter.',
      'Nach einem Sieg schlägt dir das Spiel die nächsthärtere Stufe vor.',
      'Unter Erfolge sammelst du Sterne. Sie bestimmen deinen Rang. Dort steht auch deine Statistik über alle Runs.',
      'Der Tageslauf bietet jeden Tag einen festen Run mit Seed, Deck, Stufe und einer Wandlung, die eine Regel verändert. Dein bestes Ante pro Tag wird gemerkt.',
      'Die geführte Einführungsrunde startest du jederzeit über den Knopf Einführung im Hauptmenü.',
    ],
  },
];
