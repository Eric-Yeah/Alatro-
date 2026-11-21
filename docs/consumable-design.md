# Consumable Erweiterung: Entwurf und Balance

Zu den 42 bisherigen Consumables kommen 23 neue (13 Elixiere, 10 Omen), zusammen 65. Es bleibt bei den drei Typen Sternbild (12, unverändert), Elixier (21 plus 13 gleich 34) und Omen (9 plus 10 gleich 19). Alle Namen, Effekte und Grafiken sind eigene Entwürfe im Thema Sternwarte der Alchemisten. Bestehende IDs sind unverändert, die Zahlen stehen in `src/data/consumables.ts`, die Wirkung in `src/core/consumables.ts`.

## Grundsätze

* **Preis und Slots:** Elixier kostet 3, Omen 4 (`CONSUMABLE_COST`), Verkaufswert wie bisher die Hälfte. Es gibt weiter 2 Consumable Slots.
* **Kein Spielstand Format Änderung:** Alle neuen Effekte nutzen vorhandene Felder (`pendingTags`, `handLevels`, `handSize`, `hands`, `discards`, `consumableSlots`, `jokers`, Karten). `SAVE_VERSION` bleibt.
* **Zufall nur über `RngStreams`:** Jeder Zufallseffekt hat einen eigenen Strom je Consumable und Ante (`cons_<id>_a<ante>_...`). Das Joker Kopieren nutzt `runChance` (Wahrscheinlichkeitsfaktor der Jokers wirkt).
* **Gewichte:** Neues optionales Feld `weight` (Standard 1). `rollConsumable` zieht gewichtet, so erscheinen starke Karten seltener, ohne dass Shop und Packs geändert werden mussten. Neue Einträge erscheinen automatisch in Shop (Gewicht je Typ unverändert), Packs und bei `createConsumables`.
* **Grenzen gegen Aufschaukeln:** Hand Size höchstens `MAX_HAND_SIZE` (12) und mindestens 1, Consumable Slots höchstens `MAX_CONSUMABLE_SLOTS` (4), mindestens 1 Hand (`MIN_HANDS`), Hand Level nie unter 1. Geld Effekte haben Deckel oder brauchen Karten, die man erst haben muss.
* **Nur in einer Runde:** Aufwind und Stundenglas brauchen Nachziehstapel und Discards der laufenden Runde (Hinweis "Nur in einer Runde benutzbar").

## Elixiere (Kosten 3)

