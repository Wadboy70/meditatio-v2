import AsyncStorage from '@react-native-async-storage/async-storage';

import { sectionColors } from '@/constants/tokens';
import { bibleTextService } from '@/lib/bible/BibleTextService';
import { bibleVerseId, formatPassageReference, verseRefKey } from '@/lib/storage/reference';
import {
  allSectionsNamed,
  assertNonEmptySectionTitle,
} from '@/lib/storage/sectionNaming';
import {
  advanceRead,
  ensureAllReadProgress,
  getReadProgress,
  orderedSections,
  previousSectionReadLanding,
  readBackKind,
  resolveActiveReadSectionId,
  retreatRead,
  sectionVerseCount,
} from '@/lib/storage/sectionReading';
import type {
  Passage,
  PassageRecord,
  PassageVerse,
  Section,
  SectionDraft,
  SectionReadProgress,
  SectionVerse,
  VerseSelectionRef,
} from '@/lib/storage/types';

const STORAGE_KEY = '@meditatio/passages';

function createId(prefix: string): string {
  return `${prefix}_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 8)}`;
}

function normalizeRecord(raw: PassageRecord): PassageRecord {
  const sections = Array.isArray(raw.sections) ? raw.sections : [];
  const sectionVerses = Array.isArray(raw.sectionVerses) ? raw.sectionVerses : [];
  const readProgress = ensureAllReadProgress(
    sections,
    Array.isArray(raw.readProgress) ? raw.readProgress : [],
  );
  return {
    ...raw,
    sections,
    sectionVerses,
    readProgress,
    activeReadSectionId: raw.activeReadSectionId,
  };
}

function replaceReadProgress(
  progress: SectionReadProgress[],
  nextEntry: SectionReadProgress,
): SectionReadProgress[] {
  const others = progress.filter((entry) => entry.sectionId !== nextEntry.sectionId);
  return [...others, nextEntry];
}

async function readAll(): Promise<PassageRecord[]> {
  const raw = await AsyncStorage.getItem(STORAGE_KEY);
  if (!raw) return [];
  try {
    const parsed = JSON.parse(raw) as PassageRecord[];
    if (!Array.isArray(parsed)) return [];
    return parsed.map(normalizeRecord);
  } catch {
    return [];
  }
}

async function writeAll(records: PassageRecord[]): Promise<void> {
  await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(records));
}

function buildSectionForVerses(
  passageId: string,
  verses: PassageVerse[],
  order: number,
  colorKey: number,
  now: string,
): { section: Section; sectionVerses: SectionVerse[] } {
  const sectionId = createId('section');
  const section: Section = {
    id: sectionId,
    passageId,
    title: '',
    order,
    colorKey,
    status: 'in_progress',
    createdAt: now,
    updatedAt: now,
  };
  const sectionVerses: SectionVerse[] = verses.map((verse, index) => ({
    id: createId('sv'),
    sectionId,
    passageVerseId: verse.id,
    order: index,
  }));
  return { section, sectionVerses };
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
  const skipDivide = orderedRefs.length <= 2;

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
    currentTaskId: skipDivide ? 'name_sections' : 'divide_sections',
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

  let sections: Section[] = [];
  let sectionVerses: SectionVerse[] = [];

  if (skipDivide) {
    const built = buildSectionForVerses(passageId, passageVerses, 0, 0, now);
    sections = [built.section];
    sectionVerses = built.sectionVerses;
  }

  const record: PassageRecord = {
    passage,
    verses: passageVerses,
    sections,
    sectionVerses,
    readProgress: ensureAllReadProgress(sections, []),
  };
  const existing = await readAll();
  await writeAll([record, ...existing]);
  return record;
}

