import type { BibleProvider, Verse, VerseRef } from '../types';

/**
 * Web stub — expo-sqlite WASM is not wired for Metro web builds.
 * Bible text is loaded on iOS/Android only.
 */
export class LocalSqliteProvider implements BibleProvider {
  async isAvailable(_translationId: string): Promise<boolean> {
    return false;
  }

  async getVerse(_translationId: string, _ref: VerseRef): Promise<Verse | null> {
    return null;
  }

  async getChapterVerses(
    _translationId: string,
    _bookId: string,
    _chapter: number,
    _startVerse?: number,
    _endVerse?: number,
  ): Promise<Verse[]> {
    return [];
  }
}
