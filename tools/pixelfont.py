#!/usr/bin/env python3
"""
Erzeugt die eigene Pixel Schrift "Alatro Pixel" (src/assets/alatro-pixel.ttf).

Alle Glyphen sind hier von Hand als Pixelraster gezeichnet (Eigenentwurf, kein fremder Font).
Raster: 11 Zeilen. Zeile 0 und 1 für Punkte über Großbuchstaben, Großbuchstaben und Ziffern
in Zeile 2 bis 8 (7 Pixel hoch), Kleinbuchstaben ohne Oberlänge in Zeile 4 bis 8, Unterlängen
in Zeile 9 und 10. Die Grundlinie liegt unter Zeile 8. Ein Pixel sind 100 Einheiten, die
Schrift hat 900 Einheiten pro Em. Ein Pixel ist also Schriftgröße geteilt durch 9.

Aufruf:  python3 tools/pixelfont.py
Benötigt: pip install fonttools
"""
import os
import sys

from fontTools.fontBuilder import FontBuilder
from fontTools.pens.ttGlyphPen import TTGlyphPen

PX = 100          # Einheiten pro Pixel
UPM = 900
BASE_ROW = 8      # letzte Zeile über der Grundlinie
ASCENT = 900
DESCENT = -200

CAP = 2           # Startzeile Großbuchstaben, Ziffern, Oberlängen
XH = 4            # Startzeile Kleinbuchstaben ohne Oberlänge

G = {}  # Zeichen -> (Startzeile, Zeilen)


def g(ch, top, rows):
    rows = [r.strip() for r in rows.strip().split('\n')]
    w = len(rows[0])
    for r in rows:
        if len(r) != w:
            sys.exit(f'Glyph {ch!r}: ungleiche Zeilenbreite {r!r}')
    G[ch] = (top, rows)


# ───────────────────────────────────────────── Großbuchstaben
g('A', CAP, '''
.###.
#...#
#...#
#####
#...#
#...#
#...#''')
g('B', CAP, '''
####.
#...#
#...#
####.
#...#
#...#
####.''')
g('C', CAP, '''
.###.
#...#
#....
#....
#....
#...#
.###.''')
g('D', CAP, '''
####.
#...#
#...#
#...#
#...#
#...#
####.''')
g('E', CAP, '''
#####
#....
#....
####.
#....
#....
#####''')
g('F', CAP, '''
#####
#....
#....
####.
#....
#....
#....''')
g('G', CAP, '''
.###.
#...#
#....
#.###
#...#
#...#
.###.''')
g('H', CAP, '''
#...#
#...#
#...#
#####
#...#
#...#
#...#''')
g('I', CAP, '''
###
.#.
.#.
.#.
.#.
.#.
###''')
g('J', CAP, '''
....#
....#
....#
....#
#...#
#...#
.###.''')
g('K', CAP, '''
#...#
#..#.
#.#..
##...
#.#..
#..#.
#...#''')
g('L', CAP, '''
#....
#....
#....
#....
#....
#....
#####''')
g('M', CAP, '''
#...#
##.##
#.#.#
#.#.#
#...#
#...#
#...#''')
g('N', CAP, '''
#...#
##..#
#.#.#
#..##
#...#
#...#
#...#''')
g('O', CAP, '''
.###.
#...#
#...#
#...#
#...#
#...#
.###.''')
g('P', CAP, '''
####.
#...#
#...#
####.
#....
#....
#....''')
g('Q', CAP, '''
.###.
#...#
#...#
#...#
#.#.#
#..#.
.##.#''')
g('R', CAP, '''
####.
#...#
#...#
####.
#.#..
#..#.
#...#''')
g('S', CAP, '''
.####
#....
#....
.###.
....#
....#
####.''')
g('T', CAP, '''
#####
..#..
..#..
..#..
..#..
..#..
..#..''')
g('U', CAP, '''
#...#
#...#
#...#
#...#
#...#
#...#
.###.''')
g('V', CAP, '''
#...#
#...#
#...#
#...#
#...#
.#.#.
..#..''')
g('W', CAP, '''
#...#
#...#
#...#
#.#.#
#.#.#
##.##
#...#''')
g('X', CAP, '''
#...#
#...#
.#.#.
..#..
.#.#.
#...#
#...#''')
g('Y', CAP, '''
#...#
#...#
.#.#.
..#..
..#..
..#..
..#..''')
g('Z', CAP, '''
#####
....#
...#.
..#..
.#...
#....
#####''')

