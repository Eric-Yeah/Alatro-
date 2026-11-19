import { describe, expect, it } from 'vitest';
import { MUSIC, MUSIC_OFF, TRACKS, TRACK_IDS, getTrack } from './data/music';
import { DEFAULT_SETTINGS } from './data/juice';
import { parseSettings } from './settings';
import { composeSegment, noteFreq } from './ui/musicScore';

describe('Hintergrundmusik: Daten', () => {
  it('hat mindestens zwei Stücke mit eindeutigen IDs und ohne Kollision mit "aus"', () => {
    expect(TRACKS.length).toBeGreaterThanOrEqual(2);
    expect(new Set(TRACK_IDS).size).toBe(TRACKS.length);
    expect(TRACK_IDS).not.toContain(MUSIC_OFF);
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

  it('Standard Einstellung nennt ein vorhandenes Stück', () => {
    expect(getTrack(DEFAULT_SETTINGS.music)).toBeDefined();
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
        expect(base).toBeGreaterThanOrEqual(t.melody.notes[0]);
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

describe('Hintergrundmusik: Einstellungen', () => {
  it('nimmt gültige Stücke und "aus" an, ersetzt ungültige', () => {
    expect(parseSettings({ music: MUSIC_OFF }).music).toBe(MUSIC_OFF);
    expect(parseSettings({ music: TRACK_IDS[1] }).music).toBe(TRACK_IDS[1]);
    expect(parseSettings({ music: 'unbekannt' }).music).toBe(DEFAULT_SETTINGS.music);
    expect(parseSettings({ music: 5 }).music).toBe(DEFAULT_SETTINGS.music);
  });

  it('begrenzt die Musiklautstärke', () => {
    expect(parseSettings({ musicVolume: 9 }).musicVolume).toBe(1);
    expect(parseSettings({ musicVolume: -1 }).musicVolume).toBe(0);
    expect(parseSettings({ musicVolume: 'laut' }).musicVolume).toBe(DEFAULT_SETTINGS.musicVolume);
  });
});
