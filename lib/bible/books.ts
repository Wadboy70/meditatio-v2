export type Testament = 'OT' | 'NT';

export type BibleBook = {
  id: string;
  name: string;
  abbreviation: string;
  testament: Testament;
  chapterCount: number;
};

/** Canonical Protestant 66-book list with chapter counts (NET-compatible slugs). */
export const BOOKS: readonly BibleBook[] = [
  { id: 'genesis', name: 'Genesis', abbreviation: 'Gen', testament: 'OT', chapterCount: 50 },
  { id: 'exodus', name: 'Exodus', abbreviation: 'Exod', testament: 'OT', chapterCount: 40 },
  { id: 'leviticus', name: 'Leviticus', abbreviation: 'Lev', testament: 'OT', chapterCount: 27 },
  { id: 'numbers', name: 'Numbers', abbreviation: 'Num', testament: 'OT', chapterCount: 36 },
  { id: 'deuteronomy', name: 'Deuteronomy', abbreviation: 'Deut', testament: 'OT', chapterCount: 34 },
  { id: 'joshua', name: 'Joshua', abbreviation: 'Josh', testament: 'OT', chapterCount: 24 },
  { id: 'judges', name: 'Judges', abbreviation: 'Judg', testament: 'OT', chapterCount: 21 },
  { id: 'ruth', name: 'Ruth', abbreviation: 'Ruth', testament: 'OT', chapterCount: 4 },
  { id: '1-samuel', name: '1 Samuel', abbreviation: '1 Sam', testament: 'OT', chapterCount: 31 },
  { id: '2-samuel', name: '2 Samuel', abbreviation: '2 Sam', testament: 'OT', chapterCount: 24 },
  { id: '1-kings', name: '1 Kings', abbreviation: '1 Kgs', testament: 'OT', chapterCount: 22 },
  { id: '2-kings', name: '2 Kings', abbreviation: '2 Kgs', testament: 'OT', chapterCount: 25 },
  { id: '1-chronicles', name: '1 Chronicles', abbreviation: '1 Chr', testament: 'OT', chapterCount: 29 },
  { id: '2-chronicles', name: '2 Chronicles', abbreviation: '2 Chr', testament: 'OT', chapterCount: 36 },
  { id: 'ezra', name: 'Ezra', abbreviation: 'Ezra', testament: 'OT', chapterCount: 10 },
  { id: 'nehemiah', name: 'Nehemiah', abbreviation: 'Neh', testament: 'OT', chapterCount: 13 },
  { id: 'esther', name: 'Esther', abbreviation: 'Esth', testament: 'OT', chapterCount: 10 },
  { id: 'job', name: 'Job', abbreviation: 'Job', testament: 'OT', chapterCount: 42 },
  { id: 'psalms', name: 'Psalms', abbreviation: 'Ps', testament: 'OT', chapterCount: 150 },
  { id: 'proverbs', name: 'Proverbs', abbreviation: 'Prov', testament: 'OT', chapterCount: 31 },
  { id: 'ecclesiastes', name: 'Ecclesiastes', abbreviation: 'Eccl', testament: 'OT', chapterCount: 12 },
  { id: 'song-of-solomon', name: 'Song of Solomon', abbreviation: 'Song', testament: 'OT', chapterCount: 8 },
  { id: 'isaiah', name: 'Isaiah', abbreviation: 'Isa', testament: 'OT', chapterCount: 66 },
  { id: 'jeremiah', name: 'Jeremiah', abbreviation: 'Jer', testament: 'OT', chapterCount: 52 },
  { id: 'lamentations', name: 'Lamentations', abbreviation: 'Lam', testament: 'OT', chapterCount: 5 },
  { id: 'ezekiel', name: 'Ezekiel', abbreviation: 'Ezek', testament: 'OT', chapterCount: 48 },
  { id: 'daniel', name: 'Daniel', abbreviation: 'Dan', testament: 'OT', chapterCount: 12 },
  { id: 'hosea', name: 'Hosea', abbreviation: 'Hos', testament: 'OT', chapterCount: 14 },
  { id: 'joel', name: 'Joel', abbreviation: 'Joel', testament: 'OT', chapterCount: 3 },
  { id: 'amos', name: 'Amos', abbreviation: 'Amos', testament: 'OT', chapterCount: 9 },
  { id: 'obadiah', name: 'Obadiah', abbreviation: 'Obad', testament: 'OT', chapterCount: 1 },
  { id: 'jonah', name: 'Jonah', abbreviation: 'Jonah', testament: 'OT', chapterCount: 4 },
  { id: 'micah', name: 'Micah', abbreviation: 'Mic', testament: 'OT', chapterCount: 7 },
  { id: 'nahum', name: 'Nahum', abbreviation: 'Nah', testament: 'OT', chapterCount: 3 },
  { id: 'habakkuk', name: 'Habakkuk', abbreviation: 'Hab', testament: 'OT', chapterCount: 3 },
  { id: 'zephaniah', name: 'Zephaniah', abbreviation: 'Zeph', testament: 'OT', chapterCount: 3 },
  { id: 'haggai', name: 'Haggai', abbreviation: 'Hag', testament: 'OT', chapterCount: 2 },
  { id: 'zechariah', name: 'Zechariah', abbreviation: 'Zech', testament: 'OT', chapterCount: 14 },
  { id: 'malachi', name: 'Malachi', abbreviation: 'Mal', testament: 'OT', chapterCount: 4 },
  { id: 'matthew', name: 'Matthew', abbreviation: 'Matt', testament: 'NT', chapterCount: 28 },
  { id: 'mark', name: 'Mark', abbreviation: 'Mark', testament: 'NT', chapterCount: 16 },
  { id: 'luke', name: 'Luke', abbreviation: 'Luke', testament: 'NT', chapterCount: 24 },
  { id: 'john', name: 'John', abbreviation: 'John', testament: 'NT', chapterCount: 21 },
  { id: 'acts', name: 'Acts', abbreviation: 'Acts', testament: 'NT', chapterCount: 28 },
  { id: 'romans', name: 'Romans', abbreviation: 'Rom', testament: 'NT', chapterCount: 16 },
  { id: '1-corinthians', name: '1 Corinthians', abbreviation: '1 Cor', testament: 'NT', chapterCount: 16 },
  { id: '2-corinthians', name: '2 Corinthians', abbreviation: '2 Cor', testament: 'NT', chapterCount: 13 },
  { id: 'galatians', name: 'Galatians', abbreviation: 'Gal', testament: 'NT', chapterCount: 6 },
  { id: 'ephesians', name: 'Ephesians', abbreviation: 'Eph', testament: 'NT', chapterCount: 6 },
  { id: 'philippians', name: 'Philippians', abbreviation: 'Phil', testament: 'NT', chapterCount: 4 },
  { id: 'colossians', name: 'Colossians', abbreviation: 'Col', testament: 'NT', chapterCount: 4 },
  { id: '1-thessalonians', name: '1 Thessalonians', abbreviation: '1 Thess', testament: 'NT', chapterCount: 5 },
  { id: '2-thessalonians', name: '2 Thessalonians', abbreviation: '2 Thess', testament: 'NT', chapterCount: 3 },
  { id: '1-timothy', name: '1 Timothy', abbreviation: '1 Tim', testament: 'NT', chapterCount: 6 },
  { id: '2-timothy', name: '2 Timothy', abbreviation: '2 Tim', testament: 'NT', chapterCount: 4 },
  { id: 'titus', name: 'Titus', abbreviation: 'Titus', testament: 'NT', chapterCount: 3 },
  { id: 'philemon', name: 'Philemon', abbreviation: 'Phlm', testament: 'NT', chapterCount: 1 },
  { id: 'hebrews', name: 'Hebrews', abbreviation: 'Heb', testament: 'NT', chapterCount: 13 },
  { id: 'james', name: 'James', abbreviation: 'Jas', testament: 'NT', chapterCount: 5 },
  { id: '1-peter', name: '1 Peter', abbreviation: '1 Pet', testament: 'NT', chapterCount: 5 },
  { id: '2-peter', name: '2 Peter', abbreviation: '2 Pet', testament: 'NT', chapterCount: 3 },
  { id: '1-john', name: '1 John', abbreviation: '1 John', testament: 'NT', chapterCount: 5 },
  { id: '2-john', name: '2 John', abbreviation: '2 John', testament: 'NT', chapterCount: 1 },
  { id: '3-john', name: '3 John', abbreviation: '3 John', testament: 'NT', chapterCount: 1 },
  { id: 'jude', name: 'Jude', abbreviation: 'Jude', testament: 'NT', chapterCount: 1 },
  { id: 'revelation', name: 'Revelation', abbreviation: 'Rev', testament: 'NT', chapterCount: 22 },
] as const;

