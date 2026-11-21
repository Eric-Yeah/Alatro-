# Entwurf: 71 neue Jokers (Ziel 150)

Stand: 21.11.2026. Bisher 79 Jokers (45 Common, 23 Uncommon, 8 Rare, 3 Legendary). Dieser Entwurf ergänzt **71** neue, danach sind es **150**: 79 Common, 44 Uncommon, 20 Rare, 7 Legendary.

Alle Namen und Effekte sind eigene Entwürfe im Thema "Sternwarte der Alchemisten". Die Zahlen stehen später in `config` (`src/data/jokers.ts`).

## Balance Leitplanken

* Referenz der bestehenden Jokers: Common sind +4 Mult für $2, +30 Chips für $2, bedingte Boni (+7 Mult bei Pair für $3, +70 Chips bei Flush für $4), pro Karte +3 Mult oder +25 Chips für $4. Uncommon sind X1,4 bis X2 mit Bedingung oder wachsende Jokers. Rare sind wachsende X Mult oder starke Passive. Legendary ist X3 oder +1/+1/+1.
* Kein unbedingter X Mult über X1,25 unterhalb von Legendary, bedingte X Mult nur mit echter Bedingung.
* Wachsende Jokers wachsen langsamer als die bedingte Variante, dafür dauerhaft.
* Geld Jokers liefern pro Runde höchstens etwa $3 bis $4 bei Common.
* Passive und Rettung nur ab Uncommon, Legendary nie im Shop.

## Common (34)

| ID | Name | Englisch | Preis | Effekt |
|---|---|---|---|---|
| wetterhahn | Wetterhahn | Weathercock | 3 | +45 Chips, wenn die Hand ein Pair enthält |
| drillbohrer | Drillbohrer | Triple Drill | 4 | +80 Chips, wenn die Hand Three of a Kind enthält |
| viererbund | Viererbund | Fourfold Pact | 5 | +20 Mult, wenn die Hand Four of a Kind enthält |
| kleiner_kessel | Kleiner Kessel | Little Cauldron | 4 | +9 Mult, wenn die Hand einen Flush enthält |
| meilenstein | Meilenstein | Milestone | 4 | +9 Mult, wenn die Hand eine Straight enthält |
| dreiklang | Dreiklang | Triad | 3 | +8 Mult, wenn genau 3 Karten gespielt werden |
| viertakt | Viertakt | Four Beat | 4 | +10 Mult, wenn genau 4 Karten gespielt werden |
| rotwein | Rotwein | Red Wine | 4 | Jede gewertete Hearts Karte gibt +20 Chips |
| bernstein | Bernstein | Amber | 4 | Jede gewertete Diamonds Karte gibt +3 Mult |
| schiefer | Schiefer | Slate | 4 | Jede gewertete Spades Karte gibt +25 Chips |
| moos | Moos | Moss | 4 | Jede gewertete Clubs Karte gibt +3 Mult |
| zehnkampf | Zehnkampf | Decathlon | 4 | Jede gewertete 10 gibt +4 Mult |
| warme_stube | Warme Stube | Warm Parlour | 4 | Jede Hearts Karte in der Hand gibt +2 Mult |
| kalter_keller | Kalter Keller | Cold Cellar | 4 | Jede Spades Karte in der Hand gibt +15 Chips |
| sparfuchs | Sparfuchs | Thrifty Fox | 4 | +2 Mult pro übrigem Discard |
| vorsprung | Vorsprung | Head Start | 4 | +2 Mult pro übriger Hand |
| sparstrumpf | Sparstrumpf | Money Sock | 4 | +1 Mult pro $4 im Besitz |
| spardose | Spardose | Piggy Jar | 5 | +$1 am Ende jeder Runde pro $10 im Besitz |
| kleiner_zoll | Kleiner Zoll | Small Toll | 4 | +$3, wenn ein Small Blind geschafft wird |
| mautbruecke | Mautbrücke | Toll Bridge | 4 | +$3, wenn ein Big Blind geschafft wird |
| flohmarkt | Flohmarkt | Flea Market | 4 | +$1, wenn ein Discard genau 5 Karten abwirft |
| sedimente | Sedimente | Sediment | 4 | Erhält +5 Chips pro gespielter Hand |
| zweitschlag | Zweitschlag | Second Strike | 4 | Die zweite gewertete Karte gibt +40 Chips |
| mutprobe | Mutprobe | Trial of Courage | 5 | +12 Mult in einem Boss Blind |
| federkiel | Federkiel | Quill | 4 | +2 Mult pro Karte in der Hand |
| perlenschnur | Perlenschnur | String of Pearls | 5 | +2 Mult pro gewerteter Karte |
| einsiedler | Einsiedler | Hermit | 3 | +50 Chips, wenn die Hand nur eine High Card ist |
| gasthaus | Gasthaus | Inn | 5 | Bei der Wahl des Big Blinds: +$3 |
| sternschnuppe | Sternschnuppe | Shooting Star | 5 | Bei der Wahl des Small Blinds entsteht ein Sternbild (wenn ein Slot frei ist) |
| kraeuterbeet | Kräuterbeet | Herb Bed | 5 | Bei der Wahl des Big Blinds entsteht ein Elixier (wenn ein Slot frei ist) |
| zwillingsmond | Zwillingsmond | Twin Moons | 4 | +60 Chips, wenn die Hand Two Pair enthält |
| hausmusik | Hausmusik | Parlour Music | 5 | +15 Mult, wenn die Hand ein Full House enthält |
| notnagel | Notnagel | Last Resort | 3 | +10 Mult, wenn keine Discards übrig sind |
| staubwolke | Staubwolke | Dust Cloud | 4 | Erhält +2 Chips pro gewerteter Karte |

