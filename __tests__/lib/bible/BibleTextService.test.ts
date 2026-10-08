import { BibleTextService } from '@/lib/bible/BibleTextService';
import type { BibleProvider, Verse } from '@/lib/bible/types';

function makeVerse(overrides: Partial<Verse> = {}): Verse {
  return {
    translationId: 'net',
    bookId: 'john',
    chapter: 3,
    verse: 16,
    text: 'For this is the way God loved the world...',
    ...overrides,
  };
}

describe('BibleTextService', () => {
  const verse = makeVerse();
  const chapterVerses = [makeVerse({ verse: 16 }), makeVerse({ verse: 17, text: '...' })];

  const provider: jest.Mocked<BibleProvider> = {
    isAvailable: jest.fn(),
    getVerse: jest.fn(),
    getChapterVerses: jest.fn(),
    getChapterCount: jest.fn(),
  };

  const service = new BibleTextService(provider);

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('forwards isAvailable', async () => {
    provider.isAvailable.mockResolvedValue(true);
    await expect(service.isAvailable('net')).resolves.toBe(true);
    expect(provider.isAvailable).toHaveBeenCalledWith('net');
  });

  it('forwards getVerse', async () => {
    const ref = { bookId: 'john', chapter: 3, verse: 16 };
    provider.getVerse.mockResolvedValue(verse);
    await expect(service.getVerse('net', ref)).resolves.toEqual(verse);
    expect(provider.getVerse).toHaveBeenCalledWith('net', ref);
  });

  it('forwards getChapterVerses with optional bounds', async () => {
    provider.getChapterVerses.mockResolvedValue(chapterVerses);
    await expect(service.getChapterVerses('net', 'john', 3, 16, 17)).resolves.toEqual(
      chapterVerses,
    );
    expect(provider.getChapterVerses).toHaveBeenCalledWith('net', 'john', 3, 16, 17);
  });

  it('getPassage delegates to getChapterVerses with start/end', async () => {
    provider.getChapterVerses.mockResolvedValue(chapterVerses);
    await expect(service.getPassage('net', 'john', 3, 16, 17)).resolves.toEqual(
      chapterVerses,
    );
    expect(provider.getChapterVerses).toHaveBeenCalledWith('net', 'john', 3, 16, 17);
  });

  it('forwards getChapterCount', async () => {
    provider.getChapterCount.mockResolvedValue(21);
    await expect(service.getChapterCount('net', 'john')).resolves.toBe(21);
    expect(provider.getChapterCount).toHaveBeenCalledWith('net', 'john');
  });
});
