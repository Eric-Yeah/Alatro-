import { describe, expect, it } from 'vitest';
import { MUSIC, MUSIC_MIX, MUSIC_OFF, TRACKS, TRACK_IDS, getTrack, tracksFor } from './data/music';
import { DEFAULT_SETTINGS } from './data/juice';
import { parseSettings } from './settings';
import { MusicPlanner, composeSegment, noteFreq } from './ui/musicScore';

describe('Hintergrundmusik: Daten', () => {
  it('hat mindestens zwei Stücke mit eindeutigen IDs und ohne Kollision mit "aus"', () => {
    expect(TRACKS.length).toBeGreaterThanOrEqual(2);
    expect(new Set(TRACK_IDS).size).toBe(TRACKS.length);
    expect(TRACK_IDS).not.toContain(MUSIC_OFF);
    expect(TRACK_IDS).not.toContain(MUSIC_MIX);
    for (const t of TRACKS) expect(getTrack(t.id)).toBe(t);
  });

  it('hat keinen Bass: der tiefste Flächenton liegt über der Grenze', () => {
    for (const t of TRACKS) {
      for (const chord of t.chords) for (const s of chord) expect(noteFreq(t.root, s)).toBeGreaterThanOrEqual(MUSIC.minFreq);
    }
  });

  it('hat sinnvolle Zahlen', () => {
    for (const t of TRACKS) {
      expect(t.chords.length).toBeGreaterThan(1);
      expect(t.chordSec).toBeGreaterThan(t.pad.attack);
      expect(t.chordSec).toBeGreaterThan(t.pad.release);
      expect(t.melody.low).toBeLessThan(t.melody.high);
      expect(t.melody.notes[0]).toBeLessThanOrEqual(t.melody.notes[1]);
      expect(t.level).toBeGreaterThan(0);
      expect(t.echo.feedback).toBeLessThan(0.8);
      expect(t.info.length).toBeLessThanOrEqual(MUSIC.infoMax);
    }
  });

  it('Standard Einstellung ist ein gültiger Wert', () => {
    expect(tracksFor(DEFAULT_SETTINGS.music).length).toBeGreaterThan(0);
  });

  it('tracksFor liefert beim Mix alle Stücke, sonst eines oder keines', () => {
    expect(tracksFor(MUSIC_MIX)).toHaveLength(TRACKS.length);
    expect(tracksFor(TRACK_IDS[1])).toEqual([TRACKS[1]]);
    expect(tracksFor(MUSIC_OFF)).toEqual([]);
    expect(tracksFor('unbekannt')).toEqual([]);
  });

  it('Pad Breite und Ruhe Wahrscheinlichkeit liegen zwischen 0 und 1', () => {
    for (const t of TRACKS) {
      expect(t.pad.width).toBeGreaterThanOrEqual(0);
      expect(t.pad.width).toBeLessThanOrEqual(1);
      expect(t.melody.rest).toBeGreaterThanOrEqual(0);
      expect(t.melody.rest).toBeLessThan(1);
    }
    expect(MUSIC.mixFadeSec).toBeLessThan(MUSIC.mixChords * Math.min(...TRACKS.map((t) => t.chordSec)));
  });
});