## Uncommon (21)

| ID | Name | Englisch | Preis | Effekt |
|---|---|---|---|---|
| windhose | Windhose | Whirlwind | 5 | Erhält +1 Mult pro Discard |
| regenbogen | Regenbogen | Rainbow | 6 | X1,5 Mult, wenn die Hand einen Flush enthält |
| sternenpfad | Sternenpfad | Star Path | 6 | X1,5 Mult, wenn die Hand eine Straight enthält |
| zwillingspaar | Zwillingspaar | Twin Pair | 6 | X1,5 Mult, wenn die Hand Two Pair enthält |
| viererkette | Viererkette | Chain of Four | 7 | X3 Mult, wenn die Hand Four of a Kind enthält |
| duo | Duo | Duet | 6 | X1,8 Mult, wenn genau 2 Karten gespielt werden |
| bettelmann | Bettelmann | Beggar | 5 | X2 Mult, wenn du höchstens $4 hast |
| herzecho | Herzecho | Heart Echo | 7 | Gewertete Hearts Karten werden 1 Mal erneut ausgewertet |
| nachtecho | Nachtecho | Night Echo | 7 | Gewertete Spades Karten werden 1 Mal erneut ausgewertet |
| glueckszahl | Glückszahl | Lucky Number | 6 | Gewertete 7en werden 2 Mal erneut ausgewertet |
| kreidestriche | Kreidestriche | Chalk Marks | 6 | Erhält +3 Mult pro geschafftem Boss Blind |
| verzauberer | Verzauberer | Enchanter | 6 | Jede gewertete Karte mit Enhancement gibt +4 Mult |
| siegelwart | Siegelwart | Seal Keeper | 6 | Jede gewertete Karte mit Seal gibt +6 Mult |
| zehntner | Zehntner | Tithe Collector | 6 | Jede gewertete Face Card: 1 in 4 Chance auf +$2 |
| gluecksspieler | Glücksspieler | Gambler | 6 | 3 gratis Rerolls pro Shop |
| vierlicht | Vierlicht | Four Lights | 6 | +16 Mult, wenn die gewerteten Karten alle vier Suits zeigen |
| gezeitenkalender | Gezeitenkalender | Tide Calendar | 5 | In ungeraden Antes +12 Mult, in geraden Antes +70 Chips |
| elixierbrauer | Elixierbrauer | Brewer | 6 | Bei der Wahl des Big und des Boss Blinds entsteht je ein Elixier |
| orakel | Orakel | Oracle | 7 | Bei der Wahl des Boss Blinds entsteht ein Omen (wenn ein Slot frei ist) |
| himmelsscheibe | Himmelsscheibe | Sky Disc | 7 | X1,25 Mult |
| weiter_mantel | Weiter Mantel | Wide Cloak | 7 | +2 Hand Size |

## Rare (12)

