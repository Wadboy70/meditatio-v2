import {
  bibleVerseId,
  formatPassageReference,
  isContiguous,
  verseRefKey,
} from '@/lib/storage/reference';
import type { VerseSelectionRef } from '@/lib/storage/types';

function ref(
  bookId: string,
  chapter: number,
  verse: number,
): VerseSelectionRef {
  return { bookId, chapter, verse };
}

describe('verseRefKey', () => {
  it('builds a stable book:chapter:verse key', () => {
    expect(verseRefKey(ref('john', 3, 16))).toBe('john:3:16');
  });
});

describe('bibleVerseId', () => {
  it('builds a stable translation:book:chapter:verse id', () => {
    expect(bibleVerseId('net', 'john', 3, 16)).toBe('net:john:3:16');
  });
});

describe('isContiguous', () => {
  it('treats empty and single refs as contiguous', () => {
    expect(isContiguous([])).toBe(true);
    expect(isContiguous([ref('john', 3, 16)])).toBe(true);
  });

  it('accepts adjacent same-chapter verses', () => {
    expect(
      isContiguous([ref('john', 3, 16), ref('john', 3, 17), ref('john', 3, 18)]),
    ).toBe(true);
  });

  it('accepts chapter boundary starting at verse 1', () => {
    expect(isContiguous([ref('john', 3, 36), ref('john', 4, 1)])).toBe(true);
  });

  it('rejects gaps', () => {
    expect(isContiguous([ref('john', 3, 16), ref('john', 3, 18)])).toBe(false);
  });

  it('rejects multi-book selections', () => {
    expect(isContiguous([ref('john', 3, 16), ref('romans', 1, 1)])).toBe(false);
  });
});

describe('formatPassageReference', () => {
  it('returns empty string for no refs', () => {
    expect(formatPassageReference([])).toBe('');
  });

  it('formats a single verse', () => {
    expect(formatPassageReference([ref('john', 3, 16)])).toBe('John 3:16');
  });

  it('formats a same-chapter contiguous range', () => {
    expect(
      formatPassageReference([
        ref('john', 3, 16),
        ref('john', 3, 17),
        ref('john', 3, 18),
      ]),
    ).toBe('John 3:16–18');
  });

  it('formats a cross-chapter contiguous range', () => {
    expect(
      formatPassageReference([ref('john', 3, 36), ref('john', 4, 1)]),
    ).toBe('John 3:36–4:1');
  });

  it('formats sparse same-chapter selections with a count', () => {
    expect(
      formatPassageReference([ref('john', 3, 16), ref('john', 3, 18)]),
    ).toBe('John 3 · 2 verses');
  });

  it('formats sparse cross-chapter selections with a count', () => {
    expect(
      formatPassageReference([ref('john', 3, 16), ref('john', 4, 2)]),
    ).toBe('John 3–4 · 2 verses');
  });

  it('falls back to bookId when the book is unknown', () => {
    expect(formatPassageReference([ref('unknown-book', 1, 1)])).toBe(
      'unknown-book 1:1',
    );
  });
});