| ID | Name | Effekt | Zahlen | Balance Gedanke |
|---|---|---|---|---|
| elixier_gipfelglanz | Gipfelglanz | `setRank`: bis zu 2 Ziele werden zu Ace | Rang 14 | Wie Aufstieg, aber gezielt. Ace ist der höchste Rang (11 Chips), keine Mult. Hilft Paaren und Ace Jokers, ersetzt aber keine Hand. |
| elixier_gleichklang | Gleichklang | `matchRank`: 2 bis 3 Ziele übernehmen den höchsten Rang unter ihnen | 2 bis 3 Karten | Baut Paare und Drillinge ohne Zufall, kostet aber die Mühe, passende Karten schon in der Hand zu haben. Der Rang steigt nie über den höchsten der Auswahl. |
| elixier_spektralglas | Spektralglas | `matchSuit`: 2 bis 4 Ziele übernehmen die häufigste Suit unter ihnen | Gleichstand: Reihenfolge Spades, Hearts, Diamonds, Clubs | Flush Hilfe, schwächer als die Farbwandler (die setzen eine feste Suit), dafür bis zu 4 Karten. |
| elixier_abguss | Abguss | `spreadEnhancement`: eine Karte mit Enhancement überträgt es auf 2 zufällige andere Handkarten | 2 Kopien, bevorzugt Karten ohne dieses Enhancement | Verdoppelt Enhancements statt sie zu kaufen. Das Ziel braucht schon eines, die Zielkarten verlieren ihr altes. Ersetzt zwei Elixiere, bleibt aber Zufall. |
| elixier_glanzfirnis | Glanzfirnis | `edition`: eine Karte erhält Schimmer (+40 Chips) | 1 Karte | Schwächste Edition, günstig, deterministisch. |
| elixier_flammenfirnis | Flammenfirnis | `edition`: eine Karte erhält Aura (+8 Mult) | 1 Karte, Gewicht 0,6 | Starke Edition für 3, deshalb seltener. Nur eine Karte, die ins Deck von 52 geht, wirkt erst über viele Runden. |
| elixier_pfandsiegel | Pfandsiegel | `destroyForMoney`: eine Karte wird zerstört, +$3 | Geld 3 | Dünnt das Deck aus. Die $3 gleichen den Kaufpreis nur aus, es ist kein Gewinn. |
| elixier_goldwaage | Goldwaage | `moneyPerModified`: +$1 je Karte im Deck mit Enhancement, Seal oder Edition | Deckel $10 | Belohnt Deckbau. Ohne veränderte Karten bringt es nichts, voll ausgebaut höchstens $10 (Erntemond: bis $20). |
| elixier_leitstern | Leitstern | `levelMostPlayed`: die meistgespielte Hand erhält +1 Level | Gewicht 0,8, Gleichstand: die bessere Hand | Wie ein Sternbild ohne Wahl der Hand. Es braucht eine gespielte Hand. Das Gewicht gleicht den Komfort aus (Sternbilder gibt es zusätzlich in eigenen Packs). |
| elixier_nachtlicht | Nachtlicht | `addTag`: Tag Nachtwache, +1 Hand in der nächsten Runde | Tag aus den Daten der Tags | Kleiner, einmaliger Vorteil. Wert etwa ein Dollar plus Punkte einer Hand. |
| elixier_bannwasser | Bannwasser | `addTag`: Tag Schutzzauber, deaktiviert den nächsten Boss Effekt | Gewicht 0,7 | Einmalig und nur für einen Boss. Schützt vor einem gefährlichen Boss, ersetzt aber keinen Plan. |
| elixier_aufwind | Aufwind | `drawCards`: 2 Karten vom Nachziehstapel auf die Hand | nur in einer Runde, 2 Karten | Mehr Auswahl für eine Runde, die Hand wird danach wieder normal aufgefüllt. |
| elixier_stundenglas | Stundenglas | `extraDiscards`: +2 Discards in dieser Runde | nur in einer Runde, 2 Discards | Ein Discard ist weniger wert als eine Hand. Hilft beim Suchen nach einer Hand, kein Dauereffekt. |

## Omen (Kosten 4)

| ID | Name | Gewinn | Preis | Zahlen | Balance Gedanke |
|---|---|---|---|---|---|
| omen_gestirnsopfer | Gestirnsopfer | meistgespielte Hand +3 Level | alle anderen Hände verlieren 1 Level (mindestens 1) | `levelMostPlayed`, Menge 3, andere -1 | Konzentriert Level auf den eigenen Stil (Aschenregen gibt allen +1 für zwei Karten). Zu Beginn kostet es fast nichts, später bestraft es breite Builds. |
| omen_lichtschleifer | Lichtschleifer | ein Joker ohne Edition erhält Schimmer, Aura oder Prisma | dauerhaft -1 Hand Size | `jokerEdition`, Liste `OMEN_EDITIONS` | Eine Joker Edition ist stark, Hand Size -1 trifft jede Runde. Wie Kometenstaub, aber auf Jokers. Nicht benutzbar bei Hand Size 1. |
| omen_zwillingsflamme | Zwillingsflamme | ein zufälliger kopierbarer Joker wird verdoppelt (ohne Edition, mit Werten) | mit 1 in 3 Chance wird er stattdessen zerstört | `jokerDuplicate`, 2 in 3, Gewicht 0,8 | Erwartungswert ein Drittel Joker, das echte Risiko trifft den Joker, den man nicht wählen kann. Braucht einen freien Joker Slot. |
| omen_kometenschweif | Kometenschweif | Tag Nova, der nächste Shop enthält einen gratis Rare Joker | das Geld sinkt auf die Hälfte (abgerundet verloren) | `addTag`, `halveMoney`, Gewicht 0,7 | Ein Rare Joker kostet im Shop etwa 8 bis 10. Wer mit viel Geld in den Shop geht, zahlt fast so viel wie er spart. Lohnt sich vor allem mit wenig Geld. |
| omen_nachtauge | Nachtauge | dauerhaft +1 Hand Size | 3 zufällige Karten werden zerstört | `handSizeUp`, Gewicht 0,8 | Mehr Auswahl pro Runde gegen ein kleineres Deck (Aschenregen zerstört 2 für Level auf allen Händen). Obergrenze Hand Size 12. |
| omen_alchemistenbeutel | Alchemistenbeutel | dauerhaft +1 Consumable Slot | dauerhaft -1 Hand Size | `slotUp`, Gewicht 0,8 | Slots sind knapp (2). Der Preis trifft jede Runde. Obergrenze 4 Slots, Hand Size nie unter 1. |
| omen_abendruhe | Abendruhe | dauerhaft +2 Discards pro Runde | dauerhaft -1 Hand pro Runde | `tradeHandForDiscard` | Gegenstück zu Nachtpakt (+1 Hand, -1 Discard). Zwei Discards sind etwa eine Hand wert, es gibt also keinen Gewinn ohne Plan. Nicht unter 1 Hand. |
| omen_prismenopfer | Prismenopfer | eine Karte erhält Prisma (X1,5 Mult) | 2 zufällige andere Handkarten werden zerstört | `edition`, Gewicht 0,8 | Wie Siegelsturm, aber mit sicherer, starker Edition. Braucht mindestens 3 Karten. |
| omen_wandlung | Wandlung | ein Common oder Uncommon Joker wird durch einen der nächsten Rarity ersetzt (Stelle und Edition bleiben) | alle Hände verlieren 1 Level | `jokerUpgrade`, Gewicht 0,8 | Aufwertung nur eine Stufe, Rare bleibt Rare. Der Preis ist früh gering, spät spürbar. |
| omen_farbsturm | Farbsturm | alle übrigen Handkarten werden eine zufällige Suit (dauerhaft) | 2 zufällige Handkarten werden zerstört | `monoSuit` | Baut einen Flush Kern. Der Effekt betrifft nur die Hand von 8 Karten, ein ganzes Deck braucht mehrere Omen und viel Glück. |

