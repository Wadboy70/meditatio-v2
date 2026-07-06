export type Verse = {
  translationId: string;
  bookId: string;
  chapter: number;
  verse: number;
  text: string;
};

export type VerseRef = {
  bookId: string;
  chapter: number;
  verse: number;
};

export type BibleProvider = {
  isAvailable(translationId: string): Promise<boolean>;
  getVerse(translationId: string, ref: VerseRef): Promise<Verse | null>;
  getChapterVerses(
    translationId: string,
    bookId: string,
    chapter: number,
    startVerse?: number,
    endVerse?: number,
  ): Promise<Verse[]>;
};