| ID | Name | Englisch | Preis | Effekt |
|---|---|---|---|---|
| trophaeensammler | Trophäensammler | Trophy Hunter | 8 | Erhält X0,2 Mult pro geschafftem Boss Blind (Start X1) |
| sternuhr | Sternuhr | Star Clock | 9 | Erhält X0,05 Mult pro gespielter Hand (Start X1) |
| sonnenkorona | Sonnenkorona | Solar Corona | 9 | X4 Mult, wenn die Hand einen Straight Flush enthält |
| meisterwerk | Meisterwerk | Masterwork | 9 | Jede gewertete Karte mit Enhancement gibt X1,1 Mult |
| nachtwandler | Nachtwandler | Nightwalker | 8 | Jede gewertete Spades Karte gibt X1,12 Mult |
| purpurgarde | Purpurgarde | Crimson Guard | 8 | Jede gewertete Hearts Karte gibt X1,12 Mult |
| kapitalist | Kapitalist | Capitalist | 8 | +$1 am Ende jeder Runde pro $4 im Besitz (höchstens $6) |
| echokammer | Echokammer | Echo Chamber | 8 | Bei genau 2 gespielten Karten werden alle gewerteten Karten 2 Mal erneut ausgewertet |
| alles_oder_nichts | Alles oder Nichts | All or Nothing | 9 | X2,5 Mult, wenn keine Discards übrig sind |
| zufallskugel | Zufallskugel | Chance Orb | 8 | 1 in 5 Chance auf X5 Mult |
| konstellation | Konstellation | Constellation | 9 | X0,25 Mult pro in der Hand enthaltener Handart (High Card zählt nicht) |
| weltenwanderer | Weltenwanderer | World Wanderer | 9 | X1 plus X0,25 pro Ante nach der ersten |

## Legendary (4), nie im Shop, nur über das Omen Ahnenruf

| ID | Name | Englisch | Preis | Effekt |
|---|---|---|---|---|
| weltenesche | Weltenesche | World Ash | 20 | +1 Joker Slot, +1 Consumable Slot und +1 Karten Slot im Shop |
| goldquelle | Goldquelle | Gold Spring | 20 | +$5 am Ende jeder Runde, Zinsdeckel +$5 |
| urecho | Urecho | Primal Echo | 20 | Alle gewerteten Karten werden 1 Mal erneut ausgewertet |
| kometenschauer | Kometenschauer | Comet Shower | 20 | Jede gewertete Karte gibt X1,15 Mult |

## Motive (Pixel Art, für den Zeichen Agenten)

Jedes Motiv ist ein eigenes Bild im Thema Sternwarte der Alchemisten (nächtliches Observatorium, Alchemielabor, Sternhimmel, Messing, Glas, Pergament). Die Vorschläge sind Anregungen, Details dürfen abweichen. Zum Namen und Effekt passen, keine zwei Motive ähnlich.

