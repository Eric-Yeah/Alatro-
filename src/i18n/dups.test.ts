import { describe, expect, it } from 'vitest';

const modules = import.meta.glob('./en/*.ts', { eager: true }) as Record<string, { default: Record<string, string> }>;

describe('Wörterbücher', () => {
  it('ein Schlüssel in mehreren Dateien hat überall denselben englischen Wert', () => {
    const seen = new Map<string, { file: string; value: string }>();
    const diffs: string[] = [];
    for (const path of Object.keys(modules).sort()) {
      for (const [de, en] of Object.entries(modules[path].default)) {
        const prev = seen.get(de);
        if (!prev) seen.set(de, { file: path, value: en });
        else if (prev.value !== en) diffs.push(`${JSON.stringify(de)}: ${prev.file} "${prev.value}" gegen ${path} "${en}"`);
      }
    }
    expect(diffs).toEqual([]);
  });
});