# ───────────────────────────────────────────── Ziffern
g('0', CAP, '''
.###.
#...#
#..##
#.#.#
##..#
#...#
.###.''')
g('1', CAP, '''
..#.
.##.
#.#.
..#.
..#.
..#.
####''')
g('2', CAP, '''
.###.
#...#
....#
...#.
..#..
.#...
#####''')
g('3', CAP, '''
####.
....#
....#
.###.
....#
....#
####.''')
g('4', CAP, '''
...#.
..##.
.#.#.
#..#.
#####
...#.
...#.''')
g('5', CAP, '''
#####
#....
####.
....#
....#
#...#
.###.''')
g('6', CAP, '''
.###.
#....
#....
####.
#...#
#...#
.###.''')
g('7', CAP, '''
#####
....#
...#.
..#..
.#...
.#...
.#...''')
g('8', CAP, '''
.###.
#...#
#...#
.###.
#...#
#...#
.###.''')
g('9', CAP, '''
.###.
#...#
#...#
.####
....#
....#
.###.''')

# ───────────────────────────────────────────── Kleinbuchstaben
g('a', XH, '''
.###.
....#
.####
#...#
.####''')
g('b', CAP, '''
#....
#....
####.
#...#
#...#
#...#
####.''')
g('c', XH, '''
.###.
#...#
#....
#...#
.###.''')
g('d', CAP, '''
....#
....#
.####
#...#
#...#
#...#
.####''')
g('e', XH, '''
.###.
#...#
#####
#....
.###.''')
g('f', CAP, '''
..##
.#..
###.
.#..
.#..
.#..
.#..''')
g('g', XH, '''
.####
#...#
#...#
.####
....#
#...#
.###.''')
g('h', CAP, '''
#....
#....
#.##.
##..#
#...#
#...#
#...#''')
g('i', CAP, '''
.
#
.
#
#
#
#''')
g('j', CAP, '''
..
.#
..
.#
.#
.#
.#
.#
##''')
g('k', CAP, '''
#....
#....
#..#.
#.#..
##...
#.#..
#..#.''')
g('l', CAP, '''
##.
.#.
.#.
.#.
.#.
.#.
.##''')
g('m', XH, '''
##.#.
#.#.#
#.#.#
#.#.#
#.#.#''')
g('n', XH, '''
####.
#...#
#...#
#...#
#...#''')
g('o', XH, '''
.###.
#...#
#...#
#...#
.###.''')
g('p', XH, '''
####.
#...#
#...#
####.
#....
#....
#....''')
g('q', XH, '''
.####
#...#
#...#
.####
....#
....#
....#''')
g('r', XH, '''
#.##
##..
#...
#...
#...''')
g('s', XH, '''
.####
#....
.###.
....#
####.''')
g('t', 3, '''
.#..
###.
.#..
.#..
.#..
..##''')
g('u', XH, '''
#...#
#...#
#...#
#...#
.####''')
g('v', XH, '''
#...#
#...#
#...#
.#.#.
..#..''')
g('w', XH, '''
#...#
#...#
#.#.#
#.#.#
.#.#.''')
g('x', XH, '''
#...#
.#.#.
..#..
.#.#.
#...#''')
g('y', XH, '''
#...#
#...#
#...#
.####
....#
#...#
.###.''')
g('z', XH, '''
#####
...#.
..#..
.#...
#####''')

# ───────────────────────────────────────────── Umlaute und ß
g('ä', 2, '''
.#.#.
.....
.###.
....#
.####
#...#
.####''')
g('ö', 2, '''
.#.#.
.....
.###.
#...#
#...#
#...#
.###.''')
g('ü', 2, '''
.#.#.
.....
#...#
#...#
#...#
#...#
.####''')
g('Ä', 0, '''
.#.#.
.....
.###.
#...#
#...#
#####
#...#
#...#
#...#''')
g('Ö', 0, '''
.#.#.
.....
.###.
#...#
#...#
#...#
#...#
#...#
.###.''')
g('Ü', 0, '''
.#.#.
.....
#...#
#...#
#...#
#...#
#...#
#...#
.###.''')
g('ß', CAP, '''
.###.
#...#
#...#
####.
#...#
#...#
#.##.''')

