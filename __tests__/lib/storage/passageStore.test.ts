import AsyncStorage from '@react-native-async-storage/async-storage';

import { bibleTextService } from '@/lib/bible/BibleTextService';
import {
  createPassageFromVerseRefs,
  getPassageRecord,
  listPassages,
  savePassageSections,
  type PassageRecord,
  type VerseSelectionRef,
} from '@/lib/storage';

jest.mock('@/lib/bible/BibleTextService', () => ({
  bibleTextService: {
    isAvailable: jest.fn(),
    getChapterVerses: jest.fn(),
  },
}));

const mockedBible = bibleTextService as jest.Mocked<typeof bibleTextService>;

function ref(chapter: number, verse: number, bookId = 'john'): VerseSelectionRef {
  return { bookId, chapter, verse };
}

function chapterVerses(
  bookId: string,
  chapter: number,
  count: number,
): Array<{
  translationId: string;
  bookId: string;
  chapter: number;
  verse: number;
  text: string;
}> {
  return Array.from({ length: count }, (_, index) => ({
    translationId: 'net',
    bookId,
    chapter,
    verse: index + 1,
    text: `Text ${chapter}:${index + 1}`,
  }));
}

beforeEach(async () => {
  await AsyncStorage.clear();
  jest.clearAllMocks();
  mockedBible.isAvailable.mockResolvedValue(true);
  mockedBible.getChapterVerses.mockImplementation(async (_t, bookId, chapter) => {
    if (bookId === 'john' && chapter === 3) {
      return chapterVerses('john', 3, 20);
    }
    if (bookId === 'john' && chapter === 4) {
      return chapterVerses('john', 4, 5);
    }
    return [];
  });
});

describe('createPassageFromVerseRefs', () => {
  it('rejects an empty selection', async () => {
    await expect(createPassageFromVerseRefs('net', 'john', [])).rejects.toThrow(
      'Select at least one verse to create a passage.',
    );
  });

  it('rejects unavailable translations', async () => {
    mockedBible.isAvailable.mockResolvedValue(false);
    await expect(
      createPassageFromVerseRefs('net', 'john', [ref(3, 16)]),
    ).rejects.toThrow('Translation is not available: net');
  });

  it('rejects mixed books', async () => {
    await expect(
      createPassageFromVerseRefs('net', 'john', [
        ref(3, 16, 'john'),
        ref(1, 1, 'romans'),
      ]),
    ).rejects.toThrow('All selected verses must be from the same book.');
  });

  it('dedupes, sorts, and snapshots verse text', async () => {
    const record = await createPassageFromVerseRefs('net', 'john', [
      ref(3, 18),
      ref(3, 16),
      ref(3, 16),
      ref(3, 17),
    ]);

    expect(record.verses.map((v) => `${v.chapter}:${v.verse}`)).toEqual([
      '3:16',
      '3:17',
      '3:18',
    ]);
    expect(record.verses[0].text).toBe('Text 3:16');
    expect(record.passage.title).toBe('John 3:16–18');
  });

  it('auto-creates one section and skips divide for 1–2 verses', async () => {
    const one = await createPassageFromVerseRefs('net', 'john', [ref(3, 16)]);
    expect(one.passage.currentTaskId).toBe('name_sections');
    expect(one.sections).toHaveLength(1);
    expect(one.sectionVerses).toHaveLength(1);

    await AsyncStorage.clear();
    const two = await createPassageFromVerseRefs('net', 'john', [
      ref(3, 16),
      ref(3, 17),
    ]);
    expect(two.passage.currentTaskId).toBe('name_sections');
    expect(two.sections).toHaveLength(1);
    expect(two.sectionVerses).toHaveLength(2);
  });

  it('leaves sections empty and sets divide_sections for 3+ verses', async () => {
    const record = await createPassageFromVerseRefs('net', 'john', [
      ref(3, 16),
      ref(3, 17),
      ref(3, 18),
    ]);
    expect(record.passage.currentTaskId).toBe('divide_sections');
    expect(record.sections).toEqual([]);
    expect(record.sectionVerses).toEqual([]);
  });
});

describe('listPassages / getPassageRecord', () => {
  it('sorts by updatedAt descending', async () => {
    const older = await createPassageFromVerseRefs('net', 'john', [ref(3, 16)]);
    const newer = await createPassageFromVerseRefs('net', 'john', [ref(3, 17)]);

    // Force ordering via storage rewrite
    const raw = await AsyncStorage.getItem('@meditatio/passages');
    const records = JSON.parse(raw!) as PassageRecord[];
    const byId = new Map(records.map((r) => [r.passage.id, r]));
    byId.get(older.passage.id)!.passage.updatedAt = '2020-01-01T00:00:00.000Z';
    byId.get(newer.passage.id)!.passage.updatedAt = '2024-01-01T00:00:00.000Z';
    await AsyncStorage.setItem(
      '@meditatio/passages',
      JSON.stringify([...byId.values()]),
    );

    const listed = await listPassages();
    expect(listed.map((p) => p.id)).toEqual([newer.passage.id, older.passage.id]);
  });

  it('returns null for missing records', async () => {
    await expect(getPassageRecord('missing')).resolves.toBeNull();
  });

  it('normalizes legacy records missing sections arrays', async () => {
    const created = await createPassageFromVerseRefs('net', 'john', [
      ref(3, 16),
      ref(3, 17),
      ref(3, 18),
    ]);
    const raw = await AsyncStorage.getItem('@meditatio/passages');
    const records = JSON.parse(raw!) as Array<Partial<PassageRecord>>;
    delete records[0].sections;
    delete records[0].sectionVerses;
    await AsyncStorage.setItem('@meditatio/passages', JSON.stringify(records));

    const loaded = await getPassageRecord(created.passage.id);
    expect(loaded?.sections).toEqual([]);
    expect(loaded?.sectionVerses).toEqual([]);
  });
});

describe('savePassageSections', () => {
  it('persists sections, sectionVerses, and advances the task', async () => {
    const created = await createPassageFromVerseRefs('net', 'john', [
      ref(3, 16),
      ref(3, 17),
      ref(3, 18),
    ]);
    const ids = created.verses.map((v) => v.id);

    const saved = await savePassageSections(created.passage.id, [
      { passageVerseIds: [ids[0], ids[1]] },
      { passageVerseIds: [ids[2]] },
    ]);

    expect(saved.passage.currentTaskId).toBe('name_sections');
    expect(saved.sections).toHaveLength(2);
    expect(saved.sections[0].colorKey).toBe(0);
    expect(saved.sections[1].colorKey).toBe(1);
    expect(saved.sectionVerses).toHaveLength(3);
    expect(saved.sectionVerses.map((sv) => sv.passageVerseId)).toEqual(ids);
  });

  it('rejects unknown passage ids', async () => {
    await expect(
      savePassageSections('missing', [{ passageVerseIds: ['x'] }]),
    ).rejects.toThrow('Passage not found: missing');
  });

  it('rejects invalid drafts', async () => {
    const created = await createPassageFromVerseRefs('net', 'john', [
      ref(3, 16),
      ref(3, 17),
      ref(3, 18),
    ]);
    await expect(
      savePassageSections(created.passage.id, [
        { passageVerseIds: [created.verses[0].id] },
      ]),
    ).rejects.toThrow('Every verse in the passage must be assigned to a section.');
  });
});
