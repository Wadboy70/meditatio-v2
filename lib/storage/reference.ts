import { getBook } from '@/lib/bible/books';
import type { VerseSelectionRef } from '@/lib/storage/types';

function compareRefs(a: VerseSelectionRef, b: VerseSelectionRef): number {
  if (a.bookId !== b.bookId) {
    return a.bookId.localeCompare(b.bookId);
  }
  if (a.chapter !== b.chapter) {
    return a.chapter - b.chapter;
  }
  return a.verse - b.verse;
}

function isContiguous(sorted: VerseSelectionRef[]): boolean {
  if (sorted.length <= 1) return true;

  for (let i = 1; i < sorted.length; i += 1) {
    const prev = sorted[i - 1];
    const curr = sorted[i];
    if (prev.bookId !== curr.bookId) return false;

    if (curr.chapter === prev.chapter && curr.verse === prev.verse + 1) {
      continue;
    }

    // Cross-chapter contiguous: last verse of chapter N then verse 1 of N+1
    // (we don't know chapter length here; treat same-book chapter+1 verse 1 after any verse as contiguous only if chapters differ by 1 and curr.verse === 1)
    if (curr.chapter === prev.chapter + 1 && curr.verse === 1) {
      continue;
    }

    return false;
  }

  return true;
}

/** Format a human-readable reference from selected verses. */
export function formatPassageReference(refs: VerseSelectionRef[]): string {
  if (refs.length === 0) return '';

  const sorted = [...refs].sort(compareRefs);
  const book = getBook(sorted[0].bookId);
  const bookName = book?.name ?? sorted[0].bookId;
  const first = sorted[0];
  const last = sorted[sorted.length - 1];

  if (sorted.length === 1) {
    return `${bookName} ${first.chapter}:${first.verse}`;
  }

  if (isContiguous(sorted)) {
    if (first.chapter === last.chapter) {
      return `${bookName} ${first.chapter}:${first.verse}–${last.verse}`;
    }
    return `${bookName} ${first.chapter}:${first.verse}–${last.chapter}:${last.verse}`;
  }

  if (first.chapter === last.chapter) {
    return `${bookName} ${first.chapter} · ${sorted.length} verses`;
  }

  return `${bookName} ${first.chapter}–${last.chapter} · ${sorted.length} verses`;
}

export function verseRefKey(ref: VerseSelectionRef): string {
  return `${ref.bookId}:${ref.chapter}:${ref.verse}`;
}

export function bibleVerseId(
  translationId: string,
  bookId: string,
  chapter: number,
  verse: number,
): string {
  return `${translationId}:${bookId}:${chapter}:${verse}`;
}
