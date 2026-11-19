#!/usr/bin/env python3
"""
Erzeugt die Titelschrift "Alatro Karte" (src/assets/alatro-karte.ttf).

Eigenentwurf nur für die Buchstaben auf den Titelkarten im Home Bildschirm (A, L, T, R, O).
Kantige, schwere Großbuchstaben mit abgeschrägten Ecken wie gemeißelt. Der Innenraum von A und O
ist ein Vierzackstern, das Thema der Sternwarte. Alle Formen sind Polygone, kein Raster.

Maße: 1000 Einheiten pro Em, Versalhöhe 700. Ascent und Descent sind so gewählt, dass die
Versalmitte genau in der Mitte der Zeilenbox liegt (Text mit anchor 0.5 sitzt dann mittig).

Aufruf:  python3 tools/titlefont.py
Benötigt: pip install fonttools shapely
"""
import os

from fontTools.fontBuilder import FontBuilder
from fontTools.pens.ttGlyphPen import TTGlyphPen
from shapely import affinity
from shapely.geometry import Polygon, box
from shapely.geometry.polygon import orient
from shapely.ops import unary_union

UPM = 1000
CAP = 700
ASCENT = 850
DESCENT = -150
SIDE = 50      # Abstand links und rechts neben jedem Buchstaben
CHAMFER = 26   # Abschrägung der äußeren Ecken


def star(cx, cy, rx, ry, pinch):
    """Vierzackstern: Spitzen rechts, oben, links, unten, dazwischen eingezogen."""
    ix, iy = rx * pinch, ry * pinch
    return Polygon([
        (cx + rx, cy), (cx + ix, cy + iy), (cx, cy + ry), (cx - ix, cy + iy),
        (cx - rx, cy), (cx - ix, cy - iy), (cx, cy - ry), (cx + ix, cy - iy),
    ])


def glyph_a():
    body = Polygon([(0, 0), (230, CAP), (410, CAP), (640, 0), (470, 0), (437, 150), (203, 150), (170, 0)])
    return body.difference(star(320, 380, 112, 140, 0.34))


def glyph_l():
    return Polygon([(0, 0), (520, 0), (520, 150), (180, 150), (180, CAP), (0, CAP)])


def glyph_t():
    return Polygon([(0, CAP), (560, CAP), (560, 550), (365, 550), (365, 0), (195, 0), (195, 550), (0, 550)])


def glyph_r():
    stem = box(0, 0, 180, CAP)
    bowl = Polygon([(0, CAP), (400, CAP), (570, 630), (570, 400), (400, 300), (0, 300)])
    leg = Polygon([(250, 320), (430, 320), (610, 0), (410, 0)])
    counter = Polygon([(180, 555), (355, 555), (400, 515), (400, 440), (355, 405), (180, 405)])
    return unary_union([stem, bowl, leg]).difference(counter)


def glyph_o():
    ring = Polygon([(170, 0), (470, 0), (640, 170), (640, 530), (470, CAP), (170, CAP), (0, 530), (0, 170)])
    return ring.difference(star(320, 350, 200, 255, 0.3))


GLYPHS = {'A': glyph_a, 'L': glyph_l, 'T': glyph_t, 'R': glyph_r, 'O': glyph_o}


def chamfer(shape):
    """Äußere Ecken abschrägen (Öffnen mit Fase), Innenräume bleiben scharf."""
    return shape.buffer(-CHAMFER, join_style=3).buffer(CHAMFER, join_style=3)


def draw(pen, shape):
    polys = [shape] if shape.geom_type == 'Polygon' else list(shape.geoms)
    for poly in polys:
        poly = orient(poly, sign=-1.0)  # TrueType: außen im Uhrzeigersinn
        for ring in [poly.exterior] + list(poly.interiors):
            pts = [(round(x), round(y)) for x, y in list(ring.coords)[:-1]]
            pen.moveTo(pts[0])
            for p in pts[1:]:
                pen.lineTo(p)
            pen.closePath()


def build(path):
    chars = sorted(GLYPHS, key=ord)
    names = {c: 'uni%04X' % ord(c) for c in chars}
    glyphs, metrics = {}, {}

    pen = TTGlyphPen(None)
    pen.moveTo((0, 0)); pen.lineTo((0, CAP)); pen.lineTo((500, CAP)); pen.lineTo((500, 0)); pen.closePath()
    glyphs['.notdef'] = pen.glyph()
    metrics['.notdef'] = (600, 0)

    for c in chars:
        shape = chamfer(GLYPHS[c]())
        x0, _, x1, _ = shape.bounds
        shape = affinity.translate(shape, xoff=SIDE - x0)
        pen = TTGlyphPen(None)
        draw(pen, shape)
        glyphs[names[c]] = pen.glyph()
        metrics[names[c]] = (round(x1 - x0) + 2 * SIDE, SIDE)

    fb = FontBuilder(UPM, isTTF=True)
    fb.setupGlyphOrder(['.notdef'] + [names[c] for c in chars])
    fb.setupCharacterMap({ord(c): names[c] for c in chars})
    fb.setupGlyf(glyphs)
    fb.setupHorizontalMetrics(metrics)
    fb.setupHorizontalHeader(ascent=ASCENT, descent=DESCENT, lineGap=0)
    fb.setupNameTable({'familyName': 'Alatro Karte', 'styleName': 'Regular'})
    fb.setupOS2(
        version=4,
        sTypoAscender=ASCENT, sTypoDescender=DESCENT, sTypoLineGap=0,
        usWinAscent=ASCENT, usWinDescent=-DESCENT,
        fsSelection=0x80 | 0x40, xAvgCharWidth=600,
    )
    fb.setupPost()
    fb.save(path)
    print(f'{len(chars)} Glyphen -> {path}')


if __name__ == '__main__':
    root = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
    out = os.path.join(root, 'src', 'assets')
    os.makedirs(out, exist_ok=True)
    build(os.path.join(out, 'alatro-karte.ttf'))