# ───────────────────────────────────────────── Satzzeichen und Symbole
g(' ', CAP, '''
...''')
g('!', CAP, '''
#
#
#
#
#
.
#''')
g('?', CAP, '''
.###.
#...#
....#
..##.
..#..
.....
..#..''')
g('"', CAP, '''
#.#
#.#''')
g("'", CAP, '''
#
#''')
g('.', 8, '''
#''')
g(',', 8, '''
.#
#.''')
g(':', 5, '''
#
.
.
#''')
g(';', 5, '''
.#
..
..
.#
#.''')
g('-', 6, '''
###''')
g('+', 4, '''
..#..
..#..
#####
..#..
..#..''')
g('=', 5, '''
#####
.....
#####''')
g('/', CAP, '''
....#
....#
...#.
..#..
.#...
#....
#....''')
g('\\', CAP, '''
#....
#....
.#...
..#..
...#.
....#
....#''')
g('(', CAP, '''
..#
.#.
#..
#..
#..
.#.
..#''')
g(')', CAP, '''
#..
.#.
..#
..#
..#
.#.
#..''')
g('[', CAP, '''
##
#.
#.
#.
#.
#.
##''')
g(']', CAP, '''
##
.#
.#
.#
.#
.#
##''')
g('{', CAP, '''
..#
.#.
.#.
#..
.#.
.#.
..#''')
g('}', CAP, '''
#..
.#.
.#.
..#
.#.
.#.
#..''')
g('<', 4, '''
..#
.#.
#..
.#.
..#''')
g('>', 4, '''
#..
.#.
..#
.#.
#..''')
g('_', 9, '''
#####''')
g('*', 3, '''
..#..
#.#.#
.###.
#.#.#
..#..''')
g('#', CAP, '''
.#.#.
.#.#.
#####
.#.#.
#####
.#.#.
.#.#.''')
g('%', CAP, '''
##..#
##..#
...#.
..#..
.#...
#..##
#..##''')
g('&', CAP, '''
.##..
#..#.
#..#.
.##..
#.#.#
#..#.
.##.#''')
g('@', CAP, '''
.###.
#...#
#.###
#.#.#
#.###
#....
.###.''')
g('$', CAP, '''
..#..
.####
#.#..
.###.
..#.#
####.
..#..''')
g('~', 5, '''
.##.#
#..#.''')
g('|', CAP, '''
#
#
#
#
#
#
#
#
#''')
g('^', CAP, '''
..#..
.#.#.
#...#''')
g('`', CAP, '''
#.
.#''')
g('€', CAP, '''
..###
.#...
####.
.#...
####.
.#...
..###''')

# Sonderzeichen aus dem Spiel
g('×', 5, '''
#.#
.#.
#.#''')
g('−', 6, '''
#####''')
g('–', 6, '''
####''')
g('—', 6, '''
######''')
g('·', 6, '''
#''')
g('•', 5, '''
.#.
###
.#.''')
g('‹', 5, '''
.#
#.
.#''')
g('›', 5, '''
#.
.#
#.''')
g('→', 4, '''
...#...
....#..
#######
....#..
...#...''')
g('◆', CAP, '''
...#...
..###..
.#####.
#######
.#####.
..###..
...#...''')
g('♦', CAP, '''
...#...
..###..
.#####.
#######
.#####.
..###..
...#...''')
g('●', CAP, '''
..###..
.#####.
#######
#######
#######
.#####.
..###..''')
g('✕', CAP, '''
#.....#
.#...#.
..#.#..
...#...
..#.#..
.#...#.
#.....#''')
g('☠', CAP, '''
.#####.
#######
##.#.##
#######
.#####.
..#.#..
..###..''')
g('♠', CAP, '''
...#...
..###..
.#####.
#######
#######
...#...
..###..''')
g('♥', CAP, '''
.##.##.
#######
#######
#######
.#####.
..###..
...#...''')
g('♣', CAP, '''
..###..
..###..
#.###.#
#######
#.###.#
...#...
..###..''')


