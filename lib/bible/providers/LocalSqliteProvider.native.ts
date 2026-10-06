import { Asset } from 'expo-asset';
import {
  copyAsync,
  documentDirectory,
  getInfoAsync,
  makeDirectoryAsync,
} from 'expo-file-system/legacy';
import * as SQLite from 'expo-sqlite';

import { getChapterCount as getStaticChapterCount } from '../books';
import type { BibleProvider, Verse, VerseRef } from '../types';

/** Bundled translation databases — add entries as new translations are extracted. */
const TRANSLATION_ASSETS: Record<string, number> = {
  net: require('@/assets/bible/net.sqlite'),
};

const DEVICE_BIBLE_DIR = `${documentDirectory}bible/`;

type VerseRow = {
  translation_id: string;
  book_id: string;
  chapter: number;
  verse: number;
  text: string;
};

function rowToVerse(row: VerseRow): Verse {
  return {
    translationId: row.translation_id,
    bookId: row.book_id,
    chapter: row.chapter,
    verse: row.verse,
    text: row.text,
  };
}

/**
 * Opens a per-translation SQLite file from the app bundle.
 * Copies to documentDirectory/bible/{translationId}.sqlite on first use so
 * Phase B/C can swap the source without changing query code.
 */
export class LocalSqliteProvider implements BibleProvider {
  private databases = new Map<string, Promise<SQLite.SQLiteDatabase>>();

  async isAvailable(translationId: string): Promise<boolean> {
    return translationId in TRANSLATION_ASSETS;
  }

  private async openDatabase(translationId: string): Promise<SQLite.SQLiteDatabase> {
    const existing = this.databases.get(translationId);
    if (existing) {
      return existing;
    }

    const assetModule = TRANSLATION_ASSETS[translationId];
    if (!assetModule) {
      throw new Error(`No bundled database for translation: ${translationId}`);
    }

    const promise = this.prepareAndOpen(translationId, assetModule);
    this.databases.set(translationId, promise);
    return promise;
  }

  private async prepareAndOpen(
    translationId: string,
    assetModule: number,
  ): Promise<SQLite.SQLiteDatabase> {
    await makeDirectoryAsync(DEVICE_BIBLE_DIR, { intermediates: true });

    const fileName = `${translationId}.sqlite`;
    const targetPath = `${DEVICE_BIBLE_DIR}${fileName}`;
    const info = await getInfoAsync(targetPath);

    if (!info.exists) {
      const asset = Asset.fromModule(assetModule);
      await asset.downloadAsync();
      if (!asset.localUri) {
        throw new Error(`Failed to load bundled bible asset: ${translationId}`);
      }
      await copyAsync({ from: asset.localUri, to: targetPath });
    }

    return SQLite.openDatabaseAsync(fileName, {}, DEVICE_BIBLE_DIR);
  }

  async getVerse(translationId: string, ref: VerseRef): Promise<Verse | null> {
    const db = await this.openDatabase(translationId);
    const row = await db.getFirstAsync<VerseRow>(
      `SELECT translation_id, book_id, chapter, verse, text
       FROM verses
       WHERE translation_id = ? AND book_id = ? AND chapter = ? AND verse = ?`,
      [translationId, ref.bookId, ref.chapter, ref.verse],
    );
    return row ? rowToVerse(row) : null;
  }

  async getChapterVerses(
    translationId: string,
    bookId: string,
    chapter: number,
    startVerse?: number,
    endVerse?: number,
  ): Promise<Verse[]> {
    const db = await this.openDatabase(translationId);

    let sql = `SELECT translation_id, book_id, chapter, verse, text
               FROM verses
               WHERE translation_id = ? AND book_id = ? AND chapter = ?`;
    const params: (string | number)[] = [translationId, bookId, chapter];

    if (startVerse !== undefined) {
      sql += ' AND verse >= ?';
      params.push(startVerse);
    }
    if (endVerse !== undefined) {
      sql += ' AND verse <= ?';
      params.push(endVerse);
    }

    sql += ' ORDER BY verse';

    const rows = await db.getAllAsync<VerseRow>(sql, params);
    return rows.map(rowToVerse);
  }

  async getChapterCount(translationId: string, bookId: string): Promise<number> {
    const db = await this.openDatabase(translationId);
    const row = await db.getFirstAsync<{ max_chapter: number | null }>(
      `SELECT MAX(chapter) AS max_chapter
       FROM verses
       WHERE translation_id = ? AND book_id = ?`,
      [translationId, bookId],
    );
    if (row?.max_chapter) {
      return row.max_chapter;
    }
    return getStaticChapterCount(bookId);
  }
}