describe('Hintergrundmusik: Komposition', () => {
  it('ist bei gleichem Seed identisch und bei anderem Seed verschieden', () => {
    for (const t of TRACKS) {
      expect(composeSegment(t, 3, 42)).toEqual(composeSegment(t, 3, 42));
      expect(composeSegment(t, 3, 42)).not.toEqual(composeSegment(t, 3, 43));
    }
  });

  it('hält Zahl, Zeit und Tonraum der Glocken ein', () => {
    for (const t of TRACKS) {
      for (let i = 0; i < 12; i++) {
        const seg = composeSegment(t, i, 7 + i);
        const base = seg.bells.length;
        expect(base).toBeGreaterThanOrEqual(1);
        expect(base).toBeLessThanOrEqual(t.melody.notes[1] * 2);
        const lo = noteFreq(t.root, t.melody.low) - 0.01;
        const hi = noteFreq(t.root, t.melody.high) + 0.01;
        let last = -1;
        for (const b of seg.bells) {
          expect(b.freq).toBeGreaterThanOrEqual(lo);
          expect(b.freq).toBeLessThanOrEqual(hi);
          expect(b.t).toBeGreaterThanOrEqual(0);
          expect(b.t).toBeLessThan(t.chordSec + 1);
          expect(b.t).toBeGreaterThanOrEqual(last);
          expect(Math.abs(b.pan)).toBeLessThanOrEqual(t.melody.pan);
          last = b.t;
        }
      }
    }
  });

  it('läuft den Akkordkreislauf der Reihe nach durch', () => {
    const t = TRACKS[0];
    const n = t.chords.length;
    expect(composeSegment(t, 0, 1).chord).toEqual(composeSegment(t, n, 99).chord);
    expect(composeSegment(t, 1, 1).chord).not.toEqual(composeSegment(t, 0, 1).chord);
  });

  it('legt die Glocken nicht auf ein festes Raster (kein Beat)', () => {
    for (const t of TRACKS) {
      const gaps = new Set<number>();
      for (let i = 0; i < 6; i++) {
        const b = composeSegment(t, i, 5).bells;
        for (let k = 1; k < b.length; k++) gaps.add(Math.round((b[k].t - b[k - 1].t) * 20));
      }
      expect(gaps.size).toBeGreaterThan(5);
    }
  });
});

describe('Hintergrundmusik: Mix', () => {
  it('wechselt nach der festen Zahl Akkorde zum nächsten Stück, der Reihe nach und im Kreis', () => {
    const plan = new MusicPlanner(TRACKS, 0, MUSIC.mixChords, 1);
    const seen: string[] = [];
    let time = 0;
    for (let i = 0; i < MUSIC.mixChords * (TRACKS.length + 1); i++) {
      const it = plan.step();
      expect(it.time).toBeCloseTo(time);
      time += it.track.chordSec;
      if (it.first) {
        seen.push(it.track.id);
        expect(it.index).toBe(0);
      }
    }
    expect(seen).toEqual([TRACKS[1].id, TRACKS[2].id, TRACKS[0].id, TRACKS[1].id]);
  });

  it('bleibt bei einem einzelnen Stück endlos dabei und meldet nur einmal einen Anfang', () => {
    const plan = new MusicPlanner([TRACKS[0]], 5, MUSIC.mixChords);
    let firsts = 0;
    for (let i = 0; i < 40; i++) if (plan.step().first) firsts++;
    expect(firsts).toBe(1);
  });

  it('zählt den Aufenthalt hoch, damit jede Runde andere Glocken bekommt', () => {
    const plan = new MusicPlanner(TRACKS, 0, 2);
    const stays = Array.from({ length: 8 }, () => plan.step().stay);
    expect(stays).toEqual([0, 0, 1, 1, 2, 2, 3, 3]);
  });
});

describe('Hintergrundmusik: Einstellungen', () => {
  it('nimmt gültige Stücke und "aus" an, ersetzt ungültige', () => {
    expect(parseSettings({ music: MUSIC_OFF }).music).toBe(MUSIC_OFF);
    expect(parseSettings({ music: TRACK_IDS[1] }).music).toBe(TRACK_IDS[1]);
    expect(parseSettings({ music: MUSIC_MIX }).music).toBe(MUSIC_MIX);
    expect(parseSettings({ music: 'unbekannt' }).music).toBe(DEFAULT_SETTINGS.music);
    expect(parseSettings({ music: 5 }).music).toBe(DEFAULT_SETTINGS.music);
  });

  it('begrenzt die Musiklautstärke', () => {
    expect(parseSettings({ musicVolume: 9 }).musicVolume).toBe(1);
    expect(parseSettings({ musicVolume: -1 }).musicVolume).toBe(0);
    expect(parseSettings({ musicVolume: 'laut' }).musicVolume).toBe(DEFAULT_SETTINGS.musicVolume);
  });
});