def glyph_name(ch):
    return 'uni%04X' % ord(ch)


def rects(top, rows):
    """Zerlegt das Raster in Rechtecke (x0, y0, x1, y1) in Schrifteinheiten."""
    runs = []  # (zeile, x0, x1)
    for i, row in enumerate(rows):
        x = 0
        while x < len(row):
            if row[x] == '#':
                s = x
                while x < len(row) and row[x] == '#':
                    x += 1
                runs.append((top + i, s, x))
            else:
                x += 1
    # gleiche Läufe in aufeinanderfolgenden Zeilen zu höheren Rechtecken verbinden
    merged = []
    open_ = {}
    for r, x0, x1 in sorted(runs):
        key = (x0, x1)
        if key in open_ and open_[key][1] == r - 1:
            open_[key][1] = r
        else:
            if key in open_:
                merged.append((key, open_[key]))
            open_[key] = [r, r]
    for key, v in open_.items():
        merged.append((key, v))
    out = []
    for (x0, x1), (r0, r1) in merged:
        y_top = (BASE_ROW + 1 - r0) * PX
        y_bot = (BASE_ROW - r1) * PX
        out.append((x0 * PX, y_bot, x1 * PX, y_top))
    return out


def build(path):
    chars = sorted(G.keys(), key=ord)
    order = ['.notdef'] + [glyph_name(c) for c in chars]
    glyphs = {}
    metrics = {}

    # .notdef: Kasten
    pen = TTGlyphPen(None)
    for (x0, y0, x1, y1) in [(0, 200, 500, 900)]:
        pen.moveTo((x0, y0)); pen.lineTo((x0, y1)); pen.lineTo((x1, y1)); pen.lineTo((x1, y0)); pen.closePath()
    for (x0, y0, x1, y1) in [(100, 300, 400, 800)]:
        pen.moveTo((x0, y0)); pen.lineTo((x1, y0)); pen.lineTo((x1, y1)); pen.lineTo((x0, y1)); pen.closePath()
    glyphs['.notdef'] = pen.glyph()
    metrics['.notdef'] = (600, 0)

    cmap = {}
    for ch in chars:
        top, rows = G[ch]
        w = len(rows[0])
        pen = TTGlyphPen(None)
        for (x0, y0, x1, y1) in rects(top, rows):
            pen.moveTo((x0, y0)); pen.lineTo((x0, y1)); pen.lineTo((x1, y1)); pen.lineTo((x1, y0)); pen.closePath()
        name = glyph_name(ch)
        glyphs[name] = pen.glyph()
        metrics[name] = ((w + 1) * PX, 0)
        cmap[ord(ch)] = name
    # geschütztes Leerzeichen wie Leerzeichen
    cmap[0xA0] = glyph_name(' ')

    fb = FontBuilder(UPM, isTTF=True)
    fb.setupGlyphOrder(order)
    fb.setupCharacterMap(cmap)
    fb.setupGlyf(glyphs)
    fb.setupHorizontalMetrics({n: (adv, lsb) for n, (adv, lsb) in metrics.items()})
    fb.setupHorizontalHeader(ascent=ASCENT, descent=DESCENT, lineGap=0)
    fb.setupNameTable({'familyName': 'Alatro Pixel', 'styleName': 'Regular'})
    fb.setupOS2(
        version=4,
        sTypoAscender=ASCENT, sTypoDescender=DESCENT, sTypoLineGap=0,
        usWinAscent=ASCENT, usWinDescent=-DESCENT,
        fsSelection=0x80 | 0x40, xAvgCharWidth=500,
    )
    fb.setupPost()
    fb.save(path)
    print(f'{len(chars)} Glyphen -> {path}')


if __name__ == '__main__':
    root = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
    out = os.path.join(root, 'src', 'assets')
    os.makedirs(out, exist_ok=True)
    build(os.path.join(out, 'alatro-pixel.ttf'))