export async function savePassageSections(
  passageId: string,
  drafts: SectionDraft[],
): Promise<PassageRecord> {
  if (drafts.length === 0) {
    throw new Error('Add at least one section before continuing.');
  }

  const records = await readAll();
  const index = records.findIndex((record) => record.passage.id === passageId);
  if (index < 0) {
    throw new Error(`Passage not found: ${passageId}`);
  }

  const existing = records[index];
  const verseById = new Map(existing.verses.map((verse) => [verse.id, verse]));
  const assigned = new Set<string>();

  for (const draft of drafts) {
    if (draft.passageVerseIds.length === 0) {
      throw new Error('Each section must contain at least one verse.');
    }

    const orders: number[] = [];
    for (const passageVerseId of draft.passageVerseIds) {
      const verse = verseById.get(passageVerseId);
      if (!verse) {
        throw new Error(`Passage verse not found: ${passageVerseId}`);
      }
      if (assigned.has(passageVerseId)) {
        throw new Error('A verse can only belong to one section.');
      }
      assigned.add(passageVerseId);
      orders.push(verse.order);
    }

    const sortedOrders = [...orders].sort((a, b) => a - b);
    for (let i = 1; i < sortedOrders.length; i += 1) {
      if (sortedOrders[i] !== sortedOrders[i - 1] + 1) {
        throw new Error('Section verses must be contiguous in the passage.');
      }
    }
  }

  if (assigned.size !== existing.verses.length) {
    throw new Error('Every verse in the passage must be assigned to a section.');
  }

  const now = new Date().toISOString();
  const sections: Section[] = [];
  const sectionVerses: SectionVerse[] = [];

  drafts.forEach((draft, draftIndex) => {
    const orderedVerses = [...draft.passageVerseIds]
      .map((id) => verseById.get(id)!)
      .sort((a, b) => a.order - b.order);
    const built = buildSectionForVerses(
      passageId,
      orderedVerses,
      draftIndex,
      draftIndex % sectionColors.length,
      now,
    );
    sections.push(built.section);
    sectionVerses.push(...built.sectionVerses);
  });

  const updated: PassageRecord = {
    ...existing,
    passage: {
      ...existing.passage,
      currentTaskId: 'name_sections',
      updatedAt: now,
    },
    sections,
    sectionVerses,
    readProgress: ensureAllReadProgress(sections, []),
    activeReadSectionId: undefined,
  };

  const next = [...records];
  next[index] = updated;
  await writeAll(next);
  return updated;
}

export async function saveSectionTitle(
  passageId: string,
  sectionId: string,
  title: string,
): Promise<PassageRecord> {
  const trimmed = assertNonEmptySectionTitle(title);

  const records = await readAll();
  const index = records.findIndex((record) => record.passage.id === passageId);
  if (index < 0) {
    throw new Error(`Passage not found: ${passageId}`);
  }

  const existing = records[index];
  if (existing.passage.currentTaskId !== 'name_sections') {
    throw new Error('This passage is not ready for naming sections.');
  }

  const sectionIndex = existing.sections.findIndex((section) => section.id === sectionId);
  if (sectionIndex < 0) {
    throw new Error(`Section not found: ${sectionId}`);
  }

  const now = new Date().toISOString();
  const sections = existing.sections.map((section, i) =>
    i === sectionIndex
      ? { ...section, title: trimmed, updatedAt: now }
      : section,
  );

  const updated: PassageRecord = {
    ...existing,
    passage: {
      ...existing.passage,
      updatedAt: now,
    },
    sections,
  };

  const next = [...records];
  next[index] = updated;
  await writeAll(next);
  return updated;
}

export async function completeNameSections(passageId: string): Promise<PassageRecord> {
  const records = await readAll();
  const index = records.findIndex((record) => record.passage.id === passageId);
  if (index < 0) {
    throw new Error(`Passage not found: ${passageId}`);
  }

  const existing = records[index];
  if (existing.passage.currentTaskId !== 'name_sections') {
    throw new Error('This passage is not ready for naming sections.');
  }
  if (existing.sections.length === 0) {
    throw new Error('This passage has no sections to name.');
  }
  if (!allSectionsNamed(existing.sections)) {
    throw new Error('Name every section before continuing.');
  }

  const now = new Date().toISOString();
  const readProgress = ensureAllReadProgress(existing.sections, []);
  const firstSectionId = orderedSections(existing.sections)[0]?.id;
  const updated: PassageRecord = {
    ...existing,
    passage: {
      ...existing.passage,
      currentTaskId: 'read_section',
      updatedAt: now,
    },
    readProgress,
    activeReadSectionId: firstSectionId,
  };

  const next = [...records];
  next[index] = updated;
  await writeAll(next);
  return updated;
}

async function loadMutableRecord(passageId: string): Promise<{
  records: PassageRecord[];
  index: number;
  existing: PassageRecord;
}> {
  const records = await readAll();
  const index = records.findIndex((record) => record.passage.id === passageId);
  if (index < 0) {
    throw new Error(`Passage not found: ${passageId}`);
  }
  return { records, index, existing: records[index] };
}

