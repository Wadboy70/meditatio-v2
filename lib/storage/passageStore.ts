import AsyncStorage from '@react-native-async-storage/async-storage';

import { bibleTextService } from '@/lib/bible/BibleTextService';
import { bibleVerseId, formatPassageReference, verseRefKey } from '@/lib/storage/reference';
import type { Passage, PassageRecord, PassageVerse, VerseSelectionRef } from '@/lib/storage/types';

const STORAGE_KEY = '@meditatio/passages';

function createId(prefix: string): string {
  return `${prefix}_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 8)}`;
}

async function readAll(): Promise<PassageRecord[]> {
  const raw = await AsyncStorage.getItem(STORAGE_KEY);
  if (!raw) return [];
  try {
    const parsed = JSON.parse(raw) as PassageRecord[];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

async function writeAll(records: PassageRecord[]): Promise<void> {
  await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(records));
}

export async function listPassages(): Promise<Passage[]> {
  const records = await readAll();
  return records
    .map((record) => record.passage)
    .sort((a, b) => b.updatedAt.localeCompare(a.updatedAt));
}

export async function getPassageRecord(passageId: string): Promise<PassageRecord | null> {
  const records = await readAll();
  return records.find((record) => record.passage.id === passageId) ?? null;
}

export async function createPassageFromVerseRefs(
  translationId: string,
  bookId: string,
  refs: VerseSelectionRef[],
): Promise<PassageRecord> {
  if (refs.length === 0) {
    throw new Error('Select at least one verse to create a passage.');
  }

  const available = await bibleTextService.isAvailable(translationId);
  if (!available) {
    throw new Error(`Translation is not available: ${translationId}`);
  }

  const unique = new Map<string, VerseSelectionRef>();
  for (const ref of refs) {
    if (ref.bookId !== bookId) {
      throw new Error('All selected verses must be from the same book.');
    }
    unique.set(verseRefKey(ref), ref);
  }

  const orderedRefs = [...unique.values()].sort((a, b) => {
    if (a.chapter !== b.chapter) return a.chapter - b.chapter;
    return a.verse - b.verse;
  });

  const chaptersNeeded = [...new Set(orderedRefs.map((ref) => ref.chapter))];
  const verseByKey = new Map<string, { chapter: number; verse: number; text: string }>();

  for (const chapter of chaptersNeeded) {
    const verses = await bibleTextService.getChapterVerses(translationId, bookId, chapter);
    for (const verse of verses) {
      verseByKey.set(verseRefKey({ bookId, chapter: verse.chapter, verse: verse.verse }), {
        chapter: verse.chapter,
        verse: verse.verse,
        text: verse.text,
      });
    }
  }

  const now = new Date().toISOString();
  const passageId = createId('passage');
  const first = orderedRefs[0];
  const last = orderedRefs[orderedRefs.length - 1];
  const title = formatPassageReference(orderedRefs);

  const passage: Passage = {
    id: passageId,
    translationId,
    bookId,
    startChapter: first.chapter,
    startVerse: first.verse,
    endChapter: last.chapter,
    endVerse: last.verse,
    title,
    status: 'in_progress',
    currentTaskId: 'divide_sections',
    createdAt: now,
    updatedAt: now,
  };

  const passageVerses: PassageVerse[] = orderedRefs.map((ref, index) => {
    const verse = verseByKey.get(verseRefKey(ref));
    if (!verse) {
      throw new Error(`Verse not found: ${bookId} ${ref.chapter}:${ref.verse}`);
    }

    return {
      id: createId('pv'),
      passageId,
      bibleVerseId: bibleVerseId(translationId, bookId, verse.chapter, verse.verse),
      order: index,
      chapter: verse.chapter,
      verse: verse.verse,
      text: verse.text,
    };
  });

  const record: PassageRecord = { passage, verses: passageVerses };
  const existing = await readAll();
  await writeAll([record, ...existing]);
  return record;
}