| ID | Motiv |
|---|---|
| wetterhahn | Messing Wetterhahn auf einer Turmspitze vor Gewitterwolken |
| drillbohrer | drei Bohrköpfe an einer gemeinsamen Kurbel, Späne |
| viererbund | vier Siegelringe im Quadrat um eine Flamme |
| kleiner_kessel | kleiner Kupferkessel über Feuer, einfarbig grüner Sud, Dampf |
| meilenstein | Meilenstein am Weg mit Kerben, Pfad zum Horizont, Sterne |
| dreiklang | drei Glocken unterschiedlicher Größe nebeneinander |
| viertakt | Metronom mit vier Schlagpunkten, Notenlinie |
| rotwein | Karaffe und Kelch mit rotem Wein, ein Herz im Glas |
| bernstein | Bernsteinbrocken mit eingeschlossenem Stern, warmes Leuchten |
| schiefer | Schiefertafel mit Kreidesternen und Rissen |
| moos | bemooster Stein im Nachtwald, kleine Pilze und Klee |
| zehnkampf | Siegerkranz mit zehn kleinen Sternen im Kreis, römische X |
| warme_stube | Kamin mit Sessel, Herz aus Glut |
| kalter_keller | Gewölbekeller mit Fass, Raureif, Pik Zeichen im Eis |
| sparfuchs | Fuchs mit Münzbeutel im Mondlicht |
| vorsprung | Läufer mit Fackel an einer Startlinie |
| sparstrumpf | prall gefüllter Strumpf, Münzen blitzen heraus |
| spardose | Tonkrug mit Münzschlitz, Goldmünze im Fallen |
| kleiner_zoll | Schlagbaum mit kleinem Zollhaus in der Morgendämmerung |
| mautbruecke | Steinbrücke mit Mauthaus und Laterne in der Abenddämmerung |
| flohmarkt | Marktstand mit Decke, Krimskrams, kleine Lampe |
| sedimente | Sanduhr, deren unteres Glas sich mit Schichten füllt |
| zweitschlag | zwei Hammerschläge nacheinander, zweiter Funke größer |
| mutprobe | Schwertspitze vor einem dunklen Tor mit glühenden Augen |
| federkiel | Schreibfeder im Tintenfass, Pergament |
| perlenschnur | Perlenkette im Bogen, Perlen glänzen |
| einsiedler | Gestalt mit Laterne vor einer Höhle unter Sternen |
| gasthaus | Gasthaus mit Schild, warm erleuchtetes Fenster, Nacht |
| sternschnuppe | Sternschnuppe mit Schweif über dunklen Hügeln |
| kraeuterbeet | Beet mit Heilkräutern, Mörser und Stößel |
| zwillingsmond | zwei Monde nebeneinander in verschiedenen Phasen |
| hausmusik | Spieluhr vor einem Fenster, Noten schweben |
| notnagel | großer rostiger Nagel im Holzbalken, Funke |
| staubwolke | wirbelnde Sternenstaub Wolke mit Glitzerpunkten |
| windhose | Wirbelsturm Trichter mit Blättern und Funken |
| regenbogen | Regenbogen über der Sternwarte Kuppel |
| sternenpfad | Pfad aus Trittsteinen mit Stern Markierungen |
| zwillingspaar | zwei Pärchen Eulen auf einem Ast |
| viererkette | vier goldene Kettenglieder, leuchtend |
| duo | zwei Gestalten mit Lauten, Rücken an Rücken |
| bettelmann | Bettler mit Schale unter dem Mond, eine Münze |
| herzecho | Herz mit konzentrischen Echo Ringen |
| nachtecho | Pik mit Echo Ringen im Nachthimmel |
| glueckszahl | große 7 zwischen Sternen und Würfel |
| kreidestriche | Tafel mit Kreidestrichen in Fünferbündeln |
| verzauberer | Zauberer mit Stab, funkelnde Karte schwebt |
| siegelwart | Siegelring und rotes Wachssiegel mit Stern |
| zehntner | Steuereintreiber mit Schriftrolle und Waage |
| gluecksspieler | Würfelbecher mit fliegenden Würfeln und Karten |
| vierlicht | vier Laternen in vier Farben (Pik, Herz, Karo, Kreuz Töne) |
| gezeitenkalender | Kalender mit Mondphasen und Wellenlinie |
| elixierbrauer | Braukessel mit Flaschenreihe und Brenner |
| orakel | Orakelschale mit Dampf, ein Auge im Rauch |
| himmelsscheibe | runde Bronzescheibe mit Sternbildern, Mittelloch |
| weiter_mantel | Mantel mit Sternenmuster, weit ausgebreitet |
| trophaeensammler | Trophäenwand mit Bosskronen und Hörnern |
| sternuhr | astronomische Uhr mit Zifferblatt und Sternzeichen Ring |
| sonnenkorona | Sonnenfinsternis mit strahlender Korona |
| meisterwerk | Amboss mit glühendem Werkstück, Funkenregen |
| nachtwandler | Schlafwandler mit Laterne auf einem Dach, Vollmond |
| purpurgarde | purpurrote Wache mit Herzschild und Speer |
| kapitalist | Goldwaage mit Münzstapel, Zylinder |
| echokammer | Gewölbe mit Schallwellen Ringen, zwei Karten im Zentrum |
| alles_oder_nichts | Münze, die auf der Kante steht, Sterne drumherum |
| zufallskugel | Glaskugel mit Würfelaugen und Nebel |
| konstellation | Sternbild Karte mit verbundenen Sternen und Linien |
| weltenwanderer | Wanderer mit Stab und Sternkarte vor einer Weltkugel |
| weltenesche | riesiger Baum mit Sternen in der Krone, Wurzeln leuchten |
| goldquelle | Quelle, aus der Goldmünzen sprudeln, Mondlicht |
| urecho | konzentrische Wellen über der Sternwarte Kuppel, Ursprung ein Stern |
| kometenschauer | Schwarm von Kometen mit langen Schweifen |