function assertReadSectionTask(record: PassageRecord): void {
  if (record.passage.currentTaskId !== 'read_section') {
    throw new Error('This passage is not ready for reading sections.');
  }
}

export async function advanceSectionRead(
  passageId: string,
  sectionId: string,
): Promise<PassageRecord> {
  const { records, index, existing } = await loadMutableRecord(passageId);
  assertReadSectionTask(existing);

  const verseCount = sectionVerseCount(existing, sectionId);
  if (verseCount <= 0) {
    throw new Error('Section has no verses to read.');
  }
  if (!existing.sections.some((section) => section.id === sectionId)) {
    throw new Error(`Section not found: ${sectionId}`);
  }

  const progress = ensureAllReadProgress(existing.sections, existing.readProgress);
  const current = getReadProgress(progress, sectionId);
  const result = advanceRead(current, verseCount);
  const now = new Date().toISOString();
  const readProgress = replaceReadProgress(progress, result.progress);

  const updated: PassageRecord =
    result.type === 'section_complete'
      ? {
          ...existing,
          passage: {
            ...existing.passage,
            currentTaskId: 'word_recall',
            updatedAt: now,
          },
          readProgress,
          activeReadSectionId: sectionId,
        }
      : {
          ...existing,
          passage: {
            ...existing.passage,
            updatedAt: now,
          },
          readProgress,
          activeReadSectionId: sectionId,
        };

  const next = [...records];
  next[index] = updated;
  await writeAll(next);
  return updated;
}

export async function retreatSectionRead(
  passageId: string,
  sectionId: string,
): Promise<PassageRecord> {
  const { records, index, existing } = await loadMutableRecord(passageId);
  assertReadSectionTask(existing);

  const ordered = orderedSections(existing.sections);
  const sectionIndex = ordered.findIndex((section) => section.id === sectionId);
  if (sectionIndex < 0) {
    throw new Error(`Section not found: ${sectionId}`);
  }

  const verseCount = sectionVerseCount(existing, sectionId);
  if (verseCount <= 0) {
    throw new Error('Section has no verses to read.');
  }

  const progress = ensureAllReadProgress(existing.sections, existing.readProgress);
  const current = getReadProgress(progress, sectionId);
  const kind = readBackKind(current, sectionIndex);
  if (kind !== 'previous_verse') {
    throw new Error('Cannot retreat verse from the start of this section.');
  }

  const nextProgress = retreatRead(current, verseCount);
  const now = new Date().toISOString();
  const updated: PassageRecord = {
    ...existing,
    passage: {
      ...existing.passage,
      updatedAt: now,
    },
    readProgress: replaceReadProgress(progress, nextProgress),
    activeReadSectionId: sectionId,
  };

  const next = [...records];
  next[index] = updated;
  await writeAll(next);
  return updated;
}

export async function moveToPreviousSectionRead(
  passageId: string,
  sectionId: string,
): Promise<PassageRecord> {
  const { records, index, existing } = await loadMutableRecord(passageId);
  assertReadSectionTask(existing);

  const ordered = orderedSections(existing.sections);
  const sectionIndex = ordered.findIndex((section) => section.id === sectionId);
  if (sectionIndex < 0) {
    throw new Error(`Section not found: ${sectionId}`);
  }
  if (sectionIndex === 0) {
    throw new Error('Already at the first section.');
  }

  const progress = ensureAllReadProgress(existing.sections, existing.readProgress);
  const current = getReadProgress(progress, sectionId);
  const kind = readBackKind(current, sectionIndex);
  if (kind !== 'previous_section') {
    throw new Error('Retreat within this section before leaving it.');
  }

  const previous = ordered[sectionIndex - 1];
  const previousVerseCount = sectionVerseCount(existing, previous.id);
  const previousProgress = previousSectionReadLanding(
    getReadProgress(progress, previous.id),
    previousVerseCount,
  );

  const now = new Date().toISOString();
  const updated: PassageRecord = {
    ...existing,
    passage: {
      ...existing.passage,
      updatedAt: now,
    },
    readProgress: replaceReadProgress(progress, previousProgress),
    activeReadSectionId: previous.id,
  };

  const next = [...records];
  next[index] = updated;
  await writeAll(next);
  return updated;
}

export function getActiveReadSection(record: PassageRecord): Section | null {
  const activeId = resolveActiveReadSectionId(record);
  if (!activeId) return null;
  return record.sections.find((section) => section.id === activeId) ?? null;
}