const BOOK_BY_ID: Record<string, BibleBook> = Object.fromEntries(BOOKS.map((book) => [book.id, book]));

export function getBook(bookId: string): BibleBook | undefined {
  return BOOK_BY_ID[bookId];
}

export function getChapterCount(bookId: string): number {
  return BOOK_BY_ID[bookId]?.chapterCount ?? 0;
}

export function getBooksByTestament(testament: Testament): BibleBook[] {
  return BOOKS.filter((book) => book.testament === testament);
}

export type ChapterLocation = {
  bookId: string;
  chapter: number;
};

/** Next chapter in canonical order, or null at end of Revelation. */
export function getNextChapter(bookId: string, chapter: number): ChapterLocation | null {
  const book = getBook(bookId);
  if (!book) return null;

  if (chapter < book.chapterCount) {
    return { bookId, chapter: chapter + 1 };
  }

  const index = BOOKS.findIndex((entry) => entry.id === bookId);
  if (index < 0 || index >= BOOKS.length - 1) return null;

  const nextBook = BOOKS[index + 1];
  return { bookId: nextBook.id, chapter: 1 };
}

/** Previous chapter in canonical order, or null at Genesis 1. */
export function getPreviousChapter(bookId: string, chapter: number): ChapterLocation | null {
  if (chapter > 1) {
    return { bookId, chapter: chapter - 1 };
  }

  const index = BOOKS.findIndex((entry) => entry.id === bookId);
  if (index <= 0) return null;

  const previousBook = BOOKS[index - 1];
  return { bookId: previousBook.id, chapter: previousBook.chapterCount };
}
