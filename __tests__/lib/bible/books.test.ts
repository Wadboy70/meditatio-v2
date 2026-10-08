import {
  BOOKS,
  getBook,
  getBooksByTestament,
  getChapterCount,
  getNextChapter,
  getPreviousChapter,
} from '@/lib/bible/books';

describe('BOOKS catalog', () => {
  it('contains 66 books', () => {
    expect(BOOKS).toHaveLength(66);
  });

  it('splits into OT and NT', () => {
    const ot = getBooksByTestament('OT');
    const nt = getBooksByTestament('NT');
    expect(ot).toHaveLength(39);
    expect(nt).toHaveLength(27);
    expect(ot.every((book) => book.testament === 'OT')).toBe(true);
    expect(nt.every((book) => book.testament === 'NT')).toBe(true);
  });
});

describe('getBook / getChapterCount', () => {
  it('returns known books and chapter counts', () => {
    expect(getBook('genesis')?.name).toBe('Genesis');
    expect(getChapterCount('psalms')).toBe(150);
    expect(getChapterCount('jude')).toBe(1);
  });

  it('returns undefined / 0 for unknown ids', () => {
    expect(getBook('not-a-book')).toBeUndefined();
    expect(getChapterCount('not-a-book')).toBe(0);
  });
});

describe('getNextChapter', () => {
  it('advances within a book', () => {
    expect(getNextChapter('genesis', 1)).toEqual({ bookId: 'genesis', chapter: 2 });
  });

  it('crosses from Malachi to Matthew', () => {
    expect(getNextChapter('malachi', 4)).toEqual({ bookId: 'matthew', chapter: 1 });
  });

  it('returns null at the end of Revelation', () => {
    expect(getNextChapter('revelation', 22)).toBeNull();
  });
});

describe('getPreviousChapter', () => {
  it('moves backward within a book', () => {
    expect(getPreviousChapter('genesis', 2)).toEqual({
      bookId: 'genesis',
      chapter: 1,
    });
  });

  it('crosses from Matthew to Malachi', () => {
    expect(getPreviousChapter('matthew', 1)).toEqual({
      bookId: 'malachi',
      chapter: 4,
    });
  });

  it('returns null at Genesis 1', () => {
    expect(getPreviousChapter('genesis', 1)).toBeNull();
  });
});
