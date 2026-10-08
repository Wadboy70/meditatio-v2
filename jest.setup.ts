import mockAsyncStorage from '@react-native-async-storage/async-storage/jest/async-storage-mock';

jest.mock('@react-native-async-storage/async-storage', () => mockAsyncStorage);

jest.mock('@/lib/bible/providers/LocalSqliteProvider', () => ({
  LocalSqliteProvider: class LocalSqliteProvider {
    isAvailable = jest.fn(async () => false);
    getVerse = jest.fn(async () => null);
    getChapterVerses = jest.fn(async () => []);
    getChapterCount = jest.fn(async () => 0);
  },
}));
