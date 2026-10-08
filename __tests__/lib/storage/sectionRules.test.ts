import { sectionColors } from '@/constants/tokens';
import {
  canOpenDivideScreen,
  canToggleVerseOrder,
  isContiguousOrders,
  nextSectionColorKey,
  routeAfterCreate,
  shouldSkipDivide,
  taskIdAfterCreate,
  validateSectionDrafts,
} from '@/lib/storage/sectionRules';
import type { PassageVerse, SectionDraft } from '@/lib/storage/types';

function makeVerse(id: string, order: number): PassageVerse {
  return {
    id,
    passageId: 'passage_1',
    bibleVerseId: `net:john:3:${order + 1}`,
    order,
    chapter: 3,
    verse: order + 1,
    text: `Verse ${order + 1}`,
  };
}

describe('shouldSkipDivide', () => {
  it('skips for 0, 1, and 2 verses', () => {
    expect(shouldSkipDivide(0)).toBe(true);
    expect(shouldSkipDivide(1)).toBe(true);
    expect(shouldSkipDivide(2)).toBe(true);
  });

  it('does not skip for 3 or more verses', () => {
    expect(shouldSkipDivide(3)).toBe(false);
    expect(shouldSkipDivide(10)).toBe(false);
  });
});

describe('taskIdAfterCreate', () => {
  it('returns name_sections when divide is skipped', () => {
    expect(taskIdAfterCreate(1)).toBe('name_sections');
    expect(taskIdAfterCreate(2)).toBe('name_sections');
  });

  it('returns divide_sections for longer passages', () => {
    expect(taskIdAfterCreate(3)).toBe('divide_sections');
  });
});

describe('isContiguousOrders', () => {
  it('accepts empty, single, and consecutive runs', () => {
    expect(isContiguousOrders([])).toBe(true);
    expect(isContiguousOrders([4])).toBe(true);
    expect(isContiguousOrders([2, 0, 1])).toBe(true);
  });

  it('rejects gaps', () => {
    expect(isContiguousOrders([0, 2])).toBe(false);
  });
});

describe('canToggleVerseOrder', () => {
  it('rejects already-assigned verses', () => {
    expect(canToggleVerseOrder([0], 1, true)).toEqual({
      ok: false,
      reason: 'assigned',
    });
  });

  it('allows removing a currently selected order', () => {
    expect(canToggleVerseOrder([0, 1], 1, false)).toEqual({ ok: true });
  });

  it('allows growing the selection at either end', () => {
    expect(canToggleVerseOrder([1, 2], 0, false)).toEqual({ ok: true });
    expect(canToggleVerseOrder([1, 2], 3, false)).toEqual({ ok: true });
  });

  it('rejects non-contiguous adds', () => {
    expect(canToggleVerseOrder([0, 1], 3, false)).toEqual({
      ok: false,
      reason: 'non_contiguous',
    });
  });
});

describe('validateSectionDrafts', () => {
  const verses = [makeVerse('a', 0), makeVerse('b', 1), makeVerse('c', 2)];

  it('accepts a full contiguous partition', () => {
    const drafts: SectionDraft[] = [
      { passageVerseIds: ['a', 'b'] },
      { passageVerseIds: ['c'] },
    ];
    expect(() => validateSectionDrafts(verses, drafts)).not.toThrow();
  });

  it('rejects empty drafts list', () => {
    expect(() => validateSectionDrafts(verses, [])).toThrow(
      'Add at least one section before continuing.',
    );
  });

  it('rejects an empty section', () => {
    expect(() =>
      validateSectionDrafts(verses, [{ passageVerseIds: [] }]),
    ).toThrow('Each section must contain at least one verse.');
  });

  it('rejects overlapping verse assignment', () => {
    expect(() =>
      validateSectionDrafts(verses, [
        { passageVerseIds: ['a', 'b'] },
        { passageVerseIds: ['b', 'c'] },
      ]),
    ).toThrow('A verse can only belong to one section.');
  });

  it('rejects a gap inside a section', () => {
    expect(() =>
      validateSectionDrafts(verses, [{ passageVerseIds: ['a', 'c'] }]),
    ).toThrow('Section verses must be contiguous in the passage.');
  });

  it('rejects incomplete coverage', () => {
    expect(() =>
      validateSectionDrafts(verses, [{ passageVerseIds: ['a', 'b'] }]),
    ).toThrow('Every verse in the passage must be assigned to a section.');
  });

  it('rejects unknown passage verse ids', () => {
    expect(() =>
      validateSectionDrafts(verses, [{ passageVerseIds: ['missing'] }]),
    ).toThrow('Passage verse not found: missing');
  });
});

describe('nextSectionColorKey', () => {
  it('returns the index within the palette', () => {
    expect(nextSectionColorKey(0)).toBe(0);
    expect(nextSectionColorKey(3)).toBe(3);
  });

  it('wraps beyond the palette length', () => {
    expect(nextSectionColorKey(sectionColors.length)).toBe(0);
    expect(nextSectionColorKey(sectionColors.length + 2)).toBe(2);
  });
});

describe('canOpenDivideScreen', () => {
  it('opens only for divide_sections with 3+ verses', () => {
    expect(
      canOpenDivideScreen({ currentTaskId: 'divide_sections', verseCount: 3 }),
    ).toBe(true);
    expect(
      canOpenDivideScreen({ currentTaskId: 'divide_sections', verseCount: 2 }),
    ).toBe(false);
    expect(
      canOpenDivideScreen({ currentTaskId: 'name_sections', verseCount: 5 }),
    ).toBe(false);
  });
});

describe('routeAfterCreate', () => {
  it('routes divide_sections to sections and everything else home', () => {
    expect(routeAfterCreate('divide_sections')).toBe('sections');
    expect(routeAfterCreate('name_sections')).toBe('home');
    expect(routeAfterCreate('read_section')).toBe('home');
  });
});
