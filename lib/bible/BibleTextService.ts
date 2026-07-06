import { LocalSqliteProvider } from './providers/LocalSqliteProvider';
import type { BibleProvider, Verse, VerseRef } from './types';

export class BibleTextService {
  constructor(private readonly provider: BibleProvider = new LocalSqliteProvider()) {}

  isAvailable(translationId: string): Promise<boolean> {
    return this.provider.isAvailable(translationId);
  }

  getVerse(translationId: string, ref: VerseRef): Promise<Verse | null> {
    return this.provider.getVerse(translationId, ref);
  }

  getChapterVerses(
    translationId: string,
    bookId: string,
    chapter: number,
    startVerse?: number,
    endVerse?: number,
  ): Promise<Verse[]> {
    return this.provider.getChapterVerses(translationId, bookId, chapter, startVerse, endVerse);
  }

  getPassage(
    translationId: string,
    bookId: string,
    chapter: number,
    startVerse: number,
    endVerse: number,
  ): Promise<Verse[]> {
    return this.provider.getChapterVerses(translationId, bookId, chapter, startVerse, endVerse);
  }
}

/** Shared singleton for app use. */
export const bibleTextService = new BibleTextService();

export type { BibleProvider, Verse, VerseRef } from './types';
export { LocalSqliteProvider } from './providers/LocalSqliteProvider';