## Warum keines einen Run alleine trivial macht

* Kein neuer Effekt erzeugt Geld ohne Gegenwert: Pfandsiegel zahlt nur den Preis zurück, Goldwaage hat Deckel $10 und braucht Deckbau, Kometenschweif senkt das Geld.
* Dauerhafte Verbesserungen (Hand Size, Slots, Hands) haben immer einen Preis und eine harte Obergrenze.
* Starke Einzelkarten (Flammenfirnis, Bannwasser, Kometenschweif, Zwillingsflamme, Prismenopfer und andere) haben Gewicht unter 1. Omen erscheinen ohnehin selten (Packgewicht 0,6 gegenüber 4 bei Elixier).
* Jokers werden nur einmal pro Omen verändert. Wandlung wirkt nur bis Rare, Legendary bleibt dem Ahnenruf vorbehalten.

## Offene Punkte (für AUDIT.md)

* **Gewichte** (`weight` zwischen 0,6 und 1): eigene Entscheidung, Feinschliff nach Spielen.
* **Gleichstand bei meistgespielter Hand:** die bessere Hand gewinnt (Reihenfolge `HAND_ORDER`), eigene Regel.
* **Gleichstand bei Spektralglas:** Reihenfolge Spades, Hearts, Diamonds, Clubs, eigene Regel.
* **Zwillingsflamme:** nur Jokers mit `copyCompat` werden gewählt, die Kopie erhält keine Edition, das Original stirbt bei Misserfolg, Chance läuft über `runChance` (Jokers mit Wahrscheinlichkeit helfen).
* **Wandlung:** keine Aufwertung von Rare, kein Zurücksetzen; fällt der Wurf auf keinen freien Joker, ist das Omen verbraucht ohne Wirkung (Randfall).
* **Hand Size während der Runde:** Omen, die Hand Size ändern, wirken sofort auch auf die laufende Runde (die Hand wird erst beim Nachziehen kleiner oder größer). Das ältere Kometenstaub wirkt weiter erst ab der nächsten Runde.
* **Tags über Consumables:** nur wartende Tags (`when` nicht `immediate`). Mehrere gleiche Tags stapeln sich und werden zusammen eingelöst (zwei Nachtlichter geben +2 Hands in der nächsten Runde). Das ist gewollt, die Seltenheit und der Slot Preis begrenzen es.
